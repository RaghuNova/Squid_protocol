import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    scoreStructure: string;
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
    badgeColorClass: 'bg-surface-elevated border-border-muted text-text-primary',
    borderColorClass: 'hover:border-border-strong',
    glowColor: '#ff004f',
    glareColor: '255, 0, 79',
    icon: ShieldAlert,
    iconColorClass: 'text-text-muted',
    guardRole: 'PROTOCOL 01',
    guardSymbol: 'circle',
    title: 'The Signal Protocol',
    subtitle: 'Red Light / Green Light Questions',
    description:
      '20 fast-paced technical questions governed by a live Red Light / Green Light indicator. Double Points windows double rewards and penalties. Submitting during Red Light deducts points automatically.',
    pointsText: 'Scoring:',
    pointsHighlight: '+100 / +200 per MCQ',
    footerStatus: 'Green Light Accept',
    footerStatusColorClass: 'text-signal-green',
    briefing: {
      lore: 'Watch the signal light on your screen. Submitting an answer while the light is red triggers an automatic penalty deduction.',
      duration: '15 Minutes',
      scoreStructure: '+100 per MCQ (+200 with Double Points)',
      stages: [
        {
          title: '20 Technical Challenges',
          desc: 'Fast-paced systems engineering, algorithms, networking and cryptography questions.',
          points: '+100 PTS per correct answer',
          tag: 'Base Mode'
        },
        {
          title: 'Double Points Multiplier Window',
          desc: 'Officials trigger high-stakes windows. Correct answers double to +200 PTS; errors double to -100 PTS.',
          points: '+200 / -100 PTS',
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
    badgeColorClass: 'bg-surface-elevated border-border-muted text-text-primary',
    borderColorClass: 'hover:border-border-strong',
    glowColor: '#00f0ff',
    glareColor: '0, 240, 255',
    icon: Cpu,
    iconColorClass: 'text-text-muted',
    guardRole: 'PROTOCOL 02',
    guardSymbol: 'triangle',
    title: 'The Logic Protocol',
    subtitle: 'Two-Stage Shape & Logic Puzzles',
    description:
      'Stage 1: Solve an interactive 6×6 Shape Sudoku puzzle. Stage 2: Unlock the Broken Logic challenge to trace an operator precedence flaw in firmware code.',
    pointsText: 'Scoring:',
    pointsHighlight: '+100 S1 / +200 S2',
    footerStatus: '2 Sequential Stages',
    footerStatusColorClass: 'text-accent-cyan',
    briefing: {
      lore: 'Two sequential problem-solving gates. Teams must solve the 6×6 geometric shape grid before unlocking the firmware code challenge.',
      duration: '20 Minutes',
      scoreStructure: '+100 PTS (Stage 1) + +200 PTS (Stage 2)',
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
    badgeColorClass: 'bg-surface-elevated border-border-muted text-text-primary',
    borderColorClass: 'hover:border-border-strong',
    glowColor: '#00e676',
    glareColor: '0, 230, 118',
    icon: Terminal,
    iconColorClass: 'text-text-muted',
    guardRole: 'PROTOCOL 03',
    guardSymbol: 'square',
    title: 'The Final Breach',
    subtitle: 'Physical Verification & Firmware Debug',
    description:
      'Arena physical challenge and QR reconstruction gate unlock a firmware debugging task across Java, Python, and C. Derives the final tournament breach key.',
    pointsText: 'Scoring:',
    pointsHighlight: '+200 PTS + Champion Stamped',
    footerStatus: 'Single-Use Gate',
    footerStatusColorClass: 'text-signal-green',
    briefing: {
      lore: 'The definitive survival round. Squads compete in physical arena trials to reconstruct their designated QR token, unlocking the final kernel debugging challenge.',
      duration: '25-30 Minutes',
      scoreStructure: '+200 PTS (Final Breach Key)',
      stages: [
        {
          title: 'Stage 1: Arena Physical Activity',
          desc: 'Hands-on dexterity and coordination challenge conducted under official supervision on the venue floor.',
          points: 'Stage Clearance',
          tag: 'Arena Physical'
        },
        {
          title: 'Stage 2: Cryptographic QR Reconstruction',
          desc: 'Physically assemble your squad token fragments and redeem the single-use keycode into the terminal gate.',
          points: 'Unlocks Final Challenge',
          tag: 'Physical Gate'
        },
        {
          title: 'Stage 3: Firmware Kernel Debugging',
          desc: 'Analyze low-level firmware source code across Java, Python, and C to identify the critical logic flaw and extract the final master key.',
          points: '+200 PTS (One-Time)',
          tag: 'Final Key'
        }
      ],
      lethalRule: 'Single-use token: Each squad QR code can be redeemed exactly once. The digital debugging challenge is strictly hidden until redeemed.',
      proTip: 'Compare the arithmetic operator precedence rules between C, Java and Python carefully to determine the correct evaluation order.'
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
            <article
              key={protocol.id}
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
              className="p-6 rounded-lg bg-surface border border-border-subtle hover:border-border-strong transition-colors flex flex-col justify-between h-full select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
            >
              {/* Card Header & Content */}
              <div className="space-y-4">
                {/* Badge & Icon Row */}
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs px-2.5 py-0.5 rounded border font-semibold uppercase tracking-wider ${protocol.badgeColorClass}`}
                  >
                    {protocol.badge}
                  </span>
                  <div className="p-1.5 rounded-md bg-surface-elevated border border-border-subtle text-text-muted">
                    <IconComponent className="w-4 h-4" aria-hidden="true" />
                  </div>
                </div>

                {/* Title & Hierarchy Role (Neutral Structural Markers) */}
                <div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-text-muted uppercase tracking-wider mb-1">
                    {protocol.guardSymbol === 'circle' && <CircleShape size={12} strokeWidth={2} color="var(--text-muted)" />}
                    {protocol.guardSymbol === 'triangle' && <TriangleShape size={12} strokeWidth={2} color="var(--text-muted)" />}
                    {protocol.guardSymbol === 'square' && <SquareShape size={12} strokeWidth={2} color="var(--text-muted)" />}
                    <span>{protocol.guardRole}</span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-text-primary">
                    {protocol.title}
                  </h3>
                </div>

                {/* Description Paragraph */}
                <p className="text-xs sm:text-sm font-mono text-text-muted leading-relaxed min-h-[4.5rem]">
                  {protocol.description}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-4 mt-4 border-t border-border-subtle space-y-3">
                <div className="flex items-center justify-between font-mono text-xs text-text-secondary">
                  <span>
                    {protocol.pointsText}{' '}
                    <strong className="text-text-primary font-semibold tabular-nums">{protocol.pointsHighlight}</strong>
                  </span>
                  <span className={`font-medium ${protocol.footerStatusColorClass}`}>
                    {protocol.footerStatus}
                  </span>
                </div>

                {/* Interactive Prompt Chip */}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono text-[11px] text-text-muted flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-text-muted" aria-hidden="true" />
                    Inspect protocol briefing
                  </span>
                  <span className="w-6 h-6 rounded bg-surface-elevated border border-border-subtle flex items-center justify-center text-text-muted">
                    <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Interactive Squid Game Protocol Briefing Modal */}
      {activeModalRound && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80"
          role="dialog"
          aria-modal="true"
          aria-labelledby="briefing-modal-title"
          onClick={() => setActiveModalRound(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-surface border border-border-strong rounded-lg shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            {/* Header / Squid Symbols Bar */}
            <div className="flex items-start justify-between border-b border-border-subtle pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[11px] px-2.5 py-0.5 rounded border font-semibold uppercase tracking-wider ${activeModalRound.badgeColorClass}`}
                  >
                    {activeModalRound.badge}
                  </span>
                  <span className="font-mono text-xs text-text-muted flex items-center gap-1.5">
                    //{' '}
                    {activeModalRound.guardSymbol === 'circle' && <CircleShape size={12} strokeWidth={2} color="var(--text-muted)" />}
                    {activeModalRound.guardSymbol === 'triangle' && <TriangleShape size={12} strokeWidth={2} color="var(--text-muted)" />}
                    {activeModalRound.guardSymbol === 'square' && <SquareShape size={12} strokeWidth={2} color="var(--text-muted)" />}
                    <span>{activeModalRound.guardRole}</span>
                  </span>
                </div>
                <h2
                  id="briefing-modal-title"
                  className="font-display font-bold text-2xl text-text-primary tracking-wide"
                >
                  {activeModalRound.title}
                </h2>
                <p className="font-mono text-xs text-text-muted">
                  {activeModalRound.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalRound(null)}
                aria-label="Close protocol briefing"
                className="p-1.5 rounded-md bg-surface-elevated text-text-muted hover:text-text-primary border border-border-subtle hover:border-border-strong transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 rounded-md bg-surface-elevated border border-border-subtle">
                <div className="text-text-muted text-[10px] uppercase flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-accent-cyan" /> Duration
                </div>
                <div className="text-text-primary font-semibold text-sm">
                  {activeModalRound.briefing.duration}
                </div>
              </div>
              <div className="p-3 rounded-md bg-surface-elevated border border-border-subtle">
                <div className="text-text-muted text-[10px] uppercase flex items-center gap-1.5 mb-1">
                  <Award className="w-3.5 h-3.5 text-accent-gold" /> Scoring
                </div>
                <div className="text-signal-green font-semibold text-sm">
                  {activeModalRound.briefing.scoreStructure}
                </div>
              </div>
              <div className="p-3 rounded-md bg-surface-elevated border border-border-subtle col-span-2 sm:col-span-1">
                <div className="text-text-muted text-[10px] uppercase flex items-center gap-1.5 mb-1">
                  <Flame className="w-3.5 h-3.5 text-signal-red" /> Status
                </div>
                <div className="text-text-primary font-semibold text-sm">
                  {activeModalRound.footerStatus}
                </div>
              </div>
            </div>

            {/* Lore / Briefing Overview */}
            <div className="p-4 rounded-md bg-surface-elevated border border-border-subtle font-mono text-xs sm:text-sm text-text-secondary leading-relaxed">
              <div className="text-text-muted font-bold uppercase tracking-wider text-[11px] mb-1">
                SYSTEM OPERATIONAL BRIEFING
              </div>
              <p>{activeModalRound.briefing.lore}</p>
            </div>

            {/* Stage-by-Stage Breakdown */}
            <div className="space-y-3">
              <div className="font-display font-bold text-sm text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-text-muted" />
                Stage &amp; Challenge Breakdown
              </div>
              <div className="space-y-2">
                {activeModalRound.briefing.stages.map((stage, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-md bg-surface-elevated border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-surface border border-border-subtle text-text-primary font-mono text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <h4 className="font-display font-semibold text-sm text-text-primary">
                          {stage.title}
                        </h4>
                        {stage.tag && (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface text-text-muted border border-border-subtle">
                            {stage.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-text-muted pl-7 leading-relaxed">
                        {stage.desc}
                      </p>
                    </div>
                    <div className="sm:text-right font-mono text-xs pl-7 sm:pl-0 flex-shrink-0">
                      <span className="px-2.5 py-1 rounded bg-signal-green-subtle border border-signal-green/30 text-signal-green font-semibold tabular-nums">
                        {stage.points}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Specific Interactive Demo Component per Round */}
            {activeModalRound.id === 1 && (
              <div className="p-4 rounded-md bg-surface-elevated border border-border-subtle space-y-3">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-text-muted font-semibold uppercase tracking-wider">
                    Live Signal Daemon Mechanics:
                  </span>
                  <div className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-signal-green" />
                    <span className="text-signal-green font-bold">GREEN LIGHT: SUBMIT</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs text-text-secondary">
                  <div className="p-2.5 rounded bg-surface border border-signal-green/30">
                    <div className="text-signal-green font-semibold">Green Light Active</div>
                    <div className="text-[11px] text-text-muted mt-0.5">
                      Correct: +100 (+200 Double)<br />
                      Incorrect: -50 (-100 Double)
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-surface border border-signal-red/30">
                    <div className="text-signal-red font-semibold">Red Light Active</div>
                    <div className="text-[11px] text-text-muted mt-0.5">
                      Any Submission: -50 penalty<br />
                      Double Window: -100 penalty
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeModalRound.id === 2 && (
              <div className="p-4 rounded-md bg-surface-elevated border border-border-subtle space-y-3">
                <div className="font-mono text-xs text-text-muted font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>Cryptographic Shape Grid (6 Shapes)</span>
                  <span className="text-text-muted text-[11px]">Unique Latin Solution</span>
                </div>
                <div className="flex items-center justify-around p-3 bg-surface rounded-md border border-border-subtle">
                  <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-text-muted">
                    <SquareShape size={22} color="var(--text-muted)" />
                    <span>Square</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-text-muted">
                    <TriangleShape size={22} color="var(--text-muted)" />
                    <span>Triangle</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-text-muted">
                    <CircleShape size={22} color="var(--text-muted)" />
                    <span>Circle</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-text-muted">
                    <UmbrellaShape size={22} color="var(--text-muted)" />
                    <span>Umbrella</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-text-muted">
                    <StarShape size={22} color="var(--text-muted)" />
                    <span>Star</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-text-muted">
                    <DiamondShape size={22} color="var(--text-muted)" />
                    <span>Diamond</span>
                  </div>
                </div>
              </div>
            )}

            {activeModalRound.id === 3 && (
              <div className="p-4 rounded-md bg-surface-elevated border border-border-subtle space-y-2 font-mono text-xs">
                <div className="text-signal-green font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-signal-green" />
                    Multi-Language Equivalent Firmware
                  </span>
                  <span className="text-text-muted text-[11px]">Java / Python / C</span>
                </div>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  The final debugging breach challenges squads to identify operator precedence flaws across bitshifts and XOR operations.
                  Target Key: <code className="text-text-primary bg-surface px-1.5 py-0.5 rounded border border-border-subtle">PROTOCOL_BREACH_1040</code>
                </p>
              </div>
            )}

            {/* Warning / Pro Tip Box */}
            <div className="p-3.5 rounded-md bg-surface-elevated border border-border-subtle flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-accent-amber flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5 font-mono text-xs">
                <div className="text-text-primary font-semibold uppercase text-[11px]">
                  Survival Advisory
                </div>
                <p className="text-text-muted leading-relaxed">
                  {activeModalRound.briefing.proTip}
                </p>
              </div>
            </div>

            {/* Modal Action Buttons (Neutral Primary Button) */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border-subtle">
              <Link
                to="/rules"
                className="w-full sm:w-auto px-4 py-2.5 rounded-md bg-surface border border-border-form text-text-secondary hover:text-text-primary hover:border-border-strong font-mono text-xs tracking-wider transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
              >
                <span>Read Full Rulebook</span>
                <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-text-primary text-canvas hover:bg-slate-200 font-display font-semibold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
              >
                <span>Enter Arena Gateway</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
