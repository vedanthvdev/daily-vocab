# Pronounce today’s word Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an offline OS text-to-speech speaker on the Home Today word card.

**Architecture:** Thin `speakWord()` wrapper around `expo-speech`, a small `SpeakWordButton` in the Today card, language preference `en-GB` → `en-US` → default. No widget/History changes.

**Tech Stack:** Expo 57, React Native, `expo-speech`, existing Home theme colors.

---

### File map

| File | Responsibility |
| --- | --- |
| `src/audio/speakWord.ts` | Stop + speak word; pick English locale |
| `src/audio/speakWord.test.ts` | Unit tests for locale preference / empty input |
| `src/components/SpeakWordButton.tsx` | Subtle speaker control |
| `src/screens/HomeScreen.tsx` | Place button on Today card when `today` is set |
| `package.json` / lockfile | Add `expo-speech` |
| `docs/app-store-review-notes.md` | One-line offline system-voice note |

---

### Task 1: Dependency + speak helper

- [ ] Install `expo-speech` for Expo SDK 57 (`npx expo install expo-speech`)
- [ ] Add `preferEnglishLocale(voices)` pure helper + `speakWord(word)` that stops then speaks at a slightly reduced rate
- [ ] Unit-test locale preference and no-op on empty word
- [ ] Run `npm test` / `npm run typecheck`

### Task 2: UI

- [ ] Add `SpeakWordButton` (Pressable + simple speaker glyph via Text/Unicode or tiny SVG-free icon; muted `inkMuted`; a11y label)
- [ ] On Home Today card, put speaker top-right when `today` is set (row with “Today · Level”)
- [ ] Confirm empty state has no speaker

### Task 3: Docs + ship

- [ ] Mention system-voice pronunciation in `docs/app-store-review-notes.md`
- [ ] Amend single branch commit (spec + implementation)
- [ ] Push and open/update PR when asked
