#!/usr/bin/env tsx
/**
 * Re-tier all catalogs into Beginner / Intermediate / Hard (1000 each).
 *
 * 1. Sort lemmas by descending frequency score (lemma-frequency.json).
 * 2. Slice into three contiguous bands of 1000.
 * 3. Apply level-overrides.json via pairwise swaps to restore counts.
 * 4. Preserve each lemma's id + oneLiner; write content/words/*.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  LEVELS,
  STRICT_WORD_COUNT,
  type Catalog,
  type Level,
  type WordEntry,
  validateCatalog,
  validateNoCrossLevelOverlaps,
} from './catalogSchema';

const root = resolve(__dirname, '..');
const wordsDir = resolve(root, 'words');
const sourcesDir = resolve(root, 'sources');

type Meta = Pick<WordEntry, 'id' | 'word' | 'oneLiner' | 'example'>;

function loadCatalog(level: Level): Catalog {
  return JSON.parse(
    readFileSync(resolve(wordsDir, `${level}.json`), 'utf8'),
  ) as Catalog;
}

function writeCatalog(level: Level, words: WordEntry[]) {
  const catalog: Catalog = { version: 1, level, words };
  const issues = validateCatalog(catalog, level, {
    strictCount: true,
    quality: true,
  });
  if (issues.length) {
    throw new Error(
      `invalid ${level} before write:\n${issues
        .slice(0, 10)
        .map((i) => `${i.path}: ${i.message}`)
        .join('\n')}`,
    );
  }
  writeFileSync(
    resolve(wordsDir, `${level}.json`),
    `${JSON.stringify(catalog, null, 2)}\n`,
    'utf8',
  );
}

function swapLemma(
  bands: Record<Level, string[]>,
  lemma: string,
  target: Level,
) {
  let source: Level | null = null;
  for (const level of LEVELS) {
    if (bands[level].includes(lemma)) {
      source = level;
      break;
    }
  }
  if (!source) {
    throw new Error(`override lemma missing from pool: ${lemma}`);
  }
  if (source === target) return;

  // Swap with the last word currently in the target band (stable rebalance).
  const fromIdx = bands[source].indexOf(lemma);
  const victim = bands[target][bands[target].length - 1];
  if (!victim) {
    throw new Error(`empty target band ${target}`);
  }
  const toIdx = bands[target].length - 1;
  bands[source][fromIdx] = victim;
  bands[target][toIdx] = lemma;
  console.log(`override: ${lemma} ${source} → ${target} (swapped with ${victim})`);
}

function main() {
  const freq = JSON.parse(
    readFileSync(resolve(sourcesDir, 'lemma-frequency.json'), 'utf8'),
  ) as Record<string, number>;
  const overrides = JSON.parse(
    readFileSync(resolve(sourcesDir, 'level-overrides.json'), 'utf8'),
  ) as Record<string, Level>;

  const byLemma = new Map<string, Meta>();
  for (const level of LEVELS) {
    for (const entry of loadCatalog(level).words) {
      const lemma = entry.word.toLowerCase();
      if (byLemma.has(lemma)) {
        throw new Error(`duplicate lemma before retier: ${lemma}`);
      }
      byLemma.set(lemma, {
        id: entry.id,
        word: entry.word,
        oneLiner: entry.oneLiner,
        example: entry.example,
      });
    }
  }

  if (byLemma.size !== STRICT_WORD_COUNT * 3) {
    throw new Error(
      `expected ${STRICT_WORD_COUNT * 3} unique lemmas, got ${byLemma.size}`,
    );
  }

  const ranked = [...byLemma.keys()].sort((a, b) => {
    const fa = freq[a] ?? 0;
    const fb = freq[b] ?? 0;
    if (fb !== fa) return fb - fa;
    return a.localeCompare(b);
  });

  const bands: Record<Level, string[]> = {
    beginner: ranked.slice(0, STRICT_WORD_COUNT),
    intermediate: ranked.slice(STRICT_WORD_COUNT, STRICT_WORD_COUNT * 2),
    hard: ranked.slice(STRICT_WORD_COUNT * 2, STRICT_WORD_COUNT * 3),
  };

  for (const [lemma, target] of Object.entries(overrides)) {
    const key = lemma.toLowerCase();
    if (!LEVELS.includes(target)) {
      throw new Error(`bad override level for ${lemma}: ${target}`);
    }
    swapLemma(bands, key, target);
  }

  const catalogs = {} as Record<Level, Catalog>;
  for (const level of LEVELS) {
    const words: WordEntry[] = bands[level].map((lemma) => {
      const meta = byLemma.get(lemma);
      if (!meta) throw new Error(`missing meta ${lemma}`);
      return { ...meta };
    });
    writeCatalog(level, words);
    catalogs[level] = { version: 1, level, words };
    console.log(`wrote ${level}.json (${words.length})`);
  }

  const overlaps = validateNoCrossLevelOverlaps(catalogs);
  if (overlaps.length) {
    throw new Error(
      `cross-level overlaps:\n${overlaps
        .slice(0, 20)
        .map((i) => i.message)
        .join('\n')}`,
    );
  }
  console.log('OK cross-level uniqueness');
}

main();
