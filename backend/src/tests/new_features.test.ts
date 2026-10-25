import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../app.js';
import { prisma } from '../prisma.js';
import { getRound3FinishingPoints } from '../services/round3Service.js';
import { UserRole } from '@prisma/client';

describe('SQUID PROTOCOL — New Features & Integration Test Suite', () => {
  let adminToken: string;
  let test01Token: string;
  let test02Token: string;

  beforeAll(async () => {
    // 1. Authenticate admin
    const adminRes = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({ username: 'admin', password: 'Admin#2026' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // 2. Authenticate TEST01
    const test01Res = await request(app)
      .post('/api/v1/auth/team/login')
      .send({ teamCode: 'TEST01', pin: 'team01#2026' });
    expect(test01Res.status).toBe(200);
    test01Token = test01Res.body.token;

    // 3. Authenticate TEST02
    const test02Res = await request(app)
      .post('/api/v1/auth/team/login')
      .send({ teamCode: 'TEST02', pin: 'team02#2026' });
    expect(test02Res.status).toBe(200);
    test02Token = test02Res.body.token;

    // Reset TEST01 and TEST02 states for reliable test execution
    const testTeams = await prisma.team.findMany({
      where: { teamCode: { in: ['TEST01', 'TEST02'] } },
      include: { accessToken: true }
    });
    for (const t of testTeams) {
      await prisma.submission.deleteMany({ where: { teamId: t.id } });
      await prisma.scoreEvent.deleteMany({ where: { teamId: t.id } });
      await prisma.team.update({
        where: { id: t.id },
        data: {
          currentRound: 3,
          currentStage: 3,
          totalScore: 0,
          finalBreachCompletedAt: null,
          finalBreachPosition: null,
          finalBreachPoints: null
        }
      });
      if (t.accessToken) {
        await prisma.accessToken.update({
          where: { id: t.accessToken.id },
          data: { isRedeemed: false, redeemedAt: null }
        });
      }
    }
  });

  describe('1. Round 3 — Finishing-Order Points Formula', () => {
    it('calculates exact points per finishing position according to official specification', () => {
      expect(getRound3FinishingPoints(1)).toBe(200);
      expect(getRound3FinishingPoints(2)).toBe(175);
      expect(getRound3FinishingPoints(3)).toBe(150);
      expect(getRound3FinishingPoints(4)).toBe(125);
      expect(getRound3FinishingPoints(5)).toBe(100);
      expect(getRound3FinishingPoints(6)).toBe(75);
      expect(getRound3FinishingPoints(7)).toBe(50);
      expect(getRound3FinishingPoints(8)).toBe(25);
      expect(getRound3FinishingPoints(9)).toBe(-25);
      expect(getRound3FinishingPoints(10)).toBe(-25);
      expect(getRound3FinishingPoints(20)).toBe(-25);
    });
  });

  describe('2. Database — TEAM01 to TEAM20 Verification', () => {
    it('verifies all 20 teams (TEAM01 to TEAM20) exist in database', async () => {
      const teams = await prisma.team.findMany({
        where: {
          teamCode: {
            in: Array.from({ length: 20 }, (_, i) => `TEAM${String(i + 1).padStart(2, '0')}`)
          }
        }
      });
      expect(teams.length).toBe(20);
      const codes = new Set(teams.map(t => t.teamCode));
      for (let i = 1; i <= 20; i++) {
        const expected = `TEAM${String(i).padStart(2, '0')}`;
        expect(codes.has(expected)).toBe(true);
      }
    });
  });

  describe('3. Database — TEST01 to TEST10 Accounts Verification', () => {
    it('verifies all 10 test accounts (TEST01 to TEST10) exist with participant role TEAM', async () => {
      const usernames = Array.from({ length: 10 }, (_, i) => `TEST${String(i + 1).padStart(2, '0')}`);
      const users = await prisma.user.findMany({
        where: { username: { in: usernames } }
      });
      expect(users.length).toBe(10);
      users.forEach(u => {
        expect(u.role).toBe(UserRole.TEAM);
        expect(u.teamId).toBeTruthy();
      });
    });

    it('verifies password format team01#2026 through team10#2026 with secure hashing', async () => {
      for (let i = 1; i <= 10; i++) {
        const username = `TEST${String(i).padStart(2, '0')}`;
        const expectedPassword = `team${String(i).padStart(2, '0')}#2026`;
        const user = await prisma.user.findUnique({ where: { username } });
        expect(user).toBeTruthy();
        expect(user!.passwordHash).not.toBe(expectedPassword); // must NOT be plaintext
        const isValid = await bcrypt.compare(expectedPassword, user!.passwordHash);
        expect(isValid).toBe(true);
      }
    });

    it('verifies admin account remains intact with ADMIN role', async () => {
      const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
      expect(admin).toBeTruthy();
      expect(admin!.role).toBe(UserRole.ADMIN);
    });
  });

  describe('4. Round 1 — 20 Questions Expansion & Progression', () => {
    it('verifies exactly 20 active questions are seeded in the database', async () => {
      const count = await prisma.question.count({ where: { isActive: true } });
      expect(count).toBe(20);
    });

    it('verifies Round 1 duration is 15 minutes', async () => {
      const round1 = await prisma.roundControl.findUnique({ where: { id: 1 } });
      expect(round1).toBeTruthy();
      expect(round1!.durationMinutes).toBe(15);
    });

    it('does not leak future questions or correctOption / explanation in participant API', async () => {
      const res = await request(app)
        .get('/api/v1/round1/questions')
        .set('Authorization', `Bearer ${test01Token}`);

      expect(res.status).toBe(200);
      expect(res.body.totalQuestions).toBe(20);

      if (res.body.currentQuestion) {
        // Must contain safe fields only
        expect(res.body.currentQuestion.id).toBeTruthy();
        expect(res.body.currentQuestion.prompt).toBeTruthy();
        expect(res.body.currentQuestion.options.length).toBe(4);
        // Sensitive fields strictly omitted
        expect(res.body.currentQuestion.correctOption).toBeUndefined();
        expect(res.body.currentQuestion.explanation).toBeUndefined();
      }
    });
  });

  describe('5. Round 3 — QR Redemption Gate & Finishing-Order Execution', () => {
    it('rejects incorrect final answer without awarding a position or finishing timestamp', async () => {
      // Ensure clean state for TEST01 and TEST02 Round 3
      await prisma.team.updateMany({
        where: { teamCode: { in: ['TEST01', 'TEST02'] } },
        data: { finalBreachCompletedAt: null, finalBreachPosition: null, finalBreachPoints: null }
      });
      await prisma.scoreEvent.deleteMany({
        where: { team: { teamCode: { in: ['TEST01', 'TEST02'] } }, round: 3, stage: 3 }
      });
      await prisma.submission.deleteMany({
        where: { team: { teamCode: { in: ['TEST01', 'TEST02'] } }, round: 3, stage: 3 }
      });

      const team = await prisma.team.findUnique({ where: { teamCode: 'TEST01' }, include: { accessToken: true } });

      // Activate Round 3
      await prisma.roundControl.update({
        where: { id: 3 },
        data: { status: 'ACTIVE', startTime: new Date(), endTime: new Date(Date.now() + 30 * 60000) }
      });

      // Redeem QR first
      if (team?.accessToken && !team.accessToken.isRedeemed) {
        const qrRes = await request(app)
          .post('/api/v1/round3/qr/redeem')
          .set('Authorization', `Bearer ${test01Token}`)
          .send({ code: team.accessToken.tokenCode });
        expect(qrRes.status).toBe(200);
      }

      const res = await request(app)
        .post('/api/v1/round3/debug/submit')
        .set('Authorization', `Bearer ${test01Token}`)
        .send({ finalKey: 'WRONG_ANSWER_KEY' });

      expect(res.status).toBe(400);
      expect(res.body.isCorrect).toBe(false);
      expect(res.body.error).toBe('INVALID_FINAL_KEY');

      const refreshed = await prisma.team.findUnique({ where: { id: team!.id } });
      expect(refreshed!.finalBreachCompletedAt).toBeNull();
      expect(refreshed!.finalBreachPosition).toBeNull();
    });

    it('cannot redeem an already-redeemed QR code by another team', async () => {
      const team = await prisma.team.findUnique({ where: { teamCode: 'TEST01' }, include: { accessToken: true } });
      expect(team?.accessToken?.isRedeemed).toBe(true);

      // TEST02 tries to reuse TEST01's already-redeemed QR code
      const res = await request(app)
        .post('/api/v1/round3/qr/redeem')
        .set('Authorization', `Bearer ${test02Token}`)
        .send({ code: team!.accessToken!.tokenCode });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('CODE_ALREADY_USED');
    });

    it('correct submission awards 1st place (+200 pts) and records completion timestamp', async () => {
      const challenge = await prisma.debugChallenge.findFirst({ where: { isActive: true } });
      expect(challenge).toBeTruthy();

      const teamBefore = await prisma.team.findUnique({ where: { teamCode: 'TEST01' } });
      const initialScore = teamBefore!.totalScore;

      const res = await request(app)
        .post('/api/v1/round3/debug/submit')
        .set('Authorization', `Bearer ${test01Token}`)
        .send({ finalKey: challenge!.expectedFinalKey });

      expect(res.status).toBe(200);
      expect(res.body.isCorrect).toBe(true);
      expect(res.body.position).toBe(1);
      expect(res.body.pointsAwarded).toBe(200);
      expect(res.body.newTotalScore).toBe(initialScore + 200);

      const teamAfter = await prisma.team.findUnique({ where: { teamCode: 'TEST01' } });
      expect(teamAfter!.finalBreachCompletedAt).not.toBeNull();
      expect(teamAfter!.finalBreachPosition).toBe(1);
      expect(teamAfter!.finalBreachPoints).toBe(200);
    });

    it('second valid finisher receives position 2 (+175 pts)', async () => {
      const challenge = await prisma.debugChallenge.findFirst({ where: { isActive: true } });
      const team2 = await prisma.team.findUnique({ where: { teamCode: 'TEST02' }, include: { accessToken: true } });

      // Redeem QR for TEST02
      if (team2?.accessToken && !team2.accessToken.isRedeemed) {
        const qrRes = await request(app)
          .post('/api/v1/round3/qr/redeem')
          .set('Authorization', `Bearer ${test02Token}`)
          .send({ code: team2.accessToken.tokenCode });
        expect(qrRes.status).toBe(200);
      }

      const team2Before = await prisma.team.findUnique({ where: { teamCode: 'TEST02' } });
      const initialScore = team2Before!.totalScore;

      const res = await request(app)
        .post('/api/v1/round3/debug/submit')
        .set('Authorization', `Bearer ${test02Token}`)
        .send({ finalKey: challenge!.expectedFinalKey });

      expect(res.status).toBe(200);
      expect(res.body.isCorrect).toBe(true);
      expect(res.body.position).toBe(2);
      expect(res.body.pointsAwarded).toBe(175);
      expect(res.body.newTotalScore).toBe(initialScore + 175);

      const team2After = await prisma.team.findUnique({ where: { teamCode: 'TEST02' } });
      expect(team2After!.finalBreachPosition).toBe(2);
      expect(team2After!.finalBreachPoints).toBe(175);
    });

    it('duplicate final submission returns alreadyCompleted without awarding points again', async () => {
      const challenge = await prisma.debugChallenge.findFirst({ where: { isActive: true } });
      const team1Before = await prisma.team.findUnique({ where: { teamCode: 'TEST01' } });

      const res = await request(app)
        .post('/api/v1/round3/debug/submit')
        .set('Authorization', `Bearer ${test01Token}`)
        .send({ finalKey: challenge!.expectedFinalKey });

      expect(res.status).toBe(200);
      expect(res.body.alreadyCompleted).toBe(true);
      expect(res.body.pointsAwarded).toBe(0);
      expect(res.body.position).toBe(1);
      expect(res.body.newTotalScore).toBe(team1Before!.totalScore);
    });
  });

  describe('6. Admin Leaderboard & Winner Finalization Security', () => {
    it('blocks participant accounts from accessing the admin leaderboard', async () => {
      const res = await request(app)
        .get('/api/v1/leaderboard')
        .set('Authorization', `Bearer ${test01Token}`);

      expect(res.status).toBe(403);
    });

    it('allows authenticated administrator to access full leaderboard with R3 position and points', async () => {
      const res = await request(app)
        .get('/api/v1/leaderboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.teams)).toBe(true);

      const team01 = res.body.teams.find((t: any) => t.teamCode === 'TEST01');
      expect(team01).toBeTruthy();
      expect(team01.r3Position).toBe(1);
      expect(team01.r3Points).toBe(200);
      expect(team01.finalBreachCompletedAt).toBeTruthy();

      const team02 = res.body.teams.find((t: any) => t.teamCode === 'TEST02');
      expect(team02).toBeTruthy();
      expect(team02.r3Position).toBe(2);
      expect(team02.r3Points).toBe(175);
    });

    it('blocks participant accounts from finalizing winners', async () => {
      const res = await request(app)
        .post('/api/v1/leaderboard/winners/finalize')
        .set('Authorization', `Bearer ${test01Token}`)
        .send({ notes: 'Unauthorized attempt' });

      expect(res.status).toBe(403);
    });

    it('allows administrator to finalize and announce winners', async () => {
      const res = await request(app)
        .post('/api/v1/leaderboard/winners/finalize')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Tournament concluded and verified by chief referee.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.announcement.isFinalized).toBe(true);
      expect(res.body.announcement.finalizedByAdminUsername).toBe('admin');
      expect(res.body.announcement.winners.length).toBeGreaterThan(0);
      expect(res.body.announcement.winners[0].teamCode).toBe('TEST01');
    });

    it('allows administrator to reopen finalized standings back to provisional', async () => {
      const res = await request(app)
        .post('/api/v1/leaderboard/winners/reopen')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.announcement.isFinalized).toBe(false);
    });
  });

  describe('5. Auth Bearer Precedence & Team Submission Resolution', () => {
    it('prioritizes Authorization Bearer header over stale squid_token cookie', async () => {
      // Send admin cookie in Cookie header, but test01 Bearer in Authorization header
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [`squid_token=${adminToken}`])
        .set('Authorization', `Bearer ${test01Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Must be TEST01 team user, NOT admin
      expect(res.body.user.role).toBe('TEAM');
      expect(res.body.team.teamCode).toBe('TEST01');
      expect(res.body.user.teamId).toBe(res.body.team.id);
    });

    it('allows team to submit an answer without TEAM_REQUIRED error', async () => {
      // Fetch current question for round 1
      const qRes = await request(app)
        .get('/api/v1/round1/questions')
        .set('Authorization', `Bearer ${test01Token}`);

      expect(qRes.status).toBe(200);
      if (qRes.body.currentQuestion) {
        const submitRes = await request(app)
          .post('/api/v1/round1/submit')
          .set('Authorization', `Bearer ${test01Token}`)
          .send({
            questionId: qRes.body.currentQuestion.id,
            selectedOption: 'A'
          });

        expect(submitRes.status).not.toBe(403);
        expect(submitRes.body.error).not.toBe('TEAM_REQUIRED');
      }
    });

    it('rejects administrator round1 submission with TEAM_REQUIRED (scored submissions are team-only)', async () => {
      const qRes = await request(app)
        .get('/api/v1/round1/questions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(qRes.status).toBe(200);
      if (qRes.body.currentQuestion) {
        const submitRes = await request(app)
          .post('/api/v1/round1/submit')
          .set('Authorization', `Bearer ${adminToken}`)
          .set('x-team-code', 'TEST02')
          .send({
            questionId: qRes.body.currentQuestion.id,
            selectedOption: 'A'
          });

        expect(submitRes.status).toBe(403);
        expect(submitRes.body.error).toBe('TEAM_REQUIRED');
      }
    });
  });
});
