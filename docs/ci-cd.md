# CI / CD (TestFlight + Play internal)

Automated quality checks run on every pull request. Merges to `master` also kick off production EAS builds that auto-submit to **TestFlight** (iOS) and **Play Console internal testing** (Android). Promoting a build to App Store / Play Store customers stays manual in each console.

## What runs where

| Event | Workflow | What it does |
| --- | --- | --- |
| Pull request | `CI` (`.github/workflows/ci.yml`) | `typecheck`, `test`, `content:validate` |
| Push to `master` | `CI` + `Release iOS (TestFlight)` + `Release Android (Play internal)` | Same quality gate, then EAS production build + submit per platform |
| Manual | Either release workflow → Run workflow | Re-run that platform’s release without a new commit |

Release jobs start EAS with `--no-wait`. Watch build/submit progress at [expo.dev](https://expo.dev) (then App Store Connect → TestFlight or Play Console → Internal testing after submit finishes).

## One-time setup

1. **Expo project** — from the repo root (logged into Expo CLI):

   ```bash
   npx eas-cli@21.0.2 init
   ```

   Commit the generated `extra.eas.projectId` in `app.config.ts` when `eas init` writes it.

2. **Apple credentials in EAS** — for bundle id `com.dayink.app`:

   ```bash
   npx eas-cli@21.0.2 credentials
   ```

   Configure App Store distribution certificates/profiles and App Store Connect API key access as prompted so non-interactive CI can build and submit for bundle id `com.dayink.app`.

3. **Google Play credentials in EAS** — for package `com.dayink.app` (Play Console account: `chintudon123@gmail.com`):

   1. Create the Play app (if missing): Play Console → Create app → **Dayink**, package **`com.dayink.app`**, free.
   2. Publish `docs/privacy-policy.html` to a public HTTPS URL (e.g. GitHub Pages) and set it as the Privacy policy URL in Play Console.
   3. Complete Data safety (“no data collected”), content rating, and at least two phone screenshots so internal testing can ship. See [play-store-listing.md](./play-store-listing.md).
   4. Create a Google Cloud **service account** + JSON key; enable **Google Play Android Developer API**; invite that service account email in Play Console → Users and permissions with rights to create/manage releases and testing tracks. Guide: [expo/fyi creating-google-service-account](https://github.com/expo/fyi/blob/main/creating-google-service-account.md).
   5. Upload the JSON into EAS:

      ```bash
      npx eas-cli@21.0.2 credentials -p android
      ```

      Choose the production profile → Google Service Account → upload the key (or Expo dashboard → Credentials → Android → `com.dayink.app`).
   6. **First AAB bootstrap:** Play often requires one manual AAB before API submits work. After Android store-build fixes are on `master`, run a production Android build (workflow_dispatch **Release Android** or `eas build -p android --profile production`), download the `.aab`, upload it once under Internal testing in Play Console, then CI auto-submit can continue.

4. **GitHub secret** — create repository secret `EXPO_TOKEN` (Expo access token with permission to build and submit). Same secret covers iOS and Android.

5. **Branch protection** — protect `master` and require the GitHub check **`quality`** from the CI workflow before merge.

6. **Smoke** — merge a no-op PR or run each release workflow via `workflow_dispatch`, then confirm builds on expo.dev and later in TestFlight / Play internal testing.

## Day-to-day

1. Open a PR and wait for green **quality**.
2. Merge to `master`.
3. Wait for EAS to finish build + submit (expo.dev / email).
4. Install from TestFlight and/or Play internal testers link; smoke-test.
5. When ready for customers: promote in App Store Connect and/or Play Console → Production (manual).

Bump the user-facing `version` in `app.config.ts` when you want a new marketing version. Store **build numbers / versionCode** auto-increment via EAS (`autoIncrement`).

## Failure notes

- Missing `EXPO_TOKEN` → release job fails fast with a pointer to this doc.
- Missing `extra.eas.projectId` or Apple / Play credentials → EAS build or submit fails on expo.dev; fix with `eas init` / `eas credentials`, then re-run the workflow.
- First Android submit fails with “app does not exist” / API errors → finish Play app creation and the first manual AAB upload, then re-run **Release Android**.
- Pipeline green with `--no-wait` means “EAS accepted the build request,” not “installable on TestFlight / internal testing yet.”
