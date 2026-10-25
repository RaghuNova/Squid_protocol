import React, { useState } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';
import { QrCode, Lock, ShieldCheck, ArrowRight, CheckCircle2, AlertTriangle, Key } from 'lucide-react';

interface BrokenQrPuzzleProps {
  isUnlocked: boolean;
  isCompleted: boolean;
  onSuccess: () => void;
}

export const BrokenQrPuzzle: React.FC<BrokenQrPuzzleProps> = ({
  isUnlocked,
  isCompleted,
  onSuccess,
}) => {
  const { refreshMe } = useAuth();
  const { playSuccess, playError } = useSound();

  const [tokenCode, setTokenCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ isError: boolean; message: string } | null>(null);

  // Visual interactive quadrant piece states for participant engagement:
  const [rotations, setRotations] = useState<number[]>([90, 180, 270, 0]);

  const handleRotatePiece = (idx: number) => {
    if (isCompleted) return;
    const updated = [...rotations];
    updated[idx] = (updated[idx] + 90) % 360;
    setRotations(updated);
  };

  const handleAutoAlign = () => {
    setRotations([0, 0, 0, 0]);
  };

  const handleSubmitToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenCode.trim() || isSubmitting || isCompleted) return;

    setIsSubmitting(true);
    try {
      const res = await apiRequest('/round3/qr/redeem', {
        method: 'POST',
        body: JSON.stringify({ code: tokenCode.trim() }),
      });

      playSuccess();
      setFeedback({ isError: false, message: res.message || 'Access token authenticated! (+50 pts)' });
      await refreshMe();
      onSuccess();
    } catch (err: any) {
      playError();
      setFeedback({ isError: true, message: err.message || 'Invalid access token. Check that you scanned your own team’s QR code.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isUnlocked) {
    return (      <div className="p-8 text-center bg-[#12151c]/60 rounded-2xl border border-gray-800/80">
        <Lock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <h4 className="font-display font-bold text-lg text-gray-400">STAGE 2 LOCKED: BROKEN QR RECONSTRUCTION</h4>
        <p className="text-xs font-mono text-gray-500 mt-1">
          Complete the Stage 1 physical cup transfer and get official verification to unlock this stage.
        </p>
      </div>
    );
  }

  const allAligned = rotations.every((r) => r === 0);

  return (
    <div className="bg-[#12151c] rounded-2xl border border-gray-800 p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <span className="font-mono text-xs text-[#ff004f] uppercase tracking-wider">
            ROUND 3 — STAGE 2
          </span>
          <h3 className="font-display font-black text-xl sm:text-2xl text-white mt-1">
            Broken QR Code Reconstruction
          </h3>
        </div>

        {isCompleted ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00e676]/20 border border-[#00e676]/40 text-[#00e676] font-mono text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>ACCESS TOKEN REDEEMED (+50 PTS)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 font-mono text-xs px-3 py-1 rounded bg-[#ff004f]/10 border border-[#ff004f]/30 text-[#ff004f]">
            <span>PRIZE: +50 PTS</span>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-300 font-mono leading-relaxed">
        Assemble your team's physical QR fragments, scan the completed QR code using a phone or scanner, and enter the recovered Access ID below.
      </p>

      {/* Interactive QR Reconstruction Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
        <div className="flex flex-col items-center gap-3">
          <div className="w-64 h-64 grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#090b0f] border-2 border-dashed border-gray-700 shadow-2xl">
            {rotations.map((rot, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isCompleted}
                onClick={() => handleRotatePiece(idx)}
                className="w-full h-full rounded-xl bg-[#12151c] border border-gray-800 hover:border-[#ff004f]/60 transition-transform duration-200 flex flex-col items-center justify-center p-2 group cursor-pointer"
                style={{ transform: `rotate(${rot}deg)` }}
                title="Click to rotate fragment 90°"
              >
                <div className="w-12 h-12 border-2 border-[#ff004f]/70 rounded p-1 flex items-center justify-center bg-black/40">
                  <div className="w-6 h-6 bg-[#ff004f]/40 rounded-sm" />
                </div>
                <span className="text-[10px] font-mono text-gray-500 mt-1">
                  Q{idx + 1} ({rot}°)
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <button
              onClick={handleAutoAlign}
              className="text-[#00f0ff] hover:underline"
            >
              [Auto-Align Preview]
            </button>
            <span className="text-gray-600">•</span>
            <span className={allAligned ? 'text-[#00e676]' : 'text-amber-400'}>
              {allAligned ? 'Matrix Aligned' : 'Click fragments to align'}
            </span>
          </div>
        </div>

        {/* Access Token Input Form */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#090b0f] border border-gray-800 space-y-2">
            <h4 className="font-mono text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-[#ff004f]" />
              PHYSICAL QR FRAGMENTS:
            </h4>
            <p className="text-xs font-mono text-gray-300 leading-relaxed">
              Assemble the 4 physical cards given to your team by tournament officials. Scan the completed QR code to find your team's token (Format: <code>SQ-TK-XXXX</code>).
            </p>
          </div>

          {feedback && (
            <div
              className={`p-4 rounded-xl border flex items-center gap-2.5 font-mono text-xs sm:text-sm ${
                feedback.isError
                  ? 'bg-red-950/30 border-red-800 text-red-400'
                  : 'bg-[#00e676]/15 border-[#00e676]/40 text-[#00e676]'
              }`}
            >
              {feedback.isError ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {!isCompleted && (
            <form onSubmit={handleSubmitToken} className="space-y-3">
              <label className="block font-mono text-xs text-gray-400">
                ENTER ACCESS ID:
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={tokenCode}
                    onChange={(e) => setTokenCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SQ-TK-8821"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#090b0f] border border-gray-800 text-white font-mono text-sm tracking-wider uppercase placeholder-gray-600 focus:outline-none focus:border-[#ff004f]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!tokenCode.trim() || isSubmitting}
                  className={`px-6 py-3 rounded-xl font-display font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${
                    !tokenCode.trim()
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : isSubmitting
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-[#ff004f] text-white hover:bg-[#ff2e7e] shadow-[0_0_20px_rgba(255,0,79,0.35)] cursor-pointer'
                  }`}
                >
                  {isSubmitting ? (
                    'CHECKING CODE...'
                  ) : (
                    <>
                      <span>SUBMIT CODE</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
