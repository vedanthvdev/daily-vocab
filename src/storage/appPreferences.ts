import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyState, Level } from '../domain/types';

const LEVEL_KEY = 'dailyvocab.level';
const STATE_KEY = 'dailyvocab.dailyState';

function isLevel(value: unknown): value is Level {
  return value === 'beginner' || value === 'intermediate' || value === 'hard';
}

function isDailyState(value: unknown): value is DailyState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Record<string, unknown>;
  return (
    isLevel(state.level) &&
    typeof state.localDate === 'string' &&
    typeof state.wordId === 'string' &&
    typeof state.word === 'string' &&
    typeof state.oneLiner === 'string'
  );
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
    return isDailyState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveDailyState(state: DailyState): Promise<void> {
  await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
}
