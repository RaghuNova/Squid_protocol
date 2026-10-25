import React from 'react';
import { ShieldCheck, Clock, AlertTriangle, Users } from 'lucide-react';

interface CupTransferViewProps {
  isCompleted: boolean;
  verifiedByName?: string;
  verifiedAt?: string;
}

export const CupTransferView: React.FC<CupTransferViewProps> = ({
  isCompleted,
  verifiedByName,
  verifiedAt,
}) => {
  return (
    <div className="bg-[#12151c] rounded-2xl border border-gray-800 p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <span className="font-mono text-xs text-amber-400 uppercase tracking-wider">
            ROUND 3 — STAGE 1 (PHYSICAL PROTOCOL)
          </span>
          <h3 className="font-display font-black text-xl sm:text-2xl text-white mt-1">
            Cup Transfer Challenge
          </h3>
        </div>

        {isCompleted ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00e676]/20 border border-[#00e676]/40 text-[#00e676] font-mono text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>VERIFIED (+50 PTS)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold animate-pulse">
            <Clock className="w-4 h-4" />
            <span>AWAITING VOLUNTEER VERIFICATION</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-mono text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#ff2e7e]" />
            CHALLENGE INSTRUCTIONS:
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm font-mono text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-[#ff004f] font-bold">1.</span>
              <span>Your team must transport <strong>5 paper cups</strong> from Station 1 to Station 2.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#ff004f] font-bold">2.</span>
              <span>Hold the attached strings only. <strong>Do not touch the cups with your hands.</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#ff004f] font-bold">3.</span>
              <span>If a cup drops or falls, return it to Station 1 and try again.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#ff004f] font-bold">4.</span>
              <span>Once all 5 cups are across, ask an event official or volunteer to verify your completion.</span>
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-xl bg-[#090b0f] border border-gray-800 flex flex-col justify-between">
          <div>
            <h4 className="font-mono text-xs text-gray-400 uppercase tracking-wider mb-2">
              VERIFICATION STATUS:
            </h4>
            {isCompleted ? (
              <div className="space-y-2 pt-2">
                <div className="text-[#00e676] font-display font-bold text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Physical Clearance Granted</span>
                </div>
                <p className="text-xs font-mono text-gray-400">
                  Signed off by Official: <strong className="text-white">{verifiedByName}</strong>
                </p>
                {verifiedAt && (
                  <p className="text-[11px] font-mono text-gray-500">
                    Timestamp: {new Date(verifiedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <div className="text-amber-400 font-display font-semibold text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Task In Progress (In-Person Trial)</span>
                </div>
                <p className="text-xs font-mono text-gray-400 leading-relaxed">
                  Complete the task at the venue station. When finished, ask an event official or volunteer to verify your team.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 text-[11px] font-mono text-gray-500 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>An official or volunteer must verify completion before Stage 2 unlocks.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
