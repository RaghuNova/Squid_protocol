-- AlterTable
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "finalBreachPosition" INTEGER,
ADD COLUMN IF NOT EXISTS "finalBreachPoints" INTEGER;

-- CreateTable
CREATE TABLE IF NOT EXISTS "WinnerAnnouncement" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "isFinalized" BOOLEAN NOT NULL DEFAULT false,
    "finalizedAt" TIMESTAMP(3),
    "finalizedByAdminId" TEXT,
    "finalizedByAdminUsername" TEXT,
    "winners" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WinnerAnnouncement_pkey" PRIMARY KEY ("id")
);
