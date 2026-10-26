import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../../services/api';
import { Users, KeyRound, Edit2, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface TeamItem {
  id: string;
  teamCode: string;
  name: string;
  members: string;
  currentRound: number;
  currentStage: number;
  totalScore: number;
  accessToken?: { isRedeemed: boolean; redeemedAt?: string | null };
  physicalVerification?: { verifiedByName: string };
}

export const AdminTeams: React.FC = () => {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingTeam, setEditingTeam] = useState<TeamItem | null>(null);
  const [newName, setNewName] = useState<string>('');
  const [newMembers, setNewMembers] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (editingTeam) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCloseModal();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [editingTeam]);

  const handleCloseModal = () => {
    setEditingTeam(null);
    triggerRef.current?.focus();
  };

  const fetchTeams = async () => {
    try {
      const res = await apiRequest<{ success: boolean; teams: TeamItem[] }>('/admin/teams');
      setTeams(res.teams || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleEditClick = (team: TeamItem, e?: React.MouseEvent) => {
    triggerRef.current = (e?.currentTarget as HTMLElement) || (document.activeElement as HTMLElement);
    setEditingTeam(team);
    setNewName(team.name);
    setNewMembers(team.members);
    setNewPin('');
    setFeedback(null);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    try {
      await apiRequest(`/admin/teams/${editingTeam.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: newName.trim(),
          members: newMembers.trim(),
          resetPin: newPin.trim() || undefined
        })
      });

      setFeedback(`Team ${editingTeam.teamCode} updated successfully.`);
      setEditingTeam(null);
      fetchTeams();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="border-b border-gray-800 pb-5">
        <span className="font-mono text-xs text-[#ff004f] uppercase tracking-widest flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          SQUAD REGISTRATION & CREDENTIAL DIRECTORY
        </span>
        <h1 className="font-display font-black text-3xl text-white uppercase tracking-tight mt-1">
          Team Management (20 Squads)
        </h1>
        <p className="text-xs font-mono text-gray-400 mt-1">
          Inspect squad progression, assign display names, view QR tokens, and securely reset PIN credentials.
        </p>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-700 text-cyan-300 font-mono text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#00e676]" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Edit Modal */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="edit-team-dialog-title" className="bg-[#12151c] rounded-2xl border border-gray-700 p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl focus:outline-none">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 id="edit-team-dialog-title" className="font-display font-bold text-lg text-white">
                Edit {editingTeam.teamCode} Credentials
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}

                aria-label="Close edit team dialog"
                className="text-gray-400 hover:text-white p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label htmlFor="edit-team-name" className="text-gray-400 uppercase block">Display Name</label>
                <input
                  type="text"
                  id="edit-team-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#090b0f] border border-gray-800 text-white font-mono text-sm focus:border-[#ff004f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-team-members" className="text-gray-400 uppercase block">Operative Members</label>
                <input
                  type="text"
                  id="edit-team-members"
                  value={newMembers}
                  onChange={(e) => setNewMembers(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#090b0f] border border-gray-800 text-white font-mono text-sm focus:border-[#ff004f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-team-pin" className="text-gray-400 uppercase block">Reset PIN (Leave blank to keep current)</label>
                <input
                  type="text"
                  id="edit-team-pin"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="e.g. PIN#9921"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#090b0f] border border-gray-800 text-white font-mono text-sm focus:border-[#ff004f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                onClick={handleCloseModal}

                  className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#ff004f] text-white hover:bg-[#ff2e7e] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="p-6 rounded-2xl bg-[#12151c] border border-gray-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-[#090b0f] text-gray-400">
                <th className="py-3 px-3">Squad Code</th>
                <th className="py-3 px-3">Display Name</th>
                <th className="py-3 px-3">Operatives</th>
                <th className="py-3 px-3">Stage</th>
                <th className="py-3 px-3">Score</th>
                <th className="py-3 px-3">QR Redemption</th>
                <th className="py-3 px-3">Cup Verified</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-gray-300">
              {teams.map((t) => (
                <tr key={t.id} className="hover:bg-gray-800/30">
                  <td className="py-3 px-3 font-bold text-white">{t.teamCode}</td>
                  <td className="py-3 px-3 text-gray-200 font-semibold">{t.name}</td>
                  <td className="py-3 px-3 text-gray-400 max-w-xs truncate">{t.members}</td>
                  <td className="py-3 px-3 text-[#00f0ff]">R{t.currentRound}.S{t.currentStage}</td>
                  <td className="py-3 px-3 text-[#00e676] font-bold">{t.totalScore}</td>
                  <td className="py-3 px-3">
                    <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${t.accessToken?.isRedeemed ? 'text-[#00e676] bg-[#00e676]/10' : 'text-amber-300 bg-amber-300/10'}`}>
                      {t.accessToken?.isRedeemed ? 'REDEEMED' : 'UNREDEEMED'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {t.physicalVerification ? (
                      <span className="text-[#00e676] flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Yes</span>
                      </span>
                    ) : (
                      <span className="text-gray-500">Pending</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => handleEditClick(t, e)}
                      aria-label={`Edit ${t.teamCode} credentials`}
                      className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center gap-1 ml-auto transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
