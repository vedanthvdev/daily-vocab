#!/usr/bin/env tsx
/**
 * Builds intermediate.json and hard.json for vocabulary enrichment.
 * Intermediate: Magoosh basic/common–style GRE words beyond the beginner list.
 * Hard: Magoosh advanced / Manhattan / rarer GRE words beyond intermediate.
 *
 * Usage: npm install --no-save wordpos && npx tsx content/tools/build-intermediate-hard-catalogs.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ONE_LINER_MAX, STRICT_WORD_COUNT, type Level } from './catalogSchema';
import { ESL_DENYLIST, isBrokenOneLiner } from './oneLinerQuality';

type PoolEntry = { word: string; gloss?: string; short?: string };
type GreDef = { definition?: string; short?: string };

const HANGING_TAIL =
  /^(a|an|the|to|of|for|or|and|with|as|in|on|at|by|from|into|about|that|which|who|whom|whose|than|then|very|especially|usually|often|also|can|be|is|are|was|were|been|being|do|does|did|have|has|had)$/i;

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function trimHangingWords(text: string): string {
  let words = text.split(/\s+/).filter(Boolean);
  while (words.length > 3 && HANGING_TAIL.test(words[words.length - 1] || '')) {
    words = words.slice(0, -1);
  }
  return words.join(' ').replace(/[,:;-\s]+$/, '');
}

function shortenOneLiner(raw: string, max = ONE_LINER_MAX): string {
  let text = raw
    .replace(/^to\s+/i, '')
    .replace(/^\([^)]*\)\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.]+$/, '');
  if (!text) return '';

  if (text.length <= max - 1) {
    return capitalize(text) + '.';
  }

  let cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  if (space > Math.floor(max * 0.45)) cut = cut.slice(0, space);
  cut = trimHangingWords(cut);
  if (cut.length < 12) return '';
  return capitalize(cut) + '.';
}

function isWeak(oneLiner: string): boolean {
  const body = oneLiner.replace(/\.$/, '');
  return body.length < 16 || /\b(a|an|the|to|of|for|or|and|with|as|in)$/i.test(body);
}

type WordPos = {
  lookup: (w: string) => Promise<{ def?: string; gloss?: string }[]>;
};

async function wordNetGloss(wordpos: WordPos, word: string): Promise<string> {
  try {
    const results = await wordpos.lookup(word);
    const defs = results
      .map((r) => (r.def || r.gloss || '').trim())
      .filter((d) => d.length >= 8)
      .sort((a, b) => a.length - b.length);
    return defs[0] || '';
  } catch {
    return '';
  }
}

function pickGloss(entry: PoolEntry, gre: Record<string, GreDef>): string {
  if (entry.gloss && entry.gloss.length >= 12) return entry.gloss;
  const fromGre = gre[entry.word];
  if (fromGre?.definition && fromGre.definition.length >= 12) return fromGre.definition;
  if (entry.short && entry.short.length >= 12) {
    const first = entry.short.split(/(?<=\.)\s+/)[0] || entry.short;
    return first;
  }
  if (fromGre?.short && fromGre.short.length >= 12) {
    return fromGre.short.split(/(?<=\.)\s+/)[0] || fromGre.short;
  }
  return '';
}

async function buildLevel(
  level: Level,
  pool: PoolEntry[],
  gre: Record<string, GreDef>,
  wordpos: WordPos,
  prefix: string,
  exclude: Set<string> = new Set(),
): Promise<{ id: string; word: string; oneLiner: string }[]> {
  const words: { id: string; word: string; oneLiner: string }[] = [];
  const seen = new Set<string>();

  for (const entry of pool) {
    if (words.length >= STRICT_WORD_COUNT) break;
    const word = entry.word.toLowerCase().trim();
    if (!/^[a-z][a-z'-]*$/.test(word) || seen.has(word) || exclude.has(word)) continue;
    if (ESL_DENYLIST.has(word)) continue;

    let oneLiner = shortenOneLiner(pickGloss(entry, gre));
    if (!oneLiner || isWeak(oneLiner) || isBrokenOneLiner(oneLiner)) {
      const wn = await wordNetGloss(wordpos, word);
      oneLiner = wn ? shortenOneLiner(wn) : '';
    }
    if (!oneLiner || oneLiner.length > ONE_LINER_MAX || isWeak(oneLiner) || isBrokenOneLiner(oneLiner)) {
      continue;
    }

    seen.add(word);
    words.push({
      id: `${prefix}${String(words.length + 1).padStart(3, '0')}`,
      word,
      oneLiner,
    });
  }

  if (words.length < STRICT_WORD_COUNT) {
    throw new Error(`${level}: only produced ${words.length}; need ${STRICT_WORD_COUNT}`);
  }
  return words;
}

async function main(): Promise<void> {
  const WordPOS = require('wordpos') as new () => WordPos;
  const wordpos = new WordPOS();
  const sources = resolve(__dirname, '../sources');

  const intermediatePool = JSON.parse(
    readFileSync(resolve(sources, 'intermediate-pool.json'), 'utf8'),
  ) as PoolEntry[];
  const hardPool = JSON.parse(readFileSync(resolve(sources, 'hard-pool.json'), 'utf8')) as PoolEntry[];
  const gre = JSON.parse(
    readFileSync(resolve(sources, 'gre-definitions-subset.json'), 'utf8'),
  ) as Record<string, GreDef>;

  const beginner = new Set(
    (
      JSON.parse(readFileSync(resolve(__dirname, '../words/beginner.json'), 'utf8')) as {
        words: { word: string }[];
      }
    ).words.map((w) => w.word),
  );

  const intermediate = await buildLevel(
    'intermediate',
    intermediatePool,
    gre,
    wordpos,
    'i',
    beginner,
  );
  const hard = await buildLevel(
    'hard',
    hardPool,
    gre,
    wordpos,
    'h',
    new Set([...beginner, ...intermediate.map((w) => w.word)]),
  );

  const wordsDir = resolve(__dirname, '../words');
  writeFileSync(
    resolve(wordsDir, 'intermediate.json'),
    JSON.stringify({ version: 1, level: 'intermediate', words: intermediate }, null, 2) + '\n',
  );
  writeFileSync(
    resolve(wordsDir, 'hard.json'),
    JSON.stringify({ version: 1, level: 'hard', words: hard }, null, 2) + '\n',
  );
  console.log(`wrote intermediate.json (${intermediate.length}) and hard.json (${hard.length})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
