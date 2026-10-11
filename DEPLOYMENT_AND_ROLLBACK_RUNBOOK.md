# Deployment And Rollback Runbook

Last updated: 2026-10-12

## Purpose

Use this when committing, pushing, deploying, verifying production, rolling back,
or changing CI/CD, Vercel, Firebase rules, or production env assumptions.

## Production Shape

- GitHub repo: `git@github.com:purichw/coin-quest-ledger.git`
- Main branch: `main`
- Production URL: `https://coin-quest-ledger.vercel.app`
- Vercel project: `coin-quest-ledger`
- Vercel project id: `prj_ZhaR03b1Ukx5Tzi8FPDH4IFI1fM3`
- Vercel org/team id: `team_YrvoFhGxq1xp83XzkHci5rNx`
- Firebase project id: `pointy-personal-toolkit`
- CI/CD workflow: `.github/workflows/test.yml`

Do not commit `.vercel/project.json` values into new places. Store Vercel IDs
and tokens as GitHub/Vercel secrets.

## Local Preflight

Always start with:

```bash
git status -sb
git diff --stat
```

For docs-only changes:

```bash
git diff --check
```

For behavior, UI, persistence, admin, route, asset, or deploy changes, run the
relevant checks from `TESTING_MATRIX.md`. Production patch usually means:

```bash
npm test
npm run test:backend
cd mobile
npm run typecheck
npm run lint
node --test tests/*.test.mjs
```

Use Node 24 from `mobile/.nvmrc` locally. If Playwright browsers were installed
in project artifacts, set `PLAYWRIGHT_BROWSERS_PATH=mobile/.artifacts/playwright`
from the root (or its absolute path). Emulator tests use `demo-coin-quest` only,
with no production credentials, and Java 17+ for pinned Firebase CLI 14.
Native source checks do not replace the Simulator gate in `mobile/AGENTS.md`.

## CI/CD Flow

Pull requests:

- install dependencies with `npm ci`;
- install Chromium Playwright browsers;
- run `npm test`;
- run isolated Auth/Firestore integration tests with Java 21;
- run mobile TypeScript, lint and contract tests in a parallel Node 24 job;
- do not deploy production.

Pushes to `main`:

- require both the web/backend and native-contract jobs to pass;
- if `VERCEL_TOKEN` is set, pull Vercel production env, build, deploy prebuilt
  production, and alias `coin-quest-ledger.vercel.app`;
- if `VERCEL_TOKEN` is missing, tests still run and deploy is skipped with a
  warning.

There is one production writer: this workflow. Do not start a duplicate manual
deployment while it is still running. Native source is pushed with the repository;
this workflow does not publish an iOS/Android package or an OTA update.

`.vercelignore` excludes mobile, QA evidence, tests and internal documentation.
It includes `assets/`: production now uses the same checked-in art as native.
Cloudinary remains an explicit `?assets=cloud` diagnostic path, not the default.

### Timing and diagnosis

The successful 2026-08-31 run `33385081176` took about 4 minutes total:
Test 2m40s, deploy 1m18s. The October pipeline adds emulator and native checks;
use 7 minutes as an initial diagnostic checkpoint, then recalibrate from its
successful run. Investigate immediately on a failed assertion, wrong SHA or
authentication error; inspect after 3 minutes with no run, 5 minutes queued with
no progress, or 2 minutes with promotion pending after checks/build are ready.
Inspect the current step and causal log before any retry. Never repeat an
uncertain push/deploy without checking remote state.

Required GitHub Actions secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Manual Production Deploy

Use only when the user asks for deploy or when CI/CD needs manual recovery.

```bash
npm test
vercel pull --yes --environment=production
vercel build --prod
deployment_url="$(vercel deploy --prebuilt --prod)"
vercel alias set "$deployment_url" coin-quest-ledger.vercel.app
curl -fsSL https://coin-quest-ledger.vercel.app/ | rg "Coin Quest|Quest"
```

For route-specific changes, curl or browser-verify the changed route too:

```bash
curl -fsSL https://coin-quest-ledger.vercel.app/trip/ | rg "Party|Quest|Ledger"
curl -fsSL https://coin-quest-ledger.vercel.app/admin/ | rg "Super Admin|Admin"
```

After production deploys that touch routes, assets, admin shell, or responsive
behavior, run the production smoke harness:

```bash
npm run smoke:prod
```

See `PROD_SMOKE_HARNESS.md` for the no-production-mutation policy, covered
routes, screenshot output, and failure rules.

## Firebase Rules Deploy

Rules are not deployed by the Vercel workflow. If `firestore.rules` changes,
deploy explicitly:

```bash
npx firebase-tools deploy --only firestore:rules --project pointy-personal-toolkit
```

After rules deploy, verify affected live auth/data paths. See
`SECURITY_AND_FIREBASE_RULES.md`.

For the October shared-backend rollout, publish the atomic-signup/invite clients
and APIs before tightening Rules. Deploy Rules as soon as the web CI promotion
succeeds; the short interval retains old access policy and must be reported if
Rules fail. Preserve the prior Rules release/source before changing it, then
compare the active Rules source with this commit. Old open browser tabs may need
reload because multi-document writes now have to satisfy the new atomic contract.
Do not mix code promotion with the separate legacy board ACL/public-hash migration.

`accountRecoveryLimits.expiresAt` supports optional physical TTL cleanup.
The 2026-10-12 preflight found billing disabled and no TTL policy on this project.
[Firestore TTL deletes require billing](https://firebase.google.com/docs/firestore/pricing).
Do not enable billing as part of a code deploy. Rate-limit windows expire
logically in the handler; physical cleanup is deferred until separately enabled.
This means old digest documents can remain stored, but not keep an expired lockout.

## Rollback

Vercel app rollback:

1. Find the last known-good deployment.
2. Alias it back to production:

```bash
vercel alias set <known-good-deployment-url> coin-quest-ledger.vercel.app
```

3. Verify production route markers and at least one affected interaction.
4. Create a follow-up commit or revert only after preserving any user changes.

Git rollback:

- Prefer a normal revert commit over destructive reset:

```bash
git revert <bad-commit-sha>
git push origin main
```

Firebase rules rollback:

- Revert `firestore.rules` in git;
- deploy rules again with Firebase CLI;
- verify affected live flows.

Data rollback:

- No broad Firestore data rollback is currently documented.
- For destructive user actions, consult `adminDeleteRequests` audit docs and
  tombstones before attempting manual repair.
- Export or inspect affected documents before manual mutation.

## Release Report Template

Include:

- commit SHA;
- branch pushed;
- tests run and result;
- deployment URL or CI run status;
- production alias status;
- routes/interactions verified;
- Firebase rules deploy status when relevant;
- skipped checks and residual risk.
