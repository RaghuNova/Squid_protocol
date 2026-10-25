import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CircleShape, TriangleShape, SquareShape, UmbrellaShape, StarShape, DiamondShape } from '../components/GeometricShapes';
import { ArrowRight, Trophy, Zap, ShieldAlert, Cpu, Terminal, ChevronRight, Award, Shield, CheckCircle2, Lock } from 'lucide-react';
import { Card, Badge, Button, TerminalWindow } from '../components/ui';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#08090d] text-gray-100 flex flex-col font-sans selection:bg-[#ff004f] selection:text-white">
      <Navbar />

      {/* Hero Section with Clean Technical Dot Grid */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-[#1e2432] bg-dot-grid py-20">
        {/* Subtle radial vignette - disciplined, non-distracting */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#08090d]/60 to-[#08090d] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Geometric Glyph Pill */}
          <div className="inline-flex items-center gap-2.5 p-1.5 px-4 rounded-full bg-[#0f1218] border border-[#1e2432] shadow-subtle select-none">
            <div className="flex items-center gap-1.5">
              <CircleShape size={14} color="#ff004f" />
              <TriangleShape size={14} color="#ff2e7e" />
              <SquareShape size={14} color="#00f0ff" />
              <UmbrellaShape size={14} color="#ffd166" />
              <StarShape size={14} color="#a855f7" />
              <DiamondShape size={14} color="#00e676" />
            </div>
            <span className="w-1 h-1 rounded-full bg-gray-600" aria-hidden="true" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-gray-300 uppercase">
              INTER-COLLEGE TOURNAMENT ARENA
            </span>
          </div>

          {/* Title & Cyber Header */}
          <div className="space-y-3">
            <h1 className="font-display font-black text-5xl sm:text-7xl lg:text-8xl tracking-tight text-white uppercase drop-shadow-sm">
              SQUID <span className="text-[#ff004f]">PROTOCOL</span>
            </h1>
            <p className="font-mono text-lg sm:text-2xl tracking-[0.25em] text-gray-300 uppercase font-bold">
              SURVIVE THE SYSTEM
            </p>
          </div>

          {/* Mission Description */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-gray-400 font-mono leading-relaxed">
            60 elite engineers. 20 squads. 3 unforgiving elimination protocols. Timed algorithms, shape constraints, physical dexterity, and firmware kernel debugging.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link to="/login" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto group"
                rightIcon={<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              >
                ENTER THE ARENA
              </Button>
            </Link>

            <Link to="/rules" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
                rightIcon={<ChevronRight className="w-4 h-4 text-gray-400" />}
              >
                OFFICIAL RULEBOOK
              </Button>
            </Link>
          </div>

          {/* Tournament Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-8 border-t border-[#1e2432]">
            <div className="p-3.5 rounded-xl bg-[#0f1218] border border-[#1e2432] text-center">
              <span className="block font-display font-black text-2xl text-white">60</span>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Operatives</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0f1218] border border-[#1e2432] text-center">
              <span className="block font-display font-black text-2xl text-[#ff004f]">20</span>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Squads</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0f1218] border border-[#1e2432] text-center">
              <span className="block font-display font-black text-2xl text-[#00f0ff]">3</span>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Protocols</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0f1218] border border-[#1e2432] text-center">
              <span className="block font-display font-black text-2xl text-[#00e676]">2,500</span>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Max Points</span>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Architecture Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12">
          <Badge variant="danger" hasDot>
            ELIMINATION PIPELINE
          </Badge>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight">
            The Three Survival Protocols
          </h2>
          <p className="text-xs sm:text-sm font-mono text-gray-400 max-w-2xl mx-auto">
            Progression is strictly sequential and server-validated. Each protocol enforces harsh penalty dynamics and time-gated gates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Protocol 01 Card */}
          <Card variant="interactive" cornerAccents className="space-y-5 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="danger">
                  ROUND 1 • 15 MIN
                </Badge>
                <ShieldAlert className="w-5 h-5 text-[#ff004f]" />
              </div>
              <h3 className="font-display font-bold text-xl text-white group-hover:text-[#ff004f] transition-colors">
                The Signal Protocol
              </h3>
              <p className="text-xs font-mono text-gray-400 leading-relaxed">
                10 rapid technical challenges governed by an authoritative Red Light / Green Light daemon. Double Points gamble available before submission. Submitting during Red Light invokes instant score deduction.
              </p>
            </div>
            <div className="pt-4 border-t border-[#1e2432] flex items-center justify-between font-mono text-xs text-gray-300">
              <span>Points: Up to +2,000</span>
              <span className="text-[#00e676] font-semibold">Green Light Accept</span>
            </div>
          </Card>

          {/* Protocol 02 Card */}
          <Card variant="interactive" cornerAccents className="space-y-5 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="cyan">
                  ROUND 2 • 20 MIN
                </Badge>
                <Cpu className="w-5 h-5 text-[#00f0ff]" />
              </div>
              <h3 className="font-display font-bold text-xl text-white group-hover:text-[#00f0ff] transition-colors">
                The Logic Protocol
              </h3>
              <p className="text-xs font-mono text-gray-400 leading-relaxed">
                Stage 1: Solve an interactive 6×6 geometric Shape Sudoku mathematically checked against row, column, and 2×3 box constraints.
                Stage 2: Unlock Broken Logic challenge to trace decompiled algorithm bugs.
              </p>
            </div>
            <div className="pt-4 border-t border-[#1e2432] flex items-center justify-between font-mono text-xs text-gray-300">
              <span>Points: +300 PTS</span>
              <span className="text-[#00f0ff] font-semibold">2 Sequential Stages</span>
            </div>
          </Card>

          {/* Protocol 03 Card */}
          <Card variant="interactive" cornerAccents className="space-y-5 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="success">
                  ROUND 3 • 25–30 MIN
                </Badge>
                <Terminal className="w-5 h-5 text-[#00e676]" />
              </div>
              <h3 className="font-display font-bold text-xl text-white group-hover:text-[#00e676] transition-colors">
                The Final Breach
              </h3>
              <p className="text-xs font-mono text-gray-400 leading-relaxed">
                Physical cup-transfer dexterity and broken QR fragment reconstruction conducted offline at the arena. Single-use QR token unlocks the multi-language (Java, Python, C) firmware debugging breach.
              </p>
            </div>
            <div className="pt-4 border-t border-[#1e2432] flex items-center justify-between font-mono text-xs text-gray-300">
              <span>Points: +200 PTS</span>
              <span className="text-[#ffd166] font-semibold">Champion Race</span>
            </div>
          </Card>
        </div>
      </section>

      {/* Scoring Matrix Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <Card variant="elevated" className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#1e2432] pb-4">
            <div>
              <Badge variant="warning">
                SCORING ARCHITECTURE
              </Badge>
              <h3 className="font-display font-bold text-2xl text-white mt-1">
                Point Distribution Matrix
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-gray-400">
              <Award className="w-4 h-4 text-[#ffd166]" />
              <span>Overall Cap: 2,500 PTS</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#1e2432] text-gray-400">
                  <th className="py-3 px-4">Protocol Phase</th>
                  <th className="py-3 px-4">Challenge Description</th>
                  <th className="py-3 px-4 text-right">Max Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2432]/60 text-gray-300">
                <tr className="hover:bg-[#151922]/50">
                  <td className="py-3 px-4 text-[#ff004f] font-semibold">Round 1</td>
                  <td className="py-3 px-4">10 Technical MCQs (Normal Submissions)</td>
                  <td className="py-3 px-4 text-right">1,000</td>
                </tr>
                <tr className="hover:bg-[#151922]/50">
                  <td className="py-3 px-4 text-[#ff004f] font-semibold">Round 1 Bonus</td>
                  <td className="py-3 px-4">Admin Double Points Multiplier (+100 extra per question)</td>
                  <td className="py-3 px-4 text-right">+1,000</td>
                </tr>
                <tr className="hover:bg-[#151922]/50">
                  <td className="py-3 px-4 text-[#00f0ff] font-semibold">Round 2 • Stage 1</td>
                  <td className="py-3 px-4">6×6 Shape Sudoku (Unique Valid Grid)</td>
                  <td className="py-3 px-4 text-right">100</td>
                </tr>
                <tr className="hover:bg-[#151922]/50">
                  <td className="py-3 px-4 text-[#00f0ff] font-semibold">Round 2 • Stage 2</td>
                  <td className="py-3 px-4">Broken Logic Technical Reasoning Output</td>
                  <td className="py-3 px-4 text-right">200</td>
                </tr>
                <tr className="hover:bg-[#151922]/50">
                  <td className="py-3 px-4 text-[#00e676] font-semibold">Round 3 • Final</td>
                  <td className="py-3 px-4">Final System Breach Debugging Key (Java/Python/C)</td>
                  <td className="py-3 px-4 text-right">200</td>
                </tr>
                <tr className="bg-[#151922] font-bold text-white">
                  <td className="py-3.5 px-4" colSpan={2}>THEORETICAL MAXIMUM PERFECT RUN</td>
                  <td className="py-3.5 px-4 text-right text-[#00e676]">2,500 PTS</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <Footer />
    </div>
  );
};
