import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { round2Service } from '../services/round2Service.js';
import { resolveEffectiveTeamId, resolveSubmittingTeamId } from '../middleware/auth.js';

const SudokuSubmitSchema = z.object({
  submittedGrid: z.string().length(36),
  usedHint: z.boolean().optional().default(false)
});

const BrokenLogicSubmitSchema = z.object({
  submittedOutput: z.string().min(1).max(50)
});

export async function getRound2(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = await resolveEffectiveTeamId(req);
    if (!teamId) {
      res.status(403).json({ success: false, error: 'TEAM_REQUIRED' });
      return;
    }

    const data = await round2Service.getRound2Data(teamId);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function submitSudoku(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = await resolveSubmittingTeamId(req);
    if (!teamId) {
      res.status(403).json({ success: false, error: 'TEAM_REQUIRED' });
      return;
    }

    const { submittedGrid, usedHint } = SudokuSubmitSchema.parse(req.body);

    const result = await round2Service.submitSudoku({
      teamId,
      submittedGrid,
      usedHint,
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

export async function submitBrokenLogic(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = await resolveEffectiveTeamId(req);
    if (!teamId) {
      res.status(403).json({ success: false, error: 'TEAM_REQUIRED' });
      return;
    }

    const { submittedOutput } = BrokenLogicSubmitSchema.parse(req.body);

    const result = await round2Service.submitBrokenLogic({
      teamId,
      submittedOutput,
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
