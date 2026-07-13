# Refactor Readiness Audit

Last updated: 2026-07-14

## Verdict

The project is ready for larger refactors, but only as staged vertical slices
with full regression after each slice. Do not attempt a single repo-wide rewrite.

The current regression harness is strong enough for safe extraction work:

- syntax checks cover live browser globals, API routes, and Node scripts;
- asset checks protect RPG portraits, skins, dragons, and icon manifest entries;
- unit tests cover shared calculation, settlement, profile aggregation, debt
  math, and Admin delete helpers;
- Playwright runs real browser click flows across desktop Chromium, tablet
  `820 x 1180`, and mobile Pixel 5.

## Latest Audit Evidence

Run after the helper extraction slice on 2026-07-14:

```bash
npm test
```

Result:

- `npm run test:syntax`: passed, 42 browser scripts and 8 module files checked.
- `npm run test:assets`: passed, 39 RPG portrait/skin assets, 7 dragons, and
  loot chest icon checked.
- `npm run test:unit`: passed, 24 tests.
- `npm run test:e2e`: passed, 80 browser-driven tests, 4 skipped.

Completed extraction slice:

- added `trip/trip-utils.js` for Party Ledger utility helpers;
- added `admin/admin-utils.js` for Super Admin utility helpers;
- moved shared Playwright setup helpers into
  `tests/e2e/helpers/coin-quest-helpers.mjs`;
- expanded `scripts/check-inline-scripts.mjs` so `npm run test:syntax` now
  checks 42 browser scripts and 8 module files, including E2E helpers.

Skipped tests:

- Real Firebase account lifecycle is skipped unless
  `POINTY_REAL_FIREBASE_E2E=1` and `FIREBASE_SERVICE_ACCOUNT_JSON` are set.
  This test creates a real dummy account, deletes it through the Admin SDK path,
  recreates the same username, verifies public ID reuse, and cleans up.
- The real account test is intentionally Chromium-only to avoid duplicate live
  accounts across Playwright projects.

## Real Dummy Account Policy

Creating a dummy account is allowed for live-account regression, but cleanup must
be part of the same run.

Use the existing real Firebase E2E harness when service-account credentials are
available:

```bash
POINTY_REAL_FIREBASE_E2E=1 FIREBASE_SERVICE_ACCOUNT_JSON='<json>' npm run test:e2e
```

Do not add a broad production dev-login path to `/admin/`. Admin already has a
`/admin/?test=1` harness for browser regression. Production Admin access should
remain Firebase Google Auth allowlisted to `purich.wc@gmail.com`.

Client-only live signup without Admin SDK cleanup is not a good default because
Firestore rules intentionally allow owners to create/update their docs but only
Super Admin can delete `users`, `characters`, `usernames`, and `playerModules`.

## Top Refactor Targets

### 1. Party Ledger

Current hotspot:

- `trip/app.js`: about 2.7k lines.

Recommended slices:

1. Extract participant and hero-entry state/rendering.
2. Extract invite/guest/reminder glue around `shared/board-invites.js`.
3. Extract expense-entry rendering and split-mode controls.
4. Extract settlement/victory/campaign rendering.
5. Extract board admin/settings helpers.

Completed foundation slice:

- `trip/trip-utils.js` now owns small pure-ish browser helpers for ID/code
  generation, theme persistence, escaping, money formatting, and admin hashes.

Gate each slice with:

```bash
npm run test:syntax
npm run test:unit
npx playwright test tests/e2e/coin-quest-ledger.spec.mjs --grep "expense splitter"
```

Run full `npm test` before commit/push/deploy.

### 2. Profile Hub

Current hotspot:

- `shared/profile-hub.js`: about 1.9k lines after previous helper extraction.

Recommended slices:

1. Extract Firebase load/save and account hydration helpers.
2. Extract profile drawer shell orchestration.
3. Extract My Boards computation/render orchestration.
4. Extract recovery-regeneration side effects into the recovery helper.
5. Keep script load order explicit in HTML files.

Gate each slice with:

```bash
npm run test:syntax
npm run test:unit
npx playwright test tests/e2e/coin-quest-ledger.spec.mjs --grep "profile"
```

### 3. Admin Portal

Current hotspot:

- `admin/app.js`: about 1.5k lines.

Recommended slices:

1. Extract Firebase/test data adapter.
2. Extract user lifecycle and permanent-delete modal handlers.
3. Extract board/admin relationship map builders.
4. Extract modal shell helpers.
5. Keep `/admin/?test=1` as the regression harness; do not bypass production
   Google Auth in normal `/admin/`.

Completed foundation slice:

- `admin/admin-utils.js` now owns small pure-ish browser helpers for escaping,
  cloning, lifecycle status normalization, username/reset helpers, recovery
  hash generation, and level display wrappers.

Gate each slice with:

```bash
npm run test:syntax
node --test tests/unit/admin-delete-user.test.mjs
npx playwright test tests/e2e/coin-quest-ledger.spec.mjs --grep "super admin"
```

### 4. E2E Suite

Current hotspot:

- `tests/e2e/coin-quest-ledger.spec.mjs`: about 1.5k lines.

Recommended slices:

1. Split specs by surface: `split`, `profile`, `admin`, `debt`, `responsive`.
3. Preserve project matrix coverage: desktop Chromium, tablet, and mobile.
4. Keep the real Firebase lifecycle spec opt-in and self-cleaning.

Completed foundation slice:

- Shared fixtures/helpers now live in `tests/e2e/helpers/coin-quest-helpers.mjs`.

## Refactor Rules

- One coherent boundary per commit.
- Preserve browser-global loading order unless a page is explicitly updated.
- Do not mix visual Claude-to-a-tee work with structural refactor.
- Do not change persisted data contracts during extraction unless the migration
  is the explicit task.
- If a refactor touches Admin, account creation, recovery, invites, settlement,
  or shared mobile shell, run full `npm test`.
- Update `Memory.md`, `PLAYBOOK.md`, `PROJECT_STRUCTURE_GUIDE.md`, and this file
  after meaningful refactor milestones.
