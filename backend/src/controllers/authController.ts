import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { generateToken } from '../middleware/auth.js';
import { UserRole } from '@prisma/client';
import { logAdminAction } from '../services/auditService.js';

const TeamLoginSchema = z.object({
  teamCode: z.string().min(2).max(20),
  pin: z.string().min(3).max(50),
});

const AdminLoginSchema = z.object({
  username: z.string().min(2).max(50),
  password: z.string().min(4).max(100),
});

export async function teamLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { teamCode, pin } = TeamLoginSchema.parse(req.body);
    const normalizedInput = teamCode.trim();

    const team = await prisma.team.findFirst({
      where: {
        OR: [
          { teamCode: { equals: normalizedInput, mode: 'insensitive' } },
          { user: { username: { equals: normalizedInput, mode: 'insensitive' } } }
        ]
      },
      include: { user: true }
    });

    if (!team || !team.user) {
      res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid team code or PIN.'
      });
      return;
    }

    if (team.isDisqualified) {
      res.status(403).json({
        success: false,
        error: 'TEAM_DISQUALIFIED',
        message: 'This team has been disqualified by tournament officials.'
      });
      return;
    }

    const isMatch = await bcrypt.compare(pin, team.user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid team code or PIN.'
      });
      return;
    }

    const token = generateToken({
      userId: team.user.id,
      username: team.user.username,
      role: team.user.role,
      teamId: team.id
    });

    res.cookie('squid_token', token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 12 * 60 * 60 * 1000 // 12 hours
    });

    res.json({
      success: true,
      token,
      team: {
        id: team.id,
        teamCode: team.teamCode,
        name: team.name,
        members: team.members,
        currentRound: team.currentRound,
        currentStage: team.currentStage,
        totalScore: team.totalScore
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = AdminLoginSchema.parse(req.body);
    const normalizedUser = username.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { username: normalizedUser }
    });

    if (!user || user.role !== UserRole.ADMIN) {
      res.status(401).json({
        success: false,
        error: 'INVALID_ADMIN_CREDENTIALS',
        message: 'Invalid administrative credentials or insufficient privileges.'
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'INVALID_ADMIN_CREDENTIALS',
        message: 'Invalid administrative credentials.'
      });
      return;
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      teamId: user.teamId
    });

    res.cookie('squid_token', token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 12 * 60 * 60 * 1000
    });

    await logAdminAction({
      adminUserId: user.id,
      adminUsername: user.username,
      action: "ADMIN_LOGIN_SUCCESS",
      targetType: "AUTH",
      ipAddress: req.ip
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
}

export function logout(req: Request, res: Response): void {
  res.clearCookie('squid_token', {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });

  res.json({
    success: true,
    message: 'Session successfully terminated.'
  });
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'UNAUTHENTICATED' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { team: true }
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'USER_NOT_FOUND' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        teamId: user.teamId
      },
      team: user.team ? {
        id: user.team.id,
        teamCode: user.team.teamCode,
        name: user.team.name,
        members: user.team.members,
        currentRound: user.team.currentRound,
        currentStage: user.team.currentStage,
        totalScore: user.team.totalScore,
        finalBreachCompletedAt: user.team.finalBreachCompletedAt
      } : null
    });
  } catch (err) {
    next(err);
  }
}
