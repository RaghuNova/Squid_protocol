import { SignalState, SubmissionStatus } from '@prisma/client';

export const ROUND1_SCORING = {
  greenCorrect: 10,
  penalty: -5,
  doubleMultiplier: 2
} as const;

export function calculateRound1Score(signal: SignalState, isCorrect: boolean, doublePointsEnabled: boolean) {
  const isRedLight = signal === SignalState.RED;
  const multiplier = doublePointsEnabled ? ROUND1_SCORING.doubleMultiplier : 1;
  const pointsAwarded = (isRedLight || !isCorrect ? ROUND1_SCORING.penalty : ROUND1_SCORING.greenCorrect) * multiplier;
  const status = isRedLight
    ? SubmissionStatus.PENALIZED
    : isCorrect
      ? SubmissionStatus.CORRECT
      : SubmissionStatus.INCORRECT;

  return {
    pointsAwarded,
    status,
    // Preserve the existing Red Light rule that does not reveal correctness.
    isCorrect: isRedLight ? false : isCorrect,
    message: isRedLight
      ? `RED LIGHT — Submission detected. ${pointsAwarded} points.`
      : isCorrect
        ? `GREEN LIGHT — Correct answer! +${pointsAwarded} points.`
        : `GREEN LIGHT — Wrong answer. ${pointsAwarded} points.`
  };
}
