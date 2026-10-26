import React from 'react';
import { DebugChallengeView } from './DebugChallengeView';
import { CountdownTimer } from '../../components/CountdownTimer';
import { Lock, AlertTriangle } from 'lucide-react';
import { RoundControl } from '../../types/game';
import { BrokenQrPuzzle } from './BrokenQrPuzzle';

interface Round3ViewProps {
  round: RoundControl | null;
  timer?: { status: string; remainingSeconds: number; endTime: string | null; isPaused: boolean; isExpired: boolean };
  isUnlocked: boolean;
  isQrRedeemed: boolean;
  isAccessKeyAuthorized: boolean;
  isCompleted: boolean;
  pointsAwarded?: number | null;
  completedAt?: string | null;
  challenge: any;
  onRefresh: () => void;
}

export const Round3View: React.FC<Round3ViewProps> = ({ round, timer, isUnlocked, isQrRedeemed, isAccessKeyAuthorized, isCompleted, pointsAwarded, completedAt, challenge, onRefresh }) => {
  const status = timer?.status || round?.status || 'UPCOMING';
  const isPaused = status === 'PAUSED' || timer?.isPaused;

  if (!isUnlocked) {
    return <div className="bg-[#12151c] border border-gray-800 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4">
      <Lock className="w-10 h-10 text-gray-600 mx-auto" />
      <h2 className="text-2xl font-display font-bold text-white">Round 3 — The Final Breach</h2>
      <p className="text-sm font-mono text-gray-400">Complete or time out in Round 2 to unlock the final breach.</p>
    </div>;
  }

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#12151c] border border-gray-800">
      <div>
        <span className="font-display font-bold text-sm text-white block">ROUND 3: THE FINAL BREACH</span>
        <span className="text-[11px] font-mono text-gray-400">Scan your team QR with a phone and open the link. Copy the separate access key shown after verification, enter it here, then submit the final answer.</span>
      </div>
      {timer?.endTime && <CountdownTimer endTime={timer.endTime} remainingSeconds={timer.remainingSeconds} status={status} isPaused={isPaused} onExpire={onRefresh} />}
    </div>

    {isPaused && <div role="alert" className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-4 flex items-center gap-3 text-amber-300 font-mono text-sm"><AlertTriangle className="w-5 h-5" />Round 3 is paused by tournament officials.</div>}

    <BrokenQrPuzzle isUnlocked={true} isQrRedeemed={isQrRedeemed} isAuthorized={isAccessKeyAuthorized} onSuccess={onRefresh} />

    {isAccessKeyAuthorized && challenge && <DebugChallengeView
      isUnlocked={true}
      isCompleted={isCompleted}
      challenge={challenge}
      pointsAwarded={pointsAwarded}
      completedAt={completedAt}
      onSuccess={onRefresh}
    />}
  </div>;
};
