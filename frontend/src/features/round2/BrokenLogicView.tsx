import React, { useState } from 'react';
import { BrokenLogicData } from '../../types/game';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';
import { Terminal, ShieldCheck, Lock, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface BrokenLogicViewProps {
  data: BrokenLogicData;
  onSuccess: () => void;
}

export const BrokenLogicView: React.FC<BrokenLogicViewProps> = ({ data, onSuccess }) => {
  const { refreshMe } = useAuth();
  const { playSuccess, playError } = useSound();

  const [outputVal, setOutputVal] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ isError: boolean; message: string } | null>(null);

  if (!data.isUnlocked) {
    return (
      <div className="p-8 text-center bg-[#12151c]/60 rounded-2xl border border-gray-800/80">
        <Lock className="w-10 h-10 text-gray-600 mx-auto mb-3" aria-hidden="true" />
        <h4 className="font-display font-bold text-lg text-gray-400">STAGE 2 LOCKED: BROKEN LOGIC</h4>
        <p className="text-xs font-mono text-gray-500 mt-1">
          Complete the Stage 1 Shape Sudoku puzzle to unlock Stage 2.
        </p>
      </div>
    );
  }

  const puzzle = data.puzzle;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outputVal.trim() || isSubmitting || data.isCompleted) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await apiRequest('/round2/broken-logic/submit', {
        method: 'POST',
        body: JSON.stringify({ submittedOutput: outputVal.trim() })
      });

      playSuccess();
      setFeedback({ isError: false, message: res.message || 'Challenge solved successfully! (+200 pts)' });
      await refreshMe();
      onSuccess();
    } catch (err: any) {
      playError();
      setFeedback({ isError: true, message: err.message || 'Incorrect output value. Review the logic specification.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#12151c] rounded-2xl border border-gray-800 p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <span className="font-mono text-xs text-[#ff004f] uppercase tracking-wider">
            ROUND 2 — STAGE 2
          </span>
          <h3 className="font-display font-black text-xl sm:text-2xl text-white mt-1">
            {puzzle?.title || 'Broken Logic Protocol'}
          </h3>
        </div>

        {data.isCompleted ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00e676]/20 border border-[#00e676]/40 text-[#00e676] font-mono text-xs font-bold">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>SOLVED & UNLOCKED (+200 PTS)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 font-mono text-xs px-3 py-1 rounded bg-[#ff004f]/10 border border-[#ff004f]/30 text-[#ff004f]">
            <span>PRIZE: +{puzzle?.points || 200} PTS</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#181c26] border border-gray-800">
          <h4 className="font-mono text-xs text-amber-400 font-semibold mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            CHALLENGE OVERVIEW:
          </h4>
          <p className="text-sm font-mono text-gray-200 whitespace-pre-line leading-relaxed">
            {puzzle?.scenario}
          </p>
        </div>

        {puzzle?.codeSnippet && (
          <div className="space-y-2">
            <span className="font-mono text-xs text-gray-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
              SOURCE CODE:
            </span>
            <pre className="p-4 rounded-xl bg-[#090b0f] border border-gray-800 text-cyan-300 font-mono text-xs sm:text-sm overflow-x-auto">
              <code>{puzzle.codeSnippet}</code>
            </pre>
          </div>
        )}
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
          {feedback.isError ? <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#00e676]" aria-hidden="true" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {!data.isCompleted && (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative w-full sm:w-80">
            <label htmlFor="broken-logic-accumulator" className="sr-only">
              Expected Output Value
            </label>
            <input
              id="broken-logic-accumulator"
              type="text"
              value={outputVal}
              onChange={(e) => setOutputVal(e.target.value)}
              placeholder="Enter final output value..."
              className="w-full px-4 py-3 rounded-xl bg-[#090b0f] border border-gray-800 text-white font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff004f] focus-visible:ring-2 focus-visible:ring-[#ff004f] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!outputVal.trim() || isSubmitting}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-display font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12151c] ${
              !outputVal.trim()
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : isSubmitting
                ? 'bg-gray-700 text-gray-300'
                : 'bg-[#ff004f] text-white hover:bg-[#ff2e7e] shadow-[0_0_20px_rgba(255,0,79,0.35)]'
            }`}
          >
            {isSubmitting ? (
              'CHECKING ANSWER...'
            ) : (
              <>
                <span>SUBMIT ANSWER</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
