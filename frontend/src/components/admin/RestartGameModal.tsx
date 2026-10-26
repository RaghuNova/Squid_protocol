import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, X, ShieldAlert } from 'lucide-react';

interface RestartGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export const RestartGameModal: React.FC<RestartGameModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [firstConfirmed, setFirstConfirmed] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState('');
  if (!isOpen) return null;

  const close = () => {
    if (isLoading) return;
    setFirstConfirmed(false);
    setTypedConfirmation('');
    onClose();
  };

  const confirm = async () => {
    if (!firstConfirmed || typedConfirmation !== 'RESET GAME' || isLoading) return;
    await onConfirm();
    setFirstConfirmed(false);
    setTypedConfirmation('');
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="presentation">
    <section role="dialog" aria-modal="true" aria-labelledby="reset-game-title" className="relative w-full max-w-xl bg-[#12151c] border border-red-500/50 rounded-2xl p-6 sm:p-8 space-y-5 shadow-[0_0_50px_rgba(255,0,79,0.2)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400"><RotateCcw className="w-6 h-6" /></div>
          <div><span className="font-mono text-[10px] text-red-400 uppercase tracking-widest block font-bold">IRREVERSIBLE ACTION</span><h3 id="reset-game-title" className="font-display font-black text-xl text-white">Reset Game?</h3></div>
        </div>
        <button type="button" onClick={close} disabled={isLoading} aria-label="Close reset confirmation" className="p-1.5 rounded-lg text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
      </div>

      <div className="p-4 rounded-xl bg-black/40 border border-gray-800 text-gray-300 font-mono text-xs leading-relaxed space-y-3">
        <p className="font-medium text-white">This clears all scores, submissions, round progress, verification records, QR redemptions, finish positions, and finalized winners. Teams, accounts, memberships, questions, puzzles, solutions, and event configuration remain.</p>
        <p className="flex gap-2 text-amber-300"><ShieldAlert className="w-4 h-4 flex-shrink-0" /> Every team's QR token will be replaced. Previously printed QR codes will stop working.</p>
      </div>

      <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-800 text-xs text-gray-300 font-mono">
        <input type="checkbox" checked={firstConfirmed} onChange={e => setFirstConfirmed(e.target.checked)} disabled={isLoading} className="mt-0.5 accent-red-500" />
        <span><AlertTriangle className="w-4 h-4 inline text-red-400 mr-1" /> I understand this will reset the current event's game progress.</span>
      </label>

      {firstConfirmed && <label className="block space-y-2 font-mono text-xs text-gray-300">
        <span>Type <strong className="text-white">RESET GAME</strong> to enable the final confirmation.</span>
        <input value={typedConfirmation} onChange={e => setTypedConfirmation(e.target.value)} disabled={isLoading} autoComplete="off" className="w-full px-3 py-2 rounded-lg bg-black border border-gray-700 text-white" />
      </label>}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={close} disabled={isLoading} className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono text-xs font-bold">Cancel</button>
        <button type="button" onClick={() => void confirm()} disabled={isLoading || !firstConfirmed || typedConfirmation !== 'RESET GAME'} className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-black uppercase flex items-center gap-2 disabled:opacity-40">
          {isLoading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Resetting…</> : <><RotateCcw className="w-4 h-4" /> Reset Game</>}
        </button>
      </div>
    </section>
  </div>;
};
