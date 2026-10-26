import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { acquireGameplayWriteLock } from './gameResetLock.js';
import { sseService } from './sseService.js';
import { logAdminAction } from './auditService.js';

export interface AwardScoreParams {
  teamId: string;
  round: number;
  stage: number;
  source: string;
  pointsDelta: number;
  reason: string;
  createdByAdminId?: string;
}

export interface LeaderboardSortRecord {
  totalScore: number;
  r3Position: number | null;
  finalAnswerSubmittedAt: Date | null;
  finalBreachCompletedAt: Date | null;
  teamCode: string;
}

export function compareLeaderboardTeams(a: LeaderboardSortRecord, b: LeaderboardSortRecord): number {
  if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
  if (a.finalBreachCompletedAt && b.finalBreachCompletedAt && a.r3Position !== null && b.r3Position !== null && a.r3Position !== b.r3Position) return a.r3Position - b.r3Position;
  if (a.finalAnswerSubmittedAt && b.finalAnswerSubmittedAt) {
    const answerDiff = a.finalAnswerSubmittedAt.getTime() - b.finalAnswerSubmittedAt.getTime();
    if (answerDiff !== 0) return answerDiff;
  }
  if (a.finalBreachCompletedAt && b.finalBreachCompletedAt) {
    const completedDiff = a.finalBreachCompletedAt.getTime() - b.finalBreachCompletedAt.getTime();
    if (completedDiff !== 0) return completedDiff;
  }
  return a.teamCode.localeCompare(b.teamCode);
}

export class ScoringService {
  /**
   * Atomically award or deduct points for a team.
   * Guarantees idempotency via unique constraints on (teamId, source).
   */
  public async awardScore(params: AwardScoreParams): Promise<{ success: boolean; pointsAwarded: number; alreadyAwarded: boolean; newTotalScore: number }> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Check if this score source was already recorded for this team
        const existing = await tx.scoreEvent.findUnique({
          where: {
            teamId_source: {
              teamId: params.teamId,
              source: params.source
            }
          }
        });

        if (existing) {
          const team = await tx.team.findUnique({ where: { id: params.teamId } });
          return {
            success: true,
            pointsAwarded: 0,
            alreadyAwarded: true,
            newTotalScore: team?.totalScore ?? 0
          };
        }

        // 2. Insert new ScoreEvent
        await tx.scoreEvent.create({
          data: {
            teamId: params.teamId,
            round: params.round,
            stage: params.stage,
            source: params.source,
            pointsDelta: params.pointsDelta,
            reason: params.reason,
            createdByAdminId: params.createdByAdminId
          }
        });

        // 3. Update team total score
        const updatedTeam = await tx.team.update({
          where: { id: params.teamId },
          data: {
            totalScore: {
              increment: params.pointsDelta
            }
          }
        });

        return {
          success: true,
          pointsAwarded: params.pointsDelta,
          alreadyAwarded: false,
          newTotalScore: updatedTeam.totalScore
        };
      });

      if (!result.alreadyAwarded) {
        sseService.broadcast('score_update', {
          teamId: params.teamId,
          pointsDelta: params.pointsDelta,
          newTotalScore: result.newTotalScore,
          source: params.source
        });
      }

      return result;
    } catch (err: any) {
      if (err.code === 'P2002') { // Unique constraint violation in race conditions
        const team = await prisma.team.findUnique({ where: { id: params.teamId } });
        return {
          success: true,
          pointsAwarded: 0,
          alreadyAwarded: true,
          newTotalScore: team?.totalScore ?? 0
        };
      }
      throw err;
    }
  }

  /**
   * Apply an authenticated manual score adjustment with a mandatory explanation.
   */
  public async applyManualAdjustment(params: {
    teamId: string;
    pointsDelta: number;
    reason: string;
    adminUserId: string;
    adminUsername: string;
    ipAddress?: string;
  }) {
    if (!params.reason || params.reason.trim().length < 5) {
      throw new Error("A mandatory reason (minimum 5 characters) is required for manual score adjustments.");
    }

    const uniqueSource = `ADMIN_ADJUST_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const result = await prisma.$transaction(async (tx) => {
      await acquireGameplayWriteLock(tx);
      await tx.scoreEvent.create({
        data: {
          teamId: params.teamId,
          round: 0,
          stage: 0,
          source: uniqueSource,
          pointsDelta: params.pointsDelta,
          reason: `Admin adjustment: ${params.reason.trim()}`,
          createdByAdminId: params.adminUserId
        }
      });

      const updatedTeam = await tx.team.update({
        where: { id: params.teamId },
        data: {
          totalScore: {
            increment: params.pointsDelta
          }
        }
      });

      return updatedTeam;
    });

    await logAdminAction({
      adminUserId: params.adminUserId,
      adminUsername: params.adminUsername,
      action: "MANUAL_SCORE_ADJUSTMENT",
      targetType: "TEAM_SCORE",
      targetId: params.teamId,
      details: {
        pointsDelta: params.pointsDelta,
        reason: params.reason,
        newTotalScore: result.totalScore
      },
      ipAddress: params.ipAddress
    });

    sseService.broadcast('score_update', {
      teamId: params.teamId,
      pointsDelta: params.pointsDelta,
      newTotalScore: result.totalScore,
      source: uniqueSource
    });

    return result;
  }

  /**
   * Fetch live leaderboard with official tie-break sorting:
   * 1. Cumulative score DESC
   * 2. Round 3 score DESC
   * 3. Round 2 score DESC
   * 4. Earliest final breach completion ASC
   * 5. Stable alphanumeric teamCode ASC
   */
  public async getLeaderboard(db: Prisma.TransactionClient | typeof prisma = prisma) {
    const teams = await db.team.findMany({
      include: {
        scoreEvents: true,
        submissions: {
          where: { round: 3, stage: 3, status: 'CORRECT' },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { createdAt: true }
        },
        roundProgress: { select: { round: true, status: true } },
        user: {
          select: {
            username: true
          }
        }
      }
    });

    const enriched = teams.map((team) => {
      let r1Score = 0;
      let r2Score = 0;
      let r3Score = 0;
      let totalLedgerScore = 0;

      for (const ev of team.scoreEvents) {
        totalLedgerScore += ev.pointsDelta;
        if (ev.round === 1) {
          r1Score += ev.pointsDelta;
        } else if (ev.round === 2) {
          r2Score += ev.pointsDelta;
        } else if (ev.round === 3) {
          // Only the final core debugging challenge is an online scored event in Round 3 for tie-breaking
          if (!ev.source.includes('CUP') && !ev.source.includes('ACCESS')) {
            r3Score += ev.pointsDelta;
          }
        }
      }

      const cleanTotalScore = team.scoreEvents.length > 0 ? totalLedgerScore : team.totalScore;

      const round1Status = team.roundProgress.find(progress => progress.round === 1)?.status ?? 'LOCKED';
      const round2Status = team.roundProgress.find(progress => progress.round === 2)?.status ?? 'LOCKED';
      const gameStatus = team.isDisqualified
        ? 'DISQUALIFIED'
        : team.finalBreachCompletedAt
          ? 'COMPLETED'
          : round2Status === 'TIMED_OUT' || team.roundProgress.find(progress => progress.round === 2)?.status === 'COMPLETED'
            ? 'ROUND_3_READY'
            : round2Status === 'IN_PROGRESS'
              ? 'ROUND_2_IN_PROGRESS'
              : round1Status === 'TIMED_OUT'
                ? 'ROUND_2_READY'
                : round1Status === 'IN_PROGRESS'
                  ? 'ROUND_1_IN_PROGRESS'
                  : round1Status === 'COMPLETED'
                    ? 'ROUND_2_READY'
                    : 'NOT_STARTED';

      return {
        id: team.id,
        teamCode: team.teamCode,
        username: team.user?.username || team.teamCode.toLowerCase(),
        name: team.name,
        members: team.members,
        currentRound: team.currentRound,
        currentStage: team.currentStage,
        totalScore: cleanTotalScore,
        scoreLedgerConsistent: team.scoreEvents.length === 0 ? team.totalScore === 0 : totalLedgerScore === team.totalScore,
        r1Score,
        r2Score,
        r3Score,
        r3Position: team.finalBreachPosition ?? null,
        r3Points: team.finalBreachPoints ?? (r3Score !== 0 ? r3Score : null),
        finalBreachCompletedAt: team.finalBreachCompletedAt,
        finalAnswerSubmittedAt: team.submissions[0]?.createdAt ?? null,
        round1Status,
        round2Status,
        gameStatus,
        isDisqualified: team.isDisqualified
      };
    });

    // Total score descending, then shared valid Round 3 results, final-answer
    // timestamps, overall completion timestamps, and stable team-code order.
    enriched.sort(compareLeaderboardTeams);

    return enriched;
  }

  /**
   * Fetch current winner announcement state (finalized or provisional standings).
   */
  public async getWinnerAnnouncement() {
    const announcement = await prisma.winnerAnnouncement.findUnique({
      where: { id: 1 }
    });

    if (announcement && announcement.isFinalized) {
      return {
        isFinalized: true,
        finalizedAt: announcement.finalizedAt?.toISOString() || null,
        finalizedByAdminUsername: announcement.finalizedByAdminUsername,
        winners: announcement.winners as any,
        notes: announcement.notes
      };
    }

    // Provisional standings derived dynamically from authoritative backend calculation
    const currentLeaderboard = await this.getLeaderboard();
    const activeStandings = currentLeaderboard.filter((t) => !t.isDisqualified);
    const provisionalWinners = activeStandings.map((t, idx) => ({
      rank: idx + 1,
      teamId: t.id,
      teamCode: t.teamCode,
      name: t.name,
      members: t.members,
      username: t.username,
      totalScore: t.totalScore,
      r1Score: t.r1Score,
      r2Score: t.r2Score,
      r3Score: t.r3Score,
      r3Position: t.r3Position,
      r3Points: t.r3Points,
      completedAt: t.finalBreachCompletedAt ? new Date(t.finalBreachCompletedAt).toISOString() : null
    }));

    return {
      isFinalized: false,
      finalizedAt: null,
      finalizedByAdminUsername: null,
      winners: provisionalWinners,
      notes: null
    };
  }

  /**
   * Finalize and publish official tournament winners after admin confirmation.
   */
  public async finalizeWinners(params: {
    adminUserId: string;
    adminUsername: string;
    notes?: string;
    ipAddress?: string;
  }) {
    const finalizedAt = new Date();
    const record = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(1567324401, 2)`;
      const existing = await tx.winnerAnnouncement.findUnique({ where: { id: 1 } });
      if (existing?.isFinalized) throw new Error('Winner results are already finalized.');
      const leaderboard = (await this.getLeaderboard(tx)).filter(team => !team.isDisqualified);
      if (leaderboard.length === 0) throw new Error('Cannot finalize winners: No eligible teams found.');
      const inconsistentTeams = leaderboard.filter(team => !team.scoreLedgerConsistent || (team.finalBreachCompletedAt && (!team.r3Position || team.r3Points === null)));
      if (inconsistentTeams.length) throw new Error(`Cannot finalize winners: scoring or completion data is inconsistent for ${inconsistentTeams.map(team => team.teamCode).join(', ')}.`);
      const positions = leaderboard.filter(team => team.finalBreachCompletedAt).map(team => team.r3Position);
      if (new Set(positions).size !== positions.length) throw new Error('Cannot finalize winners: duplicate Round 3 finishing positions were found.');
      const snapshot = leaderboard.map((team, idx) => ({
        rank: idx + 1,
        teamId: team.id,
        teamCode: team.teamCode,
        name: team.name,
        members: team.members,
        username: team.username,
        totalScore: team.totalScore,
        r1Score: team.r1Score,
        r2Score: team.r2Score,
        r3Score: team.r3Score,
        r3Position: team.r3Position,
        r3Points: team.r3Points,
        round1Status: team.round1Status,
        round2Status: team.round2Status,
        finalAnswerSubmittedAt: team.finalAnswerSubmittedAt?.toISOString() || null,
        completedAt: team.finalBreachCompletedAt?.toISOString() || null,
        finalBreachCompletedAt: team.finalBreachCompletedAt?.toISOString() || null,
        gameStatus: team.gameStatus
      }));
      const saved = await tx.winnerAnnouncement.upsert({
        where: { id: 1 },
        update: { isFinalized: true, finalizedAt, finalizedByAdminId: params.adminUserId, finalizedByAdminUsername: params.adminUsername, winners: snapshot as any, notes: params.notes || 'Official tournament results finalized by administrator.' },
        create: { id: 1, isFinalized: true, finalizedAt, finalizedByAdminId: params.adminUserId, finalizedByAdminUsername: params.adminUsername, winners: snapshot as any, notes: params.notes || 'Official tournament results finalized by administrator.' }
      });
      await tx.adminAuditLog.create({ data: {
        adminUserId: params.adminUserId,
        adminUsername: params.adminUsername,
        action: 'FINALIZE_WINNERS',
        targetType: 'WINNER_ANNOUNCEMENT',
        targetId: '1',
        details: { teamCount: snapshot.length, finalizedAt: finalizedAt.toISOString() },
        ipAddress: params.ipAddress
      } });
      return saved;
    });

    sseService.broadcast('winners_announced', {
      isFinalized: true,
      finalizedAt: finalizedAt.toISOString(),
      winners: record.winners
    });

    return record;
  }

  /**
   * Reopen winner announcement to provisional state if corrections are required.
   */
  public async reopenWinners(params: {
    adminUserId: string;
    adminUsername: string;
    ipAddress?: string;
  }) {
    const record = await prisma.winnerAnnouncement.upsert({
      where: { id: 1 },
      update: {
        isFinalized: false,
        finalizedAt: null,
        finalizedByAdminId: null,
        finalizedByAdminUsername: null,
        winners: Prisma.DbNull,
        notes: null
      },
      create: {
        id: 1,
        isFinalized: false
      }
    });

    await logAdminAction({
      adminUserId: params.adminUserId,
      adminUsername: params.adminUsername,
      action: "REOPEN_WINNERS",
      targetType: "WINNER_ANNOUNCEMENT",
      targetId: "1",
      details: { reopenedAt: new Date().toISOString() },
      ipAddress: params.ipAddress
    });

    sseService.broadcast('winners_announced', {
      isFinalized: false,
      reopenedAt: new Date().toISOString()
    });

    return record;
  }
}

export const scoringService = new ScoringService();
