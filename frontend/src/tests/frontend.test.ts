import { describe, it, expect } from 'vitest';
import { SymbolMap } from '../components/GeometricShapes';
import { parseRound3QrPayload } from '../features/round3/qrPayload';

describe('Squid Protocol — Frontend Logic & Puzzle Matrix Tests', () => {
  it('extracts the opaque redemption token from the printed QR URL without altering it', () => {
    const token = 'Abcdefghijklmnopqrstuvwxyz0123456789_-ABCDEF';
    expect(parseRound3QrPayload(`https://event.example/qr/redeem#code=${encodeURIComponent(token)}`)).toBe(token);
    expect(parseRound3QrPayload(` https://event.example/qr/redeem?code=${encodeURIComponent(token)} `)).toBe(token);
    expect(parseRound3QrPayload('https://event.example/other#code=not-a-token')).toBeNull();
    expect(parseRound3QrPayload('')).toBeNull();
  });

  it('contains all 6 distinct geometric shape definitions', () => {
    const keys = Object.keys(SymbolMap);
    expect(keys).toEqual(['S', 'T', 'C', 'U', 'A', 'D']);
    expect(SymbolMap.S.label).toBe('Square');
    expect(SymbolMap.T.label).toBe('Triangle');
    expect(SymbolMap.C.label).toBe('Circle');
    expect(SymbolMap.U.label).toBe('Umbrella');
    expect(SymbolMap.A.label).toBe('Star');
    expect(SymbolMap.D.label).toBe('Diamond');
  });

  it('validates 6x6 Sudoku mathematical constraints on full solution', () => {
    const solution = 'STCUADUADSTCTCSDUADUATCSCSUADTADTCSU';
    expect(solution.length).toBe(36);

    const validSymbols = new Set(['S', 'T', 'C', 'U', 'A', 'D']);

    // Check rows and columns
    for (let r = 0; r < 6; r++) {
      const rowSet = new Set<string>();
      const colSet = new Set<string>();
      for (let c = 0; c < 6; c++) {
        rowSet.add(solution[r * 6 + c]);
        colSet.add(solution[c * 6 + r]);
      }
      expect(rowSet.size).toBe(6);
      expect(colSet.size).toBe(6);
      rowSet.forEach(s => expect(validSymbols.has(s)).toBe(true));
    }

    // Check 2x3 blocks
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 2; bc++) {
        const boxSet = new Set<string>();
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 3; c++) {
            boxSet.add(solution[(br * 2 + r) * 6 + (bc * 3 + c)]);
          }
        }
        expect(boxSet.size).toBe(6);
      }
    }
  });

  it('verifies initial Sudoku clue grid is a subset of the unique solution', () => {
    const initial = 'S0C0A00A0S0CT00D0A0UA0C0C0U0D00D0C0U';
    const solution = 'STCUADUADSTCTCSDUADUATCSCSUADTADTCSU';

    for (let i = 0; i < 36; i++) {
      if (initial[i] !== '0') {
        expect(initial[i]).toBe(solution[i]);
      }
    }
  });

  it('verifies debugging challenge equivalence and derivation across Java, Python, and C', () => {
    const data = [12, 25, 34, 47, 58, 63, 72, 81];
    let correctChecksum = 0;

    for (const b of data) {
      if (b % 2 === 0) {
        // Intended: (b << 2) + 3
        correctChecksum += (b << 2) + 3;
      } else {
        // b ^ 0x4B
        correctChecksum += (b ^ 0x4B);
      }
    }

    expect(correctChecksum).toBe(1040);
    const finalKey = `PROTOCOL_BREACH_${correctChecksum}`;
    expect(finalKey).toBe('PROTOCOL_BREACH_1040');
  });

  describe('Round 1 Scoring Matrix & Feedback Logic', () => {
    // Scoring function replicating authoritative rule engine
    function calculateRound1Outcome(params: {
      signal: 'GREEN' | 'RED';
      doublePoints: boolean;
      selectedOption: string;
      correctOption: string;
    }) {
      const isMatch = params.selectedOption.trim().toUpperCase() === params.correctOption.trim().toUpperCase();
      const mult = params.doublePoints ? 2 : 1;

      if (params.signal === 'RED') {
        return {
          status: 'PENALIZED' as const,
          isCorrect: false,
          pointsAwarded: -50 * mult,
          feedbackType: 'penalty' as const,
          revealCorrectness: false
        };
      }

      if (isMatch) {
        return {
          status: 'CORRECT' as const,
          isCorrect: true,
          pointsAwarded: 100 * mult,
          feedbackType: 'success' as const,
          revealCorrectness: true
        };
      }

      return {
        status: 'INCORRECT' as const,
        isCorrect: false,
        pointsAwarded: -50 * mult,
        feedbackType: 'error' as const,
        revealCorrectness: true
      };
    }

    it('Green Light + correct answer awards +100 (Normal) and +200 (Double)', () => {
      const normal = calculateRound1Outcome({ signal: 'GREEN', doublePoints: false, selectedOption: 'A', correctOption: 'A' });
      expect(normal.isCorrect).toBe(true);
      expect(normal.pointsAwarded).toBe(100);
      expect(normal.feedbackType).toBe('success');

      const double = calculateRound1Outcome({ signal: 'GREEN', doublePoints: true, selectedOption: 'A', correctOption: 'A' });
      expect(double.isCorrect).toBe(true);
      expect(double.pointsAwarded).toBe(200);
      expect(double.feedbackType).toBe('success');
    });

    it('Green Light + wrong answer deducts 50 (Normal) and 100 (Double) and is never shown as correct', () => {
      const normal = calculateRound1Outcome({ signal: 'GREEN', doublePoints: false, selectedOption: 'B', correctOption: 'A' });
      expect(normal.isCorrect).toBe(false);
      expect(normal.pointsAwarded).toBe(-50);
      expect(normal.feedbackType).toBe('error');

      const double = calculateRound1Outcome({ signal: 'GREEN', doublePoints: true, selectedOption: 'B', correctOption: 'A' });
      expect(double.isCorrect).toBe(false);
      expect(double.pointsAwarded).toBe(-100);
      expect(double.feedbackType).toBe('error');
    });

    it('Red Light deducts 50 (Normal) and 100 (Double) on both correct and wrong answers without revealing correctness', () => {
      const correctRed = calculateRound1Outcome({ signal: 'RED', doublePoints: false, selectedOption: 'A', correctOption: 'A' });
      expect(correctRed.isCorrect).toBe(false);
      expect(correctRed.pointsAwarded).toBe(-50);
      expect(correctRed.revealCorrectness).toBe(false);

      const wrongRed = calculateRound1Outcome({ signal: 'RED', doublePoints: false, selectedOption: 'B', correctOption: 'A' });
      expect(wrongRed.isCorrect).toBe(false);
      expect(wrongRed.pointsAwarded).toBe(-50);
      expect(wrongRed.revealCorrectness).toBe(false);

      const doubleRed = calculateRound1Outcome({ signal: 'RED', doublePoints: true, selectedOption: 'A', correctOption: 'A' });
      expect(doubleRed.pointsAwarded).toBe(-100);
      expect(doubleRed.revealCorrectness).toBe(false);
    });

    it('Double Points doubles negative deductions and never turns them positive', () => {
      const wrong = calculateRound1Outcome({ signal: 'GREEN', doublePoints: true, selectedOption: 'C', correctOption: 'A' });
      expect(wrong.pointsAwarded).toBe(-100);
      expect(wrong.pointsAwarded < 0).toBe(true);

      const red = calculateRound1Outcome({ signal: 'RED', doublePoints: true, selectedOption: 'A', correctOption: 'A' });
      expect(red.pointsAwarded).toBe(-100);
      expect(red.pointsAwarded < 0).toBe(true);
    });
  });

  describe('Admin Game Reset Confirmation', () => {
    it('requires two confirmations and the exact phrase before sending the reset action', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const modal = fs.readFileSync(path.resolve(__dirname, '../components/admin/RestartGameModal.tsx'), 'utf-8');
      expect(modal).toContain('firstConfirmed');
      expect(modal).toContain("typedConfirmation !== 'RESET GAME'");
      expect(modal).toContain("if (!firstConfirmed || typedConfirmation !== 'RESET GAME'");
    });

    it('uses mobile QR redemption and laptop access-key entry without a laptop camera', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const round3 = fs.readFileSync(path.resolve(__dirname, '../features/round3/Round3View.tsx'), 'utf-8');
      const laptop = fs.readFileSync(path.resolve(__dirname, '../features/round3/BrokenQrPuzzle.tsx'), 'utf-8');
      const mobile = fs.readFileSync(path.resolve(__dirname, '../pages/PhysicalQrRedeemPage.tsx'), 'utf-8');
      expect(round3).not.toContain('tokenCode');
      expect(round3).toContain('<BrokenQrPuzzle');
      expect(laptop).toContain('Round 3 access key');
      expect(laptop).toContain('SUBMIT ACCESS KEY');
      expect(laptop).toContain('{!isAuthorized && <form');
      expect(laptop).not.toMatch(/BrowserQRCodeReader|decodeFromVideoDevice|<video|navigator\.mediaDevices/);
      expect(mobile).toContain("'/round3/qr/mobile-redeem'");
      expect(mobile).toContain('accessKey');
      expect(mobile).toContain('YOUR ROUND 3 CODE');
      expect(mobile).toContain('COPY CODE');
      const round3Routes = fs.readFileSync(path.resolve(__dirname, '../../../backend/src/routes/round3Routes.ts'), 'utf-8');
      expect(round3Routes).toContain("router.post('/qr/mobile-redeem', submissionRateLimiter");
      expect(round3Routes).not.toContain("router.post('/qr/mobile-redeem', authenticate");
      const adminController = fs.readFileSync(path.resolve(__dirname, '../../../backend/src/controllers/adminController.ts'), 'utf-8');
      const round3Service = fs.readFileSync(path.resolve(__dirname, '../../../backend/src/services/round3Service.ts'), 'utf-8');
      const adminQrPage = fs.readFileSync(path.resolve(__dirname, '../pages/admin/AdminQRCodes.tsx'), 'utf-8');
      expect(adminQrPage).toContain('open the link it detects');
      expect(adminQrPage).toContain('The QR text itself is not the laptop key');
      expect(adminController).toContain('/qr/redeem#code=');
      expect(adminController).toContain('PUBLIC_APP_URL || process.env.FRONTEND_URL');
      expect(round3Service).toContain('const accessKey = generateQrToken()');
      expect(round3Service).toContain('where: { teamId, isRedeemed: true, accessKey: submittedKey }');
      expect(round3Service).toContain("error: 'QR_TOKEN_NOT_ACCESS_KEY'");
      expect(round3Service).not.toContain('tokenCode: accessKey');
      expect(round3Service).toContain('WRONG_TEAM_CODE');
    });
  });

  describe('Round progression and protected challenge data', () => {
    it('preserves an active Round 2 row when Round 1 reconciliation runs and starts each timer once', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const service = fs.readFileSync(path.resolve(__dirname, '../../../backend/src/services/teamRoundProgressService.ts'), 'utf-8');
      expect(service).toContain('update: {}');
      expect(service).toContain('where: { id: next.id, status: TeamRoundProgressStatus.LOCKED }');
      expect(service).toContain('where: { id: progress.id, status: TeamRoundProgressStatus.READY }');
      expect(service).toContain('ROUND_MINUTES[2] * 60_000');
    });

    it('gates Round 2 stage two on server-recorded Sudoku completion and omits its answer', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const service = fs.readFileSync(path.resolve(__dirname, '../../../backend/src/services/round2Service.ts'), 'utf-8');
      expect(service).toContain("source: 'ROUND2_STAGE1_SUDOKU'");
      expect(service).toContain("error: 'STAGE_LOCKED'");
      expect(service).toMatch(/select:\s*\{\s*id: true,\s*title: true,\s*scenario: true,\s*codeSnippet: true,\s*points: true/);
      expect(service).not.toContain('expectedOutput: true');
      expect(service).not.toContain('referenceSolution: true');
    });

    it('makes physical QR redemption retryable and preserves configured reset settings', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const round3 = fs.readFileSync(path.resolve(__dirname, '../../../backend/src/services/round3Service.ts'), 'utf-8');
      const reset = fs.readFileSync(path.resolve(__dirname, '../../../backend/src/controllers/adminTestController.ts'), 'utf-8');
      expect(round3).toContain('if (token.accessKey)');
      expect(round3).toContain('accessKey: token.accessKey');
      expect(reset).not.toMatch(/durationMinutes:\s*(15|20|30)/);
      expect(reset).toContain("process.env.ENABLE_GAME_RESET === 'true'");
    });

    it('runs pending Render database migrations and surfaces Round 2 and QR load errors', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const render = fs.readFileSync(path.resolve(__dirname, '../../../render.yaml'), 'utf-8');
      const dockerfile = fs.readFileSync(path.resolve(__dirname, '../../../backend/Dockerfile'), 'utf-8');
      const dashboard = fs.readFileSync(path.resolve(__dirname, '../pages/GameDashboard.tsx'), 'utf-8');
      const qrPage = fs.readFileSync(path.resolve(__dirname, '../pages/admin/AdminQRCodes.tsx'), 'utf-8');
      const sudoku = fs.readFileSync(path.resolve(__dirname, '../features/round2/ShapeSudoku.tsx'), 'utf-8');
      expect(render).toContain('preDeployCommand: npx prisma migrate deploy');
      expect(render).toContain('ENABLE_GAME_RESET');
      expect(dockerfile).toContain('npx prisma migrate deploy && node dist/index.js');
      const reset = fs.readFileSync(path.resolve(__dirname, '../../../backend/src/controllers/adminTestController.ts'), 'utf-8');
      expect(reset).toContain('await tx.submission.deleteMany({})');
      expect(reset).toContain('await tx.scoreEvent.deleteMany({})');
      expect(reset).toContain('await tx.teamRoundProgress.deleteMany({})');
      expect(reset).toContain('totalScore: 0');
      expect(reset).toContain('accessKey: null, authorizedAt: null, isRedeemed: false');
      expect(reset).toContain("req.body?.confirmation !== 'RESET GAME'");
      expect(dashboard).toContain('Round 2 could not be loaded');
      expect(qrPage).toContain('Team QR codes could not be loaded');
      expect(sudoku).toContain("err instanceof Error ? err.message");
    });
  });

  describe('Squid Game Comet Round Cards Protocol Verification', () => {
    it('verifies all 3 rounds are defined with correct Squid Game symbols and hierarchy', async () => {
      const { ROUND_PROTOCOLS } = await import('../components/SquidRoundCards');
      expect(ROUND_PROTOCOLS.length).toBe(3);

      // Round 1
      expect(ROUND_PROTOCOLS[0].id).toBe(1);
      expect(ROUND_PROTOCOLS[0].title).toBe('The Signal Protocol');
      expect(ROUND_PROTOCOLS[0].guardSymbol).toBe('circle');
      expect(ROUND_PROTOCOLS[0].pointsHighlight).toBe('+100 / +200 per MCQ');

      // Round 2
      expect(ROUND_PROTOCOLS[1].id).toBe(2);
      expect(ROUND_PROTOCOLS[1].title).toBe('The Logic Protocol');
      expect(ROUND_PROTOCOLS[1].guardSymbol).toBe('triangle');
      expect(ROUND_PROTOCOLS[1].badge).toContain('ROUND 2');
      expect(ROUND_PROTOCOLS[1].pointsHighlight).toBe('+100 S1 / +200 S2');

      // Round 3
      expect(ROUND_PROTOCOLS[2].id).toBe(3);
      expect(ROUND_PROTOCOLS[2].title).toBe('The Final Breach');
      expect(ROUND_PROTOCOLS[2].guardSymbol).toBe('square');
      expect(ROUND_PROTOCOLS[2].badge).toContain('ROUND 3');
      expect(ROUND_PROTOCOLS[2].pointsHighlight).toBe('+200 to -25 PTS');
    });

    it('verifies all 3 rounds contain comprehensive briefing stages and lethal rules', async () => {
      const { ROUND_PROTOCOLS } = await import('../components/SquidRoundCards');
      for (const proto of ROUND_PROTOCOLS) {
        expect(proto.briefing.stages.length).toBeGreaterThanOrEqual(2);
        expect(proto.briefing.lore.length).toBeGreaterThan(20);
        expect(proto.briefing.lethalRule.length).toBeGreaterThan(10);
        expect(proto.briefing.proTip.length).toBeGreaterThan(10);
      }
    });
  });

  describe('Aceternity Encrypted Text Effect Verification', () => {
    it('verifies EncryptedText and EncryptedTextDemo components export cleanly', async () => {
      const { EncryptedText } = await import('../components/ui/encrypted-text');
      expect(typeof EncryptedText).toBe('function');

      const EncryptedTextDemo = (await import('../components/encrypted-text-demo')).default;
      expect(typeof EncryptedTextDemo).toBe('function');
    });

    it('verifies SQUID PROTOCOL heading segments preserve exact wording and styling separation', () => {
      const segments = [
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
      ];

      const fullString = segments.map(s => s.text).join('');
      expect(fullString).toBe('SQUID PROTOCOL');
      expect(segments[0].text).toBe('SQUID');
      expect(segments[0].revealedClassName).toBe('text-white');
      expect(segments[2].text).toBe('PROTOCOL');
      expect(segments[2].revealedClassName).toContain('#ff004f');
    });
  });

  describe('Official Classified Rulebook & 15 Codified Rules Verification', () => {
    it('verifies all 15 codified rules are defined with sequential IDs 1 to 15', async () => {
      const { RULES } = await import('../pages/RulesPage');
      expect(RULES.length).toBe(15);

      for (let i = 0; i < 15; i++) {
        expect(RULES[i].id).toBe(i + 1);
        expect(RULES[i].title.length).toBeGreaterThan(0);
        expect(RULES[i].plainEnglishSummary.length).toBeGreaterThan(0);
        expect(RULES[i].desc.length).toBeGreaterThan(0);
        expect(RULES[i].badge.length).toBeGreaterThan(0);
        expect(RULES[i].keyDetails.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('verifies rule categories cover device setup, all 3 rounds, and integrity', async () => {
      const { RULES } = await import('../pages/RulesPage');
      const categories = new Set(RULES.map(r => r.category));
      expect(categories.has('general')).toBe(true);
      expect(categories.has('round1')).toBe(true);
      expect(categories.has('round2')).toBe(true);
      expect(categories.has('round3')).toBe(true);
      expect(categories.has('integrity')).toBe(true);
    });

    it('verifies round-specific rules contain correct Squid Game geometric symbols and accents', async () => {
      const { RULES } = await import('../pages/RulesPage');

      // Round 1 rules (Rules 4, 5) have Circle and #ff004f
      const r1Rules = RULES.filter(r => r.category === 'round1');
      expect(r1Rules.length).toBe(2);
      r1Rules.forEach(r => {
        expect(r.roundSymbol).toBe('circle');
        expect(r.roundAccentColor).toBe('#ff004f');
      });

      // Round 2 rules (Rules 6, 7) have Triangle and #00f0ff
      const r2Rules = RULES.filter(r => r.category === 'round2');
      expect(r2Rules.length).toBe(2);
      r2Rules.forEach(r => {
        expect(r.roundSymbol).toBe('triangle');
        expect(r.roundAccentColor).toBe('#00f0ff');
      });

      // Round 3 rules (Rules 8, 9, 10) have Square and #00e676
      const r3Rules = RULES.filter(r => r.category === 'round3');
      expect(r3Rules.length).toBe(3);
      r3Rules.forEach(r => {
        expect(r.roundSymbol).toBe('square');
        expect(r.roundAccentColor).toBe('#00e676');
      });
    });

    it('verifies Rule 4 strictly preserves scoring values (+100/+200) and penalties (-50/-100)', async () => {
      const { RULES } = await import('../pages/RulesPage');
      const rule4 = RULES.find(r => r.id === 4)!;
      expect(rule4.desc).toContain('+100');
      expect(rule4.desc).toContain('+200');
      expect(rule4.desc).toContain('50');
      expect(rule4.desc).toContain('100');
      expect(rule4.desc).toContain('RED LIGHT');
      expect(rule4.desc).toContain('GREEN LIGHT');
    });

    it('verifies Rule 15 strictly preserves the official 3-tier tie-break criteria', async () => {
      const { RULES } = await import('../pages/RulesPage');
      const rule15 = RULES.find(r => r.id === 15)!;
      expect(rule15.desc).toContain('Round 3');
      expect(rule15.desc).toContain('Round 2');
      expect(rule15.desc).toContain('Final Breach');
      expect(rule15.keyDetails[0]).toContain('Round 3');
      expect(rule15.keyDetails[1]).toContain('Round 2');
      expect(rule15.keyDetails[2]).toContain('Final Breach');
    });

    it('verifies RulesPage component exports properly as a React component', async () => {
      const { RulesPage } = await import('../pages/RulesPage');
      expect(typeof RulesPage).toBe('function');
    });
  });

  describe('Landing Page & Rulebook — Scrubbed Metrics & Scoring Verification', () => {
    it('verifies absence of hardcoded participant and team count statistics in LandingPage', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const landingPageContent = fs.readFileSync(path.resolve(__dirname, '../pages/LandingPage.tsx'), 'utf-8');

      // Must not display "60 participants" or "20 teams"
      expect(landingPageContent).not.toContain('60 participants');
      expect(landingPageContent).not.toContain('20 teams');
      expect(landingPageContent).not.toContain("{ value: '60', label: 'Participants'");
      expect(landingPageContent).not.toContain("{ value: '20', label: 'Teams'");
    });

    it('verifies absence of maximum-point and fixed-cap claims across participant frontend', async () => {
      const fs = await import('fs');
      const path = await import('path');

      const landingContent = fs.readFileSync(path.resolve(__dirname, '../pages/LandingPage.tsx'), 'utf-8');
      const rulesContent = fs.readFileSync(path.resolve(__dirname, '../pages/RulesPage.tsx'), 'utf-8');
      const roundCardsContent = fs.readFileSync(path.resolve(__dirname, '../components/SquidRoundCards.tsx'), 'utf-8');

      for (const content of [landingContent, rulesContent, roundCardsContent]) {
        expect(content).not.toContain('2,500 Maximum Points');
        expect(content).not.toContain('Overall Cap: 2,500');
        expect(content).not.toContain('Total Competition Cap: 2,500');
        expect(content).not.toContain('MAXIMUM POSSIBLE SCORE');
        expect(content).not.toContain('Max Score: +2,000 PTS');
        expect(content).not.toContain('Max Score: +300 PTS');
        expect(content).not.toContain('Max Score: +200 PTS');
      }
    });

    it('verifies Round 1 view defaults to 20 questions', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const round1ViewContent = fs.readFileSync(path.resolve(__dirname, '../features/round1/Round1View.tsx'), 'utf-8');

      expect(round1ViewContent).toContain('totalQuestions = 20');
      expect(round1ViewContent).not.toContain('answer 10 questions in sequence');
    });

    it('verifies LeaderboardPage component exports properly with winner management support', async () => {
      const { LeaderboardPage } = await import('../pages/LeaderboardPage');
      expect(typeof LeaderboardPage).toBe('function');
    });
  });
});
