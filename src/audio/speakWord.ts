import WidgetBridgeModule from '../../modules/widget-bridge/src/WidgetBridgeModule';

/** Prefer GB English; native falls back to US if unavailable. */
const PREFERRED_LANGUAGE = 'en-GB';

let inFlight: Promise<void> | null = null;

export async function speakWord(word: string): Promise<void> {
  const text = word.trim();
  if (!text) return;

  const bridge = WidgetBridgeModule;
  const speak = bridge?.speakWord;
  if (!bridge || !speak) return;

  const run = async () => {
    try {
      await bridge.stopSpeaking?.();
      await speak(text, PREFERRED_LANGUAGE);
    } catch {
      // Silent no-op when TTS is unavailable.
    }
  };

  // Serialize taps so stop/speak cannot interleave across rapid presses.
  inFlight = (inFlight ?? Promise.resolve()).then(run, run);
  await inFlight;
}
