# Example Sentence + Full Re-tier (v2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-tier all 3,000 catalog words by frequency (with overrides), hand-write an `example` sentence for every entry, show it only on the Home Today card, and ship as app `2.0.0`.

**Architecture:** Content-first workflow — frequency re-tier script writes locked catalogs; sentence authoring fills required `example`; domain + Home consume `example` without putting it on `DailySnapshot` / widgets. Sync scripts copy JSON into Android/iOS widget asset folders as today.

**Tech Stack:** TypeScript/Zod catalogs, `tsx` content tools, Vitest, Expo HomeScreen, existing `content:sync`.

## Global Constraints

- Ship **2.0.0 only after** full re-tier + all ~3,000 hand-written examples.
- Exactly **1,000 words per level**; **no cross-level lemma overlaps**.
- Field name is **`example`**; Home Today card only; never on widgets / History / `DailySnapshot`.
- Prefer **lemma** in the sentence; **≤ 120** characters; must contain the lemma (case-insensitive).
- Prefer keeping existing **`id`** when a lemma moves level.
- This repo uses **one commit per branch** — amend into the feature branch; do not stack commits.
- TTS stays **word-only**.

---

### File map

| File | Responsibility |
| --- | --- |
| `content/tools/catalogSchema.ts` | `example` field + length/contains-lemma quality rules |
| `content/tools/oneLinerQuality.ts` / new `exampleQuality.ts` | Shared example validators |
| `content/tools/validate-catalog.test.ts` | Schema/quality unit tests |
| `content/sources/lemma-frequency.json` | Checked-in lemma → frequency rank (generated once) |
| `content/sources/level-overrides.json` | Manual force-to-level moves (revelry, blandish, …) |
| `content/tools/build-lemma-frequency.ts` | Generate frequency file (e.g. via `wordfreq` or ranked corpora) |
| `content/tools/retier-catalogs.ts` | Merge pool → frequency bands → apply overrides → write catalogs |
| `content/words/{beginner,intermediate,hard}.json` | Source of truth catalogs |
| `content/tools/author-examples-progress.md` | Batch checklist for sentence waves |
| `src/domain/types.ts` | `LockedWord` / `DailyState` include `example` |
| `src/domain/ensureTodaysWord.ts` | Copy `example` into locked state |
| `src/screens/HomeScreen.tsx` | Render example under one-liner |
| `src/native/widgetBridge.ts` | **Do not** add `example` to `DailySnapshot` |
| `app.config.ts` / `package.json` | Version `2.0.0` |
| Widget asset copies | Via `npm run content:sync` |

---

### Task 1: Schema + validation for `example` (optional until content complete)

**Files:**
- Modify: `content/tools/catalogSchema.ts`
- Create: `content/tools/exampleQuality.ts`
- Modify: `content/tools/validate-catalog.test.ts`

**Interfaces:**
- Produces: `EXAMPLE_MAX = 120`, `isValidExample(word, example)`, optional `example` on `WordEntrySchema` until Task 5 flips required

- [ ] **Step 1: Write failing tests** for example length, empty, missing-lemma

```ts
import { isValidExample } from './exampleQuality';

test('rejects example that omits the lemma', () => {
  expect(isValidExample('revelry', 'The party went late into the night.')).toBe(false);
});

test('accepts lemma with different casing', () => {
  expect(isValidExample('revelry', 'Revelry filled the streets after the win.')).toBe(true);
});
```

- [ ] **Step 2: Run** `npx vitest run content/tools/validate-catalog.test.ts content/tools/exampleQuality.test.ts` — expect FAIL

- [ ] **Step 3: Implement** `exampleQuality.ts` + extend schema with **optional** `example: z.string().max(EXAMPLE_MAX).optional()` and quality checks when `example` is present

- [ ] **Step 4: Run tests** — expect PASS

- [ ] **Step 5: Stage** (amend later on feature branch)

---

### Task 2: Frequency source + overrides file

**Files:**
- Create: `content/tools/build-lemma-frequency.ts`
- Create: `content/sources/lemma-frequency.json` (generated artifact)
- Create: `content/sources/level-overrides.json`

**Interfaces:**
- Produces: map `{ [lemma: string]: number }` higher = more common (or document sort order in script header)
- Overrides shape: `{ "revelry": "intermediate", "blandish": "intermediate", ... }`

- [ ] **Step 1: Install tooling once** (local/CI doc): `pip3 install wordfreq` **or** embed a static Google-10k/wordfreq dump — prefer generating `lemma-frequency.json` and committing it so CI does not need Python

- [ ] **Step 2: Script** loads all lemmas from current catalogs, looks up Zipf/frequency, writes `lemma-frequency.json`

- [ ] **Step 3: Seed overrides** with at least:

```json
{
  "revelry": "intermediate",
  "blandish": "intermediate"
}
```

- [ ] **Step 4: Run generator; commit frequency JSON + overrides**

- [ ] **Step 5: Document** in script header: sort key = descending frequency → Beginner = top 1000, Intermediate = next 1000, Hard = remaining 1000

---

### Task 3: Re-tier catalogs

**Files:**
- Create: `content/tools/retier-catalogs.ts`
- Modify: `content/words/*.json`
- Add npm script: `"content:retier": "tsx content/tools/retier-catalogs.ts"`

**Interfaces:**
- Consumes: catalogs + `lemma-frequency.json` + `level-overrides.json`
- Produces: three catalogs, still **without** requiring `example`; preserve `id`/`oneLiner` per lemma

- [ ] **Step 1: Implement retier**
  1. Index all entries by lemma → `{ id, word, oneLiner }`
  2. Sort by frequency (missing lemmas → treat as rare / Hard end)
  3. Slice into three bands of 1000
  4. Apply overrides: move lemma to forced level; for each move, swap with the edge word of the target band (or re-pack) so counts stay 1000
  5. Assign `level` on catalog; keep ids; write JSON with trailing newline

- [ ] **Step 2: Dry-run log** counts moved (e.g. beginner→hard) and list overrides applied

- [ ] **Step 3: Run** `npm run content:retier && npm run content:validate:strict`

- [ ] **Step 4: Spot-check** `revelry` not in beginner; `blandish` not in hard (per overrides)

- [ ] **Step 5: Freeze re-tier** — further catalog edits only via overrides + re-run, or critical hotfixes

---

### Task 4: Hand-write all `example` sentences

**Files:**
- Modify: `content/words/*.json` (every entry)
- Create: `content/tools/author-examples-progress.md` (batch tracker)

**Interfaces:**
- Every word gains `example` string meeting `isValidExample`

- [ ] **Step 1: Author in batches of ≤100** per level (Beginner → Intermediate → Hard). Each sentence is carefully written (not templated). Track batches in `author-examples-progress.md`.

- [ ] **Step 2: After each batch** run a small check:

```bash
npx tsx -e "/* load catalogs; assert present examples pass isValidExample */"
```

Or extend validate with `--require-example` flag.

- [ ] **Step 3: Continue until 3000/3000** — do not start Task 5/6 until complete

- [ ] **Step 4: Human spot-review** awkward sentences; fix in place

---

### Task 5: Require `example` in schema + sync bundles

**Files:**
- Modify: `content/tools/catalogSchema.ts` — `example` required
- Modify: validate tests
- Run: `npm run content:sync`

- [ ] **Step 1: Make `example` required** in `WordEntrySchema`

- [ ] **Step 2: `npm run content:validate:strict` + tests** — PASS

- [ ] **Step 3: `npm run content:sync`** — Android + iOS widget JSON updated (widget UI still ignores `example`)

---

### Task 6: Domain + Home UI + version 2.0.0

**Files:**
- Modify: `src/domain/types.ts`, `ensureTodaysWord.ts`, related tests
- Modify: `src/screens/HomeScreen.tsx`
- Modify: `app.config.ts`, `package.json`, `package-lock.json` root version → `2.0.0`
- Confirm: `src/native/widgetBridge.ts` snapshot type unchanged (no `example`)

**Interfaces:**
- `LockedWord` / `DailyState` include `example: string`
- Home shows muted line under one-liner

- [ ] **Step 1: Failing unit tests** for ensureTodaysWord copying `example`

- [ ] **Step 2: Implement domain plumbing**

- [ ] **Step 3: Home UI** — below one-liner:

```tsx
<Text style={[styles.example, { color: colors.inkMuted }]}>{today.example}</Text>
```

Style: slightly smaller than one-liner, comfortable line height; no cards.

- [ ] **Step 4: Bump version to `2.0.0`**

- [ ] **Step 5: `npm test && npm run typecheck && npm run content:validate:strict`**

- [ ] **Step 6: Mark design spec Status: implemented; amend single branch commit; open PR when asked**

---

## Spec coverage checklist

| Spec item | Task |
| --- | --- |
| Frequency re-tier + overrides | 2–3 |
| Hand-written examples for all | 4 |
| Home-only UI | 6 |
| No widget/History/snapshot example | 6 (explicit non-change) |
| 2.0.0 ship gate after content | 5–6 |
| 1000/level + no overlaps | 3 + validate |
| id preservation | 3 |
