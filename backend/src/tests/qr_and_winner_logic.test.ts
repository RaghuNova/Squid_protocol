import { describe, expect, it } from 'vitest';
import { compareLeaderboardTeams } from '../services/scoringService.js';
import { generateQrToken, isStrongQrToken } from '../utils/qrToken.js';
import { finalKeyMatches } from '../services/round3Service.js';
import { canStartTeamRound2 } from '../services/teamRoundProgressService.js';
import { RoundStatus, TeamRoundProgressStatus } from '@prisma/client';

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

describe('configured Round 3 answer validation', () => {
  it('accepts the configured full key or exact numeric checksum with surrounding whitespace', () => {
    expect(finalKeyMatches('PROTOCOL_BREACH_1040', ' protocol_breach_1040 ')).toBe(true);
    expect(finalKeyMatches('PROTOCOL_BREACH_1040', ' 1040 ')).toBe(true);
  });

  it('does not accept arbitrary text that merely ends in the right digits', () => {
    expect(finalKeyMatches('PROTOCOL_BREACH_1040', 'WRONG1040')).toBe(false);
    expect(finalKeyMatches('EXPECTED-KEY', '1040')).toBe(false);
  });
});

describe('Round 1 to Round 2 team progression', () => {
  it('starts Round 2 for an eligible team without a later-round admin gate', () => {
    expect(canStartTeamRound2(true, TeamRoundProgressStatus.READY, RoundStatus.ACTIVE)).toBe(true);
    expect(canStartTeamRound2(false, TeamRoundProgressStatus.READY, RoundStatus.ACTIVE)).toBe(false);
    expect(canStartTeamRound2(true, TeamRoundProgressStatus.READY, RoundStatus.UPCOMING)).toBe(true);
    expect(canStartTeamRound2(true, TeamRoundProgressStatus.READY, RoundStatus.PAUSED)).toBe(false);
    expect(canStartTeamRound2(true, TeamRoundProgressStatus.IN_PROGRESS, RoundStatus.ACTIVE)).toBe(false);
  });
});
