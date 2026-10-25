import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';
import { Terminal, Lock, ShieldCheck, Flame, ArrowRight, CheckCircle2, AlertTriangle, Trophy } from 'lucide-react';
import { Card, Badge, Button, TerminalWindow } from '../../components/ui';

interface DebugChallengeViewProps {
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
  onSuccess: () => void;
}

export const DebugChallengeView: React.FC<DebugChallengeViewProps> = ({
  isUnlocked,
  isCompleted,
  challenge,
  completedAt,
  onSuccess,
}) => {
  const { refreshMe } = useAuth();
  const { playVictory, playError } = useSound();

  const [activeLang, setActiveLang] = useState<'java' | 'python' | 'c'>('python');
  const [finalKey, setFinalKey] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ isError: boolean; message: string; isFirstChampion?: boolean } | null>(null);

  if (!isUnlocked) {
    return (
      <Card variant="bordered" className="p-8 text-center bg-[#0f1218]/50 space-y-3">
        <Lock className="w-8 h-8 text-gray-600 mx-auto" aria-hidden="true" />
        <h4 className="font-display font-bold text-base text-gray-400">ROUND 3 LOCKED — THE FINAL BREACH</h4>
        <p className="text-xs font-mono text-gray-500">
          Waiting for tournament organizers to activate Round 3's final debugging challenge.
        </p>
      </Card>
    );
  }

  const getCodeForLang = () => {
    if (!challenge) return '';
    if (activeLang === 'java') return challenge.javaCode;
    if (activeLang === 'c') return challenge.cCode;
    return challenge.pythonCode;
  };

  const handleSubmitKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalKey.trim() || isSubmitting || isCompleted) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await apiRequest('/round3/debug/submit', {
        method: 'POST',
        body: JSON.stringify({ finalKey: finalKey.trim() }),
      });

      playVictory();

      // Confetti burst respecting prefers-reduced-motion
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!prefersReducedMotion) {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#ff004f', '#00e676', '#00f0ff', '#ffd166', '#ff2e7e']
        });
      }

      setFeedback({
        isError: false,
        message: res.message || 'SYSTEM BREACHED! Final Key Accepted!',
        isFirstChampion: res.isFirstChampion,
      });

      await refreshMe();
      onSuccess();
    } catch (err: any) {
      playError();
      setFeedback({
        isError: true,
        message: err.message || 'Key rejected. Review the operator precedence bug across all 3 languages.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="elevated" cornerAccents className="p-6 sm:p-8 space-y-6 relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e2432] pb-4">
        <div>
          <Badge variant="danger" size="sm" hasDot>
            ROUND 3 — FINAL ONLINE DEBUGGING PROTOCOL
          </Badge>
          <h3 className="font-display font-black text-xl sm:text-2xl text-white mt-1">
            {challenge?.title || 'System Core Debugging'}
          </h3>
        </div>

        {isCompleted ? (
          <Badge variant="success" size="md" hasDot>
            BREACH CONFIRMED (+200 PTS)
          </Badge>
        ) : (
          <Badge variant="warning" size="md">
            PRIZE: +{challenge?.points || 200} PTS
          </Badge>
        )}
      </div>

      {isCompleted && (
        <div
          role="status"
          className="p-4 rounded-xl bg-[#00e676]/10 border border-[#00e676]/40 text-[#00e676] font-mono text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span>CRITICAL MISSION ACCOMPLISHED: Final Breach Key validated and recorded on PostgreSQL ledger.</span>
          </div>
          {completedAt && (
            <span className="text-xs text-gray-400 flex-shrink-0">
              Completed at: {new Date(completedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      {/* Challenge Description & Specification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        <div className="p-4 rounded-xl bg-[#08090d] border border-[#1e2432] space-y-2">
          <span className="text-gray-400 uppercase tracking-wider font-semibold">INTENDED BEHAVIOR SPEC:</span>
          <p className="text-gray-200 leading-relaxed">{challenge?.description}</p>
          <p className="text-[#00f0ff] font-semibold">{challenge?.intendedBehavior}</p>
        </div>

        <div className="p-4 rounded-xl bg-[#08090d] border border-[#1e2432] space-y-2">
          <span className="text-gray-400 uppercase tracking-wider font-semibold">KEY DERIVATION RULE:</span>
          <p className="text-gray-200">Input Data: <code className="bg-[#151922] px-1.5 py-0.5 rounded text-white border border-[#1e2432]">{challenge?.inputData}</code></p>
          <p className="text-[#f59e0b] font-semibold">{challenge?.derivationRule}</p>
        </div>
      </div>

      {/* Multi-Language Tabs (Java, Python, C) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e2432] pb-2">
          <span className="font-mono text-xs text-gray-400 flex items-center gap-1.5 font-semibold">
            <Terminal className="w-4 h-4 text-[#ff004f]" aria-hidden="true" />
            INSPECT FIRMWARE CODE IN YOUR PREFERRED LANGUAGE:
          </span>

          <div className="flex items-center gap-1.5" role="group" aria-label="Programming language selector">
            {(['python', 'java', 'c'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                aria-pressed={activeLang === lang}
                onClick={() => setActiveLang(lang)}
                className={`px-3 py-1 rounded-lg font-mono text-xs uppercase font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] ${
                  activeLang === lang
                    ? 'bg-[#ff004f] text-white shadow-red-sm'
                    : 'bg-[#08090d] text-gray-400 hover:text-white border border-[#1e2432]'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <TerminalWindow
          title={`firmware_core.${activeLang === 'python' ? 'py' : activeLang === 'java' ? 'java' : 'c'}`}
          code={getCodeForLang()}
          language={activeLang}
          showLineNumbers
        />
      </div>

      {/* Key Submission Form */}
      {!isCompleted && (
        <form onSubmit={handleSubmitKey} className="space-y-4 pt-2 border-t border-[#1e2432]">
          <div className="space-y-1.5">
            <label
              htmlFor="final-breach-key-input"
              className="block text-xs font-mono text-gray-300 uppercase tracking-wider font-semibold"
            >
              Enter Derived Final Breach Key
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="final-breach-key-input"
                type="text"
                value={finalKey}
                disabled={isSubmitting}
                onChange={(e) => setFinalKey(e.target.value.toUpperCase())}
                placeholder="e.g. PROTOCOL_BREACH_XXXX"
                className="flex-1 px-4 py-3.5 rounded-xl bg-[#08090d] border border-[#1e2432] text-white font-mono text-sm uppercase placeholder:text-gray-600 focus:outline-none focus:border-[#ff004f] focus-visible:ring-2 focus-visible:ring-[#ff004f] transition-colors"
                autoFocus
              />

              <Button
                type="submit"
                disabled={!finalKey.trim() || isSubmitting}
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="w-full sm:w-auto"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                TRANSMIT FINAL KEY
              </Button>
            </div>
          </div>

          {feedback && (
            <div
              role="alert"
              className={`p-4 rounded-xl font-mono text-xs flex items-center gap-3 animate-fade-in ${
                feedback.isError
                  ? 'bg-red-950/40 border border-red-800 text-red-300'
                  : 'bg-[#00e676]/15 border border-[#00e676]/40 text-[#00e676]'
              }`}
            >
              {feedback.isError ? (
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#00e676]" aria-hidden="true" />
              )}
              <div>
                <p className="font-bold">{feedback.message}</p>
                {feedback.isFirstChampion && (
                  <p className="text-amber-400 font-bold mt-1">
                    TOURNAMENT FIRST BREACH CHAMPION!
                  </p>
                )}
              </div>
            </div>
          )}
        </form>
      )}
    </Card>
  );
};
