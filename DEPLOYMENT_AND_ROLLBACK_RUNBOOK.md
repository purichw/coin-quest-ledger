# Deployment And Rollback Runbook

Last updated: 2026-10-14

## Purpose

Use this when committing, pushing, deploying, verifying production, rolling back,
or changing CI/CD, Vercel, Firebase rules, or production env assumptions.

## Production Shape

- GitHub repo: `git@github.com:purichw/coin-quest-ledger.git`
- Main branch: `main`
- Production URL: `https://coinquestledger.vercel.app`
- Vercel project: `coinquestledger`
- Vercel project id: `prj_ZhaR03b1Ukx5Tzi8FPDH4IFI1fM3`
- Vercel org/team id: `team_YrvoFhGxq1xp83XzkHci5rNx`
- Firebase project id: `pointy-personal-toolkit`
- CI/CD workflow: `.github/workflows/test.yml`

### Canonical domain migration (2026-10-14)

The canonical origin is `https://coinquestledger.vercel.app`. Keep the existing
Vercel project ID and GitHub connection when renaming the Vercel project; a new
project would lose the existing production secrets and deployment history.
The canonical domain must be a verified production domain with no redirect.
The CI alias step must use the same hostname, so future releases cannot restore
the retired alias. The cutover is complete: all five legacy aliases were removed,
the retired canonical host returns 404 without a redirect, and fresh Google
Admin login passed on the new origin. Do not recreate retired aliases or add
an old-domain redirect during normal deploy/rollback operations.

Firebase Auth authorized domains include the new web hostname and exclude the
retired web hostname. The Firebase project ID and Firebase-hosted OAuth helper
domain remain unchanged; users and Firestore data are not migrated.
Browser storage/session state is origin-scoped,
so users may need to sign in again on the new hostname. Browser-only drafts on
the retired origin do not automatically transfer. Native source links and its
recovery endpoint must use the new hostname; existing installed binaries need
an updated build before their embedded links change.

Domain migration regression guard: `tests/unit/production-domain.test.mjs`.
Historical screenshots, capture manifests and archived handoffs record the
origin actually used at capture time and are not active production settings.
See [verified cutover evidence](docs/domain-migration-2026-10-14/README.md) for
the exact commit, CI run, deployment, alias inventory and native limits.

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
  production, and alias `coinquestledger.vercel.app`;
- if `VERCEL_TOKEN` is missing, tests still run and deploy is skipped with a
  warning.

`vercel.json` disables Git integration auto-deploys with `git.deploymentEnabled:
false`; otherwise Vercel creates a second deployment before CI finishes. There
is one intended production writer: this workflow. Do not start a duplicate manual
deployment while it is still running. Native source is pushed with the repository;
this workflow does not publish an iOS/Android package or an OTA update.

Reference: [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration).

`.vercelignore` excludes mobile, QA evidence, tests, internal documentation and
versioned onboarding skills.
It includes `assets/`: production now uses the same checked-in art as native.
Cloudinary remains an explicit `?assets=cloud` diagnostic path, not the default.

### Timing and diagnosis

The expanded October 13–14 suite needs a newer baseline than the early October
3–4 minute runs. Successful run `38480350398` took about 14m45s; the domain
cutover run `38531883556` took about 13m10s, with Test 11m50s, Native contracts
47s in parallel, and Deploy production 1m15s. For this full-suite mode, use
13–15 minutes as the expected range and 22 minutes as a diagnostic
checkpoint, not a failure timeout. Recalibrate from recent comparable runs.
Inspect the active phase and recent log timestamps; GitHub's live job page can
show progress before CLI log downloads become available.
Use a full commit SHA when filtering runs; short-SHA filters can miss a run.
Investigate immediately on a failed assertion, wrong SHA or
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
vercel alias set "$deployment_url" coinquestledger.vercel.app
curl -fsSL https://coinquestledger.vercel.app/ | rg "Coin Quest|Quest"
```

For route-specific changes, curl or browser-verify the changed route too:

```bash
curl -fsSL https://coinquestledger.vercel.app/trip/ | rg "Party|Quest|Ledger"
curl -fsSL https://coinquestledger.vercel.app/admin/ | rg "Super Admin|Admin"
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
vercel alias set <known-good-deployment-url> coinquestledger.vercel.app
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
