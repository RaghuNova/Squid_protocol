-- AlterTable
ALTER TABLE "AccessToken" ALTER COLUMN "teamId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RoundControl" ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "remainingSeconds" INTEGER,
ALTER COLUMN "doublePointsEnabled" SET DEFAULT false;
