#!/usr/bin/env tsx
/**
 * Repairs weak or truncated oneLiners and replaces ESL-basic headwords in
 * intermediate/hard using WordNet glosses and curated pools.
 *
 * Usage: npm install --no-save wordpos && npx tsx content/tools/scrub-catalog-quality.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LEVELS, ONE_LINER_MAX, type Level } from './catalogSchema';
import { ESL_DENYLIST, ONE_LINER_MIN, isBrokenOneLiner } from './oneLinerQuality';

type Entry = { id: string; word: string; oneLiner: string };
type Catalog = { version: 1; level: Level; words: Entry[] };
type PoolEntry = { word: string; gloss?: string; short?: string };

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function shortenOneLiner(raw: string, max = ONE_LINER_MAX): string {
  let text = raw
    .replace(/^to\s+/i, '')
    .replace(/^\([^)]*\)\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.]+$/, '');
  if (!text || text.length < 12) return '';
  if (text.length <= max - 1) return capitalize(text) + '.';
  let cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  if (space > Math.floor(max * 0.45)) cut = cut.slice(0, space);
  cut = cut.replace(/[,:;-\s]+$/, '');
  if (cut.length < 12) return '';
  return capitalize(cut) + '.';
}

async function wordNetGloss(
  wordpos: { lookup: (w: string) => Promise<{ def?: string; gloss?: string }[]> },
  word: string,
): Promise<string> {
  try {
    const results = await wordpos.lookup(word);
    const defs = results
      .map((r) => (r.def || r.gloss || '').trim())
      .filter((d) => d.length >= 12)
      .sort((a, b) => a.length - b.length);
    for (const def of defs.slice(0, 6)) {
      const one = shortenOneLiner(def);
      if (one && !isBrokenOneLiner(one) && one.length <= ONE_LINER_MAX) return one;
    }
  } catch {
    return '';
  }
  return '';
}

function loadCatalog(level: Level): Catalog {
  return JSON.parse(readFileSync(resolve(__dirname, `../words/${level}.json`), 'utf8')) as Catalog;
}

function saveCatalog(catalog: Catalog): void {
  writeFileSync(
    resolve(__dirname, `../words/${catalog.level}.json`),
    JSON.stringify(catalog, null, 2) + '\n',
  );
}

async function main(): Promise<void> {
  const WordPOS = require('wordpos') as new () => {
    lookup: (w: string) => Promise<{ def?: string; gloss?: string }[]>;
  };
  const wordpos = new WordPOS();

  const beginner = loadCatalog('beginner');
  const intermediate = loadCatalog('intermediate');
  const hard = loadCatalog('hard');
  const catalogs: Record<Level, Catalog> = { beginner, intermediate, hard };

  const used = new Set<string>();
  for (const level of LEVELS) {
    for (const entry of catalogs[level].words) used.add(entry.word);
  }

  const intPool = JSON.parse(
    readFileSync(resolve(__dirname, '../sources/intermediate-pool.json'), 'utf8'),
  ) as PoolEntry[];
  const hardPool = JSON.parse(
    readFileSync(resolve(__dirname, '../sources/hard-pool.json'), 'utf8'),
  ) as PoolEntry[];
  const gre = JSON.parse(
    readFileSync(resolve(__dirname, '../sources/gre-definitions-subset.json'), 'utf8'),
  ) as Record<string, { definition?: string; short?: string }>;

  async function glossFor(word: string, poolHint?: PoolEntry): Promise<string> {
    const candidates = [
      poolHint?.gloss,
      poolHint?.short,
      gre[word]?.definition,
      gre[word]?.short,
    ].filter(Boolean) as string[];
    for (const raw of candidates) {
      const one = shortenOneLiner(raw.split(/(?<=\.)\s+/)[0] || raw);
      if (one && !isBrokenOneLiner(one)) return one;
    }
    return wordNetGloss(wordpos, word);
  }

  async function nextReplacement(level: 'intermediate' | 'hard'): Promise<Entry | null> {
    const pool = level === 'intermediate' ? intPool : hardPool;
    const prefix = level[0];
    for (const candidate of pool) {
      const word = candidate.word.toLowerCase();
      if (used.has(word) || ESL_DENYLIST.has(word)) continue;
      if (!/^[a-z][a-z'-]*$/.test(word)) continue;
      const oneLiner = await glossFor(word, candidate);
      if (!oneLiner || isBrokenOneLiner(oneLiner)) continue;
      used.add(word);
      return { id: 'tmp', word, oneLiner };
    }
    return null;
  }

  let repaired = 0;
  let replaced = 0;

  for (const level of LEVELS) {
    const catalog = catalogs[level];
    for (let i = 0; i < catalog.words.length; i += 1) {
      const entry = catalog.words[i];
      const needsEslSwap =
        (level === 'intermediate' || level === 'hard') && ESL_DENYLIST.has(entry.word);
      const needsRepair =
        isBrokenOneLiner(entry.oneLiner) ||
        entry.oneLiner.replace(/\.$/, '').length < ONE_LINER_MIN;

      if (!needsEslSwap && !needsRepair) continue;

      if (needsEslSwap) {
        used.delete(entry.word);
        const next = await nextReplacement(level);
        if (!next) {
          throw new Error(`No replacement for ESL word ${entry.word} in ${level}`);
        }
        catalog.words[i] = { id: entry.id, word: next.word, oneLiner: next.oneLiner };
        replaced += 1;
        continue;
      }

      const fixed = await glossFor(entry.word);
      if (!fixed || isBrokenOneLiner(fixed)) {
        if (level === 'beginner') {
          throw new Error(`Could not repair beginner oneLiner for ${entry.word}`);
        }
        used.delete(entry.word);
        const next = await nextReplacement(level);
        if (!next) throw new Error(`Could not replace broken ${level} word ${entry.word}`);
        catalog.words[i] = { id: entry.id, word: next.word, oneLiner: next.oneLiner };
        replaced += 1;
      } else {
        catalog.words[i] = { ...entry, oneLiner: fixed };
        repaired += 1;
      }
    }
  }

  for (const level of LEVELS) {
    saveCatalog(catalogs[level]);
  }

  console.log(`scrubbed catalogs: repaired=${repaired}, replaced=${replaced}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
