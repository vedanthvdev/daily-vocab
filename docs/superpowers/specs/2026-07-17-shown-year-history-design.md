# Shown-year history and no-repeat picks

Date: 2026-07-17  
Status: implemented

## Goal

Avoid showing the same word again within a two-year window, keep the app offline and lightweight, and unlock a History view of this year’s words. Support a future v2 word pack when v1 has no eligible words left.

## Storage

Local user state only (not catalog JSON):

- App: AsyncStorage `shownYearByWordId`
- Native: same map in App Group / SharedPreferences (synced on stamp)

## Year digit

`year % 10` (2026 → `6`).

## Skip rule

When picking a new word, exclude stamps equal to `currentDigit` or `(currentDigit - 1 + 10) % 10`.

## Stamp

When today’s word is locked (app or widget roll).

## Packs

`words` in each catalog JSON is pack **v1**. Optional `packs.v2` holds overflow. Pick eligible from v1, then v2, then any except yesterday’s id.

## History UI

Lists words stamped with this year’s digit, with level label.
