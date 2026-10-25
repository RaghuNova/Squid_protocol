import React from 'react';
import { Link } from 'react-router-dom';
import { CircleShape, TriangleShape, SquareShape, UmbrellaShape, StarShape, DiamondShape } from './GeometricShapes';
import { ShieldCheck, Terminal, BookOpen, Shield, Radio, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#1e2432] bg-[#07080b] text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Identity & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0f1218] border border-[#1e2432] inline-flex">
              <CircleShape size={14} color="#ff004f" />
              <TriangleShape size={14} color="#ff2e7e" />
              <SquareShape size={14} color="#00f0ff" />
              <UmbrellaShape size={14} color="#ffd166" />
              <StarShape size={14} color="#a855f7" />
              <DiamondShape size={14} color="#00e676" />
              <span className="font-display font-black tracking-widest text-xs text-white ml-1.5 pr-1">
                SQUID PROTOCOL
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono leading-relaxed max-w-md">
              High-stakes competitive technology survival tournament platform. 60 Operatives, 20 Squads, 3 Progressive Elimination Protocols. Mathematically validated by authoritative server state.
            </p>
            <div className="flex items-center gap-3 text-[11px] font-mono text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e676]" aria-hidden="true" />
                SYSTEM LIVE
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Radio className="w-3 h-3 text-[#00f0ff]" aria-hidden="true" />
                SSE TELEMETRY ACTIVE
              </span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold text-gray-300 uppercase tracking-widest">
              NAVIGATION
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <Link to="/rules" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#ff2e7e]" aria-hidden="true" />
                  <span>Tournament Rulebook</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#00f0ff]" aria-hidden="true" />
                  <span>Squad Login Gateway</span>
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00e676]" aria-hidden="true" />
                  <span>Confidential Standings</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Tournament Officials Portal */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold text-gray-300 uppercase tracking-widest">
              CONTROL ROOM
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <Link to="/admin" className="text-gray-400 hover:text-[#ff004f] transition-colors flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#ff004f]" aria-hidden="true" />
                  <span>Admin Access Portal</span>
                </Link>
              </li>
              <li>
                <div className="text-[11px] text-gray-500 font-mono pt-1">
                  Level-4 authentication required for signal toggles and manual score reconciliation.
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div className="pt-6 border-t border-[#1e2432]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-gray-500">
          <div>
            © {new Date().getFullYear()} SQUID PROTOCOL — SURVIVE THE SYSTEM.
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#151922] border border-[#1e2432] text-gray-400">
              SHA-256 LEDGER IDEMPOTENT
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
