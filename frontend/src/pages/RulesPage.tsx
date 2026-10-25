import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ShieldCheck, BookOpen, AlertOctagon, Search, HelpCircle } from 'lucide-react';
import { Card, Badge } from '../components/ui';

const RULES = [
  { id: 1, category: "Access", title: "Squad Authentication", desc: "Teams must authenticate solely with their organizer-issued Team Code and PIN. Do not share team credentials with other competitors." },
  { id: 2, category: "Arena", title: "Single Team Submission Terminal", desc: "Each squad must designate one official terminal for submitting answers. Multi-terminal race conditions are resolved idempotently by the database." },
  { id: 3, category: "System", title: "Server-Authoritative Clock", desc: "All challenge durations and deadlines are dictated strictly by the server. Browser time manipulation will have zero effect on submission validity." },
  { id: 4, category: "Scoring", title: "Signal Protocol & Scoring", desc: "During Round 1, GREEN LIGHT correct answers award +100 (+200 Double), and wrong answers deduct 50 (100 Double). Submitting during RED LIGHT incurs an immediate deduction of 50 (100 Double)." },
  { id: 5, category: "Scoring", title: "Admin-Controlled Double Points", desc: "Tournament officials decide when Double Points is active. When active, all rewards and penalties are doubled across all teams during that window." },
  { id: 6, category: "System", title: "Strict Sequential Progression", desc: "Stages and questions cannot be skipped, bypassed, or accessed out of order. Server-side validation blocks any attempt to jump forward." },
  { id: 7, category: "Logic", title: "Shape Sudoku Validation", desc: "In Round 2, Stage 2 (Broken Logic) unlocks exclusively after the server mathematically confirms a valid, conflict-free 6×6 Sudoku grid." },
  { id: 8, category: "Venue", title: "Offline Venue Physical Challenges", desc: "In Round 3, the Cup-Transfer Challenge and Broken QR Reconstruction are conducted and judged physically offline by event organizers at the arena." },
  { id: 9, category: "Breach", title: "Final Online Debugging Breach", desc: "The final online challenge on the system is the Core Debugging Challenge (+200 PTS). Redeeming a valid single-use QR code unlocks the challenge." },
  { id: 10, category: "Breach", title: "Multi-Language Equivalence", desc: "The Round 3 Debugging Challenge provides Java, Python, and C firmware implementations. All three contain the exact same logic flaw and produce the same final breach key." },
  { id: 11, category: "System", title: "Absolute Scoring Idempotency", desc: "Database-level unique constraints ensure no team can ever receive duplicate score awards for the same challenge or question." },
  { id: 12, category: "Integrity", title: "Integrity & Disqualification", desc: "Any attempt to reverse-engineer server daemons, attack network infrastructure, or exploit other teams will trigger immediate squad disqualification." },
  { id: 13, category: "Governance", title: "Audited Score Adjustments", desc: "All manual score adjustments applied by administrators require a documented mandatory explanation and are permanently recorded in the immutable audit log." },
  { id: 14, category: "Governance", title: "Confidential Leaderboard", desc: "Tournament standings are confidential and monitored exclusively by officials. Teams track their cumulative score on their personal squad console." },
  { id: 15, category: "Governance", title: "Official Tie-Break Policy", desc: "If squads have identical cumulative scores, ties are broken by: 1) Higher Round 3 score; 2) Higher Round 2 score; 3) Earliest verified Final Breach completion timestamp." }
];

export const RulesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredRules = RULES.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#08090d] text-gray-100 flex flex-col font-sans selection:bg-[#ff004f] selection:text-white">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 space-y-10 w-full">
        {/* Header */}
        <div className="text-center space-y-3">
          <Badge variant="danger" hasDot>
            TOURNAMENT GOVERNANCE
          </Badge>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-white uppercase tracking-tight">
            Official System Rulebook
          </h1>
          <p className="text-sm font-mono text-gray-400 max-w-2xl mx-auto">
            15 codified rules strictly enforced by the SQUID PROTOCOL server engine. Read carefully before entering the arena.
          </p>

          {/* Quick Filter Search */}
          <div className="max-w-md mx-auto pt-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search rule keywords (e.g. signal, tie-break, penalty)..."
                aria-label="Filter tournament rules"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f1218] border border-[#1e2432] text-white font-mono text-xs placeholder-gray-500 focus:outline-none focus:border-[#ff004f] focus-visible:ring-2 focus-visible:ring-[#ff004f] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRules.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-[#0f1218] rounded-2xl border border-[#1e2432] text-gray-400 font-mono text-xs">
              No tournament rules match "{searchTerm}". Clear the search to view all 15 rules.
            </div>
          ) : (
            filteredRules.map((rule) => (
              <Card
                key={rule.id}
                variant="interactive"
                className="p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-md bg-[#ff004f]/10 border border-[#ff004f]/30 text-[#ff004f] font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {rule.id}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {rule.category}
                    </Badge>
                  </div>
                  <h3 className="font-display font-bold text-base text-white">
                    {rule.title}
                  </h3>
                  <p className="text-xs font-mono text-gray-400 leading-relaxed">
                    {rule.desc}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Emergency Fallback Adjudication Notice */}
        <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/40 flex items-start gap-4 font-mono text-xs">
          <AlertOctagon className="w-6 h-6 text-[#ff004f] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <h4 className="font-display font-bold text-sm text-red-300 uppercase tracking-wider">
              Emergency Fallback & Adjudication Protocol
            </h4>
            <p className="text-gray-400 leading-relaxed">
              In the event of an unforeseen hall network interruption or server outage, tournament adjudicators reserve the right to deploy offline backup question matrices and manually record verified scores in the database ledger.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
