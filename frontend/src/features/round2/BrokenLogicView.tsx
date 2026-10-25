import React, { useState } from 'react';
import { BrokenLogicData } from '../../types/game';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';
import { Terminal, ShieldCheck, Lock, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, Badge, Button, TerminalWindow } from '../../components/ui';

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
      <Card variant="bordered" className="p-8 text-center bg-[#0f1218]/50 space-y-3">
        <Lock className="w-8 h-8 text-gray-600 mx-auto" aria-hidden="true" />
        <h4 className="font-display font-bold text-base text-gray-400">STAGE 2 LOCKED — THE BROKEN LOGIC</h4>
        <p className="text-xs font-mono text-gray-500">
          Complete Stage 1 Shape Sudoku to breach this security layer.
        </p>
      </Card>
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
    <Card variant="elevated" cornerAccents className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e2432] pb-4">
        <div>
          <Badge variant="danger" size="sm">
            ROUND 2 — STAGE 2
          </Badge>
          <h3 className="font-display font-black text-xl sm:text-2xl text-white mt-1">
            {puzzle?.title || 'Broken Logic Protocol'}
          </h3>
        </div>

        {data.isCompleted ? (
          <Badge variant="success" size="md" hasDot>
            SOLVED & UNLOCKED (+200 PTS)
          </Badge>
        ) : (
          <Badge variant="warning" size="md">
            PRIZE: +{puzzle?.points || 200} PTS
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#08090d] border border-[#1e2432]">
          <h4 className="font-mono text-xs text-[#f59e0b] font-semibold mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#f59e0b]" aria-hidden="true" />
            SYSTEM DIAGNOSTIC REPORT:
          </h4>
          <p className="text-xs sm:text-sm font-mono text-gray-300 whitespace-pre-line leading-relaxed">
            {puzzle?.scenario}
          </p>
        </div>

        {puzzle?.codeSnippet && (
          <TerminalWindow
            title="decompiled_logic.py"
            code={puzzle.codeSnippet}
            language="python"
            showLineNumbers
          />
        )}
      </div>

      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-xl border flex items-center gap-3 font-mono text-xs sm:text-sm animate-fade-in ${
            feedback.isError
              ? 'bg-red-950/40 border-red-800 text-red-300'
              : 'bg-[#00e676]/15 border-[#00e676]/40 text-[#00e676]'
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

      {!data.isCompleted && (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative w-full sm:w-80">
            <label htmlFor="broken-logic-accumulator" className="sr-only">
              Expected Accumulator Output
            </label>
            <input
              id="broken-logic-accumulator"
              type="text"
              value={outputVal}
              onChange={(e) => setOutputVal(e.target.value)}
              placeholder="Enter expected accumulator value..."
              className="w-full px-4 py-3 rounded-xl bg-[#08090d] border border-[#1e2432] text-white font-mono text-xs sm:text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff004f] focus-visible:ring-2 focus-visible:ring-[#ff004f] transition-colors"
            />
          </div>
          <Button
            type="submit"
            disabled={!outputVal.trim() || isSubmitting}
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="w-full sm:w-auto"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            VALIDATE ACCUMULATOR
          </Button>
        </form>
      )}
    </Card>
  );
};
