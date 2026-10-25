import React from 'react';
import { SignalState } from '../types/game';
import { CountdownTimer } from './CountdownTimer';
import { Wifi, WifiOff, Zap, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';
import { Badge } from './ui/Badge';

export type SSEConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

interface SystemStatusStripProps {
  protocolNumber: number;
  protocolTitle: string;
  stageName: string;
  signalState: SignalState;
  doublePointsEnabled: boolean;
  isPaused: boolean;
  timerEndTime?: string | null;
  timerRemainingSeconds?: number | null;
  timerStatus?: string;
  connectionStatus: SSEConnectionStatus;
  onTimerExpire?: () => void;
  className?: string;
}

export const SystemStatusStrip: React.FC<SystemStatusStripProps> = ({
  protocolNumber,
  protocolTitle,
  stageName,
  signalState,
  doublePointsEnabled,
  isPaused,
  timerEndTime,
  timerRemainingSeconds,
  timerStatus,
  connectionStatus,
  onTimerExpire,
  className = '',
}) => {
  const isGreen = signalState === 'GREEN';

  return (
    <section
      aria-label="Authoritative system telemetry status"
      className={`p-3.5 sm:p-4 rounded-2xl bg-[#0f1218] border border-[#1e2432] shadow-subtle select-none transition-all ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Left Section: Active Protocol & Stage */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#ff004f] shadow-red-sm"
              aria-hidden="true"
            />
            <span className="font-display font-black text-xs sm:text-sm tracking-wider text-white uppercase">
              PROTOCOL 0{protocolNumber}:
            </span>
            <span className="font-mono text-xs text-gray-300 font-semibold uppercase">
              {protocolTitle}
            </span>
          </div>

          <span className="hidden sm:inline-block text-gray-600 font-mono text-xs" aria-hidden="true">•</span>

          <span className="px-2.5 py-0.5 rounded-lg bg-[#151922] border border-[#2c3447] font-mono text-[11px] text-[#00f0ff] font-medium tracking-wide">
            {stageName}
          </span>
        </div>

        {/* Center / Right Section: Signal + 2X + Silent Timer + Link Health */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-between lg:justify-end">
          {/* Signal State Compact Pill */}
          <div
            aria-label={`Server signal state: ${isGreen ? 'Green Light' : 'Red Light'}`}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold transition-all ${
              isGreen
                ? 'bg-[#00e676]/15 border-[#00e676]/40 text-[#00e676]'
                : 'bg-red-950/50 border-red-800/80 text-red-400'
            }`}
          >
            {isGreen ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00e676]" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
            )}
            <span>{isGreen ? 'GREEN LIGHT' : 'RED LIGHT'}</span>
          </div>

          {/* Double Points Pill (when enabled) */}
          {doublePointsEnabled && (
            <div
              aria-label="Double points multiplier active"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f59e0b]/15 border border-[#f59e0b]/40 text-[#f59e0b] font-mono text-xs font-bold"
            >
              <Zap className="w-3.5 h-3.5 fill-[#f59e0b] animate-pulse motion-reduce:animate-none" aria-hidden="true" />
              <span>2X POINTS</span>
            </div>
          )}

          {/* Authoritative Timer Component */}
          <CountdownTimer
            endTime={timerEndTime}
            remainingSeconds={timerRemainingSeconds}
            status={timerStatus}
            isPaused={isPaused}
            announce={false}
            onExpire={onTimerExpire}
            className="text-xs py-1"
          />

          {/* Central Telemetry Link Status */}
          <div
            role="status"
            aria-label={`Central telemetry link status: ${
              connectionStatus === 'connected'
                ? 'Connected and receiving live updates'
                : connectionStatus === 'reconnecting'
                ? 'Reconnecting to central server stream'
                : 'Offline'
            }`}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] font-semibold ${
              connectionStatus === 'connected'
                ? 'bg-[#00e676]/10 border-[#00e676]/30 text-[#00e676]'
                : connectionStatus === 'reconnecting'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 animate-pulse motion-reduce:animate-none'
                : 'bg-red-950/60 border-red-800 text-red-400'
            }`}
          >
            {connectionStatus === 'connected' ? (
              <>
                <Radio className="w-3 h-3 text-[#00e676]" aria-hidden="true" />
                <span className="hidden sm:inline">TELEMETRY:</span>
                <span>LIVE</span>
              </>
            ) : connectionStatus === 'reconnecting' ? (
              <>
                <Wifi className="w-3 h-3 text-amber-400" aria-hidden="true" />
                <span>RECONNECTING</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-red-400" aria-hidden="true" />
                <span>OFFLINE</span>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
