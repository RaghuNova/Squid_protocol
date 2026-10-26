import { prisma } from '../prisma.js';
import { sseService } from './sseService.js';
import { RoundStatus, SubmissionStatus } from '@prisma/client';
import { teamRoundProgressService } from './teamRoundProgressService.js';
import { acquireGameplayWriteLock } from './gameResetLock.js';

export class Round2Service {
  /**
   * Get active Round 2 data, initial Sudoku grid, and unlocked stage data for the team.
   * If Round 2 is UPCOMING, no puzzles are exposed.
   */
  public async getRound2Data(teamId: string) {
    const roundControl = await prisma.roundControl.findUnique({ where: { id: 2 } });
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    const progress = await teamRoundProgressService.enterRound2(teamId);
    const timer = teamRoundProgressService.timer(progress, roundControl?.status);

    const isRoundUnlocked = !!progress && ['IN_PROGRESS', 'COMPLETED'].includes(progress.status);

    if (!isRoundUnlocked) {
      const firstRound = await prisma.teamRoundProgress.findUnique({ where: { teamId_round: { teamId, round: 1 } } });
      const message = !firstRound?.nextRoundEligible
        ? 'Round 2 is locked because your team has not completed or timed out of Round 1.'
        : roundControl?.status !== RoundStatus.ACTIVE
          ? 'Your team is eligible. Round 2 is waiting for tournament officials to open its access gate.'
          : progress?.status === 'TIMED_OUT'
            ? 'Your Round 2 timer expired. Round 3 eligibility is recorded.'
            : 'Round 2 is not available yet.';
      return {
        round: roundControl,
        timer,
        serverTime: new Date().toISOString(),
        currentStage: 1,
        isUnlocked: false,
        message,
        sudoku: null,
        brokenLogic: {
          puzzle: null,
          isUnlocked: false,
          isCompleted: false
        }
      };
    }

    const sudoku = await prisma.sudokuPuzzle.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        round: true,
        initialGrid: true
      }
    });

    const isSudokuCompleted = await prisma.scoreEvent.findUnique({
      where: {
        teamId_source: {
          teamId,
          source: 'ROUND2_STAGE1_SUDOKU'
        }
      }
    });

    let brokenLogic = null;
    let isBrokenLogicCompleted = false;

    if (isSudokuCompleted) {
      const bl = await prisma.brokenLogicPuzzle.findFirst({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          scenario: true,
          codeSnippet: true,
          points: true
        }
      });
      brokenLogic = bl;

      const blScore = await prisma.scoreEvent.findUnique({
        where: {
          teamId_source: {
            teamId,
            source: 'ROUND2_STAGE2_BROKEN_LOGIC'
          }
        }
      });
      isBrokenLogicCompleted = !!blScore;
    }

    return {
      round: roundControl,
      timer,
      serverTime: new Date().toISOString(),
      currentStage: team?.currentStage || (isSudokuCompleted ? 2 : 1),
      isUnlocked: true,
      sudoku: {
        ...sudoku,
        isCompleted: !!isSudokuCompleted
      },
      brokenLogic: {
        puzzle: brokenLogic,
        isUnlocked: !!isSudokuCompleted,
        isCompleted: isBrokenLogicCompleted
      }
    };
  }

  /**
   * Validate submitted Sudoku grid.
   */
  public async submitSudoku(params: {
    teamId: string;
    submittedGrid: string;
    usedHint?: boolean;
    clientIp?: string;
  }) {
    const roundControl = await prisma.roundControl.findUnique({ where: { id: 2 } });
    if (!roundControl) {
      return { success: false, error: 'ROUND_NOT_FOUND', message: 'Round 2 control not found.' };
    }

    if (roundControl.status === RoundStatus.PAUSED) {
      return {
        success: false,
        error: 'ROUND_PAUSED',
        message: 'Round 2 is currently paused by tournament officials.'
      };
    }

    if (roundControl.status !== RoundStatus.ACTIVE) {
      return {
        success: false,
        error: 'ROUND_INACTIVE',
        message: 'Round 2 is not currently active.'
      };
    }

    const existing = await prisma.scoreEvent.findUnique({
      where: {
        teamId_source: {
          teamId: params.teamId,
          source: 'ROUND2_STAGE1_SUDOKU'
        }
      }
    });

    if (existing) {
      return {
        success: true,
        alreadySubmitted: true,
        isCorrect: true,
        pointsAwarded: 0,
        message: 'Shape Sudoku has already been completed by your team.'
      };
    }

    const progress = await teamRoundProgressService.getTeamRound(params.teamId, 2);
    if (!progress || progress.status !== 'IN_PROGRESS' || !progress.deadlineAt || progress.deadlineAt <= new Date()) return { success: false, error: progress?.status === 'TIMED_OUT' ? 'ROUND_EXPIRED' : 'ROUND_INACTIVE', message: 'Your team Round 2 timer is not active.' };

    const puzzle = await prisma.sudokuPuzzle.findFirst({ where: { isActive: true } });
    if (!puzzle) {
      return { success: false, error: 'NO_PUZZLE', message: 'No active Sudoku puzzle found.' };
    }

    const normalizedSubmitted = params.submittedGrid.trim().toUpperCase();

    // Verify against authoritative solution
    const isExactMatch = normalizedSubmitted === puzzle.solutionGrid.toUpperCase();

    // Mathematically verify row, column, and 2x3 box uniqueness as an extra check
    const validSymbols = new Set(['S', 'T', 'C', 'U', 'A', 'D']);
    let isMathValid = normalizedSubmitted.length === 36;
    if (isMathValid) {
      for (let r = 0; r < 6; r++) {
        const rowSet = new Set<string>();
        const colSet = new Set<string>();
        for (let c = 0; c < 6; c++) {
          const rowChar = normalizedSubmitted[r * 6 + c];
          const colChar = normalizedSubmitted[c * 6 + r];
          if (!validSymbols.has(rowChar) || !validSymbols.has(colChar)) isMathValid = false;
          rowSet.add(rowChar);
          colSet.add(colChar);
        }
        if (rowSet.size !== 6 || colSet.size !== 6) isMathValid = false;
      }
      for (let br = 0; br < 3; br++) {
        for (let bc = 0; bc < 2; bc++) {
          const boxSet = new Set<string>();
          for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 3; c++) {
              boxSet.add(normalizedSubmitted[(br * 2 + r) * 6 + (bc * 3 + c)]);
            }
          }
          if (boxSet.size !== 6) isMathValid = false;
        }
      }
    }

    const isValid = isExactMatch && isMathValid;

    if (!isValid) {
      const recorded = await prisma.$transaction(async tx => {
        await acquireGameplayWriteLock(tx);
        const current = await tx.teamRoundProgress.findUnique({ where: { teamId_round: { teamId: params.teamId, round: 2 } } });
        if (!current || current.status !== 'IN_PROGRESS' || !current.deadlineAt || current.deadlineAt <= new Date()) return false;
        await tx.submission.create({ data: {
          teamId: params.teamId,
          round: 2,
          stage: 1,
          submittedValue: normalizedSubmitted,
          status: SubmissionStatus.INCORRECT,
          pointsAwarded: 0,
          clientIp: params.clientIp
        } });
        return true;
      });

      if (!recorded) return { success: false, error: 'ROUND_INACTIVE', message: 'Your team Round 2 timer is not active.' };

      return {
        success: false,
        isCorrect: false,
        error: 'INVALID_SUDOKU',
        message: 'That Sudoku submission is not correct. Check the grid and try again.'
      };
    }

    const basePoints = 100;
    const points = basePoints;

    try {
      const result = await prisma.$transaction(async tx => {
        await acquireGameplayWriteLock(tx);
        await tx.$queryRaw`SELECT id FROM "TeamRoundProgress" WHERE "teamId" = ${params.teamId} AND round = 2 FOR UPDATE`;
        const existingScore = await tx.scoreEvent.findUnique({ where: { teamId_source: { teamId: params.teamId, source: 'ROUND2_STAGE1_SUDOKU' } } });
        if (existingScore) {
          const team = await tx.team.findUnique({ where: { id: params.teamId } });
          return { alreadyCompleted: true, newTotalScore: team?.totalScore ?? 0 };
        }
        const current = await tx.teamRoundProgress.findUnique({ where: { teamId_round: { teamId: params.teamId, round: 2 } } });
        if (!current || current.status !== 'IN_PROGRESS' || !current.deadlineAt || current.deadlineAt <= new Date()) return { inactive: true, newTotalScore: 0 };
        await tx.submission.create({ data: { teamId: params.teamId, round: 2, stage: 1, submittedValue: normalizedSubmitted, status: SubmissionStatus.CORRECT, pointsAwarded: points, clientIp: params.clientIp } });
        await tx.scoreEvent.create({ data: { teamId: params.teamId, round: 2, stage: 1, source: 'ROUND2_STAGE1_SUDOKU', pointsDelta: points, reason: 'Round 2 Shape Sudoku solved' } });
        const team = await tx.team.update({ where: { id: params.teamId }, data: { currentRound: 2, currentStage: 2, totalScore: { increment: points } } });
        return { alreadyCompleted: false, newTotalScore: team.totalScore };
      }, { isolationLevel: 'Serializable' });
      if ('inactive' in result && result.inactive) return { success: false, error: 'ROUND_EXPIRED', message: 'Your team Round 2 timer is not active.' };
      if (!result.alreadyCompleted) sseService.broadcast('score_update', { teamId: params.teamId, pointsDelta: points, newTotalScore: result.newTotalScore, source: 'ROUND2_STAGE1_SUDOKU' });
      return { success: true, alreadySubmitted: result.alreadyCompleted, isCorrect: true, stageUnlocked: 2, pointsAwarded: result.alreadyCompleted ? 0 : points, message: result.alreadyCompleted ? 'Shape Sudoku has already been completed by your team.' : `Shape Sudoku verified! Stage 2: Broken Logic is now unlocked. (+${points} pts)`, newTotalScore: result.newTotalScore };
    } catch (error: any) {
      if (error.code === 'P2002' || error.code === 'P2034') return { success: false, error: 'SUBMISSION_CONFLICT', message: 'Your Sudoku submission is being processed. Refresh the page and check your stage.' };
      throw error;
    }
  }

  /**
   * Validate Broken Logic submission.
   */
  public async submitBrokenLogic(params: {
    teamId: string;
    submittedOutput: string;
    clientIp?: string;
  }) {
    const roundControl = await prisma.roundControl.findUnique({ where: { id: 2 } });
    if (!roundControl) {
      return { success: false, error: 'ROUND_NOT_FOUND', message: 'Round 2 control not found.' };
    }

    if (roundControl.status === RoundStatus.PAUSED) {
      return {
        success: false,
        error: 'ROUND_PAUSED',
        message: 'Round 2 is currently paused by tournament officials.'
      };
    }

    if (roundControl.status !== RoundStatus.ACTIVE) {
      return {
        success: false,
        error: 'ROUND_INACTIVE',
        message: 'Round 2 is not currently active.'
      };
    }

    const existing = await prisma.scoreEvent.findUnique({ where: { teamId_source: { teamId: params.teamId, source: 'ROUND2_STAGE2_BROKEN_LOGIC' } } });
    if (existing) return { success: true, alreadySubmitted: true, isCorrect: true, pointsAwarded: 0, message: 'Broken Logic challenge has already been solved by your team.' };

    const progress = await teamRoundProgressService.getTeamRound(params.teamId, 2);
    if (!progress || progress.status !== 'IN_PROGRESS' || !progress.deadlineAt || progress.deadlineAt <= new Date()) return { success: false, error: progress?.status === 'TIMED_OUT' ? 'ROUND_EXPIRED' : 'ROUND_INACTIVE', message: 'Your team Round 2 timer is not active.' };

    // Stage Order Enforcement: Check if Sudoku was solved first!
    const sudokuCompleted = await prisma.scoreEvent.findUnique({
      where: {
        teamId_source: {
          teamId: params.teamId,
          source: 'ROUND2_STAGE1_SUDOKU'
        }
      }
    });

    if (!sudokuCompleted) {
      return {
        success: false,
        error: 'STAGE_LOCKED',
        message: 'Stage 2 is locked. You must successfully solve Shape Sudoku first.'
      };
    }

    const puzzle = await prisma.brokenLogicPuzzle.findFirst({ where: { isActive: true } });
    if (!puzzle) {
      return { success: false, error: 'NO_PUZZLE', message: 'No active Broken Logic puzzle found.' };
    }

    const normalizedSubmitted = params.submittedOutput.trim();
    const isCorrect = normalizedSubmitted === puzzle.expectedOutput.trim();

    if (!isCorrect) {
      const recorded = await prisma.$transaction(async tx => {
        await acquireGameplayWriteLock(tx);
        const current = await tx.teamRoundProgress.findUnique({ where: { teamId_round: { teamId: params.teamId, round: 2 } } });
        if (!current || current.status !== 'IN_PROGRESS' || !current.deadlineAt || current.deadlineAt <= new Date()) return false;
        await tx.submission.create({ data: {
          teamId: params.teamId,
          round: 2,
          stage: 2,
          submittedValue: normalizedSubmitted,
          status: SubmissionStatus.INCORRECT,
          pointsAwarded: 0,
          clientIp: params.clientIp
        } });
        return true;
      });

      if (!recorded) return { success: false, error: 'ROUND_INACTIVE', message: 'Your team Round 2 timer is not active.' };

      return {
        success: false,
        isCorrect: false,
        error: 'INCORRECT_LOGIC_OUTPUT',
        message: 'The submitted output value is incorrect. Review operator precedence and conditions.'
      };
    }

    try {
      const result = await prisma.$transaction(async tx => {
        await acquireGameplayWriteLock(tx);
        await tx.$queryRaw`SELECT id FROM "TeamRoundProgress" WHERE "teamId" = ${params.teamId} AND round = 2 FOR UPDATE`;
        const existingScore = await tx.scoreEvent.findUnique({ where: { teamId_source: { teamId: params.teamId, source: 'ROUND2_STAGE2_BROKEN_LOGIC' } } });
        if (existingScore) {
          const team = await tx.team.findUnique({ where: { id: params.teamId } });
          return { alreadyCompleted: true, newTotalScore: team?.totalScore ?? 0 };
        }
        const current = await tx.teamRoundProgress.findUnique({ where: { teamId_round: { teamId: params.teamId, round: 2 } } });
        if (!current || current.status !== 'IN_PROGRESS' || !current.deadlineAt || current.deadlineAt <= new Date()) return { inactive: true, newTotalScore: 0 };
        const sudoku = await tx.scoreEvent.findUnique({ where: { teamId_source: { teamId: params.teamId, source: 'ROUND2_STAGE1_SUDOKU' } } });
        if (!sudoku) return { stageLocked: true, newTotalScore: 0 };
        await tx.submission.create({ data: { teamId: params.teamId, round: 2, stage: 2, submittedValue: normalizedSubmitted, status: SubmissionStatus.CORRECT, pointsAwarded: puzzle.points, clientIp: params.clientIp } });
        await tx.scoreEvent.create({ data: { teamId: params.teamId, round: 2, stage: 2, source: 'ROUND2_STAGE2_BROKEN_LOGIC', pointsDelta: puzzle.points, reason: 'Round 2 Broken Logic challenge solved successfully' } });
        const team = await tx.team.update({ where: { id: params.teamId }, data: { currentRound: 3, currentStage: 1, totalScore: { increment: puzzle.points } } });
        await teamRoundProgressService.completeRoundInTransaction(tx, params.teamId, 2);
        return { alreadyCompleted: false, newTotalScore: team.totalScore };
      }, { isolationLevel: 'Serializable' });
      if ('inactive' in result && result.inactive) return { success: false, error: 'ROUND_EXPIRED', message: 'Your team Round 2 timer is not active.' };
      if ('stageLocked' in result && result.stageLocked) return { success: false, error: 'STAGE_LOCKED', message: 'Stage 2 is locked. You must successfully solve Shape Sudoku first.' };
      if (!result.alreadyCompleted) sseService.broadcast('score_update', { teamId: params.teamId, pointsDelta: puzzle.points, newTotalScore: result.newTotalScore, source: 'ROUND2_STAGE2_BROKEN_LOGIC' });
      return { success: true, alreadySubmitted: result.alreadyCompleted, isCorrect: true, pointsAwarded: result.alreadyCompleted ? 0 : puzzle.points, message: result.alreadyCompleted ? 'Broken Logic challenge has already been solved by your team.' : `Protocol Breach Stage Cleared! +${puzzle.points} points awarded. Round 3 Unlocked.`, newTotalScore: result.newTotalScore };
    } catch (error: any) {
      if (error.code === 'P2002' || error.code === 'P2034') return { success: false, error: 'SUBMISSION_CONFLICT', message: 'Your answer is being processed. Refresh the page and check your stage.' };
      throw error;
    }
  }
}

export const round2Service = new Round2Service();
