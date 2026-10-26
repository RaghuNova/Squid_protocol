import React, { useState } from 'react';
import { apiRequest } from '../../services/api';
import { Settings, Download, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleTogglePublish = async (publish: boolean) => {
    try {
      await apiRequest('/admin/leaderboard/publish', {
        method: 'POST',
        body: JSON.stringify({ publish })
      });
      setIsPublished(publish);
      setFeedback(`Leaderboard publication set to ${publish ? 'PUBLIC' : 'HIDDEN'}.`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvData = await apiRequest<string>('/admin/export/csv');
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `squid_protocol_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message);
    }
  };


  return (
    <div className="space-y-8 max-w-4xl">
      <div className="border-b border-gray-800 pb-5">
        <span className="font-mono text-xs text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <Settings className="w-4 h-4" />
          SYSTEM CONFIGURATION & RECOVERY
        </span>
        <h1 className="font-display font-black text-3xl text-white uppercase tracking-tight mt-1">
          Event Settings & Safeguards
        </h1>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-700 text-cyan-300 font-mono text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#00e676]" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Leaderboard Visibility Control */}
      <div className="p-6 rounded-2xl bg-[#12151c] border border-gray-800 space-y-4">
        <h3 className="font-display font-bold text-lg text-white">Leaderboard Visibility</h3>
        <p className="text-xs font-mono text-gray-400 leading-relaxed">
          Toggle public accessibility for the live leaderboard at <code>/leaderboard</code>. You can black out the standings before the final breach to build tension for the awards ceremony.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => handleTogglePublish(true)}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isPublished
                ? 'bg-[#00e676]/20 border border-[#00e676]/40 text-[#00e676]'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>PUBLISH LIVE STANDINGS</span>
          </button>

          <button
            onClick={() => handleTogglePublish(false)}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              !isPublished
                ? 'bg-[#ff004f]/20 border border-[#ff004f]/40 text-[#ff004f]'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <EyeOff className="w-4 h-4" />
            <span>BLACKOUT STANDINGS</span>
          </button>
        </div>
      </div>

      {/* Export Ledger Data to CSV */}
      <div className="p-6 rounded-2xl bg-[#12151c] border border-gray-800 space-y-4">
        <h3 className="font-display font-bold text-lg text-white">Export Results (CSV)</h3>
        <p className="text-xs font-mono text-gray-400 leading-relaxed">
          Download the official tournament standings, including cumulative scores, round-by-round points, squad rosters, and final breach timestamps.
        </p>

        <button
          onClick={handleExportCSV}
          className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs font-bold flex items-center gap-2 border border-gray-700 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>DOWNLOAD LEADERBOARD CSV</span>
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/50 space-y-3">
        <h3 className="font-display font-bold text-lg text-red-300">Game Recovery</h3>
        <p className="text-xs font-mono text-gray-400">Use the Reset Game action on the Tournament Operations Console. It requires two confirmations and preserves permanent event setup data.</p>
      </div>
    </div>
  );
};
