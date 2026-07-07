# Deployment And Rollback Runbook

Last updated: 2026-07-07

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
```

## CI/CD Flow

Pull requests:

- install dependencies with `npm ci`;
- install Chromium Playwright browsers;
- run `npm test`;
- do not deploy production.

Pushes to `main`:

- run the same CI test job;
- if `VERCEL_TOKEN` is set, pull Vercel production env, build, deploy prebuilt
  production, and alias `coin-quest-ledger.vercel.app`;
- if `VERCEL_TOKEN` is missing, tests still run and deploy is skipped with a
  warning.

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

## Firebase Rules Deploy

Rules are not deployed by the Vercel workflow. If `firestore.rules` changes,
deploy explicitly:

```bash
npx firebase-tools deploy --only firestore:rules --project pointy-personal-toolkit
```

After rules deploy, verify affected live auth/data paths. See
`SECURITY_AND_FIREBASE_RULES.md`.

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
