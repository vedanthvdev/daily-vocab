# Dayink product rename

Date: 2026-07-17  
Status: approved design

## Problem

The App Store / Play-facing name **Daily Vocab** is already used by other apps. **Inkday** was preferred but is taken on Google Play (Boox planner). The product needs a calm, study-desk identity that is free enough for store listing before first TestFlight / Play upload.

## Goals

1. Rebrand the product to **Dayink** (display name, widget, in-app copy).
2. Complete a **full identity rename** before first TestFlight: bundle ID, Android package, App Group, URL scheme, Expo slug, storage key prefix.
3. Keep the existing soft study-desk visual language unchanged.
4. Leave the GitHub repo / local folder name as `daily-vocab` (no forced VCS rename).

## Non-goals

- Visual redesign or new icon set beyond string/config updates required by the rename
- Migrating AsyncStorage / App Group data from `dailyvocab.*` (app not shipped; fresh keys only)
- Renaming the GitHub repository or local checkout directory
- Final legal trademark clearance (operator confirms uniqueness in Connect / Play Console at submit)
- Completing Apple credential setup in this rename (depends on Xcode / Team ID; tracked separately)

## Decisions

| Topic | Choice |
| --- | --- |
| Display name | **Dayink** |
| Rename depth | Full identity before first TestFlight (Approach 2) |
| Bundle / package | `com.dayink.app` |
| App Group | `group.com.dayink.app` |
| URL scheme | `dayink` |
| Expo slug | `dayink` |
| Storage keys | `dayink.*` (no migration from `dailyvocab.*`) |
| Repo / folder | Keep `daily-vocab` |
| Why not Inkday | Taken on Play Store |

## Identity map

| Slot | Old | New |
| --- | --- | --- |
| Display name | Daily Vocab | Dayink |
| Bundle ID | `com.dailyvocab.app` | `com.dayink.app` |
| Android package | `com.dailyvocab.app` | `com.dayink.app` |
| App Group | `group.com.dailyvocab.app` | `group.com.dayink.app` |
| URL scheme | `dailyvocab` | `dayink` |
| Expo slug | `daily-vocab` | `dayink` |
| Widget display name | Daily Vocab | Dayink |
| Storage prefix | `dailyvocab.` | `dayink.` |

## Scope — files / surfaces

### Config and native identity

- `app.config.ts` — `name`, `slug`, `scheme`, `ios.bundleIdentifier`, `android.package`, App Group entitlement, `extra.eas.projectId` when Expo project changes
- `targets/DailyVocabWidget/` — display strings, widget URL scheme, App Group suite; rename target/folder to `DayinkWidget` where practical without breaking `@bacons/apple-targets` wiring
- `modules/widget-bridge` — App Group suite name (iOS / shared)

### App UI and copy

- Brand strings in `HomeScreen`, `BrandedLoader`, widget tip copy
- Docs: `README.md`, `docs/ci-cd.md`, `docs/widget-setup.md`, `docs/app-store-review-notes.md`, widget READMEs

### Persistence

- `src/storage/appPreferences.ts` (and any other `dailyvocab.` keys) → `dayink.` prefix

### CI / EAS follow-through

- Update operator docs that still cite `com.dailyvocab.app`
- Create or rename Expo project to slug `dayink`; commit the new `extra.eas.projectId` if Expo issues a new id
- After Xcode is available: configure EAS Apple credentials for `com.dayink.app` (not part of the rename code change itself)

## Risks

- Existing Expo project `@chintuvedanth/daily-vocab` must not remain the production EAS target after rename — link/create **dayink** and update `projectId`.
- Devices that installed a pre-rename build (if any) will not share App Group / prefs with Dayink; acceptable pre-launch.
- Store listing uniqueness for “Dayink” should be re-checked in App Store Connect and Play Console at submit time.

## Verification

1. `npm run typecheck`, `npm test`, `npm run content:validate`
2. Repo grep finds no remaining product-facing `Daily Vocab`, `dailyvocab` scheme/bundle, or `com.dailyvocab` (docs/history under `docs/superpowers/` may keep historical names)
3. UI smoke: loader and home brand show **Dayink**; widget configuration name matches
4. `app.config.ts` identity fields match the identity map above

## Out of band (resume after Xcode)

Apple Team ID → EAS credentials for `com.dayink.app` → optional smoke `workflow_dispatch` of Release iOS once rename + credentials land on `master`.
