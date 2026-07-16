#!/usr/bin/env tsx
/**
 * Builds beginner.json for vocabulary enrichment (fluent speakers expanding range),
 * not ESL basics. Source: Vocabulary.com Top 1000, with short glosses capped at 80 chars.
 *
 * Usage: npx tsx content/tools/build-beginner-catalog.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ONE_LINER_MAX, STRICT_WORD_COUNT } from './catalogSchema';

type SourceEntry = { word: string; gloss: string };

const RESERVED_OTHER_LEVELS = new Set([
  'ambiguous',
  'cautious',
  'compel',
  'deprive',
  'elaborate',
  'flourish',
  'grumble',
  'hesitate',
  'imply',
  'justify',
  'keen',
  'linger',
  'modest',
  'notion',
  'overlook',
  'persist',
  'quaint',
  'resemble',
  'scarce',
  'tend',
  'abate',
  'candid',
  'deference',
  'ephemeral',
  'fastidious',
  'gregarious',
  'harbinger',
  'ineffable',
  'juxtapose',
  'laconic',
  'mellifluous',
  'nonchalant',
  'obfuscate',
  'paradigm',
  'quixotic',
  'recondite',
  'sagacious',
  'taciturn',
  'ubiquitous',
  'vociferous',
]);

const TOP_UP: SourceEntry[] = [
  { word: 'adept', gloss: 'highly skilled or well-practiced' },
  { word: 'brisk', gloss: 'quick, energetic, and lively' },
  { word: 'candid', gloss: 'honest and straightforward' },
  { word: 'deft', gloss: 'neatly skillful and quick in movement' },
  { word: 'eloquent', gloss: 'fluent and persuasive in speaking or writing' },
  { word: 'frank', gloss: 'open, honest, and direct in speech' },
  { word: 'lucid', gloss: 'clear and easy to understand' },
  { word: 'nimble', gloss: 'quick and light in movement or thought' },
  { word: 'prudent', gloss: 'acting with care and thought for the future' },
  { word: 'robust', gloss: 'strong and healthy; sturdy' },
  { word: 'serene', gloss: 'calm, peaceful, and untroubled' },
  { word: 'subtle', gloss: 'delicate or precise; not obvious' },
  { word: 'vivid', gloss: 'producing strong, clear images in the mind' },
  { word: 'wary', gloss: 'cautious and watchful about possible danger' },
  { word: 'zest', gloss: 'great enthusiasm and energy' },
];

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const HANGING_TAIL =
  /^(a|an|the|to|of|for|or|and|with|as|in|on|at|by|from|into|about|that|which|who|whom|whose|than|then|very|especially|usually|often|also|can|be|is|are|was|were|been|being|do|does|did|have|has|had)$/i;

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

function main(): void {
  const sourcePath = resolve(__dirname, '../sources/vocabulary-com-top-1000.json');
  const source = JSON.parse(readFileSync(sourcePath, 'utf8')) as SourceEntry[];

  const pool: SourceEntry[] = [];
  const seen = new Set<string>();

  for (const entry of [...source, ...TOP_UP]) {
    const word = entry.word.toLowerCase().trim();
    if (!/^[a-z][a-z'-]*$/.test(word)) continue;
    if (RESERVED_OTHER_LEVELS.has(word)) continue;
    if (seen.has(word)) continue;
    const oneLiner = shortenOneLiner(entry.gloss);
    if (!oneLiner || oneLiner.length > ONE_LINER_MAX) continue;
    seen.add(word);
    pool.push({ word, gloss: oneLiner });
    if (pool.length >= STRICT_WORD_COUNT) break;
  }

  if (pool.length < STRICT_WORD_COUNT) {
    throw new Error(`Only produced ${pool.length} enrichment words; need ${STRICT_WORD_COUNT}`);
  }

  const words = pool.slice(0, STRICT_WORD_COUNT).map((entry, index) => ({
    id: `b${String(index + 1).padStart(3, '0')}`,
    word: entry.word,
    oneLiner: entry.gloss,
  }));

  const outPath = resolve(__dirname, '../words/beginner.json');
  writeFileSync(
    outPath,
    JSON.stringify({ version: 1, level: 'beginner', words }, null, 2) + '\n',
  );
  console.log(`wrote ${outPath} (${words.length} enrichment words)`);
}

main();
