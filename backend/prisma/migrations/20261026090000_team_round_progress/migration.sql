CREATE TYPE "TeamRoundProgressStatus" AS ENUM ('LOCKED', 'READY', 'IN_PROGRESS', 'COMPLETED', 'TIMED_OUT');

CREATE TABLE "TeamRoundProgress" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "round" INTEGER NOT NULL,
  "status" "TeamRoundProgressStatus" NOT NULL DEFAULT 'LOCKED',
  "startedAt" TIMESTAMP(3),
  "deadlineAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "timedOutAt" TIMESTAMP(3),
  "remainingSeconds" INTEGER,
  "nextRoundEligible" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TeamRoundProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeamRoundProgress_teamId_round_key" ON "TeamRoundProgress"("teamId", "round");
CREATE INDEX "TeamRoundProgress_round_status_deadlineAt_idx" ON "TeamRoundProgress"("round", "status", "deadlineAt");

ALTER TABLE "TeamRoundProgress"
  ADD CONSTRAINT "TeamRoundProgress_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Replace the previous 18-clue starter with a verified, uniquely solvable 16-clue grid.
-- The solution remains server-side and is unchanged.
UPDATE "SudokuPuzzle"
SET "initialGrid" = '0T0U00U0DS0C00S0U0D0000S000A0T0D0CSU', "updatedAt" = CURRENT_TIMESTAMP
WHERE "round" = 2 AND "isActive" = true;
