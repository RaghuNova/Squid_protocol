import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { prisma } from '../prisma.js';
import { sseService } from '../services/sseService.js';
import { scoringService } from '../services/scoringService.js';
import { logAdminAction } from '../services/auditService.js';
import { computeRoundTimer } from '../services/round1Service.js';
import { RoundStatus, SignalState, UserRole } from '@prisma/client';
import { teamRoundProgressService } from '../services/teamRoundProgressService.js';
import { generateQrToken, isStrongQrToken } from '../utils/qrToken.js';

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [
      teamCount,
      rounds,
      recentSubmissions,
      recentAudits,
      scoreEventsCount,
      finalBreachesCount
    ] = await Promise.all([
      prisma.team.count(),
      prisma.roundControl.findMany({ orderBy: { id: 'asc' } }),
      prisma.submission.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { team: { select: { teamCode: true, name: true } } }
      }),
      prisma.adminAuditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.scoreEvent.count(),
      prisma.team.count({ where: { finalBreachCompletedAt: { not: null } } })
    ]);

    const roundsWithTimers = rounds.map(r => ({
      ...r,
      timer: computeRoundTimer(r)
    }));

    const activeRound = roundsWithTimers.find(r => r.status === RoundStatus.ACTIVE || r.status === RoundStatus.PAUSED) || roundsWithTimers[0];

    res.json({
      success: true,
      stats: {
        totalTeams: teamCount,
        activeRoundId: activeRound?.id || 1,
        activeRoundTitle: activeRound?.title || '',
        activeRoundStatus: activeRound?.status || 'UPCOMING',
        currentSignal: rounds[0]?.signalState || 'GREEN',
        redLightPenaltyMode: rounds[0]?.redLightPenaltyMode || false,
        doublePointsEnabled: rounds[0]?.doublePointsEnabled ?? false,
        finalBreachesCount,
        totalScoreEvents: scoreEventsCount,
        connectedClients: sseService.getConnectedCount(),
        enableTestGameReset: process.env.NODE_ENV !== 'production' && (process.env.ENABLE_TEST_GAME_RESET === 'true' || process.env.ENABLE_TEST_GAME_RESET === '1')
      },
      rounds: roundsWithTimers,
      recentSubmissions,
      recentAudits
    });
  } catch (err) {
    next(err);
  }
}

export async function getTeams(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { teamCode: 'asc' },
      include: {
        accessToken: { select: { isRedeemed: true, redeemedAt: true } },
        user: { select: { id: true, username: true } },
        roundProgress: { orderBy: { round: 'asc' } }
      }
    });

    const roundGates = await prisma.roundControl.findMany({ select: { id: true, status: true } });
    res.json({ success: true, teams: teams.map(team => ({
      ...team,
      roundProgress: team.roundProgress.map(progress => ({
        ...progress,
        timer: teamRoundProgressService.timer(progress, roundGates.find(gate => gate.id === progress.round)?.status)
      }))
    })) });
  } catch (err) {
    next(err);
  }
}

export async function updateTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { name, members, resetPin } = req.body;

    const data: any = {};
    if (name) data.name = name;
    if (members !== undefined) data.members = members;

    const updatedTeam = await prisma.team.update({
      where: { id },
      data
    });

    if (resetPin) {
      const passwordHash = await bcrypt.hash(resetPin, 10);
      await prisma.user.updateMany({
        where: { teamId: id },
        data: { passwordHash }
      });
    }

    await logAdminAction({
      adminUserId: req.user!.userId,
      adminUsername: req.user!.username,
      action: "UPDATE_TEAM",
      targetType: "TEAM",
      targetId: id,
      details: { name, members, pinReset: !!resetPin },
      ipAddress: req.ip
    });

    res.json({ success: true, team: updatedTeam });
  } catch (err) {
    next(err);
  }
}

export async function setSignal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({
      signalState: z.enum(['GREEN', 'RED']).optional(),
      redLightPenaltyMode: z.boolean().optional(),
      doublePointsEnabled: z.boolean().optional()
    });

    const body = schema.parse(req.body);

    const updateData: any = {};
    if (body.signalState !== undefined) updateData.signalState = body.signalState;
    if (body.redLightPenaltyMode !== undefined) updateData.redLightPenaltyMode = body.redLightPenaltyMode;
    if (body.doublePointsEnabled !== undefined) updateData.doublePointsEnabled = body.doublePointsEnabled;

    const updated = await prisma.roundControl.update({
      where: { id: 1 },
      data: updateData
    });

    // Broadcast immediate live signal update to all participants
    sseService.broadcast('signal_change', {
      roundId: 1,
      signalState: updated.signalState,
      redLightPenaltyMode: updated.redLightPenaltyMode,
      doublePointsEnabled: updated.doublePointsEnabled,
      timestamp: new Date().toISOString()
    });

    await logAdminAction({
      adminUserId: req.user!.userId,
      adminUsername: req.user!.username,
      action: "SIGNAL_STATE_CHANGE",
      targetType: "ROUND_1_SIGNAL",
      targetId: "1",
      details: updateData,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      round: updated,
      message: `Signal changed to ${updated.signalState}. Double Points: ${updated.doublePointsEnabled ? 'ON' : 'OFF'}`
    });
  } catch (err) {
    next(err);
  }
}

export async function updateRound(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roundId } = req.params;
    const schema = z.object({
      status: z.enum(['UPCOMING', 'ACTIVE', 'PAUSED', 'ENDED']).optional(),
      durationMinutes: z.number().min(1).max(180).optional(),
      startTimer: z.boolean().optional(),
      pauseTimer: z.boolean().optional(),
      resumeTimer: z.boolean().optional(),
      clearTimer: z.boolean().optional(),
      endRound: z.boolean().optional()
    });

    const body = schema.parse(req.body);
    const id = parseInt(roundId, 10);

    const current = await prisma.roundControl.findUnique({ where: { id } });
    if (!current) {
      res.status(404).json({ success: false, error: 'ROUND_NOT_FOUND', message: 'Round not found.' });
      return;
    }

    const data: any = {};
    if (body.durationMinutes) data.durationMinutes = body.durationMinutes;

    if (body.pauseTimer || body.status === RoundStatus.PAUSED) {
      // Freeze timer authoritatively
      const timer = computeRoundTimer(current);
      data.status = RoundStatus.PAUSED;
      data.pausedAt = new Date();
      data.remainingSeconds = timer.remainingSeconds;
      data.endTime = null;
      if (id === 1 || id === 2) await teamRoundProgressService.pauseRound(id);
    } else if (body.resumeTimer) {
      // Resume from frozen remaining time
      const remSec = current.remainingSeconds ?? ((body.durationMinutes || current.durationMinutes || 15) * 60);
      const now = new Date();
      data.status = RoundStatus.ACTIVE;
      data.startTime = current.startTime || now;
      data.endTime = new Date(now.getTime() + remSec * 1000);
      data.pausedAt = null;
      if (id === 1 || id === 2) await teamRoundProgressService.resumeRound(id);
    } else if (body.startTimer || body.status === RoundStatus.ACTIVE) {
      const now = new Date();
      const duration = id === 1 ? 15 : id === 2 ? 20 : body.durationMinutes || current.durationMinutes || 15;
      data.durationMinutes = duration;
      data.startTime = now;
      data.endTime = id === 3 ? new Date(now.getTime() + duration * 60000) : null;
      data.remainingSeconds = id === 3 ? duration * 60 : null;
      data.status = RoundStatus.ACTIVE;
      data.pausedAt = null;

      // Sequential progression enforcement:
      if (id === 1) {
        // Round 1 started: ensure Round 2 and 3 are UPCOMING
        await prisma.roundControl.updateMany({
          where: { id: { in: [2, 3] } },
          data: { status: RoundStatus.UPCOMING, startTime: null, endTime: null, pausedAt: null }
        });
      }
    } else if (body.endRound || body.status === RoundStatus.ENDED) {
      data.status = RoundStatus.ENDED;
      data.endTime = new Date();
      data.remainingSeconds = 0;
      data.pausedAt = null;
    } else if (body.clearTimer || body.status === RoundStatus.UPCOMING) {
      data.status = RoundStatus.UPCOMING;
      data.startTime = null;
      data.endTime = null;
      data.pausedAt = null;
      data.remainingSeconds = (body.durationMinutes || current.durationMinutes || 15) * 60;
    }

    const updated = await prisma.roundControl.update({
      where: { id },
      data
    });

    const computed = computeRoundTimer(updated);

    sseService.broadcast('round_state_change', {
      roundId: id,
      status: updated.status,
      startTime: updated.startTime,
      endTime: updated.endTime,
      remainingSeconds: computed.remainingSeconds,
      isPaused: computed.isPaused,
      isExpired: computed.isExpired,
      durationMinutes: updated.durationMinutes
    });

    await logAdminAction({
      adminUserId: req.user!.userId,
      adminUsername: req.user!.username,
      action: "UPDATE_ROUND_CONTROL",
      targetType: "ROUND",
      targetId: roundId,
      details: { ...body, ...data },
      ipAddress: req.ip
    });

    res.json({ success: true, round: { ...updated, timer: computed } });
  } catch (err) {
    next(err);
  }
}

export async function getQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const questions = await prisma.question.findMany({
      orderBy: { orderIndex: 'asc' }
    });
    res.json({ success: true, questions });
  } catch (err) {
    next(err);
  }
}

export async function updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { topic, prompt, codeSnippet, options, correctOption, explanation, pointsNormal, pointsDouble, isActive } = req.body;

    const updated = await prisma.question.update({
      where: { id },
      data: {
        topic,
        prompt,
        codeSnippet,
        options,
        correctOption,
        explanation,
        pointsNormal,
        pointsDouble,
        isActive
      }
    });

    await logAdminAction({
      adminUserId: req.user!.userId,
      adminUsername: req.user!.username,
      action: "UPDATE_QUESTION",
      targetType: "QUESTION",
      targetId: id,
      ipAddress: req.ip
    });

    res.json({ success: true, question: updated });
  } catch (err) {
    next(err);
  }
}

export async function getSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { round, teamId, limit = '100' } = req.query;
    const where: any = {};
    if (round) where.round = parseInt(round as string, 10);
    if (teamId) where.teamId = teamId as string;

    const submissions = await prisma.submission.findMany({
      where,
      take: Math.min(parseInt(limit as string, 10), 200),
      orderBy: { createdAt: 'desc' },
      include: {
        team: { select: { teamCode: true, name: true } },
        question: { select: { orderIndex: true, topic: true } }
      }
    });

    res.json({ success: true, submissions });
  } catch (err) {
    next(err);
  }
}

export async function applyScoreAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({
      teamId: z.string().uuid(),
      pointsDelta: z.number().int().min(-1000).max(1000),
      reason: z.string().min(5).max(255)
    });

    const { teamId, pointsDelta, reason } = schema.parse(req.body);

    const updatedTeam = await scoringService.applyManualAdjustment({
      teamId,
      pointsDelta,
      reason,
      adminUserId: req.user!.userId,
      adminUsername: req.user!.username,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      team: updatedTeam,
      message: `Score adjusted by ${pointsDelta > 0 ? '+' : ''}${pointsDelta} points.`
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleLeaderboardPublish(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { publish } = req.body;
    const value = publish ? "true" : "false";

    await prisma.appSettings.upsert({
      where: { key: 'leaderboard_published' },
      update: { value },
      create: { key: 'leaderboard_published', value }
    });

    sseService.broadcast('leaderboard_published', { published: publish });

    res.json({ success: true, published: publish });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const logs = await prisma.adminAuditLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
}

export async function generateQRCodes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { teamCode: 'asc' },
      include: { accessToken: true }
    });

    const qrDataList = [];
    for (const team of teams) {
      let token = team.accessToken;
      if (!token) {
        const tokenCode = generateQrToken();
        token = await prisma.accessToken.create({
          data: {
            teamId: team.id,
            tokenCode,
            isRedeemed: false
          }
        });
      } else if (!isStrongQrToken(token.tokenCode)) {
        await prisma.accessToken.updateMany({
          where: { id: token.id, tokenCode: token.tokenCode },
          data: { tokenCode: generateQrToken(), isRedeemed: false, redeemedAt: null }
        });
        token = await prisma.accessToken.findUniqueOrThrow({ where: { id: token.id } });
      }

      const qrContent = `SQUID://ACCESS/${token.tokenCode}`;
      const dataUrl = await QRCode.toDataURL(qrContent, {
        errorCorrectionLevel: 'H',
        margin: 2,
        color: {
          dark: '#ff004f',
          light: '#ffffff'
        }
      });

      qrDataList.push({
        teamId: team.id,
        teamCode: team.teamCode,
        teamName: team.name,
        isRedeemed: token.isRedeemed,
        qrDataUrl: dataUrl
      });
    }

    res.json({ success: true, qrCodes: qrDataList });
  } catch (err) {
    next(err);
  }
}

export async function exportCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teams = await scoringService.getLeaderboard();

    let csv = "Rank,Team Code,Team Name,Participants,Total Score,Round 1,Round 2,Round 3,Breach Completed At\n";
    teams.forEach((t, index) => {
      csv += `${index + 1},"${t.teamCode}","${t.name}","${t.members}",${t.totalScore},${t.r1Score},${t.r2Score},${t.r3Score},"${t.finalBreachCompletedAt || 'N/A'}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="squid_protocol_leaderboard.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
}
