import { requireOptionalNativeModule } from 'expo';
import type { DailySnapshot } from './WidgetBridge.types';

type WidgetBridgeNative = {
  syncWidgetState(
    snapshot: DailySnapshot | null,
    level: string | null,
  ): Promise<void>;
  setDailySnapshot(snapshot: DailySnapshot): Promise<void>;
  setActiveLevel(level: string): Promise<void>;
  getDailySnapshot(): Promise<DailySnapshot | null>;
  reloadWidgets(): Promise<void>;
};

const WidgetBridgeModule =
  requireOptionalNativeModule<WidgetBridgeNative>('WidgetBridge');

export default WidgetBridgeModule;
