import { prisma } from '../prisma.js';
import { sseService } from './sseService.js';
import { RoundStatus, SignalState, SubmissionStatus, RoundControl } from '@prisma/client';
import { teamRoundProgressService } from './teamRoundProgressService.js';
import { acquireGameplayWriteLock } from './gameResetLock.js';
import { calculateRound1Score } from './round1Scoring.js';
import { invalidateFinalizedWinnerSnapshot } from './winnerSnapshotService.js';

export function computeRoundTimer(round: RoundControl | null) {
  const now = Date.now();
  if (!round || round.status === RoundStatus.UPCOMING) {
    return {
      status: round?.status || RoundStatus.UPCOMING,
      remainingSeconds: (round?.durationMinutes || 15) * 60,
      endTime: null,
      isExpired: false,
      isPaused: false
    };
  }

  if (round.status === RoundStatus.PAUSED) {
    return {
      status: RoundStatus.PAUSED,
      remainingSeconds: round.remainingSeconds ?? ((round.durationMinutes || 15) * 60),
      endTime: null,
      isExpired: false,
      isPaused: true
    };
  }

  if (round.status === RoundStatus.ACTIVE) {
    if (!round.endTime) {
      return {
        status: RoundStatus.ACTIVE,
        remainingSeconds: (round.durationMinutes || 15) * 60,
        endTime: null,
        isExpired: false,
        isPaused: false
      };
    }

    const endMs = new Date(round.endTime).getTime();
    const diffMs = endMs - now;
    if (diffMs <= 0) {
      return {
        status: RoundStatus.ENDED,
        remainingSeconds: 0,
        endTime: round.endTime,
        isExpired: true,
        isPaused: false
      };
    }

    return {
      status: RoundStatus.ACTIVE,
      remainingSeconds: Math.ceil(diffMs / 1000),
      endTime: round.endTime,
      isExpired: false,
      isPaused: false
    };
  }

  // ENDED
  return {
    status: RoundStatus.ENDED,
    remainingSeconds: 0,
    endTime: round.endTime,
    isExpired: true,
    isPaused: false
  };
}

export class Round1Service {
  /**
   * Get active Round 1 status and ONLY the currently available question for the team.
   * Future questions are never leaked or preloaded.
   */
  public async getRound1Data(teamId?: string) {
    const roundControl = await prisma.roundControl.findUnique({
      where: { id: 1 }
    });

    const progress = teamId ? await teamRoundProgressService.enterRound1(teamId) : null;
    const timer = teamId ? teamRoundProgressService.timer(progress, roundControl?.status) : computeRoundTimer(roundControl);

    // If Round 1 is upcoming, do not return any question content
    if (!roundControl || roundControl.status !== RoundStatus.ACTIVE || (teamId && progress?.status !== 'IN_PROGRESS' && progress?.status !== 'COMPLETED')) {
      return {
        round: roundControl,
        timer,
        serverTime: new Date().toISOString(),
        currentQuestion: null,
        questionNumber: 0,
        totalQuestions: 20,
        isCompleted: progress?.status === 'COMPLETED',
        teamSubmissions: {},
        lastSubmission: null
      };
    }

    // Fetch all active questions ordered by sequence
    const allQuestions = await prisma.question.findMany({
      where: { isActive: true, round: 1 },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        orderIndex: true,
        topic: true,
        prompt: true,
        codeSnippet: true,
        options: true,
        // correctOption and explanation strictly omitted!
      }
    });

    const totalQuestions = allQuestions.length;
    let teamSubmissions: Record<string, { submittedValue: string; status: SubmissionStatus; pointsAwarded: number }> = {};
    let lastSubmission: any = null;
    let currentQuestion: any = null;
    let questionNumber = 1;
    let isCompleted = false;

    if (teamId) {
      const submissions = await prisma.submission.findMany({
        where: { teamId, round: 1 },
        orderBy: { createdAt: 'asc' }
      });

      for (const s of submissions) {
        if (s.questionId) {
          teamSubmissions[s.questionId] = {
            submittedValue: s.submittedValue,
            status: s.status,
            pointsAwarded: s.pointsAwarded
          };
        }
      }

      if (submissions.length > 0) {
        const last = submissions[submissions.length - 1];
        lastSubmission = {
          questionId: last.questionId,
          submittedValue: last.submittedValue,
          status: last.status,
          pointsAwarded: last.pointsAwarded,
          createdAt: last.createdAt.toISOString()
        };
      }

      const submittedQIds = new Set(submissions.map(s => s.questionId));
      const firstUnsubmittedIndex = allQuestions.findIndex(q => !submittedQIds.has(q.id));

      if (firstUnsubmittedIndex === -1) {
        // All questions completed!
        isCompleted = true;
        currentQuestion = null;
        questionNumber = totalQuestions;
      } else {
        currentQuestion = allQuestions[firstUnsubmittedIndex];
        questionNumber = firstUnsubmittedIndex + 1;
        isCompleted = false;
      }
    } else {
      // Without teamId (e.g. spectator preview), show question 1
      currentQuestion = allQuestions[0] || null;
      questionNumber = 1;
    }

    return {
      round: roundControl,
      timer,
      serverTime: new Date().toISOString(),
      currentQuestion,
      questionNumber,
      totalQuestions,
      isCompleted,
      teamSubmissions,
      lastSubmission
    };
  }

  /**
   * Process a Round 1 question submission with authoritative server-side validation.
   * Scoring is calculated by round1Scoring.ts from the signal and multiplier
   * held under a row lock inside the scoring transaction.
   * - Green Light + Correct: +10 (Normal), +20 (Double Points)
   * - Any other answer: -5 (Normal), -10 (Double Points)
   * - Double Points is strictly admin-controlled
   * - Questions must be submitted sequentially (one at a time)
   * - Idempotent submission: existing result returned on duplicates without re-scoring
   */
  public async submitAnswer(params: {
    teamId: string;
    questionId: string;
    selectedOption: string;
    clientIp?: string;
  }) {
    // 1. Identify Round Control & active status
    const roundControl = await prisma.roundControl.findUnique({ where: { id: 1 } });
    if (!roundControl) {
      return {
        success: false,
        error: 'ROUND_NOT_FOUND',
        message: 'Round 1 control not found.'
      };
    }

    if (roundControl.status === RoundStatus.PAUSED) {
      return {
        success: false,
        error: 'ROUND_PAUSED',
        message: 'Round 1 is currently paused by tournament officials. Submissions are temporarily suspended.'
      };
    }

    if (roundControl.status !== RoundStatus.ACTIVE) {
      return {
        success: false,
        error: 'ROUND_INACTIVE',
        message: 'Round 1 is not currently active.'
      };
    }

    // 2. Authoritative server-side deadline enforcement
    await teamRoundProgressService.reconcileTeam(params.teamId);
    const progress = await prisma.teamRoundProgress.findUnique({ where: { teamId_round: { teamId: params.teamId, round: 1 } } });
    const alreadyRecorded = await prisma.submission.findFirst({ where: { teamId: params.teamId, questionId: params.questionId } });
    if (alreadyRecorded) {
      const currentTeam = await prisma.team.findUnique({ where: { id: params.teamId } });
      return { success: true, alreadySubmitted: true, status: alreadyRecorded.status, isCorrect: alreadyRecorded.status === SubmissionStatus.CORRECT, pointsAwarded: alreadyRecorded.pointsAwarded, doublePointsSelected: alreadyRecorded.doublePointsSelected, message: 'This question has already been submitted and finalized by your team.', newTotalScore: currentTeam?.totalScore ?? 0 };
    }
    if (!progress || progress.status !== 'IN_PROGRESS' || !progress.deadlineAt || progress.deadlineAt <= new Date()) {
      return { success: false, error: progress?.status === 'TIMED_OUT' ? 'ROUND_EXPIRED' : 'ROUND_INACTIVE', message: 'Your team Round 1 timer is not active.' };
    }

    // 3. Question lookup
    const question = await prisma.question.findUnique({ where: { id: params.questionId } });
    if (!question || !question.isActive) {
      return {
        success: false,
        error: 'QUESTION_NOT_FOUND',
        message: 'Invalid or inactive question.'
      };
    }

    // 4. One-question-at-a-time enforcement:
    // Verify that this question is the team's current question in sequence
    const allQuestions = await prisma.question.findMany({
      where: { isActive: true, round: 1 },
      orderBy: { orderIndex: 'asc' },
      select: { id: true, orderIndex: true }
    });

    const pastSubmissions = await prisma.submission.findMany({
      where: { teamId: params.teamId, round: 1 },
      select: { questionId: true }
    });

    const submittedSet = new Set(pastSubmissions.map(s => s.questionId));

    // If already submitted this exact question, we will handle idempotency below.
    // But if they are trying to answer a future question before completing earlier ones:
    if (!submittedSet.has(params.questionId)) {
      const nextExpected = allQuestions.find(q => !submittedSet.has(q.id));
      if (nextExpected && nextExpected.id !== params.questionId) {
        return {
          success: false,
          error: 'OUT_OF_ORDER_SUBMISSION',
          message: `Out-of-order submission rejected. You must complete Question #${nextExpected.orderIndex} first.`
        };
      }
    }

    // 5. Validate selected option exists in question options
    const rawOptions = question.options as Array<{ id: string; text: string }>;
    const selectedNormalized = params.selectedOption.trim().toUpperCase();
    const isValidOption = Array.isArray(rawOptions) && rawOptions.some(opt => opt.id.toUpperCase() === selectedNormalized);
    if (!isValidOption) {
      return {
        success: false,
        error: 'INVALID_OPTION',
        message: `Selected option '${params.selectedOption}' is not valid for this question.`
      };
    }

    const answerIsCorrect = selectedNormalized === question.correctOption.trim().toUpperCase();

    // Atomic transaction: serialize duplicates and read signal/multiplier at the
    // point the answer is processed, not from a stale pre-transaction snapshot.
    const source = `ROUND1_Q_${question.orderIndex}`;

    try {
      const txResult = await prisma.$transaction(async (tx) => {
        await acquireGameplayWriteLock(tx);
        // Shared reset locks permit independent gameplay writes. Serialize only
        // requests for this team/question so duplicate concurrent posts see the
        // first committed submission before attempting another ledger insert.
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${params.teamId}), hashtext(${source})) IS NULL AS locked`;
        const controls = await tx.$queryRaw<Array<{
          status: RoundStatus;
          signalState: SignalState;
          doublePointsEnabled: boolean;
          endTime: Date | null;
        }>>`SELECT "status", "signalState", "doublePointsEnabled", "endTime" FROM "RoundControl" WHERE "id" = 1 FOR SHARE`;
        const currentControl = controls[0];
        if (!currentControl || currentControl.status !== RoundStatus.ACTIVE) {
          return { notActive: true as const, success: false as const, error: 'ROUND_INACTIVE', message: 'Round 1 is not currently active.' };
        }
        if (currentControl.endTime && currentControl.endTime <= new Date()) {
          return { notActive: true as const, success: false as const, error: 'ROUND_EXPIRED', message: 'The overall Round 1 deadline has passed.' };
        }
        const currentProgress = await tx.teamRoundProgress.findUnique({ where: { teamId_round: { teamId: params.teamId, round: 1 } } });
        if (!currentProgress || currentProgress.status !== 'IN_PROGRESS' || !currentProgress.deadlineAt || currentProgress.deadlineAt <= new Date()) {
          return { notActive: true as const, success: false as const, error: 'ROUND_EXPIRED', message: 'Your team Round 1 deadline has passed.' };
        }
        const existingSubmission = await tx.submission.findFirst({
          where: {
            teamId: params.teamId,
            questionId: params.questionId
          }
        });

        if (existingSubmission) {
          const currentTeam = await tx.team.findUnique({ where: { id: params.teamId } });
          return {
            alreadySubmitted: true,
            status: existingSubmission.status,
            isCorrect: existingSubmission.status === SubmissionStatus.CORRECT,
            pointsAwarded: existingSubmission.pointsAwarded,
            doublePointsSelected: existingSubmission.doublePointsSelected,
            message: 'This question has already been submitted and finalized by your team.',
            newTotalScore: currentTeam?.totalScore ?? 0
          };
        }

        const existingScore = await tx.scoreEvent.findUnique({
          where: {
            teamId_source: {
              teamId: params.teamId,
              source
            }
          }
        });

        if (existingScore) {
          const currentTeam = await tx.team.findUnique({ where: { id: params.teamId } });
          return {
            alreadySubmitted: true,
            status: existingScore.pointsDelta > 0 ? SubmissionStatus.CORRECT : SubmissionStatus.INCORRECT,
            isCorrect: existingScore.pointsDelta > 0,
            pointsAwarded: existingScore.pointsDelta,
            doublePointsSelected: false,
            message: 'This question has already been submitted and scored.',
            newTotalScore: currentTeam?.totalScore ?? 0
          };
        }

        const scoring = calculateRound1Score(
          currentControl.signalState,
          answerIsCorrect,
          currentControl.doublePointsEnabled
        );

        // Record submission
        const submission = await tx.submission.create({
          data: {
            teamId: params.teamId,
            round: 1,
            stage: 1,
            questionId: params.questionId,
            submittedValue: selectedNormalized,
            doublePointsSelected: currentControl.doublePointsEnabled,
            signalAtSubmission: currentControl.signalState,
            status: scoring.status,
            pointsAwarded: scoring.pointsAwarded,
            clientIp: params.clientIp
          }
        });

        // Record score event in ledger
        await tx.scoreEvent.create({
          data: {
            teamId: params.teamId,
            round: 1,
            stage: 1,
            source,
            pointsDelta: scoring.pointsAwarded,
            reason: `Round 1 Question #${question.orderIndex} ${scoring.status} (${currentControl.doublePointsEnabled ? 'Double' : 'Normal'}, Signal: ${currentControl.signalState})`
          }
        });

        // Update team total score
        const updatedTeam = await tx.team.update({
          where: { id: params.teamId },
          data: {
            totalScore: {
              increment: scoring.pointsAwarded
            }
          }
        });
        await invalidateFinalizedWinnerSnapshot(tx);

        const submittedQuestionIds = (await tx.submission.findMany({
          where: { teamId: params.teamId, round: 1, questionId: { not: null } },
          distinct: ['questionId'], select: { questionId: true }
        })).length;
        if (allQuestions.length > 0 && submittedQuestionIds >= allQuestions.length) {
          await teamRoundProgressService.completeRoundInTransaction(tx, params.teamId, 1);
        }

        return {
          alreadySubmitted: false,
          submissionId: submission.id,
          status: scoring.status,
          isCorrect: scoring.isCorrect,
          pointsAwarded: scoring.pointsAwarded,
          doublePointsSelected: currentControl.doublePointsEnabled,
          message: scoring.message,
          newTotalScore: updatedTeam.totalScore
        };
      });

      if ('notActive' in txResult && txResult.notActive) return txResult;

      if (!txResult.alreadySubmitted) {
        sseService.broadcast('score_update', {
          teamId: params.teamId,
          pointsDelta: txResult.pointsAwarded,
          newTotalScore: txResult.newTotalScore,
          source
        });
      }

      return {
        success: true,
        ...txResult
      };
    } catch (err: any) {
      if (err.code === 'P2002') {
        const team = await prisma.team.findUnique({ where: { id: params.teamId } });
        const existing = await prisma.submission.findFirst({
          where: {
            teamId: params.teamId,
            questionId: params.questionId
          }
        });
        return {
          success: true,
          alreadySubmitted: true,
          status: existing?.status || SubmissionStatus.INCORRECT,
          isCorrect: existing?.status === SubmissionStatus.CORRECT,
          pointsAwarded: existing?.pointsAwarded ?? 0,
          doublePointsSelected: existing?.doublePointsSelected ?? false,
          message: 'This question has already been submitted and finalized by your team.',
          newTotalScore: team?.totalScore ?? 0
        };
      }
      throw err;
    }
  }
}

export const round1Service = new Round1Service();
