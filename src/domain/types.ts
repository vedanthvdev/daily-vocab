import type { Level, WordEntry } from '../../content/tools/catalogSchema';

export type { Level, WordEntry };

export type LockedWord = {
  wordId: string;
  word: string;
  oneLiner: string;
};

export type DailyState = {
  localDate: string;
  level: Level;
  wordId: string;
  word: string;
  oneLiner: string;
  byLevel: Partial<Record<Level, LockedWord>>;
};

export type CatalogByLevel = Record<Level, WordEntry[]>;

export type LevelPacks = {
  v1: WordEntry[];
  v2: WordEntry[];
};
