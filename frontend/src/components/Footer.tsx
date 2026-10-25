import React from 'react';
import { Link } from 'react-router-dom';
import { ProtocolShape } from './ui/ProtocolShape';
import { IEEELogo } from './IEEELogo';
import { HelpCircle, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border-subtle bg-canvas text-text-muted py-8 transition-colors" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Tournament Metadata */}
          <div className="flex flex-col items-center md:items-start gap-2.5">
            <div className="flex items-center gap-2.5" aria-hidden="true">
              <IEEELogo size="sm" withContainer containerClassName="bg-surface border-border-subtle" />
              {/* Structural Protocol Glyphs: 01 (Circle), 02 (Triangle), 03 (Square) */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface border border-border-subtle text-text-muted">
                <ProtocolShape type="circle" size={9} strokeWidth={1.5} />
                <ProtocolShape type="triangle" size={9} strokeWidth={1.5} />
                <ProtocolShape type="square" size={9} strokeWidth={1.5} />
              </div>
              <span className="font-display font-black tracking-wider text-sm text-text-primary ml-1">
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
                className="hover:text-text-primary text-text-secondary transition-colors flex items-center gap-1.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-secondary rounded px-2 py-1"
              >
                <HelpCircle className="w-3.5 h-3.5 text-text-muted group-hover:text-text-primary transition-colors" aria-hidden="true" />
                <span>Official Rules</span>
              </Link>
              <span className="text-border-muted" aria-hidden="true">•</span>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-surface border border-border-subtle text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-green animate-pulse" aria-hidden="true" />
                <Terminal className="w-3.5 h-3.5 text-accent-cyan" aria-hidden="true" />
                <span className="tracking-widest font-semibold text-[11px]">ENGINE V1.0-STABLE</span>
              </div>
            </div>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-2 text-center text-[11px] font-mono text-text-muted">
          <span>© {new Date().getFullYear()} SQUID PROTOCOL · IEEE NISB. All rights reserved.</span>
          <span className="text-text-muted/80">// SURVIVE THE SYSTEM</span>
        </div>
      </div>
    </footer>
  );
};
