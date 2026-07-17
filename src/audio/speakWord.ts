import * as Speech from 'expo-speech';
import { preferEnglishLocale } from './speakWordLocale';

export async function speakWord(word: string): Promise<void> {
  const text = word.trim();
  if (!text) return;

  try {
    await Speech.stop();
    let language: string | undefined;
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      language = preferEnglishLocale(voices);
    } catch {
      language = 'en-US';
    }

    Speech.speak(text, {
      language,
      rate: 0.9,
      pitch: 1,
      onError: () => {},
    });
  } catch {
    // Silent no-op when TTS is unavailable.
  }
}
