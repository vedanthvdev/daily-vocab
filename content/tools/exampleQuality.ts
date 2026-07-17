export const EXAMPLE_MAX = 120;
export const EXAMPLE_MIN = 12;

/** Lemma must appear as a whole word (case-insensitive). */
export function exampleContainsLemma(word: string, example: string): boolean {
  const lemma = word.trim().toLowerCase();
  if (!lemma) return false;
  const escaped = lemma.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\b`, 'i');
  return re.test(example);
}

export function isValidExample(word: string, example: string): boolean {
  const text = example.trim();
  if (text.length < EXAMPLE_MIN) return false;
  if (text.length > EXAMPLE_MAX) return false;
  if (!exampleContainsLemma(word, text)) return false;
  // Reject obvious placeholders.
  if (/^(TODO|TBD|example|n\/a)\b/i.test(text)) return false;
  if (/Practice (beginner|intermediate|hard) word/i.test(text)) return false;
  return true;
}

export function isBrokenExample(word: string, example: string): boolean {
  return !isValidExample(word, example);
}
