# CI + TestFlight release pipeline

Date: 2026-07-17  
Status: approved design

## Problem

Daily Vocab has no automated quality gate on pull requests and no repeatable path from `master` to TestFlight. App Store uploads today depend on local Mac/Xcode steps, which is slow and easy to skip.

## Goals

1. Run typecheck, unit tests, and catalog validation on every PR and on `master`.
2. On every merge to `master`, produce a **production-signed** iOS build and auto-submit it to **TestFlight**.
3. Keep **App Store customer release** manual in App Store Connect (select build → submit for review / release).
4. Prefer Expo’s managed path (EAS Build + EAS Submit) over self-hosted Mac runners or Fastlane.

## Non-goals

- Android / Play Store pipelines
- Automatic App Store “Release this version”
- Requiring `content:validate:strict` on the merge gate (can add later)
- Building iOS natively inside GitHub Actions (no macOS runner for archive)
- Changelog / release-note automation

## Decisions

| Topic | Choice |
| --- | --- |
| Hosting | GitHub Actions (repo already on GitHub) |
| PR / merge gate | Single `quality` job: typecheck + test + content:validate |
| Release trigger | Push to `master` + `workflow_dispatch` |
| Build flavor | EAS `production` profile every time (App Store–ready binary) |
| Distribution after build | EAS `--auto-submit` → TestFlight |
| Store release | Manual in App Store Connect |
| Node | 20 (matches README) |
| Auth to EAS | GitHub secret `EXPO_TOKEN` |
| Apple signing | Credentials stored in EAS (`eas credentials`), not in git |

## Architecture

```text
PR opened/updated
  → .github/workflows/ci.yml → quality job
  → branch protection requires quality before merge

Merge to master (or workflow_dispatch)
  → quality gate
  → eas build -p ios --profile production --non-interactive --auto-submit
  → App Store Connect / TestFlight
  → human promotes build to App Store when ready
```

## CI workflow

**File:** `.github/workflows/ci.yml`

**Triggers:** `pull_request`, `push` to `master`

**Job `quality`:**

1. Checkout
2. Setup Node 20 with npm cache keyed on `package-lock.json`
3. `npm ci`
4. `npm run typecheck`
5. `npm test`
6. `npm run content:validate`

No EAS or Apple secrets required for CI.

**Repo setting (manual):** protect `master` and require the `quality` check.

## Release workflow

**File:** `.github/workflows/release-ios.yml`

**Triggers:** `push` to `master`, `workflow_dispatch`

**Jobs:**

1. `quality` — duplicate the same steps as `ci.yml` (v1 keeps workflows independent; no reusable workflow yet) so a bad push cannot skip checks.
2. `ios-testflight` — `needs: quality`:
   - Checkout
   - Setup Node 20
   - `npm ci`
   - Run EAS via `npx eas-cli@<pinned-version>` (pin a concrete version at implementation)
   - `eas build -p ios --profile production --non-interactive --auto-submit`
   - Env: `EXPO_TOKEN` from GitHub secrets

Pipeline success means “submitted to App Store Connect,” not “installable on TestFlight yet” (Apple processing can lag).

## EAS configuration

**File:** `eas.json` (new)

- `build.production`: iOS App Store distribution; enable `autoIncrement` for iOS build number so each master merge can upload a new binary without hand-editing CFBundleVersion every time.
- `submit.production`: default ASC submit target (team/app resolved via EAS-linked Apple credentials).

**App config:** add `extra.eas.projectId` when the Expo project is linked (`eas init` / `eas build:configure`). Keep existing `ios.bundleIdentifier` `com.dailyvocab.app`.

Marketing `version` in `app.config.ts` remains a deliberate bump when you want a new user-facing version string; build number auto-increments per upload.

## Secrets and one-time setup

Not committed to git:

1. Create or link Expo project; write `projectId` into `app.config.ts`.
2. Commit `eas.json` from `eas build:configure`.
3. Configure Apple distribution + App Store Connect API access in EAS for `com.dailyvocab.app`.
4. Create GitHub Actions secret `EXPO_TOKEN` (Expo access token with build/submit rights).
5. Enable branch protection on `master` requiring `quality`.
6. Run one successful `master` (or `workflow_dispatch`) pipeline to prove TestFlight end-to-end.

## Failure handling

| Failure | Behavior |
| --- | --- |
| CI red on PR | Merge blocked when protection is on |
| CI red on master push | Release job does not run (`needs: quality`) |
| EAS build or submit fails | Workflow fails; fix and re-run via `workflow_dispatch` or a new commit |
| TestFlight processing delay | Expected Apple lag; not treated as pipeline failure |

No partial customer App Store release: Connect promotion stays human-gated.

## File inventory

| Path | Action |
| --- | --- |
| `.github/workflows/ci.yml` | Add |
| `.github/workflows/release-ios.yml` | Add |
| `eas.json` | Add |
| `app.config.ts` | Add `extra.eas.projectId` when available |
| `docs/ci-cd.md` | Add short operator guide (secrets, day-to-day loop) |
| `package.json` | Optional: script aliases for local `eas` usage if useful |

## Day-to-day loop

1. Open PR → wait for green `quality`.
2. Merge to `master`.
3. Wait for EAS build + TestFlight submit.
4. Smoke-test the build on a device via TestFlight.
5. In App Store Connect, select that build and submit/release when ready.

## Open setup dependencies

Implementation in-repo can add workflows and `eas.json` templates immediately. A live TestFlight upload still requires Expo project linking, Apple credentials in EAS, and `EXPO_TOKEN` — those are operator steps documented in `docs/ci-cd.md`, not blockers for merging the pipeline files.
