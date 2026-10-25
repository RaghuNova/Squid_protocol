import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CometCard } from './ui/comet-card';
import { CircleShape, TriangleShape, SquareShape, UmbrellaShape, StarShape, DiamondShape } from './GeometricShapes';
import {
  ShieldAlert,
  Cpu,
  Terminal,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
  Clock,
  Award,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Code2
} from 'lucide-react';

export interface RoundProtocol {
  id: number;
  badge: string;
  badgeColorClass: string;
  borderColorClass: string;
  glowColor: string;
  glareColor: string;
  icon: React.ElementType;
  iconColorClass: string;
  guardRole: string;
  guardSymbol: 'circle' | 'triangle' | 'square';
  title: string;
  subtitle: string;
  description: string;
  pointsText: string;
  pointsHighlight: string;
  footerStatus: string;
  footerStatusColorClass: string;
  briefing: {
    lore: string;
    duration: string;
    maxScore: string;
    stages: Array<{
      title: string;
      desc: string;
      points: string;
      tag?: string;
    }>;
    lethalRule: string;
    proTip: string;
  };
}

export const ROUND_PROTOCOLS: RoundProtocol[] = [
  {
    id: 1,
    badge: 'ROUND 1 • 15 MIN',
    badgeColorClass: 'bg-[#ff004f]/15 border-[#ff004f]/40 text-[#ff004f]',
    borderColorClass: 'hover:border-[#ff004f]/60 hover:shadow-[0_0_35px_rgba(255,0,79,0.3)]',
    glowColor: '#ff004f',
    glareColor: '255, 0, 79',
    icon: ShieldAlert,
    iconColorClass: 'text-[#ff004f]',
    guardRole: 'WORKER // CLASS-C',
    guardSymbol: 'circle',
    title: 'The Signal Protocol',
    subtitle: 'Red Light / Green Light Questions',
    description:
      '10 fast-paced technical questions governed by a live Red Light / Green Light indicator. Double Points windows double rewards and penalties. Submitting during Red Light deducts points automatically.',
    pointsText: 'Points: Up to',
    pointsHighlight: '+2,000 PTS',
    footerStatus: 'Green Light Accept',
    footerStatusColorClass: 'text-[#00e676]',
    briefing: {
      lore: 'Watch the signal light on your screen. Submitting an answer while the light is red triggers an automatic penalty deduction.',
      duration: '15 Minutes',
      maxScore: '+2,000 PTS (with Double Points Multiplier)',
      stages: [
        {
          title: '10 Technical Challenges',
          desc: 'Fast-paced systems engineering, algorithms, networking and cryptography questions.',
          points: '+100 PTS per correct answer',
          tag: 'Base Mode'
        },
        {
          title: 'Double Points Multiplier Window',
          desc: 'Officials trigger high-stakes windows. Correct answers double to +200 PTS; errors double to -100 PTS.',
          points: 'Up to +200 / -100 PTS',
          tag: 'Bonus Option'
        },
        {
          title: 'Red Light Elimination Penalty',
          desc: 'Any submission while the signal is in RED LIGHT state triggers an immediate automatic penalty deduction.',
          points: '-50 to -100 PTS penalty',
          tag: 'Penalty'
        }
      ],
      lethalRule: 'Zero tolerance: Submissions made during RED LIGHT are penalized even if your answer is correct.',
      proTip: 'Watch the signal indicator closely. Submit only while the Green Light is active!'
    }
  },
  {
    id: 2,
    badge: 'ROUND 2 • 20 MIN',
    badgeColorClass: 'bg-[#00f0ff]/15 border-[#00f0ff]/40 text-[#00f0ff]',
    borderColorClass: 'hover:border-[#00f0ff]/60 hover:shadow-[0_0_35px_rgba(0,240,255,0.3)]',
    glowColor: '#00f0ff',
    glareColor: '0, 240, 255',
    icon: Cpu,
    iconColorClass: 'text-[#00f0ff]',
    guardRole: 'SOLDIER // CLASS-B',
    guardSymbol: 'triangle',
    title: 'The Logic Protocol',
    subtitle: 'Two-Stage Shape & Logic Puzzles',
    description:
      'Stage 1: Solve an interactive 6×6 Shape Sudoku puzzle. Stage 2: Unlock the Broken Logic challenge to trace an operator precedence flaw in firmware code.',
    pointsText: 'Points:',
    pointsHighlight: '+300 PTS',
    footerStatus: '2 Sequential Stages',
    footerStatusColorClass: 'text-[#00f0ff]',
    briefing: {
      lore: 'Two sequential problem-solving gates. Teams must solve the 6×6 geometric shape grid before unlocking the firmware code challenge.',
      duration: '20 Minutes',
      maxScore: '+300 PTS (+100 S1 + +200 S2)',
      stages: [
        {
          title: 'Stage 1: 6×6 Geometric Shape Sudoku',
          desc: 'Fill the matrix using 6 Squid symbols (Square, Triangle, Circle, Umbrella, Star, Diamond). Rows, columns, and 2×3 sub-grids must be conflict-free.',
          points: '+100 PTS',
          tag: 'Shape Grid'
        },
        {
          title: 'Stage 2: Broken Logic Firmware Analysis',
          desc: 'Trace intentional operator-precedence and bit-shifting vulnerabilities in low-level firmware to derive the target value.',
          points: '+200 PTS',
          tag: 'Code Debug'
        }
      ],
      lethalRule: 'Sequential unlock: Stage 2 remains locked until the server confirms your Stage 1 grid is completely valid.',
      proTip: 'Look for rows or blocks with 4 known clues first to quickly determine the missing shape positions.'
    }
  },
  {
    id: 3,
    badge: 'ROUND 3 • 25-30 MIN',
    badgeColorClass: 'bg-[#00e676]/15 border-[#00e676]/40 text-[#00e676]',
    borderColorClass: 'hover:border-[#00e676]/60 hover:shadow-[0_0_35px_rgba(0,230,118,0.3)]',
    glowColor: '#00e676',
    glareColor: '0, 230, 118',
    icon: Terminal,
    iconColorClass: 'text-[#00e676]',
    guardRole: 'SUPERVISOR // CLASS-A',
    guardSymbol: 'square',
    title: 'The Final Breach',
    subtitle: 'In-Person Trials + Core Code Debugging',
    description:
      'Activity 1: Cup Transfer Relay judged in person by officials. Activity 2: Reconstruct broken QR code pieces. Final Challenge: Debug identical code in Java, Python, or C to find the Final Breach Key.',
    pointsText: 'Points:',
    pointsHighlight: '+200 PTS',
    footerStatus: 'Champion Race',
    footerStatusColorClass: 'text-[#ffd166]',
    briefing: {
      lore: 'The final championship trial combining teamwork dexterity, physical QR assembly, and multi-language code debugging.',
      duration: '25–30 Minutes',
      maxScore: '+200 PTS (Final Breach Key)',
      stages: [
        {
          title: 'Activity 1: Physical Cup-Transfer Arena',
          desc: 'Fast dexterity relay judged directly on-site by tournament officials. Precision and nerve under pressure.',
          points: 'Referee Check',
          tag: 'In-Person Trial'
        },
        {
          title: 'Activity 2: Fragmented QR Code Assembly',
          desc: 'Locate and reconstruct hidden QR code fragments across the hall to unlock the system terminal.',
          points: 'System Unlock',
          tag: 'In-Person QR'
        },
        {
          title: 'Final Online Challenge: Kernel Debugging',
          desc: 'Debug identical flawed firmware implementations in Java, Python, or C to calculate checksum 1040 and submit PROTOCOL_BREACH_1040.',
          points: '+200 PTS',
          tag: 'Final Trophy'
        }
      ],
      lethalRule: 'Single-use QR code: Each QR code can only be redeemed once. The final breach timestamp is recorded for tie-breaking.',
      proTip: 'All 3 languages (Java/Python/C) share the identical logic bug: check operator precedence in the bit-shift arithmetic!'
    }
  }
];

export const SquidRoundCards: React.FC = () => {
  const [activeModalRound, setActiveModalRound] = useState<RoundProtocol | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModalRound(null);
      }
    };
    if (activeModalRound) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [activeModalRound]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {ROUND_PROTOCOLS.map((protocol) => {
          const IconComponent = protocol.icon;
          return (
            <CometCard
              key={protocol.id}
              glareColor={protocol.glareColor}
              glareOpacity={0.45}
              className="cursor-pointer group flex flex-col"
            >
              <article
                onClick={() => setActiveModalRound(protocol)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveModalRound(protocol);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-haspopup="dialog"
                aria-label={`Inspect ${protocol.title} details`}
                className={`p-6 sm:p-7 rounded-2xl bg-[#12151c]/95 border border-gray-800/90 ${protocol.borderColorClass} transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden backdrop-blur-sm select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f]`}
              >
                {/* Background Ambient Symbol Watermark */}
                <div
                  className="absolute right-3 sm:right-4 bottom-12 sm:bottom-14 pointer-events-none select-none"
                  aria-hidden="true"
                >
                  {protocol.guardSymbol === 'circle' && (
                    <div
                      className="opacity-[0.28] group-hover:opacity-[0.52] group-hover:scale-105 transition-all duration-300"
                      style={{ filter: 'drop-shadow(0 0 10px rgba(255, 0, 79, 0.45))' }}
                    >
                      <CircleShape size={135} strokeWidth={2} color="#ff004f" />
                    </div>
                  )}
                  {protocol.guardSymbol === 'triangle' && (
                    <div
                      className="opacity-[0.24] group-hover:opacity-[0.46] group-hover:scale-105 transition-all duration-300"
                      style={{ filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.4))' }}
                    >
                      <TriangleShape size={135} strokeWidth={2} color="#00f0ff" />
                    </div>
                  )}
                  {protocol.guardSymbol === 'square' && (
                    <div
                      className="opacity-[0.28] group-hover:opacity-[0.52] group-hover:scale-105 transition-all duration-300 translate-x-1"
                      style={{ filter: 'drop-shadow(0 0 10px rgba(0, 230, 118, 0.45))' }}
                    >
                      <SquareShape size={124} strokeWidth={2} color="#00e676" />
                    </div>
                  )}
                </div>

                {/* Top Subtle Glow Line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-25 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${protocol.glowColor}, transparent)`,
                  }}
                  aria-hidden="true"
                />

                {/* Card Header & Content */}
                <div className="space-y-4 relative z-10">
                  {/* Badge & Icon Row */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-xs px-2.5 py-1 rounded border font-bold uppercase tracking-wider ${protocol.badgeColorClass}`}
                    >
                      {protocol.badge}
                    </span>
                    <div
                      className={`p-1.5 rounded-lg bg-gray-900/60 border border-gray-800/80 group-hover:border-current transition-colors ${protocol.iconColorClass}`}
                    >
                      <IconComponent className="w-5 h-5" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Title & Hierarchy Role */}
                  <div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                      {protocol.guardSymbol === 'circle' && <CircleShape size={12} strokeWidth={2.5} color="#ff004f" />}
                      {protocol.guardSymbol === 'triangle' && <TriangleShape size={12} strokeWidth={2.5} color="#00f0ff" />}
                      {protocol.guardSymbol === 'square' && <SquareShape size={12} strokeWidth={2.5} color="#00e676" />}
                      <span>{protocol.guardRole}</span>
                    </div>
                    <h3 className="font-display font-bold text-xl sm:text-2xl text-white group-hover:text-white transition-colors">
                      {protocol.title}
                    </h3>
                  </div>

                  {/* Description Paragraph */}
                  <p className="text-sm font-mono text-gray-400 leading-relaxed min-h-[4.5rem]">
                    {protocol.description}
                  </p>
                </div>

                {/* Card Footer & Interactive Action */}
                <div className="pt-5 mt-5 border-t border-gray-800/80 relative z-10 space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs text-gray-300">
                    <span>
                      {protocol.pointsText}{' '}
                      <strong className="text-white font-bold">{protocol.pointsHighlight}</strong>
                    </span>
                    <span className={`font-semibold ${protocol.footerStatusColorClass}`}>
                      {protocol.footerStatus}
                    </span>
                  </div>

                  {/* Interactive Prompt Chip */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-mono text-[11px] text-gray-500 group-hover:text-gray-300 transition-colors flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                      Click to inspect protocol
                    </span>
                    <span className="w-6 h-6 rounded-full bg-gray-800/80 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-[#ff004f]/20 group-hover:border group-hover:border-[#ff004f]/40 transition-all">
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </article>
            </CometCard>
          );
        })}
      </div>

      {/* Interactive Squid Game Protocol Briefing Modal */}
      {activeModalRound && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="briefing-modal-title"
          onClick={() => setActiveModalRound(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-[#0e1017] border border-gray-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto"
            style={{
              boxShadow: `0 0 60px ${activeModalRound.glowColor}25`,
            }}
          >
            {/* Header / Squid Symbols Bar */}
            <div className="flex items-start justify-between border-b border-gray-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[11px] px-2.5 py-0.5 rounded border font-bold uppercase tracking-wider ${activeModalRound.badgeColorClass}`}
                  >
                    {activeModalRound.badge}
                  </span>
                  <span className="font-mono text-xs text-gray-400 flex items-center gap-1.5">
                    //{' '}
                    {activeModalRound.guardSymbol === 'circle' && <CircleShape size={13} strokeWidth={2.5} color="#ff004f" />}
                    {activeModalRound.guardSymbol === 'triangle' && <TriangleShape size={13} strokeWidth={2.5} color="#00f0ff" />}
                    {activeModalRound.guardSymbol === 'square' && <SquareShape size={13} strokeWidth={2.5} color="#00e676" />}
                    <span>{activeModalRound.guardRole}</span>
                  </span>
                </div>
                <h2
                  id="briefing-modal-title"
                  className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight"
                >
                  {activeModalRound.title}
                </h2>
                <p className="font-mono text-xs text-gray-400">
                  {activeModalRound.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalRound(null)}
                aria-label="Close protocol briefing"
                className="p-2 rounded-xl bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#141721] border border-gray-800">
                <div className="text-gray-400 text-[10px] uppercase flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Duration
                </div>
                <div className="text-white font-bold text-sm">
                  {activeModalRound.briefing.duration}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#141721] border border-gray-800">
                <div className="text-gray-400 text-[10px] uppercase flex items-center gap-1.5 mb-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" /> Max Yield
                </div>
                <div className="text-[#00e676] font-bold text-sm">
                  {activeModalRound.briefing.maxScore}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#141721] border border-gray-800 col-span-2 sm:col-span-1">
                <div className="text-gray-400 text-[10px] uppercase flex items-center gap-1.5 mb-1">
                  <Flame className="w-3.5 h-3.5 text-[#ff004f]" /> Status
                </div>
                <div className="text-white font-bold text-sm">
                  {activeModalRound.footerStatus}
                </div>
              </div>
            </div>

            {/* Lore / Briefing Overview */}
            <div className="p-4 rounded-xl bg-[#12151c] border border-gray-800 font-mono text-xs sm:text-sm text-gray-300 leading-relaxed">
              <div className="text-[#ff004f] font-bold uppercase tracking-widest text-[11px] mb-1">
                SYSTEM OPERATIONAL BRIEFING
              </div>
              <p>{activeModalRound.briefing.lore}</p>
            </div>

            {/* Stage-by-Stage Breakdown */}
            <div className="space-y-3">
              <div className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#ff004f]" />
                Stage &amp; Challenge Breakdown
              </div>
              <div className="space-y-2.5">
                {activeModalRound.briefing.stages.map((stage, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#141721] border border-gray-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-gray-800 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <h4 className="font-display font-bold text-sm text-white">
                          {stage.title}
                        </h4>
                        {stage.tag && (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                            {stage.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-gray-400 pl-7 leading-relaxed">
                        {stage.desc}
                      </p>
                    </div>
                    <div className="sm:text-right font-mono text-xs pl-7 sm:pl-0 flex-shrink-0">
                      <span className="px-2.5 py-1 rounded bg-[#00e676]/10 border border-[#00e676]/30 text-[#00e676] font-bold">
                        {stage.points}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Specific Interactive Demo Component per Round */}
            {activeModalRound.id === 1 && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/20 via-[#12151c] to-emerald-950/20 border border-gray-800 space-y-3">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-gray-300 font-semibold uppercase tracking-wider">
                    Live Signal Daemon Mechanics:
                  </span>
                  <div className="inline-flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[#00e676] font-bold">GREEN LIGHT: SUBMIT</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs text-gray-300">
                  <div className="p-2.5 rounded bg-black/40 border border-emerald-900/40">
                    <div className="text-[#00e676] font-bold">Green Light Active</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      Correct: +100 (+200 Double)<br />
                      Incorrect: -50 (-100 Double)
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-black/40 border border-red-900/40">
                    <div className="text-[#ff004f] font-bold">Red Light Active</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      Any Submission: -50 penalty<br />
                      Double Window: -100 penalty
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeModalRound.id === 2 && (
              <div className="p-4 rounded-xl bg-[#12151c] border border-cyan-900/40 space-y-3">
                <div className="font-mono text-xs text-cyan-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>Cryptographic Shape Grid (6 Shapes)</span>
                  <span className="text-gray-400 text-[11px]">Unique Latin Solution</span>
                </div>
                <div className="flex items-center justify-around p-3 bg-black/40 rounded-lg border border-gray-800">
                  <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-gray-400">
                    <SquareShape size={24} color="#00f0ff" />
                    <span>Square</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-gray-400">
                    <TriangleShape size={24} color="#ff2e7e" />
                    <span>Triangle</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-gray-400">
                    <CircleShape size={24} color="#ff004f" />
                    <span>Circle</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-gray-400">
                    <UmbrellaShape size={24} color="#ffd166" />
                    <span>Umbrella</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-gray-400">
                    <StarShape size={24} color="#a855f7" />
                    <span>Star</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-gray-400">
                    <DiamondShape size={24} color="#00e676" />
                    <span>Diamond</span>
                  </div>
                </div>
              </div>
            )}

            {activeModalRound.id === 3 && (
              <div className="p-4 rounded-xl bg-[#12151c] border border-emerald-900/40 space-y-2 font-mono text-xs">
                <div className="text-[#00e676] font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    Multi-Language Equivalent Firmware
                  </span>
                  <span className="text-gray-400 text-[11px]">Java / Python / C</span>
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  The final debugging breach challenges squads to identify operator precedence flaws across bitshifts and XOR operations.
                  Target Key: <code className="text-white bg-black/60 px-1.5 py-0.5 rounded border border-gray-700">PROTOCOL_BREACH_1040</code>
                </p>
              </div>
            )}

            {/* Warning / Pro Tip Box */}
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5 font-mono text-xs">
                <div className="text-amber-400 font-bold uppercase text-[11px]">
                  Survival Advisory
                </div>
                <p className="text-gray-300 leading-relaxed">
                  {activeModalRound.briefing.proTip}
                </p>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-gray-800">
              <Link
                to="/rules"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#141721] border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 font-mono text-xs tracking-wider transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Read Full Rulebook</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#ff004f] hover:bg-[#ff2e7e] text-white font-display font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,0,79,0.35)] flex items-center justify-center gap-2"
              >
                <span>Enter Arena Gateway</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
