import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { app } from '../app.js';
import { prisma } from '../prisma.js';
import { resetEnvironmentAllowed } from '../controllers/adminTestController.js';

describe('SQUID PROTOCOL — Comprehensive API & Game Engine Test Suite', () => {
  let teamToken: string;
  let adminToken: string;
  let testTeam: any;
  let question1: any;
  let question2: any;
  let question3: any;
  let question4: any;
  let question5: any;

  beforeAll(async () => {
    testTeam = await prisma.team.findUnique({
      where: { teamCode: 'TEAM01' },
      include: { user: true, accessToken: true }
    });

    question1 = await prisma.question.findUnique({ where: { orderIndex: 1 } });
    question2 = await prisma.question.findUnique({ where: { orderIndex: 2 } });
    question3 = await prisma.question.findUnique({ where: { orderIndex: 3 } });
    question4 = await prisma.question.findUnique({ where: { orderIndex: 4 } });
    question5 = await prisma.question.findUnique({ where: { orderIndex: 5 } });

    // Clean test state for testTeam to ensure repeatable runs
    await prisma.submission.deleteMany({ where: { teamId: testTeam.id } });
    await prisma.scoreEvent.deleteMany({ where: { teamId: testTeam.id } });
    await prisma.physicalVerification.deleteMany({ where: { teamId: testTeam.id } });
    await prisma.team.update({
      where: { id: testTeam.id },
      data: { currentRound: 1, currentStage: 1, totalScore: 0, finalBreachCompletedAt: null }
    });

    // Reset access token state for team
    if (testTeam.accessToken) {
      await prisma.accessToken.update({
        where: { id: testTeam.accessToken.id },
        data: { isRedeemed: false, redeemedAt: null, accessKey: null, authorizedAt: null }
      });
    }

    // Reset round controls to clean known state
    await prisma.roundControl.update({
      where: { id: 1 },
      data: {
        status: 'ACTIVE',
        signalState: 'GREEN',
        redLightPenaltyMode: false,
        doublePointsEnabled: false,
        startTime: new Date(),
        endTime: new Date(Date.now() + 15 * 60000),
        pausedAt: null,
        remainingSeconds: 900
      }
    });

    await prisma.roundControl.update({
      where: { id: 2 },
      data: { status: 'UPCOMING', startTime: null, endTime: null, pausedAt: null, remainingSeconds: 1200 }
    });

    await prisma.roundControl.update({
      where: { id: 3 },
      data: { status: 'UPCOMING', startTime: null, endTime: null, pausedAt: null, remainingSeconds: 1800 }
    });

    // 1. Team Login
    const teamRes = await request(app)
      .post('/api/v1/auth/team/login')
      .send({ teamCode: 'TEAM01', pin: 'team01#2026' });

    expect(teamRes.status).toBe(200);
    teamToken = teamRes.body.token;

    // 2. Admin Login
    let adminRes = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({ username: 'admin', password: 'Admin#2026' });
    if (adminRes.status !== 200) {
      adminRes = await request(app)
        .post('/api/v1/auth/admin/login')
        .send({ username: 'admin', password: 'AdminMaster#2026' });
    }

    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;
  });

  describe('1. Health and Liveness Probes', () => {
    it('GET /health/live returns 200 OK', async () => {
      const res = await request(app).get('/health/live');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /health/ready returns 200 with connected database', async () => {
      const res = await request(app).get('/health/ready');
      expect(res.status).toBe(200);
      expect(res.body.database).toBe('connected');
    });
  });

  describe('2. Authentication & Authorization Security', () => {
    it('uses team-specific PINs for separate team accounts', async () => {
      const team02Res = await request(app)
        .post('/api/v1/auth/team/login')
        .send({ teamCode: 'TEAM02', pin: 'team02#2026' });
      expect(team02Res.status).toBe(200);
      expect(team02Res.body.team.teamCode).toBe('TEAM02');
    });

    it('rejects team login with incorrect PIN', async () => {
      const res = await request(app)
        .post('/api/v1/auth/team/login')
        .send({ teamCode: 'TEAM01', pin: 'wrong-pin-0000' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('blocks unauthenticated access to /api/v1/admin/dashboard', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard');
      expect(res.status).toBe(401);
    });

    it('blocks team account from accessing /api/v1/admin routes', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${teamToken}`);
      expect(res.status).toBe(403);
    });

    it('allows admin to access /api/v1/admin/dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
    });

    it('rejects volunteer login to admin dashboard', async () => {
      const volRes = await request(app)
        .post('/api/v1/auth/admin/login')
        .send({ username: 'volunteer', password: 'Volunteer#2026' });
      expect(volRes.status).toBe(401);
    });

    it('strictly forbids teams and public from accessing /api/v1/leaderboard', async () => {
      // Unauthenticated
      const publicRes = await request(app).get('/api/v1/leaderboard');
      expect(publicRes.status).toBe(401);

      // Team account
      const teamRes = await request(app)
        .get('/api/v1/leaderboard')
        .set('Authorization', `Bearer ${teamToken}`);
      expect(teamRes.status).toBe(403);

      // Admin account
      const adminRes = await request(app)
        .get('/api/v1/leaderboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.teams).toBeDefined();
    });
  });

  describe('3. Round 1 — One-Question-at-a-Time & Authoritative Scoring Rules', () => {
    it('delivers only the currently available question without secret answers', async () => {
      const res = await request(app)
        .get('/api/v1/round1/questions')
        .set('Authorization', `Bearer ${teamToken}`);

      expect(res.status).toBe(200);
      expect(res.body.currentQuestion).toBeDefined();
      expect(res.body.currentQuestion.orderIndex).toBe(1);
      expect(res.body.currentQuestion.correctOption).toBeUndefined();
      expect(res.body.currentQuestion.explanation).toBeUndefined();
      expect(res.body.questionNumber).toBe(1);
    });

    it('rejects out-of-order submission (attempting Question 5 before Question 1)', async () => {
      const res = await request(app)
        .post('/api/v1/round1/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({
          questionId: question5.id,
          selectedOption: 'A'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('OUT_OF_ORDER_SUBMISSION');
    });

    it('A correct answer during Green Light earns +100 points', async () => {
      // Ensure Green Light, Double Points OFF
      await request(app)
        .post('/api/v1/admin/signal')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ signalState: 'GREEN', doublePointsEnabled: false });

      const res = await request(app)
        .post('/api/v1/round1/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({
          questionId: question1.id,
          selectedOption: question1.correctOption
        });

      expect(res.status).toBe(200);
      expect(res.body.isCorrect).toBe(true);
      expect(res.body.pointsAwarded).toBe(100);
      expect(res.body.status).toBe('CORRECT');
      expect(res.body.newTotalScore).toBe(100);
    });

    it('unlocks Question 2 after Question 1 is submitted', async () => {
      const res = await request(app)
        .get('/api/v1/round1/questions')
        .set('Authorization', `Bearer ${teamToken}`);

      expect(res.status).toBe(200);
      expect(res.body.currentQuestion.orderIndex).toBe(2);
      expect(res.body.questionNumber).toBe(2);
    });

    it('A wrong answer during Green Light deducts 50 points (-50)', async () => {
      const wrongOption = question2.correctOption === 'A' ? 'B' : 'A';

      const res = await request(app)
        .post('/api/v1/round1/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({
          questionId: question2.id,
          selectedOption: wrongOption
        });

      expect(res.status).toBe(200);
      expect(res.body.isCorrect).toBe(false);
      expect(res.body.pointsAwarded).toBe(-50);
      expect(res.body.status).toBe('INCORRECT');
      expect(res.body.newTotalScore).toBe(50); // 100 - 50 = 50
    });

    it('A correct Double Points answer during Green Light earns +200 points', async () => {
      // Admin turns Double Points ON
      await request(app)
        .post('/api/v1/admin/signal')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ signalState: 'GREEN', doublePointsEnabled: true });

      const res = await request(app)
        .post('/api/v1/round1/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({
          questionId: question3.id,
          selectedOption: question3.correctOption
        });

      expect(res.status).toBe(200);
      expect(res.body.isCorrect).toBe(true);
      expect(res.body.pointsAwarded).toBe(200);
      expect(res.body.status).toBe('CORRECT');
      expect(res.body.newTotalScore).toBe(250); // 50 + 200 = 250
    });

    it('A wrong Double Points answer during Green Light deducts 100 points (-100)', async () => {
      const wrongOption = question4.correctOption === 'A' ? 'B' : 'A';

      const res = await request(app)
        .post('/api/v1/round1/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({
          questionId: question4.id,
          selectedOption: wrongOption
        });

      expect(res.status).toBe(200);
      expect(res.body.isCorrect).toBe(false);
      expect(res.body.pointsAwarded).toBe(-100);
      expect(res.body.status).toBe('INCORRECT');
      expect(res.body.newTotalScore).toBe(150); // 250 - 100 = 150
    });

    it('A submission during Red Light deducts 50 points in normal mode', async () => {
      // Admin sets signal to RED, Double Points OFF
      await request(app)
        .post('/api/v1/admin/signal')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ signalState: 'RED', doublePointsEnabled: false });

      const res = await request(app)
        .post('/api/v1/round1/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({
          questionId: question5.id,
          selectedOption: 'A'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('PENALIZED');
      expect(res.body.isCorrect).toBe(false);
      expect(res.body.pointsAwarded).toBe(-50);
      expect(res.body.newTotalScore).toBe(100); // 150 - 50 = 100
    });

    it('A submission during Red Light deducts 100 points in Double Points mode', async () => {
      // Admin turns Double Points ON while signal is RED
      await request(app)
        .post('/api/v1/admin/signal')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ signalState: 'RED', doublePointsEnabled: true });

      const q6 = await prisma.question.findUnique({ where: { orderIndex: 6 } });

      const res = await request(app)
        .post('/api/v1/round1/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({
          questionId: q6!.id,
          selectedOption: 'A'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('PENALIZED');
      expect(res.body.isCorrect).toBe(false);
      expect(res.body.pointsAwarded).toBe(-100);
      expect(res.body.newTotalScore).toBe(0); // 100 - 100 = 0
    });

    it('A correct answer submitted during Red Light does not earn positive points', async () => {
      await request(app)
        .post('/api/v1/admin/signal')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ signalState: 'RED', doublePointsEnabled: false });

      const q7 = await prisma.question.findUnique({ where: { orderIndex: 7 } });

      const res = await request(app)
        .post('/api/v1/round1/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({
          questionId: q7!.id,
          selectedOption: q7!.correctOption // Actual correct answer
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('PENALIZED');
      expect(res.body.isCorrect).toBe(false);
      expect(res.body.pointsAwarded).toBe(-50); // Penalty applied, no positive points!
    });

    it('A Red Light submission does not incur both Red Light penalty and wrong-answer penalty', async () => {
      const q8 = await prisma.question.findUnique({ where: { orderIndex: 8 } });
      const teamBefore = await prisma.team.findUnique({ where: { id: testTeam.id } });
      const scoreBefore = teamBefore!.totalScore;

      const res = await request(app)
        .post('/api/v1/round1/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({
          questionId: q8!.id,
          selectedOption: 'D'
        });

      expect(res.status).toBe(200);
      expect(res.body.pointsAwarded).toBe(-50); // Single penalty, not -100!
      expect(res.body.newTotalScore).toBe(scoreBefore - 50);
    });

    it('A duplicate submission does not award or deduct points twice (idempotent)', async () => {
      const teamBefore = await prisma.team.findUnique({ where: { id: testTeam.id } });
      const scoreBefore = teamBefore!.totalScore;

      // Resubmit Question 1
      const res = await request(app)
        .post('/api/v1/round1/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({
          questionId: question1.id,
          selectedOption: question1.correctOption
        });

      expect(res.status).toBe(200);
      expect(res.body.alreadySubmitted).toBe(true);
      expect(res.body.newTotalScore).toBe(scoreBefore);
    });

    it('A repeated network request does not create another score event', async () => {
      const eventsBefore = await prisma.scoreEvent.count({
        where: { teamId: testTeam.id, source: `ROUND1_Q_1` }
      });
      expect(eventsBefore).toBe(1);

      await request(app)
        .post('/api/v1/round1/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({
          questionId: question1.id,
          selectedOption: question1.correctOption
        });

      const eventsAfter = await prisma.scoreEvent.count({
        where: { teamId: testTeam.id, source: `ROUND1_Q_1` }
      });
      expect(eventsAfter).toBe(1);
    });

    it('Pausing Round 1 rejects submissions with ROUND_PAUSED and freezes timer', async () => {
      // Pause Round 1 via Admin
      await request(app)
        .put('/api/v1/admin/rounds/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ pauseTimer: true });

      const q9 = await prisma.question.findUnique({ where: { orderIndex: 9 } });

      const res = await request(app)
        .post('/api/v1/round1/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({
          questionId: q9!.id,
          selectedOption: q9!.correctOption
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ROUND_PAUSED');

      // Resume Round 1
      await request(app)
        .put('/api/v1/admin/rounds/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ resumeTimer: true });
    });

    it('A submission after the deadline is rejected without changing score', async () => {
      await prisma.roundControl.update({
        where: { id: 1 },
        data: { endTime: new Date(Date.now() - 60000) }
      });

      const q9 = await prisma.question.findUnique({ where: { orderIndex: 9 } });

      const res = await request(app)
        .post('/api/v1/round1/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({
          questionId: q9!.id,
          selectedOption: q9!.correctOption
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ROUND_EXPIRED');

      // Restore deadline
      await prisma.roundControl.update({
        where: { id: 1 },
        data: { endTime: new Date(Date.now() + 15 * 60000) }
      });
    });

    it('The frontend cannot force isCorrect or points in payload', async () => {
      await request(app)
        .post('/api/v1/admin/signal')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ signalState: 'GREEN', doublePointsEnabled: false });

      const q9 = await prisma.question.findUnique({ where: { orderIndex: 9 } });
      const wrongOption = q9!.correctOption === 'A' ? 'B' : 'A';

      const res = await request(app)
        .post('/api/v1/round1/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({
          questionId: q9!.id,
          selectedOption: wrongOption,
          isCorrect: true, // Attempted tamper
          points: 1000     // Attempted tamper
        });

      expect(res.status).toBe(200);
      expect(res.body.isCorrect).toBe(false);
      expect(res.body.pointsAwarded).toBe(-50);
      expect(res.body.status).toBe('INCORRECT');
    });

    it('The admin can enable and disable Double Points independently', async () => {
      const onRes = await request(app)
        .post('/api/v1/admin/signal')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ doublePointsEnabled: true });

      expect(onRes.status).toBe(200);
      expect(onRes.body.round.doublePointsEnabled).toBe(true);

      const offRes = await request(app)
        .post('/api/v1/admin/signal')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ doublePointsEnabled: false });

      expect(offRes.status).toBe(200);
      expect(offRes.body.round.doublePointsEnabled).toBe(false);
    });

    it('Participants cannot enable Double Points or call admin signal endpoint', async () => {
      const res = await request(app)
        .post('/api/v1/admin/signal')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({ doublePointsEnabled: true });

      expect(res.status).toBe(403);
    });

    it('Red Light with wrong answer applies exactly single Red Light penalty and does not reveal correctness', async () => {
      await request(app)
        .post('/api/v1/admin/signal')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ signalState: 'RED', doublePointsEnabled: false });

      const q10 = await prisma.question.findUnique({ where: { orderIndex: 10 } });
      const wrongOption = q10!.correctOption === 'A' ? 'B' : 'A';

      const res = await request(app)
        .post('/api/v1/round1/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({
          questionId: q10!.id,
          selectedOption: wrongOption
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('PENALIZED');
      expect(res.body.isCorrect).toBe(false);
      expect(res.body.pointsAwarded).toBe(-50);
      expect(res.body.message).toContain('RED LIGHT');
      // Must not reveal answer correctness
      expect(res.body.message).not.toContain('Wrong');
      expect(res.body.message).not.toContain('Correct');
    });
  });

  describe('4. Round 2 — The Logic Protocol', () => {
    it('locks Round 2 when UPCOMING and does not leak puzzles', async () => {
      const res = await request(app)
        .get('/api/v1/round2/data')
        .set('Authorization', `Bearer ${teamToken}`);

      expect(res.status).toBe(200);
      expect(res.body.isUnlocked).toBe(false);
      expect(res.body.sudoku).toBeNull();
    });

    it('locks Stage 2 Broken Logic before Sudoku is completed', async () => {
      // Admin starts Round 2 (which ends Round 1)
      await request(app)
        .put('/api/v1/admin/rounds/2')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ startTimer: true });

      const res = await request(app)
        .post('/api/v1/round2/broken-logic/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({ submittedOutput: '22' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('STAGE_LOCKED');
    });

    it('rejects invalid Sudoku grid', async () => {
      const res = await request(app)
        .post('/api/v1/round2/sudoku/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({ submittedGrid: 'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS' });

      expect(res.status).toBe(400);
      expect(res.body.isCorrect).toBe(false);
    });

    it('accepts mathematically valid unique Sudoku solution (+100) and unlocks Broken Logic', async () => {
      const puzzle = await prisma.sudokuPuzzle.findFirst();

      const res = await request(app)
        .post('/api/v1/round2/sudoku/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({ submittedGrid: puzzle!.solutionGrid });

      expect(res.status).toBe(200);
      expect(res.body.isCorrect).toBe(true);
      expect(res.body.pointsAwarded).toBe(100);
      expect(res.body.stageUnlocked).toBe(2);
    });

    it('accepts correct Broken Logic answer (+200)', async () => {
      const res = await request(app)
        .post('/api/v1/round2/broken-logic/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({ submittedOutput: '22' });

      expect(res.status).toBe(200);
      expect(res.body.isCorrect).toBe(true);
      expect(res.body.pointsAwarded).toBe(200);
    });
  });

  describe('5. Round 3 — QR Redemption Gate & Final Online Debugging Challenge', () => {
    beforeAll(async () => {
      await prisma.teamRoundProgress.upsert({
        where: { teamId_round: { teamId: testTeam.id, round: 2 } },
        create: { teamId: testTeam.id, round: 2, status: 'COMPLETED', nextRoundEligible: true, completedAt: new Date() },
        update: { status: 'COMPLETED', nextRoundEligible: true, completedAt: new Date() }
      });
    });

    it('does not expose a QR redemption secret from the Round 3 read endpoint', async () => {
      const teamWithToken = await prisma.team.findUnique({ where: { id: testTeam.id }, include: { accessToken: true } });
      const res = await request(app).get('/api/v1/round3/data').set('Authorization', `Bearer ${teamToken}`);
      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body)).not.toContain(teamWithToken!.accessToken!.tokenCode);
      expect(res.body).not.toHaveProperty('tokenCode');
    });
    it('verifies Java, Python, and C challenge code versions produce the exact same result', async () => {
      const challenge = await prisma.debugChallenge.findFirst({ where: { isActive: true } });
      expect(challenge).toBeDefined();

      const expectedOutput = challenge!.expectedFinalKey; // "PROTOCOL_BREACH_1040"
      expect(expectedOutput).toBe('PROTOCOL_BREACH_1040');

      // Algorithm verification in TypeScript
      const data = [12, 25, 34, 47, 58, 63, 72, 81];
      let tsChecksum = 0;
      for (const b of data) {
        if (b % 2 === 0) {
          tsChecksum += ((b << 2) + 3);
        } else {
          tsChecksum += (b ^ 0x4B);
        }
      }
      expect(`PROTOCOL_BREACH_${tsChecksum}`).toBe(expectedOutput);

      const tmpDir = os.tmpdir();

      // 1. Test Python execution with corrected precedence if python runtime is present
      const pythonCmd = (() => {
        for (const cmd of ['py -3', 'python', 'python3']) {
          try {
            execSync(`${cmd} --version`, { stdio: 'ignore' });
            return cmd;
          } catch {
            // try next
          }
        }
        return null;
      })();

      if (pythonCmd) {
        const pythonCorrected = challenge!.pythonCode.replace('checksum += b << 2 + 3', 'checksum += ((b << 2) + 3)');
        const tmpPy = path.join(tmpDir, `test_checksum_${Date.now()}.py`);
        fs.writeFileSync(tmpPy, pythonCorrected);
        try {
          const pyResult = execSync(`${pythonCmd} "${tmpPy}"`).toString().trim();
          expect(pyResult).toBe(expectedOutput);
        } finally {
          if (fs.existsSync(tmpPy)) fs.unlinkSync(tmpPy);
        }
      }

      // 2. Test C execution with corrected precedence if gcc is present
      const hasGcc = (() => {
        try {
          execSync('gcc --version', { stdio: 'ignore' });
          return true;
        } catch {
          return false;
        }
      })();

      if (hasGcc) {
        const cCorrected = challenge!.cCode.replace('checksum += b << 2 + 3;', 'checksum += ((b << 2) + 3);');
        const tmpC = path.join(tmpDir, `test_checksum_${Date.now()}.c`);
        const binExt = process.platform === 'win32' ? '.exe' : '';
        const tmpCBin = path.join(tmpDir, `test_checksum_bin_${Date.now()}${binExt}`);
        fs.writeFileSync(tmpC, cCorrected);
        try {
          execSync(`gcc "${tmpC}" -o "${tmpCBin}"`);
          const cResult = execSync(`"${tmpCBin}"`).toString().trim();
          expect(cResult).toBe(expectedOutput);
        } finally {
          if (fs.existsSync(tmpC)) fs.unlinkSync(tmpC);
          if (fs.existsSync(tmpCBin)) fs.unlinkSync(tmpCBin);
        }
      }

      // 3. Test Java execution with corrected precedence if java & javac are present
      const hasJava = (() => {
        try {
          execSync('javac -version', { stdio: 'ignore' });
          execSync('java -version', { stdio: 'ignore' });
          return true;
        } catch {
          return false;
        }
      })();

      if (hasJava) {
        const javaCorrected = challenge!.javaCode.replace('checksum += b << 2 + 3;', 'checksum += ((b << 2) + 3);');
        const tmpJavaDir = fs.mkdtempSync(path.join(tmpDir, 'java_test_'));
        const tmpJava = path.join(tmpJavaDir, 'KernelChecksum.java');
        fs.writeFileSync(tmpJava, javaCorrected);
        try {
          execSync(`javac "${tmpJava}"`);
          const javaResult = execSync(`java -cp "${tmpJavaDir}" KernelChecksum`).toString().trim();
          expect(javaResult).toBe(expectedOutput);
        } finally {
          fs.rmSync(tmpJavaDir, { recursive: true, force: true });
        }
      }
    });

    it('rejects obsolete volunteer cup verification endpoint', async () => {
      const res = await request(app)
        .post('/api/v1/round3/cup/verify')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({ teamId: testTeam.id });

      expect(res.status).toBe(404);
    });

    it('rejects debugging submission before validating the team access PIN', async () => {
      // Clean previous final completions so testTeam can reliably test 1st place (+200 pts)
      await prisma.team.updateMany({
        data: { finalBreachCompletedAt: null, finalBreachPosition: null, finalBreachPoints: null }
      });
      await prisma.scoreEvent.deleteMany({
        where: { round: 3, stage: 3 }
      });

      // Admin starts Round 3
      await request(app)
        .put('/api/v1/admin/rounds/3')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ startTimer: true });

      const res = await request(app)
        .post('/api/v1/round3/debug/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({ finalKey: 'PROTOCOL_BREACH_1040' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ACCESS_KEY_REQUIRED');
    });

    it('rejects invalid QR redemption code', async () => {
      const res = await request(app)
        .post('/api/v1/round3/qr/mobile-redeem')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({ code: 'INVALID_QR_TOKEN_9999' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_QR_CODE');
    });

    it('accepts the team login PIN and unlocks the debugging challenge without QR redemption', async () => {
      const pendingData = await request(app).get('/api/v1/round3/data').set('Authorization', `Bearer ${teamToken}`);
      expect(pendingData.body.challenge).toBeNull();

      const wrongPin = await request(app)
        .post('/api/v1/round3/debug/authorize')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({ accessKey: 'TEAM02#2026' });
      expect(wrongPin.status).toBe(400);
      expect(wrongPin.body.error).toBe('INVALID_ACCESS_KEY');

      const authorized = await request(app)
        .post('/api/v1/round3/debug/authorize')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({ accessKey: 'TEAM01#2026' });
      expect(authorized.status).toBe(200);
      const round3 = await request(app).get('/api/v1/round3/data').set('Authorization', `Bearer ${teamToken}`);
      expect(round3.body.challenge).toBeTruthy();
    });

    it('returns the same team PIN from the QR redemption page and accepts it in Round 3', async () => {
      const teamWithToken = await prisma.team.findUnique({ where: { id: testTeam.id }, include: { accessToken: true } });
      const qrRes = await request(app)
        .post('/api/v1/round3/qr/mobile-redeem')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({ code: teamWithToken!.accessToken!.tokenCode });

      expect(qrRes.status).toBe(200);
      expect(qrRes.body.accessKey).toBe('TEAM01#2026');
      const authorizeRes = await request(app)
        .post('/api/v1/round3/debug/authorize')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({ accessKey: qrRes.body.accessKey });
      expect(authorizeRes.status).toBe(200);
    });

    it('accepts this team’s existing 64-character QR token without payload validation failure', async () => {
      const legacyToken = 'a'.repeat(64);
      await prisma.accessToken.update({ where: { teamId: testTeam.id }, data: { tokenCode: legacyToken } });
      const response = await request(app)
        .post('/api/v1/round3/debug/authorize')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({ accessKey: legacyToken });

      expect(response.status).toBe(200);
      expect(response.body.isAuthorized).toBe(true);
    });

    it('rejects attempt to reuse an already redeemed QR code', async () => {
      // Team 2 logs in
      const team02Res = await request(app)
        .post('/api/v1/auth/team/login')
        .send({ teamCode: 'TEAM02', pin: 'team02#2026' });
      const team02Token = team02Res.body.token;

      const teamWithToken = await prisma.team.findUnique({
        where: { id: testTeam.id },
        include: { accessToken: true }
      });

      // Team 2 tries to redeem Team 1's already redeemed token
      const res = await request(app)
        .post('/api/v1/round3/qr/mobile-redeem')
        .set('Authorization', `Bearer ${team02Token}`)
        .send({ code: teamWithToken!.accessToken!.tokenCode });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_QR_CODE');
    });

    it('rejects incorrect final keys with 0 points awarded', async () => {
      const res = await request(app)
        .post('/api/v1/round3/debug/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({ finalKey: 'WRONG_BREACH_KEY' });

      expect(res.status).toBe(400);
      expect(res.body.isCorrect).toBe(false);
      expect(res.body.error).toBe('INVALID_FINAL_KEY');
    });

    it('accepts correct final debugging key (+200) and marks final breach timestamp', async () => {
      const challenge = await prisma.debugChallenge.findFirst({ where: { isActive: true } });
      const teamBefore = await prisma.team.findUnique({ where: { id: testTeam.id } });
      const scoreBefore = teamBefore!.totalScore;

      const res = await request(app)
        .post('/api/v1/round3/debug/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({ finalKey: challenge!.expectedFinalKey });

      expect(res.status).toBe(200);
      expect(res.body.isCorrect).toBe(true);
      expect(res.body.pointsAwarded).toBe(200);
      expect(res.body.completedAt).toBeDefined();
      expect(res.body.newTotalScore).toBe(scoreBefore + 200);

      const teamAfter = await prisma.team.findUnique({ where: { id: testTeam.id } });
      expect(teamAfter!.finalBreachCompletedAt).toBeDefined();
    });

    it('duplicate final submissions do not award points twice', async () => {
      const challenge = await prisma.debugChallenge.findFirst({ where: { isActive: true } });
      const teamBefore = await prisma.team.findUnique({ where: { id: testTeam.id } });
      const scoreBefore = teamBefore!.totalScore;

      const res = await request(app)
        .post('/api/v1/round3/debug/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({ finalKey: challenge!.expectedFinalKey });

      expect(res.status).toBe(200);
      expect(res.body.alreadyCompleted).toBe(true);
      expect(res.body.pointsAwarded).toBe(0);
      expect(res.body.newTotalScore).toBe(scoreBefore);
    });
  });

  describe('6. Scoring Ledger & Admin Governance', () => {
    it('applies manual score adjustment with mandatory reason and creates audit log', async () => {
      const teamBefore = await prisma.team.findUnique({ where: { id: testTeam.id } });
      const scoreBefore = teamBefore!.totalScore;

      const res = await request(app)
        .post('/api/v1/admin/score-adjustments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamId: testTeam.id,
          pointsDelta: 25,
          reason: 'Arena bonus points granted by head judge'
        });

      expect(res.status).toBe(200);
      expect(res.body.team.totalScore).toBe(scoreBefore + 25);
    });

    it('rejects manual score adjustment without reason', async () => {
      const res = await request(app)
        .post('/api/v1/admin/score-adjustments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamId: testTeam.id,
          pointsDelta: 50,
          reason: 'no' // Too short (< 5 chars)
        });

      expect(res.status).toBe(400);
    });

    it('generates QR codes for teams in admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/qrcodes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.qrCodes).toBeDefined();
      expect(res.body.qrCodes.length).toBeGreaterThanOrEqual(20);
      expect(res.body.qrCodes[0]).not.toHaveProperty('tokenCode');
      const team01Qr = res.body.qrCodes.find((qr: { teamCode: string }) => qr.teamCode === 'TEAM01');
      expect(team01Qr.qrText).toBe('TEAM01#2026');
      expect(team01Qr.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('exports leaderboard CSV', async () => {
      const res = await request(app)
        .get('/api/v1/admin/export/csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Rank,Team Code,Team Name');
    });
  });

  describe('7. Admin-Only Reset Game', () => {
    it('blocks participant accounts from calling the reset endpoint', async () => {
      const res = await request(app)
        .post('/api/v1/admin/reset-game')
        .set('Authorization', `Bearer ${teamToken}`);

      expect(res.status).toBe(403);
    });

    it('blocks unauthenticated callers from calling the reset endpoint', async () => {
      const res = await request(app)
        .post('/api/v1/admin/reset-game');

      expect(res.status).toBe(401);
    });

    it('allows production reset behind admin authentication and exact confirmation', () => {
      expect(resetEnvironmentAllowed({ NODE_ENV: 'production', ENABLE_GAME_RESET: 'false' })).toBe(true);
    });

    it('requires the exact typed confirmation before resetting', async () => {
      const res = await request(app)
        .post('/api/v1/admin/reset-game')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('CONFIRMATION_REQUIRED');
    });

    it('successfully resets game to initial waiting state while preserving non-game data', async () => {
      // 1. Setup dirty game state:
      // Give team score, active round, red light, double points, redeemed QR token
      await prisma.team.update({
        where: { id: testTeam.id },
        data: { totalScore: 350, currentRound: 2, currentStage: 2 }
      });

      await prisma.scoreEvent.create({
        data: {
          teamId: testTeam.id,
          round: 1,
          stage: 1,
          source: 'TEST_DIRTY_SCORE',
          pointsDelta: 350,
          reason: 'Dirty score before reset'
        }
      });

      await prisma.submission.create({
        data: {
          teamId: testTeam.id,
          round: 1,
          stage: 1,
          questionId: question1.id,
          submittedValue: 'A',
          status: 'CORRECT',
          pointsAwarded: 100
        }
      });

      await prisma.roundControl.update({
        where: { id: 1 },
        data: {
          status: 'ACTIVE',
          signalState: 'RED',
          doublePointsEnabled: true,
          startTime: new Date(),
          endTime: new Date(Date.now() + 600000)
        }
      });

      await prisma.accessToken.updateMany({
        data: { isRedeemed: true, redeemedAt: new Date() }
      });

      const questionCountBefore = await prisma.question.count();
      const teamCountBefore = await prisma.team.count();
      const userCountBefore = await prisma.user.count();
      await prisma.accessToken.update({
        where: { teamId: testTeam.id },
        data: { accessKey: 'temporary-round3-key', authorizedAt: new Date() }
      });

      // 2. Admin triggers restart game
      const resetRes = await request(app)
        .post('/api/v1/admin/reset-game')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ confirmation: 'RESET GAME' });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // 3. Verify gameplay state is completely reset to original state:
      const submissionsCount = await prisma.submission.count();
      expect(submissionsCount).toBe(0);

      const scoreEventsCount = await prisma.scoreEvent.count();
      expect(scoreEventsCount).toBe(0);

      // Teams reset to 0 score and round 1
      const teams = await prisma.team.findMany();
      for (const t of teams) {
        expect(t.totalScore).toBe(0);
        expect(t.currentRound).toBe(1);
        expect(t.currentStage).toBe(1);
        expect(t.finalBreachCompletedAt).toBeNull();
      }

      // QR tokens reset to unredeemed
      const redeemedTokensCount = await prisma.accessToken.count({ where: { isRedeemed: true } });
      expect(redeemedTokensCount).toBe(0);
      expect(await prisma.accessToken.count({ where: { accessKey: { not: null } } })).toBe(0);
      expect(await prisma.accessToken.count({ where: { authorizedAt: { not: null } } })).toBe(0);
      expect(await prisma.teamRoundProgress.count()).toBe(0);
      expect((await prisma.winnerAnnouncement.findUnique({ where: { id: 1 } }))?.isFinalized).toBe(false);

      // Rounds reset to UPCOMING
      const r1 = await prisma.roundControl.findUnique({ where: { id: 1 } });
      expect(r1!.status).toBe('UPCOMING');
      expect(r1!.signalState).toBe('GREEN');
      expect(r1!.doublePointsEnabled).toBe(false);
      expect(r1!.redLightPenaltyMode).toBe(false);
      expect(r1!.startTime).toBeNull();
      expect(r1!.endTime).toBeNull();
      expect(r1!.remainingSeconds).toBe(r1!.durationMinutes * 60);

      const r2 = await prisma.roundControl.findUnique({ where: { id: 2 } });
      expect(r2!.status).toBe('UPCOMING');
      expect(r2!.startTime).toBeNull();
      expect(r2!.doublePointsEnabled).toBe(false);
      expect(r2!.redLightPenaltyMode).toBe(false);

      const r3 = await prisma.roundControl.findUnique({ where: { id: 3 } });
      expect(r3!.status).toBe('UPCOMING');
      expect(r3!.startTime).toBeNull();
      expect(r3!.doublePointsEnabled).toBe(false);
      expect(r3!.redLightPenaltyMode).toBe(false);

      // 4. Verify static entities were preserved:
      expect(await prisma.question.count()).toBe(questionCountBefore);
      expect(await prisma.team.count()).toBe(teamCountBefore);
      expect(await prisma.user.count()).toBe(userCountBefore);
    });

    it('allows the admin to start Round 1 and run the event again after restart', async () => {
      // Start Round 1
      const startRes = await request(app)
        .put('/api/v1/admin/rounds/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ startTimer: true });

      expect(startRes.status).toBe(200);
      expect(startRes.body.round.status).toBe('ACTIVE');

      // Team submits Question 1
      const submitRes = await request(app)
        .post('/api/v1/round1/submit')
        .set('Authorization', `Bearer ${teamToken}`)
        .send({
          questionId: question1.id,
          selectedOption: question1.correctOption
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.isCorrect).toBe(true);
      expect(submitRes.body.pointsAwarded).toBe(100);
      expect(submitRes.body.newTotalScore).toBe(100);

      // Question 2 is unlocked
      const qRes = await request(app)
        .get('/api/v1/round1/questions')
        .set('Authorization', `Bearer ${teamToken}`);

      expect(qRes.status).toBe(200);
      expect(qRes.body.questionNumber).toBe(2);
    });
  });
});
