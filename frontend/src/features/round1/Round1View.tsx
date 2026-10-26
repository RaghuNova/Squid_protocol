import React, { useState, useEffect } from 'react';
import { Question, RoundControl, SubmissionStatus } from '../../types/game';
import { SignalIndicator } from '../../components/SignalIndicator';
import { CountdownTimer } from '../../components/CountdownTimer';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';
import { Zap, CheckCircle2, XCircle, AlertTriangle, ArrowRight, ShieldAlert, Clock, HelpCircle, Lock } from 'lucide-react';

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
  totalQuestions?: number;
  isCompleted: boolean;
  round2Unlocked?: boolean;
  onEnterRound2?: () => void;
  onRefresh: () => void;
}

export const Round1View: React.FC<Round1ViewProps> = ({
  round,
  timer,
  currentQuestion,
  questionNumber,
  totalQuestions = 20,
  isCompleted,
  round2Unlocked = false,
  onEnterRound2,
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

  useEffect(() => {
    const handleReset = () => {
      setSelectedOption('');
      setFeedback(null);
      setIsSubmitting(false);
    };
    window.addEventListener('squid-game-reset', handleReset);
    return () => window.removeEventListener('squid-game-reset', handleReset);
  }, []);

  const status = timer?.status || round?.status || 'UPCOMING';
  const isUpcoming = status === 'UPCOMING';
  const isPaused = status === 'PAUSED' || timer?.isPaused;
  const isEnded = status === 'ENDED' || timer?.isExpired;
  const isRed = round?.signalState === 'RED';
  const isDoublePoints = Boolean(round?.doublePointsEnabled);

  // 1. Waiting screen before round starts
  if (isUpcoming) {
    return (
      <div className="bg-[#12151c] rounded-2xl border border-gray-800 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 flex items-center justify-center mx-auto" aria-hidden="true">
          <Clock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold text-white tracking-wide">
            Round 1 — The Signal Protocol
          </h2>
          <p className="text-sm font-mono text-cyan-400 font-bold uppercase">
            Status: Waiting to Start
          </p>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed max-w-lg mx-auto">
          Round 1 has not started yet. When it begins, your team will answer {totalQuestions} questions in sequence. Watch the Red Light / Green Light indicator before submitting!
        </p>
        <div className="p-4 rounded-xl bg-black/40 border border-gray-800/80 inline-flex items-center gap-3 font-mono text-xs text-gray-400">
          <Clock className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          <span>Round Duration: 15 Minutes</span>
        </div>
      </div>
    );
  }

  // 2. All questions completed screen
  if (isCompleted) {
    return (
      <div className="bg-[#12151c] rounded-2xl border border-gray-800 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#00e676]/20 border border-[#00e676]/40 text-[#00e676] flex items-center justify-center mx-auto" aria-hidden="true">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold text-white tracking-wide">
            Round 1 Completed
          </h2>
          <p className="text-sm font-mono text-[#00e676]">
            All {totalQuestions} questions have been finalized and scored.
          </p>
        </div>
        {round2Unlocked && onEnterRound2 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-300 leading-relaxed max-w-lg mx-auto">
              Round 2 (The Logic Protocol) is currently OPEN. Enter immediately without waiting for any timer!
            </p>
            <button
              onClick={onEnterRound2}
              className="px-8 py-3 rounded-xl bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-black font-display font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(0,240,255,0.35)] flex items-center gap-2 mx-auto cursor-pointer"
            >
              <span>ENTER ROUND 2</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-300 leading-relaxed max-w-lg mx-auto">
              Your Round 1 answers have been submitted. Your team is eligible for Round 2. Waiting for tournament officials to open the Round 2 access gate.
            </p>
            <button
              onClick={onRefresh}
              className="px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] cursor-pointer"
            >
              Check Round 2 Status
            </button>
          </div>
        )}
      </div>
    );
  }

  // 3. Round ended / expired screen without completing
  if (isEnded && !currentQuestion) {
    return (
      <div className="bg-[#12151c] rounded-2xl border border-gray-800 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-800/40 text-red-400 flex items-center justify-center mx-auto" aria-hidden="true">
          <Clock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold text-white tracking-wide">
            Round 1 Concluded
          </h2>
          <p className="text-sm font-mono text-red-400">
            The 15-minute time limit for Round 1 has expired.
          </p>
        </div>
        {round2Unlocked && onEnterRound2 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-300 max-w-md mx-auto">
              Round 1 has concluded. Under tournament rules, you are eligible to proceed to Round 2.
            </p>
            <button
              onClick={onEnterRound2}
              className="px-8 py-3 rounded-xl bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-black font-display font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(0,240,255,0.35)] flex items-center gap-2 mx-auto cursor-pointer"
            >
              <span>PROCEED TO ROUND 2</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-300 max-w-md mx-auto">
              Submissions for Round 1 are now closed. You are eligible for Round 2. Waiting for tournament officials to begin Round 2.
            </p>
            <button
              onClick={onRefresh}
              className="px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Check Round 2 Status
            </button>
          </div>
        )}
      </div>
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
          className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-4 flex items-center gap-3 text-amber-300 font-mono text-sm"
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
          className="bg-[#ff004f]/10 border border-[#ff004f]/40 rounded-xl p-3 flex items-center justify-between text-white font-mono text-xs"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#ff004f] fill-[#ff004f] animate-pulse motion-reduce:animate-none flex-shrink-0" aria-hidden="true" />
            <span className="font-bold text-[#ff004f] uppercase tracking-wider">DOUBLE POINTS ACTIVE:</span>
            <span className="text-gray-300">Officials activated 2X scoring (Green correct: +20 | Any penalty: -10)</span>
          </div>
        </div>
      )}

      {/* Active Question Card (One Question at a Time) */}
      {currentQuestion ? (
        <div className="bg-[#12151c] rounded-2xl border border-gray-800 p-6 sm:p-8 space-y-6 relative overflow-hidden">
          {/* Question Sequence Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-md bg-[#ff004f]/20 border border-[#ff004f]/40 font-mono text-xs font-bold text-[#ff004f] uppercase tabular-nums">
                QUESTION {questionNumber} OF {totalQuestions}
              </span>
              <span className="font-mono text-xs text-gray-400">
                {currentQuestion.topic}
              </span>
            </div>
            <div className="font-mono text-xs text-gray-400">
              Green correct: <span className="text-white font-bold tabular-nums">+{isDoublePoints ? 20 : 10}</span> · Green wrong / Red Light: <span className="text-white font-bold tabular-nums">-{isDoublePoints ? 10 : 5}</span> pts
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-medium text-white leading-relaxed">
              {currentQuestion.prompt}
            </h3>

            {currentQuestion.codeSnippet && (
              <pre className="p-4 rounded-xl bg-black/60 border border-gray-800 text-gray-300 font-mono text-sm overflow-x-auto">
                <code>{currentQuestion.codeSnippet}</code>
              </pre>
            )}
          </div>

          {/* Options */}
          <div
            className="space-y-3 pt-2"
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
                    className={`w-full text-left p-4 rounded-xl border font-mono text-sm transition-all flex items-start gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12151c] ${
                      isSelected
                        ? 'bg-[#ff004f]/20 border-[#ff004f] text-white shadow-[0_0_15px_rgba(255,0,79,0.3)]'
                        : 'bg-black/30 border-gray-800 text-gray-300 hover:border-gray-700 hover:bg-black/50'
                    } ${isPaused || isEnded ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isSelected
                          ? 'bg-[#ff004f] text-white'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {opt.id}
                    </span>
                    <span className="flex-1 pt-0.5">{opt.text}</span>
                  </button>
                );
              })}
          </div>

          {/* Submission Feedback Banner */}
          {feedback && (
            <div
              role="alert"
              className={`p-4 rounded-xl font-mono text-xs flex items-center gap-3 ${
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

          {/* Red Light Submission Warning (Active in RED light, but button remains clickable) */}
          {isRed && !feedback && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 flex items-center gap-3 text-red-300 font-mono text-xs"
            >
              <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
              <div>
                <span className="font-bold text-red-400 uppercase tracking-wider">RED LIGHT ACTIVE: </span>
                <span>Submitting right now deducts {isDoublePoints ? '10' : '5'} points, even if your answer is correct!</span>
              </div>
            </div>
          )}

          {/* Controls Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-800/80">
            <span className="text-xs font-mono text-gray-500 tabular-nums">
              Sequential Questions: Complete Question {questionNumber} to unlock Question {Math.min(totalQuestions, questionNumber + 1)}.
            </span>

            <button
              onClick={handleSubmit}
              disabled={!selectedOption || isSubmitting || isPaused || isEnded}
              className={`w-full sm:w-auto px-8 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#12151c] ${
                isRed
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] focus-visible:ring-red-500'
                  : 'bg-[#ff004f] hover:bg-[#ff004f]/90 text-white shadow-[0_0_15px_rgba(255,0,79,0.4)] focus-visible:ring-[#ff004f]'
              } ${(!selectedOption || isSubmitting || isPaused || isEnded) ? 'opacity-40 cursor-not-allowed shadow-none' : ''}`}
            >
              {isSubmitting ? (
                <span>Submitting answer...</span>
              ) : isRed ? (
                <>
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  <span className="tabular-nums">Submit During Red Light (-{isDoublePoints ? '10' : '5'} pts)</span>
                </>
              ) : (
                <>
                  <span>Submit Answer</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-[#12151c] rounded-2xl border border-gray-800">
          <HelpCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" aria-hidden="true" />
          <h3 className="font-display font-bold text-lg text-white">No Active Question</h3>
          <p className="text-sm font-mono text-gray-400 mt-1">Waiting for tournament officials.</p>
        </div>
      )}
    </div>
  );
};
