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

# Local `ios/` is gitignored and does not refresh from assets/ on expo run:ios.
# Keep the Xcode AppIcon catalog in sync when a prebuild tree is present.
APPICON_1024="$ROOT/ios/Dayink/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png"
if [ -f "$APPICON_1024" ]; then
  cp "$OUT/icon.png" "$APPICON_1024"
  echo "Synced AppIcon catalog: $APPICON_1024"
fi

echo "Exported Dayink icon assets into assets/"
file "$OUT/icon.png" "$OUT/splash-icon.png" "$OUT/android-icon-foreground.png" \
  "$OUT/android-icon-background.png" "$OUT/android-icon-monochrome.png" "$OUT/favicon.png"
