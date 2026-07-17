# Per-level daily words

Date: 2026-07-17  
Status: implemented

## Goal

Changing level updates today’s card **immediately**. Each level keeps its own locked word for the calendar day, so switching Beginner → Hard → Beginner restores the same Beginner word without rolling a new one.

## Model

`DailyState` keeps the active card fields (`level`, `wordId`, `word`, `oneLiner`) plus:

```ts
byLevel: Partial<Record<Level, { wordId, word, oneLiner }>>
```

## `ensureTodaysWord`

- Same day + that level already has a usable lock → return it (switch active level only).
- Same day + level not yet locked → roll for that level only; merge into `byLevel`.
- New day → clear `byLevel`, roll for the requested level.
- Placeholder / missing catalog ids are not usable locks (re-roll).

## UI

Chooser label: “Choose a level” (not “for tomorrow”).

## Widget

Widget still shows the active level’s snapshot. App storage holds the full `byLevel` map.
