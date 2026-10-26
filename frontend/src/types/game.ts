export type UserRole = 'ADMIN' | 'VOLUNTEER' | 'TEAM';
export type RoundStatus = 'UPCOMING' | 'ACTIVE' | 'PAUSED' | 'ENDED';
export type SignalState = 'GREEN' | 'RED';
export type SubmissionStatus = 'CORRECT' | 'INCORRECT' | 'PENALIZED' | 'REJECTED';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  teamId?: string | null;
}

export interface Team {
  id: string;
  teamCode: string;
  name: string;
  members: string;
  currentRound: number;
  currentStage: number;
  totalScore: number;
  isDisqualified: boolean;
  finalBreachCompletedAt?: string | null;
  isCupVerified?: boolean;
  isQrValidated?: boolean;
}

export interface RoundControl {
  id: number;
  title: string;
  status: RoundStatus;
  startTime?: string | null;
  endTime?: string | null;
  pausedAt?: string | null;
  remainingSeconds?: number | null;
  durationMinutes: number;
  signalState: SignalState;
  redLightPenaltyMode: boolean;
  doublePointsEnabled: boolean;
  updatedAt: string;
}

export interface QuestionOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: string;
  orderIndex: number;
  topic: string;
  prompt: string;
  codeSnippet?: string | null;
  options: QuestionOption[];
}

export interface SudokuData {
  id: string;
  round: number;
  initialGrid: string;
  hintDeductionPercent: number;
  isCompleted: boolean;
}

export interface BrokenLogicData {
  puzzle: {
    id: string;
    title: string;
    scenario: string;
    codeSnippet: string;
    points: number;
  } | null;
  isUnlocked: boolean;
  isCompleted: boolean;
}

export interface Round3Data {
  round: RoundControl | null;
  serverTime: string;
  currentStage: number;
  isUnlocked?: boolean;
  isCompleted?: boolean;
  completedAt?: string | null;
  challenge?: {
    id: string;
    title: string;
    description: string;
    intendedBehavior: string;
    javaCode: string;
    pythonCode: string;
    cCode: string;
    inputData: string;
    derivationRule: string;
    points: number;
  } | null;
  stage1CupTransfer?: {
    isCompleted: boolean;
    verifiedAt?: string;
    verifiedByName?: string;
    offline?: boolean;
  };
  stage2AccessToken?: {
    isUnlocked: boolean;
    isCompleted: boolean;
    redeemedAt?: string;
    offline?: boolean;
  };
  stage3Debugging?: {
    isUnlocked: boolean;
    isCompleted: boolean;
    challenge: {
      id: string;
      title: string;
      description: string;
      intendedBehavior: string;
      javaCode: string;
      pythonCode: string;
      cCode: string;
      inputData: string;
      derivationRule: string;
      points: number;
    } | null;
    completedAt?: string | null;
  };
}

export interface LeaderboardTeam {
  id: string;
  teamCode: string;
  username?: string;
  name: string;
  members: string;
  currentRound: number;
  currentStage: number;
  totalScore: number;
  r1Score: number;
  r2Score: number;
  r3Score: number;
  r3Position?: number | null;
  r3Points?: number | null;
  finalBreachCompletedAt?: string | null;
  isDisqualified: boolean;
}

export interface WinnerAnnouncement {
  id: number;
  isFinalized: boolean;
  finalizedAt?: string | null;
  finalizedByAdminUsername?: string | null;
  winners: Array<{
    rank: number;
    teamCode: string;
    username?: string;
    name: string;
    totalScore: number;
    r1Score: number;
    r2Score: number;
    r3Score: number;
    r3Position?: number | null;
    r3Points?: number | null;
    finalBreachCompletedAt?: string | null;
  }>;
  notes?: string | null;
}

export interface SubmissionItem {
  id: string;
  teamId: string;
  round: number;
  stage: number;
  submittedValue: string;
  doublePointsSelected: boolean;
  signalAtSubmission: SignalState;
  status: SubmissionStatus;
  pointsAwarded: number;
  createdAt: string;
  team?: { teamCode: string; name: string };
  question?: { orderIndex: number; topic: string };
}
