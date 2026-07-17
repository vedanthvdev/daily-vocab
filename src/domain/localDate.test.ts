import { describe, expect, it } from 'vitest';
import { formatLocalDate, msUntilNextLocalMidnight } from './localDate';

describe('formatLocalDate', () => {
  it('uses America/New_York calendar date near UTC midnight', () => {
    // 2026-07-16T04:00:00Z is still July 16 in New York (EDT, UTC-4)
    const date = new Date('2026-07-16T04:00:00.000Z');
    expect(formatLocalDate(date, 'America/New_York')).toBe('2026-07-16');
  });

  it('rolls back before midnight in America/New_York', () => {
    // 2026-07-16T03:00:00Z is July 15 evening in New York
    const date = new Date('2026-07-16T03:00:00.000Z');
    expect(formatLocalDate(date, 'America/New_York')).toBe('2026-07-15');
  });
});

describe('msUntilNextLocalMidnight', () => {
  it('returns a positive delay that lands on the next local day', () => {
    const now = new Date(2026, 6, 17, 14, 30, 0, 0);
    const delay = msUntilNextLocalMidnight(now);
    const landed = new Date(now.getTime() + delay);
    expect(delay).toBeGreaterThan(0);
    expect(landed.getHours()).toBe(0);
    expect(landed.getMinutes()).toBe(0);
    expect(formatLocalDate(landed)).toBe('2026-07-18');
  });
});
