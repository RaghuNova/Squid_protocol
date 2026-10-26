import { describe, expect, it } from 'vitest';
import { compareLeaderboardTeams } from '../services/scoringService.js';
import { generateQrToken, isStrongQrToken } from '../utils/qrToken.js';

const row = (teamCode: string, overrides: Partial<Parameters<typeof compareLeaderboardTeams>[0]> = {}) => ({
  teamCode,
  totalScore: 100,
  r3Position: null,
  finalAnswerSubmittedAt: null,
  finalBreachCompletedAt: null,
  ...overrides
});

describe('Round 3 QR token security', () => {
  it('generates unique high-entropy tokens unrelated to team identifiers', () => {
    const values = Array.from({ length: 100 }, generateQrToken);
    expect(new Set(values).size).toBe(values.length);
    expect(values.every(isStrongQrToken)).toBe(true);
    expect(values.every(value => value.length === 43)).toBe(true);
    expect(values.some(value => value.includes('TEAM01'))).toBe(false);
  });

  it('recognizes migrated 256-bit hex tokens and rejects predictable legacy codes', () => {
    expect(isStrongQrToken('a'.repeat(64))).toBe(true);
    expect(isStrongQrToken('TEAM01#2026')).toBe(false);
  });
});

describe('authoritative team winner tie-break order', () => {
  it('uses better Round 3 position before answer timestamps', () => {
    const earlier = new Date('2026-01-01T10:00:00Z');
    const completed = new Date('2026-01-01T10:01:00Z');
    expect(compareLeaderboardTeams(row('TEAM02', { r3Position: 2, finalAnswerSubmittedAt: earlier, finalBreachCompletedAt: completed }), row('TEAM01', { r3Position: 1, finalBreachCompletedAt: completed }))).toBeGreaterThan(0);
  });

  it('uses earlier successful final answer when both teams have no Round 3 position', () => {
    const early = new Date('2026-01-01T10:00:00Z');
    const late = new Date('2026-01-01T10:01:00Z');
    expect(compareLeaderboardTeams(row('TEAM02', { finalAnswerSubmittedAt: late }), row('TEAM01', { finalAnswerSubmittedAt: early }))).toBeGreaterThan(0);
  });

  it('skips missing timestamps and falls back deterministically to team code', () => {
    const completed = new Date('2026-01-01T10:00:00Z');
    expect(compareLeaderboardTeams(row('TEAM02', { finalBreachCompletedAt: completed }), row('TEAM01'))).toBeGreaterThan(0);
    expect(compareLeaderboardTeams(row('TEAM02'), row('TEAM01'))).toBeGreaterThan(0);
  });

  it('sorts higher total score before all tie-break fields', () => {
    expect(compareLeaderboardTeams(row('TEAM02', { totalScore: 99, r3Position: 1 }), row('TEAM01', { totalScore: 100, r3Position: 20 }))).toBeGreaterThan(0);
  });
});
