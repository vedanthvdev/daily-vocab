# Example sentence + full level re-tier (v2)

Date: 2026-07-17  
Status: implemented

## Problem

Learners see today’s word and a short definition on Home, but not how the word is used in a sentence. Separately, some lemmas sit in the wrong difficulty band (e.g. `revelry` in Beginner, `blandish` in Hard), which weakens the Beginner / Intermediate / Hard promise.

## Goals

1. Add one **hand-written example sentence** for every catalog word (~3,000).
2. **Fully re-tier** the word pool so each level has exactly 1,000 words, using frequency as the default sort and manual overrides for clear mismatches.
3. Show the example sentence **only on the Home Today card** (inside the app).
4. Ship as a **major version** `2.0.0` only when re-tier + all sentences are complete.

## Non-goals

- Example sentence on widgets, History, lock-screen copy, or App Group / `DailySnapshot`.
- Speaking the example sentence (TTS remains word-only).
- Shipping partial catalogs or optional/missing `example` fields.
- Cloud-generated sentences as the source of truth (hand-written only for 2.0).
- Rewriting one-liners unless required by a level move or quality gate.
- Changing daily-lock / shown-year algorithms beyond adapting to new catalog layout.

## Decisions

| Topic | Choice |
| --- | --- |
| Ship gate | **2.0.0 only after** full re-tier + all ~3,000 sentences |
| Re-tier method | Frequency ranks the combined pool into three buckets of 1,000; **manual overrides** for mismatches (blend) |
| Workflow | **Re-tier first → lock catalogs → hand-write sentences** level-by-level |
| Field name | `example` on each `WordEntry` |
| UI surface | Home Today card only, below the one-liner |
| Widgets / History / bridge | Unchanged payloads — no `example` on `DailySnapshot` |
| App version | `1.1.0` → `2.0.0` |
| Catalog schema | Require `example`; bump catalog document `version` if needed for validators |
| Headword in sentence | Prefer the **lemma** as written in `word`; allow natural casing at sentence start |
| Sentence length | Cap in schema (target **≤ 120** characters); must be non-empty and include the lemma (case-insensitive) |
| IDs | Prefer keeping existing `id` when a lemma moves level; document swaps / replacements needed to keep 1,000/level and no overlaps |
| Overlaps | Still enforced: a lemma appears in exactly one level |

## UX (Home)

When today’s word is locked:

1. Existing row: level label + speak control  
2. Word  
3. One-liner (definition)  
4. **New:** example sentence in a quieter style (muted ink / tip color), one short line that reads as usage, not a second definition  

Empty state unchanged. History and widgets unchanged.

## Architecture

```
content/words/{beginner,intermediate,hard}.json
  → WordEntry { id, word, oneLiner, example }
  → validateCatalog (require example + quality rules)
  → ensureTodaysWord / DailyState (+ example)
  → HomeScreen Today card only

DailySnapshot / widget / History
  → word + oneLiner only (no example)
```

## Re-tier process

1. Load all lemmas from the three catalogs (and shared metadata: `id`, `oneLiner`).
2. Score each lemma with a documented frequency source (script + checked-in ranking inputs or derived list).
3. Sort ascending frequency → assign Beginner / Intermediate / Hard as contiguous 1,000-word bands.
4. Apply a checked-in **override list** (e.g. move `revelry` up, `blandish` down) and rebalance to restore exactly 1,000 per level without overlaps.
5. Emit new catalog JSON files; run `validateCatalog` + cross-level overlap checks.
6. Freeze re-tier before sentence authoring begins (except critical fixes).

## Sentence authoring

1. Hand-write `example` for every entry after re-tier freeze.
2. Progress by level (Beginner → Intermediate → Hard) or by batches within a level; track completion so nothing ships incomplete.
3. Automated gates: length, contains lemma, no empty/placeholder strings.
4. Spot human review for awkward or misleading sentences before merge.

## App / domain changes (after content complete)

- Extend `WordEntry`, `LockedWord`, `DailyState` with `example`.
- `ensureTodaysWord` copies `example` into locked state.
- Home renders `today.example` on the Today card only.
- Sync bundled copies under widget-bridge / iOS widget asset paths as today for `word` + `oneLiner` catalogs (still without exposing `example` to widget UI).
- Bump app to `2.0.0`.

## Risks

- **Effort:** hand-writing ~3,000 sentences is the critical path; 2.0 stays blocked until done.
- **Frequency source quality:** bad ranks mis-tier large bands — mitigate with overrides and spot audits.
- **History / shown years:** keyed by `wordId`; level moves don’t rewrite history, but a user’s “Beginner” streak may surface formerly Intermediate lemmas — acceptable for major version; note in release notes.
- **Strict 1,000 count:** every override must be paired with a compensating move or replacement.

## Success criteria

- [ ] Each level has exactly 1,000 unique lemmas; no cross-level overlaps.
- [ ] Every entry has a hand-written `example` passing schema/quality checks.
- [ ] Home Today card shows the example; widgets/History do not.
- [ ] App version is `2.0.0`.
- [ ] CI catalog validation and app typecheck/tests pass.
