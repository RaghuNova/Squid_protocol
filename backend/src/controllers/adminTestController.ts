import { Request, Response, NextFunction } from 'express';
import { Prisma, RoundStatus, SignalState } from '@prisma/client';
import { prisma } from '../prisma.js';
import { sseService } from '../services/sseService.js';
import { acquireGameResetLocks } from '../services/gameResetLock.js';

let isResetInProgress = false;

export function resetEnvironmentAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  // If explicitly disabled, block reset
  if (env.ENABLE_GAME_RESET === 'false') return false;

  // Explicitly enabled via environment variable
  if (env.ENABLE_GAME_RESET === 'true') return true;

  // Render cloud deployment: allow reset unless explicitly disabled with ENABLE_GAME_RESET=false
  if (env.RENDER === 'true') return true;

  // Keep production resets behind an explicit deployment setting, in addition
  // to the ADMIN route middleware and the exact RESET GAME confirmation.
  if (env.NODE_ENV === 'production') return env.ENABLE_GAME_RESET === 'true';
  const url = env.NODE_ENV === 'test' ? env.TEST_DATABASE_URL || env.DATABASE_URL : env.DATABASE_URL;
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const databaseName = parsed.pathname.replace(/^\//, '').split('?')[0];
    const isLocal = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    if (!isLocal) return false;
    const isNamedTestDatabase = /(test|dev)/i.test(databaseName);
    return isNamedTestDatabase || (env.NODE_ENV === 'development' && env.ENABLE_GAME_RESET === 'true');
  } catch {
    return false;
  }
}

export async function resetGame(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.body?.confirmation !== 'RESET GAME') {
    res.status(400).json({ success: false, error: 'CONFIRMATION_REQUIRED', message: 'Type RESET GAME in the confirmation dialog before resetting.' });
    return;
  }
  if (!resetEnvironmentAllowed()) {
    res.status(403).json({ success: false, error: 'RESET_ENVIRONMENT_BLOCKED', message: 'Reset blocked by the safety guard. Use a local database whose name contains dev or test, or explicitly set ENABLE_GAME_RESET=true for the approved production environment.' });
    return;
  }
  if (isResetInProgress) {
    res.status(409).json({ success: false, error: 'RESET_IN_PROGRESS', message: 'A game reset is already running.' });
    return;
  }
  isResetInProgress = true;
  const resetAt = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      await acquireGameResetLocks(tx);
      await tx.submission.deleteMany({});
      await tx.scoreEvent.deleteMany({});
      await tx.physicalVerification.deleteMany({});
      await tx.teamRoundProgress.deleteMany({});
      await tx.team.updateMany({
        data: {
          totalScore: 0,
          currentRound: 1,
          currentStage: 1,
          isDisqualified: false,
          finalBreachCompletedAt: null,
          finalBreachPosition: null,
          finalBreachPoints: null
        }
      });

      await tx.accessToken.updateMany({
        data: { accessKey: null, authorizedAt: null, isRedeemed: false, redeemedAt: null }
      });

      const roundControls = await tx.roundControl.findMany({ where: { id: { in: [1, 2, 3] } } });
      if (roundControls.length !== 3) throw new Error('Reset verification failed: all three round controls must exist.');
      for (const round of roundControls) {
        await tx.roundControl.update({
          where: { id: round.id },
          data: {
            status: RoundStatus.UPCOMING,
            startTime: null,
            endTime: null,
            pausedAt: null,
            remainingSeconds: round.durationMinutes * 60,
            signalState: SignalState.GREEN,
            redLightPenaltyMode: false,
            doublePointsEnabled: false
          }
        });
      }

      await tx.winnerAnnouncement.upsert({
        where: { id: 1 },
        update: { isFinalized: false, finalizedAt: null, finalizedByAdminId: null, finalizedByAdminUsername: null, winners: Prisma.DbNull, notes: null },
        create: { id: 1, isFinalized: false }
      });

      const [submissionCount, scoreEventCount, verificationCount, progressCount, dirtyTeams, dirtyTokens, winner, resetRounds] = await Promise.all([
        tx.submission.count(),
        tx.scoreEvent.count(),
        tx.physicalVerification.count(),
        tx.teamRoundProgress.count(),
        tx.team.count({ where: { OR: [
          { totalScore: { not: 0 } }, { currentRound: { not: 1 } }, { currentStage: { not: 1 } },
          { isDisqualified: true }, { finalBreachCompletedAt: { not: null } },
          { finalBreachPosition: { not: null } }, { finalBreachPoints: { not: null } }
        ] } }),
        tx.accessToken.count({ where: { OR: [
          { accessKey: { not: null } }, { authorizedAt: { not: null } },
          { isRedeemed: true }, { redeemedAt: { not: null } }
        ] } }),
        tx.winnerAnnouncement.findUnique({ where: { id: 1 } }),
        tx.roundControl.findMany({ where: { id: { in: [1, 2, 3] } } })
      ]);
      const badRounds = resetRounds.filter(round => round.status !== RoundStatus.UPCOMING || round.startTime || round.endTime || round.pausedAt || round.signalState !== SignalState.GREEN || round.redLightPenaltyMode || round.doublePointsEnabled || round.remainingSeconds !== round.durationMinutes * 60);
      if (submissionCount || scoreEventCount || verificationCount || progressCount || dirtyTeams || dirtyTokens || winner?.isFinalized || winner?.finalizedAt || winner?.finalizedByAdminId || winner?.winners !== null || badRounds.length) {
        throw new Error('Reset verification failed: persisted game state remains after the reset transaction.');
      }
      await tx.adminAuditLog.create({
        data: {
          adminUserId: req.user!.userId,
          adminUsername: req.user!.username,
          action: 'RESET_GAME_SUCCEEDED',
          targetType: 'GAME_STATE',
          details: { resetAt: resetAt.toISOString() },
          ipAddress: req.ip
        }
      });
    }, { timeout: 30000 });

    sseService.broadcast('game_reset', { timestamp: resetAt.toISOString(), message: 'The game has been reset by an administrator.' });
    sseService.broadcast('round_state_change', { roundId: 1, status: RoundStatus.UPCOMING, timestamp: resetAt.toISOString() });
    sseService.broadcast('signal_change', { roundId: 1, signalState: SignalState.GREEN, doublePointsEnabled: false, redLightPenaltyMode: false, timestamp: resetAt.toISOString() });
    sseService.broadcast('score_update', { teamId: 'ALL', pointsDelta: 0, newTotalScore: 0, source: 'RESET_GAME' });
    sseService.broadcast('winners_announced', { isFinalized: false, resetAt: resetAt.toISOString() });
    res.json({ success: true, message: 'Game reset completed. All participant scores, submissions, round progress, and Round 3 completion were cleared. Teams, accounts, questions, puzzles, solutions, and event settings were preserved.' });
  } catch (error) {
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: req.user!.userId,
        adminUsername: req.user!.username,
        action: 'RESET_GAME_FAILED',
        targetType: 'GAME_STATE',
        details: { resetAt: resetAt.toISOString(), outcome: 'rolled back' },
        ipAddress: req.ip
      }
    }).catch(() => undefined);
    next(error);
  } finally {
    isResetInProgress = false;
  }
}
