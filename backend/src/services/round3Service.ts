import { prisma } from '../prisma.js';
import { scoringService } from './scoringService.js';
import { sseService } from './sseService.js';
import { computeRoundTimer } from './round1Service.js';
import { RoundStatus, SubmissionStatus } from '@prisma/client';
import { teamRoundProgressService } from './teamRoundProgressService.js';
import { getRound3TeamPin } from '../utils/round3TeamPin.js';
import bcrypt from 'bcryptjs';

export function getRound3FinishingPoints(position: number): number {
  switch (position) {
    case 1: return 200;
    case 2: return 175;
    case 3: return 150;
    case 4: return 125;
    case 5: return 100;
    case 6: return 75;
    case 7: return 50;
    case 8: return 25;
    default:
      return -25; // 9th onward: -25
  }
}

export function finalKeyMatches(expected: string, submitted: string): boolean {
  const expectedKey = expected.trim().toUpperCase();
  const normalized = submitted.trim().toUpperCase();
  const numericChecksum = expectedKey.match(/^PROTOCOL_BREACH_(\d+)$/)?.[1];
  return normalized === expectedKey || (!!numericChecksum && normalized === numericChecksum);
}

export class Round3Service {
  /**
   * Get team-specific Round 3 data.
   * Debugging challenge stays hidden until the authenticated team enters its existing account PIN.
   */
  public async getRound3Data(teamId: string) {
    const roundControl = await prisma.roundControl.findUnique({ where: { id: 3 } });
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    const timer = computeRoundTimer(roundControl);
    await teamRoundProgressService.reconcileTeam(teamId);
    const secondRound = await prisma.teamRoundProgress.findUnique({ where: { teamId_round: { teamId, round: 2 } } });
    const isRoundUnlocked = !!secondRound?.nextRoundEligible;

    if (!isRoundUnlocked) {
      return {
        round: roundControl,
        timer,
        serverTime: new Date().toISOString(),
        isUnlocked: false,
        isAccessKeyAuthorized: false,
        isCompleted: false,
        position: null,
        pointsAwarded: null,
        message: 'Round 3 — Complete or time out in Round 2 to unlock the final breach.',
        challenge: null
      };
    }

    const accessState = await prisma.accessToken.findUnique({ where: { teamId }, select: { authorizedAt: true } });
    const isAccessKeyAuthorized = !!accessState?.authorizedAt;

    const isCompleted = !!team?.finalBreachCompletedAt;

    let debugChallenge: any = null;
    // Keep challenge content server-side until the authenticated team's PIN is validated.
    if (isAccessKeyAuthorized) {
      debugChallenge = await prisma.debugChallenge.findFirst({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          description: true,
          intendedBehavior: true,
          javaCode: true,
          pythonCode: true,
          cCode: true,
          inputData: true,
          derivationRule: true,
          points: true
          // expectedFinalKey omitted for security!
        }
      });
    }

    return {
      round: roundControl,
      timer,
      serverTime: new Date().toISOString(),
      isUnlocked: true,
      isAccessKeyAuthorized,
      isCompleted,
      position: team?.finalBreachPosition ?? null,
      pointsAwarded: team?.finalBreachPoints ?? null,
      completedAt: team?.finalBreachCompletedAt?.toISOString() || null,
      challenge: debugChallenge
    };
  }

  /** Legacy URL QR workflow: validate its bearer token and return the same PIN as the new plain-text QR. */
  public async redeemPhysicalQr(code: string, clientIp?: string, requestingTeamId?: string) {
    const rawCode = code.trim().replace(/^SQUID:\/\/ACCESS\//i, '');
    if (!rawCode) return { success: false, error: 'INVALID_QR_CODE', message: 'This QR code could not be verified.' };
    const candidate = await prisma.accessToken.findUnique({ where: { tokenCode: rawCode }, select: { teamId: true } });
    const teamId = candidate?.teamId;
    if (!teamId || (requestingTeamId && requestingTeamId !== teamId)) return { success: false, error: 'INVALID_QR_CODE', message: 'This QR code could not be verified for this team. Scan your team’s printed Round 3 QR.' };
    await teamRoundProgressService.reconcileTeam(teamId);

    try {
      return await prisma.$transaction(async tx => {
        const control = await tx.roundControl.findUnique({ where: { id: 3 }, select: { status: true } });
        if (control?.status === RoundStatus.PAUSED) return { success: false, error: 'ROUND_PAUSED', message: 'Round 3 is paused by tournament officials.' };
        const token = await tx.accessToken.findUnique({ where: { tokenCode: rawCode } });
        if (!token?.teamId || token.teamId !== teamId) {
          return { success: false, error: 'INVALID_QR_CODE', message: 'This QR code could not be verified. It may be invalid or already used.' };
        }
        const round2 = await tx.teamRoundProgress.findUnique({ where: { teamId_round: { teamId, round: 2 } } });
        if (!round2?.nextRoundEligible) {
          return { success: false, error: 'ROUND_INACTIVE', message: 'This team is not eligible for Round 3 yet.' };
        }
        const team = await tx.team.findUnique({ where: { id: teamId }, select: { teamCode: true } });
        if (!team) return { success: false, error: 'INVALID_QR_CODE', message: 'This QR code could not be verified.' };
        const accessKey = getRound3TeamPin(team.teamCode);
        if (token.isRedeemed) {
          // Keep old printed URL QR cards usable, but make their displayed code
          // match the new plain-text QR and Round 3 PIN entry.
          await tx.accessToken.update({ where: { id: token.id }, data: { accessKey } });
          return { success: true, teamCode: team.teamCode, accessKey, message: 'Team PIN verified. Enter this code on your team laptop.' };
        }
        const claim = await tx.accessToken.updateMany({
          where: { id: token.id, teamId, isRedeemed: false },
          data: { isRedeemed: true, redeemedAt: new Date(), accessKey }
        });
        if (claim.count !== 1) return { success: false, error: 'INVALID_QR_CODE', message: 'This QR code could not be verified. It may be invalid or already used.' };
        await tx.submission.create({
          data: { teamId, round: 3, stage: 2, submittedValue: 'PHYSICAL_QR_REDEEMED', status: SubmissionStatus.CORRECT, pointsAwarded: 0, clientIp }
        });
        return { success: true, teamCode: team.teamCode, accessKey, message: 'Team PIN verified. Enter this code on your team laptop.' };
      }, { isolationLevel: 'Serializable' });
    } catch (err: any) {
      if (err.code === 'P2002' || err.code === 'P2034') return { success: false, error: 'INVALID_QR_CODE', message: 'This QR code could not be verified. It may be invalid or already used.' };
      throw err;
    }
  }

  /** Validate and persist laptop authorization without exposing the challenge beforehand. */
  public async authorizeAccessKey(teamId: string, accessKey: string) {
    const control = await prisma.roundControl.findUnique({ where: { id: 3 }, select: { status: true } });
    if (control?.status === RoundStatus.PAUSED) return { success: false, error: 'ROUND_PAUSED', message: 'Round 3 is paused by tournament officials.' };
    await teamRoundProgressService.reconcileTeam(teamId);
    const progress = await prisma.teamRoundProgress.findUnique({ where: { teamId_round: { teamId, round: 2 } } });
    if (!progress?.nextRoundEligible) return { success: false, error: 'ROUND_INACTIVE', message: 'Your team is not eligible for Round 3 yet.' };
    const submittedKey = accessKey.trim();
    const team = await prisma.team.findUnique({ where: { id: teamId }, include: { user: { select: { passwordHash: true } } } });
    if (!team?.user?.passwordHash) return { success: false, error: 'TEAM_ACCOUNT_NOT_FOUND', message: 'The team login credentials could not be verified.' };

    // Round 3 uses the same PIN as the authenticated team's account. Compare
    // with the stored hash; lowercase input also supports the documented
    // TEAM01#2026 spelling for accounts seeded with team01#2026.
    const isGeneratedQrPin = submittedKey.toUpperCase() === getRound3TeamPin(team.teamCode);
    const matchesPin = isGeneratedQrPin || await bcrypt.compare(submittedKey, team.user.passwordHash) ||
      await bcrypt.compare(submittedKey.toLowerCase(), team.user.passwordHash);
    if (!matchesPin) return { success: false, error: 'INVALID_ACCESS_KEY', message: 'Invalid team access key. Enter the same PIN used to sign in to this team account.' };

    const accessState = await prisma.accessToken.updateMany({ where: { teamId }, data: { authorizedAt: new Date() } });
    if (accessState.count !== 1) return { success: false, error: 'ROUND3_ACCESS_STATE_MISSING', message: 'Round 3 access state is unavailable for this team. Contact the administrator.' };
    return { success: true, isAuthorized: true, message: 'Team PIN verified. The final challenge is unlocked.' };
  }

  /**
   * Submit and validate the final debugging challenge key.
   * Awards +200 points exactly once upon correct derivation.
   */
  public async submitFinalKey(params: {
    teamId: string;
    finalKey: string;
    clientIp?: string;
  }) {
    // 1. Verify Round 3 is active
    const roundControl = await prisma.roundControl.findUnique({ where: { id: 3 } });
    if (!roundControl) {
      return { success: false, error: 'ROUND_NOT_FOUND', message: 'Round 3 control not found.' };
    }

    if (roundControl.status === RoundStatus.PAUSED) {
      return {
        success: false,
        error: 'ROUND_PAUSED',
        message: 'Round 3 is currently paused by tournament officials.'
      };
    }

    await teamRoundProgressService.reconcileTeam(params.teamId);
    const secondRound = await prisma.teamRoundProgress.findUnique({ where: { teamId_round: { teamId: params.teamId, round: 2 } } });
    if (!secondRound?.nextRoundEligible) {
      return {
        success: false,
        error: 'ROUND_INACTIVE',
        message: 'Complete or time out in Round 2 before entering Round 3.'
      };
    }

    // 2. Authoritative deadline check

    // Authorization is persisted after the authenticated team's existing PIN is verified.
    const accessState = await prisma.accessToken.findUnique({ where: { teamId: params.teamId }, select: { authorizedAt: true } });
    if (!accessState?.authorizedAt) {
      return {
        success: false,
        error: 'ACCESS_KEY_REQUIRED',
        message: 'Verify your team login PIN before submitting the debugging challenge.'
      };
    }

    // 4. Team check & idempotency check
    const team = await prisma.team.findUnique({ where: { id: params.teamId } });
    if (!team) {
      return { success: false, error: 'TEAM_NOT_FOUND', message: 'Team does not exist.' };
    }

    if (team.finalBreachCompletedAt) {
      return {
        success: true,
        alreadyCompleted: true,
        isCorrect: true,
        position: team.finalBreachPosition,
        pointsAwarded: 0,
        originalPointsAwarded: team.finalBreachPoints ?? 0,
        completedAt: team.finalBreachCompletedAt.toISOString(),
        message: `Final Breach has already been solved and registered for your team (Position #${team.finalBreachPosition || 1}).`,
        newTotalScore: team.totalScore
      };
    }

    // 5. Fetch active debug challenge
    const challenge = await prisma.debugChallenge.findFirst({
      where: { isActive: true }
    });

    if (!challenge) {
      return { success: false, error: 'NO_CHALLENGE', message: 'No active Debug Challenge configured.' };
    }

    const normalizedKey = params.finalKey.trim().toUpperCase();
    // Match the administrator-configured answer (or its exact numeric checksum).
    const isCorrect = finalKeyMatches(challenge.expectedFinalKey, params.finalKey);

    if (!isCorrect) {
      await prisma.submission.create({
        data: {
          teamId: params.teamId,
          round: 3,
          stage: 3,
          submittedValue: normalizedKey,
          status: SubmissionStatus.INCORRECT,
          pointsAwarded: 0,
          clientIp: params.clientIp
        }
      });

      return {
        success: false,
        isCorrect: false,
        error: 'INVALID_FINAL_KEY',
        message: 'Breach Key Rejected. Enter the corrected program output or its numeric checksum.'
      };
    }

    const completionTimestamp = new Date();
    const source = 'ROUND3_FINAL_KEY';

    try {
      const txResult = await prisma.$transaction(async (tx) => {
        // Concurrency-safe lock: Acquire row-level lock on RoundControl for Round 3
        await tx.$queryRaw`SELECT id FROM "RoundControl" WHERE id = 3 FOR UPDATE`;
        const lockedTimestamp = new Date();

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
            alreadyCompleted: true,
            isCorrect: true,
            position: currentTeam?.finalBreachPosition || 1,
            pointsAwarded: 0,
            originalPointsAwarded: currentTeam?.finalBreachPoints ?? existingScore.pointsDelta,
            completedAt: currentTeam?.finalBreachCompletedAt?.toISOString() || lockedTimestamp.toISOString(),
            message: `Final Breach already scored for your team (Position #${currentTeam?.finalBreachPosition || 1}).`,
            newTotalScore: currentTeam?.totalScore ?? 0
          };
        }

        // Count how many teams have successfully completed the final challenge so far
        const verifiedFinishersCount = await tx.team.count({
          where: { finalBreachCompletedAt: { not: null } }
        });
        const position = verifiedFinishersCount + 1;
        const pointsAwarded = getRound3FinishingPoints(position);

        await tx.submission.create({
          data: {
            teamId: params.teamId,
            round: 3,
            stage: 3,
            submittedValue: normalizedKey,
            status: SubmissionStatus.CORRECT,
            pointsAwarded: pointsAwarded,
            clientIp: params.clientIp
          }
        });

        const sign = pointsAwarded >= 0 ? '+' : '';
        await tx.scoreEvent.create({
          data: {
            teamId: params.teamId,
            round: 3,
            stage: 3,
            source,
            pointsDelta: pointsAwarded,
            reason: `Final Breach Debugging Challenge solved (Position #${position}: ${sign}${pointsAwarded} pts)`
          }
        });

        const updatedTeam = await tx.team.update({
          where: { id: params.teamId },
          data: {
            finalBreachCompletedAt: lockedTimestamp,
            finalBreachPosition: position,
            finalBreachPoints: pointsAwarded,
            totalScore: {
              increment: pointsAwarded
            }
          }
        });

        return {
          alreadyCompleted: false,
          isCorrect: true,
          position,
          pointsAwarded,
          completedAt: lockedTimestamp.toISOString(),
          message: `SYSTEM BREACH SUCCESSFUL! Correct Key Verified. Position #${position} achieved: ${sign}${pointsAwarded} points awarded.`,
          newTotalScore: updatedTeam.totalScore
        };
      });

      if (!txResult.alreadyCompleted) {
        sseService.broadcast('final_breach', {
          teamId: params.teamId,
          teamName: team.name,
          completedAt: txResult.completedAt,
          position: txResult.position,
          points: txResult.pointsAwarded
        });

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
        const currentTeam = await prisma.team.findUnique({ where: { id: params.teamId } });
        return {
          success: true,
          alreadyCompleted: true,
          isCorrect: true,
          position: currentTeam?.finalBreachPosition || 1,
          pointsAwarded: 0,
          originalPointsAwarded: currentTeam?.finalBreachPoints ?? 0,
          completedAt: currentTeam?.finalBreachCompletedAt?.toISOString() || completionTimestamp.toISOString(),
          message: `Final Breach already scored for your team (Position #${currentTeam?.finalBreachPosition || 1}).`,
          newTotalScore: currentTeam?.totalScore ?? 0
        };
      }
      throw err;
    }
  }
}

export const round3Service = new Round3Service();
