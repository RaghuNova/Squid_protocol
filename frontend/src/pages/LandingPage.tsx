import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProtocolShape } from '../components/ui/ProtocolShape';
import { CornerMarks } from '../components/ui/CornerMarks';
import { useCountUp } from '../components/ui/useCountUp';
import { ArrowRight, ChevronRight, Award } from 'lucide-react';
import { SquidRoundCards } from '../components/SquidRoundCards';

export const LandingPage: React.FC = () => {
  const roundsCount = useCountUp(3, 600);
  const timerCount = useCountUp(15, 600);

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col selection:bg-signal-red selection:text-white bg-grid-subtle">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex items-center justify-center overflow-hidden border-b border-border-subtle py-16 sm:py-24" aria-label="Hero">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35"
          style={{ backgroundImage: `url('/assets/Neon%20Dystopian%20Game%20Arena.png')` }}
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Small Protocol Shape Row */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-surface border border-border-subtle text-text-muted" aria-hidden="true">
            <ProtocolShape type="circle" size={12} />
            <ProtocolShape type="triangle" size={12} />
            <ProtocolShape type="square" size={12} />
            <span className="text-[11px] font-mono uppercase tracking-widest pl-1 font-semibold text-text-muted">
              PROTOCOLS 01 · 02 · 03
            </span>
          </div>

          {/* Title & Tagline (Wordmark keeps brand pink-red, everything else neutral) */}
          <div className="space-y-3">
            <h1 className="font-display font-black text-5xl sm:text-7xl lg:text-8xl tracking-tight text-text-primary uppercase">
              SQUID <span className="text-[#ff004f]">PROTOCOL</span>
            </h1>
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 sm:w-16 bg-border-strong" aria-hidden="true" />
              <p className="font-mono text-base sm:text-xl tracking-[0.25em] text-text-secondary uppercase font-bold">
                SURVIVE THE SYSTEM
              </p>
              <span className="h-px w-8 sm:w-16 bg-border-strong" aria-hidden="true" />
            </div>
          </div>

          {/* Event description */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-text-muted font-mono leading-relaxed">
            3 elimination rounds. Compete in timed algorithms, geometric logic matrices, arena teamwork, and multi-language firmware debugging.
          </p>

          {/* Call to Actions (Neutral) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/login"
              id="cta-enter-game"
              className="w-full sm:w-auto px-8 py-3 rounded font-display font-bold text-sm tracking-wider uppercase bg-text-primary text-canvas hover:bg-slate-200 border border-transparent transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas cursor-pointer"
            >
              <span>ENTER THE GAME</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>

            <Link
              to="/rules"
              id="cta-how-to-play"
              className="w-full sm:w-auto px-7 py-3 rounded font-mono font-medium text-xs sm:text-sm tracking-wider uppercase bg-surface-elevated hover:bg-surface-overlay text-text-secondary hover:text-text-primary border border-border-form transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas cursor-pointer"
            >
              <span>HOW TO PLAY</span>
              <ChevronRight className="w-4 h-4 text-text-muted" aria-hidden="true" />
            </Link>
          </div>

          {/* Static Stat Cards with Tick Marks & Count-Up */}
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-xl mx-auto pt-8 border-t border-border-subtle">
            <div className="relative p-4 rounded bg-surface border border-border-subtle text-left corner-bracket-container group">
              <CornerMarks size={6} />
              <dt className="text-[11px] font-mono text-text-muted uppercase mb-1">
                Elimination Rounds
              </dt>
              <dd className="font-display font-black text-3xl text-text-primary tabular-nums tracking-tight">
                {roundsCount}
              </dd>
            </div>

            <div className="relative p-4 rounded bg-surface border border-border-subtle text-left corner-bracket-container group">
              <CornerMarks size={6} />
              <dt className="text-[11px] font-mono text-text-muted uppercase mb-1">
                Round 1 Timer
              </dt>
              <dd className="font-display font-black text-3xl text-text-primary tabular-nums tracking-tight">
                {timerCount}m
              </dd>
            </div>

            <div className="relative p-4 rounded bg-surface border border-border-subtle text-left corner-bracket-container group">
              <CornerMarks size={6} />
              <dt className="text-[11px] font-mono text-text-muted uppercase flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-green" aria-hidden="true" />
                Signal Engine
              </dt>
              <dd className="font-display font-black text-3xl text-signal-green tracking-tight">
                LIVE
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Slow Ticker of the three shapes as section divider (aria-hidden, paused on hover, hidden under reduced motion) */}
      <div className="w-full overflow-hidden border-b border-border-subtle bg-surface/50 py-2.5 select-none" aria-hidden="true">
        <div className="animate-ticker items-center gap-8 text-text-muted/60">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 flex-shrink-0 font-mono text-xs tracking-widest">
              <ProtocolShape type="circle" size={11} />
              <span>ROUND 01</span>
              <ProtocolShape type="triangle" size={11} />
              <span>ROUND 02</span>
              <ProtocolShape type="square" size={11} />
              <span>ROUND 03</span>
              <span className="text-border-muted">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Three Round Preview Cards */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full" aria-labelledby="rounds-heading">
        <div className="text-center space-y-2 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded bg-surface border border-border-subtle text-xs font-mono text-text-muted uppercase tracking-widest" aria-hidden="true">
            <span>THREE TOURNAMENT ROUNDS</span>
          </div>
          <h2 id="rounds-heading" className="font-display font-bold text-2xl sm:text-3xl text-text-primary uppercase tracking-tight">
            How the Competition Works
          </h2>
          <p className="text-xs sm:text-sm font-mono text-text-muted max-w-2xl mx-auto">
            Each round unlocks in sequence. Complete challenges within the time limits and avoid penalties to maximize your team's score.
          </p>
        </div>

        <SquidRoundCards />
      </section>

      {/* Official Scoring Matrix */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full" aria-labelledby="scoring-heading">
        <div className="p-6 sm:p-8 rounded bg-surface border border-border-subtle space-y-6 corner-bracket-container">
          <CornerMarks size={8} />

          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border-subtle pb-4">
            <div>
              <span className="font-mono text-xs text-text-muted uppercase tracking-wider">
                SCORING SYSTEM
              </span>
              <h2 id="scoring-heading" className="font-display font-bold text-xl sm:text-2xl text-text-primary mt-1">
                Points &amp; Scoring Breakdown
              </h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-text-muted px-3 py-1.5 rounded bg-surface-elevated border border-border-subtle">
              <Award className="w-4 h-4 text-text-muted" aria-hidden="true" />
              <span>Official Rules</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs sm:text-sm" aria-label="Scoring matrix">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold" scope="col">Protocol Phase</th>
                  <th className="py-3 px-4 font-semibold" scope="col">Challenge Description</th>
                  <th className="py-3 px-4 text-right font-semibold" scope="col">Points Structure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-text-secondary">
                <tr className="hover:bg-surface-elevated transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-text-primary flex items-center gap-2">
                    <ProtocolShape type="circle" size={10} className="text-text-muted" />
                    <span>Round 1</span>
                  </td>
                  <td className="py-3.5 px-4 text-text-secondary">20 Technical MCQs (Normal Answers)</td>
                  <td className="py-3.5 px-4 text-right font-bold tabular-nums text-text-primary">+10 / -5</td>
                </tr>
                <tr className="hover:bg-surface-elevated transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-text-primary flex items-center gap-2">
                    <ProtocolShape type="circle" size={10} className="text-text-muted" />
                    <span>Round 1 Bonus</span>
                  </td>
                  <td className="py-3.5 px-4 text-text-secondary">Double Points Multiplier Window</td>
                  <td className="py-3.5 px-4 text-right font-bold tabular-nums text-text-primary">+20 / -10</td>
                </tr>
                <tr className="hover:bg-surface-elevated transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-text-primary flex items-center gap-2">
                    <ProtocolShape type="triangle" size={10} className="text-text-muted" />
                    <span>Round 2 · S1</span>
                  </td>
                  <td className="py-3.5 px-4 text-text-secondary">6×6 Shape Sudoku (Unique Valid Grid)</td>
                  <td className="py-3.5 px-4 text-right font-bold tabular-nums text-text-primary">+100 PTS</td>
                </tr>
                <tr className="hover:bg-surface-elevated transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-text-primary flex items-center gap-2">
                    <ProtocolShape type="triangle" size={10} className="text-text-muted" />
                    <span>Round 2 · S2</span>
                  </td>
                  <td className="py-3.5 px-4 text-text-secondary">Broken Logic Technical Reasoning Output</td>
                  <td className="py-3.5 px-4 text-right font-bold tabular-nums text-text-primary">+200 PTS</td>
                </tr>
                <tr className="hover:bg-surface-elevated transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-text-primary flex items-center gap-2">
                    <ProtocolShape type="square" size={10} className="text-text-muted" />
                    <span>Round 3 · Final</span>
                  </td>
                  <td className="py-3.5 px-4 text-text-secondary">Final System Breach (Finishing Order)</td>
                  <td className="py-3.5 px-4 text-right font-bold tabular-nums text-signal-green">+200 to -25 PTS</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
