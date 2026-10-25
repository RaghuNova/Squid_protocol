import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { round3Service } from '../services/round3Service.js';
import { resolveEffectiveTeamId, resolveSubmittingTeamId } from '../middleware/auth.js';

const QRRedeemSchema = z.object({
  code: z.string().min(1).max(100)
});

const FinalKeySubmitSchema = z.object({
  finalKey: z.string().min(3).max(100)
});

export async function getRound3(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = await resolveEffectiveTeamId(req);
    if (!teamId) {
      res.status(403).json({ success: false, error: 'TEAM_REQUIRED' });
      return;
    }

    const data = await round3Service.getRound3Data(teamId);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function redeemQRCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = await resolveEffectiveTeamId(req);
    if (!teamId) {
      res.status(403).json({ success: false, error: 'TEAM_REQUIRED' });
      return;
    }

    const { code } = QRRedeemSchema.parse(req.body);

    const result = await round3Service.redeemQRCode({
      teamId,
      code,
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

export async function submitFinalKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = await resolveSubmittingTeamId(req);
    if (!teamId) {
      res.status(403).json({ success: false, error: 'TEAM_REQUIRED' });
      return;
    }

    const { finalKey } = FinalKeySubmitSchema.parse(req.body);

    const result = await round3Service.submitFinalKey({
      teamId,
      finalKey,
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
