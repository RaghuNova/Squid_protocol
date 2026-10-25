import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { round1Service } from '../services/round1Service.js';
import { resolveEffectiveTeamId } from '../middleware/auth.js';

const SubmitSchema = z.object({
  questionId: z.string().uuid(),
  selectedOption: z.string().min(1).max(10),
  doublePointsSelected: z.boolean().optional()
});

export async function getRound1(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = (await resolveEffectiveTeamId(req)) || undefined;
    const data = await round1Service.getRound1Data(teamId);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function submitRound1(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = await resolveEffectiveTeamId(req);
    if (!teamId) {
      res.status(403).json({ success: false, error: 'TEAM_REQUIRED', message: 'Only team accounts can submit.' });
      return;
    }

    const { questionId, selectedOption } = SubmitSchema.parse(req.body);

    const result = await round1Service.submitAnswer({
      teamId,
      questionId,
      selectedOption,
      clientIp: req.ip
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}
