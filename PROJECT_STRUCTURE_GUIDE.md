# Project Structure Guide

Last updated: 2026-10-12

## Purpose

This is the practical "where do I edit this?" guide. It is intentionally more
concrete than `architecture.md`.

Use `SITE_MAP_AND_INTERACTIONS.md` when the question is how modules interact.
Use `data-contracts.md` when the question is what gets persisted.
Use `ACCOUNT_MANAGEMENT_IMPLEMENTATION.md` when the question is how signup,
recovery reset, Firebase user/profile documents, and Admin Portal user
management actually work.
Use `ADMIN_PORTAL_IMPLEMENTATION.md` for live `/admin/` behavior, `SECURITY_AND_FIREBASE_RULES.md`
for access control, `TESTING_MATRIX.md` for verification, `DEPLOYMENT_AND_ROLLBACK_RUNBOOK.md`
for release flow, and `NATIVE_WEB_PARITY.md` for native/web parity.
Use `REFACTOR_READINESS_AUDIT.md` before any broad extraction or module split.

## Root Files

- `Memory.md`, `PLAYBOOK.md`: current checkpoint and operating/read order.
- `skills/coin-quest-new-chat/`: versioned new-chat router, context map and UI
  metadata; installed copy is `/Users/point/.codex/skills/coin-quest-new-chat/`.
- `index.html`: Home, toolbox launcher, and Price Arena.
- `trip/index.html`: Party Ledger shell, CSS, static markup, script loading.
- `trip/trip-utils.js`: Party Ledger utility helpers loaded before the app.
- `trip/app.js`: Party Ledger behavior and rendering.
- `trip/pixicons.js`: compact quest icon registry and migration helpers. The
  legacy `.jsx` copy is not loaded in production because Vercel serves `.jsx`
  with a non-executable MIME type under `nosniff`.
- `character/index.html`: Character Profile shell and styles.
- `character/app.js`: Character Profile loading and rendering.
- `debt/index.html`, `debt/app.js`: Debt Dragon web module.
- `treasury/index.html`, `treasury/app.js`: Treasury web module.
- `admin/index.html`, `admin/admin-utils.js`, `admin/app.js`, `admin/admin.css`: Super Admin Portal.
- `lang.js`: shared Thai/English copy.
- `firestore.rules`: intended Firestore Rules source; deployed separately from Vercel.
- `firebase.test.json`, `scripts/test-backend.mjs`, `tests/backend/`: isolated
  Firebase Auth/Firestore integration and Rules tests.
- `firebase.json`: Firebase deploy config.
- `SECURITY_AND_FIREBASE_RULES.md`: Firebase Auth/rules/Admin SDK security map.
- `DEPLOYMENT_AND_ROLLBACK_RUNBOOK.md`: deploy, CI/CD, alias, rules deploy, rollback.
- `TESTING_MATRIX.md`: change-type-to-test-command map.
- `PROD_SMOKE_HARNESS.md`: non-mutating live production smoke harness.
- `ADMIN_PORTAL_IMPLEMENTATION.md`: live Admin Portal implementation map.
- `NATIVE_WEB_PARITY.md`: native/web contract and build-gate map.
- `REFACTOR_READINESS_AUDIT.md`: refactor hotspot map, slice order, and regression gates.
- `package.json`: test scripts and runtime dependency list.
- `.github/workflows/test.yml`: CI/CD test and production deploy workflow.

## Shared Browser Modules

- Player HTML entry points: original inline styles and composition restored
  from `b726368`; current scripts/features are preserved.
- `shared/player-brand.css`: historical colors-only override, no longer loaded
  by player pages after the complete pre-redesign restoration.
- `shared/quest-tokens.css`: shared/Admin base palette. Do not change it for a
  player-only color request; Admin is intentionally outside that scope.
- `shared/quest-design.css`, `character/design.css`: detached historical player
  redesigns. `admin/design.css` remains active for Admin.
- `shared/pointy-logic.js`: shared calculations, class registry, settlement,
  price comparison, leveling, profile aggregation helpers.
- `shared/firebase-client.js`: Firebase app/Auth/Firestore initializer.
- `shared/account-scope.js`: account-scoped localStorage key helper.
- `shared/board-invites.js`: board invite payloads, storage, status, expiry.
- `shared/profile-hub.js`: profile/auth/reminder orchestrator.
- `shared/profile-session.js`: test-mode and local auth/session helpers.
- `shared/profile-auth.js`: username normalization, auth email mapping, blocked
  account status helpers.
- `shared/profile-cloud.js`: Firebase Auth/Firestore access boundary.
- `shared/profile-login.js`: Sign In, Sign Up, and recovery form renderers.
- `shared/profile-character-create.js`: one-time Character Creation renderer.
- `shared/profile-reminders.js`: Reminders overlay renderer.
- `shared/profile-drawer.js`: profile drawer blocks.
- `shared/profile-recovery.js`: Recovery ID generation and hashing.
- `shared/profile-backup.js`: local data export/restore helpers.
- `shared/profile-tour.js`: Welcome Tour content.
- `shared/mobile-shell.js`, `shared/mobile-shell.css`: phone hamburger drawer
  and bottom tab shell.
- `shared/profile-hub.css`: shared profile/auth/reminder/tour styling.
- `shared/first-load.js`, `shared/first-load.css`: first-load splash.
- `shared/asset-urls.js`, `shared/cloudinary-assets.js`: asset URL resolution.
  Production and test routes default to deployed same-origin art. Explicit
  `?assets=cloud` uses the legacy CDN manifest for availability diagnostics.
- `shared/player-controls.css`: shared player/module control chrome.

## Mobile Native App

- `mobile/index.ts`: Expo Router entry point.
- `mobile/src/app/_layout.tsx`: font loading, auth provider and native stack navigation.
- `mobile/src/app/index.tsx`, `signup.tsx`: login/account and signup routes.
- `mobile/src/auth/`: Firebase session, transactional account provisioning and auth UI.
- `mobile/src/character/`, `src/player/`: character catalog, Home/profile, shared native controls and reminders.
- `mobile/src/ledger/`: board transactions, invites, split validation, campaign snapshots, receipts and imports/exports.
- `mobile/src/modules/`: owner-scoped Debt/Treasury/Compare transactions, validations and backup/restore.
- `mobile/src/domain/canon.ts`: direct import of the website's shared calculations.
- `mobile/src/app/split/`, `debt/`, `treasury/`, `prices/`: native player routes.
- `shared/module-cloud.js`: website account-scoped storage bridge to `playerModules/{uid}`.
- `mobile/src/theme/typography.ts`, `mobile/assets/fonts/`: website font roles and licensed assets.
- `mobile/src/app/check.tsx` and `mobile/App.tsx`: temporary native interaction check.
- `mobile/scripts/build-simulator.sh`: repeatable source gates and local Simulator build.
- `mobile/IOS_BUILD_NOTES.md`: current Simulator-first build/install runbook.
- `mobile/README.md`: rebuild scope and actual verification status.
- `docs/rollback-parking-lot.md`: recovery of the retired 82-file app.

The old native screen/data/theme files were intentionally removed on
2026-10-11. Current module acceptance, real Simulator checks, web/Firebase round
trips and remaining limits are in `docs/mobile-completion-worklist.md`.

## Assets

- `assets/rpg-portraits/`: current full-body class portraits and skin art.
- `assets/rpg-classes/`: older class art kept for compatibility.
- `assets/debt-dragons/`: Debt Dragon art.
- `assets/icons/loot-chest.svg`: app icon.
- `fallback-assets/`: legacy fallback routes retained for CDN diagnostics.
  `assets/` is included in Vercel deploys and shared with native bundling.

## Tests And Scripts

- `tests/e2e/coin-quest-ledger.spec.mjs`: browser regression flows.
- `tests/e2e/helpers/coin-quest-helpers.mjs`: shared Playwright helpers and real Firebase dummy-account harness.
- `tests/unit/pointy-logic.test.mjs`: shared logic and settlement tests.
- `tests/unit/admin-delete-user.test.mjs`: admin delete backend tests.
- `scripts/check-inline-scripts.mjs`: syntax and inline script checks.
- `scripts/check-assets.mjs`: required portrait/asset checks.
- `scripts/prod-smoke.mjs`: live production smoke harness for routes/assets/admin shell.
- `scripts/static-server.mjs`: local static preview server.
- `scripts/upload-cloudinary-assets.mjs`: Cloudinary upload helper.

## Common Tasks

| Task | Start here | Also check |
| --- | --- | --- |
| Start a new chat | `Memory.md`, `PLAYBOOK.md`, `skills/coin-quest-new-chat/SKILL.md` | Read only task-relevant owners from its context reference |
| Change player brand colors | Inline styles in player route HTML, `mobile/src/auth/ui.tsx` | `mobile/DESIGN_DIRECTION.md`; preserve Admin isolation |
| Change Party Ledger layout | `trip/index.html` | `CLAUDE_TO_A_TEE_QA.md`, Playwright mobile/tablet |
| Change Party Ledger behavior | `trip/app.js` | `trip/trip-utils.js`, `shared/pointy-logic.js`, e2e tests |
| Change settlement math | `shared/pointy-logic.js` | `tests/unit/pointy-logic.test.mjs` |
| Change invite/guest flow | `trip/app.js`, `shared/board-invites.js` | `INVITES_AND_GUESTS.md`, reminders tests |
| Change Reminders UI | `shared/profile-reminders.js`, `shared/profile-hub.js` | invite accept/decline e2e |
| Change login/signup copy | `shared/profile-login.js`, `shared/profile-hub.js`, `lang.js` | neutral placeholder audit |
| Change account/session behavior | `shared/profile-auth.js`, `shared/profile-session.js`, `shared/profile-cloud.js` | Firestore rules, auth tests |
| Change account creation/recovery/admin user flow | `shared/profile-hub.js`, `admin/app.js`, `admin/admin-utils.js`, `api/account-recovery-core.js`, `api/recover-account.js`, `api/admin-reset-user.js`, `api/admin-delete-user.js` | `ACCOUNT_MANAGEMENT_IMPLEMENTATION.md`, `data-contracts.md`, Firestore rules |
| Add a class or skin | `shared/pointy-logic.js`, `assets/rpg-portraits/` | `scripts/check-assets.mjs`, renderers |
| Change production asset routing | `shared/asset-urls.js`, `.vercelignore`, `shared/cloudinary-assets.js` | `npm run test:assets`, `npm run smoke:prod` |
| Change Character Profile | `character/app.js`, `character/index.html` | `shared/pointy-logic.js` aggregation |
| Change Admin Portal | `admin/app.js`, `admin/admin-utils.js`, `admin/index.html`, `admin/admin.css` | `ADMIN_PORTAL_IMPLEMENTATION.md`, `ADMIN.md`, full `npm test` |
| Change Firebase rules/security | `firestore.rules`, `api/*.js` | `SECURITY_AND_FIREBASE_RULES.md`, rules deploy |
| Change CI/deploy/rollback | `.github/workflows/test.yml`, Vercel/Firebase config | `DEPLOYMENT_AND_ROLLBACK_RUNBOOK.md`, `TESTING_MATRIX.md` |
| Change mobile shell | `shared/mobile-shell.*` | Home, Split, Debt, Prices, Treasury mobile |
| Change native app | `mobile/src/*` | `mobile/IOS_BUILD_NOTES.md`, typecheck/lint and actual Simulator flow |
| Change deploy/CI | `.github/workflows/test.yml`, `PLAYBOOK.md` | `DEPLOYMENT_AND_ROLLBACK_RUNBOOK.md`, GitHub secrets, Vercel alias |

## Do Not Edit Blindly

- `shared/pointy-logic.js`: central math and class registry; unit-test changes.
- `shared/profile-hub.js`: many delegated events and shared profile side effects.
- `trip/app.js`: large stateful renderer; read the affected flow before patching.
- `firestore.rules`: deploy rules before expecting production behavior to work.
- Script order in HTML pages: helper browser globals must load before consumers.
- Legacy snapshots: `archive/legacy/trip-index.legacy.html` and `archive/legacy/index.legacy.html` are inactive.
- Offline Claude exports in Downloads: inspect them, do not edit or commit them.

## Test Map

- Visual-only small patch: `npm run test:syntax` plus browser spot-check.
- Asset/class/skin patch: `npm run test:assets`.
- Calculation patch: `npm run test:unit`.
- Invite/guest/profile/mobile patch: targeted Playwright test.
- Production patch, commit, or deploy: `npm test`.
