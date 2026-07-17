import type { CatalogByLevel, DailyState, Level, LockedWord, WordEntry } from './types';
import { formatLocalDate } from './localDate';

export type EnsureTodaysWordInput = {
  level: Level;
  catalog: CatalogByLevel;
  state: DailyState | null;
  now: Date;
  randomInt: (maxExclusive: number) => number;
  timeZone?: string;
};

function isPlaceholderWord(locked: Pick<LockedWord, 'word' | 'oneLiner'>): boolean {
  return (
    /^(beginner|intermediate|hard)-word-\d+$/i.test(locked.word) ||
    /^Practice (beginner|intermediate|hard) word/i.test(locked.oneLiner)
  );
}

function findInCatalog(catalog: CatalogByLevel, wordId: string): WordEntry | null {
  for (const level of Object.keys(catalog) as Level[]) {
    const hit = catalog[level]?.find((entry) => entry.id === wordId);
    if (hit) return hit;
  }
  return null;
}

function isUsableLockedWord(locked: LockedWord, catalog: CatalogByLevel): boolean {
  if (isPlaceholderWord(locked)) return false;
  return findInCatalog(catalog, locked.wordId) !== null;
}

function flatten(
  localDate: string,
  level: Level,
  locked: LockedWord,
  byLevel: Partial<Record<Level, LockedWord>>,
): DailyState {
  return {
    localDate,
    level,
    wordId: locked.wordId,
    word: locked.word,
    oneLiner: locked.oneLiner,
    byLevel,
  };
}

function pickEntry(
  words: WordEntry[],
  previousId: string | undefined,
  randomInt: (maxExclusive: number) => number,
): WordEntry {
  let index = randomInt(words.length);
  if (words.length > 1 && previousId) {
    let guard = 0;
    while (words[index].id === previousId && guard < 8) {
      index = randomInt(words.length);
      guard += 1;
    }
    if (words[index].id === previousId) {
      index = (index + 1) % words.length;
    }
  }
  return words[index];
}

export function ensureTodaysWord(input: EnsureTodaysWordInput): DailyState {
  const { level, catalog, state, now, randomInt, timeZone } = input;
  const today = formatLocalDate(now, timeZone);

  const byLevel: Partial<Record<Level, LockedWord>> =
    state && state.localDate === today ? { ...state.byLevel } : {};

  const existing = byLevel[level];
  if (existing && isUsableLockedWord(existing, catalog)) {
    return flatten(today, level, existing, byLevel);
  }

  const words = catalog[level];
  if (!words?.length) {
    throw new Error(`Catalog for level "${level}" is empty`);
  }

  const previousId =
    existing && !isPlaceholderWord(existing)
      ? existing.wordId
      : state && state.localDate !== today && state.level === level && !isPlaceholderWord(state)
        ? state.wordId
        : undefined;

  const entry = pickEntry(words, previousId, randomInt);
  const locked: LockedWord = {
    wordId: entry.id,
    word: entry.word,
    oneLiner: entry.oneLiner,
  };
  byLevel[level] = locked;
  return flatten(today, level, locked, byLevel);
}
