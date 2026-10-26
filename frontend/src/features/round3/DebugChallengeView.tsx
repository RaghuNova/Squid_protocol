import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';
import { Terminal, Lock, ShieldCheck, Flame, ArrowRight, CheckCircle2, AlertTriangle, Trophy } from 'lucide-react';

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
  pointsAwarded?: number | null;
  onSuccess: () => void;
}

export const DebugChallengeView: React.FC<DebugChallengeViewProps> = ({
  isUnlocked,
  isCompleted,
  challenge,
  completedAt,
  pointsAwarded,
  onSuccess,
}) => {
  const { refreshMe } = useAuth();
  const { playVictory, playError } = useSound();

  const [activeLang, setActiveLang] = useState<'java' | 'python' | 'c'>('python');
  const [finalKey, setFinalKey] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ isError: boolean; message: string; isFirstChampion?: boolean } | null>(null);

  React.useEffect(() => {
    const handleReset = () => {
      setFinalKey('');
      setFeedback(null);
      setIsSubmitting(false);
    };
    window.addEventListener('squid-game-reset', handleReset);
    return () => window.removeEventListener('squid-game-reset', handleReset);
  }, []);

  if (!isUnlocked) {
    return (
      <div className="p-8 text-center bg-[#12151c]/60 rounded-2xl border border-gray-800/80">
        <Lock className="w-10 h-10 text-gray-600 mx-auto mb-3" aria-hidden="true" />
        <h4 className="font-display font-bold text-lg text-gray-400">ROUND 3 LOCKED: THE FINAL BREACH</h4>
        <p className="text-xs font-mono text-gray-500 mt-1">
          Wait for tournament organizers to unlock the final debugging challenge.
        </p>
      </div>
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
    <div className="bg-[#12151c] rounded-2xl border border-gray-800 p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <span className="font-mono text-xs text-[#00e676] uppercase tracking-wider flex items-center gap-1.5 font-bold">
            <Flame className="w-3.5 h-3.5 text-[#ff004f]" aria-hidden="true" />
            ROUND 3 — FINAL ONLINE DEBUGGING PROTOCOL
          </span>
          <h3 className="font-display font-black text-xl sm:text-2xl text-white mt-1">
            {challenge?.title || 'System Core Debugging'}
          </h3>
        </div>

        {isCompleted ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00e676]/20 border border-[#00e676]/50 text-[#00e676] font-mono text-xs font-bold shadow-[0_0_20px_rgba(0,230,118,0.3)]">
            <Trophy className="w-4 h-4 text-[#ffd166]" aria-hidden="true" />
            <span>BREACH CONFIRMED ({pointsAwarded !== null && pointsAwarded !== undefined && pointsAwarded > 0 ? '+' : ''}{pointsAwarded ?? 0} PTS)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 font-mono text-xs px-3 py-1 rounded bg-[#00e676]/10 border border-[#00e676]/30 text-[#00e676] font-semibold">
            <span>FINISHING AWARD BASED ON VERIFIED COMPLETION POSITION</span>
          </div>
        )}
      </div>

      {isCompleted && (
        <div
          role="status"
          className="p-4 rounded-xl bg-[#00e676]/15 border border-[#00e676]/40 text-[#00e676] font-mono text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2"
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
        <div className="p-4 rounded-xl bg-[#090b0f] border border-gray-800 space-y-2">
          <span className="text-gray-400 uppercase tracking-wider font-semibold">INTENDED BEHAVIOR SPEC:</span>
          <p className="text-gray-200 leading-relaxed">{challenge?.description}</p>
          <p className="text-cyan-400 font-semibold">{challenge?.intendedBehavior}</p>
        </div>

        <div className="p-4 rounded-xl bg-[#090b0f] border border-gray-800 space-y-2">
          <span className="text-gray-400 uppercase tracking-wider font-semibold">KEY DERIVATION RULE:</span>
          <p className="text-gray-200">Input Data: <code className="bg-[#181c26] px-1.5 py-0.5 rounded text-white">{challenge?.inputData}</code></p>
          <p className="text-amber-400 font-semibold">{challenge?.derivationRule}</p>
        </div>
      </div>

      {/* Multi-Language Tabs (Java, Python, C) */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-2">
          <span className="font-mono text-xs text-gray-400 flex items-center gap-1.5 font-semibold">
            <Terminal className="w-4 h-4 text-[#ff004f]" aria-hidden="true" />
            INSPECT FIRMWARE CODE IN YOUR PREFERRED LANGUAGE:
          </span>

          <div className="flex items-center gap-1" role="group" aria-label="Programming language selector">
            {(['python', 'java', 'c'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                aria-pressed={activeLang === lang}
                onClick={() => setActiveLang(lang)}
                className={`px-3 py-1 rounded font-mono text-xs uppercase font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] ${
                  activeLang === lang
                    ? 'bg-[#ff004f] text-white shadow-[0_0_10px_rgba(255,0,79,0.5)]'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <pre
          tabIndex={0}
          aria-label={`${activeLang.toUpperCase()} source code`}
          className="p-4 rounded-xl bg-[#090b0f] border border-gray-800 text-cyan-300 font-mono text-xs sm:text-sm overflow-x-auto max-h-72 leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <code>{getCodeForLang()}</code>
        </pre>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-xl border flex items-center gap-3 font-mono text-xs sm:text-sm ${
            feedback.isError
              ? 'bg-red-950/30 border-red-800 text-red-400'
              : 'bg-[#00e676]/15 border-[#00e676]/40 text-[#00e676]'
          }`}
        >
          {feedback.isError ? (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#00e676]" aria-hidden="true" />
          )}
          <div>
            <p className="font-bold">{feedback.message}</p>
            {feedback.isFirstChampion && (
              <p className="text-amber-300 text-xs mt-1 font-semibold flex items-center gap-1">
                <Trophy className="w-4 h-4 text-amber-400 inline" aria-hidden="true" />
                CONGRATULATIONS: FIRST TEAM TO COMPLETE THE FINAL BREACH! FINAL BREACH CHAMPION!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Key Submission Form */}
      {!isCompleted && (
        <form onSubmit={handleSubmitKey} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative w-full sm:w-96">
            <label htmlFor="final-key-override" className="sr-only">
              Derived Final Breach Key
            </label>
            <input
              id="final-key-override"
              type="text"
              value={finalKey}
              onChange={(e) => setFinalKey(e.target.value.toUpperCase())}
              placeholder="e.g. PROTOCOL_BREACH_XXXX"
              className="w-full px-4 py-3 rounded-xl bg-[#090b0f] border border-gray-800 text-white font-mono text-sm tracking-wider uppercase placeholder-gray-600 focus:outline-none focus:border-[#ff004f] focus-visible:ring-2 focus-visible:ring-[#ff004f] transition-colors"
            />
            <p className="mt-1.5 text-[10px] font-mono text-gray-500">
              Enter the full program output or just its numeric checksum.
            </p>
          </div>
          <button
            type="submit"
            disabled={!finalKey.trim() || isSubmitting}
            className={`w-full sm:w-auto px-7 py-3 rounded-xl font-display font-black text-sm tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12151c] ${
              !finalKey.trim()
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : isSubmitting
                ? 'bg-gray-700 text-gray-300'
                : 'bg-[#ff004f] text-white hover:bg-[#ff2e7e] shadow-[0_0_25px_rgba(255,0,79,0.5)]'
            }`}
          >
            {isSubmitting ? (
              'CHECKING KEY...'
            ) : (
              <>
                <Flame className="w-4 h-4" aria-hidden="true" />
                <span>SUBMIT FINAL KEY</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
