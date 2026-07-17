# Word catalogs

Each level file (`beginner.json`, `intermediate.json`, `hard.json`) holds exactly **1000** entries shaped as `{ id, word, oneLiner }` with `oneLiner` ≤ 80 characters. The top-level `words` array is pack **v1**; optional `packs.v2` can hold overflow for when v1 has no eligible words left (shown-year skip window).

These lists grow English vocabulary — not teach English from scratch. Levels do not share headwords.

## Levels

- **Beginner** — knows English but is not yet fluent; builds a stronger everyday and academic word stock.
- **Intermediate** — already comfortable with beginner words; learns precise, fancy words they might not use day to day.
- **Hard** — already has a strong vocabulary and wants rarer, elegant, professor-tier wording.

## Beginner

Built from the [Vocabulary.com Top 1000](https://www.vocabulary.com/lists/52473).

```bash
npm run content:build-beginner
```

Source: `content/sources/vocabulary-com-top-1000.json`.

## Intermediate

Fancy-but-usable enrichment (precise day-to-day upgrades), below hard’s rare literary tier.

```bash
npm install --no-save wordpos
npm run content:build-intermediate-fancy
```

Source: `content/sources/intermediate-fancy-pool.json`.

## Hard

Elegant, rare “wow” words — literary and professor-tier vocabulary.

```bash
npm install --no-save wordpos
npm run content:build-hard-wow
```

Source: `content/sources/hard-wow-pool.json`.

## Notes

Build **hard before intermediate** if regenerating both, so intermediate can exclude hard headwords.

`npm run content:generate` skips all three curated catalogs.

After bulk rebuilds, run `npm run content:scrub` to repair truncated oneLiners and strip ESL-basic headwords from intermediate/hard.
