import { Prisma, RoundStatus, TeamRoundProgressStatus } from '@prisma/client';
import { prisma } from '../prisma.js';

const ROUND_MINUTES: Record<number, number> = { 1: 15, 2: 20 };

type DbClient = Prisma.TransactionClient | typeof prisma;

export class TeamRoundProgressService {
  private async readyNextRound(db: DbClient, teamId: string, round: number, now: Date) {
    if (round >= 3) return;
    const nextRound = round + 1;
    await db.teamRoundProgress.upsert({
      where: { teamId_round: { teamId, round: nextRound } },
      create: {
        teamId,
        round: nextRound,
        status: TeamRoundProgressStatus.READY,
        nextRoundEligible: false,
        createdAt: now
      },
      update: {
        status: TeamRoundProgressStatus.READY,
        nextRoundEligible: false
      }
    });
  }

  async completeRound(teamId: string, round: number, now = new Date()) {
    await prisma.$transaction(async (tx) => {
      await tx.teamRoundProgress.upsert({
        where: { teamId_round: { teamId, round } },
        create: {
          teamId,
          round,
          status: TeamRoundProgressStatus.COMPLETED,
          startedAt: now,
          completedAt: now,
          nextRoundEligible: true
        },
        update: {
          status: TeamRoundProgressStatus.COMPLETED,
          completedAt: now,
          timedOutAt: null,
          deadlineAt: null,
          remainingSeconds: null,
          nextRoundEligible: true
        }
      });
      await this.readyNextRound(tx, teamId, round, now);
      await tx.team.update({
        where: { id: teamId },
        data: { currentRound: Math.min(round + 1, 3), currentStage: 1 }
      });
    });
  }

  async completeRoundInTransaction(tx: Prisma.TransactionClient, teamId: string, round: number, now = new Date()) {
    await tx.teamRoundProgress.upsert({
      where: { teamId_round: { teamId, round } },
      create: { teamId, round, status: TeamRoundProgressStatus.COMPLETED, startedAt: now, completedAt: now, nextRoundEligible: true },
      update: { status: TeamRoundProgressStatus.COMPLETED, completedAt: now, timedOutAt: null, deadlineAt: null, remainingSeconds: null, nextRoundEligible: true }
    });
    await this.readyNextRound(tx, teamId, round, now);
    await tx.team.update({ where: { id: teamId }, data: { currentRound: Math.min(round + 1, 3), currentStage: 1 } });
  }

  async reconcileTeam(teamId: string, now = new Date()) {
    await prisma.$transaction(async (tx) => {
      const expired = await tx.teamRoundProgress.findMany({
        where: {
          teamId,
          round: { in: [1, 2] },
          status: TeamRoundProgressStatus.IN_PROGRESS,
          deadlineAt: { lte: now }
        }
      });
      for (const progress of expired) {
        const update = await tx.teamRoundProgress.updateMany({
          where: {
            id: progress.id,
            status: TeamRoundProgressStatus.IN_PROGRESS,
            deadlineAt: { lte: now }
          },
          data: {
            status: TeamRoundProgressStatus.TIMED_OUT,
            timedOutAt: now,
            deadlineAt: null,
            remainingSeconds: 0,
            nextRoundEligible: true
          }
        });
        if (update.count) {
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
        await tx.teamRoundProgress.upsert({
          where: { teamId_round: { teamId, round: 1 } },
          create: {
            teamId,
            round: 1,
            status: TeamRoundProgressStatus.COMPLETED,
            completedAt: now,
            nextRoundEligible: true
          },
          update: {
            status: TeamRoundProgressStatus.COMPLETED,
            completedAt: now,
            deadlineAt: null,
            timedOutAt: null,
            remainingSeconds: null,
            nextRoundEligible: true
          }
        });
        await this.readyNextRound(tx, teamId, 1, now);
      }

      const r2Complete = await tx.scoreEvent.findUnique({
        where: { teamId_source: { teamId, source: 'ROUND2_STAGE2_BROKEN_LOGIC' } },
        select: { id: true }
      });
      if (r2Complete) {
        await tx.teamRoundProgress.upsert({
          where: { teamId_round: { teamId, round: 2 } },
          create: {
            teamId,
            round: 2,
            status: TeamRoundProgressStatus.COMPLETED,
            completedAt: now,
            nextRoundEligible: true
          },
          update: {
            status: TeamRoundProgressStatus.COMPLETED,
            completedAt: now,
            deadlineAt: null,
            timedOutAt: null,
            remainingSeconds: null,
            nextRoundEligible: true
          }
        });
        await this.readyNextRound(tx, teamId, 2, now);
      }
    });
  }

  async enterRound1(teamId: string, now = new Date()) {
    await this.reconcileTeam(teamId, now);
    const existing = await prisma.teamRoundProgress.findUnique({
      where: { teamId_round: { teamId, round: 1 } }
    });
    if (existing && existing.status !== TeamRoundProgressStatus.LOCKED) return existing;

    const gate = await prisma.roundControl.findUnique({ where: { id: 1 } });
    if (!gate || gate.status !== RoundStatus.ACTIVE) return existing;

    return prisma.teamRoundProgress.upsert({
      where: { teamId_round: { teamId, round: 1 } },
      create: {
        teamId,
        round: 1,
        status: TeamRoundProgressStatus.IN_PROGRESS,
        startedAt: now,
        deadlineAt: new Date(now.getTime() + ROUND_MINUTES[1] * 60_000)
      },
      update: {
        status: TeamRoundProgressStatus.IN_PROGRESS,
        startedAt: now,
        deadlineAt: new Date(now.getTime() + ROUND_MINUTES[1] * 60_000)
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
    let progress = await prisma.teamRoundProgress.findUnique({
      where: { teamId_round: { teamId, round: 2 } }
    });
    if (!progress) {
      progress = await prisma.teamRoundProgress.create({
        data: {
          teamId,
          round: 2,
          status: TeamRoundProgressStatus.READY,
          nextRoundEligible: false
        }
      });
    }
    if (gate?.status !== RoundStatus.ACTIVE || progress.status !== TeamRoundProgressStatus.READY) return progress;

    return prisma.teamRoundProgress.update({
      where: { id: progress.id },
      data: {
        status: TeamRoundProgressStatus.IN_PROGRESS,
        startedAt: now,
        deadlineAt: new Date(now.getTime() + ROUND_MINUTES[2] * 60_000),
        nextRoundEligible: false
      }
    });
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
