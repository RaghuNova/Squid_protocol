import { Prisma } from '@prisma/client';

export async function invalidateFinalizedWinnerSnapshot(tx: Prisma.TransactionClient): Promise<void> {
  await tx.winnerAnnouncement.updateMany({
    where: { id: 1, isFinalized: true },
    data: {
      isFinalized: false,
      finalizedAt: null,
      finalizedByAdminId: null,
      finalizedByAdminUsername: null,
      winners: Prisma.DbNull,
      notes: 'Reopened automatically because a new score was recorded.'
    }
  });
}
