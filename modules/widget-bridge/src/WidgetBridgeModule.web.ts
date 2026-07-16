import type { DailySnapshot } from './WidgetBridge.types';

const memory = new Map<string, string>();

export default {
  async syncWidgetState(
    snapshot: DailySnapshot | null,
    level: string | null,
  ): Promise<void> {
    if (snapshot) {
      memory.set('dailySnapshot', JSON.stringify(snapshot));
    }
    if (level) {
      memory.set('activeLevel', level);
    }
  },
  async setDailySnapshot(snapshot: DailySnapshot): Promise<void> {
    memory.set('dailySnapshot', JSON.stringify(snapshot));
  },
  async setActiveLevel(level: string): Promise<void> {
    memory.set('activeLevel', level);
  },
  async getDailySnapshot(): Promise<DailySnapshot | null> {
    const raw = memory.get('dailySnapshot');
    return raw ? (JSON.parse(raw) as DailySnapshot) : null;
  },
  async reloadWidgets(): Promise<void> {},
};
