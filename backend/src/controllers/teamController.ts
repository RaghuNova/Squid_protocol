import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma.js';
import { resolveEffectiveTeamId } from '../middleware/auth.js';

export async function getTeamMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = (await resolveEffectiveTeamId(req)) || req.user?.teamId;
    if (!teamId) {
      res.status(403).json({ success: false, error: 'NO_TEAM_ASSOCIATED' });
      return;
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        scoreEvents: {
          orderBy: { createdAt: 'desc' }
        },
        physicalVerification: true,
        accessToken: {
          select: { isRedeemed: true, redeemedAt: true }
        }
      }
    });

    if (!team) {
      res.status(404).json({ success: false, error: 'TEAM_NOT_FOUND' });
      return;
    }

    res.json({
      success: true,
      team: {
        id: team.id,
        teamCode: team.teamCode,
        name: team.name,
        members: team.members,
        currentRound: team.currentRound,
        currentStage: team.currentStage,
        totalScore: team.totalScore,
        finalBreachCompletedAt: team.finalBreachCompletedAt,
        isDisqualified: team.isDisqualified,
        isCupVerified: !!team.physicalVerification,
        isQrValidated: !!team.accessToken?.isRedeemed,
        scoreHistory: team.scoreEvents
      }
    });
  } catch (err) {
    next(err);
  }
}
