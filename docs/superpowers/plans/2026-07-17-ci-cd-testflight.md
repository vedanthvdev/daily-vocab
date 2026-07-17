# CI + TestFlight Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add GitHub Actions quality gates on PRs/`master` and an EAS production iOS build that auto-submits to TestFlight on every `master` merge, while leaving App Store customer release manual in App Store Connect.

**Architecture:** Two independent workflows (CI and release). CI runs `typecheck` + `test` + `content:validate` with Node 20. Release re-runs the same quality job, then `npx eas-cli@21.0.2 build -p ios --profile production --non-interactive --auto-submit` using `EXPO_TOKEN`. EAS holds Apple credentials; `eas.json` defines the production build/submit profiles with iOS `autoIncrement`.

**Tech Stack:** GitHub Actions, Node 20, npm, Expo EAS CLI `21.0.2`, App Store Connect / TestFlight (via EAS Submit).

**Spec:** `docs/superpowers/specs/2026-07-17-ci-cd-testflight-design.md`

## Global Constraints

- Branch `chore/ci-cd-testflight` must keep **exactly one commit** — stage work and `git commit --amend --no-edit` (or rewrite the title only if it becomes inaccurate); do not create additional commits on this branch.
- Do not push unless the user asks.
- Node **20** for all workflows (matches README).
- Pin EAS CLI to **`eas-cli@21.0.2`** in the release workflow (`npx eas-cli@21.0.2`).
- Never commit Apple secrets, Expo tokens, or `.env` files — only document secret names.
- No Android / Play Store jobs in this plan.
- Do not auto-release to App Store customers; `--auto-submit` stops at TestFlight / ASC processing.
- Keep `ios.bundleIdentifier` as `com.dailyvocab.app`.
- Do not add `content:validate:strict` to the required gate.
- Prefer complete file contents in steps; YAGNI — no reusable workflow composite in v1.

## File map

| File | Responsibility |
| --- | --- |
| `.github/workflows/ci.yml` | PR + `master` quality gate |
| `.github/workflows/release-ios.yml` | `master` / manual: quality then EAS iOS production → TestFlight |
| `eas.json` | EAS build `production` + submit `production` profiles |
| `app.config.ts` | Preserve existing config; add `extra.eas.projectId` only after `eas init` produces a real UUID |
| `docs/ci-cd.md` | Operator setup: Expo link, Apple creds, `EXPO_TOKEN`, branch protection, day-to-day loop |
| `README.md` | One-line pointer to `docs/ci-cd.md` under Scripts or Status |

---

### Task 1: Add `eas.json` production profiles

**Files:**
- Create: `eas.json`
- Modify: none yet (`app.config.ts` projectId deferred to operator / Task 4 docs until a real UUID exists)

**Interfaces:**
- Consumes: existing Expo app (`slug: daily-vocab`, bundle id `com.dailyvocab.app`)
- Produces: EAS profiles named `production` for build and submit (names must match the release workflow flags)

- [ ] **Step 1: Create `eas.json`**

Create `/Users/chintuvedanth/Desktop/daily-vocab/eas.json` with exactly:

```json
{
  "cli": {
    "version": ">= 21.0.2",
    "appVersionSource": "remote"
  },
  "build": {
    "production": {
      "distribution": "store",
      "autoIncrement": true,
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

Notes for the implementer:
- `distribution: "store"` makes App Store–signed binaries (same binary promoted later in Connect).
- `autoIncrement: true` with `appVersionSource: "remote"` lets EAS bump the iOS build number on each upload without hand-editing `CFBundleVersion` every merge.
- Empty `submit.production` is correct when Apple credentials live in EAS; do not hardcode ASC keys here.

- [ ] **Step 2: Validate JSON**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('eas.json','utf8')); console.log('eas.json ok')"
```

Expected: `eas.json ok`

- [ ] **Step 3: Amend the branch commit**

```bash
git add eas.json
git commit --amend --no-edit
```

Expected: still a single commit on `chore/ci-cd-testflight`; working tree clean for this file.

---

### Task 2: Add CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `package.json` scripts `typecheck`, `test`, `content:validate`; `package-lock.json`
- Produces: GitHub check named job `quality` (this exact job id is what branch protection should require)

- [ ] **Step 1: Create workflow directory and `ci.yml`**

Create `.github/workflows/ci.yml` with exactly:

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - master

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    name: quality
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Test
        run: npm test

      - name: Validate content catalogs
        run: npm run content:validate
```

- [ ] **Step 2: Sanity-check YAML parses**

Run:

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml')); print('ci.yml ok')"
```

Expected: `ci.yml ok`  
If `yaml` is missing: `pip3 install pyyaml` (user/machine) or use `node` with a one-off parse — do not skip validation.

- [ ] **Step 3: Locally mirror the quality gate**

Run (from repo root, after `npm ci` if `node_modules` is missing):

```bash
npm ci
npm run typecheck
npm test
npm run content:validate
```

Expected: all four succeed with exit code 0.

- [ ] **Step 4: Amend the branch commit**

```bash
git add .github/workflows/ci.yml
git commit --amend --no-edit
```

---

### Task 3: Add iOS TestFlight release workflow

**Files:**
- Create: `.github/workflows/release-ios.yml`

**Interfaces:**
- Consumes: `eas.json` profiles `production`; GitHub secret `EXPO_TOKEN`; same npm quality scripts as Task 2
- Produces: job `ios-testflight` that only runs after job `quality` succeeds

- [ ] **Step 1: Create `release-ios.yml`**

Create `.github/workflows/release-ios.yml` with exactly:

```yaml
name: Release iOS (TestFlight)

on:
  push:
    branches:
      - master
  workflow_dispatch:

concurrency:
  group: release-ios-${{ github.ref }}
  cancel-in-progress: false

jobs:
  quality:
    name: quality
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Test
        run: npm test

      - name: Validate content catalogs
        run: npm run content:validate

  ios-testflight:
    name: ios-testflight
    needs: quality
    runs-on: ubuntu-latest
    timeout-minutes: 120
    env:
      EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Require EXPO_TOKEN
        run: |
          if [ -z "$EXPO_TOKEN" ]; then
            echo "Missing GitHub Actions secret EXPO_TOKEN. See docs/ci-cd.md."
            exit 1
          fi

      - name: EAS Build + Submit (production → TestFlight)
        run: npx eas-cli@21.0.2 build -p ios --profile production --non-interactive --auto-submit --no-wait
```

Notes:
- `--no-wait` keeps the GitHub job from blocking for the full native build; the build continues on EAS. If you prefer the workflow to fail/succeed only when the binary is finished, drop `--no-wait` and keep `timeout-minutes: 120`.
- Spec success definition for v1: “submitted to EAS / ASC pipeline.” Prefer **keeping `--no-wait`** so Actions minutes stay low; document in `docs/ci-cd.md` that build status is watched on expo.dev.
- `cancel-in-progress: false` avoids cancelling an in-flight submit when another master push lands; concurrency still serializes the group name if GitHub queues them.

**Decision locked for this plan:** use `--no-wait` as in the YAML above.

- [ ] **Step 2: Validate YAML**

Run:

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release-ios.yml')); print('release-ios.yml ok')"
```

Expected: `release-ios.yml ok`

- [ ] **Step 3: Amend the branch commit**

```bash
git add .github/workflows/release-ios.yml
git commit --amend --no-edit
```

---

### Task 4: Operator docs + README pointer

**Files:**
- Create: `docs/ci-cd.md`
- Modify: `README.md` (add a short CI/CD link near Scripts / App Store notes)
- Modify: `app.config.ts` only if the implementer already has a real EAS project UUID from `eas init`; otherwise leave unchanged and document the command

**Interfaces:**
- Consumes: secret name `EXPO_TOKEN`; EAS profile names from Task 1; workflow names from Tasks 2–3
- Produces: operator checklist that unblocks the first live TestFlight upload

- [ ] **Step 1: Create `docs/ci-cd.md`**

Create `docs/ci-cd.md` with this content:

```markdown
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
```

- [ ] **Step 2: Link from README**

In `README.md`, after the App Store submission notes line:

```markdown
App Store submission notes: `docs/app-store-review-notes.md`.
```

Add immediately below:

```markdown
CI / TestFlight release: `docs/ci-cd.md`.
```

- [ ] **Step 3: Optional `eas init` if credentials are available in this environment**

If the implementer is logged into Expo and the user wants the project linked now:

```bash
npx eas-cli@21.0.2 init
```

Then ensure `app.config.ts` `extra` includes the real UUID, for example:

```ts
  extra: {
    splashBackground: '#F7F3EA',
    eas: {
      projectId: '<uuid-from-eas-init>',
    },
  },
```

If Expo login is not available, **skip this step** and leave `app.config.ts` unchanged — `docs/ci-cd.md` already covers it.

- [ ] **Step 4: Amend the branch commit (and retitle if needed)**

```bash
git add docs/ci-cd.md README.md
# include app.config.ts only if projectId was added
git add -A app.config.ts 2>/dev/null || true
git status
git commit --amend -m "$(cat <<'EOF'
chore/ci-cd-testflight: Add CI gates and TestFlight release pipeline

GitHub Actions now run typecheck, tests, and catalog validation on PRs, and master merges start an EAS production iOS build that auto-submits to TestFlight while App Store customer release stays manual in Connect.
EOF
)"
```

Only rewrite the message as above once implementation files exist; if this amend happens while only docs/plan files exist mid-plan, keep the accurate current title until Task 3 files are present, then use the message above on the final amend.

---

### Task 5: Final verification

**Files:**
- Verify only (no new product code)

**Interfaces:**
- Consumes: all files from Tasks 1–4
- Produces: confirmation the branch is ready for PR

- [ ] **Step 1: Confirm file inventory**

Run:

```bash
test -f eas.json && test -f .github/workflows/ci.yml && test -f .github/workflows/release-ios.yml && test -f docs/ci-cd.md && grep -q 'docs/ci-cd.md' README.md && echo 'inventory ok'
```

Expected: `inventory ok`

- [ ] **Step 2: Re-parse workflows + eas.json**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('eas.json','utf8')); console.log('eas.json ok')"
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml')); yaml.safe_load(open('.github/workflows/release-ios.yml')); print('workflows ok')"
```

Expected: `eas.json ok` then `workflows ok`

- [ ] **Step 3: Re-run local quality gate**

```bash
npm ci
npm run typecheck
npm test
npm run content:validate
```

Expected: exit code 0 for all.

- [ ] **Step 4: Confirm single commit on branch**

```bash
git log --oneline master..HEAD
```

Expected: **exactly one** commit. If more than one appeared, squash via soft reset to `master` and one commit (only if user approves rewrite), or amend carefully — this repo rule is one commit per branch.

- [ ] **Step 5: Stop — do not push or open PR unless the user asks**

Hand back: summarize what was added and remind them of the manual Expo/Apple/`EXPO_TOKEN`/branch-protection steps in `docs/ci-cd.md`.

---

## Spec coverage checklist (author self-review)

| Spec requirement | Task |
| --- | --- |
| PR + master quality: typecheck, test, content:validate | Task 2 |
| Master → production iOS EAS + auto-submit TestFlight | Task 3 |
| Manual App Store release | Task 4 docs (explicit) |
| `eas.json` production + autoIncrement | Task 1 |
| `EXPO_TOKEN`, Apple via EAS, branch protection | Task 4 |
| `docs/ci-cd.md` + file inventory | Tasks 4–5 |
| No Android / no strict validate / no native GH macOS build | Global Constraints |
| Pin eas-cli version | Task 3 (`21.0.2`) |
| `app.config.ts` projectId when available | Task 4 Step 3 |

## Placeholder scan

No TBD/TODO left in task steps. Operator-only UUID is gated behind optional `eas init`, not a blank committed id.
