# CI / CD (TestFlight)

Automated quality checks run on every pull request. Merges to `master` also kick off a production iOS EAS build that auto-submits to TestFlight. Promoting a build to App Store customers stays manual in App Store Connect.

## What runs where

| Event | Workflow | What it does |
| --- | --- | --- |
| Pull request | `CI` (`.github/workflows/ci.yml`) | `typecheck`, `test`, `content:validate` |
| Push to `master` | `CI` + `Release iOS (TestFlight)` | Same quality gate, then EAS production build + submit |
| Manual | `Release iOS (TestFlight)` → Run workflow | Re-run release without a new commit |

The release job starts the EAS build with `--no-wait`. Watch build/submit progress at [expo.dev](https://expo.dev) (and App Store Connect → TestFlight after submit finishes).

## One-time setup

1. **Expo project** — from the repo root (logged into Expo CLI):

   ```bash
   npx eas-cli@21.0.2 init
   ```

   Commit the generated `extra.eas.projectId` in `app.config.ts` when `eas init` writes it.

2. **Apple credentials in EAS** — for bundle id `com.dailyvocab.app`:

   ```bash
   npx eas-cli@21.0.2 credentials
   ```

   Configure App Store distribution certificates/profiles and App Store Connect API key access as prompted so non-interactive CI can build and submit.

3. **GitHub secret** — create repository secret `EXPO_TOKEN` (Expo access token with permission to build and submit).

4. **Branch protection** — protect `master` and require the GitHub check **`quality`** from the CI workflow before merge.

5. **Smoke** — merge a no-op PR or run **Release iOS (TestFlight)** via `workflow_dispatch`, then confirm a build appears on expo.dev and later in TestFlight.

## Day-to-day

1. Open a PR and wait for green **quality**.
2. Merge to `master`.
3. Wait for EAS to finish build + submit (expo.dev / email).
4. Install from TestFlight and smoke-test.
5. In App Store Connect, select that build and submit/release when ready.

Bump the user-facing `version` in `app.config.ts` when you want a new marketing version. iOS **build numbers** auto-increment via EAS (`autoIncrement`).

## Failure notes

- Missing `EXPO_TOKEN` → release job fails fast with a pointer to this doc.
- Missing `extra.eas.projectId` or Apple credentials → EAS build fails on expo.dev; fix with `eas init` / `eas credentials`, then re-run the workflow.
- Pipeline green with `--no-wait` means “EAS accepted the build request,” not “TestFlight installable yet.”
