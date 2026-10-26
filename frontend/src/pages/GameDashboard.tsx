import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest, cleanApiBaseUrl } from '../services/api';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { SystemStatusStrip, SSEConnectionStatus } from '../components/SystemStatusStrip';
import { Round1View } from '../features/round1/Round1View';
import { ShapeSudoku } from '../features/round2/ShapeSudoku';
import { BrokenLogicView } from '../features/round2/BrokenLogicView';
import { Round3View } from '../features/round3/Round3View';
import { CountdownTimer } from '../components/CountdownTimer';
import { RoundControl, Question, SudokuData, BrokenLogicData } from '../types/game';
import { Users, Lock, CheckCircle2, ShieldCheck, Flame, Radio, ArrowRight, AlertTriangle } from 'lucide-react';

export const GameDashboard: React.FC = () => {
  const { user, team, isLoading: authLoading, refreshMe } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<number>(1);
  const [connectionStatus, setConnectionStatus] = useState<SSEConnectionStatus>('reconnecting');

  const [round1Data, setRound1Data] = useState<{
    round: RoundControl | null;
    timer?: any;
    currentQuestion: Question | null;
    questionNumber: number;
    totalQuestions: number;
    isCompleted: boolean;
  }>({
    round: null,
    currentQuestion: null,
    questionNumber: 0,
    totalQuestions: 10,
    isCompleted: false,
  });

  const [round2Data, setRound2Data] = useState<{
    round: RoundControl | null;
    timer?: any;
    isUnlocked: boolean;
    currentStage: number;
    sudoku: SudokuData | null;
    brokenLogic: BrokenLogicData | null;
    message?: string;
  }>({
    round: null,
    isUnlocked: false,
    currentStage: 1,
    sudoku: null,
    brokenLogic: null,
  });
  const [round2LoadError, setRound2LoadError] = useState<string | null>(null);

  const [round3Data, setRound3Data] = useState<{
    round: RoundControl | null;
    timer?: any;
    isUnlocked: boolean;
    isAccessKeyAuthorized: boolean;
    isCompleted: boolean;
    pointsAwarded?: number | null;
    completedAt?: string | null;
    challenge: any;
  }>({
    round: null,
    isUnlocked: false,
    isAccessKeyAuthorized: false,
    isCompleted: false,
    challenge: null,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Authentication check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'TEAM')) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Fetch Round 1 Data
  const fetchRound1 = useCallback(async () => {
    try {
      const res = await apiRequest<any>('/round1/questions');
      setRound1Data({
        round: res.round,
        timer: res.timer,
        currentQuestion: res.currentQuestion,
        questionNumber: res.questionNumber || 0,
        totalQuestions: res.totalQuestions || 10,
        isCompleted: Boolean(res.isCompleted),
      });
    } catch (err) {
      console.error('Failed to fetch Round 1 data', err);
    }
  }, []);

  // Fetch Round 2 Data
  const fetchRound2 = useCallback(async () => {
    try {
      const res = await apiRequest<any>('/round2/data');
      setRound2LoadError(null);
      setRound2Data({
        round: res.round,
        timer: res.timer,
        isUnlocked: Boolean(res.isUnlocked),
        currentStage: res.currentStage || 1,
        sudoku: res.sudoku,
        brokenLogic: res.brokenLogic,
        message: res.message,
      });
    } catch (err) {
      console.error('Failed to fetch Round 2 data', err);
      setRound2LoadError(err instanceof Error ? err.message : 'Round 2 data could not be loaded.');
    }
  }, []);

  // Fetch Round 3 Data
  const fetchRound3 = useCallback(async () => {
    try {
      const res = await apiRequest<any>('/round3/data');
      setRound3Data({
        round: res.round,
        timer: res.timer,
        isUnlocked: Boolean(res.isUnlocked),
        isAccessKeyAuthorized: Boolean(res.isAccessKeyAuthorized),
        isCompleted: Boolean(res.isCompleted),
        pointsAwarded: res.pointsAwarded ?? null,
        completedAt: res.completedAt,
        challenge: res.challenge,
      });
    } catch (err) {
      console.error('Failed to fetch Round 3 data', err);
    }
  }, []);

  // Load all rounds data
  const loadAll = useCallback(async () => {
    await Promise.all([fetchRound1(), fetchRound2(), fetchRound3()]);
    setIsLoading(false);
  }, [fetchRound1, fetchRound2, fetchRound3]);

  useEffect(() => {
    if (user?.role === 'TEAM') {
      loadAll();
    }
  }, [user, loadAll]);

  // Real-time updates via Server-Sent Events (SSE) with live connection health monitoring
  useEffect(() => {
    const streamUrl = cleanApiBaseUrl
      ? `${cleanApiBaseUrl}/api/v1/live/stream`
      : '/api/v1/live/stream';

    let eventSource: EventSource | null = null;
    let pollInterval: any = null;

    try {
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        setConnectionStatus('connected');
      };

      eventSource.onerror = () => {
        if (eventSource?.readyState === EventSource.CLOSED) {
          setConnectionStatus('disconnected');
        } else {
          setConnectionStatus('reconnecting');
        }
      };

      eventSource.addEventListener('connected', () => {
        setConnectionStatus('connected');
      });

      eventSource.addEventListener('ping', () => {
        setConnectionStatus('connected');
      });

      eventSource.addEventListener('signal_change', (e: MessageEvent) => {
        setConnectionStatus('connected');
        const payload = JSON.parse(e.data);
        setRound1Data(prev => ({
          ...prev,
          round: prev.round ? {
            ...prev.round,
            signalState: payload.signalState,
            redLightPenaltyMode: payload.redLightPenaltyMode,
            doublePointsEnabled: payload.doublePointsEnabled
          } : null
        }));
      });

      eventSource.addEventListener('score_update', () => {
        setConnectionStatus('connected');
        refreshMe();
      });

      eventSource.addEventListener('round_state_change', () => {
        setConnectionStatus('connected');
        loadAll();
      });

      eventSource.addEventListener('game_reset', () => {
        setConnectionStatus('connected');
        loadAll();
        refreshMe();
      });
    } catch {
      setConnectionStatus('disconnected');
      pollInterval = setInterval(loadAll, 5000);
    }

    return () => {
      eventSource?.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [loadAll, refreshMe]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#08090c] text-white flex items-center justify-center font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#ff004f] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <span>ESTABLISHING SECURE SQUAD LINK...</span>
        </div>
      </div>
    );
  }

  // Derive active stage information for status strip
  const getActiveStageInfo = () => {
    if (activeTab === 1) {
      return {
        protocolNumber: 1,
        protocolTitle: 'The Signal Protocol',
        stageName: round1Data.isCompleted
          ? 'Completed (20/20 Solved)'
          : `Question ${round1Data.questionNumber} of ${round1Data.totalQuestions}`,
        timerEndTime: round1Data.timer?.endTime ?? round1Data.round?.endTime,
        timerRemainingSeconds: round1Data.timer?.remainingSeconds ?? round1Data.round?.remainingSeconds,
        timerStatus: round1Data.timer?.status || round1Data.round?.status || 'UPCOMING',
        isPaused: round1Data.timer?.isPaused || round1Data.round?.status === 'PAUSED',
      };
    }
    if (activeTab === 2) {
      return {
        protocolNumber: 2,
        protocolTitle: 'The Logic Protocol',
        stageName: !round2Data.isUnlocked
          ? 'Locked by Officials'
          : round2Data.brokenLogic?.isCompleted
          ? 'All Stages Breached'
          : round2Data.currentStage === 1
          ? 'Stage 1: Shape Sudoku (+100 PTS)'
          : 'Stage 2: Broken Logic (+200 PTS)',
        timerEndTime: round2Data.timer?.endTime ?? round2Data.round?.endTime,
        timerRemainingSeconds: round2Data.timer?.remainingSeconds ?? round2Data.round?.remainingSeconds,
        timerStatus: round2Data.timer?.status || round2Data.round?.status || 'UPCOMING',
        isPaused: round2Data.timer?.isPaused || round2Data.round?.status === 'PAUSED',
      };
    }
    return {
      protocolNumber: 3,
      protocolTitle: 'The Final Breach',
      stageName: !round3Data.isUnlocked
        ? 'Locked by Officials'
        : round3Data.isCompleted
        ? 'System Breached (+200 PTS)'
        : round3Data.isAccessKeyAuthorized
        ? 'Final Kernel Debugging Challenge'
        : 'Enter Team Access Key',
      timerEndTime: round3Data.timer?.endTime ?? round3Data.round?.endTime,
      timerRemainingSeconds: round3Data.timer?.remainingSeconds ?? round3Data.round?.remainingSeconds,
      timerStatus: round3Data.timer?.status || round3Data.round?.status || 'UPCOMING',
      isPaused: round3Data.timer?.isPaused || round3Data.round?.status === 'PAUSED',
    };
  };

  const activeStage = getActiveStageInfo();

  // Compute protocol progression states for the Stage Rail
  const protocols = [
    {
      id: 1,
      num: '01',
      title: 'THE SIGNAL PROTOCOL',
      subtitle: '20 Sequential Questions • Red / Green Light',
      status: round1Data.isCompleted
        ? 'COMPLETED'
        : round1Data.round?.status === 'PAUSED'
        ? 'PAUSED'
        : round1Data.round?.status === 'ACTIVE'
        ? 'ACTIVE'
        : round1Data.round?.status === 'ENDED'
        ? 'ENDED'
        : 'UPCOMING',
      pointsBadge: 'Scoring varies by answer and signal',
    },
    {
      id: 2,
      num: '02',
      title: 'THE LOGIC PROTOCOL',
      subtitle: 'Stage 1: Shape Sudoku • Stage 2: Broken Logic',
      status: round2Data.brokenLogic?.isCompleted
        ? 'COMPLETED'
        : round2Data.round?.status === 'PAUSED'
        ? 'PAUSED'
        : round2Data.isUnlocked
        ? 'ACTIVE'
        : 'LOCKED',
      pointsBadge: '+300 PTS Total',
    },
    {
      id: 3,
      num: '03',
      title: 'THE FINAL BREACH',
      subtitle: 'Physical QR Challenge • Multi-Language Debugging',
      status: round3Data.isCompleted
        ? 'COMPLETED'
        : round3Data.round?.status === 'PAUSED'
        ? 'PAUSED'
        : round3Data.isUnlocked
        ? 'ACTIVE'
        : 'LOCKED',
      pointsBadge: '+200 PTS Champion Key',
    },
  ];

  return (
    <div className="min-h-screen bg-[#08090c] text-gray-100 flex flex-col font-sans selection:bg-[#ff004f] selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6 w-full" id="main-content">
        {/* Real-Time System Status Strip (Improvement 1) */}
        <SystemStatusStrip
          protocolNumber={activeStage.protocolNumber}
          protocolTitle={activeStage.protocolTitle}
          stageName={activeStage.stageName}
          signalState={round1Data.round?.signalState || 'GREEN'}
          doublePointsEnabled={Boolean(round1Data.round?.doublePointsEnabled)}
          isPaused={activeStage.isPaused}
          timerEndTime={activeStage.timerEndTime}
          timerRemainingSeconds={activeStage.timerRemainingSeconds}
          timerStatus={activeStage.timerStatus}
          connectionStatus={connectionStatus}
          onTimerExpire={loadAll}
        />

        {/* Squad Status Header (No other teams' scores shown - confidential event rule) */}
        <div className="p-6 rounded-2xl bg-[#12151c] border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#ff004f]/10 to-transparent pointer-events-none" />

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#ff004f]/20 border border-[#ff004f]/40 text-[#ff004f] font-bold">
                {team?.teamCode}
              </span>
              <h2 className="font-display font-black text-2xl text-white tracking-wide">
                {team?.name}
              </h2>
            </div>
            <p className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
              <span>Members: {team?.members || 'Active Team'}</span>
            </p>
          </div>

          <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-gray-800">
            <div className="text-right">
              <span className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider">TEAM SCORE</span>
              <span className="font-display font-black text-3xl sm:text-4xl text-[#00e676] drop-shadow-[0_0_15px_rgba(0,230,118,0.3)] tabular-nums">
                {team?.totalScore} <span className="text-xs text-gray-400 font-mono">PTS</span>
              </span>
            </div>
          </div>
        </div>

        {/* Protocol Stage Rail (Optional 1) */}
        <section aria-label="Tournament protocol progression rail">
          <div
            role="tablist"
            aria-label="Tournament protocol stages"
            className="grid grid-cols-1 md:grid-cols-3 gap-3 p-2 rounded-2xl bg-[#0e1118] border border-gray-800"
          >
            {protocols.map((p) => {
              const isSelected = activeTab === p.id;
              const isCompleted = p.status === 'COMPLETED';
              const isPaused = p.status === 'PAUSED';
              const isActive = p.status === 'ACTIVE';
              const isLocked = p.status === 'LOCKED' || p.status === 'UPCOMING';

              return (
                <button
                  key={p.id}
                  role="tab"
                  id={`protocol-tab-${p.id}`}
                  aria-selected={isSelected}
                  aria-controls={`protocol-panel-${p.id}`}
                  onClick={() => setActiveTab(p.id)}
                  className={`p-4 rounded-xl text-left transition-all duration-200 border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1118] ${
                    isSelected
                      ? 'bg-[#181c26] border-[#ff004f] shadow-[0_0_20px_rgba(255,0,79,0.25)]'
                      : 'bg-[#12151c]/60 border-gray-800 hover:border-gray-700 hover:bg-[#12151c]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-display font-black text-xs tracking-widest text-gray-400">
                      PROTOCOL {p.num}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-[#00e676]/20 border border-[#00e676]/40 text-[#00e676]'
                          : isPaused
                          ? 'bg-amber-950/60 border border-amber-500/50 text-amber-300'
                          : isActive
                          ? 'bg-cyan-950/60 border border-cyan-800/60 text-cyan-300'
                          : 'bg-gray-800/80 border border-gray-700/60 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-[#00e676]" aria-hidden="true" />
                          <span>SOLVED</span>
                        </>
                      ) : isPaused ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-400" aria-hidden="true" />
                          <span>PAUSED</span>
                        </>
                      ) : isActive ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
                          <span>ACTIVE</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-gray-500" aria-hidden="true" />
                          <span>LOCKED</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className={`font-display font-black text-sm tracking-wide ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {p.title}
                  </h3>
                  <p className="font-mono text-[11px] text-gray-400 mt-1 line-clamp-1">
                    {p.subtitle}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-gray-800/80 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-400">{p.pointsBadge}</span>
                    <span className="text-[#ff004f] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      {isSelected ? 'Viewing' : 'Inspect'} <ArrowRight className="w-3 h-3 inline" aria-hidden="true" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Active Round Content Panes */}
        <div
          role="tabpanel"
          id={`protocol-panel-${activeTab}`}
          aria-labelledby={`protocol-tab-${activeTab}`}
          className="focus-visible:outline-none"
        >
          {activeTab === 1 && (
            <Round1View
              round={round1Data.round}
              timer={round1Data.timer}
              currentQuestion={round1Data.currentQuestion}
              questionNumber={round1Data.questionNumber}
              totalQuestions={round1Data.totalQuestions}
              isCompleted={round1Data.isCompleted}
              onRefresh={loadAll}
            />
          )}

          {activeTab === 2 && (
            <div className="space-y-8">
              {round2LoadError ? (
                <div className="max-w-2xl mx-auto rounded-2xl border border-red-800 bg-red-950/30 p-6 space-y-4">
                  <h2 className="font-display font-bold text-xl text-white">Round 2 could not be loaded</h2>
                  <p role="alert" className="font-mono text-sm text-red-300">{round2LoadError}</p>
                  <button type="button" onClick={() => void fetchRound2()} className="rounded-lg bg-[#ff004f] px-4 py-2 text-xs font-mono font-bold text-white">RETRY</button>
                </div>
              ) : !round2Data.isUnlocked ? (
                <div className="bg-[#12151c] rounded-2xl border border-gray-800 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
                  <div className="w-16 h-16 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 flex items-center justify-center mx-auto" aria-hidden="true">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-display font-bold text-white tracking-wide">
                      Round 2 — The Logic Protocol
                    </h2>
                    <p className="text-sm font-mono text-gray-400">
                      Status: <span className="text-cyan-400 font-bold uppercase">Locked</span>
                    </p>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed max-w-lg mx-auto">
                    {round2Data.message || 'Round 2 is not available yet.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Round 2 Live Timer */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#12151c] border border-gray-800">
                    <div className="font-mono text-xs text-gray-400">
                      <span className="text-white font-bold block sm:inline">STAGE {round2Data.currentStage}: </span>
                      <span>{round2Data.currentStage === 1 ? 'Shape Sudoku (+100 PTS)' : 'Broken Logic Firmware Checksum (+200 PTS)'}</span>
                    </div>
                    <CountdownTimer
                      endTime={round2Data.timer?.endTime ?? round2Data.round?.endTime}
                      remainingSeconds={round2Data.timer?.remainingSeconds ?? round2Data.round?.remainingSeconds}
                      status={round2Data.timer?.status || round2Data.round?.status}
                      isPaused={round2Data.timer?.isPaused}
                      onExpire={loadAll}
                    />
                  </div>

                  {round2Data.sudoku && (
                    <ShapeSudoku
                      data={round2Data.sudoku}
                      onSuccess={loadAll}
                    />
                  )}

                  {round2Data.brokenLogic?.isUnlocked && round2Data.brokenLogic.puzzle && (
                    <BrokenLogicView
                      data={round2Data.brokenLogic}
                      onSuccess={loadAll}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 3 && (
            <Round3View
              round={round3Data.round}
              timer={round3Data.timer}
              isUnlocked={round3Data.isUnlocked}
              isAccessKeyAuthorized={round3Data.isAccessKeyAuthorized}
              isCompleted={round3Data.isCompleted}
              pointsAwarded={round3Data.pointsAwarded}
              completedAt={round3Data.completedAt}
              challenge={round3Data.challenge}
              onRefresh={loadAll}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
