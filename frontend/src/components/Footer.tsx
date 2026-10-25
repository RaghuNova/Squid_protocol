import React from 'react';
import { Link } from 'react-router-dom';
import { CircleShape, TriangleShape, SquareShape, UmbrellaShape, StarShape, DiamondShape } from './GeometricShapes';
import { IEEELogo } from './IEEELogo';
import { HelpCircle, Terminal, Github } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-800/80 bg-[#06070a] text-gray-400 py-10" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand info */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2" aria-hidden="true">
              <IEEELogo size="sm" withContainer />
              <CircleShape size={12} color="#ff004f" />
              <TriangleShape size={12} color="#ff2e7e" />
              <SquareShape size={12} color="#00f0ff" />
              <UmbrellaShape size={12} color="#ffd166" />
              <StarShape size={12} color="#a855f7" />
              <DiamondShape size={12} color="#00e676" />
              <span className="font-display font-black tracking-widest text-sm text-gray-200 ml-1.5">
                SQUID PROTOCOL
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono text-center md:text-left leading-relaxed">
              IEEE NISB Technical Engineering Tournament<br className="hidden sm:block" />
              <span className="sm:hidden"> · </span>60 Participants · 20 Teams · 3 Elimination Rounds
            </p>
          </div>

          {/* Quick links */}
          <nav aria-label="Footer navigation">
            <div className="flex items-center gap-5 text-xs font-mono flex-wrap justify-center">
              <Link
                to="/rules"
                className="hover:text-white transition-colors flex items-center gap-1.5 group"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#ff2e7e] group-hover:text-[#ff004f] transition-colors" aria-hidden="true" />
                <span>Official Rules</span>
              </Link>
              <span className="text-gray-700" aria-hidden="true">|</span>
              <div className="flex items-center gap-1.5 text-gray-500">
                <Terminal className="w-3.5 h-3.5 text-[#00f0ff]" aria-hidden="true" />
                <span>ENGINE V1.0-STABLE</span>
              </div>
            </div>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-900 text-center text-[11px] font-mono text-gray-600">
          © {new Date().getFullYear()} SQUID PROTOCOL. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
