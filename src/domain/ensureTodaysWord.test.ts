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
  it('returns the same word for the same day and level without re-rolling', () => {
    const state: DailyState = {
      level: 'beginner',
      localDate: '2026-07-16',
      wordId: 'b2',
      word: 'quick',
      oneLiner: 'Moving fast.',
      byLevel: {
        beginner: { wordId: 'b2', word: 'quick', oneLiner: 'Moving fast.' },
      },
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
    expect(next.wordId).toBe('b2');
    expect(randomInt).not.toHaveBeenCalled();
  });

  it('switches to another level word immediately without clearing the first', () => {
    const state: DailyState = {
      level: 'beginner',
      localDate: '2026-07-16',
      wordId: 'b1',
      word: 'happy',
      oneLiner: 'Feeling joy.',
      byLevel: {
        beginner: { wordId: 'b1', word: 'happy', oneLiner: 'Feeling joy.' },
      },
    };
    const next = ensureTodaysWord({
      level: 'hard',
      catalog,
      state,
      now: new Date('2026-07-16T12:00:00.000Z'),
      randomInt: () => 1,
      timeZone: 'UTC',
    });
    expect(next.level).toBe('hard');
    expect(next.wordId).toBe('h2');
    expect(next.byLevel.beginner?.wordId).toBe('b1');
    expect(next.byLevel.hard?.wordId).toBe('h2');
  });

  it('restores the earlier level word when switching back the same day', () => {
    const state: DailyState = {
      level: 'hard',
      localDate: '2026-07-16',
      wordId: 'h2',
      word: 'laconic',
      oneLiner: 'Using few words.',
      byLevel: {
        beginner: { wordId: 'b1', word: 'happy', oneLiner: 'Feeling joy.' },
        hard: { wordId: 'h2', word: 'laconic', oneLiner: 'Using few words.' },
      },
    };
    const randomInt = vi.fn(() => 2);
    const next = ensureTodaysWord({
      level: 'beginner',
      catalog,
      state,
      now: new Date('2026-07-16T12:00:00.000Z'),
      randomInt,
      timeZone: 'UTC',
    });
    expect(next.wordId).toBe('b1');
    expect(next.word).toBe('happy');
    expect(randomInt).not.toHaveBeenCalled();
  });

  it('picks a new word when the local date changes', () => {
    const state: DailyState = {
      level: 'beginner',
      localDate: '2026-07-15',
      wordId: 'b1',
      word: 'happy',
      oneLiner: 'Feeling joy.',
      byLevel: {
        beginner: { wordId: 'b1', word: 'happy', oneLiner: 'Feeling joy.' },
      },
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
    expect(next.byLevel.beginner?.wordId).toBe('b3');
  });

  it('rolls from the preferred level when the local date changes', () => {
    const state: DailyState = {
      level: 'beginner',
      localDate: '2026-07-15',
      wordId: 'b1',
      word: 'happy',
      oneLiner: 'Feeling joy.',
      byLevel: {
        beginner: { wordId: 'b1', word: 'happy', oneLiner: 'Feeling joy.' },
      },
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

  it('re-rolls when today is locked to a removed placeholder word', () => {
    const state: DailyState = {
      level: 'intermediate',
      localDate: '2026-07-16',
      wordId: 'i0038',
      word: 'intermediate-word-38',
      oneLiner: 'Practice intermediate word number 38.',
      byLevel: {
        intermediate: {
          wordId: 'i0038',
          word: 'intermediate-word-38',
          oneLiner: 'Practice intermediate word number 38.',
        },
      },
    };
    const next = ensureTodaysWord({
      level: 'intermediate',
      catalog,
      state,
      now: new Date('2026-07-16T12:00:00.000Z'),
      randomInt: () => 1,
      timeZone: 'UTC',
    });
    expect(next.word).toBe('persist');
    expect(next.wordId).toBe('i2');
  });

  it('avoids repeating the previous wordId when possible', () => {
    const state: DailyState = {
      level: 'beginner',
      localDate: '2026-07-15',
      wordId: 'b1',
      word: 'happy',
      oneLiner: 'Feeling joy.',
      byLevel: {
        beginner: { wordId: 'b1', word: 'happy', oneLiner: 'Feeling joy.' },
      },
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
