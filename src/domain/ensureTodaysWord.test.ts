import { describe, expect, it, vi } from 'vitest';
import { ensureTodaysWord } from './ensureTodaysWord';
import type { CatalogByLevel, DailyState } from './types';

const catalog: CatalogByLevel = {
  beginner: [
    { id: 'b1', word: 'happy', oneLiner: 'Feeling joy.' },
    { id: 'b2', word: 'quick', oneLiner: 'Moving fast.' },
    { id: 'b3', word: 'calm', oneLiner: 'Peaceful.' },
  ],
  intermediate: [
    { id: 'i1', word: 'compel', oneLiner: 'To force.' },
    { id: 'i2', word: 'persist', oneLiner: 'To continue.' },
  ],
  hard: [
    { id: 'h1', word: 'ephemeral', oneLiner: 'Short-lived.' },
    { id: 'h2', word: 'laconic', oneLiner: 'Using few words.' },
  ],
};

describe('ensureTodaysWord', () => {
  it('returns the same wordId for the same day and level without re-rolling', () => {
    const state: DailyState = {
      level: 'beginner',
      localDate: '2026-07-16',
      wordId: 'b2',
      word: 'quick',
      oneLiner: 'Moving fast.',
    };
    const randomInt = vi.fn(() => 0);
    const next = ensureTodaysWord({
      level: 'beginner',
      catalog,
      state,
      now: new Date('2026-07-16T15:00:00.000Z'),
      randomInt,
      timeZone: 'UTC',
    });
    expect(next).toEqual(state);
    expect(randomInt).not.toHaveBeenCalled();
  });

  it('picks a new word when the local date changes', () => {
    const state: DailyState = {
      level: 'beginner',
      localDate: '2026-07-15',
      wordId: 'b1',
      word: 'happy',
      oneLiner: 'Feeling joy.',
    };
    const next = ensureTodaysWord({
      level: 'beginner',
      catalog,
      state,
      now: new Date('2026-07-16T12:00:00.000Z'),
      randomInt: () => 2,
      timeZone: 'UTC',
    });
    expect(next.localDate).toBe('2026-07-16');
    expect(next.wordId).toBe('b3');
  });

  it('keeps the same word when the level changes the same day', () => {
    const state: DailyState = {
      level: 'beginner',
      localDate: '2026-07-16',
      wordId: 'b1',
      word: 'happy',
      oneLiner: 'Feeling joy.',
    };
    const randomInt = vi.fn(() => 1);
    const next = ensureTodaysWord({
      level: 'hard',
      catalog,
      state,
      now: new Date('2026-07-16T12:00:00.000Z'),
      randomInt,
      timeZone: 'UTC',
    });
    expect(next).toEqual(state);
    expect(randomInt).not.toHaveBeenCalled();
  });

  it('rolls from the preferred level when the local date changes', () => {
    const state: DailyState = {
      level: 'beginner',
      localDate: '2026-07-15',
      wordId: 'b1',
      word: 'happy',
      oneLiner: 'Feeling joy.',
    };
    const next = ensureTodaysWord({
      level: 'hard',
      catalog,
      state,
      now: new Date('2026-07-16T12:00:00.000Z'),
      randomInt: () => 1,
      timeZone: 'UTC',
    });
    expect(next.localDate).toBe('2026-07-16');
    expect(next.level).toBe('hard');
    expect(next.wordId).toBe('h2');
  });

  it('returns locked state even when the preferred catalog is empty', () => {
    const state: DailyState = {
      level: 'beginner',
      localDate: '2026-07-16',
      wordId: 'b1',
      word: 'happy',
      oneLiner: 'Feeling joy.',
    };
    const emptyHard: CatalogByLevel = {
      ...catalog,
      hard: [],
    };
    const next = ensureTodaysWord({
      level: 'hard',
      catalog: emptyHard,
      state,
      now: new Date('2026-07-16T12:00:00.000Z'),
      randomInt: () => 0,
      timeZone: 'UTC',
    });
    expect(next).toEqual(state);
  });

  it('avoids repeating the previous wordId when possible', () => {
    const state: DailyState = {
      level: 'beginner',
      localDate: '2026-07-15',
      wordId: 'b1',
      word: 'happy',
      oneLiner: 'Feeling joy.',
    };
    const sequence = [0, 0, 1];
    let i = 0;
    const next = ensureTodaysWord({
      level: 'beginner',
      catalog,
      state,
      now: new Date('2026-07-16T12:00:00.000Z'),
      randomInt: () => sequence[Math.min(i++, sequence.length - 1)],
      timeZone: 'UTC',
    });
    expect(next.wordId).not.toBe('b1');
  });
});
