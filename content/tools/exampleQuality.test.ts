import { describe, expect, it } from 'vitest';
import { isValidExample } from './exampleQuality';

describe('isValidExample', () => {
  it('rejects example that omits the lemma', () => {
    expect(
      isValidExample('revelry', 'The party went late into the night.'),
    ).toBe(false);
  });

  it('accepts lemma with different casing', () => {
    expect(
      isValidExample('revelry', 'Revelry filled the streets after the win.'),
    ).toBe(true);
  });

  it('rejects overlong examples', () => {
    const long = `Revelry ${'x'.repeat(120)}`;
    expect(isValidExample('revelry', long)).toBe(false);
  });

  it('rejects placeholder TODO examples', () => {
    expect(isValidExample('quick', 'TODO write a sentence with quick.')).toBe(
      false,
    );
  });
});
