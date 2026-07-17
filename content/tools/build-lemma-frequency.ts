#!/usr/bin/env tsx
/**
 * Build content/sources/lemma-frequency.json for catalog re-tiering.
 *
 * Sort key: higher score = more common / earlier learner word.
 * Primary signal: vocabulary.com top-1000 order (earlier = more common).
 * Remaining lemmas: shorter length first, then alphabetical (offline proxy).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LEVELS, type Catalog, type Level } from './catalogSchema';

const root = resolve(__dirname, '..');
const wordsDir = resolve(root, 'words');
const sourcesDir = resolve(root, 'sources');

type FreqMap = Record<string, number>;

function loadCatalog(level: Level): Catalog {
  return JSON.parse(
    readFileSync(resolve(wordsDir, `${level}.json`), 'utf8'),
  ) as Catalog;
}

function main() {
  const lemmas = new Set<string>();
  for (const level of LEVELS) {
    for (const entry of loadCatalog(level).words) {
      lemmas.add(entry.word.toLowerCase());
    }
  }

  const vocabTop = JSON.parse(
    readFileSync(resolve(sourcesDir, 'vocabulary-com-top-1000.json'), 'utf8'),
  ) as { word: string }[];

  const scores: FreqMap = {};
  const BASE = 1_000_000;
  vocabTop.forEach((row, index) => {
    const lemma = row.word.toLowerCase();
    if (lemmas.has(lemma)) {
      // Earlier in the list → higher score.
      scores[lemma] = BASE - index;
    }
  });

  const missing = [...lemmas].filter((l) => scores[l] === undefined);
  missing.sort((a, b) => a.length - b.length || a.localeCompare(b));
  missing.forEach((lemma, index) => {
    // Below all vocabulary.com hits; shorter lemmas rank slightly higher.
    scores[lemma] = BASE - 10_000 - index;
  });

  const outPath = resolve(sourcesDir, 'lemma-frequency.json');
  writeFileSync(outPath, `${JSON.stringify(scores, null, 2)}\n`, 'utf8');
  console.log(
    `wrote ${outPath} (${Object.keys(scores).length} lemmas; ${vocabTop.length} vocab.com ranks applied)`,
  );
}

main();
