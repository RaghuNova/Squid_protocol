import React, { useState, useEffect } from 'react';
import { Question, RoundControl } from '../../types/game';
import { SignalIndicator } from '../../components/SignalIndicator';
import { CountdownTimer } from '../../components/CountdownTimer';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';
import {
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Clock,
  HelpCircle,
  Lock,
} from 'lucide-react';
import { Card, Badge, Button, TerminalWindow } from '../../components/ui';

interface Round1ViewProps {
  round: RoundControl | null;
  timer?: {
    status: string;
    remainingSeconds: number;
    endTime: string | null;
    isPaused: boolean;
    isExpired: boolean;
  };
  currentQuestion: Question | null;
  questionNumber: number;
  totalQuestions: number;
  isCompleted: boolean;
  onRefresh: () => void;
}

export const Round1View: React.FC<Round1ViewProps> = ({
  round,
  timer,
  currentQuestion,
  questionNumber,
  totalQuestions = 10,
  isCompleted,
  onRefresh,
}) => {
  const { refreshMe } = useAuth();
  const { playSuccess, playError } = useSound();

  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'penalty';
    message: string;
    points?: number;
  } | null>(null);

  const status = timer?.status || round?.status || 'UPCOMING';
  const isUpcoming = status === 'UPCOMING';
  const isPaused = status === 'PAUSED' || timer?.isPaused;
  const isEnded = status === 'ENDED' || timer?.isExpired;
  const isRed = round?.signalState === 'RED';
  const isDoublePoints = Boolean(round?.doublePointsEnabled);

  // Keyboard shortcut listener: Press A, B, C, D to select option
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (isSubmitting || isPaused || isEnded || !currentQuestion) return;

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        setSelectedOption(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, isPaused, isEnded, currentQuestion]);

  // 1. Waiting screen before round starts
  if (isUpcoming) {
    return (
      <Card variant="elevated" cornerAccents className="p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 flex items-center justify-center mx-auto" aria-hidden="true">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-display font-bold text-white tracking-wide">
            Round 1 — The Signal Protocol
          </h2>
          <Badge variant="cyan" size="sm">
            AWAITING START SIGNAL
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-gray-300 font-mono leading-relaxed max-w-lg mx-auto">
          Tournament officials have not activated Round 1 yet. When the round begins, your team will receive 10 questions delivered sequentially. Watch the Red Light / Green Light signal carefully!
        </p>
        <div className="p-3 rounded-xl bg-[#08090d] border border-[#1e2432] inline-flex items-center gap-2.5 font-mono text-xs text-gray-400">
          <Clock className="w-4 h-4 text-[#00f0ff]" aria-hidden="true" />
          <span>Scheduled Round Duration: 15 Minutes</span>
        </div>
      </Card>
    );
  }

  // 2. All questions completed screen
  if (isCompleted) {
    return (
      <Card variant="elevated" cornerAccents className="p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-[#00e676]/15 border border-[#00e676]/40 text-[#00e676] flex items-center justify-center mx-auto" aria-hidden="true">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-display font-bold text-white tracking-wide">
            Round 1 Completed
          </h2>
          <Badge variant="success" size="sm" hasDot>
            10 / 10 QUESTIONS FINALIZED
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-gray-300 font-mono leading-relaxed max-w-lg mx-auto">
          Your responses for Round 1 have been securely committed to the server ledger. Stand by for tournament officials to announce Round 2 — The Logic Protocol.
        </p>
        <Button
          onClick={onRefresh}
          variant="secondary"
          size="sm"
          className="mx-auto"
        >
          REFRESH PROTOCOL STATUS
        </Button>
      </Card>
    );
  }

  // 3. Round ended / expired screen without completing
  if (isEnded && !currentQuestion) {
    return (
      <Card variant="elevated" cornerAccents className="p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-800/40 text-red-400 flex items-center justify-center mx-auto" aria-hidden="true">
          <Clock className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-display font-bold text-white tracking-wide">
            Round 1 Concluded
          </h2>
          <Badge variant="danger" size="sm">
            TIME EXPIRED (15 MIN)
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-gray-300 font-mono max-w-md mx-auto">
          Submissions for Round 1 are now closed. Awaiting tournament officials to transition to Round 2.
        </p>
      </Card>
    );
  }

  const handleSelectOption = (optId: string) => {
    if (isSubmitting || isPaused || isEnded) return;
    setSelectedOption(optId);
  };

  const handleSubmit = async () => {
    if (!currentQuestion || !selectedOption || isSubmitting || isPaused || isEnded) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await apiRequest('/round1/submit', {
        method: 'POST',
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedOption,
        }),
      });

      if (res.status === 'PENALIZED') {
        playError();
        setFeedback({
          type: 'penalty',
          message: res.message || 'RED LIGHT — Submission detected. Penalty applied.',
          points: res.pointsAwarded,
        });
      } else if (res.isCorrect) {
        playSuccess();
        setFeedback({
          type: 'success',
          message: res.message || `GREEN LIGHT — Correct answer! +${res.pointsAwarded} points.`,
          points: res.pointsAwarded,
        });
      } else {
        playError();
        setFeedback({
          type: 'error',
          message: res.message || `GREEN LIGHT — Wrong answer. ${res.pointsAwarded} points.`,
          points: res.pointsAwarded,
        });
      }

      await refreshMe();
      // Advance to next question after brief feedback
      setTimeout(() => {
        setSelectedOption('');
        setFeedback(null);
        onRefresh();
      }, 1500);
    } catch (err: any) {
      playError();
      setFeedback({
        type: 'error',
        message: err.message || 'Submission rejected by authoritative server engine.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Signal Indicator & Clock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SignalIndicator signal={round?.signalState || 'GREEN'} />
        </div>
        <div className="flex items-center justify-end">
          <CountdownTimer
            endTime={timer?.endTime ?? round?.endTime}
            remainingSeconds={timer?.remainingSeconds ?? round?.remainingSeconds}
            status={status}
            isPaused={isPaused}
            onExpire={onRefresh}
            className="w-full justify-center lg:justify-end"
          />
        </div>
      </div>

      {/* Admin Pause Banner */}
      {isPaused && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-4 flex items-center gap-3 text-amber-300 font-mono text-xs sm:text-sm animate-fade-in"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          <div>
            <span className="font-bold uppercase tracking-wider">ROUND 1 CURRENTLY PAUSED: </span>
            <span>Timer is frozen by tournament officials. Submissions are temporarily suspended.</span>
          </div>
        </div>
      )}

      {/* Admin Double Points Banner */}
      {isDoublePoints && (
        <div
          role="status"
          aria-label="Double points modifier active"
          className="bg-[#f59e0b]/10 border border-[#f59e0b]/40 rounded-xl p-3 flex items-center justify-between text-white font-mono text-xs animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#f59e0b] fill-[#f59e0b] animate-pulse motion-reduce:animate-none flex-shrink-0" aria-hidden="true" />
            <span className="font-bold text-[#f59e0b] uppercase tracking-wider">DOUBLE POINTS ACTIVE:</span>
            <span className="text-gray-300">Officials activated 2X scoring (Correct: +200 | Wrong: -100 | Red Light: -100)</span>
          </div>
        </div>
      )}

      {/* Active Question Card (One Question at a Time) */}
      {currentQuestion ? (
        <Card variant="elevated" cornerAccents className="p-6 sm:p-8 space-y-6 relative overflow-hidden">
          {/* Question Sequence Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1e2432]">
            <div className="flex items-center gap-3">
              <Badge variant="danger" size="md">
                QUESTION {questionNumber} OF {totalQuestions}
              </Badge>
              <span className="font-mono text-xs text-gray-400">
                {currentQuestion.topic}
              </span>
            </div>
            <div className="font-mono text-xs text-gray-400">
              Value: <span className="text-white font-bold tabular-nums">{isDoublePoints ? '+200 / -100' : '+100 / -50'}</span> pts
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-medium text-white leading-relaxed">
              {currentQuestion.prompt}
            </h3>

            {currentQuestion.codeSnippet && (
              <TerminalWindow
                title="source_snippet.c"
                code={currentQuestion.codeSnippet}
                language="c"
                showLineNumbers
              />
            )}
          </div>

          {/* Options with Keyboard Shortcuts */}
          <div
            className="space-y-2.5 pt-2"
            role="group"
            aria-label="Multiple choice answers"
          >
            {Array.isArray(currentQuestion.options) &&
              currentQuestion.options.map((opt: { id: string; text: string }) => {
                const isSelected = selectedOption === opt.id;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={isSubmitting || isPaused || isEnded}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-left p-4 rounded-xl border font-mono text-xs sm:text-sm transition-all flex items-start gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] ${
                      isSelected
                        ? 'bg-[#ff004f]/15 border-[#ff004f] text-white shadow-red-sm'
                        : 'bg-[#08090d] border-[#1e2432] text-gray-300 hover:border-[#2c3447] hover:bg-[#141822]'
                    } ${isPaused || isEnded ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#ff004f] text-white'
                          : 'bg-[#151922] text-gray-400 border border-[#2c3447]'
                      }`}
                    >
                      {opt.id}
                    </span>
                    <span className="flex-1 pt-0.5 leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
          </div>

          {/* Submission Feedback Banner */}
          {feedback && (
            <div
              role="alert"
              className={`p-4 rounded-xl font-mono text-xs flex items-center gap-3 animate-fade-in ${
                feedback.type === 'success'
                  ? 'bg-[#00e676]/10 border border-[#00e676]/30 text-[#00e676]'
                  : feedback.type === 'penalty'
                  ? 'bg-red-950/40 border border-red-800 text-red-400'
                  : 'bg-red-950/30 border border-red-900/40 text-red-400'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#00e676]" aria-hidden="true" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0 text-red-400" aria-hidden="true" />
              )}
              <div className="flex-1">
                <p className="font-bold">{feedback.message}</p>
                {typeof feedback.points === 'number' && (
                  <p className="text-[11px] opacity-80 mt-0.5 tabular-nums">
                    Score impact: {feedback.points > 0 ? `+${feedback.points}` : feedback.points} pts
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Red Light Submission Warning */}
          {isRed && !feedback && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 flex items-center gap-3 text-red-300 font-mono text-xs animate-fade-in"
            >
              <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
              <div>
                <span className="font-bold text-red-400 uppercase tracking-wider">RED LIGHT ACTIVE: </span>
                <span>Submissions are penalized! Submitting now will deduct {isDoublePoints ? '100' : '50'} points regardless of answer correctness.</span>
              </div>
            </div>
          )}

          {/* Controls Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#1e2432]">
            <span className="text-[11px] font-mono text-gray-500 tabular-nums">
              Keyboard shortcut: Press A, B, C, or D to select option.
            </span>

            <Button
              onClick={handleSubmit}
              disabled={!selectedOption || isSubmitting || isPaused || isEnded}
              variant={isRed ? 'danger' : 'primary'}
              size="md"
              isLoading={isSubmitting}
              className="w-full sm:w-auto"
              rightIcon={!isRed && <ArrowRight className="w-4 h-4" />}
            >
              {isRed
                ? `Submit During Red Light (-${isDoublePoints ? '100' : '50'} pts)`
                : 'Submit Answer'}
            </Button>
          </div>
        </Card>
      ) : (
        <Card variant="elevated" className="p-8 text-center space-y-2">
          <HelpCircle className="w-10 h-10 text-gray-500 mx-auto mb-2" aria-hidden="true" />
          <h3 className="font-display font-bold text-lg text-white">No Active Question</h3>
          <p className="text-xs font-mono text-gray-400">Waiting for tournament officials.</p>
        </Card>
      )}
    </div>
  );
};
