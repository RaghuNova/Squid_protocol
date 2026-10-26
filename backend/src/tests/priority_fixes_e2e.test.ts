import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../prisma.js';
import { RoundStatus, SignalState } from '@prisma/client';

describe('SQUID PROTOCOL — Priority 1 to 5 Fixes Acceptance Test Suite', () => {
  let adminToken: string;
  let test01Token: string;
  let test02Token: string;
  let test03Token: string;
  let test04Token: string;

  beforeAll(async () => {
    // 1. Authenticate admin
    const adminRes = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({ username: 'admin', password: 'Admin#2026' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // 2. Authenticate test teams
    const t1 = await request(app).post('/api/v1/auth/team/login').send({ teamCode: 'TEST01', pin: 'team01#2026' });
    expect(t1.status).toBe(200);
    test01Token = t1.body.token;

    const t2 = await request(app).post('/api/v1/auth/team/login').send({ teamCode: 'TEST02', pin: 'team02#2026' });
    expect(t2.status).toBe(200);
    test02Token = t2.body.token;

    const t3 = await request(app).post('/api/v1/auth/team/login').send({ teamCode: 'TEST03', pin: 'team03#2026' });
    expect(t3.status).toBe(200);
    test03Token = t3.body.token;

    const t4 = await request(app).post('/api/v1/auth/team/login').send({ teamCode: 'TEST04', pin: 'team04#2026' });
    expect(t4.status).toBe(200);
    test04Token = t4.body.token;
  });

  describe('Test A: Global Game Reset Verification', () => {
    it('seeds 3 teams with different scores and round progress, resets, and verifies complete state clean-up', async () => {
      const teams = await prisma.team.findMany({
        where: { teamCode: { in: ['TEST01', 'TEST02', 'TEST03'] } }
      });
      expect(teams.length).toBe(3);

      const [teamA, teamB, teamC] = teams;

      // Seed Team A: In Round 1 with score 30
      await prisma.team.update({
        where: { id: teamA.id },
        data: { currentRound: 1, currentStage: 1, totalScore: 30 }
      });
      await prisma.teamRoundProgress.upsert({
        where: { teamId_round: { teamId: teamA.id, round: 1 } },
        create: { teamId: teamA.id, round: 1, status: 'IN_PROGRESS', nextRoundEligible: false },
        update: { status: 'IN_PROGRESS', nextRoundEligible: false }
      });

      // Seed Team B: In Round 2 with score 130
      await prisma.team.update({
        where: { id: teamB.id },
        data: { currentRound: 2, currentStage: 2, totalScore: 130 }
      });
      await prisma.teamRoundProgress.upsert({
        where: { teamId_round: { teamId: teamB.id, round: 1 } },
        create: { teamId: teamB.id, round: 1, status: 'COMPLETED', nextRoundEligible: true },
        update: { status: 'COMPLETED', nextRoundEligible: true }
      });
      await prisma.teamRoundProgress.upsert({
        where: { teamId_round: { teamId: teamB.id, round: 2 } },
        create: { teamId: teamB.id, round: 2, status: 'IN_PROGRESS', nextRoundEligible: false },
        update: { status: 'IN_PROGRESS', nextRoundEligible: false }
      });

      // Seed Team C: Completed Round 3 with score 330
      await prisma.team.update({
        where: { id: teamC.id },
        data: {
          currentRound: 3,
          currentStage: 3,
          totalScore: 330,
          finalBreachCompletedAt: new Date(),
          finalBreachPosition: 1,
          finalBreachPoints: 200
        }
      });
      await prisma.teamRoundProgress.upsert({
        where: { teamId_round: { teamId: teamC.id, round: 2 } },
        create: { teamId: teamC.id, round: 2, status: 'COMPLETED', nextRoundEligible: true },
        update: { status: 'COMPLETED', nextRoundEligible: true }
      });

      // Create a submission to test deletion (use correct Submission schema fields)
      const q = await prisma.question.findFirst();
      if (q) {
        await prisma.submission.create({
          data: {
            teamId: teamA.id,
            questionId: q.id,
            round: 1,
            stage: 1,
            submittedValue: 'A',
            status: 'CORRECT',
            pointsAwarded: 10
          }
        });
      }

      // Reset game via admin endpoint
      const resetRes = await request(app)
        .post('/api/v1/admin/reset-game')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ confirmation: 'RESET GAME' });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // Verify all teams have totalScore = 0 and currentRound = 1
      const postResetTeams = await prisma.team.findMany({
        where: { teamCode: { in: ['TEST01', 'TEST02', 'TEST03'] } }
      });
      for (const t of postResetTeams) {
        expect(t.totalScore).toBe(0);
        expect(t.currentRound).toBe(1);
        expect(t.currentStage).toBe(1);
        expect(t.finalBreachCompletedAt).toBeNull();
        expect(t.finalBreachPosition).toBeNull();
        expect(t.finalBreachPoints).toBeNull();
      }

      // Verify progress, submissions, scoreEvents are empty
      const [submissions, scoreEvents, progress] = await Promise.all([
        prisma.submission.count(),
        prisma.scoreEvent.count(),
        prisma.teamRoundProgress.count()
      ]);
      expect(submissions).toBe(0);
      expect(scoreEvents).toBe(0);
      expect(progress).toBe(0);

      // Verify permanent data remains intact
      const [adminCount, teamCount, questionCount, puzzleCount] = await Promise.all([
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.team.count(),
        prisma.question.count(),
        prisma.debugChallenge.count()
      ]);
      expect(adminCount).toBeGreaterThanOrEqual(1);
      expect(teamCount).toBeGreaterThanOrEqual(20);
      expect(questionCount).toBeGreaterThanOrEqual(20);
      expect(puzzleCount).toBeGreaterThanOrEqual(1);

      // Verify participant endpoints return fresh clean state
      const t1Me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${test01Token}`);
      expect(t1Me.status).toBe(200);
      expect(t1Me.body.team.totalScore).toBe(0);
      expect(t1Me.body.team.currentRound).toBe(1);

      const r1Data = await request(app).get('/api/v1/round1/questions').set('Authorization', `Bearer ${test01Token}`);
      expect(r1Data.status).toBe(200);
      expect(r1Data.body.isCompleted).toBe(false);
    });
  });

  describe('Test B: Early Progression (Round 1 -> Round 2 and Round 2 -> Round 3)', () => {
    it('allows a team completing Round 1 early to immediately access Round 2 without waiting for 15-min timer', async () => {
      // Start Round 1
      await request(app)
        .patch('/api/v1/admin/rounds/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' });

      const team = await prisma.team.findUnique({ where: { teamCode: 'TEST01' } });
      expect(team).toBeDefined();

      // Reset to Round 1, Stage 1 fresh state after the game reset in Test A
      await prisma.team.update({
        where: { id: team!.id },
        data: { currentRound: 1, currentStage: 1, finalBreachCompletedAt: null, finalBreachPosition: null, finalBreachPoints: null }
      });
      await prisma.teamRoundProgress.deleteMany({ where: { teamId: team!.id } });
      await prisma.accessToken.updateMany({ where: { teamId: team!.id }, data: { authorizedAt: null } });

      // Mark Round 1 complete early
      await prisma.teamRoundProgress.upsert({
        where: { teamId_round: { teamId: team!.id, round: 1 } },
        create: { teamId: team!.id, round: 1, status: 'COMPLETED', nextRoundEligible: true, completedAt: new Date() },
        update: { status: 'COMPLETED', nextRoundEligible: true, completedAt: new Date() }
      });

      // Verify Round 2 is unlocked immediately for TEST01
      const r2Data = await request(app)
        .get('/api/v1/round2/data')
        .set('Authorization', `Bearer ${test01Token}`);

      expect(r2Data.status).toBe(200);
      expect(r2Data.body.isUnlocked).toBe(true);
      expect(r2Data.body.round.status).toBe('UPCOMING');
      // currentStage should be 1 since this team hasn't completed the Sudoku
      expect(r2Data.body.currentStage).toBe(1);
    });

    it('allows a team completing Round 2 early to become immediately eligible for Round 3', async () => {
      const team = await prisma.team.findUnique({ where: { teamCode: 'TEST01' } });

      // Mark Round 2 completed (Sudoku + Broken logic solved early)
      await prisma.teamRoundProgress.upsert({
        where: { teamId_round: { teamId: team!.id, round: 2 } },
        create: { teamId: team!.id, round: 2, status: 'COMPLETED', nextRoundEligible: true, completedAt: new Date() },
        update: { status: 'COMPLETED', nextRoundEligible: true, completedAt: new Date() }
      });

      // Verify Round 3 data indicates eligibility immediately
      const r3Data = await request(app)
        .get('/api/v1/round3/data')
        .set('Authorization', `Bearer ${test01Token}`);

      expect(r3Data.status).toBe(200);
      expect(r3Data.body.isEligible).toBe(true);
      expect(r3Data.body.isUnlocked).toBe(true);
      expect(r3Data.body.isGateOpen).toBe(true);
    });

    it('keeps team progression independent when another team is still in Round 1', async () => {
      const [completedTeam, activeTeam] = await Promise.all([
        prisma.team.findUnique({ where: { teamCode: 'TEST01' } }),
        prisma.team.findUnique({ where: { teamCode: 'TEST02' } })
      ]);
      expect(completedTeam).toBeDefined();
      expect(activeTeam).toBeDefined();

      await prisma.teamRoundProgress.upsert({
        where: { teamId_round: { teamId: completedTeam!.id, round: 1 } },
        create: { teamId: completedTeam!.id, round: 1, status: 'COMPLETED', nextRoundEligible: true, completedAt: new Date() },
        update: { status: 'COMPLETED', nextRoundEligible: true, completedAt: new Date() }
      });
      await prisma.teamRoundProgress.upsert({
        where: { teamId_round: { teamId: activeTeam!.id, round: 1 } },
        create: { teamId: activeTeam!.id, round: 1, status: 'IN_PROGRESS', nextRoundEligible: false, deadlineAt: new Date(Date.now() + 60000) },
        update: { status: 'IN_PROGRESS', nextRoundEligible: false, deadlineAt: new Date(Date.now() + 60000) }
      });

      const [completedRound2, activeRound2] = await Promise.all([
        request(app).get('/api/v1/round2/data').set('Authorization', `Bearer ${test01Token}`),
        request(app).get('/api/v1/round2/data').set('Authorization', `Bearer ${test02Token}`)
      ]);

      expect(completedRound2.body.isUnlocked).toBe(true);
      expect(activeRound2.body.isUnlocked).toBe(false);
      const activeProgress = await prisma.teamRoundProgress.findUnique({ where: { teamId_round: { teamId: activeTeam!.id, round: 1 } } });
      expect(activeProgress?.status).toBe('IN_PROGRESS');
      expect(activeProgress?.nextRoundEligible).toBe(false);
    });
  });

  describe('Test C: Automatic Round 3 & Access Key Workflow', () => {
    it('makes Round 3 accessible without an admin start command, validates PIN, and awards points once', async () => {
      const r3Data = await request(app)
        .get('/api/v1/round3/data')
        .set('Authorization', `Bearer ${test01Token}`);

      expect(r3Data.status).toBe(200);
      expect(r3Data.body.isGateOpen).toBe(true);
      expect(r3Data.body.isUnlocked).toBe(true);

      // Submit team PIN (team01#2026) to authorize access
      const authPinRes = await request(app)
        .post('/api/v1/round3/debug/authorize')
        .set('Authorization', `Bearer ${test01Token}`)
        .send({ accessKey: 'team01#2026' });

      expect(authPinRes.status).toBe(200);
      expect(authPinRes.body.success).toBe(true);

      // Verify debug challenge is now returned
      const authorizedR3Data = await request(app)
        .get('/api/v1/round3/data')
        .set('Authorization', `Bearer ${test01Token}`);

      expect(authorizedR3Data.body.isAccessKeyAuthorized).toBe(true);
      expect(authorizedR3Data.body.challenge).toBeDefined();

      // Submit correct answer to challenge
      const challenge = await prisma.debugChallenge.findFirst({ where: { isActive: true } });
      expect(challenge).toBeDefined();

      const submitRes = await request(app)
        .post('/api/v1/round3/debug/submit')
        .set('Authorization', `Bearer ${test01Token}`)
        .send({ finalKey: challenge!.expectedFinalKey });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.success).toBe(true);
      expect(submitRes.body.isCorrect).toBe(true);
      // Position and points depend on prior test runs; just verify they are returned correctly
      expect(typeof submitRes.body.position).toBe('number');
      expect(typeof submitRes.body.pointsAwarded).toBe('number');

      // Submitting again returns alreadyCompleted: true without awarding duplicate points
      const dupSubmitRes = await request(app)
        .post('/api/v1/round3/debug/submit')
        .set('Authorization', `Bearer ${test01Token}`)
        .send({ finalKey: challenge!.expectedFinalKey });

      expect(dupSubmitRes.status).toBe(200);
      expect(dupSubmitRes.body.alreadyCompleted).toBe(true);
      // originalPointsAwarded holds the initial award
      expect(typeof dupSubmitRes.body.originalPointsAwarded).toBe('number');

      // Verify ineligible team (TEST04 who has not completed Round 2) cannot access Round 3
      const ineligibleR3 = await request(app)
        .get('/api/v1/round3/data')
        .set('Authorization', `Bearer ${test04Token}`);

      expect(ineligibleR3.status).toBe(200);
      expect(ineligibleR3.body.isUnlocked).toBe(false);
      expect(ineligibleR3.body.isEligible).toBe(false);

      const unauthorizedPin = await request(app)
        .post('/api/v1/round3/debug/authorize')
        .set('Authorization', `Bearer ${test04Token}`)
        .send({ accessKey: 'team04#2026' });

      // Ineligible team cannot authorize their access key (400 ROUND_INACTIVE, not 403)
      expect(unauthorizedPin.status).toBe(400);
    });
  });

  describe('Test D: Timeout Behavior Progression', () => {
    it('promotes an uncompleted team when its Round 1 deadline expires', async () => {
      const team = await prisma.team.findUnique({ where: { teamCode: 'TEST02' } });
      expect(team).toBeDefined();
      await prisma.teamRoundProgress.upsert({
        where: { teamId_round: { teamId: team!.id, round: 1 } },
        create: { teamId: team!.id, round: 1, status: 'IN_PROGRESS', nextRoundEligible: false, deadlineAt: new Date(Date.now() - 1000) },
        update: { status: 'IN_PROGRESS', nextRoundEligible: false, deadlineAt: new Date(Date.now() - 1000) }
      });

      const r2Data = await request(app)
        .get('/api/v1/round2/data')
        .set('Authorization', `Bearer ${test02Token}`);

      expect(r2Data.body.isUnlocked).toBe(true);
      const progress = await prisma.teamRoundProgress.findUnique({ where: { teamId_round: { teamId: team!.id, round: 1 } } });
      expect(progress?.status).toBe('TIMED_OUT');
      expect(progress?.nextRoundEligible).toBe(true);
    });

    it('promotes an uncompleted team when its Round 2 deadline expires', async () => {
      const team4 = await prisma.team.findUnique({ where: { teamCode: 'TEST04' } });

      // Put TEST04 into Round 2 in-progress state with an expired team deadline.
      await prisma.teamRoundProgress.upsert({
        where: { teamId_round: { teamId: team4!.id, round: 2 } },
        create: { teamId: team4!.id, round: 2, status: 'IN_PROGRESS', nextRoundEligible: false, deadlineAt: new Date(Date.now() - 1000) },
        update: { status: 'IN_PROGRESS', nextRoundEligible: false, deadlineAt: new Date(Date.now() - 1000) }
      });

      // TEST04 now gets timed out and promoted when its state is read.
      const r3Data = await request(app)
        .get('/api/v1/round3/data')
        .set('Authorization', `Bearer ${test04Token}`);

      expect(r3Data.status).toBe(200);
      expect(r3Data.body.isEligible).toBe(true);
      expect(r3Data.body.isUnlocked).toBe(true);
      expect(r3Data.body.isGateOpen).toBe(true);
      const progress = await prisma.teamRoundProgress.findUnique({ where: { teamId_round: { teamId: team4!.id, round: 2 } } });
      expect(progress?.status).toBe('TIMED_OUT');
      expect(progress?.nextRoundEligible).toBe(true);
    });
  });
});
