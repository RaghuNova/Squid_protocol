import { Prisma } from '@prisma/client';

// Reset takes the exclusive form of this lock. Gameplay writes take the shared
// form so a write either finishes before reset (and is cleared) or observes the
// freshly reset progress before it can persist anything.
const RESET_LOCK_A = 1567324401;
const RESET_LOCK_B = 1;

export async function acquireGameplayWriteLock(tx: Prisma.TransactionClient): Promise<void> {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock_shared(${RESET_LOCK_A}::integer, ${RESET_LOCK_B}::integer) IS NULL AS locked`;
}
