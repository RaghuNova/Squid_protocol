import { PrismaClient } from '@prisma/client';

export async function resetTestDatabase() {
  console.log("=== INITIATING SAFE TEST DATABASE RESET ===");

  // 1. Guardrail: Refuse in production
  if (process.env.NODE_ENV === 'production') {
    throw new Error("CRITICAL SAFETY ABORT: resetTestDatabase cannot run when NODE_ENV is 'production'!");
  }

  // 2. Guardrail: Must have explicit TEST_RESET_ENABLED=true
  if (process.env.TEST_RESET_ENABLED !== 'true') {
    throw new Error("CRITICAL SAFETY ABORT: TEST_RESET_ENABLED must be explicitly set to 'true' to execute test database cleanup!");
  }

  // 3. Guardrail: Verify URL target contains 'test'
  const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '';
  if (!dbUrl.toLowerCase().includes('test')) {
    throw new Error(`CRITICAL SAFETY ABORT: Target database URL does not contain 'test' in its name! Aborting to prevent accidental data loss. URL: ${dbUrl.replace(/:[^:]*@/, ':***@')}`);
  }

  console.log("🛡️ Safety guardrails passed: Database verified as dedicated TEST environment.");

  const prisma = new PrismaClient({
    datasources: {
      db: { url: dbUrl }
    }
  });

  try {
    // Perform cleanup in safe dependency order
    console.log("🧹 Clearing test submissions and scores...");
    await prisma.$transaction([
      prisma.submission.deleteMany({}),
      prisma.scoreEvent.deleteMany({}),
      prisma.physicalVerification.deleteMany({}),
      prisma.adminAuditLog.deleteMany({}),
    ]);

    // Reset team progression and scores to default
    console.log("🔄 Resetting test teams to initial state...");
    await prisma.team.updateMany({
      data: {
        currentRound: 1,
        currentStage: 1,
        totalScore: 0,
        isDisqualified: false,
        finalBreachCompletedAt: null,
        finalBreachPosition: null,
        finalBreachPoints: null
      }
    });

    // Reset winner announcement
    await prisma.winnerAnnouncement.deleteMany({});

    // Reset access tokens to unredeemed
    await prisma.accessToken.updateMany({
      data: {
        isRedeemed: false,
        redeemedAt: null
      }
    });

    // Reset round controls to UPCOMING or default
    await prisma.roundControl.updateMany({
      where: { id: { in: [1, 2, 3] } },
      data: {
        status: "UPCOMING",
        signalState: "GREEN",
        redLightPenaltyMode: false,
        startTime: null,
        endTime: null
      }
    });

    await prisma.roundControl.update({
      where: { id: 1 },
      data: { status: "ACTIVE" }
    });

    console.log("✅ Safe test database cleanup completed successfully!");
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1].endsWith('reset-test-db.ts') || process.argv[1].endsWith('reset-test-db.js')) {
  resetTestDatabase()
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
