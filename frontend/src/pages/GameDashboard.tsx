import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
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
import { Card, Badge, Button } from '../components/ui';

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
  }>({
    round: null,
    isUnlocked: false,
    currentStage: 1,
    sudoku: null,
    brokenLogic: null,
  });

  const [round3Data, setRound3Data] = useState<{
    round: RoundControl | null;
    timer?: any;
    isUnlocked: boolean;
    isQrRedeemed: boolean;
    isCompleted: boolean;
    completedAt?: string | null;
    challenge: any;
  }>({
    round: null,
    isUnlocked: false,
    isQrRedeemed: false,
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
      setRound2Data({
        round: res.round,
        timer: res.timer,
        isUnlocked: Boolean(res.isUnlocked),
        currentStage: res.currentStage || 1,
        sudoku: res.sudoku,
        brokenLogic: res.brokenLogic,
      });
    } catch (err) {
      console.error('Failed to fetch Round 2 data', err);
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
        isQrRedeemed: Boolean(res.isQrRedeemed),
        isCompleted: Boolean(res.isCompleted),
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

  // Real-time updates via Server-Sent Events (SSE)
  useEffect(() => {
    const streamUrl = import.meta.env.VITE_API_BASE_URL
      ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/live/stream`
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
      <div className="min-h-screen bg-[#08090d] text-white flex items-center justify-center font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#ff004f] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <span className="text-gray-400 uppercase tracking-wider">CONNECTING TO ARENA MAINFRAME...</span>
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
          ? 'Completed (10/10 Solved)'
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
        : round3Data.isQrRedeemed
        ? 'Final Kernel Debugging Challenge'
        : 'Offline QR Token Gate',
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
      subtitle: '10 Sequential MCQs • Signal Controlled',
      status: round1Data.isCompleted
        ? 'COMPLETED'
        : round1Data.round?.status === 'PAUSED'
        ? 'PAUSED'
        : round1Data.round?.status === 'ACTIVE'
        ? 'ACTIVE'
        : round1Data.round?.status === 'ENDED'
        ? 'ENDED'
        : 'UPCOMING',
      pointsBadge: '+1,000 PTS (2X Available)',
    },
    {
      id: 2,
      num: '02',
      title: 'THE LOGIC PROTOCOL',
      subtitle: 'Shape Sudoku • Broken Logic Puzzle',
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
      subtitle: 'Physical QR Gate • Firmware Debugging',
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
    <div className="min-h-screen bg-[#08090d] text-gray-100 flex flex-col font-sans selection:bg-[#ff004f] selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6 w-full">
        {/* Real-Time System Status Strip */}
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

        {/* Squad Status Header */}
        <Card variant="elevated" className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="danger" size="sm">
                {team?.teamCode}
              </Badge>
              <h2 className="font-display font-black text-2xl text-white tracking-wide">
                {team?.name}
              </h2>
            </div>
            <p className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
              <span>Operatives: {team?.members || 'Squad Active'}</span>
            </p>
          </div>

          <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-[#1e2432]">
            <div className="text-right">
              <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                MY SQUAD SCORE
              </span>
              <span className="font-display font-black text-3xl sm:text-4xl text-[#00e676] tabular-nums">
                {team?.totalScore} <span className="text-xs text-gray-400 font-mono">PTS</span>
              </span>
            </div>
          </div>
        </Card>

        {/* Protocol Navigation Tabs */}
        <section aria-label="Tournament protocol progression switcher">
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-3 p-2 rounded-2xl bg-[#0f1218] border border-[#1e2432]"
          >
            {protocols.map((p) => {
              const isSelected = activeTab === p.id;
              const isCompleted = p.status === 'COMPLETED';
              const isPaused = p.status === 'PAUSED';
              const isActive = p.status === 'ACTIVE';

              return (
                <button
                  key={p.id}
                  type="button"
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => setActiveTab(p.id)}
                  className={`p-4 rounded-xl text-left transition-all duration-150 border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] ${
                    isSelected
                      ? 'bg-[#151922] border-[#ff004f] shadow-red-sm'
                      : 'bg-[#0f1218] border-[#1e2432] hover:border-[#2c3447] hover:bg-[#141822]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-display font-black text-xs tracking-widest text-gray-400">
                      PROTOCOL {p.num}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-[#00e676]/15 border border-[#00e676]/40 text-[#00e676]'
                          : isPaused
                          ? 'bg-amber-950/60 border border-amber-500/50 text-amber-300'
                          : isActive
                          ? 'bg-cyan-950/60 border border-cyan-800/60 text-cyan-300'
                          : 'bg-[#151922] border border-[#2c3447] text-gray-500'
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

                  <div className="mt-3 pt-2.5 border-t border-[#1e2432] flex items-center justify-between text-[10px] font-mono">
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
          id={`protocol-panel-${activeTab}`}
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
            <div className="space-y-6">
              {!round2Data.isUnlocked ? (
                <Card variant="elevated" cornerAccents className="p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 flex items-center justify-center mx-auto" aria-hidden="true">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-2xl font-display font-bold text-white tracking-wide">
                      Round 2 — The Logic Protocol
                    </h2>
                    <Badge variant="cyan" size="sm">
                      AWAITING ACTIVATION SIGNAL
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-300 font-mono leading-relaxed max-w-lg mx-auto">
                    Round 2 is currently locked by tournament officials. Once Round 1 concludes, officials will activate Stage 1: Shape Sudoku.
                  </p>
                </Card>
              ) : (
                <>
                  {/* Round 2 Sub-header Bar */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#0f1218] border border-[#1e2432]">
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
              isQrRedeemed={round3Data.isQrRedeemed}
              isCompleted={round3Data.isCompleted}
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
