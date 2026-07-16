#!/usr/bin/env tsx
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  LEVELS,
  type Catalog,
  type Level,
  validateCatalog,
  validateNoCrossLevelOverlaps,
} from './catalogSchema';

const strictCount = process.argv.includes('--strict-count');
const quality = process.argv.includes('--quality') || strictCount;
const root = resolve(__dirname, '../words');

let failed = false;
const catalogs = {} as Record<Level, Catalog>;

for (const level of LEVELS) {
  const filePath = resolve(root, `${level}.json`);
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`FAIL ${level}.json — cannot read/parse: ${String(error)}`);
    failed = true;
    continue;
  }

  const issues = validateCatalog(data, level as Level, { strictCount, quality });
  catalogs[level] = data as Catalog;
  if (issues.length === 0) {
    const count = (data as { words: unknown[] }).words.length;
    console.log(`OK   ${level}.json (${count} words)`);
  } else {
    failed = true;
    console.error(`FAIL ${level}.json`);
    for (const issue of issues.slice(0, 30)) {
      console.error(`  - ${issue.path}: ${issue.message}`);
    }
    if (issues.length > 30) {
      console.error(`  … and ${issues.length - 30} more`);
    }
  }
}

if (LEVELS.every((level) => catalogs[level])) {
  const overlapIssues = validateNoCrossLevelOverlaps(catalogs);
  if (overlapIssues.length === 0) {
    console.log('OK   cross-level word uniqueness');
  } else {
    failed = true;
    console.error('FAIL cross-level overlaps');
    for (const issue of overlapIssues.slice(0, 20)) {
      console.error(`  - ${issue.path}: ${issue.message}`);
    }
  }
}

if (failed) {
  process.exit(1);
}
