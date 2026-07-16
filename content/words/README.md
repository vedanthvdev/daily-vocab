# Word catalogs

Each level file (`beginner.json`, `intermediate.json`, `hard.json`) holds exactly **1000** entries shaped as `{ id, word, oneLiner }` with `oneLiner` ≤ 80 characters.

These lists grow English vocabulary — not teach English from scratch. Levels do not share headwords.

## Levels

- **Beginner** — knows English but is not yet fluent; builds a stronger everyday and academic word stock.
- **Intermediate** — already comfortable with beginner words; learns precise, “fancy” words they might not use day to day.
- **Hard** — already has a strong vocabulary and wants rarer, more exact wording.

## Beginner

Built from the [Vocabulary.com Top 1000](https://www.vocabulary.com/lists/52473).

```bash
npm run content:build-beginner
```

Source: `content/sources/vocabulary-com-top-1000.json`.

## Intermediate and hard

Built from GRE enrichment pools (Magoosh basic/common → intermediate; Magoosh advanced / Manhattan / rarer GRE → hard), with short glosses from curated GRE notes and WordNet fallbacks. Pools exclude beginner headwords and each other.

```bash
npm install --no-save wordpos
npm run content:build-intermediate-hard
npm run content:validate:strict
npm run content:sync
```

Sources: `content/sources/intermediate-pool.json`, `hard-pool.json`, `gre-definitions-subset.json`.

`npm run content:generate` skips all three curated catalogs so placeholders cannot overwrite them.
