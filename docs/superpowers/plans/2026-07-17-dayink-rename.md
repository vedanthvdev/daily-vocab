# Dayink Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the product to Dayink with full identity rename (display name, bundle/package, App Group, scheme, Expo slug, storage keys, widget/copy/docs) before first TestFlight.

**Architecture:** Mechanical string/config/native-identity updates across Expo config, React Native UI, widget-bridge, WidgetKit target, and operator docs. Create/link Expo project slug `dayink` and update `extra.eas.projectId`. Historical specs under `docs/superpowers/` may keep old names.

**Tech Stack:** Expo `app.config.ts`, AsyncStorage keys, Swift WidgetKit, Android Glance/Kotlin prefs, Markdown docs, EAS.

## Global Constraints

- Display name **Dayink**; bundle/package **`com.dayink.app`**; App Group **`group.com.dayink.app`**; scheme **`dayink`**; Expo slug **`dayink`**; storage prefix **`dayink.`**
- No migration from `dailyvocab.*` keys
- Keep GitHub repo / folder name `daily-vocab`
- Branch `chore/dayink-rename-spec` keeps **exactly one commit** (amend)
- Do not push/merge unless asked
- Leave historical `docs/superpowers/specs|plans` other than the Dayink rename spec as-is
- `package.json` name may stay `daily-vocab` (npm package name ≠ product name) unless a step explicitly changes it — prefer leave npm name to avoid lockfile churn; product identity lives in `app.config.ts`

## File map

| Area | Files |
| --- | --- |
| Config | `app.config.ts` |
| Storage | `src/storage/appPreferences.ts` |
| UI | `src/components/BrandedLoader.tsx`, `src/screens/HomeScreen.tsx` |
| iOS widget | `targets/DailyVocabWidget/**` (rename folder/types to Dayink where practical) |
| Bridge | `modules/widget-bridge/**` |
| Docs | `README.md`, `docs/ci-cd.md`, `docs/widget-setup.md`, `docs/app-store-review-notes.md` |
| Scripts | `package.json` content:sync path if widget folder renamed |

---

### Task 1: App config + storage + UI strings

**Files:** `app.config.ts`, `src/storage/appPreferences.ts`, `src/components/BrandedLoader.tsx`, `src/screens/HomeScreen.tsx`

- [ ] Update `app.config.ts` identity fields per Global Constraints (keep existing `projectId` until Task 4 Expo step).
- [ ] Change storage keys to `dayink.level`, `dayink.dailyState`, `dayink.shownYearByWordId`.
- [ ] Replace UI brand/tip strings with Dayink.
- [ ] Run `npm test` and `npm run typecheck`.

### Task 2: WidgetKit target + iOS bridge

**Files:** `targets/DailyVocabWidget/**`, `modules/widget-bridge/ios/**`

- [ ] Update App Group, scheme URL, display names, default word placeholder, widget kind string consistently (`DayinkWidget`).
- [ ] Rename target folder/files/`expo-target.config.js` `name` to DayinkWidget when required by bacons/apple-targets; update `package.json` sync script path.
- [ ] Update `WidgetBridgeModule.swift` suite + reload kind.

### Task 3: Android bridge

**Files:** `modules/widget-bridge/android/**`

- [ ] Rename prefs / unique worker ids to `dayink_*`.
- [ ] Rename Glance widget classes to Dayink* where referenced; update default placeholder string to Dayink.
- [ ] Update AndroidManifest / receiver class names if present.

### Task 4: Docs + Expo project link

**Files:** `README.md`, `docs/*.md` (not historical superpowers specs except ci-cd), `app.config.ts` projectId

- [ ] Update operator/user-facing docs to Dayink / `com.dayink.app`.
- [ ] `eas init --force` / create `@chintuvedanth/dayink` (or rename) and set `extra.eas.projectId`.
- [ ] Grep product-facing leftovers; run quality gate; amend single branch commit.
