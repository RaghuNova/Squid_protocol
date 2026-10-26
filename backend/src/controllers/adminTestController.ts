import { Request, Response, NextFunction } from 'express';
import { Prisma, RoundStatus, SignalState } from '@prisma/client';
import { prisma } from '../prisma.js';
import { sseService } from '../services/sseService.js';
import { generateQrToken } from '../utils/qrToken.js';

let isResetInProgress = false;
const RESET_LOCK_A = 1567324401;
const RESET_LOCK_B = 1;

function resetEnvironmentAllowed(): boolean {
  if (process.env.NODE_ENV === 'production') return process.env.ENABLE_GAME_RESET === 'true';
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const databaseName = parsed.pathname.replace(/^\//, '').split('?')[0];
    return ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname) && /(test|dev)/i.test(databaseName);
  } catch {
    return false;
  }
}

async function newUniqueQrToken(tx: Prisma.TransactionClient): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const tokenCode = generateQrToken();
    const exists = await tx.accessToken.findUnique({ where: { tokenCode }, select: { id: true } });
    if (!exists) return tokenCode;
  }
  throw new Error('Unable to allocate a unique QR token.');
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
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(${RESET_LOCK_A}, ${RESET_LOCK_B})`;
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

      const tokens = await tx.accessToken.findMany({ select: { id: true } });
      for (const token of tokens) {
        await tx.accessToken.update({
          where: { id: token.id },
          data: { tokenCode: await newUniqueQrToken(tx), accessKey: null, authorizedAt: null, isRedeemed: false, redeemedAt: null }
        });
      }

      await tx.roundControl.updateMany({
        where: { id: { in: [1, 2, 3] } },
        data: { status: RoundStatus.UPCOMING, startTime: null, endTime: null, pausedAt: null, remainingSeconds: null }
      });
      await tx.roundControl.update({
        where: { id: 1 },
        data: { signalState: SignalState.GREEN }
      });

      await tx.winnerAnnouncement.upsert({
        where: { id: 1 },
        update: { isFinalized: false, finalizedAt: null, finalizedByAdminId: null, finalizedByAdminUsername: null, winners: Prisma.DbNull, notes: null },
        create: { id: 1, isFinalized: false }
      });
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
    }, { isolationLevel: 'Serializable', timeout: 30000 });

    sseService.broadcast('game_reset', { timestamp: resetAt.toISOString(), message: 'The game has been reset by an administrator.' });
    sseService.broadcast('round_state_change', { roundId: 1, status: RoundStatus.UPCOMING, timestamp: resetAt.toISOString() });
    sseService.broadcast('signal_change', { roundId: 1, signalState: SignalState.GREEN, doublePointsEnabled: false, redLightPenaltyMode: false, timestamp: resetAt.toISOString() });
    sseService.broadcast('score_update', { teamId: 'ALL', pointsDelta: 0, newTotalScore: 0, source: 'RESET_GAME' });
    sseService.broadcast('winners_announced', { isFinalized: false, resetAt: resetAt.toISOString() });
    res.json({ success: true, message: 'Game reset completed. Teams, accounts, questions, puzzles, solutions and event settings were preserved.' });
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
