# Dayink app icon

Date: 2026-07-17  
Status: implemented

## Problem

The store / home-screen icon is still the default Expo blue caret. It does not match Dayink’s study-desk brand (forest ink, cream paper, beginner green) and does not communicate vocabulary / learning.

## Goals

1. Ship a distinctive Dayink icon that reads as **ink entering the mind** at home-screen size.
2. Replace all Expo icon assets so iOS, Android adaptive, splash mark, and favicon stay consistent.
3. Align Android adaptive background color with the icon ground.

## Non-goals

- Changing in-app UI chrome, word cards, or branded loader copy beyond the splash/favicon assets listed below.
- Redesigning App Store screenshots in this change (can follow once the icon ships).
- Marketing site or widget preview artwork outside the standard Expo icon pipeline.
- Animated or 3D icon variants.

## Decisions

| Topic | Choice |
| --- | --- |
| Concept | **C1** — top-down two-hemisphere “walnut” brain on forest ground; beginner-green ink drop falling into the midline |
| Ground | Forest ink `#1A2620` |
| Hemispheres | Cream `#F6F1E8` / soft mint `#E7EFE4` with subtle sulci lines |
| Drop / accent | Beginner green `#3D8F6A` |
| Style | Flat vector; sharp edges; no glossy Expo-style gradients |
| Small-size test | Must remain legible at ~29pt (notification) and Android adaptive safe zone |
| Source of truth | Single vector mark exported to the PNGs below |

## Composition (C1)

1. Full-bleed forest square (iOS master fills the canvas; Android background is the same solid).
2. Cream left hemisphere + slightly cooler cream/mint right hemisphere, meeting at a clear midline.
3. Light wrinkle strokes so the shape reads as a brain (not two ovals).
4. Green teardrop above the midline with a short drip into a green contact point at the crown.

## Assets to replace

| Path | Spec |
| --- | --- |
| `assets/icon.png` | 1024×1024 master (full C1 composition) |
| `assets/android-icon-foreground.png` | Brain + drop only, transparent; content inside Android adaptive safe zone |
| `assets/android-icon-background.png` | Solid `#1A2620` |
| `assets/android-icon-monochrome.png` | Single-color silhouette of drop + hemispheres for themed icons |
| `assets/favicon.png` | Simplified C1 mark at favicon size |
| `assets/splash-icon.png` | Same mark, sized for current splash layout |

## Config

- `app.config.ts` → `android.adaptiveIcon.backgroundColor`: `#1A2620` (replace cream `#F7F3EA`).
- Keep `icon`, `favicon`, and adaptive image paths unchanged (overwrite files in place).

## Implementation notes

- Produce assets from SVG (or equivalent vector) so regenerations stay crisp via `scripts/export-dayink-icon.sh`.
- After asset swap: native rebuild (`expo run:ios` / `expo run:android`) — Metro alone will not refresh home-screen icons.
- Local `ios/` is gitignored; the export script copies `icon.png` into `AppIcon.appiconset` when that tree exists. Uninstall the app on simulators before reinstall if SpringBoard caches the old mark.
- Smoke: cold install on iPhone and Android launcher; check light/dark themed icon on Android 13+ if available.

## Risks

- Over-detailed sulci may muddy at small sizes — prefer 2–4 strokes max.
- Pink/cartoon brain treatments were rejected; stay on cream/forest/green only.
- Monochrome must still read as “drop + two lobes” without color cues.
