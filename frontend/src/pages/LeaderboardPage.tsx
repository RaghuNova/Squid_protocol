import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LeaderboardTeam } from '../types/game';
import { Trophy, Medal, Award, Flame, ShieldAlert, RefreshCw, Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<LeaderboardTeam[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);

  const fetchLeaderboard = useCallback(async () => {
    if (user?.role !== 'ADMIN') {
      setAccessDenied(true);
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiRequest<{
        success: boolean;
        teams: LeaderboardTeam[];
        updatedAt: string;
      }>('/leaderboard');

      setTeams(res.teams || []);
      setLastUpdated(res.updatedAt || new Date().toISOString());
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

    const streamUrl = import.meta.env.VITE_API_BASE_URL
      ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/live/stream`
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

  return (
    <div className="min-h-screen bg-[#08090c] text-gray-100 flex flex-col font-sans selection:bg-[#ff004f] selection:text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 space-y-8 w-full" id="main-content">
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
            {/* Admin Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
              <div>
                <span className="font-mono text-xs text-[#ffd166] uppercase tracking-widest flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-[#ffd166]" />
                  CONFIDENTIAL TOURNAMENT STANDINGS (ADMIN ONLY)
                </span>
                <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight mt-1">
                  Squid Protocol Scoreboard
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-gray-500">
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
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center font-mono text-sm text-gray-500">
                Loading tournament scores...
              </div>
            ) : (
              <div className="bg-[#12151c] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 bg-[#090b0f] text-gray-400">
                        <th className="py-4 px-4 text-center w-16">Rank</th>
                        <th className="py-4 px-4">Squad Details</th>
                        <th className="py-4 px-3 text-center hidden md:table-cell">R1</th>
                        <th className="py-4 px-3 text-center hidden md:table-cell">R2</th>
                        <th className="py-4 px-3 text-center hidden md:table-cell">R3</th>
                        <th className="py-4 px-4 text-right">Total Score</th>
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
                            <td className="py-4 px-4 text-center">
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

                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-bold">
                                  {t.teamCode}
                                </span>
                                <span className={`font-bold text-sm ${isTop3 ? 'text-white' : 'text-gray-300'}`}>
                                  {t.name}
                                </span>
                                {t.finalBreachCompletedAt && (
                                  <span title="Final Breach Completed!">
                                    <Flame className="w-4 h-4 text-[#ff004f] animate-pulse motion-reduce:animate-none" />
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-gray-500 font-mono block mt-0.5 truncate max-w-xs">
                                {t.members}
                              </span>
                            </td>

                            <td className="py-4 px-3 text-center hidden md:table-cell text-gray-300">
                              {t.r1Score}
                            </td>

                            <td className="py-4 px-3 text-center hidden md:table-cell text-gray-300">
                              {t.r2Score}
                            </td>

                            <td className="py-4 px-3 text-center hidden md:table-cell text-gray-300">
                              {t.r3Score}
                            </td>

                            <td className="py-4 px-4 text-right">
                              <span className="font-display font-black text-base sm:text-lg text-[#00e676]">
                                {t.totalScore}
                              </span>
                              <span className="text-[10px] text-gray-500 ml-1">PTS</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
