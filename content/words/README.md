# Word catalogs

Each level file (`beginner.json`, `intermediate.json`, `hard.json`) holds exactly **1000** entries shaped as `{ id, word, oneLiner }` with `oneLiner` ≤ 80 characters.

These lists grow English vocabulary — not teach English from scratch.

## Levels

- **Beginner** — knows English but is not yet fluent; builds a stronger everyday and academic word stock.
- **Intermediate** — already comfortable with beginner words; learns precise, “fancy” words they might not use day to day.
- **Hard** — already has a strong vocabulary and wants rarer, more exact wording.

## Beginner catalog

`beginner.json` is built from the [Vocabulary.com Top 1000](https://www.vocabulary.com/lists/52473): difficult-but-common words in academic and polished writing. Words already seeded in intermediate/hard are skipped so levels stay distinct.

Regenerate:

```bash
npm run content:build-beginner
npm run content:validate:strict
npm run content:sync
```

`npm run content:generate` skips beginner so placeholder fillers cannot overwrite this catalog.

Source dump: `content/sources/vocabulary-com-top-1000.json`.
