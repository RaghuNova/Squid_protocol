import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CircleShape, TriangleShape, SquareShape } from '../components/GeometricShapes';
import { ArrowRight, ChevronRight, Award } from 'lucide-react';
import { SquidRoundCards } from '../components/SquidRoundCards';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col selection:bg-signal-red selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex items-center justify-center overflow-hidden border-b border-border-subtle bg-canvas py-16 sm:py-24" aria-label="Hero">
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Neutral Protocol Markers */}
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-surface border border-border-subtle" aria-hidden="true">
            <CircleShape size={14} color="var(--text-muted)" />
            <TriangleShape size={14} color="var(--text-muted)" />
            <SquareShape size={14} color="var(--text-muted)" />
            <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider pl-1">
              PROTOCOLS 01 · 02 · 03
            </span>
          </div>

          {/* Title & Tagline (Clean Static Typography) */}
          <div className="space-y-3">
            <h1 className="font-display font-bold text-4xl sm:text-6xl lg:text-7xl tracking-wide text-text-primary uppercase">
              SQUID PROTOCOL
            </h1>
            <p className="font-mono text-lg sm:text-xl tracking-wider text-text-secondary uppercase font-semibold">
              SURVIVE THE SYSTEM
            </p>
          </div>

          {/* Event description */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-text-muted font-mono leading-relaxed">
            3 elimination rounds.
            Compete in timed algorithms, geometric logic puzzles, arena teamwork, and multi-language debugging.
          </p>

          {/* Call to Actions (Neutral Primary Button) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/login"
              id="cta-enter-game"
              className="w-full sm:w-auto px-7 py-3 rounded-md font-semibold text-sm tracking-wide bg-text-primary text-canvas hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              <span>ENTER THE GAME</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>

            <Link
              to="/rules"
              id="cta-how-to-play"
              className="w-full sm:w-auto px-7 py-3 rounded-md font-medium text-sm tracking-wide bg-surface text-text-secondary border border-border-form hover:border-border-strong hover:text-text-primary transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              <span>HOW TO PLAY</span>
              <ChevronRight className="w-4 h-4 text-text-muted" aria-hidden="true" />
            </Link>
          </div>

          {/* Key Event Metrics (Tournament format without hardcoded participant/team counts or max points) */}
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto pt-8 border-t border-border-subtle">
            {[
              { value: '3', label: 'Elimination Rounds' },
              { value: '15m', label: 'Round 1 Timer' },
              { value: 'Live', label: 'Signal Engine' },
            ].map(stat => (
              <div key={stat.label} className="p-3 rounded-md bg-surface border border-border-subtle text-left">
                <dt className="text-[11px] font-mono text-text-muted uppercase mb-1">{stat.label}</dt>
                <dd className="font-display font-bold text-2xl text-text-primary tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Three Round Preview Cards */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full" aria-labelledby="rounds-heading">
        <div className="text-center space-y-2 mb-10">
          <span className="font-mono text-xs text-text-muted uppercase tracking-wider" aria-hidden="true">
            THREE TOURNAMENT ROUNDS
          </span>
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
        <div className="p-6 sm:p-8 rounded-lg bg-surface border border-border-subtle space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border-subtle pb-4">
            <div>
              <span className="font-mono text-xs text-text-muted uppercase tracking-wider">
                SCORING SYSTEM
              </span>
              <h2 id="scoring-heading" className="font-display font-bold text-xl sm:text-2xl text-text-primary mt-1">
                Points &amp; Scoring Breakdown
              </h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
              <Award className="w-4 h-4 text-text-muted" aria-hidden="true" />
              <span>Official Rules</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs sm:text-sm" aria-label="Scoring matrix">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted">
                  <th className="py-3 px-4 font-semibold" scope="col">Protocol Phase</th>
                  <th className="py-3 px-4 font-semibold" scope="col">Challenge Description</th>
                  <th className="py-3 px-4 text-right font-semibold" scope="col">Points Structure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-text-secondary">
                <tr className="hover:bg-surface-elevated transition-colors">
                  <td className="py-3 px-4 text-text-primary font-semibold">Round 1</td>
                  <td className="py-3 px-4">20 Technical MCQs (Normal Answers)</td>
                  <td className="py-3 px-4 text-right font-bold tabular-nums text-text-primary">+100 / -50</td>
                </tr>
                <tr className="hover:bg-surface-elevated transition-colors">
                  <td className="py-3 px-4 text-text-primary font-semibold">Round 1 Bonus</td>
                  <td className="py-3 px-4">Double Points Multiplier Window</td>
                  <td className="py-3 px-4 text-right font-bold tabular-nums text-text-primary">+200 / -100</td>
                </tr>
                <tr className="hover:bg-surface-elevated transition-colors">
                  <td className="py-3 px-4 text-text-primary font-semibold">Round 2 · S1</td>
                  <td className="py-3 px-4">6×6 Shape Sudoku (Unique Valid Grid)</td>
                  <td className="py-3 px-4 text-right font-bold tabular-nums text-text-primary">+100 PTS</td>
                </tr>
                <tr className="hover:bg-surface-elevated transition-colors">
                  <td className="py-3 px-4 text-text-primary font-semibold">Round 2 · S2</td>
                  <td className="py-3 px-4">Broken Logic Technical Reasoning Output</td>
                  <td className="py-3 px-4 text-right font-bold tabular-nums text-text-primary">+200 PTS</td>
                </tr>
                <tr className="hover:bg-surface-elevated transition-colors">
                  <td className="py-3 px-4 text-text-primary font-semibold">Round 3 · Final</td>
                  <td className="py-3 px-4">Final System Breach (Finishing Order)</td>
                  <td className="py-3 px-4 text-right font-bold tabular-nums text-signal-green">+200 to -25 PTS</td>
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
