# Dayink App Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Expo default caret with the approved C1 Dayink icon (forest two-hemisphere brain + green ink drop) across all Expo icon assets and Android adaptive config.

**Architecture:** Keep a single SVG source of truth under `assets/brand/`, then rasterize with `rsvg-convert` / ImageMagick into the existing Expo PNG paths. Overwrite assets in place; only `app.config.ts` adaptive background color changes.

**Tech Stack:** SVG, `rsvg-convert`, ImageMagick (`magick`/`convert`), Expo 57 asset pipeline.

## Global Constraints

- Concept is **C1 only**: top-down two hemispheres + green drop on forest `#1A2620`.
- Colors: ground `#1A2620`, left lobe `#F6F1E8`, right lobe `#E7EFE4`, accent `#3D8F6A`.
- Flat vector; max 2–4 sulci strokes; no glossy gradients.
- This repo uses **one commit per branch** — amend into the existing `docs/dayink-app-icon` commit; do not create extra commits.
- Do not commit `.superpowers/` or `docs/app-store-screenshots/`.

---

### File map

| File | Responsibility |
| --- | --- |
| `assets/brand/dayink-icon.svg` | Master C1 composition (1024 viewBox, full forest fill) |
| `assets/brand/dayink-icon-foreground.svg` | Transparent foreground (drop + hemispheres, safe-zone scaled) |
| `assets/brand/dayink-icon-monochrome.svg` | Single-color silhouette for Android themed icons |
| `assets/icon.png` | 1024×1024 iOS / Expo master |
| `assets/android-icon-foreground.png` | 512×512 adaptive foreground |
| `assets/android-icon-background.png` | 512×512 solid forest |
| `assets/android-icon-monochrome.png` | 432×432 monochrome silhouette |
| `assets/favicon.png` | 48×48 favicon |
| `assets/splash-icon.png` | 1024×1024 splash mark (full C1) |
| `app.config.ts` | Adaptive `backgroundColor` → `#1A2620` |
| `scripts/export-dayink-icon.sh` | One-shot raster export from SVG → PNGs |

---

### Task 1: SVG source of truth

**Files:**
- Create: `assets/brand/dayink-icon.svg`
- Create: `assets/brand/dayink-icon-foreground.svg`
- Create: `assets/brand/dayink-icon-monochrome.svg`

**Interfaces:**
- Consumes: approved C1 composition from `docs/superpowers/specs/2026-07-17-dayink-app-icon-design.md`
- Produces: three SVGs with `viewBox="0 0 1024 1024"` that export scripts will rasterize

- [ ] **Step 1: Create brand directory**

```bash
mkdir -p assets/brand
```

- [ ] **Step 2: Write master SVG** (`assets/brand/dayink-icon.svg`)

Use this exact file contents:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="Dayink">
  <rect width="1024" height="1024" fill="#1A2620"/>
  <!-- Green ink drop -->
  <path fill="#3D8F6A" d="M512 96c0 0-64 88-64 136c0 35.3 28.7 64 64 64s64-28.7 64-64c0-48-64-136-64-136z"/>
  <line x1="512" y1="296" x2="512" y2="360" stroke="#3D8F6A" stroke-width="28" stroke-linecap="round"/>
  <!-- Left hemisphere -->
  <path fill="#F6F1E8" d="M496 368C368 368 264 440 248 544C232 656 320 776 448 808C480 824 496 792 496 728Z"/>
  <!-- Right hemisphere -->
  <path fill="#E7EFE4" d="M528 368C656 368 760 440 776 544C792 656 704 776 576 808C544 824 528 792 528 728Z"/>
  <!-- Sulci (2–4 strokes) -->
  <path fill="none" stroke="#1A2620" stroke-width="14" stroke-linecap="round" opacity="0.32" d="M336 496c48-16 96-8 144 24"/>
  <path fill="none" stroke="#1A2620" stroke-width="14" stroke-linecap="round" opacity="0.28" d="M320 592c56-16 112-8 160 32"/>
  <path fill="none" stroke="#1A2620" stroke-width="14" stroke-linecap="round" opacity="0.32" d="M688 496c-48-16-96-8-144 24"/>
  <path fill="none" stroke="#1A2620" stroke-width="14" stroke-linecap="round" opacity="0.28" d="M704 592c-56-16-112-8-160 32"/>
  <!-- Contact point where ink meets mind -->
  <circle cx="512" cy="392" r="28" fill="#3D8F6A"/>
</svg>
```

- [ ] **Step 3: Write foreground SVG** (`assets/brand/dayink-icon-foreground.svg`)

Transparent canvas; scale the mark so content sits inside Android’s ~66% safe zone (roughly centered in the middle 66% of the 1024 square). Use this exact file:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="Dayink foreground">
  <g transform="translate(512 512) scale(0.72) translate(-512 -512)">
    <path fill="#3D8F6A" d="M512 96c0 0-64 88-64 136c0 35.3 28.7 64 64 64s64-28.7 64-64c0-48-64-136-64-136z"/>
    <line x1="512" y1="296" x2="512" y2="360" stroke="#3D8F6A" stroke-width="28" stroke-linecap="round"/>
    <path fill="#F6F1E8" d="M496 368C368 368 264 440 248 544C232 656 320 776 448 808C480 824 496 792 496 728Z"/>
    <path fill="#E7EFE4" d="M528 368C656 368 760 440 776 544C792 656 704 776 576 808C544 824 528 792 528 728Z"/>
    <path fill="none" stroke="#1A2620" stroke-width="14" stroke-linecap="round" opacity="0.32" d="M336 496c48-16 96-8 144 24"/>
    <path fill="none" stroke="#1A2620" stroke-width="14" stroke-linecap="round" opacity="0.28" d="M320 592c56-16 112-8 160 32"/>
    <path fill="none" stroke="#1A2620" stroke-width="14" stroke-linecap="round" opacity="0.32" d="M688 496c-48-16-96-8-144 24"/>
    <path fill="none" stroke="#1A2620" stroke-width="14" stroke-linecap="round" opacity="0.28" d="M704 592c-56-16-112-8-160 32"/>
    <circle cx="512" cy="392" r="28" fill="#3D8F6A"/>
  </g>
</svg>
```

- [ ] **Step 4: Write monochrome SVG** (`assets/brand/dayink-icon-monochrome.svg`)

Single fill `#000000` on transparent (Android themed icon mask). Drop + both hemispheres only — no sulci color dependency:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="Dayink monochrome">
  <g transform="translate(512 512) scale(0.72) translate(-512 -512)">
    <path fill="#000000" d="M512 96c0 0-64 88-64 136c0 35.3 28.7 64 64 64s64-28.7 64-64c0-48-64-136-64-136z"/>
    <line x1="512" y1="296" x2="512" y2="360" stroke="#000000" stroke-width="28" stroke-linecap="round"/>
    <path fill="#000000" d="M496 368C368 368 264 440 248 544C232 656 320 776 448 808C480 824 496 792 496 728Z"/>
    <path fill="#000000" d="M528 368C656 368 760 440 776 544C792 656 704 776 576 808C544 824 528 792 528 728Z"/>
    <circle cx="512" cy="392" r="28" fill="#000000"/>
  </g>
</svg>
```

- [ ] **Step 5: Visual check of SVGs**

Open each SVG in Preview / browser. Confirm: two lobes read as a brain, green drop (or black on mono) hits the midline, forest ground only on master.

- [ ] **Step 6: Stage SVGs (do not commit yet — amend at end of Task 3)**

```bash
git add assets/brand/dayink-icon.svg assets/brand/dayink-icon-foreground.svg assets/brand/dayink-icon-monochrome.svg
```

---

### Task 2: Export script + raster PNGs

**Files:**
- Create: `scripts/export-dayink-icon.sh`
- Modify (overwrite): `assets/icon.png`, `assets/android-icon-foreground.png`, `assets/android-icon-background.png`, `assets/android-icon-monochrome.png`, `assets/favicon.png`, `assets/splash-icon.png`

**Interfaces:**
- Consumes: the three SVGs from Task 1
- Produces: PNGs at the exact sizes Expo already uses

- [ ] **Step 1: Confirm tooling**

```bash
which rsvg-convert magick
```

Expected: both paths print (Homebrew installs are fine).

- [ ] **Step 2: Write export script** (`scripts/export-dayink-icon.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BRAND="$ROOT/assets/brand"
OUT="$ROOT/assets"

rsvg-convert -w 1024 -h 1024 "$BRAND/dayink-icon.svg" -o "$OUT/icon.png"
rsvg-convert -w 1024 -h 1024 "$BRAND/dayink-icon.svg" -o "$OUT/splash-icon.png"
rsvg-convert -w 512 -h 512 "$BRAND/dayink-icon-foreground.svg" -o "$OUT/android-icon-foreground.png"
rsvg-convert -w 432 -h 432 "$BRAND/dayink-icon-monochrome.svg" -o "$OUT/android-icon-monochrome.png"
rsvg-convert -w 48 -h 48 "$BRAND/dayink-icon.svg" -o "$OUT/favicon.png"

magick -size 512x512 "xc:#1A2620" "$OUT/android-icon-background.png"

# Local ios/ is gitignored; sync AppIcon when prebuild tree exists.
APPICON_1024="$ROOT/ios/Dayink/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png"
if [ -f "$APPICON_1024" ]; then
  cp "$OUT/icon.png" "$APPICON_1024"
  echo "Synced AppIcon catalog: $APPICON_1024"
fi

echo "Exported Dayink icon assets into assets/"
file "$OUT/icon.png" "$OUT/splash-icon.png" "$OUT/android-icon-foreground.png" \
  "$OUT/android-icon-background.png" "$OUT/android-icon-monochrome.png" "$OUT/favicon.png"
```

- [ ] **Step 3: Make executable and run**

```bash
chmod +x scripts/export-dayink-icon.sh
./scripts/export-dayink-icon.sh
```

Expected: ends with `Exported Dayink icon assets…` and `file` shows:

- `icon.png` / `splash-icon.png` — 1024×1024 PNG
- `android-icon-foreground.png` / `android-icon-background.png` — 512×512 PNG
- `android-icon-monochrome.png` — 432×432 PNG
- `favicon.png` — 48×48 PNG

- [ ] **Step 4: Spot-check rasters**

```bash
open assets/icon.png assets/android-icon-foreground.png assets/android-icon-monochrome.png assets/favicon.png
```

Confirm C1 matches the approved mock (dark ground, cream lobes, green drop). If lobes look wrong, tweak SVG paths in Task 1 and re-run the script — do not hand-edit PNGs.

- [ ] **Step 5: Stage assets + script**

```bash
git add scripts/export-dayink-icon.sh \
  assets/icon.png assets/splash-icon.png assets/favicon.png \
  assets/android-icon-foreground.png assets/android-icon-background.png \
  assets/android-icon-monochrome.png
```

---

### Task 3: Config + ship

**Files:**
- Modify: `app.config.ts` (android adaptive `backgroundColor`)
- Modify: `docs/superpowers/specs/2026-07-17-dayink-app-icon-design.md` (status → implemented after assets land)

**Interfaces:**
- Consumes: exported PNGs and existing `icon` / adaptive paths in `app.config.ts`
- Produces: config that matches forest ground `#1A2620`

- [ ] **Step 1: Update adaptive background color**

In `app.config.ts`, change:

```ts
adaptiveIcon: {
  backgroundColor: '#F7F3EA',
```

to:

```ts
adaptiveIcon: {
  backgroundColor: '#1A2620',
```

Leave `foregroundImage`, `backgroundImage`, and `monochromeImage` paths unchanged.

- [ ] **Step 2: Mark spec implemented**

In `docs/superpowers/specs/2026-07-17-dayink-app-icon-design.md`, set:

```markdown
Status: implemented
```

- [ ] **Step 3: Typecheck (sanity)**

```bash
npm run typecheck
```

Expected: exit 0 (config-only change).

- [ ] **Step 4: Amend single branch commit**

```bash
git add app.config.ts docs/superpowers/specs/2026-07-17-dayink-app-icon-design.md \
  assets/brand scripts/export-dayink-icon.sh \
  assets/icon.png assets/splash-icon.png assets/favicon.png \
  assets/android-icon-foreground.png assets/android-icon-background.png \
  assets/android-icon-monochrome.png

git commit --amend -m "$(cat <<'EOF'
docs/dayink-app-icon: Ship Dayink C1 app icon

Replaced the Expo default caret with the forest two-hemisphere brain and green ink-drop mark across Expo icon assets, and set the Android adaptive background to forest ink.
EOF
)"
```

Only amend if HEAD was created on this branch and has not been pushed, or force-push after amend per repo branch rules.

- [ ] **Step 5: Native smoke (manual)**

```bash
npx expo run:ios
```

Expected: after install, home-screen icon shows C1 (not blue caret). Metro reload alone is insufficient — needs a native rebuild.

Optional Android:

```bash
npx expo run:android
```

Confirm adaptive icon and (if available) monochrome themed icon.

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| C1 concept + colors | Task 1 |
| `icon.png` 1024 | Task 2 |
| Android foreground / background / monochrome | Task 2 |
| favicon + splash-icon | Task 2 |
| `backgroundColor` `#1A2620` | Task 3 |
| Vector source of truth | Task 1 + export script |
| Native rebuild smoke | Task 3 Step 5 |
| No in-app UI / screenshot redesign | Out of scope (no tasks) |
