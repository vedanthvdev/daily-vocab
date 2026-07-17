import { describe, expect, it } from 'vitest';
import {
  filterEligibleWords,
  historyForCurrentYear,
  skipYearDigits,
  stampShownWord,
  yearDigit,
} from './shownYear';
import type { Level, WordEntry } from './types';

const words: WordEntry[] = [
  { id: 'b1', word: 'alpha', oneLiner: 'First.' },
  { id: 'b2', word: 'bravo', oneLiner: 'Second.' },
  { id: 'b3', word: 'charlie', oneLiner: 'Third.' },
];

describe('shownYear', () => {
  it('maps 2026 to digit 6', () => {
    expect(yearDigit(new Date('2026-07-17T12:00:00.000Z'))).toBe(6);
  });

  it('skips current and previous year digits', () => {
    const skip = skipYearDigits(new Date('2026-07-17T12:00:00.000Z'));
    expect([...skip].sort()).toEqual([5, 6]);
  });

  it('filters words stamped in the skip window', () => {
    const now = new Date('2026-07-17T12:00:00.000Z');
    const shown = { b1: 6 as const, b2: 5 as const, b3: 4 as const };
    const eligible = filterEligibleWords(words, shown, now).map((w) => w.id);
    expect(eligible).toEqual(['b3']);
  });

  it('stamps the current year digit onto a word id', () => {
    const now = new Date('2026-07-17T12:00:00.000Z');
    expect(stampShownWord({}, 'b1', now)).toEqual({ b1: 6 });
  });

  it('lists current-year history with catalog copy', () => {
    const catalogs = {
      beginner: words,
      intermediate: [] as WordEntry[],
      hard: [] as WordEntry[],
    } as Record<Level, WordEntry[]>;
    const rows = historyForCurrentYear(
      { b2: 6, b1: 5, b3: 6 },
      catalogs,
      new Date('2026-07-17T12:00:00.000Z'),
    );
    expect(rows.map((r) => r.word)).toEqual(['bravo', 'charlie']);
    expect(rows[0].level).toBe('beginner');
  });
});
