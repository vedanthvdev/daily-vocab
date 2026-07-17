import type { Level, WordEntry } from './types';

export type YearDigit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type ShownYearByWordId = Record<string, YearDigit>;

export type HistoryEntry = {
  wordId: string;
  word: string;
  oneLiner: string;
  level: Level;
  yearDigit: YearDigit;
};

export function yearDigit(now: Date): YearDigit {
  return (now.getFullYear() % 10) as YearDigit;
}

export function skipYearDigits(now: Date): Set<YearDigit> {
  const current = yearDigit(now);
  const previous = ((current + 9) % 10) as YearDigit;
  return new Set([current, previous]);
}

export function stampShownWord(
  shown: ShownYearByWordId,
  wordId: string,
  now: Date,
): ShownYearByWordId {
  return { ...shown, [wordId]: yearDigit(now) };
}

export function isEligibleWordId(
  wordId: string,
  shown: ShownYearByWordId,
  now: Date,
): boolean {
  const stamp = shown[wordId];
  if (stamp === undefined) return true;
  return !skipYearDigits(now).has(stamp);
}

export function filterEligibleWords(
  words: WordEntry[],
  shown: ShownYearByWordId,
  now: Date,
): WordEntry[] {
  return words.filter((entry) => isEligibleWordId(entry.id, shown, now));
}

export function historyForCurrentYear(
  shown: ShownYearByWordId,
  catalogs: Record<Level, WordEntry[]>,
  now: Date,
): HistoryEntry[] {
  const current = yearDigit(now);
  const byId = new Map<string, { level: Level; entry: WordEntry }>();
  for (const level of Object.keys(catalogs) as Level[]) {
    for (const entry of catalogs[level]) {
      byId.set(entry.id, { level, entry });
    }
  }

  const rows: HistoryEntry[] = [];
  for (const [wordId, digit] of Object.entries(shown)) {
    if (digit !== current) continue;
    const hit = byId.get(wordId);
    if (!hit) continue;
    rows.push({
      wordId,
      word: hit.entry.word,
      oneLiner: hit.entry.oneLiner,
      level: hit.level,
      yearDigit: digit,
    });
  }

  rows.sort((a, b) => a.word.localeCompare(b.word));
  return rows;
}
