import React from 'react';
import { Link } from 'react-router-dom';
import { CircleShape, TriangleShape, SquareShape } from './GeometricShapes';
import { IEEELogo } from './IEEELogo';
import { HelpCircle, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border-subtle bg-canvas text-text-muted py-8" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Tournament Metadata */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2" aria-hidden="true">
              <IEEELogo size="sm" withContainer />
              {/* Structural Protocol Glyphs: 01 (Red), 02 (Cyan), 03 (Green) */}
              <div className="flex items-center gap-1 opacity-80">
                <CircleShape size={11} color="#ff004f" />
                <TriangleShape size={11} color="#00f0ff" />
                <SquareShape size={11} color="#00e676" />
              </div>
              <span className="font-display font-bold tracking-wide text-sm text-text-primary ml-1">
                SQUID<span className="text-[#ff004f]"> PROTOCOL</span>
              </span>
            </div>
            <p className="text-xs text-text-muted font-mono text-center md:text-left leading-relaxed">
              IEEE NISB Technical Engineering Tournament<br className="hidden sm:block" />
              <span className="sm:hidden"> · </span>60 Participants · 20 Teams · 3 Elimination Rounds
            </p>
          </div>

          {/* Quick links & System Engine Tag */}
          <nav aria-label="Footer navigation">
            <div className="flex items-center gap-4 text-xs font-mono flex-wrap justify-center">
              <Link
                to="/rules"
                className="hover:text-text-primary text-text-secondary transition-colors flex items-center gap-1.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] rounded"
              >
                <HelpCircle className="w-3.5 h-3.5 text-text-muted group-hover:text-text-primary transition-colors" aria-hidden="true" />
                <span>Official Rules</span>
              </Link>
              <span className="text-border-muted" aria-hidden="true">•</span>
              <div className="flex items-center gap-1.5 text-text-muted">
                <Terminal className="w-3.5 h-3.5 text-accent-cyan" aria-hidden="true" />
                <span>ENGINE V1.0-STABLE</span>
              </div>
            </div>
          </nav>
        </div>

        <div className="mt-6 pt-5 border-t border-border-subtle text-center text-[11px] font-mono text-text-muted">
          © {new Date().getFullYear()} SQUID PROTOCOL · IEEE NISB. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
