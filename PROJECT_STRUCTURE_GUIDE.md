# Project Structure Guide

Last updated: 2026-06-30

## Purpose

This is the practical "where do I edit this?" guide. It is intentionally more
concrete than `architecture.md`.

Use `SITE_MAP_AND_INTERACTIONS.md` when the question is how modules interact.
Use `data-contracts.md` when the question is what gets persisted.

## Root Files

- `index.html`: Home, toolbox launcher, and Price Arena.
- `trip/index.html`: Party Ledger shell, CSS, static markup, script loading.
- `trip/app.js`: Party Ledger behavior and rendering.
- `trip/pixicons.jsx`: compact quest icon registry and migration helpers.
- `character/index.html`: Character Profile shell and styles.
- `character/app.js`: Character Profile loading and rendering.
- `debt/index.html`, `debt/app.js`: Debt Dragon web module.
- `treasury/index.html`, `treasury/app.js`: Treasury web module.
- `admin/index.html`, `admin/app.js`, `admin/admin.css`: Super Admin Portal.
- `lang.js`: shared Thai/English copy.
- `firestore.rules`: deployed Firestore security rules.
- `firebase.json`: Firebase deploy config.
- `package.json`: test scripts and runtime dependency list.
- `.github/workflows/test.yml`: CI/CD test and production deploy workflow.

## Shared Browser Modules

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
- `shared/player-controls.css`: shared player/module control chrome.

## Mobile Native App

- `mobile/App.tsx`: Expo app orchestrator.
- `mobile/src/data.ts`: Firebase-backed data access.
- `mobile/src/firebaseClient.ts`: native Firebase initializer.
- `mobile/src/gameLogic.ts`: native module normalization and calculations.
- `mobile/src/types.ts`: native TypeScript contracts.
- `mobile/src/copy.ts`: native copy.
- `mobile/src/theme.ts`: native theme tokens.
- `mobile/src/ui.tsx`: reusable native UI primitives.
- `mobile/src/sheets.tsx`: bottom sheets and modal-like native UI.
- `mobile/src/assets.ts`: native asset registry.
- `mobile/IOS_BUILD_NOTES.md`: physical iPhone build/install runbook.

## Assets

- `assets/rpg-portraits/`: current full-body class portraits and skin art.
- `assets/rpg-classes/`: older class art kept for compatibility.
- `assets/debt-dragons/`: Debt Dragon art.
- `assets/icons/loot-chest.svg`: app icon.

## Tests And Scripts

- `tests/e2e/coin-quest-ledger.spec.mjs`: browser regression flows.
- `tests/unit/pointy-logic.test.mjs`: shared logic and settlement tests.
- `tests/unit/admin-delete-user.test.mjs`: admin delete backend tests.
- `scripts/check-inline-scripts.mjs`: syntax and inline script checks.
- `scripts/check-assets.mjs`: required portrait/asset checks.
- `scripts/static-server.mjs`: local static preview server.
- `scripts/upload-cloudinary-assets.mjs`: Cloudinary upload helper.

## Common Tasks

| Task | Start here | Also check |
| --- | --- | --- |
| Change Party Ledger layout | `trip/index.html` | `CLAUDE_TO_A_TEE_QA.md`, Playwright mobile/tablet |
| Change Party Ledger behavior | `trip/app.js` | `shared/pointy-logic.js`, e2e tests |
| Change settlement math | `shared/pointy-logic.js` | `tests/unit/pointy-logic.test.mjs` |
| Change invite/guest flow | `trip/app.js`, `shared/board-invites.js` | `INVITES_AND_GUESTS.md`, reminders tests |
| Change Reminders UI | `shared/profile-reminders.js`, `shared/profile-hub.js` | invite accept/decline e2e |
| Change login/signup copy | `shared/profile-login.js`, `shared/profile-hub.js`, `lang.js` | neutral placeholder audit |
| Change account/session behavior | `shared/profile-auth.js`, `shared/profile-session.js`, `shared/profile-cloud.js` | Firestore rules, auth tests |
| Add a class or skin | `shared/pointy-logic.js`, `assets/rpg-portraits/` | `scripts/check-assets.mjs`, renderers |
| Change Character Profile | `character/app.js`, `character/index.html` | `shared/pointy-logic.js` aggregation |
| Change Admin Portal | `admin/app.js`, `admin/index.html`, `admin/admin.css` | `ADMIN.md`, full `npm test` |
| Change mobile shell | `shared/mobile-shell.*` | Home, Split, Debt, Prices, Treasury mobile |
| Change native app | `mobile/src/*` | `mobile/IOS_BUILD_NOTES.md`, typecheck/export |
| Change deploy/CI | `.github/workflows/test.yml`, `PLAYBOOK.md` | GitHub secrets, Vercel alias |

## Do Not Edit Blindly

- `shared/pointy-logic.js`: central math and class registry; unit-test changes.
- `shared/profile-hub.js`: many delegated events and shared profile side effects.
- `trip/app.js`: large stateful renderer; read the affected flow before patching.
- `firestore.rules`: deploy rules before expecting production behavior to work.
- Script order in HTML pages: helper browser globals must load before consumers.
- Legacy snapshots: `trip/index.legacy.html` and `index.legacy.html` are inactive.
- Offline Claude exports in Downloads: inspect them, do not edit or commit them.

## Test Map

- Visual-only small patch: `npm run test:syntax` plus browser spot-check.
- Asset/class/skin patch: `npm run test:assets`.
- Calculation patch: `npm run test:unit`.
- Invite/guest/profile/mobile patch: targeted Playwright test.
- Production patch, commit, or deploy: `npm test`.

