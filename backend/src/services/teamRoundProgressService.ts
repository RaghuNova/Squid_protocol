import { Prisma, RoundStatus, TeamRoundProgressStatus } from '@prisma/client';
import { prisma } from '../prisma.js';
import { acquireGameplayWriteLock } from './gameResetLock.js';
import { sseService } from './sseService.js';

const ROUND_MINUTES: Record<number, number> = { 1: 15, 2: 20 };

export function canStartTeamRound2(isEligibleFromRound1: boolean, teamStatus: TeamRoundProgressStatus, gateStatus: RoundStatus | undefined): boolean {
  return isEligibleFromRound1 && teamStatus === TeamRoundProgressStatus.READY && gateStatus !== RoundStatus.PAUSED;
}

type DbClient = Prisma.TransactionClient | typeof prisma;

export class TeamRoundProgressService {
  async startRound1ForAllTeams(startedAt: Date, deadlineAt: Date) {
    await prisma.$transaction(async tx => {
      await acquireGameplayWriteLock(tx);
      const control = await tx.roundControl.findUnique({ where: { id: 1 } });
      if (control?.status !== RoundStatus.ACTIVE || control.startTime?.getTime() !== startedAt.getTime() || control.endTime?.getTime() !== deadlineAt.getTime()) return;
      const teams = await tx.team.findMany({ select: { id: true } });
      await tx.teamRoundProgress.createMany({
        data: teams.map(({ id }) => ({
          teamId: id,
          round: 1,
          status: TeamRoundProgressStatus.IN_PROGRESS,
          startedAt,
          deadlineAt,
          nextRoundEligible: false
        })),
        skipDuplicates: true
      });
      await tx.teamRoundProgress.updateMany({
        where: { round: 1, status: { in: [TeamRoundProgressStatus.LOCKED, TeamRoundProgressStatus.IN_PROGRESS] } },
        data: { status: TeamRoundProgressStatus.IN_PROGRESS, startedAt, deadlineAt, remainingSeconds: null }
      });
    });
  }

  private async readyNextRound(db: DbClient, teamId: string, round: number, now: Date) {
    if (round >= 3) return;
    const nextRound = round + 1;
    const next = await db.teamRoundProgress.upsert({
      where: { teamId_round: { teamId, round: nextRound } },
      create: {
        teamId,
        round: nextRound,
        status: TeamRoundProgressStatus.READY,
        nextRoundEligible: false,
        createdAt: now
      },
      update: {}
    });
    // Repairs legacy LOCKED rows without reopening or resetting a round already started.
    await db.teamRoundProgress.updateMany({
      where: { id: next.id, status: TeamRoundProgressStatus.LOCKED },
      data: { status: TeamRoundProgressStatus.READY, nextRoundEligible: false }
    });
  }

  async completeRound(teamId: string, round: number, now = new Date()) {
    await prisma.$transaction(async (tx) => {
      await acquireGameplayWriteLock(tx);
      const existing = await tx.teamRoundProgress.findUnique({ where: { teamId_round: { teamId, round } } });
      const completedAt = existing?.completedAt ?? now;
      await tx.teamRoundProgress.upsert({
        where: { teamId_round: { teamId, round } },
        create: {
          teamId,
          round,
          status: TeamRoundProgressStatus.COMPLETED,
          startedAt: now,
          completedAt,
          nextRoundEligible: true
        },
        update: {
          status: TeamRoundProgressStatus.COMPLETED,
          completedAt,
          timedOutAt: null,
          deadlineAt: null,
          remainingSeconds: null,
          nextRoundEligible: true
        }
      });
      await this.readyNextRound(tx, teamId, round, completedAt);
      await tx.team.update({
        where: { id: teamId },
        data: { currentRound: Math.min(round + 1, 3), currentStage: 1 }
      });
    });
  }

  async completeRoundInTransaction(tx: Prisma.TransactionClient, teamId: string, round: number, now = new Date()) {
    await acquireGameplayWriteLock(tx);
    const existing = await tx.teamRoundProgress.findUnique({ where: { teamId_round: { teamId, round } } });
    const completedAt = existing?.completedAt ?? now;
    await tx.teamRoundProgress.upsert({
      where: { teamId_round: { teamId, round } },
      create: { teamId, round, status: TeamRoundProgressStatus.COMPLETED, startedAt: now, completedAt, nextRoundEligible: true },
      update: { status: TeamRoundProgressStatus.COMPLETED, completedAt, timedOutAt: null, deadlineAt: null, remainingSeconds: null, nextRoundEligible: true }
    });
    await this.readyNextRound(tx, teamId, round, completedAt);
    await tx.team.update({ where: { id: teamId }, data: { currentRound: Math.min(round + 1, 3), currentStage: 1 } });
  }

  async reconcileTeam(teamId: string, now = new Date()) {
    const transitions: Array<{ round: number; status: TeamRoundProgressStatus }> = [];
    await prisma.$transaction(async (tx) => {
      await acquireGameplayWriteLock(tx);
      const expired = await tx.teamRoundProgress.findMany({
        where: {
          teamId,
          round: { in: [1, 2] },
          status: { in: [TeamRoundProgressStatus.IN_PROGRESS, TeamRoundProgressStatus.READY] },
          OR: [
            { deadlineAt: { lte: now } }
          ]
        }
      });
      for (const progress of expired) {
        const update = await tx.teamRoundProgress.updateMany({
          where: {
            id: progress.id,
            status: { in: [TeamRoundProgressStatus.IN_PROGRESS, TeamRoundProgressStatus.READY] }
          },
          data: {
            status: TeamRoundProgressStatus.TIMED_OUT,
            timedOutAt: progress.timedOutAt ?? now,
            deadlineAt: null,
            remainingSeconds: 0,
            nextRoundEligible: true
          }
        });
        if (update.count) {
          transitions.push({ round: progress.round, status: TeamRoundProgressStatus.TIMED_OUT });
          await this.readyNextRound(tx, teamId, progress.round, now);
          await tx.team.update({
            where: { id: teamId },
            data: { currentRound: Math.min(progress.round + 1, 3), currentStage: 1 }
          });
        }
      }

      // Repair progression rows for completed work created before this model
      // existed, and keep retries/restarts idempotent.
      const r1Questions = await tx.question.count({ where: { isActive: true, round: 1 } });
      const r1Answers = (await tx.submission.findMany({
        where: { teamId, round: 1, questionId: { not: null } }, distinct: ['questionId'], select: { questionId: true }
      })).length;
      if (r1Questions > 0 && r1Answers >= r1Questions) {
        const lastAnswer = await tx.submission.findFirst({
          where: { teamId, round: 1, questionId: { not: null } },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        });
        const existingProgress = await tx.teamRoundProgress.findUnique({ where: { teamId_round: { teamId, round: 1 } } });
        const wasCompleted = existingProgress?.status === TeamRoundProgressStatus.COMPLETED;
        const completedAt = existingProgress?.completedAt ?? lastAnswer?.createdAt ?? now;
        await tx.teamRoundProgress.upsert({
          where: { teamId_round: { teamId, round: 1 } },
          create: {
            teamId,
            round: 1,
            status: TeamRoundProgressStatus.COMPLETED,
            completedAt,
            nextRoundEligible: true
          },
          update: {
            status: TeamRoundProgressStatus.COMPLETED,
            completedAt,
            deadlineAt: null,
            timedOutAt: null,
            remainingSeconds: null,
            nextRoundEligible: true
          }
        });
        await this.readyNextRound(tx, teamId, 1, completedAt);
        await tx.team.update({ where: { id: teamId }, data: { currentRound: 2, currentStage: 1 } });
        if (!wasCompleted) transitions.push({ round: 1, status: TeamRoundProgressStatus.COMPLETED });
      }

      const r2Complete = await tx.scoreEvent.findUnique({
        where: { teamId_source: { teamId, source: 'ROUND2_STAGE2_BROKEN_LOGIC' } },
        select: { id: true, createdAt: true }
      });
      if (r2Complete) {
        const existingProgress = await tx.teamRoundProgress.findUnique({ where: { teamId_round: { teamId, round: 2 } } });
        const wasCompleted = existingProgress?.status === TeamRoundProgressStatus.COMPLETED;
        const completedAt = existingProgress?.completedAt ?? r2Complete.createdAt;
        await tx.teamRoundProgress.upsert({
          where: { teamId_round: { teamId, round: 2 } },
          create: {
            teamId,
            round: 2,
            status: TeamRoundProgressStatus.COMPLETED,
            completedAt,
            nextRoundEligible: true
          },
          update: {
            status: TeamRoundProgressStatus.COMPLETED,
            completedAt,
            deadlineAt: null,
            timedOutAt: null,
            remainingSeconds: null,
            nextRoundEligible: true
          }
        });
        await this.readyNextRound(tx, teamId, 2, completedAt);
        await tx.team.update({ where: { id: teamId }, data: { currentRound: 3, currentStage: 1 } });
        if (!wasCompleted) transitions.push({ round: 2, status: TeamRoundProgressStatus.COMPLETED });
      }
    });
    for (const transition of transitions) {
      sseService.broadcast('team_progress_change', {
        teamId,
        roundId: transition.round,
        status: transition.status,
        timestamp: new Date().toISOString()
      });
    }
  }

  async enterRound1(teamId: string, now = new Date()) {
    await this.reconcileTeam(teamId, now);
    const existing = await prisma.teamRoundProgress.findUnique({
      where: { teamId_round: { teamId, round: 1 } }
    });
    if (existing && existing.status !== TeamRoundProgressStatus.LOCKED) return existing;

    const gate = await prisma.roundControl.findUnique({ where: { id: 1 } });
    if (!gate || gate.status !== RoundStatus.ACTIVE) return existing;
    const startedAt = gate.startTime ?? now;
    const deadlineAt = gate.endTime ?? new Date(startedAt.getTime() + ROUND_MINUTES[1] * 60_000);
    if (deadlineAt <= now) return existing;

    return prisma.teamRoundProgress.upsert({
      where: { teamId_round: { teamId, round: 1 } },
      create: {
        teamId,
        round: 1,
        status: TeamRoundProgressStatus.IN_PROGRESS,
        startedAt,
        deadlineAt
      },
      update: {
        status: TeamRoundProgressStatus.IN_PROGRESS,
        startedAt,
        deadlineAt
      }
    });
  }

  async enterRound2(teamId: string, now = new Date()) {
    await this.reconcileTeam(teamId, now);
    const firstRound = await prisma.teamRoundProgress.findUnique({
      where: { teamId_round: { teamId, round: 1 } }
    });
    if (!firstRound?.nextRoundEligible) return null;

    const gate = await prisma.roundControl.findUnique({ where: { id: 2 } });
    const progress = await prisma.teamRoundProgress.upsert({
      where: { teamId_round: { teamId, round: 2 } },
      create: { teamId, round: 2, status: TeamRoundProgressStatus.READY, nextRoundEligible: false },
      update: {}
    });
    if (!canStartTeamRound2(firstRound.nextRoundEligible, progress.status, gate?.status)) return progress;

    await prisma.teamRoundProgress.updateMany({
      where: { id: progress.id, status: TeamRoundProgressStatus.READY },
      data: {
        status: TeamRoundProgressStatus.IN_PROGRESS,
        startedAt: now,
        deadlineAt: new Date(now.getTime() + ROUND_MINUTES[2] * 60_000),
        remainingSeconds: null,
        nextRoundEligible: false
      }
    });
    // A concurrent request may have started the team timer first. Never reset it.
    return prisma.teamRoundProgress.findUnique({ where: { id: progress.id } });
  }

  async getTeamRound(teamId: string, round: number) {
    await this.reconcileTeam(teamId);
    return prisma.teamRoundProgress.findUnique({ where: { teamId_round: { teamId, round } } });
  }

  async reconcileExpiredRounds(now = new Date()) {
    const active = await prisma.teamRoundProgress.findMany({
      where: {
        round: { in: [1, 2] },
        status: TeamRoundProgressStatus.IN_PROGRESS,
        deadlineAt: { lte: now }
      },
      select: { teamId: true }
    });
    for (const { teamId } of active) await this.reconcileTeam(teamId, now);
    return active.length;
  }

  async pauseRound(round: number, now = new Date()) {
    const rows = await prisma.teamRoundProgress.findMany({
      where: { round, status: TeamRoundProgressStatus.IN_PROGRESS, deadlineAt: { not: null } }
    });
    await prisma.$transaction(async tx => {
      await acquireGameplayWriteLock(tx);
      for (const row of rows) {
        const remainingSeconds = Math.max(0, Math.ceil((row.deadlineAt!.getTime() - now.getTime()) / 1000));
        await tx.teamRoundProgress.update({ where: { id: row.id }, data: { deadlineAt: null, remainingSeconds } });
      }
    });
  }

  async resumeRound(round: number, now = new Date()) {
    const rows = await prisma.teamRoundProgress.findMany({
      where: { round, status: TeamRoundProgressStatus.IN_PROGRESS, deadlineAt: null, remainingSeconds: { not: null } }
    });
    await prisma.$transaction(async tx => {
      await acquireGameplayWriteLock(tx);
      for (const row of rows) await tx.teamRoundProgress.update({
        where: { id: row.id },
        data: {
        deadlineAt: new Date(now.getTime() + (row.remainingSeconds ?? ROUND_MINUTES[round] * 60) * 1000),
        remainingSeconds: null
        }
      });
    });
  }

  timer(progress: Awaited<ReturnType<typeof prisma.teamRoundProgress.findUnique>>, gateStatus?: RoundStatus) {
    const status = progress?.status || TeamRoundProgressStatus.LOCKED;
    const paused = gateStatus === RoundStatus.PAUSED && status === TeamRoundProgressStatus.IN_PROGRESS;
    if (status === TeamRoundProgressStatus.IN_PROGRESS) {
      const remainingSeconds = paused
        ? progress?.remainingSeconds ?? 0
        : Math.max(0, Math.ceil(((progress?.deadlineAt?.getTime() ?? Date.now()) - Date.now()) / 1000));
      return {
        status: paused ? RoundStatus.PAUSED : RoundStatus.ACTIVE,
        progressStatus: status,
        remainingSeconds,
        endTime: paused ? null : progress?.deadlineAt?.toISOString() || null,
        isExpired: remainingSeconds <= 0,
        isPaused: paused
      };
    }
    return {
      status: status === TeamRoundProgressStatus.TIMED_OUT || status === TeamRoundProgressStatus.COMPLETED
        ? RoundStatus.ENDED
        : gateStatus || RoundStatus.UPCOMING,
      progressStatus: status,
      remainingSeconds: status === TeamRoundProgressStatus.READY ? 0 : ROUND_MINUTES[progress?.round || 1] * 60,
      endTime: null,
      isExpired: status === TeamRoundProgressStatus.TIMED_OUT,
      isPaused: false
    };
  }
}

export const teamRoundProgressService = new TeamRoundProgressService();
