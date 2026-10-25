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
    title: 'Final Online Debugging Challenge (+200 PTS)',
    plainEnglishSummary: 'Redeeming your verified single-use QR code unlocks the final online debugging challenge.',
    desc: 'The final digital stage is the Core Debugging Challenge (+200 points). Teams must redeem their unique single-use QR code obtained from the physical challenge to unlock the final problem terminal.',
    badge: 'FINAL STAGE (+200 PTS)',
    badgeType: 'success',
    roundSymbol: 'square',
    roundAccentColor: '#00e676',
    keyDetails: [
      'Requires single-use QR code redemption',
      'Awards +200 PTS for the correct final breach key'
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
    <div className="min-h-screen bg-[#08090c] text-gray-100 flex flex-col selection:bg-[#ff004f] selection:text-white">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 space-y-10 w-full" id="main-content">
        {/* Classified Operations Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12151c] border border-gray-800 text-[#ff004f] font-mono text-xs uppercase tracking-widest" aria-hidden="true">
            <BookOpen className="w-3.5 h-3.5 text-[#ff2e7e]" />
            <span>OPERATIONS MANUAL • CODIFIED SPECIFICATION</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl text-white uppercase tracking-tight">
            Official Rulebook
          </h1>

          <p className="text-sm font-mono text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Review the 15 official rules governing SQUID PROTOCOL. All rules are strictly enforced by backend verification routines and event officials.
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 font-mono text-xs text-gray-400">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#12151c] border border-gray-800">
              <Scale className="w-3.5 h-3.5 text-[#ff004f]" aria-hidden="true" />
              <span>15 Codified Rules</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#12151c] border border-gray-800">
              <Clock className="w-3.5 h-3.5 text-[#00f0ff]" aria-hidden="true" />
              <span>3 Sequential Rounds</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#12151c] border border-gray-800">
              <Award className="w-3.5 h-3.5 text-[#00e676]" aria-hidden="true" />
              <span>2,500 Maximum Points</span>
            </span>
          </div>

          {/* Quick Gateway Link */}
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#12151c] border border-gray-700 text-gray-300 hover:border-[#ff004f]/60 hover:text-white font-mono text-xs tracking-wider transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,0,79,0.25)]"
            >
              <span>Ready to compete? Enter the Team Gateway</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#ff004f]" aria-hidden="true" />
            </Link>
          </div>
        </header>

        {/* Executive Quick-Reference Cards (4 Rules Every Participant Must Know) */}
        <section aria-label="Essential tournament highlights" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#ffd166]" aria-hidden="true" />
              <span>Essential Rules at a Glance</span>
            </h2>
            <span className="text-[11px] font-mono text-gray-500">Quick scan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#0f1219] border border-gray-800 hover:border-gray-700 transition-colors space-y-1.5">
              <div className="flex items-center justify-between">
                <Laptop className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                <span className="text-[10px] font-mono text-gray-500">Rule 2</span>
              </div>
              <h3 className="font-display font-bold text-sm text-white">Single Device</h3>
              <p className="text-xs font-mono text-gray-400 leading-relaxed">
                Designate 1 computer for submitting answers. Duplicates are rejected.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0f1219] border border-gray-800 hover:border-gray-700 transition-colors space-y-1.5">
              <div className="flex items-center justify-between">
                <Clock className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span className="text-[10px] font-mono text-gray-500">Rule 3</span>
              </div>
              <h3 className="font-display font-bold text-sm text-white">Server Clock</h3>
              <p className="text-xs font-mono text-gray-400 leading-relaxed">
                Server controls all timers. Adjusting local clock will not extend time.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0f1219] border border-gray-800 hover:border-gray-700 transition-colors space-y-1.5">
              <div className="flex items-center justify-between">
                <AlertOctagon className="w-4 h-4 text-[#ff004f]" aria-hidden="true" />
                <span className="text-[10px] font-mono text-gray-500">Rule 4</span>
              </div>
              <h3 className="font-display font-bold text-sm text-white">Red Light Penalty</h3>
              <p className="text-xs font-mono text-gray-400 leading-relaxed">
                Submissions in Red Light automatically deduct 50 pts (100 in Double Points).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0f1219] border border-gray-800 hover:border-gray-700 transition-colors space-y-1.5">
              <div className="flex items-center justify-between">
                <Lock className="w-4 h-4 text-[#00e676]" aria-hidden="true" />
                <span className="text-[10px] font-mono text-gray-500">Rule 6</span>
              </div>
              <h3 className="font-display font-bold text-sm text-white">Sequential Order</h3>
              <p className="text-xs font-mono text-gray-400 leading-relaxed">
                No skipping. Each question and stage unlocks only after the previous is solved.
              </p>
            </div>
          </div>
        </section>

        {/* Round Overview Reference Strip */}
        <section aria-label="Rounds overview reference" className="p-5 sm:p-6 rounded-2xl bg-[#0e1118] border border-gray-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#ff004f]" aria-hidden="true" />
              <h2 className="font-display font-bold text-base text-white tracking-wide">
                Tournament Structure by Round
              </h2>
            </div>
            <span className="text-xs font-mono text-gray-400">Total Competition Cap: 2,500 PTS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Round 1 Card */}
            <div className="p-4 rounded-xl bg-[#141824] border border-[#ff004f]/30 hover:border-[#ff004f]/60 transition-colors space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CircleShape size={16} color="#ff004f" />
                  <span className="font-display font-bold text-sm text-white">Round 1</span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#ff004f]/15 text-[#ff004f] font-semibold">
                  15 MIN
                </span>
              </div>
              <h3 className="font-mono text-xs font-semibold text-gray-200">The Signal Protocol</h3>
              <p className="text-xs font-mono text-gray-400 leading-relaxed">
                10 sequential technical MCQs governed by Red Light / Green Light. Correct answers award +100 (+200 Double). Red Light submissions deduct 50 (100 Double).
              </p>
              <div className="pt-1 font-mono text-xs font-bold text-[#ff004f]">
                Max Score: +2,000 PTS
              </div>
            </div>

            {/* Round 2 Card */}
            <div className="p-4 rounded-xl bg-[#141824] border border-[#00f0ff]/30 hover:border-[#00f0ff]/60 transition-colors space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TriangleShape size={16} color="#00f0ff" />
                  <span className="font-display font-bold text-sm text-white">Round 2</span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#00f0ff]/15 text-[#00f0ff] font-semibold">
                  20 MIN
                </span>
              </div>
              <h3 className="font-mono text-xs font-semibold text-gray-200">The Logic Protocol</h3>
              <p className="text-xs font-mono text-gray-400 leading-relaxed">
                2 sequential stages. Stage 1: Solve a 6×6 Shape Sudoku (+100 PTS). Stage 2: Analyze Broken Logic firmware and submit the accumulator value (+200 PTS).
              </p>
              <div className="pt-1 font-mono text-xs font-bold text-[#00f0ff]">
                Max Score: +300 PTS
              </div>
            </div>

            {/* Round 3 Card */}
            <div className="p-4 rounded-xl bg-[#141824] border border-[#00e676]/30 hover:border-[#00e676]/60 transition-colors space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SquareShape size={16} color="#00e676" />
                  <span className="font-display font-bold text-sm text-white">Round 3</span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#00e676]/15 text-[#00e676] font-semibold">
                  25–30 MIN
                </span>
              </div>
              <h3 className="font-mono text-xs font-semibold text-gray-200">The Final Breach</h3>
              <p className="text-xs font-mono text-gray-400 leading-relaxed">
                In-person Cup Transfer & Broken QR Assembly. Redeem your single-use QR to unlock the final multi-language debugging challenge (Java, Python, or C, +200 PTS).
              </p>
              <div className="pt-1 font-mono text-xs font-bold text-[#00e676]">
                Max Score: +200 PTS
              </div>
            </div>
          </div>
        </section>

        {/* Search & Category Filter Navigation */}
        <section aria-label="Rulebook controls and filters" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rules (e.g. penalty, red light, sudoku, tie-break, terminal)..."
                aria-label="Search tournament rules"
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#12151c] border border-gray-800 text-white font-mono text-xs placeholder-gray-500 focus:outline-none focus:border-[#ff004f] focus:ring-1 focus:ring-[#ff004f]/40 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5"
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
                className="px-3 py-1.5 rounded-lg bg-[#12151c] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 font-mono text-xs transition-colors flex items-center gap-1"
                aria-label="Expand all rules"
              >
                <ChevronDown className="w-3 h-3" />
                <span>Expand All</span>
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-3 py-1.5 rounded-lg bg-[#12151c] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 font-mono text-xs transition-colors flex items-center gap-1"
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
            className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin"
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#ff004f] text-white shadow-[0_0_15px_rgba(255,0,79,0.3)]'
                      : 'bg-[#12151c] text-gray-400 border border-gray-800 hover:border-gray-700 hover:text-gray-200'
                  }`}
                >
                  {cat.symbol === 'circle' && <CircleShape size={12} color={isSelected ? '#ffffff' : '#ff004f'} />}
                  {cat.symbol === 'triangle' && <TriangleShape size={12} color={isSelected ? '#ffffff' : '#00f0ff'} />}
                  {cat.symbol === 'square' && <SquareShape size={12} color={isSelected ? '#ffffff' : '#00e676'} />}
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/30 text-white' : 'bg-gray-800 text-gray-400'}`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Search Results Summary */}
        {searchQuery && (
          <div className="flex items-center justify-between text-xs font-mono text-gray-400 px-1" role="status">
            <span>Showing {filteredRules.length} matching rule{filteredRules.length !== 1 ? 's' : ''} for "{searchQuery}"</span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#ff004f] hover:underline"
            >
              Reset search
            </button>
          </div>
        )}

        {/* 15 Codified Rules List */}
        <section aria-label="Codified tournament rules list" className="space-y-4">
          {filteredRules.length === 0 ? (
            <div className="p-12 text-center bg-[#12151c] rounded-2xl border border-gray-800 space-y-3">
              <HelpCircle className="w-10 h-10 text-gray-500 mx-auto" aria-hidden="true" />
              <h3 className="font-display font-bold text-base text-white">No Matching Rules Found</h3>
              <p className="text-xs font-mono text-gray-400 max-w-sm mx-auto">
                No rules match "{searchQuery}". Try a different keyword such as "penalty", "sudoku", "tie-break", or clear your search filter.
              </p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="mt-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs transition-colors"
              >
                Show All 15 Rules
              </button>
            </div>
          ) : (
            <ol className="space-y-3.5" aria-label="Tournament rules list">
              {filteredRules.map((rule) => {
                const isExpanded = expandedRuleIds.includes(rule.id);

                return (
                  <li
                    key={rule.id}
                    className={`rounded-2xl bg-[#12151c] border transition-all duration-200 overflow-hidden ${
                      rule.badgeType === 'danger'
                        ? 'border-red-900/50 hover:border-red-700/70'
                        : rule.category === 'round1'
                        ? 'border-[#ff004f]/30 hover:border-[#ff004f]/60'
                        : rule.category === 'round2'
                        ? 'border-[#00f0ff]/30 hover:border-[#00f0ff]/60'
                        : rule.category === 'round3'
                        ? 'border-[#00e676]/30 hover:border-[#00e676]/60'
                        : 'border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    {/* Rule Header / Clickable Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleRule(rule.id)}
                      aria-expanded={isExpanded}
                      aria-controls={`rule-content-${rule.id}`}
                      className="w-full p-4 sm:p-5 flex items-start justify-between gap-4 text-left cursor-pointer hover:bg-white/[0.02] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f]"
                    >
                      <div className="flex items-start gap-3 sm:gap-4 flex-1">
                        {/* Rule Number Badge */}
                        <span
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                            rule.badgeType === 'danger'
                              ? 'bg-red-950/60 border-red-800 text-red-400'
                              : rule.category === 'round1'
                              ? 'bg-[#ff004f]/15 border-[#ff004f]/40 text-[#ff004f]'
                              : rule.category === 'round2'
                              ? 'bg-[#00f0ff]/15 border-[#00f0ff]/40 text-[#00f0ff]'
                              : rule.category === 'round3'
                              ? 'bg-[#00e676]/15 border-[#00e676]/40 text-[#00e676]'
                              : 'bg-gray-800/80 border-gray-700 text-gray-300'
                          }`}
                          aria-hidden="true"
                        >
                          {rule.id}
                        </span>

                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Round Geometric Symbol if applicable */}
                            {rule.roundSymbol === 'circle' && (
                              <CircleShape size={14} color="#ff004f" aria-hidden="true" />
                            )}
                            {rule.roundSymbol === 'triangle' && (
                              <TriangleShape size={14} color="#00f0ff" aria-hidden="true" />
                            )}
                            {rule.roundSymbol === 'square' && (
                              <SquareShape size={14} color="#00e676" aria-hidden="true" />
                            )}

                            <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                              {rule.categoryLabel}
                            </span>

                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${
                                rule.badgeType === 'danger'
                                  ? 'bg-red-950/60 border-red-800 text-red-400'
                                  : rule.badgeType === 'warning'
                                  ? 'bg-amber-950/50 border-amber-800/60 text-amber-300'
                                  : rule.badgeType === 'success'
                                  ? 'bg-[#00e676]/15 border-[#00e676]/40 text-[#00e676]'
                                  : rule.badgeType === 'info'
                                  ? 'bg-cyan-950/50 border-cyan-800/60 text-cyan-300'
                                  : 'bg-gray-800 border-gray-700 text-gray-300'
                              }`}
                            >
                              {rule.badge}
                            </span>
                          </div>

                          <h3 className="font-display font-bold text-base sm:text-lg text-white">
                            {rule.title}
                          </h3>

                          {/* Quick Plain-English Summary (Always visible for fast scanning) */}
                          <p className="text-xs font-mono text-gray-400 leading-relaxed">
                            {rule.plainEnglishSummary}
                          </p>
                        </div>
                      </div>

                      {/* Expand / Collapse Icon */}
                      <div className="text-gray-500 hover:text-white mt-1 p-1" aria-hidden="true">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {/* Detailed Rule Breakdown (Expandable) */}
                    {isExpanded && (
                      <div
                        id={`rule-content-${rule.id}`}
                        className="px-4 sm:px-5 pb-5 pt-1 border-t border-gray-800/60 bg-[#0b0e14]/60 space-y-3"
                      >
                        <div className="pl-10 sm:pl-12 space-y-3">
                          <div className="space-y-1">
                            <h4 className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                              Official Codified Rule:
                            </h4>
                            <p className="text-xs sm:text-sm font-mono text-gray-300 leading-relaxed">
                              {rule.desc}
                            </p>
                          </div>

                          {/* Specific Rule Details / Key Takeaways */}
                          {rule.keyDetails.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <h4 className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">
                                Key Requirements:
                              </h4>
                              <ul className="space-y-1 text-xs font-mono">
                                {rule.keyDetails.map((detail, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-gray-400">
                                    <span className="text-[#ff004f] font-bold" aria-hidden="true">•</span>
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
            className="p-6 rounded-2xl bg-red-950/20 border border-red-900/50 flex items-start gap-4 shadow-xl"
          >
            <AlertOctagon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1.5">
              <h2 id="emergency-notice-heading" className="font-display font-bold text-sm text-red-400 uppercase tracking-wider">
                Emergency Backup &amp; Event Adjudication Protocol
              </h2>
              <p className="text-xs font-mono text-gray-300 leading-relaxed">
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
