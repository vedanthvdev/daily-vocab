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
  setShownYears?(json: string): Promise<void>;
  speakWord?(text: string, language: string | null): Promise<void>;
  stopSpeaking?(): Promise<void>;
};

const WidgetBridgeModule =
  requireOptionalNativeModule<WidgetBridgeNative>('WidgetBridge');

export default WidgetBridgeModule;
