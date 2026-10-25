import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { prisma } from '../prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'squid-protocol-ultra-secure-jwt-key-dev-32chars';

export interface AuthUser {
  userId: string;
  username: string;
  role: UserRole;
  teamId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

export async function resolveEffectiveTeamId(req: Request): Promise<string | null> {
  if (req.user?.teamId) {
    return req.user.teamId;
  }

  // Look up user in database if teamId was not in JWT
  if (req.user?.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { teamId: true }
      });
      if (user?.teamId) {
        if (req.user) req.user.teamId = user.teamId;
        return user.teamId;
      }
    } catch {
      // Continue to next check
    }
  }

  // Allow administrators to test or act on behalf of teams
  if (req.user?.role === UserRole.ADMIN) {
    const headerCode = (req.headers['x-team-code'] as string) || (req.body?.teamCode as string);
    if (headerCode) {
      const team = await prisma.team.findFirst({
        where: { teamCode: { equals: headerCode.trim(), mode: 'insensitive' } },
        select: { id: true }
      });
      if (team) return team.id;
    }
    const defaultTeam = await prisma.team.findFirst({
      where: { teamCode: 'TEAM01' },
      select: { id: true }
    });
    if (defaultTeam) return defaultTeam.id;
  }

  return null;
}

/** Resolve a team only when the authenticated account itself is a team account.
 * Admin impersonation is useful for read-only previews, but must never authorize
 * scored submissions.
 */
export async function resolveSubmittingTeamId(req: Request): Promise<string | null> {
  if (!req.user?.userId) return null;

  // The database role is authoritative when an older session has a stale role
  // claim. This still excludes admins and resolves the team's current linkage.
  if (req.user.role !== UserRole.TEAM) {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true, teamId: true }
    });
    if (currentUser?.role !== UserRole.TEAM || !currentUser.teamId) return null;
    req.user.role = currentUser.role;
    req.user.teamId = currentUser.teamId;
    return currentUser.teamId;
  }

  // Team login issues a signed token containing that team's ID. Use this claim
  // directly so a valid logged-in team is not rejected if its database user
  // association is temporarily stale or was changed after the session began.
  if (req.user.teamId) return req.user.teamId;
  if (!req.user.userId) return null;

  // Older team tokens may not include teamId; resolve those from the account.
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { role: true, teamId: true }
  });
  if (!user || user.role !== UserRole.TEAM || !user.teamId) return null;
  req.user.teamId = user.teamId;
  return user.teamId;
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  let token: string | undefined;

  // 1. Prioritize explicit Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Fallback to HttpOnly cookie if no Authorization header provided
  if (!token && req.cookies && req.cookies.squid_token) {
    token = req.cookies.squid_token;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Access denied. Valid session or authentication token required.'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

    // Fallback: If teamId is missing on decoded token, check the database
    if (!decoded.teamId && decoded.userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { teamId: true, role: true }
        });
        if (user?.teamId) {
          decoded.teamId = user.teamId;
        }
      } catch {
        // Ignore DB lookup error and continue with token payload
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Authentication session expired or invalid. Please log in again.'
    });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required.'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `Forbidden: Action requires one of roles [${roles.join(', ')}].`
      });
      return;
    }

    next();
  };
}

export async function requireTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
  const teamId = await resolveEffectiveTeamId(req);
  if (!req.user || !teamId) {
    res.status(403).json({
      success: false,
      error: 'TEAM_ONLY',
      message: 'Access restricted to authenticated team accounts.'
    });
    return;
  }
  req.user.teamId = teamId;
  next();
}
