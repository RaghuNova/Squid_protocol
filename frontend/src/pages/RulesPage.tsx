import React, { useState, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CircleShape, TriangleShape, SquareShape } from '../components/GeometricShapes';
import {
  BookOpen,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  ShieldAlert,
  Award,
  Terminal,
  Clock,
  Laptop,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Scale
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface CodifiedRule {
  id: number;
  category: 'general' | 'round1' | 'round2' | 'round3' | 'integrity';
  categoryLabel: string;
  title: string;
  plainEnglishSummary: string;
  desc: string;
  badge: string;
  badgeType: 'danger' | 'warning' | 'info' | 'success' | 'neutral';
  roundSymbol?: 'circle' | 'triangle' | 'square';
  roundAccentColor?: string;
  keyDetails: string[];
}

export const RULES: CodifiedRule[] = [
  {
    id: 1,
    category: 'general',
    categoryLabel: 'Team & Terminal Setup',
    title: 'Team Sign-In & Credentials',
    plainEnglishSummary: 'Sign in using only your organizer-issued Team Code and PIN. Do not share your login credentials with other teams.',
    desc: 'Each squad must authenticate solely with its official Team Code and security PIN. Never share credentials with competing teams. If you lose your credentials, contact an event official in the control room.',
    badge: 'MANDATORY',
    badgeType: 'neutral',
    keyDetails: [
      'Official Team Code and PIN required',
      'Credential sharing is prohibited'
    ]
  },
  {
    id: 2,
    category: 'general',
    categoryLabel: 'Team & Terminal Setup',
    title: 'Single Submission Device',
    plainEnglishSummary: 'Each team must designate one official computer or device for submitting answers.',
    desc: 'Teams may use multiple screens to research or discuss, but only one designated device may submit answers to the server. The central database processes submissions safely to prevent duplicate or conflicting submissions.',
    badge: 'MANDATORY',
    badgeType: 'neutral',
    keyDetails: [
      'One active submission device per team',
      'Automatic duplicate submission prevention'
    ]
  },
  {
    id: 3,
    category: 'general',
    categoryLabel: 'Team & Terminal Setup',
    title: 'Server-Controlled Timers & Deadlines',
    plainEnglishSummary: 'All round timers, submission deadlines, and cutoffs are controlled strictly by the central server.',
    desc: 'The official tournament clock runs on the backend server. Changing your computer or browser clock has zero effect on timers or submission validity. Always submit before the timer reaches zero.',
    badge: 'SYSTEM ENFORCED',
    badgeType: 'info',
    keyDetails: [
      'Authoritative backend server clock',
      'Client clock manipulation is ignored'
    ]
  },
  {
    id: 4,
    category: 'round1',
    categoryLabel: 'Round 1 — The Signal Protocol',
    title: 'Signal Protocol & Scoring (Red Light / Green Light)',
    plainEnglishSummary: 'Submit during Green Light for full points. Submitting during Red Light deducts points automatically.',
    desc: 'During Round 1, submitting during GREEN LIGHT awards +100 points for correct answers (+200 during Double Points) and deducts 50 points for wrong answers (100 during Double Points). Submitting during RED LIGHT automatically deducts 50 points (100 during Double Points), even if your answer is correct.',
    badge: 'PENALTY & SCORING',
    badgeType: 'danger',
    roundSymbol: 'circle',
    roundAccentColor: '#ff004f',
    keyDetails: [
      'Green Light Correct: +100 PTS (+200 PTS during Double Points)',
      'Green Light Incorrect: -50 PTS (-100 PTS during Double Points)',
      'Red Light Any Submission: -50 PTS (-100 PTS during Double Points) — correctness is not revealed'
    ]
  },
  {
    id: 5,
    category: 'round1',
    categoryLabel: 'Round 1 — The Signal Protocol',
    title: 'Double Points Multiplier Windows',
    plainEnglishSummary: 'Tournament officials activate Double Points windows. While active, all rewards and penalties are doubled.',
    desc: 'Tournament officials control when Double Points windows turn on and off. When active, both positive rewards and negative penalties double for all teams (+200 PTS for correct answers; -100 PTS for wrong answers or Red Light submissions).',
    badge: 'BONUS & RISK',
    badgeType: 'warning',
    roundSymbol: 'circle',
    roundAccentColor: '#ff004f',
    keyDetails: [
      'Controlled by tournament officials',
      'Doubles both gains (+200) and penalties (-100)'
    ]
  },
  {
    id: 6,
    category: 'round2',
    categoryLabel: 'Round 2 — The Logic Protocol',
    title: 'Strict Sequential Progression',
    plainEnglishSummary: 'You must complete challenges in exact order. The system blocks skipping ahead.',
    desc: 'Questions and stages unlock in a fixed order. You cannot skip, bypass, or jump ahead to future questions. The server verifies completion of each stage before unlocking the next.',
    badge: 'SYSTEM GATE',
    badgeType: 'info',
    roundSymbol: 'triangle',
    roundAccentColor: '#00f0ff',
    keyDetails: [
      'Sequential order is mandatory',
      'Jumping ahead is blocked by the server'
    ]
  },
  {
    id: 7,
    category: 'round2',
    categoryLabel: 'Round 2 — The Logic Protocol',
    title: 'Shape Sudoku Validation & Stage 2 Unlock',
    plainEnglishSummary: 'In Round 2, Stage 2 (Broken Logic) unlocks only after you submit a conflict-free 6×6 Sudoku grid.',
    desc: 'Round 2 Stage 1 requires solving a 6×6 Geometric Shape Sudoku (+100 points). Every row, column, and 2×3 block must contain each of the 6 Squid symbols (Square, Triangle, Circle, Umbrella, Star, Diamond) exactly once. Stage 2 (Broken Logic, +200 points) unlocks only after the server verifies a valid solution.',
    badge: 'STAGE REQUIREMENT',
    badgeType: 'info',
    roundSymbol: 'triangle',
    roundAccentColor: '#00f0ff',
    keyDetails: [
      'Stage 1: 6×6 Shape Sudoku awards +100 PTS',
      'Stage 2: Broken Logic awards +200 PTS upon completion'
    ]
  },
  {
    id: 8,
    category: 'round3',
    categoryLabel: 'Round 3 — The Final Breach',
    title: 'In-Person Physical Challenges',
    plainEnglishSummary: 'Round 3 physical activities (Cup Transfer & Broken QR Assembly) take place in the venue and are judged in person.',
    desc: 'Round 3 begins with two offline physical trials: the Cup Transfer Relay and the Broken QR Assembly. These activities are supervised and verified in person by tournament officials before teams can proceed.',
    badge: 'PHYSICAL TRIAL',
    badgeType: 'success',
    roundSymbol: 'square',
    roundAccentColor: '#00e676',
    keyDetails: [
      'Conducted in-person in the arena',
      'Requires tournament volunteer or referee sign-off'
    ]
  },
  {
    id: 9,
    category: 'round3',
    categoryLabel: 'Round 3 — The Final Breach',
    title: 'Final Online Challenge — Finishing Order Scoring',
    plainEnglishSummary: 'Entering your team account PIN unlocks the final online challenge, awarding points based on completion order.',
    desc: 'The final digital stage awards points according to verified completion order: 1st (+200), 2nd (+175), 3rd (+150), decreasing by 25 pts down to 8th (+25), and 9th onward (-25). Enter the same PIN used to sign in to your team account to unlock the problem terminal.',
    badge: 'FINISHING ORDER',
    badgeType: 'success',
    roundSymbol: 'square',
    roundAccentColor: '#00e676',
    keyDetails: [
      '1st: +200, 2nd: +175, 3rd: +150, ..., 8th: +25, 9th+: -25',
      'Requires your team account PIN',
      'Points awarded only once per verified team completion'
    ]
  },
  {
    id: 10,
    category: 'round3',
    categoryLabel: 'Round 3 — The Final Breach',
    title: 'Multi-Language Code Equivalence',
    plainEnglishSummary: 'The final debugging challenge provides Java, Python, and C source code with the exact same logic bug.',
    desc: 'Teams can solve the final challenge in Java, Python, or C. All three implementations share the identical logic flaw (operator precedence in bit-shift arithmetic) and calculate the exact same final checksum (1040), yielding the key PROTOCOL_BREACH_1040.',
    badge: 'TECHNICAL CODE',
    badgeType: 'info',
    roundSymbol: 'square',
    roundAccentColor: '#00e676',
    keyDetails: [
      'Java, Python, and C firmware implementations provided',
      'All 3 languages share the identical bug and final key'
    ]
  },
  {
    id: 11,
    category: 'integrity',
    categoryLabel: 'Scoring, Integrity & Adjudication',
    title: 'Duplicate Submission Protection',
    plainEnglishSummary: 'The system prevents duplicate score awards. Teams can only receive points once per question.',
    desc: 'Database constraints guarantee that no team can receive duplicate points for the same challenge or question. Resubmitting an already-solved problem will not award extra points.',
    badge: 'SYSTEM ENFORCED',
    badgeType: 'info',
    keyDetails: [
      'Database unique constraints on challenge completion',
      'Zero duplicate point awards'
    ]
  },
  {
    id: 12,
    category: 'integrity',
    categoryLabel: 'Scoring, Integrity & Adjudication',
    title: 'Competition Integrity & Disqualification',
    plainEnglishSummary: 'Attacking servers, interfering with other teams, or attempting to cheat results in immediate disqualification.',
    desc: 'Any attempt to reverse-engineer server backends, attack event infrastructure or network equipment, inspect other teams’ terminals, or tamper with physical venue stations will result in immediate squad disqualification with zero points.',
    badge: 'DISQUALIFICATION',
    badgeType: 'danger',
    keyDetails: [
      'Strict zero-tolerance policy',
      'Immediate removal from tournament on infraction'
    ]
  },
  {
    id: 13,
    category: 'integrity',
    categoryLabel: 'Scoring, Integrity & Adjudication',
    title: 'Audited Score Adjustments',
    plainEnglishSummary: 'Any manual score change made by an administrator requires a written reason and is permanently logged.',
    desc: 'Administrators can only adjust scores with a documented mandatory explanation. Every adjustment is permanently recorded in the system audit log for complete accountability.',
    badge: 'TRANSPARENCY',
    badgeType: 'neutral',
    keyDetails: [
      'Mandatory explanation required for any change',
      'Permanent immutable audit log'
    ]
  },
  {
    id: 14,
    category: 'integrity',
    categoryLabel: 'Scoring, Integrity & Adjudication',
    title: 'Confidential Leaderboard',
    plainEnglishSummary: 'Tournament standings are confidential and monitored exclusively by officials. Teams track their own score.',
    desc: 'Overall tournament rankings are confidential during the competition to maintain excitement and fairness. Teams can see their own real-time score and completed rounds on their dashboard.',
    badge: 'CONFIDENTIALITY',
    badgeType: 'neutral',
    keyDetails: [
      'Full leaderboard is visible only to event organizers',
      'Teams view their own live score on their personal console'
    ]
  },
  {
    id: 15,
    category: 'integrity',
    categoryLabel: 'Scoring, Integrity & Adjudication',
    title: 'Official Tie-Break Policy',
    plainEnglishSummary: 'Ties are resolved in this order: 1) Round 3 score; 2) Round 2 score; 3) Earliest verified Final Breach time.',
    desc: 'If two or more teams finish with identical total scores, ties are broken strictly by: 1) Higher Round 3 score; 2) Higher Round 2 score; 3) Earliest verified completion timestamp of the Round 3 Final Breach key.',
    badge: 'TIE-BREAKER',
    badgeType: 'warning',
    keyDetails: [
      '1st Tie-Break: Higher Round 3 points',
      '2nd Tie-Break: Higher Round 2 points',
      '3rd Tie-Break: Earliest verified Final Breach submission time'
    ]
  }
];

type CategoryFilter = 'all' | 'general' | 'round1' | 'round2' | 'round3' | 'integrity';

export const RulesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedRuleIds, setExpandedRuleIds] = useState<number[]>(RULES.map(r => r.id));

  // Toggle individual rule accordion
  const toggleRule = (id: number) => {
    setExpandedRuleIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Expand all / Collapse all
  const handleExpandAll = () => setExpandedRuleIds(RULES.map(r => r.id));
  const handleCollapseAll = () => setExpandedRuleIds([]);

  // Filter rules based on category and search query
  const filteredRules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return RULES.filter(rule => {
      const matchesCategory =
        selectedCategory === 'all' || rule.category === selectedCategory;

      if (!matchesCategory) return false;
      if (!query) return true;

      const searchableText = `${rule.id} ${rule.title} ${rule.plainEnglishSummary} ${rule.desc} ${rule.badge} ${rule.keyDetails.join(' ')}`.toLowerCase();
      return searchableText.includes(query);
    });
  }, [selectedCategory, searchQuery]);

  const categories: Array<{ id: CategoryFilter; label: string; count: number; symbol?: 'circle' | 'triangle' | 'square'; color?: string }> = [
    { id: 'all', label: 'All Rules', count: 15 },
    { id: 'general', label: 'Device & Setup', count: 3 },
    { id: 'round1', label: 'Round 1 (Signal)', count: 2, symbol: 'circle', color: '#ff004f' },
    { id: 'round2', label: 'Round 2 (Logic)', count: 2, symbol: 'triangle', color: '#00f0ff' },
    { id: 'round3', label: 'Round 3 (Final Breach)', count: 3, symbol: 'square', color: '#00e676' },
    { id: 'integrity', label: 'Scoring & Integrity', count: 5 }
  ];

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col selection:bg-signal-red selection:text-white">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex-1 space-y-10 w-full" id="main-content">
        {/* Operations Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-elevated border border-border-muted text-text-secondary font-mono text-xs uppercase tracking-widest" aria-hidden="true">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-red" />
            <BookOpen className="w-3.5 h-3.5 text-signal-red" />
            <span>OPERATIONS MANUAL • CODIFIED SPECIFICATION</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl text-text-primary uppercase tracking-tight">
            Official Rulebook
          </h1>

          <p className="text-xs sm:text-sm font-mono text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Review the 15 official rules governing SQUID PROTOCOL. All rules are strictly enforced by backend verification routines and event officials.
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1 font-mono text-xs text-text-secondary">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] bg-surface-elevated border border-border-muted">
              <Scale className="w-3.5 h-3.5 text-text-muted" aria-hidden="true" />
              <span>15 Codified Rules</span>
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] bg-surface-elevated border border-border-muted">
              <Clock className="w-3.5 h-3.5 text-accent-cyan" aria-hidden="true" />
              <span>3 Sequential Rounds</span>
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] bg-surface-elevated border border-border-muted">
              <Award className="w-3.5 h-3.5 text-signal-green" aria-hidden="true" />
              <span>Strict Enforcement</span>
            </span>
          </div>

          {/* Quick Gateway Link */}
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-md)] bg-surface-elevated border border-border-form text-text-primary hover:border-text-primary font-mono text-xs tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              <span>Ready to compete? Enter the Team Gateway</span>
              <ArrowRight className="w-3.5 h-3.5 text-text-muted" aria-hidden="true" />
            </Link>
          </div>
        </header>

        {/* Executive Quick-Reference Cards */}
        <section aria-label="Essential tournament highlights" className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs text-text-secondary uppercase tracking-widest flex items-center gap-2 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-accent-gold" aria-hidden="true" />
              <span>Essential Rules at a Glance</span>
            </h2>
            <span className="text-[11px] font-mono text-text-muted">// CRITICAL DIRECTIVES</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="facility-card p-4 space-y-2 group transition-colors hover:border-border-strong">
              <div className="flex items-center justify-between">
                <Laptop className="w-4 h-4 text-accent-cyan" aria-hidden="true" />
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-overlay text-text-muted border border-border-subtle font-bold">Rule 02</span>
              </div>
              <h3 className="font-display font-bold text-sm text-text-primary group-hover:text-accent-cyan transition-colors">Single Device</h3>
              <p className="text-xs font-mono text-text-secondary leading-relaxed">
                Designate 1 computer for submitting answers. Duplicates are rejected.
              </p>
            </div>

            <div className="facility-card p-4 space-y-2 group transition-colors hover:border-border-strong">
              <div className="flex items-center justify-between">
                <Clock className="w-4 h-4 text-accent-gold" aria-hidden="true" />
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-overlay text-text-muted border border-border-subtle font-bold">Rule 03</span>
              </div>
              <h3 className="font-display font-bold text-sm text-text-primary group-hover:text-accent-gold transition-colors">Server Clock</h3>
              <p className="text-xs font-mono text-text-secondary leading-relaxed">
                Server controls all timers. Adjusting local clock will not extend time.
              </p>
            </div>

            <div className="facility-card p-4 space-y-2 group border-signal-red/40 hover:border-signal-red/80 transition-colors">
              <div className="flex items-center justify-between">
                <AlertOctagon className="w-4 h-4 text-signal-red" aria-hidden="true" />
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-signal-red/10 text-signal-red border border-signal-red/30 font-bold">Rule 04</span>
              </div>
              <h3 className="font-display font-bold text-sm text-text-primary group-hover:text-signal-red transition-colors">Red Light Penalty</h3>
              <p className="text-xs font-mono text-text-secondary leading-relaxed">
                Submissions in Red Light automatically deduct 50 pts (100 in Double Points).
              </p>
            </div>

            <div className="facility-card p-4 space-y-2 group transition-colors hover:border-border-strong">
              <div className="flex items-center justify-between">
                <Lock className="w-4 h-4 text-signal-green" aria-hidden="true" />
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-overlay text-text-muted border border-border-subtle font-bold">Rule 06</span>
              </div>
              <h3 className="font-display font-bold text-sm text-text-primary group-hover:text-signal-green transition-colors">Sequential Order</h3>
              <p className="text-xs font-mono text-text-secondary leading-relaxed">
                No skipping. Each question and stage unlocks only after the previous is solved.
              </p>
            </div>
          </div>
        </section>

        {/* Round Overview Reference Strip & Scoring Matrix */}
        <section aria-label="Rounds overview reference" className="facility-card p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-accent-cyan" aria-hidden="true" />
              <h2 className="font-display font-extrabold text-sm sm:text-base text-text-primary tracking-wide uppercase">
                Tournament Structure by Round
              </h2>
            </div>
            <span className="text-xs font-mono text-text-muted">Official Scoring Structure</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Round 1 Card */}
            <div className="p-4 rounded-[var(--radius-md)] bg-surface border border-border-subtle hover:border-signal-red/40 transition-colors space-y-2.5 relative border-t-2 border-t-signal-red">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CircleShape size={13} color="currentColor" strokeWidth={1.5} className="text-signal-red" />
                  <span className="font-display font-bold text-sm text-text-primary">Round 1</span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-full border border-signal-red/30 bg-signal-red/10 text-signal-red font-bold">
                  15 MIN
                </span>
              </div>
              <h3 className="font-mono text-xs font-bold text-text-secondary">The Signal Protocol</h3>
              <p className="text-xs font-mono text-text-muted leading-relaxed">
                20 sequential technical MCQs governed by Red Light / Green Light. Correct answers award +100 (+200 Double). Red Light submissions deduct 50 (100 Double).
              </p>
              <div className="pt-1 font-mono text-xs font-bold text-signal-red tabular-nums">
                Points: +100 / +200 per MCQ
              </div>
            </div>

            {/* Round 2 Card */}
            <div className="p-4 rounded-[var(--radius-md)] bg-surface border border-border-subtle hover:border-accent-cyan/40 transition-colors space-y-2.5 relative border-t-2 border-t-accent-cyan">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TriangleShape size={13} color="currentColor" strokeWidth={1.5} className="text-accent-cyan" />
                  <span className="font-display font-bold text-sm text-text-primary">Round 2</span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan font-bold">
                  20 MIN
                </span>
              </div>
              <h3 className="font-mono text-xs font-bold text-text-secondary">The Logic Protocol</h3>
              <p className="text-xs font-mono text-text-muted leading-relaxed">
                2 sequential stages. Stage 1: Solve a 6×6 Shape Sudoku (+100 PTS). Stage 2: Analyze Broken Logic firmware and submit the accumulator value (+200 PTS).
              </p>
              <div className="pt-1 font-mono text-xs font-bold text-accent-cyan tabular-nums">
                Points: +100 S1 / +200 S2
              </div>
            </div>

            {/* Round 3 Card */}
            <div className="p-4 rounded-[var(--radius-md)] bg-surface border border-border-subtle hover:border-signal-green/40 transition-colors space-y-2.5 relative border-t-2 border-t-signal-green">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SquareShape size={13} color="currentColor" strokeWidth={1.5} className="text-signal-green" />
                  <span className="font-display font-bold text-sm text-text-primary">Round 3</span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-full border border-signal-green/30 bg-signal-green/10 text-signal-green font-bold">
                  25–30 MIN
                </span>
              </div>
              <h3 className="font-mono text-xs font-bold text-text-secondary">The Final Breach</h3>
              <p className="text-xs font-mono text-text-muted leading-relaxed">
                In-person Cup Transfer &amp; Broken QR Assembly. Enter your team account PIN to unlock the final multi-language debugging challenge with finishing-order scoring.
              </p>
              <div className="pt-1 font-mono text-xs font-bold text-signal-green tabular-nums">
                Finishing Order: +200 to -25 PTS
              </div>
            </div>
          </div>

          {/* Official Codified Scoring Matrix */}
          <div className="pt-2">
            <div className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2 font-semibold">
              Scoring Matrix Breakdown
            </div>
            <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border-subtle">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="sticky top-0 bg-surface z-10 border-b border-border-form text-text-muted text-[11px] uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="py-3 px-4 font-semibold">Stage</th>
                    <th scope="col" className="py-3 px-4 font-semibold">Requirement</th>
                    <th scope="col" className="py-3 px-4 text-right font-semibold">Yield</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-text-secondary bg-surface/50">
                  <tr className="hover:bg-surface-elevated transition-colors">
                    <td className="py-3 px-4 font-semibold text-text-primary flex items-center gap-2">
                      <CircleShape size={10} color="currentColor" strokeWidth={1.5} className="text-text-muted" />
                      <span>Round 1</span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">20 Technical MCQs (Normal Answers)</td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums text-text-primary">+100 / -50</td>
                  </tr>
                  <tr className="hover:bg-surface-elevated transition-colors">
                    <td className="py-3 px-4 font-semibold text-text-primary flex items-center gap-2">
                      <CircleShape size={10} color="currentColor" strokeWidth={1.5} className="text-text-muted" />
                      <span>Round 1 Bonus</span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">Double Points Multiplier Window</td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums text-text-primary">+200 / -100</td>
                  </tr>
                  <tr className="hover:bg-surface-elevated transition-colors">
                    <td className="py-3 px-4 font-semibold text-text-primary flex items-center gap-2">
                      <TriangleShape size={10} color="currentColor" strokeWidth={1.5} className="text-text-muted" />
                      <span>Round 2 · S1</span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">6×6 Shape Sudoku (Unique Valid Grid)</td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums text-text-primary">+100 PTS</td>
                  </tr>
                  <tr className="hover:bg-surface-elevated transition-colors">
                    <td className="py-3 px-4 font-semibold text-text-primary flex items-center gap-2">
                      <TriangleShape size={10} color="currentColor" strokeWidth={1.5} className="text-text-muted" />
                      <span>Round 2 · S2</span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">Broken Logic Technical Reasoning Output</td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums text-text-primary">+200 PTS</td>
                  </tr>
                  <tr className="hover:bg-surface-elevated transition-colors">
                    <td className="py-3 px-4 font-semibold text-text-primary flex items-center gap-2">
                      <SquareShape size={10} color="currentColor" strokeWidth={1.5} className="text-text-muted" />
                      <span>Round 3 · Final</span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">Final System Breach (Finishing Order)</td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums text-signal-green">+200 to -25 PTS</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Search & Category Filter Navigation */}
        <section aria-label="Rulebook controls and filters" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rules (e.g. penalty, red light, sudoku, tie-break, terminal)..."
                aria-label="Search tournament rules"
                className="w-full pl-10 pr-9 py-2.5 rounded-[var(--radius-md)] bg-surface border border-border-form text-text-primary font-mono text-xs placeholder:text-text-muted focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Expand / Collapse Controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-3 py-2 rounded-[var(--radius-sm)] bg-surface-elevated border border-border-muted text-text-secondary hover:text-text-primary hover:border-border-strong font-mono text-xs transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary cursor-pointer"
                aria-label="Expand all rules"
              >
                <ChevronDown className="w-3 h-3" />
                <span>Expand All</span>
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-3 py-2 rounded-[var(--radius-sm)] bg-surface-elevated border border-border-muted text-text-secondary hover:text-text-primary hover:border-border-strong font-mono text-xs transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary cursor-pointer"
                aria-label="Collapse all rules"
              >
                <ChevronUp className="w-3 h-3" />
                <span>Collapse All</span>
              </button>
            </div>
          </div>

          {/* Category Navigation Pills */}
          <div
            role="tablist"
            aria-label="Filter rules by category"
            className="flex items-center gap-2 overflow-x-auto pb-1"
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-sm)] font-mono text-xs transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary ${
                    isSelected
                      ? 'bg-surface-elevated text-text-primary font-bold border border-text-primary'
                      : 'bg-surface text-text-secondary border border-border-muted hover:border-border-strong hover:text-text-primary'
                  }`}
                >
                  {cat.symbol === 'circle' && <CircleShape size={11} strokeWidth={1.5} color="currentColor" className={isSelected ? 'text-text-primary' : 'text-signal-red'} />}
                  {cat.symbol === 'triangle' && <TriangleShape size={11} strokeWidth={1.5} color="currentColor" className={isSelected ? 'text-text-primary' : 'text-accent-cyan'} />}
                  {cat.symbol === 'square' && <SquareShape size={11} strokeWidth={1.5} color="currentColor" className={isSelected ? 'text-text-primary' : 'text-signal-green'} />}
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${isSelected ? 'bg-text-primary/20 text-text-primary' : 'bg-surface-elevated text-text-muted'}`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Search Results Summary */}
        {searchQuery && (
          <div className="flex items-center justify-between text-xs font-mono text-text-muted px-1" role="status">
            <span>Showing {filteredRules.length} matching rule{filteredRules.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;</span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-text-primary hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
            >
              Reset search
            </button>
          </div>
        )}

        {/* 15 Codified Rules List */}
        <section aria-label="Codified tournament rules list" className="space-y-3">
          {filteredRules.length === 0 ? (
            <div className="facility-card p-8 text-center space-y-3">
              <HelpCircle className="w-8 h-8 text-text-muted mx-auto" aria-hidden="true" />
              <h3 className="font-display font-semibold text-base text-text-primary">No Matching Rules Found</h3>
              <p className="text-xs font-mono text-text-muted max-w-sm mx-auto">
                No rules match &quot;{searchQuery}&quot;. Try a different keyword such as &quot;penalty&quot;, &quot;sudoku&quot;, &quot;tie-break&quot;, or clear your search filter.
              </p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="mt-2 px-4 py-2 rounded-[var(--radius-sm)] bg-surface-elevated hover:bg-surface-overlay text-text-primary font-mono text-xs transition-colors border border-border-form cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
              >
                Show All 15 Rules
              </button>
            </div>
          ) : (
            <ol className="space-y-3" aria-label="Tournament rules list">
              {filteredRules.map((rule) => {
                const isExpanded = expandedRuleIds.includes(rule.id);

                const borderAccentClass =
                  rule.roundSymbol === 'circle'
                    ? 'border-l-2 border-l-signal-red'
                    : rule.roundSymbol === 'triangle'
                    ? 'border-l-2 border-l-accent-cyan'
                    : rule.roundSymbol === 'square'
                    ? 'border-l-2 border-l-signal-green'
                    : rule.category === 'integrity'
                    ? 'border-l-2 border-l-signal-red/60'
                    : 'border-l-2 border-l-border-muted';

                const badgeNumberClass =
                  rule.roundSymbol === 'circle'
                    ? 'bg-signal-red/10 border-signal-red/30 text-signal-red'
                    : rule.roundSymbol === 'triangle'
                    ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan'
                    : rule.roundSymbol === 'square'
                    ? 'bg-signal-green/10 border-signal-green/30 text-signal-green'
                    : rule.category === 'integrity'
                    ? 'bg-signal-red/10 border-signal-red/30 text-signal-red'
                    : 'bg-surface-elevated border-border-muted text-text-primary';

                return (
                  <li
                    key={rule.id}
                    className={`facility-card hover:border-border-strong transition-colors overflow-hidden ${borderAccentClass}`}
                  >
                    {/* Rule Header / Clickable Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleRule(rule.id)}
                      aria-expanded={isExpanded}
                      aria-controls={`rule-content-${rule.id}`}
                      className="w-full p-4 sm:p-5 flex items-start justify-between gap-4 text-left cursor-pointer hover:bg-surface-elevated/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
                    >
                      <div className="flex items-start gap-3 sm:gap-4 flex-1">
                        {/* Rule Number Badge */}
                        <span
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 border ${badgeNumberClass}`}
                          aria-hidden="true"
                        >
                          {rule.id}
                        </span>

                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Round Geometric Symbol if applicable */}
                            {rule.roundSymbol === 'circle' && (
                              <CircleShape size={13} color="currentColor" strokeWidth={1.5} className="text-signal-red" aria-hidden="true" />
                            )}
                            {rule.roundSymbol === 'triangle' && (
                              <TriangleShape size={13} color="currentColor" strokeWidth={1.5} className="text-accent-cyan" aria-hidden="true" />
                            )}
                            {rule.roundSymbol === 'square' && (
                              <SquareShape size={13} color="currentColor" strokeWidth={1.5} className="text-signal-green" aria-hidden="true" />
                            )}

                            <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
                              {rule.categoryLabel}
                            </span>

                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase tracking-wider border ${
                                rule.badgeType === 'danger'
                                  ? 'bg-signal-red-subtle border-signal-red/30 text-signal-red'
                                  : rule.badgeType === 'warning'
                                  ? 'bg-accent-gold-subtle border-accent-gold/30 text-accent-gold'
                                  : rule.badgeType === 'success'
                                  ? 'bg-signal-green-subtle border-signal-green/30 text-signal-green'
                                  : rule.badgeType === 'info'
                                  ? 'bg-accent-cyan-subtle border-accent-cyan/30 text-accent-cyan'
                                  : 'bg-surface-elevated border-border-muted text-text-secondary'
                              }`}
                            >
                              {rule.badge}
                            </span>
                          </div>

                          <h3 className="font-display font-semibold text-base sm:text-lg text-text-primary">
                            {rule.title}
                          </h3>

                          {/* Quick Plain-English Summary (Always visible for fast scanning) */}
                          <p className="text-xs font-mono text-text-muted leading-relaxed">
                            {rule.plainEnglishSummary}
                          </p>
                        </div>
                      </div>

                      {/* Expand / Collapse Icon */}
                      <div className="text-text-muted hover:text-text-primary mt-1 p-1" aria-hidden="true">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-text-primary" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {/* Detailed Rule Breakdown (Expandable) */}
                    {isExpanded && (
                      <div
                        id={`rule-content-${rule.id}`}
                        className="px-4 sm:px-5 pb-5 pt-3 border-t border-border-subtle bg-surface-elevated/30 space-y-3"
                      >
                        <div className="pl-10 sm:pl-12 space-y-3">
                          <div className="space-y-1">
                            <h4 className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
                              Official Codified Rule:
                            </h4>
                            <p className="text-xs sm:text-sm font-mono text-text-secondary leading-relaxed">
                              {rule.desc}
                            </p>
                          </div>

                          {/* Specific Rule Details / Key Takeaways */}
                          {rule.keyDetails.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <h4 className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
                                Key Requirements:
                              </h4>
                              <ul className="space-y-1.5 text-xs font-mono">
                                {rule.keyDetails.map((detail, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-text-secondary">
                                    <span className="text-signal-red mt-0.5 text-xs font-bold" aria-hidden="true">▸</span>
                                    <span>{detail}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Emergency Adjudication Notice */}
        <section aria-labelledby="emergency-notice-heading">
          <div
            role="note"
            className="facility-card p-5 sm:p-6 border-signal-red/30 bg-surface flex items-start gap-3.5"
          >
            <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-signal-red/10 border border-signal-red/25 flex items-center justify-center flex-shrink-0 text-signal-red mt-0.5">
              <AlertOctagon className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-signal-red uppercase tracking-wider font-semibold">CONTINGENCY CLAUSE</span>
                <span className="text-text-muted text-[10px]">·</span>
                <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">OFFICIAL PROTOCOL</span>
              </div>
              <h2 id="emergency-notice-heading" className="font-display font-semibold text-sm text-text-primary uppercase tracking-wide">
                Emergency Backup &amp; Event Adjudication Protocol
              </h2>
              <p className="text-xs font-mono text-text-muted leading-relaxed">
                If an unexpected venue network failure or server outage occurs, tournament officials reserve the right to supply offline backup questions and manually record verified scores in the database ledger. All manual entries are permanently logged.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
