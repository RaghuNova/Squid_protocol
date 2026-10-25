import React, { useState } from 'react';
import { DebugChallengeView } from './DebugChallengeView';
import { CountdownTimer } from '../../components/CountdownTimer';
import { apiRequest } from '../../services/api';
import { useSound } from '../../context/SoundContext';
import { QrCode, Lock, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, Key } from 'lucide-react';
import { RoundControl } from '../../types/game';
import { Card, Badge, Button } from '../../components/ui';

interface Round3ViewProps {
  round: RoundControl | null;
  timer?: {
    status: string;
    remainingSeconds: number;
    endTime: string | null;
    isPaused: boolean;
    isExpired: boolean;
  };
  isUnlocked: boolean;
  isQrRedeemed: boolean;
  isCompleted: boolean;
  completedAt?: string | null;
  challenge: any;
  onRefresh: () => void;
}

export const Round3View: React.FC<Round3ViewProps> = ({
  round,
  timer,
  isUnlocked,
  isQrRedeemed,
  isCompleted,
  completedAt,
  challenge,
  onRefresh,
}) => {
  const { playSuccess, playError } = useSound();
  const [code, setCode] = useState<string>('');
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ isError: boolean; message: string } | null>(null);

  const status = timer?.status || round?.status || 'UPCOMING';
  const isUpcoming = status === 'UPCOMING';
  const isPaused = status === 'PAUSED' || timer?.isPaused;
  const isEnded = status === 'ENDED' || timer?.isExpired;

  // 1. Locked waiting screen before Round 3 starts
  if (isUpcoming || !isUnlocked) {
    return (
      <Card variant="elevated" cornerAccents className="p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 flex items-center justify-center mx-auto" aria-hidden="true">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-display font-bold text-white tracking-wide">
            Round 3 — The Final Breach
          </h2>
          <Badge variant="cyan" size="sm">
            STATUS: LOCKED
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-gray-300 font-mono leading-relaxed max-w-lg mx-auto">
          Round 3 is not currently active. Tournament officials will start Round 3 when all teams are ready to begin the final physical activities and code derivation.
        </p>
      </Card>
    );
  }

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isRedeeming || isPaused || isEnded) return;

    setIsRedeeming(true);
    setFeedback(null);

    try {
      const res = await apiRequest('/round3/qr/redeem', {
        method: 'POST',
        body: JSON.stringify({ code: code.trim() }),
      });

      playSuccess();
      setFeedback({
        isError: false,
        message: res.message || 'QR Code verified! The Final Debugging Challenge has been unlocked.',
      });

      setTimeout(() => {
        onRefresh();
      }, 1000);
    } catch (err: any) {
      playError();
      setFeedback({
        isError: true,
        message: err.message || 'Invalid or already redeemed QR code. Check with tournament officials.',
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Timer Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#0f1218] border border-[#1e2432]">
        <div className="flex items-center gap-3">
          <Key className="w-5 h-5 text-[#ff004f] flex-shrink-0" aria-hidden="true" />
          <div>
            <span className="font-display font-bold text-sm text-white tracking-wide block">
              ROUND 3: THE FINAL BREACH
            </span>
            <span className="text-[11px] font-mono text-gray-400">
              Offline Physical QR Activity + Single-Use Redemption + Online Debugging (+200 PTS)
            </span>
          </div>
        </div>

        <CountdownTimer
          endTime={timer?.endTime ?? round?.endTime}
          remainingSeconds={timer?.remainingSeconds ?? round?.remainingSeconds}
          status={status}
          isPaused={isPaused}
          onExpire={onRefresh}
        />
      </div>

      {isPaused && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-4 flex items-center gap-3 text-amber-300 font-mono text-xs sm:text-sm animate-fade-in"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          <div>
            <span className="font-bold uppercase tracking-wider">ROUND 3 CURRENTLY PAUSED: </span>
            <span>Timer is frozen by tournament officials. Submissions are temporarily suspended.</span>
          </div>
        </div>
      )}

      {/* Screen 1: QR Code Redemption Gate */}
      {!isQrRedeemed && !isCompleted ? (
        <Card variant="elevated" cornerAccents className="p-8 sm:p-10 max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#ff004f]/15 border border-[#ff004f]/40 text-[#ff004f] flex items-center justify-center mx-auto" aria-hidden="true">
              <QrCode className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-2xl text-white">
              Enter Reconstructed QR Code
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-mono">
              Complete the offline physical challenge at the arena to reconstruct your team's QR fragment. Enter the code displayed on your QR code below to unlock the Final Online Debugging Challenge.
            </p>
          </div>

          <form onSubmit={handleRedeemCode} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="qr-redemption-code"
                className="block text-xs font-mono text-gray-300 uppercase tracking-wider font-semibold"
              >
                QR Redemption Code
              </label>
              <input
                id="qr-redemption-code"
                type="text"
                value={code}
                disabled={isRedeeming || isPaused || isEnded}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. TEAM01#2026"
                className="w-full px-4 py-3.5 rounded-xl bg-[#08090d] border border-[#1e2432] text-white font-mono text-sm uppercase placeholder:text-gray-600 focus:outline-none focus:border-[#ff004f] focus-visible:ring-2 focus-visible:ring-[#ff004f] transition-colors"
                autoFocus
              />
            </div>

            {feedback && (
              <div
                role="alert"
                className={`p-4 rounded-xl font-mono text-xs flex items-center gap-2.5 animate-fade-in ${
                  feedback.isError
                    ? 'bg-red-950/40 border border-red-800 text-red-300'
                    : 'bg-[#00e676]/20 border border-[#00e676]/40 text-[#00e676]'
                }`}
              >
                {feedback.isError ? (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#00e676]" aria-hidden="true" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={!code.trim() || isRedeeming || isPaused || isEnded}
              variant="primary"
              size="lg"
              isLoading={isRedeeming}
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              REDEEM QR ACCESS CODE
            </Button>
          </form>

          <div className="p-4 rounded-xl bg-[#08090d] border border-[#1e2432] font-mono text-xs text-gray-400 space-y-1">
            <span className="text-gray-300 font-bold block">Physical Challenge Rules:</span>
            <p>1. Each QR code is single-use and can only be redeemed once across the event.</p>
            <p>2. Cup-transfer and QR assembly are performed offline under organizer supervision.</p>
            <p>3. The online debugging challenge will unlock immediately upon successful redemption.</p>
          </div>
        </Card>
      ) : (
        /* Screen 2: Debugging Challenge */
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-[#00e676]/10 border border-[#00e676]/30 flex items-center justify-between text-xs font-mono text-[#00e676]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>QR ACCESS CODE VERIFIED — DEBUGGING PROTOCOL ACTIVATED (+200 PTS)</span>
            </div>
            {completedAt && (
              <span className="text-gray-400">
                Breached at: {new Date(completedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          <DebugChallengeView
            isUnlocked={true}
            isCompleted={isCompleted}
            challenge={challenge}
            completedAt={completedAt}
            onSuccess={onRefresh}
          />
        </div>
      )}
    </div>
  );
};
