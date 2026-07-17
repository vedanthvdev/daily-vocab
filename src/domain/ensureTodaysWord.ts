import type {
  CatalogByLevel,
  DailyState,
  Level,
  LevelPacks,
  LockedWord,
  WordEntry,
} from './types';
import { formatLocalDate } from './localDate';
import {
  filterEligibleWords,
  type ShownYearByWordId,
  stampShownWord,
} from './shownYear';

export type EnsureTodaysWordInput = {
  level: Level;
  catalog: CatalogByLevel;
  packs?: LevelPacks;
  shownYearByWordId?: ShownYearByWordId;
  state: DailyState | null;
  now: Date;
  randomInt: (maxExclusive: number) => number;
  timeZone?: string;
};

export type EnsureTodaysWordResult = {
  state: DailyState;
  shownYearByWordId: ShownYearByWordId;
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
    example: locked.example,
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

function selectPool(
  packs: LevelPacks | undefined,
  fallback: WordEntry[],
  shown: ShownYearByWordId,
  now: Date,
  previousId: string | undefined,
): WordEntry[] {
  const v1 = packs?.v1 ?? fallback;
  const v2 = packs?.v2 ?? [];
  const eligibleV1 = filterEligibleWords(v1, shown, now);
  if (eligibleV1.length > 0) return eligibleV1;
  const eligibleV2 = filterEligibleWords(v2, shown, now);
  if (eligibleV2.length > 0) return eligibleV2;
  const combined = [...v1, ...v2];
  if (combined.length === 0) return fallback;
  if (previousId && combined.length > 1) {
    const withoutPrevious = combined.filter((entry) => entry.id !== previousId);
    if (withoutPrevious.length > 0) return withoutPrevious;
  }
  return combined;
}

function hydrateLocked(
  locked: LockedWord,
  catalog: CatalogByLevel,
): LockedWord {
  if (locked.example?.trim()) return locked;
  const entry = findInCatalog(catalog, locked.wordId);
  if (entry?.example) {
    return { ...locked, example: entry.example };
  }
  return locked;
}

export function ensureTodaysWord(input: EnsureTodaysWordInput): EnsureTodaysWordResult {
  const {
    level,
    catalog,
    packs,
    shownYearByWordId = {},
    state,
    now,
    randomInt,
    timeZone,
  } = input;
  const today = formatLocalDate(now, timeZone);
  let shown = { ...shownYearByWordId };

  const byLevel: Partial<Record<Level, LockedWord>> =
    state && state.localDate === today ? { ...state.byLevel } : {};

  const existingRaw = byLevel[level];
  const existing = existingRaw
    ? hydrateLocked(existingRaw, catalog)
    : undefined;
  if (existing && isUsableLockedWord(existing, catalog) && existing.example?.trim()) {
    byLevel[level] = existing;
    shown = stampShownWord(shown, existing.wordId, now);
    return {
      state: flatten(today, level, existing, byLevel),
      shownYearByWordId: shown,
    };
  }

  const previousId =
    existing && !isPlaceholderWord(existing)
      ? existing.wordId
      : state && state.localDate !== today && state.level === level && !isPlaceholderWord(state)
        ? state.wordId
        : undefined;

  const pool = selectPool(packs, catalog[level] ?? [], shown, now, previousId);
  if (!pool.length) {
    throw new Error(`Catalog for level "${level}" is empty`);
  }

  const entry = pickEntry(pool, previousId, randomInt);
  const locked: LockedWord = {
    wordId: entry.id,
    word: entry.word,
    oneLiner: entry.oneLiner,
    example: entry.example,
  };
  byLevel[level] = locked;
  shown = stampShownWord(shown, locked.wordId, now);

  return {
    state: flatten(today, level, locked, byLevel),
    shownYearByWordId: shown,
  };
}
