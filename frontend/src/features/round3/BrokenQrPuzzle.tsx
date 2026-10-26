import React, { useEffect, useRef, useState } from 'react';
import type { IScannerControls } from '@zxing/browser';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';
import { Camera, CheckCircle2, Key, Lock, ShieldCheck, X } from 'lucide-react';

interface BrokenQrPuzzleProps {
  isUnlocked: boolean;
  isCompleted: boolean;
  onSuccess: () => void;
}

export const BrokenQrPuzzle: React.FC<BrokenQrPuzzleProps> = ({ isUnlocked, isCompleted, onSuccess }) => {
  const { refreshMe } = useAuth();
  const { playSuccess, playError } = useSound();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const busyRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);
  const [redemptionKey, setRedemptionKey] = useState<string | null>(null);

  const stopScanner = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsScanning(false);
  };

  useEffect(() => () => controlsRef.current?.stop(), []);

  const redeemScannedPayload = async (payload: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const result = await apiRequest('/round3/qr/redeem', {
        method: 'POST',
        body: JSON.stringify({ code: payload })
      });
      stopScanner();
      setRedemptionKey(result.redemptionKey || null);
      setFeedback({ error: false, message: result.message || 'QR code verified. The final challenge is unlocked.' });
      playSuccess();
      await refreshMe();
      onSuccess();
    } catch (error: any) {
      stopScanner();
      setFeedback({ error: true, message: 'QR code could not be verified. Scan your assigned event QR code and try again.' });
      playError();
    } finally {
      busyRef.current = false;
      setIsSubmitting(false);
    }
  };

  const startScanner = async () => {
    if (!videoRef.current || isScanning || isSubmitting) return;
    try {
      setFeedback(null);
      setIsScanning(true);
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (result && !busyRef.current) void redeemScannedPayload(result.getText());
      });
      controlsRef.current = controls;
    } catch {
      setIsScanning(false);
      setFeedback({ error: true, message: 'Camera access is unavailable. Allow camera access and try again.' });
      playError();
    }
  };

  if (!isUnlocked) {
    return <div className="p-8 text-center bg-[#12151c]/60 rounded-2xl border border-gray-800/80">
      <Lock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
      <h4 className="font-display font-bold text-lg text-gray-400">ROUND 3 LOCKED</h4>
      <p className="text-xs font-mono text-gray-500 mt-1">Complete or time out in Round 2 to unlock the final breach.</p>
    </div>;
  }

  return <div className="bg-[#12151c] rounded-2xl border border-gray-800 p-6 sm:p-8 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
      <div>
        <span className="font-mono text-xs text-[#ff004f] uppercase tracking-wider">ROUND 3 — QR VERIFICATION</span>
        <h3 className="font-display font-black text-xl sm:text-2xl text-white mt-1">Scan Your Event QR Code</h3>
      </div>
      {isCompleted ? <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00e676]/20 border border-[#00e676]/40 text-[#00e676] font-mono text-xs font-bold"><ShieldCheck className="w-4 h-4" /> QR VERIFIED</div> : null}
    </div>

    <p className="text-sm text-gray-300 font-mono leading-relaxed">Use this team device to scan the physical QR code provided by event officials. The code is checked securely and is valid once.</p>

    {feedback && <div role={feedback.error ? 'alert' : 'status'} className={`p-4 rounded-xl border flex items-center gap-2.5 font-mono text-xs ${feedback.error ? 'bg-red-950/30 border-red-800 text-red-300' : 'bg-[#00e676]/15 border-[#00e676]/40 text-[#00e676]'}`}>
      <CheckCircle2 className="w-4 h-4" /><span>{feedback.message}</span>
    </div>}

    {redemptionKey && <div className="p-4 rounded-xl bg-black/40 border border-[#00f0ff]/40 text-center space-y-2">
      <div className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-widest">Verified Redemption Key</div>
      <div className="font-mono text-sm text-white break-all flex items-center justify-center gap-2"><Key className="w-4 h-4 text-[#00f0ff]" />{redemptionKey}</div>
    </div>}

    {!isCompleted && !feedback?.error && <div className="space-y-3">
      <video ref={videoRef} className={`${isScanning ? 'block' : 'hidden'} w-full max-h-72 rounded-xl bg-black object-cover`} muted playsInline />
      <div className="flex gap-3">
        {!isScanning ? <button type="button" onClick={startScanner} disabled={isSubmitting} className="flex-1 px-5 py-3 rounded-xl bg-[#ff004f] text-white font-mono text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"><Camera className="w-4 h-4" /> START QR SCANNER</button> : <button type="button" onClick={stopScanner} className="flex-1 px-5 py-3 rounded-xl bg-gray-800 text-white font-mono text-xs font-bold flex items-center justify-center gap-2"><X className="w-4 h-4" /> STOP SCANNER</button>}
      </div>
    </div>}
    {feedback?.error && !isCompleted && <button type="button" onClick={() => { setFeedback(null); void startScanner(); }} className="px-5 py-3 rounded-xl bg-[#ff004f] text-white font-mono text-xs font-bold">TRY SCANNING AGAIN</button>}
  </div>;
};
