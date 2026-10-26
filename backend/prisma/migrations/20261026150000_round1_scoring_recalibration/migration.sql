-- Recalibrate Round 1 records from the signal and multiplier captured with
-- each answer. This is a scoped, repeatable migration rather than scaling
-- aggregate team totals without knowing how they were earned.
UPDATE "Question"
SET "pointsNormal" = 10,
    "pointsDouble" = 20
WHERE "round" = 1;

UPDATE "Submission" AS submission
SET "pointsAwarded" = CASE
  WHEN submission."signalAtSubmission" = 'RED' THEN
    CASE WHEN submission."doublePointsSelected" THEN -10 ELSE -5 END
  WHEN submission."status" = 'CORRECT' THEN
    CASE WHEN submission."doublePointsSelected" THEN 20 ELSE 10 END
  ELSE
    CASE WHEN submission."doublePointsSelected" THEN -10 ELSE -5 END
END
FROM "Question" AS question
WHERE submission."round" = 1
  AND submission."questionId" = question."id";

WITH first_answer AS (
  SELECT DISTINCT ON (submission."teamId", submission."questionId")
    submission."teamId",
    submission."questionId",
    submission."pointsAwarded",
    submission."status",
    submission."doublePointsSelected",
    submission."signalAtSubmission"
  FROM "Submission" AS submission
  WHERE submission."round" = 1
    AND submission."questionId" IS NOT NULL
  ORDER BY submission."teamId", submission."questionId", submission."createdAt", submission."id"
)
UPDATE "ScoreEvent" AS score_event
SET "pointsDelta" = submission."pointsAwarded",
    "reason" = 'Round 1 Question #' || question."orderIndex" || ' ' || submission."status"::text ||
      ' (' || CASE WHEN submission."doublePointsSelected" THEN 'Double' ELSE 'Normal' END ||
      ', Signal: ' || submission."signalAtSubmission"::text || ')'
FROM first_answer AS submission
JOIN "Question" AS question ON question."id" = submission."questionId"
WHERE score_event."teamId" = submission."teamId"
  AND score_event."round" = 1
  AND score_event."source" = 'ROUND1_Q_' || question."orderIndex"::text;

-- Team.totalScore is the materialized all-round total. Rebuild ledger-backed
-- teams from the score records so the team card and admin board stay aligned.
UPDATE "Team" AS team
SET "totalScore" = totals."totalScore"
FROM (
  SELECT "teamId", SUM("pointsDelta")::integer AS "totalScore"
  FROM "ScoreEvent"
  GROUP BY "teamId"
) AS totals
WHERE totals."teamId" = team."id";

-- A finalized winner snapshot is stale after any recorded Round 1 score changes.
UPDATE "WinnerAnnouncement"
SET "isFinalized" = false,
    "finalizedAt" = NULL,
    "finalizedByAdminId" = NULL,
    "finalizedByAdminUsername" = NULL,
    "winners" = NULL,
    "notes" = 'Reopened automatically because Round 1 scoring was recalibrated.'
WHERE "isFinalized" = true
  AND EXISTS (SELECT 1 FROM "ScoreEvent" WHERE "round" = 1);

-- Migrate a currently active legacy Round 1 from per-team timers to its
-- authoritative 15-minute event deadline.
UPDATE "RoundControl"
SET "durationMinutes" = 15,
    "endTime" = COALESCE("endTime", "startTime" + INTERVAL '15 minutes')
WHERE "id" = 1
  AND "status" = 'ACTIVE'
  AND "startTime" IS NOT NULL;

UPDATE "TeamRoundProgress" AS progress
SET "startedAt" = COALESCE(control."startTime", progress."startedAt"),
    "deadlineAt" = control."endTime"
FROM "RoundControl" AS control
WHERE control."id" = 1
  AND control."status" = 'ACTIVE'
  AND progress."round" = 1
  AND progress."status" = 'IN_PROGRESS';

ALTER TABLE "Question" ALTER COLUMN "pointsNormal" SET DEFAULT 10;
ALTER TABLE "Question" ALTER COLUMN "pointsDouble" SET DEFAULT 20;
