# Home polish + daily word lock

Date: 2026-07-16  
Status: implemented

## Problem

- Cold start loading is a bare spinner with no brand presence.
- Level chips use the same size when selected; motion is mild; there is no sound.
- Same-day level changes re-roll today’s word, so users can farm new words by switching levels.

## Goals

1. Soft study-desk visual refresh with a branded loading state.
2. Selected level reads larger; jelly spring on select plus a short jelly/boing sound.
3. One locked word per calendar day from the **saved level preference**; level taps after that update preference only until the next day.

## Non-goals

- Per-level daily words or shared catalog index across levels.
- Changing native widget layout beyond continuing to push the locked snapshot.
- Multi-screen navigation or onboarding.

## Decisions

| Topic | Choice |
| --- | --- |
| Persistence model | Single `DailyState` per day (Approach 1) |
| Catalog source for first roll | Saved level preference (`dailyvocab.level`) |
| Same-day level change | Save new level; **do not** re-roll word |
| Visual direction | Soft study desk (warm paper, ink green, calm type) |
| Sound | Bundled short jelly/boing; soft-fail if audio unavailable |

## Domain: `ensureTodaysWord`

### New rule

If `state` exists and `state.localDate === today`, return `state` unchanged — **even when `input.level !== state.level`**.

Re-roll only when:

- `state` is null, or
- `state.localDate !== today`

When re-rolling, pick from `catalog[input.level]` (the caller’s saved preference), keep the existing “avoid previous `wordId`” guard, and set `DailyState.level` to `input.level` (the level used for that day’s pick).

### Call sites

**Boot (`HomeScreen` effect)**  
Load saved level + state → if level exists, `ensureTodaysWord({ level: savedLevel, ... })` → persist + widget push. Word freezes for the day once written.

**Level tap**  
- Always `saveLevel(nextLevel)` and update selected UI.
- Do **not** call `ensureTodaysWord` with the new level in a way that can re-roll. Either:
  - call `ensureTodaysWord` only when there is no valid today state yet (first pick ever / no saved word), or
  - call it with current state and rely on the new same-day short-circuit (preferred: one code path).
- If today already has a word, keep showing that word; do not overwrite `dailyState` with a new roll.
- Widget: push the **locked** daily snapshot (unchanged word). Optionally omit re-push on level-only taps to reduce native churn; either is fine if snapshot content is identical.

### Tests

Update `src/domain/ensureTodaysWord.test.ts`:

- Replace “level change same day re-rolls” with “level change same day returns existing state without calling `randomInt`”.
- Keep: same day+level no re-roll; date change re-rolls from requested level; avoid repeat `wordId` across days.

## UI / motion

### Loading

Full-screen soft paper background (same tokens as home). Brand “Daily Vocab” as the hero. Short “Loading today’s word…” line. Subtle pulsing ink indicator (ActivityIndicator or Reanimated opacity pulse). Shown until prefs + initial ensure finish (`ready === false`).

### Home layout (one composition)

- Background: warm paper with a quiet green wash (gradient or soft radial accent) — refine existing cream/green tokens; avoid purple glow, dark-mode default, and newspaper chrome.
- Typography: expressive but calm — use Expo Google Fonts (e.g. a readable serif or soft display for brand/word, and a clean sans for UI) rather than system defaults alone.
- Brand hero + one supporting line (“Pick a level. One word a day.”).
- Three stacked level chips.
- Today block: word + one-liner + widget tip (one job: show today’s word).

### Level chips

- Unselected: current pill proportions.
- Selected: scale ~1.08–1.12 (slightly larger), stronger ink outline or soft lift; label weight unchanged or slightly bolder.
- Select animation: jelly spring with overshoot (Reanimated `withSpring`, low damping / high stiffness), then settle. Press-in can briefly compress then expand to selected scale.
- Staggered enter on first mount can stay or slightly exaggerate.

### Sound

- Add `expo-audio` (or `expo-av` if that is the Expo 57 standard in this project) dependency.
- Ship a short bundled asset under `assets/sounds/` (jelly/boing).
- Play on successful level select (including re-selecting the same level is optional; prefer play only when selection changes).
- Catch/ignore audio errors so missing asset or silent mode never blocks UI.

## Storage / types

No new AsyncStorage keys. Keep:

- `dailyvocab.level` — preference for **next** day’s catalog (and UI selection).
- `dailyvocab.dailyState` — locked word for `localDate`; its `level` field records which catalog produced that word.

`DailyState` shape unchanged.

## Files likely touched

- `src/domain/ensureTodaysWord.ts` + `.test.ts`
- `src/screens/HomeScreen.tsx`
- `src/components/LevelButton.tsx`
- `src/theme/colors.ts` (and possibly new `typography` / loading component)
- `App.tsx` (font loading if using expo-font)
- `package.json` / lockfile (audio + fonts)
- `assets/sounds/*` (new)
- Optional: `src/audio/playJelly.ts` helper

## Acceptance criteria

1. Cold start shows branded loader until ready, then home.
2. Selected level chip is visibly larger and uses a jelly-style spring; a short jelly sound plays on level change when audio works.
3. After today’s word is set, switching Beginner ↔ Intermediate ↔ Hard keeps the same `word` / `wordId` / `oneLiner`.
4. After local midnight (calendar date change), next ensure rolls a new word from the **currently saved** level preference.
5. Existing typecheck + updated domain tests pass.

## Out of scope follow-ups

- User-facing copy that today’s word stays fixed if they change level mid-day.
- Generating the jelly sound procedurally instead of a file asset.
