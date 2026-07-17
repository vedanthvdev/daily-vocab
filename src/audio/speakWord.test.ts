import { describe, expect, it } from 'vitest';
import { preferEnglishLocale } from './speakWordLocale';

describe('preferEnglishLocale', () => {
  it('prefers en-GB when present', () => {
    expect(
      preferEnglishLocale([
        { language: 'en-US' },
        { language: 'en-GB' },
        { language: 'fr-FR' },
      ]),
    ).toBe('en-GB');
  });

  it('falls back to en-US', () => {
    expect(preferEnglishLocale([{ language: 'de-DE' }, { language: 'en-US' }])).toBe('en-US');
  });

  it('accepts other en-* locales when preferred are missing', () => {
    expect(preferEnglishLocale([{ language: 'en-AU' }])).toBe('en-AU');
  });

  it('returns undefined when no English voice exists', () => {
    expect(preferEnglishLocale([{ language: 'fr-FR' }])).toBeUndefined();
  });
});
