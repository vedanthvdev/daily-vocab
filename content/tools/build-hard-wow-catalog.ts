#!/usr/bin/env tsx
/**
 * Rebuilds hard.json as elegant "wow" vocabulary: rare, classy, literary words.
 * Source: content/sources/hard-wow-pool.json (fancy/literary headwords).
 * Excludes beginner + intermediate lemmas. WordNet fills weak glosses.
 *
 * Usage: npm install --no-save wordpos && npx tsx content/tools/build-hard-wow-catalog.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ONE_LINER_MAX, STRICT_WORD_COUNT } from './catalogSchema';
import { ESL_DENYLIST, isBrokenOneLiner } from './oneLinerQuality';

type PoolEntry = { word: string; gloss?: string };

const GLOSS_OVERRIDES: Record<string, string> = {
  mellifluous: 'Sweet-sounding; smooth and musical to the ear.',
  laconic: 'Using very few words; brief and pointed in speech.',
  recondite: 'Little known; obscure and known mainly to specialists.',
  quixotic: 'Idealistic in a romantic but impractical way.',
  petrichor: 'The pleasant earthy smell after rain falls on dry ground.',
  susurrus: 'A soft whispering, murmuring, or rustling sound.',
  liminal: 'At a threshold; between one state or stage and another.',
  sonder: 'The realization that each passerby lives a life as vivid as your own.',
  hiraeth: 'A deep longing for a home you cannot return to.',
  vellichor: 'The strange wistfulness of used bookshops.',
  apricity: 'The warmth of the sun in winter.',
  psithurism: 'The sound of wind whispering through trees.',
  ephemeral: 'Lasting for a very short time.',
  sesquipedalian: 'Given to using long words; a very long word itself.',
};

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function shortenOneLiner(raw: string, max = ONE_LINER_MAX): string {
  let text = raw
    .replace(/^to\s+/i, '')
    .replace(/^[\d•]+\s*/g, '')
    .replace(/^\([^)]*\)\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.]+$/, '');
  if (!text || text.length < 12) return '';
  const first = text.split(/[.;]/)[0]?.trim() || text;
  if (first.length >= 12) text = first;
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
    for (const def of defs.slice(0, 8)) {
      const one = shortenOneLiner(def);
      if (one && !isBrokenOneLiner(one) && one.length <= ONE_LINER_MAX) return one;
    }
  } catch {
    return '';
  }
  return '';
}

async function main(): Promise<void> {
  const WordPOS = require('wordpos') as new () => {
    lookup: (w: string) => Promise<{ def?: string; gloss?: string }[]>;
  };
  const wordpos = new WordPOS();

  const pool = JSON.parse(
    readFileSync(resolve(__dirname, '../sources/hard-wow-pool.json'), 'utf8'),
  ) as PoolEntry[];

  const beginner = new Set(
    (
      JSON.parse(readFileSync(resolve(__dirname, '../words/beginner.json'), 'utf8')) as {
        words: { word: string }[];
      }
    ).words.map((w) => w.word),
  );
  const intermediate = new Set(
    (
      JSON.parse(readFileSync(resolve(__dirname, '../words/intermediate.json'), 'utf8')) as {
        words: { word: string }[];
      }
    ).words.map((w) => w.word),
  );

  const words: { id: string; word: string; oneLiner: string }[] = [];
  const seen = new Set<string>();

  for (const entry of pool) {
    if (words.length >= STRICT_WORD_COUNT) break;
    const word = entry.word.toLowerCase().trim();
    if (!/^[a-z][a-z'-]*$/.test(word) || word.length < 5) continue;
    if (seen.has(word) || beginner.has(word) || intermediate.has(word) || ESL_DENYLIST.has(word)) {
      continue;
    }

    let oneLiner = GLOSS_OVERRIDES[word] || '';
    if (!oneLiner) {
      oneLiner = entry.gloss ? shortenOneLiner(entry.gloss) : '';
    }
    if (!oneLiner || isBrokenOneLiner(oneLiner) || oneLiner.length > ONE_LINER_MAX) {
      oneLiner = await wordNetGloss(wordpos, word);
    }
    if (!oneLiner || isBrokenOneLiner(oneLiner) || oneLiner.length > ONE_LINER_MAX) continue;

    seen.add(word);
    words.push({
      id: `h${String(words.length + 1).padStart(3, '0')}`,
      word,
      oneLiner,
    });
  }

  if (words.length < STRICT_WORD_COUNT) {
    throw new Error(`Only produced ${words.length} hard wow words; need ${STRICT_WORD_COUNT}`);
  }

  const outPath = resolve(__dirname, '../words/hard.json');
  writeFileSync(
    outPath,
    JSON.stringify({ version: 1, level: 'hard', words }, null, 2) + '\n',
  );
  console.log(`wrote ${outPath} (${words.length} wow words)`);
  console.log('sample:', words.slice(0, 12).map((w) => w.word).join(', '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
