# App Store review notes

Short notes for App Store Connect and submission builds.

## What to tell reviewers

Dayink is an offline vocabulary utility. Pick Beginner, Intermediate, or Hard to lock one word for today. Tap the speaker on today’s word to hear the system voice pronounce it. History lists words unlocked this year. On iOS, add the Dayink Lock Screen widget after choosing a level.

No account, no network features, no purchases.

## App Privacy (Nutrition Labels)

Answer **Data Not Collected**. The app stores level, today’s word, and shown-word stamps only on device (AsyncStorage + App Group). No analytics, ads, or tracking SDKs.

Add a **Privacy Policy URL** in App Store Connect even for offline apps. Host a short page that mirrors the in-app line: progress stays on device; nothing is uploaded.

## Permissions

Playback-only click sound via `expo-audio`. Config must keep:

- `microphonePermission: false`
- `recordAudioAndroid: false`
- `enableBackgroundPlayback: false`
- `enableBackgroundRecording: false`

After changing plugins, run a fresh `npx expo prebuild -p ios` before archive so Info.plist does not gain unused microphone or background-audio modes.

## Export compliance

`ITSAppUsesNonExemptEncryption` is set to `false` in `app.config.ts` (standard HTTPS / no custom crypto).

## Age rating

Catalogs are enrichment vocabulary for teens/adults learning English. Prefer **12+** (or higher if Connect questions require it). Do not market as a children’s app.

## Build checklist

1. `npm test` and `npm run content:validate:strict`
2. `npm run content:sync`
3. Fresh iOS prebuild with Apple Team ID
4. Confirm widget target is in the archive
5. Smoke: first launch → choose level → History → Lock Screen widget
