import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { SignalState } from '../../types/game';
import { SignalIndicator } from '../../components/SignalIndicator';
import { Radio, AlertTriangle, ShieldCheck, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const AdminLiveControl: React.FC = () => {
  const [signal, setSignal] = useState<SignalState>('GREEN');
  const [doublePoints, setDoublePoints] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentSignal = async () => {
    try {
      const res = await apiRequest('/admin/dashboard');
      if (res.stats) {
        setSignal(res.stats.currentSignal);
        setDoublePoints(res.stats.doublePointsEnabled);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCurrentSignal();
  }, []);

  const handleUpdate = async (newSignal: SignalState, newDouble = doublePoints) => {
    setIsUpdating(true);
    setMessage(null);
    setError(null);

    try {
      const res = await apiRequest('/admin/signal', {
        method: 'POST',
        body: JSON.stringify({
          signalState: newSignal,
          doublePointsEnabled: newDouble
        })
      });

      setSignal(res.round.signalState);
      setDoublePoints(res.round.doublePointsEnabled);
      setMessage(`Server confirmed: Signal is ${res.round.signalState}, Double Points is ${res.round.doublePointsEnabled ? 'ON' : 'OFF'}.`);
    } catch (err: any) {
      setError(`Failed to update control setting: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="border-b border-gray-800 pb-5">
        <span className="font-mono text-xs text-[#ff004f] uppercase tracking-widest flex items-center gap-1.5">
          <Radio className="w-4 h-4" />
          REAL-TIME TELEMETRY DAEMON
        </span>
        <h1 className="font-display font-black text-3xl text-white uppercase tracking-tight mt-1">
          Red Light / Green Light Master Control
        </h1>
        <p className="text-xs font-mono text-gray-400 mt-1">
          Authoritative toggle for participant traffic flow, signal state broadcasts, and Double Points rules.
        </p>
      </div>

      {/* Current Active Signal Display */}
      <SignalIndicator signal={signal} />

      {message && (
        <div role="status" className="p-4 rounded-xl bg-gray-900 border border-gray-700 text-cyan-300 font-mono text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#00e676]" />
          <span>{message}</span>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div role="alert" className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-400 font-mono text-xs flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-gray-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Authoritative Live Status Summary Bar */}
      <div className="p-4 rounded-xl bg-[#12151c] border border-gray-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="text-gray-400 uppercase">SERVER STATE:</span>
          <span
            className={`px-3 py-1 rounded-md font-bold uppercase tracking-wider ${
              signal === 'GREEN'
                ? 'bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40'
                : 'bg-[#ff004f]/20 text-[#ff004f] border border-[#ff004f]/40'
            }`}
          >
            {signal} LIGHT ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 uppercase">MULTIPLIER:</span>
          <span
            className={`px-3 py-1 rounded-md font-bold uppercase tracking-wider ${
              doublePoints
                ? 'bg-[#ffd166]/20 text-[#ffd166] border border-[#ffd166]/40 shadow-[0_0_10px_rgba(255,209,102,0.3)]'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            {doublePoints ? 'DOUBLE POINTS ON (2X)' : 'DOUBLE POINTS OFF (1X)'}
          </span>
        </div>
      </div>

      {/* Primary Authoritative Signal & Double Points Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. RED LIGHT BUTTON */}
        <button
          onClick={() => handleUpdate('RED', doublePoints)}
          aria-pressed={signal === 'RED'}
          disabled={isUpdating}
          className={`p-6 rounded-2xl border flex flex-col items-center justify-between gap-4 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12151c] ${
            signal === 'RED'
              ? 'bg-[#ff004f]/20 border-[#ff004f] shadow-[0_0_35px_rgba(255,0,79,0.5)] text-white ring-1 ring-[#ff004f]'
              : 'bg-[#12151c] border-gray-800 text-gray-400 hover:border-[#ff004f]/50 hover:text-white'
          } ${isUpdating ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className="w-14 h-14 rounded-full bg-[#ff004f]/20 border-2 border-[#ff004f] flex items-center justify-center">
            <span className={`w-6 h-6 rounded-full bg-[#ff004f] ${signal === 'RED' ? 'animate-ping motion-reduce:animate-none' : ''}`} />
          </div>
          <div className="text-center space-y-1">
            <span className="font-display font-black text-2xl tracking-wider uppercase text-[#ff004f] block">
              RED LIGHT
            </span>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-950 text-red-300 border border-red-800">
              {signal === 'RED' ? 'Currently Active' : 'Select to Activate'}
            </span>
          </div>
          <p className="font-mono text-[11px] text-gray-400 text-center leading-relaxed">
            Penalty active: All submissions incur {doublePoints ? '-10' : '-5'} pts deduction. Correctness concealed.
          </p>
        </button>

        {/* 2. GREEN LIGHT BUTTON */}
        <button
          onClick={() => handleUpdate('GREEN', doublePoints)}
          aria-pressed={signal === 'GREEN'}
          disabled={isUpdating}
          className={`p-6 rounded-2xl border flex flex-col items-center justify-between gap-4 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12151c] ${
            signal === 'GREEN'
              ? 'bg-[#00e676]/20 border-[#00e676] shadow-[0_0_30px_rgba(0,230,118,0.4)] text-white ring-1 ring-[#00e676]'
              : 'bg-[#12151c] border-gray-800 text-gray-400 hover:border-[#00e676]/50 hover:text-white'
          } ${isUpdating ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className="w-14 h-14 rounded-full bg-[#00e676]/20 border-2 border-[#00e676] flex items-center justify-center">
            <span className={`w-6 h-6 rounded-full bg-[#00e676] ${signal === 'GREEN' ? 'animate-pulse motion-reduce:animate-none' : ''}`} />
          </div>
          <div className="text-center space-y-1">
            <span className="font-display font-black text-2xl tracking-wider uppercase text-[#00e676] block">
              GREEN LIGHT
            </span>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40">
              {signal === 'GREEN' ? 'Currently Active' : 'Select to Activate'}
            </span>
          </div>
          <p className="font-mono text-[11px] text-gray-400 text-center leading-relaxed">
            Safe play: Correct answer +{doublePoints ? '20' : '10'} pts. Wrong answer -{doublePoints ? '10' : '5'} pts.
          </p>
        </button>

        {/* 3. DOUBLE POINTS ON/OFF BUTTON */}
        <button
          onClick={() => handleUpdate(signal, !doublePoints)}
          aria-pressed={doublePoints}
          disabled={isUpdating}
          className={`p-6 rounded-2xl border flex flex-col items-center justify-between gap-4 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12151c] ${
            doublePoints
              ? 'bg-[#ffd166]/15 border-[#ffd166] shadow-[0_0_30px_rgba(255,209,102,0.35)] text-white ring-1 ring-[#ffd166]'
              : 'bg-[#12151c] border-gray-800 text-gray-400 hover:border-[#ffd166]/50 hover:text-white'
          } ${isUpdating ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center ${
            doublePoints
              ? 'bg-[#ffd166]/20 border-[#ffd166] text-[#ffd166]'
              : 'bg-gray-800 border-gray-700 text-gray-500'
          }`}>
            <Zap className={`w-7 h-7 ${doublePoints ? 'fill-[#ffd166] animate-bounce motion-reduce:animate-none' : ''}`} />
          </div>
          <div className="text-center space-y-1">
            <span className={`font-display font-black text-2xl tracking-wider uppercase block ${
              doublePoints ? 'text-[#ffd166]' : 'text-gray-300'
            }`}>
              DOUBLE POINTS {doublePoints ? 'ON' : 'OFF'}
            </span>
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
              doublePoints
                ? 'bg-[#ffd166]/20 text-[#ffd166] border border-[#ffd166]/40'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}>
              {doublePoints ? '2X Active (Click to Disable)' : '1X Normal (Click to Enable)'}
            </span>
          </div>
          <p className="font-mono text-[11px] text-gray-400 text-center leading-relaxed">
            Multiplies both rewards and deductions by 2 (+20 / -10). Never converts negative to positive.
          </p>
        </button>
      </div>

      {/* Enforcement & Multiplier Settings */}
      <div className="p-6 rounded-2xl bg-[#12151c] border border-gray-800 space-y-6">
        <h3 className="font-display font-bold text-lg text-white">Rule Configuration & Authoritative Scoring</h3>

        {/* Authoritative Scoring Reference Matrix */}
        <div className="space-y-3 pt-2">
          <h4 className="font-mono text-xs uppercase tracking-wider text-gray-400">
            Authoritative Server-Enforced Scoring Matrix:
          </h4>
          <div className="overflow-x-auto rounded-xl border border-gray-800 bg-[#090b0f]">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 bg-gray-900/60">
                  <th className="py-2.5 px-4">Submission Situation</th>
                  <th className="py-2.5 px-4 text-center">Normal Mode</th>
                  <th className="py-2.5 px-4 text-center">Double Points Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-[#00e676]">
                    Correct answer during Green Light
                  </td>
                  <td className="py-2.5 px-4 text-center text-[#00e676] font-bold">+10 PTS</td>
                  <td className="py-2.5 px-4 text-center text-[#00e676] font-bold">+20 PTS</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-red-400">
                    Wrong answer during Green Light
                  </td>
                  <td className="py-2.5 px-4 text-center text-red-400 font-bold">-5 PTS</td>
                  <td className="py-2.5 px-4 text-center text-red-400 font-bold">-10 PTS</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-[#ff004f]">
                    Any submission during Red Light
                  </td>
                  <td className="py-2.5 px-4 text-center text-[#ff004f] font-bold">-5 PTS</td>
                  <td className="py-2.5 px-4 text-center text-[#ff004f] font-bold">-10 PTS</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] font-mono text-gray-500">
            * Note: Red Light submissions incur only the single Red Light penalty and cannot earn positive points under any circumstance.
          </p>
        </div>
      </div>
    </div>
  );
};
