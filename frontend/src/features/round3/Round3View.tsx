import React, { useEffect } from 'react';
import { DebugChallengeView } from './DebugChallengeView';
import { CountdownTimer } from '../../components/CountdownTimer';
import { Lock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { RoundControl } from '../../types/game';
import { BrokenQrPuzzle } from './BrokenQrPuzzle';

interface Round3ViewProps {
  round: RoundControl | null;
  timer?: { status: string; remainingSeconds: number; endTime: string | null; isPaused: boolean; isExpired: boolean };
  isUnlocked: boolean;
  isAccessKeyAuthorized: boolean;
  isCompleted: boolean;
  pointsAwarded?: number | null;
  completedAt?: string | null;
  challenge: any;
  onRefresh: () => void;
}

export const Round3View: React.FC<Round3ViewProps> = ({
  round,
  timer,
  isUnlocked,
  isAccessKeyAuthorized,
  isCompleted,
  pointsAwarded,
  completedAt,
  challenge,
  onRefresh
}) => {
  const status = timer?.status || round?.status || 'UPCOMING';
  const isPaused = status === 'PAUSED' || timer?.isPaused;
  const isGateOpen = status === 'ACTIVE' || status === 'PAUSED';

  useEffect(() => {
    const handleReset = () => {
      onRefresh();
    };
    window.addEventListener('squid-game-reset', handleReset);
    return () => window.removeEventListener('squid-game-reset', handleReset);
  }, [onRefresh]);

  if (!isUnlocked) {
    return (
      <div className="bg-[#12151c] border border-gray-800 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4">
        <Lock className="w-10 h-10 text-gray-600 mx-auto" aria-hidden="true" />
        <h2 className="text-2xl font-display font-bold text-white">Round 3 — The Final Breach</h2>
        <p className="text-sm font-mono text-gray-400">Complete or time out in Round 2 to unlock the final breach.</p>
      </div>
    );
  }

  if (!isGateOpen && !isCompleted) {
    return (
      <div className="bg-[#12151c] border border-gray-800 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 flex items-center justify-center mx-auto" aria-hidden="true">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold text-white tracking-wide">
            Round 3 — The Final Breach
          </h2>
          <p className="text-sm font-mono text-[#00e676]">
            Eligibility verified: Your team has unlocked Round 3 access.
          </p>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed max-w-lg mx-auto">
          Waiting for tournament officials to open the Round 3 access gate. Once opened, you can verify your team PIN and breach the kernel.
        </p>
        <button
          onClick={onRefresh}
          className="px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
        >
          Check Round 3 Status
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#12151c] border border-gray-800">
        <div>
          <span className="font-display font-bold text-sm text-white block">ROUND 3: THE FINAL BREACH</span>
          <span className="text-[11px] font-mono text-gray-400">Enter your existing team login PIN to unlock the debugging question, then submit the final answer.</span>
        </div>
        {timer?.endTime && <CountdownTimer endTime={timer.endTime} remainingSeconds={timer.remainingSeconds} status={status} isPaused={isPaused} onExpire={onRefresh} />}
      </div>

      {isPaused && (
        <div role="alert" className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-4 flex items-center gap-3 text-amber-300 font-mono text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          Round 3 is paused by tournament officials.
        </div>
      )}

      <BrokenQrPuzzle isUnlocked={true} isAuthorized={isAccessKeyAuthorized} onSuccess={onRefresh} />

      {isAccessKeyAuthorized && challenge && (
        <DebugChallengeView
          isUnlocked={true}
          isCompleted={isCompleted}
          challenge={challenge}
          pointsAwarded={pointsAwarded}
          completedAt={completedAt}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
};
