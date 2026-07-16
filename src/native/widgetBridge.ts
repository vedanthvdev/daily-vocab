import type { DailyState, Level } from '../domain/types';
import WidgetBridgeModule from '../../modules/widget-bridge/src/WidgetBridgeModule';

export type DailySnapshot = {
  level: string;
  localDate: string;
  wordId: string;
  word: string;
  oneLiner: string;
};

function toSnapshot(state: DailyState): DailySnapshot {
  return {
    level: state.level,
    localDate: state.localDate,
    wordId: state.wordId,
    word: state.word,
    oneLiner: state.oneLiner,
  };
}

export async function pushDailySnapshot(state: DailyState): Promise<void> {
  if (!WidgetBridgeModule) return;
  try {
    await WidgetBridgeModule.setDailySnapshot(toSnapshot(state));
    await WidgetBridgeModule.reloadWidgets();
  } catch {
  }
}

export async function pushActiveLevel(level: Level): Promise<void> {
  if (!WidgetBridgeModule) return;
  try {
    await WidgetBridgeModule.setActiveLevel(level);
  } catch {
  }
}

export async function readDailySnapshot(): Promise<DailySnapshot | null> {
  if (!WidgetBridgeModule) return null;
  try {
    return await WidgetBridgeModule.getDailySnapshot();
  } catch {
    return null;
  }
}
