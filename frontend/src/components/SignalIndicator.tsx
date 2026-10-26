import React, { useState, useEffect, useRef } from 'react';
import { SignalState } from '../types/game';
import { useSound } from '../context/SoundContext';
import { AlertTriangle, ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface SignalIndicatorProps {
  signal: SignalState;
  penaltyMode?: boolean;
  className?: string;
}

export const SignalIndicator: React.FC<SignalIndicatorProps> = ({
  signal,
  className = '',
}) => {
  const { playGreenLight, playRedLight } = useSound();
  const prevSoundSignal = useRef<SignalState>(signal);
  const lastAnnouncedSignal = useRef<SignalState | null>(null);
  const [signalAnnouncement, setSignalAnnouncement] = useState<string>('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Audio tone generation on real state transition
  useEffect(() => {
    if (prevSoundSignal.current !== signal) {
      if (signal === 'GREEN') {
        playGreenLight();
      } else {
        playRedLight();
      }
      prevSoundSignal.current = signal;
    }
  }, [signal, playGreenLight, playRedLight]);

  // Flicker-guarded screen reader announcement:
  // Fired ONLY when signal transitions between GREEN and RED, NEVER on mount or SSE reconnect with same signal
  useEffect(() => {
    if (lastAnnouncedSignal.current !== null && lastAnnouncedSignal.current !== signal) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        setSignalAnnouncement(
          signal === 'GREEN'
            ? 'System traffic signal updated: Green Light active. Submissions accepted safely.'
            : 'Warning: System traffic signal changed to Red Light. All submissions are now penalized.'
        );
      }, 200);
    }
    lastAnnouncedSignal.current = signal;

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [signal]);

  const isGreen = signal === 'GREEN';

  return (
    <>
      {/* Separate visually-hidden polite status region; no repeat announcements on re-render */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {signalAnnouncement}
      </div>

      <div
        role="region"
        aria-label={`System Traffic Signal: ${isGreen ? 'Green Light' : 'Red Light'}`}
        className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 select-none ${
          isGreen
            ? 'border-[#00e676]/50 bg-[#00e676]/10 text-[#00e676] shadow-[0_0_20px_rgba(0,230,118,0.25)]'
            : 'border-[#ff004f]/60 bg-[#ff004f]/15 text-[#ff004f] shadow-[0_0_25px_rgba(255,0,79,0.4)]'
        } ${className}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Beacon with dual color and shape cue */}
            <div className="relative flex h-6 w-6 items-center justify-center flex-shrink-0" aria-hidden="true">
              <span
                className={`absolute inline-flex h-full w-full animate-ping motion-reduce:hidden rounded-full opacity-75 ${
                  isGreen ? 'bg-[#00e676]' : 'bg-[#ff004f]'
                }`}
              />
              <span
                className={`relative inline-flex h-4 w-4 rounded-full ${
                  isGreen ? 'bg-[#00e676]' : 'bg-[#ff004f]'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs tracking-wider uppercase opacity-80">SIGNAL STATE:</span>
                <span className="font-display font-black tracking-widest text-lg sm:text-xl uppercase flex items-center gap-1.5">
                  {isGreen ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-[#00e676] flex-shrink-0" aria-hidden="true" />
                      <span>GREEN LIGHT</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-[#ff004f] flex-shrink-0" aria-hidden="true" />
                      <span>RED LIGHT</span>
                    </>
                  )}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    isGreen
                      ? 'bg-[#00e676]/20 border-[#00e676]/40 text-[#00e676]'
                      : 'bg-red-950/60 border-red-800 text-red-300'
                  }`}
                >
                  {isGreen ? 'Safe Transmission' : 'Submission Penalty Active'}
                </span>
              </div>

              <p className="text-xs font-mono opacity-90 mt-1 leading-relaxed">
                {isGreen ? (
                  'Green Light: correct +10 (+20 Double); wrong -5 (-10 Double). Red Light: any answer -5 (-10 Double).'
                ) : (
                  <span className="text-red-300 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 inline flex-shrink-0 text-[#ff004f]" aria-hidden="true" />
                    RED LIGHT ACTIVE: Submitting now deducts 5 points (10 with Double Points), regardless of correctness!
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {isGreen ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00e676]/20 border border-[#00e676]/30 text-xs font-mono font-bold">
                <ShieldCheck className="w-4 h-4 text-[#00e676]" aria-hidden="true" />
                <span>SAFE PROTOCOL</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff004f]/20 border border-[#ff004f]/40 text-xs font-mono font-bold">
                <ShieldAlert className="w-4 h-4 text-[#ff004f]" aria-hidden="true" />
                <span>PENALTY ENFORCED</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
