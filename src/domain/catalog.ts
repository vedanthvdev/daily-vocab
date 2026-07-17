import beginner from '../../content/words/beginner.json';
import intermediate from '../../content/words/intermediate.json';
import hard from '../../content/words/hard.json';
import type { CatalogByLevel, Level, LevelPacks, WordEntry } from './types';

function packsFromFile(file: {
  words: WordEntry[];
  packs?: { v2?: WordEntry[] };
}): LevelPacks {
  return {
    v1: file.words as WordEntry[],
    v2: (file.packs?.v2 as WordEntry[] | undefined) ?? [],
  };
}

export const catalogPacks: Record<Level, LevelPacks> = {
  beginner: packsFromFile(beginner as { words: WordEntry[]; packs?: { v2?: WordEntry[] } }),
  intermediate: packsFromFile(
    intermediate as { words: WordEntry[]; packs?: { v2?: WordEntry[] } },
  ),
  hard: packsFromFile(hard as { words: WordEntry[]; packs?: { v2?: WordEntry[] } }),
};

export const catalogs: CatalogByLevel = {
  beginner: catalogPacks.beginner.v1,
  intermediate: catalogPacks.intermediate.v1,
  hard: catalogPacks.hard.v1,
};

export function wordsForLevel(level: Level): WordEntry[] {
  return catalogs[level];
}

export function packsForLevel(level: Level): LevelPacks {
  return catalogPacks[level];
}
