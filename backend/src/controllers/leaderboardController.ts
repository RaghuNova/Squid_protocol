import { Request, Response, NextFunction } from 'express';
import { scoringService } from '../services/scoringService.js';
import { UserRole } from '@prisma/client';

export async function getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Access denied. The leaderboard is strictly restricted to tournament officials.'
      });
      return;
    }

    const leaderboard = await scoringService.getLeaderboard();

    res.json({
      success: true,
      updatedAt: new Date().toISOString(),
      teams: leaderboard
    });
  } catch (err) {
    next(err);
  }
}

export async function getWinnerAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Access denied. Winner announcement management is strictly restricted to administrators.'
      });
      return;
    }

    const announcement = await scoringService.getWinnerAnnouncement();
    res.json({
      success: true,
      ...announcement
    });
  } catch (err) {
    next(err);
  }
}

export async function finalizeWinners(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.role !== UserRole.ADMIN || !req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Access denied. Only authenticated tournament administrators can finalize winners.'
      });
      return;
    }

    const { notes } = req.body || {};

    const record = await scoringService.finalizeWinners({
      adminUserId: req.user.userId,
      adminUsername: req.user.username,
      notes,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Official tournament winners successfully validated and finalized.',
      announcement: record
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: 'FINALIZATION_FAILED',
      message: err.message || 'Failed to finalize tournament winners.'
    });
  }
}

export async function reopenWinners(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.role !== UserRole.ADMIN || !req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Access denied. Only authenticated tournament administrators can reopen results.'
      });
      return;
    }

    const record = await scoringService.reopenWinners({
      adminUserId: req.user.userId,
      adminUsername: req.user.username,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Winner announcement reopened to provisional standings.',
      announcement: record
    });
  } catch (err: any) {
    next(err);
  }
}
