import { prisma } from '../prisma.js';
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
   */
  public async getLeaderboard() {
    const teams = await prisma.team.findMany({
      include: {
        scoreEvents: true
      }
    });

    const enriched = teams.map((team) => {
      let r1Score = 0;
      let r2Score = 0;
      let r3Score = 0;
      let adminAdjustmentScore = 0;
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
        } else if (ev.round === 0) {
          adminAdjustmentScore += ev.pointsDelta;
        }
      }

      const cleanTotalScore = team.scoreEvents.length > 0 ? totalLedgerScore : team.totalScore;

      return {
        id: team.id,
        teamCode: team.teamCode,
        name: team.name,
        members: team.members,
        currentRound: team.currentRound,
        currentStage: team.currentStage,
        totalScore: cleanTotalScore,
        r1Score,
        r2Score,
        r3Score,
        finalBreachCompletedAt: team.finalBreachCompletedAt,
        isDisqualified: team.isDisqualified
      };
    });

    // Sort by tie-break criteria
    enriched.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.r3Score !== a.r3Score) return b.r3Score - a.r3Score;
      if (b.r2Score !== a.r2Score) return b.r2Score - a.r2Score;
      if (a.finalBreachCompletedAt && b.finalBreachCompletedAt) {
        return new Date(a.finalBreachCompletedAt).getTime() - new Date(b.finalBreachCompletedAt).getTime();
      }
      if (a.finalBreachCompletedAt) return -1;
      if (b.finalBreachCompletedAt) return 1;
      return a.teamCode.localeCompare(b.teamCode);
    });

    return enriched;
  }
}

export const scoringService = new ScoringService();
