ALTER TABLE "AccessToken"
  ADD COLUMN "accessKey" TEXT,
  ADD COLUMN "authorizedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "AccessToken_accessKey_key" ON "AccessToken"("accessKey");

ALTER TABLE "BrokenLogicPuzzle"
  ADD COLUMN "referenceSolution" TEXT;

ALTER TABLE "DebugChallenge"
  ADD COLUMN "referenceSolution" TEXT;

UPDATE "BrokenLogicPuzzle"
SET "referenceSolution" = 'Start at 100. Apply the intended predicate (length % 2 = 0) AND (length > 20 OR length < 10). Values 7, 14, 25, and 41 subtract 2×length; 32 adds 3×length. Final accumulator: 100 - 14 - 28 - 50 + 96 - 82 = 22.'
WHERE "expectedOutput" = '22' AND "referenceSolution" IS NULL;

UPDATE "DebugChallenge"
SET "referenceSolution" = $solution$Expected output: PROTOCOL_BREACH_1040 (or numeric checksum 1040).
Even-byte contributions: (12 << 2) + 3 = 51, (34 << 2) + 3 = 139, (58 << 2) + 3 = 235, (72 << 2) + 3 = 291.
Odd-byte contributions: 25 ^ 0x4B = 82, 47 ^ 0x4B = 100, 63 ^ 0x4B = 116, 81 ^ 0x4B = 26. Total = 1040.
Corrected Python: checksum += (b << 2) + 3
Corrected Java: checksum += (b << 2) + 3;
Corrected C: checksum += (b << 2) + 3;$solution$
WHERE "expectedFinalKey" = 'PROTOCOL_BREACH_1040' AND "referenceSolution" IS NULL;
