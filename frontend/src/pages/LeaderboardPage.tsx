import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { apiRequest, cleanApiBaseUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LeaderboardTeam, WinnerAnnouncement } from '../types/game';
import {
  Trophy,
  Medal,
  Award,
  Flame,
  ShieldCheck,
  RefreshCw,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<LeaderboardTeam[]>([]);
  const [winnerAnnouncement, setWinnerAnnouncement] = useState<WinnerAnnouncement | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);

  // Winner Finalization Modal State
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState<boolean>(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState<boolean>(false);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (user?.role !== 'ADMIN') {
      setAccessDenied(true);
      setIsLoading(false);
      return;
    }

    try {
      const [boardRes, winnersRes] = await Promise.all([
        apiRequest<{
          success: boolean;
          teams: LeaderboardTeam[];
          updatedAt: string;
        }>('/leaderboard'),
        apiRequest<{
          success: boolean;
          isFinalized: boolean;
          finalizedAt?: string | null;
          finalizedByAdminUsername?: string | null;
          winners: any[];
          notes?: string | null;
        }>('/leaderboard/winners').catch(() => null)
      ]);

      setTeams(boardRes.teams || []);
      setLastUpdated(boardRes.updatedAt || new Date().toISOString());

      if (winnersRes && winnersRes.success) {
        setWinnerAnnouncement({
          id: 1,
          isFinalized: winnersRes.isFinalized,
          finalizedAt: winnersRes.finalizedAt,
          finalizedByAdminUsername: winnersRes.finalizedByAdminUsername,
          winners: winnersRes.winners || [],
          notes: winnersRes.notes
        });
      }

      setAccessDenied(false);
    } catch (err: any) {
      if (err.status === 403 || err.message?.includes('denied') || err.message?.includes('restricted')) {
        setAccessDenied(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaderboard();

    if (user?.role !== 'ADMIN') return;

    const streamUrl = cleanApiBaseUrl
      ? `${cleanApiBaseUrl}/api/v1/live/stream`
      : '/api/v1/live/stream';

    let eventSource: EventSource | null = null;
    let timer: any = null;

    try {
      eventSource = new EventSource(streamUrl);
      eventSource.addEventListener('score_update', () => fetchLeaderboard());
      eventSource.addEventListener('final_breach', () => fetchLeaderboard());
    } catch {
      timer = setInterval(fetchLeaderboard, 5000);
    }

    return () => {
      eventSource?.close();
      if (timer) clearInterval(timer);
    };
  }, [fetchLeaderboard, user]);

  const handleFinalize = async () => {
    setIsActionLoading(true);
    setActionAlert(null);
    try {
      const res = await apiRequest<{ success: boolean; message: string; announcement: any }>(
        '/leaderboard/winners/finalize',
        {
          method: 'POST',
          body: JSON.stringify({ notes: adminNotes.trim() })
        }
      );

      if (res.success) {
        setActionAlert({ type: 'success', text: res.message || 'Winners finalized successfully!' });
        setIsFinalizeModalOpen(false);
        setAdminNotes('');
        await fetchLeaderboard();
      }
    } catch (err: any) {
      setActionAlert({ type: 'error', text: err.message || 'Failed to finalize winners.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReopen = async () => {
    setIsActionLoading(true);
    setActionAlert(null);
    try {
      const res = await apiRequest<{ success: boolean; message: string; announcement: any }>(
        '/leaderboard/winners/reopen',
        { method: 'POST' }
      );

      if (res.success) {
        setActionAlert({ type: 'success', text: res.message || 'Standings reopened to provisional.' });
        setIsReopenModalOpen(false);
        await fetchLeaderboard();
      }
    } catch (err: any) {
      setActionAlert({ type: 'error', text: err.message || 'Failed to reopen standings.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const top3 = teams.slice(0, 3);
  const isFinalized = winnerAnnouncement?.isFinalized ?? false;
  const winnersList = isFinalized && winnerAnnouncement?.winners?.length
    ? winnerAnnouncement.winners
    : top3;

  return (
    <div className="min-h-screen bg-[#08090c] text-gray-100 flex flex-col font-sans selection:bg-[#ff004f] selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 space-y-8 w-full" id="main-content">
        {/* Access Denied for Non-Admins */}
        {accessDenied || (user && user.role !== 'ADMIN') ? (
          <div className="p-12 text-center bg-[#12151c] rounded-2xl border border-gray-800 space-y-6 max-w-xl mx-auto">


            <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-800/40 text-red-400 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display font-bold text-2xl text-white">ACCESS RESTRICTED</h2>
              <p className="text-sm font-mono text-red-400">
                The full tournament leaderboard is visible only to Tournament Officials.
              </p>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Under competition rules, overall standings are kept confidential by event organizers. Teams can check their own score on their personal dashboard.
            </p>
            <div className="pt-2">

              <Link
                to={user?.role === 'TEAM' ? '/game' : '/'}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#ff004f] text-white font-mono text-xs uppercase tracking-wider font-semibold hover:bg-[#ff2e7e] transition-colors"
              >

                <ArrowLeft className="w-4 h-4" />
                <span>Return to {user?.role === 'TEAM' ? 'Game Arena' : 'Home'}</span>
              </Link>







            </div>
          </div>
        ) : (
          <>
            {/* Admin Header with Live Status & Action Buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
              <div>
                <span className="font-mono text-xs text-[#ffd166] uppercase tracking-widest flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-[#ffd166]" />
                  OFFICIAL TOURNAMENT ADJUDICATION (ADMIN ONLY)
                </span>
                <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight mt-1">
                  Squid Protocol Leaderboard
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs text-gray-500 bg-[#12151c] px-3 py-1.5 rounded-lg border border-gray-800">
                  Synced: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Live'}
                </span>

                <button
                  onClick={fetchLeaderboard}
                  title="Refresh standings"
                  aria-label="Refresh standings"
                  className="p-2 rounded-lg bg-[#12151c] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd166] cursor-pointer"
                >
  
                  <RefreshCw className="w-4 h-4" />
                </button>

                {isFinalized ? (
                  <button
                    onClick={() => setIsReopenModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
    
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reopen Results</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsFinalizeModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ffd166] hover:bg-[#ffdf88] text-black font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,209,102,0.3)] cursor-pointer"
                  >
    
                    <ShieldCheck className="w-4 h-4 text-black" />
                    <span>Finalize &amp; Announce</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notification Alert Banner */}
            {actionAlert && (
              <div
                role="alert"
                className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono ${
                  actionAlert.type === 'success'
                    ? 'bg-[#00e676]/10 border-[#00e676]/40 text-[#00e676]'
                    : 'bg-[#ff004f]/10 border-[#ff004f]/40 text-[#ff004f]'
                }`}
              >

                <span>{actionAlert.text}</span>
                <button
                  onClick={() => setActionAlert(null)}
                  className="text-gray-400 hover:text-white underline cursor-pointer"
                >
  
                  Dismiss
                </button>
              </div>
            )}

            {/* Winner Announcement Card / Podium Section */}
            <section aria-labelledby="winner-announcement-title" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 id="winner-announcement-title" className="font-display font-bold text-lg text-white uppercase tracking-wider">
                    {isFinalized ? '🏆 Officially Finalized Winners' : '⚡ Provisional Winner Standings'}
                  </h2>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      isFinalized
                        ? 'bg-[#00e676]/20 border border-[#00e676]/50 text-[#00e676]'
                        : 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                    }`}
              >
    
                    {isFinalized ? 'FINALIZED' : 'PROVISIONAL'}
                  </span>
                </div>

                {isFinalized && winnerAnnouncement?.finalizedAt && (
                  <span className="font-mono text-xs text-gray-400">
                    Finalized {new Date(winnerAnnouncement.finalizedAt).toLocaleString()} by @
                    {winnerAnnouncement.finalizedByAdminUsername || 'admin'}
                  </span>
                )}
              </div>

              {winnersList.length === 0 ? (
                <div className="p-8 text-center bg-[#12151c] rounded-2xl border border-gray-800 space-y-2">
                  <Trophy className="w-8 h-8 text-gray-600 mx-auto" />
                  <p className="text-sm font-mono text-gray-400">
                    No participants have completed the final challenge yet. Standings will populate as teams finish.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {winnersList.map((entry: any, idx: number) => {
                    const rank = idx + 1;
                    const isChampion = rank === 1;

                    return (
                      <div
                        key={entry.teamCode || idx}
                        className={`p-6 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                          isChampion
                            ? 'bg-gradient-to-b from-amber-500/10 to-[#12151c] border-amber-400/60 shadow-[0_0_35px_rgba(255,209,102,0.18)] md:scale-105 z-10'
                            : rank === 2
                            ? 'bg-gradient-to-b from-slate-400/10 to-[#12151c] border-slate-400/40'
                            : 'bg-gradient-to-b from-amber-800/10 to-[#12151c] border-amber-700/40'
                        }`}
              >
        
                        {/* Rank Badge */}
                        <div className="flex items-center justify-between mb-4">
                          <span
                            className={`font-mono text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                              isChampion
                                ? 'bg-amber-400 text-black shadow-md'
                                : rank === 2
                                ? 'bg-slate-300 text-black'
                                : 'bg-amber-800 text-amber-100'
                            }`}
              >
            
                            {isChampion && <Trophy className="w-3.5 h-3.5" />}
                            {rank === 2 && <Medal className="w-3.5 h-3.5" />}
                            {rank === 3 && <Award className="w-3.5 h-3.5" />}
                            <span>{rank === 1 ? '1ST PLACE · CHAMPION' : rank === 2 ? '2ND PLACE' : '3RD PLACE'}</span>
                          </span>

                          <span className="font-mono text-xs text-gray-400">
                            {entry.teamCode}
                          </span>
                        </div>

                        {/* Winner Details */}
                        <div className="space-y-1 mb-4">
                          <div className="text-xl font-display font-black text-white">
                            {entry.name}
                          </div>
                          <div className="font-mono text-xs text-cyan-400 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                            <span>@{entry.username || entry.teamCode?.toLowerCase()}</span>
                          </div>
                        </div>

                        {/* Breakdown Metrics */}
                        <div className="pt-3 border-t border-gray-800/80 space-y-2 font-mono text-xs">
                          <div className="flex justify-between items-baseline">
                            <span className="text-gray-400">Total Score:</span>
                            <span className="font-display font-black text-xl text-[#00e676]">
                              {entry.totalScore} <span className="text-[10px] text-gray-400">PTS</span>
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 pt-1 text-[11px] text-center border-t border-gray-800/50">
                            <div className="bg-black/30 p-1.5 rounded">
                              <span className="text-gray-500 block text-[9px]">R1</span>
                              <span className="text-white font-bold">{entry.r1Score}</span>
                            </div>
                            <div className="bg-black/30 p-1.5 rounded">
                              <span className="text-gray-500 block text-[9px]">R2</span>
                              <span className="text-white font-bold">{entry.r2Score}</span>
                            </div>
                            <div className="bg-black/30 p-1.5 rounded">
                              <span className="text-gray-500 block text-[9px]">R3 PTS</span>
                              <span className="text-[#00e676] font-bold">
                                {entry.r3Points != null ? (entry.r3Points > 0 ? `+${entry.r3Points}` : entry.r3Points) : '—'}
                              </span>
                            </div>
                          </div>
                          {entry.finalBreachCompletedAt && (
                            <div className="text-[10px] text-gray-400 flex items-center gap-1 pt-1">
                              <Clock className="w-3 h-3 text-cyan-400" />
                              <span>Breach: {new Date(entry.finalBreachCompletedAt).toLocaleTimeString()}</span>
                              {entry.r3Position && (
                                <span className="text-amber-400 ml-auto font-bold">
                                  Finish #{entry.r3Position}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Authoritative Table of All Teams */}
            {isLoading ? (
              <div className="p-12 text-center font-mono text-sm text-gray-500">
                Loading tournament scores...
              </div>
            ) : (
              <div className="bg-[#12151c] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
                <div className="p-4 bg-[#090b0f] border-b border-gray-800 flex items-center justify-between">
                  <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">
                    Full Tournament Roster &amp; Scores ({teams.length} Teams)
                  </span>
                  <span className="text-xs font-mono text-gray-500">
                    Authoritative Server Computation
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 bg-[#0c0e14] text-gray-400">
                        <th className="py-3.5 px-3 text-center w-12" scope="col">Rank</th>
                        <th className="py-3.5 px-3" scope="col">Participant</th>
                        <th className="py-3.5 px-3" scope="col">Team Name</th>
                        <th className="py-3.5 px-3 text-center" scope="col">R1</th>
                        <th className="py-3.5 px-3 text-center" scope="col">R2</th>
                        <th className="py-3.5 px-3 text-center" scope="col">R3 Pos</th>
                        <th className="py-3.5 px-3 text-center" scope="col">R3 Pts</th>
                        <th className="py-3.5 px-3 text-right" scope="col">Total Score</th>
                        <th className="py-3.5 px-3 text-center hidden lg:table-cell" scope="col">R3 Finish Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {teams.map((t, index) => {
                        const rank = index + 1;
                        const isTop3 = rank <= 3;

                        return (
                          <tr
                            key={t.teamCode}
                            className={`transition-colors hover:bg-gray-800/30 ${
                              rank === 1
                                ? 'bg-amber-500/5'
                                : rank === 2
                                ? 'bg-slate-300/5'
                                : rank === 3
                                ? 'bg-amber-700/5'
                                : ''
                            }`}
              >
            
                            <td className="py-3.5 px-3 text-center">
                              {rank === 1 ? (
                                <Medal className="w-5 h-5 text-amber-400 mx-auto" />
                              ) : rank === 2 ? (
                                <Medal className="w-5 h-5 text-slate-300 mx-auto" />
                              ) : rank === 3 ? (
                                <Award className="w-5 h-5 text-amber-700 mx-auto" />
                              ) : (
                                <span className="font-bold text-gray-500">#{rank}</span>
                              )}
                            </td>

                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 font-bold">
                                  @{t.username || t.teamCode.toLowerCase()}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-bold">
                                  {t.teamCode}
                                </span>
                                <span className={`font-bold text-sm ${isTop3 ? 'text-white' : 'text-gray-300'}`}>
                                  {t.name}
                                </span>
                                {t.finalBreachCompletedAt && (
                                  <span title="Final Breach Solved!">
                                    <Flame className="w-4 h-4 text-[#ff004f] animate-pulse motion-reduce:animate-none" />
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-3 text-center text-gray-300">
                              {t.r1Score}
                            </td>

                            <td className="py-3.5 px-3 text-center text-gray-300">
                              {t.r2Score}
                            </td>

                            <td className="py-3.5 px-3 text-center text-gray-300">
                              {t.r3Position ? (
                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                                  #{t.r3Position}
                                </span>
                              ) : (
                                <span className="text-gray-600">—</span>
                              )}
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              {t.r3Points != null ? (
                                <span
                                  className={`font-bold ${
                                    t.r3Points > 0
                                      ? 'text-[#00e676]'
                                      : t.r3Points < 0
                                      ? 'text-[#ff004f]'
                                      : 'text-gray-400'
                                  }`}
              >
                  
                                  {t.r3Points > 0 ? `+${t.r3Points}` : t.r3Points}
                                </span>
                              ) : (
                                <span className="text-gray-600">—</span>
                              )}
                            </td>

                            <td className="py-3.5 px-3 text-right">
                              <span className="font-display font-black text-base sm:text-lg text-[#00e676]">
                                {t.totalScore}
                              </span>
                              <span className="text-[10px] text-gray-500 ml-1">PTS</span>
                            </td>

                            <td className="py-3.5 px-3 text-center hidden lg:table-cell text-gray-400 text-xs">
                              {t.finalBreachCompletedAt ? (
                                new Date(t.finalBreachCompletedAt).toLocaleTimeString()
                              ) : (
                                <span className="text-gray-600">Pending</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal: Finalize Winners Confirmation */}
            {isFinalizeModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
                role="dialog"
                aria-modal="true"
                aria-labelledby="finalize-dialog-title"
              >

                <div className="w-full max-w-lg bg-[#0e1017] border border-gray-700 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 id="finalize-dialog-title" className="font-display font-bold text-xl text-white">
                        Confirm Winner Finalization
                      </h3>
                      <p className="font-mono text-xs text-gray-400">
                        This action locks official rankings based on server-verified results.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141721] border border-gray-800 space-y-2 font-mono text-xs">
                    <div className="text-gray-300 font-semibold mb-2">Authoritative Top 3 to be Announced:</div>
                    {top3.map((entry, i) => (
                      <div key={entry.teamCode} className="flex justify-between items-center text-gray-300">
                        <span>
                          #{i + 1} {entry.name} ({entry.teamCode})
                        </span>
                        <span className="text-[#00e676] font-bold">{entry.totalScore} PTS</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="admin-notes" className="font-mono text-xs text-gray-300 block">
                      Official Audit Notes / Adjudication remarks (Optional):
                    </label>
                    <textarea
                      id="admin-notes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="e.g. All 3 rounds verified by chief arbiter. Final breach rankings validated."
                      className="w-full p-3 rounded-xl bg-[#12151c] border border-gray-700 text-white font-mono text-xs focus:outline-none focus:border-[#ffd166] min-h-[80px]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => setIsFinalizeModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 font-mono text-xs uppercase cursor-pointer"
                    >
      
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={handleFinalize}
                      className="px-5 py-2.5 rounded-xl bg-[#ffd166] hover:bg-[#ffdf88] text-black font-mono text-xs font-bold uppercase transition-all shadow-lg cursor-pointer"
                    >
      
                      {isActionLoading ? 'Finalizing...' : 'Confirm & Finalize Winners'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: Reopen Standings Confirmation */}
            {isReopenModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
                role="dialog"
                aria-modal="true"
                aria-labelledby="reopen-dialog-title"
              >

                <div className="w-full max-w-md bg-[#0e1017] border border-gray-700 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 id="reopen-dialog-title" className="font-display font-bold text-xl text-white">
                        Reopen Tournament Results?
                      </h3>
                      <p className="font-mono text-xs text-gray-400">
                        This resets finalized status back to provisional.
                      </p>
                    </div>
                  </div>

                  <p className="text-sm font-mono text-gray-300 leading-relaxed">
                    Reopening allows further score corrections or recalculations before finalizing again.
                  </p>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => setIsReopenModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 font-mono text-xs uppercase cursor-pointer"
                    >
      
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={handleReopen}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold uppercase transition-all cursor-pointer"
                    >
      
                      {isActionLoading ? 'Reopening...' : 'Yes, Reopen Standings'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};
