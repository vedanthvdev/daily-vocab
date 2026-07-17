import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyState, Level, LockedWord } from '../domain/types';

const LEVEL_KEY = 'dailyvocab.level';
const STATE_KEY = 'dailyvocab.dailyState';

function isLevel(value: unknown): value is Level {
  return value === 'beginner' || value === 'intermediate' || value === 'hard';
}

function isLockedWord(value: unknown): value is LockedWord {
  if (!value || typeof value !== 'object') return false;
  const locked = value as Record<string, unknown>;
  return (
    typeof locked.wordId === 'string' &&
    typeof locked.word === 'string' &&
    typeof locked.oneLiner === 'string'
  );
}

function normalizeDailyState(value: unknown): DailyState | null {
  if (!value || typeof value !== 'object') return null;
  const state = value as Record<string, unknown>;
  if (
    !isLevel(state.level) ||
    typeof state.localDate !== 'string' ||
    typeof state.wordId !== 'string' ||
    typeof state.word !== 'string' ||
    typeof state.oneLiner !== 'string'
  ) {
    return null;
  }

  const byLevel: Partial<Record<Level, LockedWord>> = {};
  if (state.byLevel && typeof state.byLevel === 'object') {
    for (const [key, locked] of Object.entries(state.byLevel as Record<string, unknown>)) {
      if (isLevel(key) && isLockedWord(locked)) {
        byLevel[key] = locked;
      }
    }
  }

  const active: LockedWord = {
    wordId: state.wordId,
    word: state.word,
    oneLiner: state.oneLiner,
  };
  if (!byLevel[state.level]) {
    byLevel[state.level] = active;
  }

  return {
    localDate: state.localDate,
    level: state.level,
    wordId: state.wordId,
    word: state.word,
    oneLiner: state.oneLiner,
    byLevel,
  };
}

export async function loadLevel(): Promise<Level | null> {
  const value = await AsyncStorage.getItem(LEVEL_KEY);
  return isLevel(value) ? value : null;
}

export async function saveLevel(level: Level): Promise<void> {
  await AsyncStorage.setItem(LEVEL_KEY, level);
}

export async function loadDailyState(): Promise<DailyState | null> {
  const raw = await AsyncStorage.getItem(STATE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return normalizeDailyState(parsed);
  } catch {
    return null;
  }
}

export async function saveDailyState(state: DailyState): Promise<void> {
  await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
}
