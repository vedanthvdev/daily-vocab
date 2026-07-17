import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  LEVELS,
  type Catalog,
  type Level,
  validateCatalog,
  validateNoCrossLevelOverlaps,
} from './catalogSchema';

describe('live content catalogs', () => {
  it('pass strict count, quality, and cross-level checks', () => {
    const catalogs = {} as Record<Level, Catalog>;

    for (const level of LEVELS) {
      const data = JSON.parse(
        readFileSync(resolve(__dirname, `../words/${level}.json`), 'utf8'),
      ) as Catalog;
      const issues = validateCatalog(data, level, { strictCount: true, quality: true });
      expect(issues, `${level}: ${issues.map((i) => `${i.path}: ${i.message}`).join('; ')}`).toEqual(
        [],
      );
      catalogs[level] = data;
    }

    expect(validateNoCrossLevelOverlaps(catalogs)).toEqual([]);
  });
});
