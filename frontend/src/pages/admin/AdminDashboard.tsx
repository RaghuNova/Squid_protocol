import React, { useState, useEffect, useRef } from 'react';
import { apiRequest, cleanApiBaseUrl } from '../../services/api';
import { SignalIndicator } from '../../components/SignalIndicator';
import { CountdownTimer } from '../../components/CountdownTimer';
import {
  Play,
  Pause,
  Square,
  Radio,
  Zap,
  Users,
  Trophy,
  QrCode,
  Download,
  CheckCircle2,
  AlertTriangle,
  Activity,
  FileText,
  RotateCcw
} from 'lucide-react';
import { RestartGameModal } from '../../components/admin/RestartGameModal';
import { AdminStatusStrip, AdminSyncStatus } from '../../components/admin/AdminStatusStrip';

const ordinal = (rank: number) => `${rank}${rank % 100 >= 11 && rank % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[rank % 10] || 'th'}`;

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [winnerAnnouncement, setWinnerAnnouncement] = useState<any>(null);
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [isRestartModalOpen, setIsRestartModalOpen] = useState<boolean>(false);
  const [isRestarting, setIsRestarting] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'qrcodes' | 'submissions'>('leaderboard');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pollErrorCount, setPollErrorCount] = useState<number>(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const fetchGeneration = useRef(0);

  const fetchAll = async () => {
    const generation = ++fetchGeneration.current;
    try {
      const [dashRes, leadRes, winnerRes] = await Promise.all([
        apiRequest('/admin/dashboard'),
        apiRequest('/leaderboard').catch(() => ({ teams: [] })),
        apiRequest('/leaderboard/winners').catch(() => null),
      ]);
      if (generation !== fetchGeneration.current) return;
      setData(dashRes);
      setLeaderboard(leadRes.teams || []);
      setWinnerAnnouncement(winnerRes);
      setLastUpdated(new Date());
      setPollErrorCount(0);
      setFetchError(null);
    } catch (err) {
      if (generation !== fetchGeneration.current) return;
      console.error(err);
      setPollErrorCount((prev) => prev + 1);
      const errMsg = err instanceof Error ? err.message : 'Telemetry sync failed';
      setFetchError(errMsg);
    } finally {
      if (generation === fetchGeneration.current) setIsLoading(false);
    }
  };

  const fetchQRCodes = async () => {
    try {
      const res = await apiRequest('/admin/qrcodes');
      setQrCodes(res.qrCodes || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSignalChange = async (signalState: 'GREEN' | 'RED') => {
    setIsActionLoading(true);
    setMessage(null);
    try {
      await apiRequest('/admin/signal', {
        method: 'POST',
        body: JSON.stringify({ signalState }),
      });
      setMessage(`Signal successfully broadcast as ${signalState}.`);
      await fetchAll();
    } catch (err: unknown) {
      setMessage(`Signal error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDoublePointsToggle = async () => {
    if (!data?.stats) return;
    setIsActionLoading(true);
    setMessage(null);
    const newValue = !data.stats.doublePointsEnabled;
    try {
      await apiRequest('/admin/signal', {
        method: 'POST',
        body: JSON.stringify({
          signalState: data.stats.currentSignal,
          doublePointsEnabled: newValue,
        }),
      });
      setMessage(`Double Points mode is now ${newValue ? 'ENABLED (2X)' : 'DISABLED (Normal)'}.`);
      await fetchAll();
    } catch (err: unknown) {
      setMessage(`Double Points error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRoundControl = async (roundId: number, action: 'start' | 'pause' | 'resume' | 'end') => {
    setIsActionLoading(true);
    setMessage(null);
    try {
      const body: Record<string, boolean> = {};
      if (action === 'start') {
        body.startTimer = true;
      } else if (action === 'pause') {
        body.pauseTimer = true;
      } else if (action === 'resume') {
        body.resumeTimer = true;
      } else if (action === 'end') {
        if (!window.confirm(`Are you sure you want to end Round ${roundId}? Submissions will be closed.`)) {
          setIsActionLoading(false);
          return;
        }
        body.endRound = true;
      }

      await apiRequest(`/admin/rounds/${roundId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      setMessage(`Round ${roundId} ${action.toUpperCase()} command successfully executed.`);
      await fetchAll();
    } catch (err: unknown) {
      setMessage(`Round control error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleExportCSV = async () => {
    window.open(`${cleanApiBaseUrl}/api/v1/admin/export/csv`, '_blank');
  };

  const handleConfirmRestart = async () => {
    setIsRestarting(true);
    try {
      const res = await apiRequest('/admin/reset-game', {
        method: 'POST',
        body: JSON.stringify({ confirmation: 'RESET GAME' }),
      });
      setMessage(res.message || 'Game successfully reset to the initial state.');
      setIsRestartModalOpen(false);
      await fetchAll();
    } catch (err: unknown) {
      setMessage(`Restart error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRestarting(false);
    }
  };

  const handleFinalizeWinners = async () => {
    if (winnerAnnouncement?.isFinalized || !window.confirm('Finalize the complete current team ranking? This stores an official snapshot and cannot be finalized again until the game is reset.')) return;
    setIsActionLoading(true);
    try {
      await apiRequest('/leaderboard/winners/finalize', { method: 'POST', body: JSON.stringify({}) });
      setMessage('Final winner board has been finalized.');
      await fetchAll();
    } catch (error) {
      setMessage(`Winner finalization failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const syncStatus: AdminSyncStatus = (() => {
    if (!lastUpdated) return 'offline';
    if (pollErrorCount >= 3) return 'offline';
    if (pollErrorCount > 0) return 'stale';
    const elapsed = Date.now() - lastUpdated.getTime();
    if (elapsed > 16000) return 'offline';
    if (elapsed > 8000) return 'stale';
    return 'live';
  })();
  const boardTeams = winnerAnnouncement?.isFinalized
    ? (winnerAnnouncement.winners || []).map((team: any) => ({ ...team, finalBreachCompletedAt: team.finalBreachCompletedAt ?? team.completedAt }))
    : leaderboard.filter(team => !team.isDisqualified);

  if (isLoading && !data) {
    return (
      <div className="p-8 font-mono text-sm text-gray-400 flex items-center gap-3">
        <Activity className="w-4 h-4 animate-spin text-[#ff004f]" />
        <span>CONNECTING TO EVENT MISSION CONTROL...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <AdminStatusStrip
          status={syncStatus}
          lastUpdated={lastUpdated}
          pollIntervalSeconds={4}
        />
        {fetchError && (
          <div
            role="alert"
            className="p-6 rounded-2xl bg-red-950/60 border border-red-800 text-red-200 font-mono text-xs space-y-3 shadow-lg"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#ff004f] flex-shrink-0" />
              <span className="font-bold text-sm text-white">Central Operations Connection Failed</span>
            </div>
            <p className="text-gray-300">{fetchError}</p>
            <button
              onClick={() => {
                setIsLoading(true);
                fetchAll();
              }}
              className="px-4 py-2 rounded-xl bg-red-900/60 hover:bg-red-800 border border-red-700 text-white font-mono text-xs transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>
    );
  }

  const { stats, rounds, recentSubmissions } = data;
  const r1 = rounds?.find((r: any) => r.id === 1);
  const r2 = rounds?.find((r: any) => r.id === 2);
  const r3 = rounds?.find((r: any) => r.id === 3);

  // Active round detection
  const activeRound = rounds?.find((r: any) => r.status === 'ACTIVE' || r.status === 'PAUSED') || r1;
  const isPaused = activeRound?.status === 'PAUSED' || activeRound?.timer?.isPaused;
  const isRunning = activeRound?.status === 'ACTIVE' && !isPaused;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 0. Admin Status Strip derived ONLY from existing 4s poll + lastUpdated */}
      <AdminStatusStrip
        status={syncStatus}
        lastUpdated={lastUpdated}
        pollIntervalSeconds={4}
      />

      {/* Visible Error Banner on fetchAll failure */}
      {fetchError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 font-mono text-xs flex items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#ff004f] flex-shrink-0" />
            <div>
              <span className="font-bold text-white block">Operations Telemetry Sync Failed</span>
              <span>{fetchError} (Automated 4s retry active)</span>
            </div>
          </div>
          <button
            onClick={() => fetchAll()}
            className="px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 border border-red-700 text-white font-mono text-xs transition-colors cursor-pointer flex-shrink-0"
          >
            Retry Now
          </button>
        </div>
      )}

      {/* Mission Control Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <span className="font-mono text-xs text-[#ff004f] uppercase tracking-widest flex items-center gap-1.5">
            <Radio className="w-4 h-4 animate-pulse motion-reduce:animate-none" />
            CENTRAL EVENT CONTROL DASHBOARD
          </span>
          <h1 className="font-display font-black text-3xl text-white uppercase tracking-tight mt-1">
            Tournament Operations Console
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs px-3 py-1.5 rounded-lg bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30 flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            <span>{stats.connectedClients} Connected Squads</span>
          </span>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsRestartModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/50 font-mono text-xs font-bold uppercase transition-all cursor-pointer"
            title="Reset game progress after two confirmations"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Game</span>
          </button>
        </div>
      </div>

      {/* Status Notice Banner (at most one live region for status notices) */}
      {message && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-xl bg-gray-900 border border-cyan-800/60 text-cyan-300 font-mono text-xs flex items-center justify-between gap-2 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00e676]" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Live Event Status & Authoritative Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#12151c] border border-gray-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3">
            <div>
              <span className="font-mono text-xs text-gray-400 uppercase">CURRENT EVENT PHASE:</span>
              <h2 className="font-display font-black text-2xl text-white mt-0.5">
                {activeRound?.title || 'Squid Protocol Arena'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full font-mono text-xs font-bold uppercase tracking-wider ${
                  isRunning
                    ? 'bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40 animate-pulse motion-reduce:animate-none'
                    : isPaused
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : activeRound?.status === 'ENDED'
                    ? 'bg-red-950/40 text-red-400 border border-red-900/40'
                    : 'bg-cyan-950/40 text-cyan-300 border border-cyan-900/40'
                }`}
              >
                {activeRound?.status || 'UPCOMING'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-black/40 border border-gray-800/80">
              <span className="text-gray-500 block">Round Duration</span>
              <span className="text-white font-bold text-sm">{activeRound?.durationMinutes || 15} Mins</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-gray-800/80">
              <span className="text-gray-500 block">Total Teams</span>
              <span className="text-white font-bold text-sm">{stats.totalTeams} Teams</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-gray-800/80">
              <span className="text-gray-500 block">Submissions</span>
              <span className="text-white font-bold text-sm">{stats.totalScoreEvents} Recorded</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-gray-800/80">
              <span className="text-gray-500 block">Final Breaches</span>
              <span className="text-[#00e676] font-bold text-sm">{stats.finalBreachesCount} Completed</span>
            </div>
          </div>
        </div>

        {/* Live Authoritative Timer Component */}
        <div className="p-6 rounded-2xl bg-[#12151c] border border-gray-800 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="font-mono text-xs text-gray-400 uppercase">SERVER AUTHORITATIVE CLOCK</span>
            <p className="text-xs text-gray-500">
              Synchronized across all terminals via WebSocket/SSE.
            </p>
          </div>
          <div className="my-4">
            <CountdownTimer
              endTime={activeRound?.timer?.endTime ?? activeRound?.endTime}
              remainingSeconds={activeRound?.timer?.remainingSeconds ?? activeRound?.remainingSeconds}
              status={activeRound?.status}
              isPaused={isPaused}
              className="text-base py-3 justify-center"
            />
          </div>
          <div className="flex items-center gap-2">
            {isRunning && (
              <button
                onClick={() => handleRoundControl(activeRound.id, 'pause')}
                disabled={isActionLoading}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Timer</span>
              </button>
            )}
            {isPaused && (
              <button
                onClick={() => handleRoundControl(activeRound.id, 'resume')}
                disabled={isActionLoading}
                className="flex-1 py-2 rounded-xl bg-[#00e676] hover:bg-[#00e676]/90 text-black font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Resume Timer</span>
              </button>
            )}
            {(isRunning || isPaused) && (
              <button
                onClick={() => handleRoundControl(activeRound.id, 'end')}
                disabled={isActionLoading}
                className="py-2 px-3 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-400 font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                <span>End</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Round Progression Controls */}
      <div className="p-6 rounded-2xl bg-[#12151c] border border-gray-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-lg text-white">Event Round Transitions</h3>
            <p className="text-xs font-mono text-gray-400">
              Start each round in sequential order. Starting a new round automatically closes and archives submissions from earlier rounds.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Round 1 Card */}
          <div className="p-4 rounded-xl bg-[#090b0f] border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-white">ROUND 1: SIGNAL</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                r1?.status === 'ACTIVE' ? 'bg-[#00e676]/20 text-[#00e676]' : r1?.status === 'ENDED' ? 'bg-red-950 text-red-400' : 'bg-gray-800 text-gray-400'
              }`}>
                {r1?.status || 'UPCOMING'}
              </span>
            </div>
            <p className="text-xs font-mono text-gray-400">
              20 sequential MCQs with Red Light / Green Light rules. 15 minutes per team.
            </p>
            {r1?.status === 'UPCOMING' ? (
              <button
                onClick={() => handleRoundControl(1, 'start')}
                disabled={isActionLoading}
                className="w-full py-2.5 rounded-lg bg-[#ff004f] hover:bg-[#ff004f]/90 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Round 1</span>
              </button>
            ) : r1?.status === 'ACTIVE' || r1?.status === 'PAUSED' ? (
              <button
                onClick={() => handleRoundControl(1, 'end')}
                disabled={isActionLoading}
                className="w-full py-2.5 rounded-lg bg-red-950/50 hover:bg-red-900 border border-red-800 text-red-400 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                End Round 1
              </button>
            ) : (
              <div className="text-center py-2 text-xs font-mono text-gray-500">Round 1 Ended</div>
            )}
          </div>

          {/* Round 2 Card */}
          <div className="p-4 rounded-xl bg-[#090b0f] border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-white">ROUND 2: LOGIC</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                r2?.status === 'ACTIVE' ? 'bg-[#00e676]/20 text-[#00e676]' : r2?.status === 'ENDED' ? 'bg-red-950 text-red-400' : 'bg-gray-800 text-gray-400'
              }`}>
                {r2?.status || 'UPCOMING'}
              </span>
            </div>
            <p className="text-xs font-mono text-gray-400">
              Stage 1 Shape Sudoku (+100) unlocks Stage 2 Broken Logic (+200). 20 mins.
            </p>
            {r2?.status === 'UPCOMING' ? (
              <button
                onClick={() => handleRoundControl(2, 'start')}
                disabled={isActionLoading || r1?.status === 'UPCOMING'}
                className={`w-full py-2.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                  r1?.status === 'UPCOMING'
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-black cursor-pointer'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Round 2</span>
              </button>
            ) : r2?.status === 'ACTIVE' || r2?.status === 'PAUSED' ? (
              <button
                onClick={() => handleRoundControl(2, 'end')}
                disabled={isActionLoading}
                className="w-full py-2.5 rounded-lg bg-red-950/50 hover:bg-red-900 border border-red-800 text-red-400 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                End Round 2
              </button>
            ) : (
              <div className="text-center py-2 text-xs font-mono text-gray-500">Round 2 Ended</div>
            )}
          </div>

          {/* Round 3 Card */}
          <div className="p-4 rounded-xl bg-[#090b0f] border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-white">ROUND 3: FINAL BREACH</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                r3?.status === 'ACTIVE' ? 'bg-[#00e676]/20 text-[#00e676]' : r3?.status === 'ENDED' ? 'bg-red-950 text-red-400' : 'bg-gray-800 text-gray-400'
              }`}>
                {r3?.status || 'UPCOMING'}
              </span>
            </div>
            <p className="text-xs font-mono text-gray-400">
                Offline tasks + team PIN verification + online debugging (+200). 30 mins.
            </p>
            {r3?.status === 'UPCOMING' ? (
              <button
                onClick={() => handleRoundControl(3, 'start')}
                disabled={isActionLoading || r2?.status === 'UPCOMING'}
                className={`w-full py-2.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                  r2?.status === 'UPCOMING'
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-[#00e676] hover:bg-[#00e676]/90 text-black cursor-pointer'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Round 3</span>
              </button>
            ) : r3?.status === 'ACTIVE' || r3?.status === 'PAUSED' ? (
              <button
                onClick={() => handleRoundControl(3, 'end')}
                disabled={isActionLoading}
                className="w-full py-2.5 rounded-lg bg-red-950/50 hover:bg-red-900 border border-red-800 text-red-400 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                End Round 3
              </button>
            ) : (
              <div className="text-center py-2 text-xs font-mono text-gray-500">Round 3 Ended</div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Round 1 Signal Controls & Double Points */}
      <div className="p-6 rounded-2xl bg-[#12151c] border border-gray-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-white">Round 1 Authoritative Signal & Multiplier Controls</h3>
            <p className="text-xs font-mono text-gray-400">
              Directly toggle Red Light, Green Light, and Double Points (2X) across all participant consoles.
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-gray-400">CURRENT STATUS:</span>
            <span className={`px-2.5 py-1 rounded font-bold uppercase ${
              stats.currentSignal === 'GREEN' ? 'bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40' : 'bg-[#ff004f]/20 text-[#ff004f] border border-[#ff004f]/40'
            }`}>
              {stats.currentSignal} LIGHT
            </span>
            <span className={`px-2.5 py-1 rounded font-bold uppercase ${
              stats.doublePointsEnabled ? 'bg-[#ffd166]/20 text-[#ffd166] border border-[#ffd166]/40' : 'bg-gray-800 text-gray-400'
            }`}>
              {stats.doublePointsEnabled ? '2X ACTIVE' : '1X NORMAL'}
            </span>
          </div>
        </div>

        {/* Primary Controls: 3 Buttons Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. RED LIGHT BUTTON */}
          <button
            onClick={() => handleSignalChange('RED')}
            aria-pressed={stats.currentSignal === 'RED'}
            disabled={isActionLoading}
            className={`p-6 rounded-2xl border flex flex-col items-center justify-between gap-4 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12151c] ${
              stats.currentSignal === 'RED'
                ? 'bg-[#ff004f]/20 border-[#ff004f] shadow-[0_0_30px_rgba(255,0,79,0.5)] text-white ring-1 ring-[#ff004f]'
                : 'bg-[#090b0f] border-gray-800 text-gray-400 hover:border-[#ff004f]/50 hover:text-white'
            } ${isActionLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="w-14 h-14 rounded-full bg-[#ff004f]/20 border-2 border-[#ff004f] flex items-center justify-center">
              <span className={`w-6 h-6 rounded-full bg-[#ff004f] ${stats.currentSignal === 'RED' ? 'animate-ping motion-reduce:animate-none' : ''}`} />
            </div>
            <div className="text-center space-y-1">
              <span className="font-display font-black text-2xl tracking-wider uppercase text-[#ff004f] block">
                RED LIGHT
              </span>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-950 text-red-300 border border-red-800">
                {stats.currentSignal === 'RED' ? 'Currently Active' : 'Switch to Red Light'}
              </span>
            </div>
            <p className="font-mono text-[11px] text-gray-400 text-center leading-relaxed">
              Penalties active: Any submission incurs {stats.doublePointsEnabled ? '-100' : '-50'} pts. Correctness hidden.
            </p>
          </button>

          {/* 2. GREEN LIGHT BUTTON */}
          <button
            onClick={() => handleSignalChange('GREEN')}
            aria-pressed={stats.currentSignal === 'GREEN'}
            disabled={isActionLoading}
            className={`p-6 rounded-2xl border flex flex-col items-center justify-between gap-4 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12151c] ${
              stats.currentSignal === 'GREEN'
                ? 'bg-[#00e676]/20 border-[#00e676] shadow-[0_0_30px_rgba(0,230,118,0.4)] text-white ring-1 ring-[#00e676]'
                : 'bg-[#090b0f] border-gray-800 text-gray-400 hover:border-[#00e676]/50 hover:text-white'
            } ${isActionLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="w-14 h-14 rounded-full bg-[#00e676]/20 border-2 border-[#00e676] flex items-center justify-center">
              <span className={`w-6 h-6 rounded-full bg-[#00e676] ${stats.currentSignal === 'GREEN' ? 'animate-pulse motion-reduce:animate-none' : ''}`} />
            </div>
            <div className="text-center space-y-1">
              <span className="font-display font-black text-2xl tracking-wider uppercase text-[#00e676] block">
                GREEN LIGHT
              </span>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40">
                {stats.currentSignal === 'GREEN' ? 'Currently Active' : 'Switch to Green Light'}
              </span>
            </div>
            <p className="font-mono text-[11px] text-gray-400 text-center leading-relaxed">
              Safe play: Correct answer +{stats.doublePointsEnabled ? '200' : '100'} pts. Wrong answer -{stats.doublePointsEnabled ? '100' : '50'} pts.
            </p>
          </button>

          {/* 3. DOUBLE POINTS ON/OFF BUTTON */}
          <button
            onClick={handleDoublePointsToggle}
            aria-pressed={Boolean(stats.doublePointsEnabled)}
            disabled={isActionLoading}
            className={`p-6 rounded-2xl border flex flex-col items-center justify-between gap-4 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12151c] ${
              stats.doublePointsEnabled
                ? 'bg-[#ffd166]/15 border-[#ffd166] shadow-[0_0_30px_rgba(255,209,102,0.35)] text-white ring-1 ring-[#ffd166]'
                : 'bg-[#090b0f] border-gray-800 text-gray-400 hover:border-[#ffd166]/50 hover:text-white'
            } ${isActionLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center ${
              stats.doublePointsEnabled
                ? 'bg-[#ffd166]/20 border-[#ffd166] text-[#ffd166]'
                : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}>
              <Zap className={`w-7 h-7 ${stats.doublePointsEnabled ? 'fill-[#ffd166] animate-bounce motion-reduce:animate-none' : ''}`} />
            </div>
            <div className="text-center space-y-1">
              <span className={`font-display font-black text-2xl tracking-wider uppercase block ${
                stats.doublePointsEnabled ? 'text-[#ffd166]' : 'text-gray-300'
              }`}>
                DOUBLE POINTS {stats.doublePointsEnabled ? 'ON' : 'OFF'}
              </span>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                stats.doublePointsEnabled
                  ? 'bg-[#ffd166]/20 text-[#ffd166] border border-[#ffd166]/40'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}>
                {stats.doublePointsEnabled ? '2X Active (Click to Disable)' : '1X Normal (Click to Enable)'}
              </span>
            </div>
            <p className="font-mono text-[11px] text-gray-400 text-center leading-relaxed">
              Multiplies both positive rewards and negative deductions by 2 (+200 / -100).
            </p>
          </button>
        </div>
      </div>

      {/* 4. Monitoring Navigation Tabs */}
      <div className="p-6 rounded-2xl bg-[#12151c] border border-gray-800 space-y-6">
        <div className="flex border-b border-gray-800 gap-4">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`pb-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'text-[#ffd166] border-b-2 border-[#ffd166]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Winner Board ({leaderboard.filter(team => !team.isDisqualified).length})
          </button>
          <button
            onClick={() => {
              setActiveTab('qrcodes');
              if (qrCodes.length === 0) fetchQRCodes();
            }}
            className={`pb-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'qrcodes'
                ? 'text-[#00f0ff] border-b-2 border-[#00f0ff]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Round 3 QR Codes & Tokens
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`pb-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'submissions'
                ? 'text-[#00e676] border-b-2 border-[#00e676]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Recent Submissions ({recentSubmissions?.length || 0})
          </button>
        </div>

        {/* Tab 1: Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-display font-bold text-white">{winnerAnnouncement?.isFinalized ? 'FINALIZED WINNER BOARD' : 'LIVE / PROVISIONAL WINNER BOARD'}</h3>
              <p className="font-mono text-[10px] text-gray-500">Total score, then Round 3 place, earlier final answer, earlier overall completion, then team code.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => void fetchAll()} className="px-3 py-2 rounded-lg bg-gray-800 text-xs font-mono text-white hover:bg-gray-700">Refresh</button>
              <button onClick={() => void handleFinalizeWinners()} disabled={winnerAnnouncement?.isFinalized || isActionLoading || leaderboard.every(team => team.isDisqualified)} className="px-3 py-2 rounded-lg bg-amber-500 text-black text-xs font-mono font-bold disabled:opacity-40">{winnerAnnouncement?.isFinalized ? 'WINNERS FINALIZED' : 'FINALIZE WINNERS'}</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-[#090b0f] text-gray-400">
                  <th className="py-3 px-3">Rank</th><th className="py-3 px-3">Team</th><th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3 text-center">Round 1</th><th className="py-3 px-3 text-center">Round 2</th>
                  <th className="py-3 px-3 text-center">R3 Place</th><th className="py-3 px-3 text-center">R3 Award</th>
                  <th className="py-3 px-3">Final Answer</th><th className="py-3 px-3">Completed</th><th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {boardTeams.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 px-4 text-center text-gray-500 font-mono text-xs">
                      No squad rankings available yet.
                    </td>
                  </tr>
                ) : (
                  boardTeams.map((t: any, idx: number) => (
                    <tr key={t.teamCode} className={`hover:bg-gray-800/30 ${idx === 0 ? 'bg-amber-500/5' : idx < 3 ? 'bg-gray-300/[0.025]' : ''}`}>
                      <td className={`py-2.5 px-3 font-bold ${idx < 3 ? 'text-amber-300' : 'text-gray-500'}`}>{ordinal(idx + 1)}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white mr-2">{t.teamCode}</span>
                        <span className="text-gray-300">{t.name}</span>
                        {t.members && <small className="block text-gray-500 mt-1">{t.members}</small>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#00e676] text-sm">{t.totalScore} PTS</td>
                      <td className="py-2.5 px-3 text-center text-gray-300">{t.r1Score}<small className="block text-gray-500">{t.round1Status}</small></td>
                      <td className="py-2.5 px-3 text-center text-gray-300">{t.r2Score}<small className="block text-gray-500">{t.round2Status}</small></td>
                      <td className="py-2.5 px-3 text-center text-gray-300">{t.r3Position ? ordinal(t.r3Position) : '—'}</td>
                      <td className="py-2.5 px-3 text-center text-gray-300">{t.r3Points ?? '—'}</td>
                      <td className="py-2.5 px-3 text-gray-400">{t.finalAnswerSubmittedAt ? new Date(t.finalAnswerSubmittedAt).toLocaleString() : '—'}</td>
                      <td className="py-2.5 px-3 text-gray-400">{t.finalBreachCompletedAt ? new Date(t.finalBreachCompletedAt).toLocaleString() : '—'}</td>
                      <td className="py-2.5 px-3 text-gray-300">{t.gameStatus}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {/* Tab 2: Round 3 QR Codes */}
        {activeTab === 'qrcodes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-400">
                Scan the QR to display the same team PIN used to unlock Round 3.
              </span>
              <button
                onClick={fetchQRCodes}
                className="px-3 py-1.5 rounded-lg bg-gray-800 text-xs font-mono text-white hover:bg-gray-700"
              >
                Refresh QR List
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {qrCodes.map((q) => (
                <div key={q.teamId} className="p-3 rounded-xl bg-black/40 border border-gray-800 text-center space-y-2">
                  {q.qrDataUrl && (
                    <img src={q.qrDataUrl} alt={`${q.teamCode} physical QR code`} className="w-24 h-24 mx-auto rounded-lg bg-white p-1" />
                  )}
                  <div className="font-mono text-xs">
                    <span className="font-bold text-white block">{q.teamCode}</span>
                    <code className="text-[10px] text-cyan-300">{q.qrText || `${q.teamCode}#2026`}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Recent Submissions */}
        {activeTab === 'submissions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-[#090b0f] text-gray-400">
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3">Team</th>
                  <th className="py-3 px-3 text-center">Round</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {!recentSubmissions || recentSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-gray-500 font-mono text-xs">
                      No recent submissions recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentSubmissions.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-800/30">
                      <td className="py-2.5 px-3 text-gray-500">
                        {new Date(s.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white mr-1.5">{s.team?.teamCode}</span>
                        <span className="text-gray-400">{s.team?.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-gray-300">R{s.round}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.status === 'CORRECT'
                              ? 'bg-[#00e676]/20 text-[#00e676]'
                              : s.status === 'PENALIZED'
                              ? 'bg-red-950 text-red-400'
                              : 'bg-red-900/30 text-red-300'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-200">
                        {s.pointsAwarded > 0 ? `+${s.pointsAwarded}` : s.pointsAwarded}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Isolated Development-Only Restart Confirmation Dialog */}
      <RestartGameModal
        isOpen={isRestartModalOpen}
        onClose={() => setIsRestartModalOpen(false)}
        onConfirm={handleConfirmRestart}
        isLoading={isRestarting}
      />
    </div>
  );
};
export default AdminDashboard;
