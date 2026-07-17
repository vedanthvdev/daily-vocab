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

export async function syncWidgetState(options: {
  state?: DailyState | null;
  level?: Level | null;
  reload?: boolean;
}): Promise<void> {
  if (!WidgetBridgeModule) return;
  const snapshot = options.state ? toSnapshot(options.state) : null;
  const level = options.level ?? null;
  if (WidgetBridgeModule.syncWidgetState) {
    await WidgetBridgeModule.syncWidgetState(snapshot, level);
  } else {
    if (level) await WidgetBridgeModule.setActiveLevel(level);
    if (snapshot) await WidgetBridgeModule.setDailySnapshot(snapshot);
  }
  if (options.reload !== false && snapshot) {
    await WidgetBridgeModule.reloadWidgets();
  }
}

export async function syncShownYears(shown: Record<string, number>): Promise<void> {
  if (!WidgetBridgeModule?.setShownYears) return;
  await WidgetBridgeModule.setShownYears(JSON.stringify(shown));
}

export async function pushDailySnapshot(state: DailyState): Promise<void> {
  await syncWidgetState({ state, reload: true });
}

export async function pushActiveLevel(level: Level): Promise<void> {
  await syncWidgetState({ level, reload: false });
}

export async function readDailySnapshot(): Promise<DailySnapshot | null> {
  if (!WidgetBridgeModule) return null;
  try {
    return await WidgetBridgeModule.getDailySnapshot();
  } catch {
    return null;
  }
}
