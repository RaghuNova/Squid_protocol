import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { round3Service } from '../services/round3Service.js';
import { resolveEffectiveTeamId, resolveSubmittingTeamId } from '../middleware/auth.js';

const QRRedeemSchema = z.object({
  code: z.string().trim().min(1).max(100)
});

const FinalKeySubmitSchema = z.object({
  finalKey: z.string().min(3).max(100)
});
// Accept legacy 64-character QR tokens so the service can verify ownership
// against the authenticated team's AccessToken instead of failing payload validation.
const AccessKeySchema = z.object({ accessKey: z.string().trim().min(3).max(100) });

function diagnosticRequestId(req: Request, res: Response): string {
  const supplied = req.get('x-request-id');
  const requestId = supplied && /^[A-Za-z0-9._-]{1,80}$/.test(supplied) ? supplied : randomUUID();
  res.setHeader('X-Request-ID', requestId);
  return requestId;
}

function logRound3Diagnostic(stage: string, requestId: string, teamId: string | null, outcome: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.info(`[ROUND3] stage=${stage} requestId=${requestId} teamRef=${teamId || 'unresolved'} outcome=${outcome}`);
  }
}

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

export async function redeemPhysicalQRCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  const requestId = diagnosticRequestId(req, res);
  try {
    const { code } = QRRedeemSchema.parse(req.body);
    // A logged-in team phone must scan its own QR. A phone without a team
    // session may still scan because the high-entropy QR token is the proof.
    const requestingTeamId = await resolveSubmittingTeamId(req);
    const result = await round3Service.redeemPhysicalQr(code, req.ip, requestingTeamId || undefined);
    const teamReference = ('teamCode' in result ? result.teamCode : undefined) || requestingTeamId || null;
    logRound3Diagnostic('qr-redemption', requestId, teamReference, result.success ? 'accepted' : result.error || 'rejected');
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    logRound3Diagnostic('qr-redemption', requestId, null, 'error');
    next(err);
  }
}

export async function authorizeRound3Access(req: Request, res: Response, next: NextFunction): Promise<void> {
  const requestId = diagnosticRequestId(req, res);
  try {
    const teamId = await resolveSubmittingTeamId(req);
    if (!teamId) {
      res.status(403).json({ success: false, error: 'TEAM_REQUIRED' });
      return;
    }
    const { accessKey } = AccessKeySchema.parse(req.body);
    const result = await round3Service.authorizeAccessKey(teamId, accessKey);
    logRound3Diagnostic('access-key-validation', requestId, teamId, result.success ? 'accepted' : result.error || 'rejected');
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    logRound3Diagnostic('access-key-validation', requestId, req.user?.teamId || null, 'error');
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
