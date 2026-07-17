
# Pronounce today’s word (Home)

Date: 2026-07-17  
Status: implemented

## Problem

Users learning vocabulary need to hear how today’s word is said. Dayink stays offline and already shows a locked word on Home; there is no pronunciation control.

## Goals

1. On Home, when today’s word is visible, show a clean speaker control that blends into the word card.
2. Tap speaks **only the word** using the device OS text-to-speech engine (no network).
3. Keep the change small: Home Today card only.

## Non-goals

- Speaker on History rows or widgets.
- Speaking the one-liner / definition.
- Custom or bundled voice packs, IPA display, or cloud TTS.
- New microphone / recording permissions.
- Changing daily-lock, widget, or catalog behavior.

## Decisions

| Topic | Choice |
| --- | --- |
| Engine | `expo-speech` → iOS `AVSpeechSynthesizer` / Android `TextToSpeech` |
| Scope | Home Today card only (when `today` is set) |
| Utterance | The locked `today.word` string only |
| Language | Prefer available `en-GB`, then `en-US`, else device default |
| Repeat tap | Stop current utterance, then speak again |
| Failure | Silent no-op (no alert); keep UI usable |
| Visual | Subtle speaker at top-right of the word card; muted ink; minimal chrome |
| A11y | Button role; label “Pronounce today’s word” |

## UX

1. Empty state (“Choose a level…”) — no speaker.
2. After today’s word locks — speaker appears top-right inside the existing card, aligned with the “Today · Level” row / word block so it reads as part of the card, not a floating FAB.
3. Tap — OS voice speaks the word once at a slightly slower rate if the API allows (helps learners); rate kept conservative so it still sounds natural.
4. Rapid taps — cancel in-flight speech, start fresh.

## Architecture

```
HomeScreen (today.word)
  → SpeakWordButton
  → speakWord(word)  // src/audio/speakWord.ts
  → expo-speech Speech.speak / Speech.stop
```

- Add dependency `expo-speech` (Expo SDK 57-compatible version).
- No App Group / widget bridge changes.
- No catalog schema changes.

## Privacy / Store

- Still **Data Not Collected**; speech runs on-device.
- No new network calls.
- Review notes: optional one-line mention that pronunciation uses the system voice offline.
- Keep existing `expo-audio` playback-only config unchanged (click sound); speech does not require mic permission.

## Limitations (accepted)

- Pronunciation quality and accent depend on the OS voice and device language packs.
- Rare / GRE lemmas may be stressed incorrectly; no phonetic override in v1.
- If TTS is unavailable on a device, the button does nothing audible.

## Test plan

- [ ] Fresh install → choose level → speaker appears on Today card
- [ ] Tap speaks the word; second tap restarts cleanly
- [ ] Airplane mode: speech still works
- [ ] History has no speaker
- [ ] Empty Home (no level yet) has no speaker
- [ ] VoiceOver announces “Pronounce today’s word”
- [ ] iPhone + iPad smoke; Android if available

## Out of scope follow-ups

- Prefer user locale explicitly in Settings.
- History pronunciation.
- Optional slower “practice” rate toggle.
