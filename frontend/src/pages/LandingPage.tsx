import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CircleShape, TriangleShape, SquareShape, UmbrellaShape, StarShape, DiamondShape } from '../components/GeometricShapes';
import { ArrowRight, ChevronRight, Award } from 'lucide-react';
import { SquidRoundCards } from '../components/SquidRoundCards';
import { EncryptedText } from '../components/ui/encrypted-text';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#08090c] text-gray-100 flex flex-col selection:bg-[#ff004f] selection:text-white">
      <Navbar />

      {/* Cinematic Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden border-b border-gray-800" aria-label="Hero">
        {/* Background Image with Dark Vignette */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35 scale-105"
          style={{ backgroundImage: `url('/assets/hero-bg.jpg')` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090c] via-[#08090c]/65 to-[#08090c]/30" aria-hidden="true" />

        {/* Ambient Red Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#ff004f]/12 blur-[140px] rounded-full pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[200px] bg-[#ff004f]/8 blur-[100px] rounded-full pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-8">
          {/* Symbol Badge */}
          <div className="inline-flex items-center gap-3 p-2 px-5 rounded-full bg-[#12151c]/90 border border-gray-700/60 shadow-2xl backdrop-blur-md" aria-hidden="true">
            <CircleShape size={18} color="#ff004f" className="animate-pulse" />
            <TriangleShape size={18} color="#ff2e7e" />
            <SquareShape size={18} color="#00f0ff" />
            <UmbrellaShape size={18} color="#ffd166" />
            <StarShape size={18} color="#a855f7" />
            <DiamondShape size={18} color="#00e676" />
          </div>

          {/* Title & Tagline */}
          <div className="space-y-3">
            <h1 className="font-display font-black text-5xl sm:text-7xl lg:text-8xl tracking-tight text-white uppercase text-glow-red">
              <EncryptedText
                text="SQUID PROTOCOL"
                revealDelayMs={60}
                flipDelayMs={45}
                segments={[
                  {
                    text: 'SQUID',
                    className: 'text-white',
                    revealedClassName: 'text-white',
                    encryptedClassName: 'text-white/50 drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]',
                  },
                  {
                    text: ' ',
                    className: 'inline',
                  },
                  {
                    text: 'PROTOCOL',
                    className: 'text-transparent bg-clip-text bg-gradient-to-r from-[#ff004f] via-[#ff2e7e] to-[#ff004f]',
                    revealedClassName: 'text-transparent bg-clip-text bg-gradient-to-r from-[#ff004f] via-[#ff2e7e] to-[#ff004f]',
                    encryptedClassName: 'text-[#ff004f]/60 drop-shadow-[0_0_8px_rgba(255,0,79,0.35)]',
                  },
                ]}
              />
            </h1>
            <p className="font-mono text-xl sm:text-2xl tracking-[0.2em] text-gray-300 uppercase font-semibold">
              SURVIVE THE SYSTEM
            </p>
          </div>

          {/* Event description */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-400 font-mono leading-relaxed">
            3 elimination rounds.
            Compete in timed algorithms, geometric logic puzzles, arena teamwork, and multi-language debugging.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/login"
              id="cta-enter-game"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-display font-bold text-base tracking-wider bg-[#ff004f] text-white hover:bg-[#ff2e7e] active:scale-95 transition-all shadow-[0_0_30px_rgba(255,0,79,0.45)] flex items-center justify-center gap-2 group"
            >
              <span>ENTER THE GAME</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>

            <Link
              to="/rules"
              id="cta-how-to-play"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-display font-semibold text-base tracking-wider bg-[#12151c] text-gray-200 border border-gray-700 hover:border-gray-500 hover:text-white active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>HOW TO PLAY</span>
              <ChevronRight className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </Link>
          </div>

          {/* Key Event Metrics (Tournament format without hardcoded participant/team counts or max points) */}
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto pt-8 border-t border-gray-800/60">
            {[
              { value: '3', label: 'Elimination Rounds', color: 'text-[#00f0ff]' },
              { value: '15m', label: 'Round 1 Timer', color: 'text-[#ffd166]' },
              { value: 'Live', label: 'Signal Engine', color: 'text-[#ff004f]' },
            ].map(stat => (
              <div key={stat.label} className="p-3.5 rounded-xl bg-[#12151c]/70 border border-gray-800 card-hover">
                <dt className="text-[11px] font-mono text-gray-400 uppercase mb-1">{stat.label}</dt>
                <dd className={`font-display font-black text-2xl ${stat.color}`}>{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Three Round Preview Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full" aria-labelledby="rounds-heading">
        <div className="text-center space-y-3 mb-12">
          <span className="font-mono text-xs text-[#ff004f] uppercase tracking-widest" aria-hidden="true">
            THREE TOURNAMENT ROUNDS
          </span>
          <h2 id="rounds-heading" className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight">
            How the Competition Works
          </h2>
          <p className="text-sm font-mono text-gray-400 max-w-2xl mx-auto">
            Each round unlocks in sequence. Complete challenges within the time limits and avoid penalties to maximize your team's score.
          </p>
        </div>

        <SquidRoundCards />
      </section>

      {/* Official Scoring Matrix */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full" aria-labelledby="scoring-heading">
        <div className="p-6 sm:p-8 rounded-2xl bg-[#090b0f] border border-gray-800 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-800 pb-4">
            <div>
              <span className="font-mono text-xs text-amber-400 uppercase tracking-widest">
                SCORING SYSTEM
              </span>
              <h2 id="scoring-heading" className="font-display font-bold text-2xl text-white mt-1">
                Points &amp; Scoring Breakdown
              </h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-gray-400">
              <Award className="w-4 h-4 text-[#ffd166]" aria-hidden="true" />
              <span>Official Rules</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs sm:text-sm" aria-label="Scoring matrix">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="py-3 px-4 font-semibold" scope="col">Protocol Phase</th>
                  <th className="py-3 px-4 font-semibold" scope="col">Challenge Description</th>
                  <th className="py-3 px-4 text-right font-semibold" scope="col">Points Structure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-gray-200">
                <tr className="hover:bg-gray-900/30 transition-colors">
                  <td className="py-3 px-4 text-[#ff004f] font-semibold">Round 1</td>
                  <td className="py-3 px-4">20 Technical MCQs (Normal Answers)</td>
                  <td className="py-3 px-4 text-right font-bold">+100 / -50</td>
                </tr>
                <tr className="hover:bg-gray-900/30 transition-colors">
                  <td className="py-3 px-4 text-[#ff004f] font-semibold">Round 1 Bonus</td>
                  <td className="py-3 px-4">Double Points Multiplier Window</td>
                  <td className="py-3 px-4 text-right font-bold">+200 / -100</td>
                </tr>
                <tr className="hover:bg-gray-900/30 transition-colors">
                  <td className="py-3 px-4 text-[#00f0ff] font-semibold">Round 2 · S1</td>
                  <td className="py-3 px-4">6×6 Shape Sudoku (Unique Valid Grid)</td>
                  <td className="py-3 px-4 text-right font-bold">+100 PTS</td>
                </tr>
                <tr className="hover:bg-gray-900/30 transition-colors">
                  <td className="py-3 px-4 text-[#00f0ff] font-semibold">Round 2 · S2</td>
                  <td className="py-3 px-4">Broken Logic Technical Reasoning Output</td>
                  <td className="py-3 px-4 text-right font-bold">+200 PTS</td>
                </tr>
                <tr className="hover:bg-gray-900/30 transition-colors">
                  <td className="py-3 px-4 text-[#00e676] font-semibold">Round 3 · Final</td>
                  <td className="py-3 px-4">Final System Breach (Finishing Order)</td>
                  <td className="py-3 px-4 text-right font-bold text-[#00e676]">+200 to -25 PTS</td>
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
