export type VoiceLike = { language: string };

const PREFERRED_LOCALES = ['en-GB', 'en-US'] as const;

/** Pick en-GB, then en-US, matching voice language case-insensitively. */
export function preferEnglishLocale(voices: VoiceLike[]): string | undefined {
  const langs = voices.map((v) => v.language.trim());
  for (const preferred of PREFERRED_LOCALES) {
    const hit = langs.find((lang) => lang.toLowerCase() === preferred.toLowerCase());
    if (hit) return preferred;
  }
  const en = langs.find((lang) => /^en([-_]|$)/i.test(lang));
  return en ? en.replace('_', '-') : undefined;
}
