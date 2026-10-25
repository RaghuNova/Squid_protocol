import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CornerMarks } from '../components/ui/CornerMarks';
import { ProtocolShape } from '../components/ui/ProtocolShape';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col selection:bg-signal-red selection:text-white bg-grid-subtle">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6" id="main-content">
        <div className="relative max-w-md w-full p-8 rounded bg-surface border border-border-strong text-center space-y-6 corner-bracket-container">
          <CornerMarks size={10} />

          {/* Small Protocol Shape Row */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-surface-elevated border border-border-muted text-text-muted" aria-hidden="true">
            <ProtocolShape type="circle" size={10} />
            <ProtocolShape type="triangle" size={10} />
            <ProtocolShape type="square" size={10} />
            <span className="font-mono text-[10px] uppercase tracking-widest pl-1 font-semibold">
              SECTOR 404 · SIGNAL LOST
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="font-display font-black text-6xl text-text-primary tracking-tight">
              404
            </h1>
            <h2 className="font-display font-bold text-base text-text-secondary uppercase tracking-wider">
              PAGE NOT FOUND
            </h2>
            <p className="text-xs font-mono text-text-muted leading-relaxed max-w-sm mx-auto">
              The requested address does not exist or has been decommissioned by the tournament system.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded bg-text-primary text-canvas hover:bg-slate-200 font-display font-semibold text-xs uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-secondary"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              <span>RETURN HOME</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
