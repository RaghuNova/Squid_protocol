import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateQrToken } from '../src/utils/qrToken.js';

const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '';
const parsedUrl = new URL(databaseUrl);
const databaseName = parsedUrl.pathname.replace(/^\//, '').split('?')[0];
if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname) || !/(test|dev)/i.test(databaseName)) {
  throw new Error('Refusing development seed: target must be a local test/dev database and NODE_ENV must not be production.');
}

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

async function seedDevAccounts() {
  for (let i = 1; i <= 10; i++) {
    const suffix = String(i).padStart(2, '0');
    const username = `TEST${suffix}`;
    const teamCode = username;
    const team = await prisma.team.upsert({
      where: { teamCode },
      update: { name: `Test Squad ${suffix}`, members: `Test Operative ${suffix}-A, Test Operative ${suffix}-B, Test Operative ${suffix}-C`, currentRound: 1, currentStage: 1, totalScore: 0, finalBreachCompletedAt: null, finalBreachPosition: null, finalBreachPoints: null },
      create: { teamCode, name: `Test Squad ${suffix}`, members: `Test Operative ${suffix}-A, Test Operative ${suffix}-B, Test Operative ${suffix}-C` }
    });
    await prisma.$transaction([
      prisma.submission.deleteMany({ where: { teamId: team.id } }),
      prisma.scoreEvent.deleteMany({ where: { teamId: team.id } }),
      prisma.teamRoundProgress.deleteMany({ where: { teamId: team.id } }),
      prisma.accessToken.upsert({ where: { teamId: team.id }, update: { tokenCode: generateQrToken(), accessKey: null, authorizedAt: null, isRedeemed: false, redeemedAt: null }, create: { teamId: team.id, tokenCode: generateQrToken() } }),
      prisma.user.upsert({ where: { username }, update: { passwordHash: await bcrypt.hash(`team${suffix}#2026`, 10), role: UserRole.TEAM, teamId: team.id }, create: { username, passwordHash: await bcrypt.hash(`team${suffix}#2026`, 10), role: UserRole.TEAM, teamId: team.id } })
    ]);
  }
  console.log('Development TEST01–TEST10 accounts refreshed in the local test/dev database.');
}

seedDevAccounts().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
