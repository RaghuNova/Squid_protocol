import React from 'react';
import { Radio } from 'lucide-react';

export type AdminSyncStatus = 'live' | 'stale' | 'offline';

export interface AdminStatusStripProps {
  status: AdminSyncStatus;
  lastUpdated: Date | null;
  pollIntervalSeconds?: number;
  className?: string;
}

export const AdminStatusStrip: React.FC<AdminStatusStripProps> = ({
  status,
  lastUpdated,
  pollIntervalSeconds = 4,
  className = '',
}) => {
  const isLive = status === 'live';
  const isStale = status === 'stale';

  const statusConfig = {
    live: {
      badgeBg: 'bg-[#00e676]/15 border-[#00e676]/40 text-[#00e676]',
      dotColor: 'bg-[#00e676]',
      label: 'LIVE',
      description: 'Operations telemetry synchronized',
    },
    stale: {
      badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
      dotColor: 'bg-amber-400',
      label: 'STALE',
      description: 'Telemetry update delayed',
    },
    offline: {
      badgeBg: 'bg-red-950/60 border-red-800 text-red-400',
      dotColor: 'bg-[#ff004f]',
      label: 'OFFLINE',
      description: 'Telemetry sync disconnected',
    },
  }[status];

  return (
    <div
      role="region"
      aria-label="Admin telemetry status strip"
      className={`p-3 sm:p-4 rounded-2xl bg-[#0f1218] border border-[#1e2432] shadow-subtle select-none ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Console Feed Identity */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#151922] border border-[#1e2432]">
            <Radio
              className={`w-3.5 h-3.5 ${
                isLive
                  ? 'text-[#00e676] animate-pulse motion-reduce:animate-none'
                  : isStale
                  ? 'text-amber-400'
                  : 'text-[#ff004f]'
              }`}
              aria-hidden="true"
            />
          </div>
          <span className="font-display font-black text-xs sm:text-sm tracking-wider text-white uppercase">
            ADMIN TELEMETRY
          </span>
          <span className="text-gray-600 font-mono text-xs" aria-hidden="true">•</span>
          <span className="text-xs font-mono text-gray-400">
            {statusConfig.description}
          </span>
        </div>

        {/* Right: Status badge, Last updated time, Poll interval info */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-mono text-gray-500">
            POLL: {pollIntervalSeconds}s
          </span>

          <span className="text-gray-700 font-mono text-xs" aria-hidden="true">|</span>

          {/* Last-updated time: static display, NO aria-live on changing values */}
          <span className="text-[11px] font-mono text-gray-400">
            LAST SYNC:{' '}
            <span className="text-gray-200 font-semibold">
              {lastUpdated ? lastUpdated.toLocaleTimeString() : 'NEVER'}
            </span>
          </span>

          {/* Status Badge: Static display, NO aria-live */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold ${statusConfig.badgeBg}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${statusConfig.dotColor} ${
                isLive ? 'animate-ping motion-reduce:animate-none' : ''
              }`}
              aria-hidden="true"
            />
            <span>{statusConfig.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
