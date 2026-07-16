import { describe, expect, it } from 'vitest';
import {
  validateCatalog,
  validateNoCrossLevelOverlaps,
  type Catalog,
} from './catalogSchema';

const sample = (overrides: Partial<Catalog> = {}): Catalog => ({
  version: 1,
  level: 'beginner',
  words: [
    { id: 'b1', word: 'happy', oneLiner: 'Feeling joy or pleasure.' },
    { id: 'b2', word: 'quick', oneLiner: 'Moving with speed.' },
  ],
  ...overrides,
});

describe('validateCatalog', () => {
  it('accepts a valid sample catalog', () => {
    expect(validateCatalog(sample(), 'beginner')).toEqual([]);
  });

  it('rejects duplicate ids', () => {
    const issues = validateCatalog(
      sample({
        words: [
          { id: 'b1', word: 'happy', oneLiner: 'Feeling joy or pleasure.' },
          { id: 'b1', word: 'quick', oneLiner: 'Moving with speed.' },
        ],
      }),
      'beginner',
    );
    expect(issues.some((i) => i.message.includes('duplicate'))).toBe(true);
  });

  it('rejects duplicate words', () => {
    const issues = validateCatalog(
      sample({
        words: [
          { id: 'b1', word: 'happy', oneLiner: 'Feeling joy or pleasure.' },
          { id: 'b2', word: 'happy', oneLiner: 'Feeling glad.' },
        ],
      }),
      'beginner',
    );
    expect(issues.some((i) => i.path.includes('word'))).toBe(true);
  });

  it('rejects oneLiner over 80 chars', () => {
    const long = 'x'.repeat(81);
    const issues = validateCatalog(
      sample({
        words: [{ id: 'b1', word: 'long', oneLiner: long }],
      }),
      'beginner',
    );
    expect(issues.length).toBeGreaterThan(0);
  });

  it('rejects wrong level field', () => {
    const issues = validateCatalog(sample({ level: 'hard' }), 'beginner');
    expect(issues.some((i) => i.path === 'level')).toBe(true);
  });

  it('strict-count fails when length is not 1000', () => {
    const issues = validateCatalog(sample(), 'beginner', { strictCount: true });
    expect(issues.some((i) => i.message.includes('1000'))).toBe(true);
  });

  it('quality mode rejects truncated oneLiners', () => {
    const issues = validateCatalog(
      sample({
        words: [
          {
            id: 'b1',
            word: 'present',
            oneLiner: 'He bestowed public buildings in return for votes..',
          },
        ],
      }),
      'beginner',
      { quality: true },
    );
    expect(issues.some((i) => i.message.includes('broken'))).toBe(true);
  });

  it('quality mode rejects ESL basics in intermediate', () => {
    const issues = validateCatalog(
      {
        version: 1,
        level: 'intermediate',
        words: [{ id: 'i1', word: 'dog', oneLiner: 'Informal term for a man.' }],
      },
      'intermediate',
      { quality: true },
    );
    expect(issues.some((i) => i.message.includes('ESL-basic'))).toBe(true);
  });
});

describe('validateNoCrossLevelOverlaps', () => {
  it('flags the same lemma in two levels', () => {
    const issues = validateNoCrossLevelOverlaps({
      beginner: sample(),
      intermediate: {
        version: 1,
        level: 'intermediate',
        words: [{ id: 'i1', word: 'happy', oneLiner: 'Feeling joy or pleasure.' }],
      },
      hard: {
        version: 1,
        level: 'hard',
        words: [{ id: 'h1', word: 'ephemeral', oneLiner: 'Lasting a very short time.' }],
      },
    });
    expect(issues.some((i) => i.message.includes('happy'))).toBe(true);
  });
});
