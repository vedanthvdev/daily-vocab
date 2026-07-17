import { z } from 'zod';
import { ESL_DENYLIST, ONE_LINER_MIN, isBrokenOneLiner } from './oneLinerQuality';

export const LEVELS = ['beginner', 'intermediate', 'hard'] as const;
export type Level = (typeof LEVELS)[number];

export const ONE_LINER_MAX = 80;
export const STRICT_WORD_COUNT = 1000;

export const WordEntrySchema = z.object({
  id: z.string().min(1),
  word: z.string().min(1),
  oneLiner: z.string().min(1).max(ONE_LINER_MAX),
});

export const CatalogSchema = z.object({
  version: z.literal(1),
  level: z.enum(LEVELS),
  words: z.array(WordEntrySchema).min(1),
});

export type WordEntry = z.infer<typeof WordEntrySchema>;
export type Catalog = z.infer<typeof CatalogSchema>;

export type ValidationIssue = { path: string; message: string };

export function validateCatalog(
  data: unknown,
  expectedLevel: Level,
  options: { strictCount?: boolean; quality?: boolean } = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const parsed = CatalogSchema.safeParse(data);

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({
        path: issue.path.join('.') || '(root)',
        message: issue.message,
      });
    }
    return issues;
  }

  const catalog = parsed.data;
  if (catalog.level !== expectedLevel) {
    issues.push({
      path: 'level',
      message: `expected "${expectedLevel}", got "${catalog.level}"`,
    });
  }

  const seenIds = new Set<string>();
  const seenWords = new Set<string>();
  for (const [index, entry] of catalog.words.entries()) {
    if (seenIds.has(entry.id)) {
      issues.push({
        path: `words[${index}].id`,
        message: `duplicate id "${entry.id}"`,
      });
    }
    seenIds.add(entry.id);

    const lemma = entry.word.toLowerCase();
    if (seenWords.has(lemma)) {
      issues.push({
        path: `words[${index}].word`,
        message: `duplicate word "${entry.word}"`,
      });
    }
    seenWords.add(lemma);

    if (options.quality) {
      if (entry.oneLiner.replace(/\.$/, '').length < ONE_LINER_MIN) {
        issues.push({
          path: `words[${index}].oneLiner`,
          message: `oneLiner shorter than ${ONE_LINER_MIN} characters`,
        });
      }
      if (isBrokenOneLiner(entry.oneLiner)) {
        issues.push({
          path: `words[${index}].oneLiner`,
          message: `broken or truncated oneLiner for "${entry.word}"`,
        });
      }
      if (
        (expectedLevel === 'intermediate' || expectedLevel === 'hard') &&
        ESL_DENYLIST.has(lemma)
      ) {
        issues.push({
          path: `words[${index}].word`,
          message: `ESL-basic word "${entry.word}" is not allowed in ${expectedLevel}`,
        });
      }
    }
  }

  if (options.strictCount && catalog.words.length !== STRICT_WORD_COUNT) {
    issues.push({
      path: 'words',
      message: `expected ${STRICT_WORD_COUNT} words, got ${catalog.words.length}`,
    });
  }

  return issues;
}

export function validateNoCrossLevelOverlaps(
  catalogs: Record<Level, Catalog>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const owners = new Map<string, Level>();
  for (const level of LEVELS) {
    for (const [index, entry] of catalogs[level].words.entries()) {
      const lemma = entry.word.toLowerCase();
      const prior = owners.get(lemma);
      if (prior) {
        issues.push({
          path: `${level}.words[${index}].word`,
          message: `"${entry.word}" also appears in ${prior}`,
        });
      } else {
        owners.set(lemma, level);
      }
    }
  }
  return issues;
}
