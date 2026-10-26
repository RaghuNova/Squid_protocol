import { PrismaClient } from '@prisma/client';

const testDatabaseUrl = process.env.NODE_ENV === 'test' ? process.env.TEST_DATABASE_URL : undefined;

export const prisma = new PrismaClient({
  ...(testDatabaseUrl ? { datasources: { db: { url: testDatabaseUrl } } } : {}),
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
