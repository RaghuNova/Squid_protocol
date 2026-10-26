import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';
import { CheckCircle2, Key, Lock, ShieldCheck } from 'lucide-react';

interface BrokenQrPuzzleProps {
  isUnlocked: boolean;
  isAuthorized: boolean;
  onSuccess: () => void;
}

export const BrokenQrPuzzle: React.FC<BrokenQrPuzzleProps> = ({ isUnlocked, isAuthorized, onSuccess }) => {
  const { refreshMe } = useAuth();
  const { playSuccess, playError } = useSound();
  const [accessKey, setAccessKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);

  useEffect(() => {
    const handleReset = () => {
      setAccessKey('');
      setFeedback(null);
      setIsSubmitting(false);
    };
    window.addEventListener('squid-game-reset', handleReset);
    return () => window.removeEventListener('squid-game-reset', handleReset);
  }, []);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessKey.trim() || isSubmitting || isAuthorized) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const result = await apiRequest('/round3/debug/authorize', {
        method: 'POST',
        body: JSON.stringify({ accessKey: accessKey.trim() })
      });
      setFeedback({ error: false, message: result.message || 'Access key verified.' });
      playSuccess();
      await refreshMe();
      onSuccess();
    } catch (error) {
      setFeedback({ error: true, message: error instanceof Error ? error.message : 'Team PIN could not be verified. Enter the same PIN used to sign in.' });
      playError();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isUnlocked) {
    return <div className="p-8 text-center bg-[#12151c]/60 rounded-2xl border border-gray-800/80">
      <Lock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
      <h4 className="font-display font-bold text-lg text-gray-400">ROUND 3 LOCKED</h4>
      <p className="text-xs font-mono text-gray-500 mt-1">Complete or time out in Round 2 to become eligible for the final breach.</p>
    </div>;
  }

  return <div className="bg-[#12151c] rounded-2xl border border-gray-800 p-6 sm:p-8 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
      <div>
        <span className="font-mono text-xs text-[#ff004f] uppercase tracking-wider">ROUND 3 — TEAM PIN VERIFICATION</span>
        <h3 className="font-display font-black text-xl sm:text-2xl text-white mt-1">Verify Your Team Access</h3>
      </div>
      {isAuthorized && <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00e676]/20 border border-[#00e676]/40 text-[#00e676] font-mono text-xs font-bold"><ShieldCheck className="w-4 h-4" /> ACCESS VERIFIED</div>}
    </div>

    {!isAuthorized && <div className="p-5 rounded-xl bg-black/30 border border-gray-800 space-y-2">

      <p className="text-xs text-gray-500 font-mono">Enter the PIN shown by your team's QR or the same PIN you use to sign in.</p>
    </div>}

    {!isAuthorized && <form onSubmit={handleVerify} className="space-y-4">
        <label htmlFor="round3-access-key" className="block text-xs font-mono uppercase tracking-wider text-cyan-300">Team account PIN</label>
      <div className="flex flex-col sm:flex-row gap-3">
        <input id="round3-access-key" autoComplete="off" spellCheck={false} value={accessKey} onChange={event => setAccessKey(event.target.value)} placeholder="Enter your team login PIN" aria-describedby="round3-access-key-help" className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-gray-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400" />
        <button type="submit" disabled={isSubmitting || !accessKey.trim()} aria-busy={isSubmitting} className="px-5 py-3 rounded-xl bg-[#ff004f] text-white font-mono text-xs font-bold disabled:opacity-50">{isSubmitting ? 'VERIFYING…' : 'VERIFY TEAM PIN'}</button>
      </div>
      <p id="round3-access-key-help" className="text-xs text-gray-500 font-mono">Use your existing team account PIN. The key is checked against your team's stored login credential.</p>
    </form>}

    {isAuthorized && <div role="status" className="p-4 rounded-xl bg-[#00e676]/15 border border-[#00e676]/40 text-[#00e676] font-mono text-xs flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4" />Team PIN verified. Your final debugging challenge is unlocked.</div>}
    {feedback && <div role={feedback.error ? 'alert' : 'status'} className={`p-4 rounded-xl border flex items-center gap-2.5 font-mono text-xs ${feedback.error ? 'bg-red-950/30 border-red-800 text-red-300' : 'bg-[#00e676]/15 border-[#00e676]/40 text-[#00e676]'}`}><Key className="w-4 h-4" /><span>{feedback.message}</span></div>}
  </div>;
};
