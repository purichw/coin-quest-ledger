# Memory: Coin Quest

Last updated: 2026-06-16

## Project

- Workspace: `/Users/point/toolbox`
- GitHub: `git@github.com:purichw/coin-quest.git`
- Live production URL: `https://pointy-super-app.vercel.app`
- Vercel project: `coin-quest`
- Desired short URL `https://coin-quest.vercel.app` is unavailable because it is owned by another Vercel project outside this account.
- Current main branch latest known commit: `955a498` (`Rename app to Coin Quest`)
- Last known production deployment: `https://coin-quest-7fxvyb3in-purichwc-1517s-projects.vercel.app`

## Start Here In A New Chat

1. Read `Memory.md` and `PLAYBOOK.md` first.
2. Check `git status --short --branch` before editing.
3. For small visual tweaks, default to Fast UI Patch unless the user asks to commit/deploy.
4. Preserve newest user requirements over any older Claude prototype/handoff behavior.
5. Never modify legacy inactive snapshots unless explicitly asked.

## Important Files

- `trip/index.html`: live Expense Splitter / Party Ledger app shell, styles, static markup, and script loader.
- `trip/app.js`: live Expense Splitter / Party Ledger app behavior, state, rendering, Firebase/test persistence, event delegation, import/export, and overlays.
- `admin/index.html`: Phase 1 Super Admin Portal shell, responsive table/modal styling, and Firebase compat script loader.
- `admin/app.js`: Phase 1 Super Admin Portal behavior for local gate, board/admin/user editing, drafts, publish, restore, and revision logs.
- `character/index.html`: responsive Character Profile shell and portrait/stats/history layout.
- `character/app.js`: Character Profile loading, board aggregation, privacy/share mode, i18n, and rendering.
- `index.html`: live toolbox home and price comparison entry.
- `lang.js`: shared i18n for Thai and English across the toolbox. Every user-facing string needs both languages.
- `shared/pointy-logic.js`: shared calculation, normalization, class registry, split logic, price comparison logic.
- `trip/pixicons.jsx`: labeled pixel icon registry/renderer/migration helpers.
- `assets/rpg-portraits/`: current full-body class portrait assets, 18 classes x 2 genders plus skin art.
- `assets/icons/loot-chest.svg`: app icon.
- `tests/e2e/coin-quest.spec.mjs`: critical browser flows for Expense Splitter, Debt Dragon, Character Profile, Admin Portal, and price comparison.
- `tests/unit/pointy-logic.test.mjs`: unit coverage for calculations and normalization.
- `PLAYBOOK.md`: workflow rules and change modes.
- `trip/index.legacy.html` and `index.legacy.html`: inactive legacy snapshots; do not touch unless requested.

## Current App Shape

The app is still no-build static HTML/CSS/JS, but the Expense Splitter is now split between `trip/index.html` and `trip/app.js`. Firebase Firestore compat SDK is loaded from CDN in `trip/index.html`; app behavior loads from `/trip/app.js`. Trip ID comes from `?id=`; if absent, it can redirect to `localStorage.getItem('last_trip_id')`. Auto-save is debounced at 800ms.

`trip/app.js` owns the shell event delegation and the expense-entry dynamic controls. Some dynamic hero/admin/overlay renderers still use inline handlers; do not rewrite all of them casually unless doing a focused refactor with full tests.

The Expense Splitter tab is now RPG/Party Ledger styled. It supports:

- Hero party cards with full-body class portraits.
- Explicit hero selection before confirming a new participant. No default hero.
- A web modal confirmation before locking a hero. Confirmed class/gender cannot be changed through normal UI.
- Duplicate avatar/class selections are allowed across different participants.
- 18 classes, in this order:
  `warrior`, `wizard`, `cleric`, `monk`, `bard`, `dragoon`, `summoner`, `thief`, `ranger`, `alchemist`, `necromancer`, `engineer`, `berserker`, `archfiend`, `corsair`, `reveler`, `seraph`, `tiderunner`.
- Gender variants: `female`, `male`.
- Skin system: optional `heroSkins` field. Currently includes `crimson-regent-male` for `archfiend-male`.
- Character ID system: auto-generated 4-digit IDs, admin-view/edit/delete via Settings.
- Admin setup: custom game URL + password, unlock stored in session storage.
- Sound and animation quick toggles at top-right.
- Quest board/campaign history and cross-game character progress.
- Split modes: equal, shares, exact, percent, itemized loot.
- Multi-payer support.
- Excel import/export/template via ExcelJS CDN.
- Compact labeled pixel icon picker for expense categories.

## Admin / Board Ownership

Party Ledger stores admin ownership metadata under `state.admin`:

- `ownerHash`: local hashed identity used to group one Board Admin across multiple boards.
- `adminId`: visible/admin-editable Board Admin ID.
- `adminName`: visible/admin-editable Board Admin nickname.
- `passwordHash`: board unlock password hash. The original password cannot be recovered; it can only be reset by an authorized admin surface.

The trip UI now asks for Board Admin ID and nickname when creating/admin-setting a board, and remembers the creator profile locally for convenience. Same Admin ID can intentionally own multiple boards.

Phase 1 Super Admin Portal lives at `/admin/`. It can list and edit boards, Board Admin IDs/nicknames, board URLs, users/character IDs, reset board passwords, add/delete boards/users, save drafts to `localStorage`, restore the latest published snapshot, publish changes to Firestore, and show simple revision logs. Phase 1 gate is local only and is not real security. True "คนนอกเข้าไม่ได้เลย" requires Phase 2 Firebase Auth plus Firestore Security Rules.

## Character Profiles

Character Profile lives at `/character/?id=1234`. The hero card Character ID and Admin Portal Users table link to this page. It combines the `characters/{id}` record with matching `trips` documents and shows portrait/skin, class, level/XP, aggregate spending stats, board history, achievements, admin-owned boards, activity dates, and board links.

Profiles support Thai/English and responsive desktop/tablet/mobile layouts. Money privacy uses `private=1` in the URL and renders monetary values as hidden placeholders, so copied links open in privacy mode. This is display privacy, not database access control.

Board admin ownership can store `admin.characterId`. Party Ledger automatically links it when the admin nickname matches a participant and preserves it when that Character ID changes. Legacy boards still fall back to matching `adminName`.

## Pixel Icon Picker

The icon picker should stay very compact. Current intended size:

- Popup: about `166px` wide.
- Grid: 3 columns, `48px` each.
- Cell: about `48px x 47px`.
- Option icon size: `18px`.
- The selected/current button icon remains `34px`.

The picker uses `window.QUEST_ICON_IDS` from `trip/pixicons.jsx`; emoji legacy data is migrated through helper functions. Do not replace saved emoji data blindly; use the migration helpers.

## Avatar / Hero Rules

- Source of truth for class order and class metadata is `shared/pointy-logic.js`.
- UI portrait resolver and skin resolver live in `trip/index.html`.
- Asset checks expect files in `assets/rpg-portraits/`.
- `scripts/check-assets.mjs` verifies all required portrait/skin assets.
- If adding a class, update class metadata, asset checks, tests, and any picker assertions.
- If adding a skin, keep data shape optional: absence of skin means default art.

## Claude Design / Handoff Rules

Claude source files in Downloads may be used as visual/interaction reference, but do not edit them directly.

When implementing Claude handoff:

- Treat Claude HTML/source as the visual reference.
- Treat the newest user requirement as higher priority if there is a conflict.
- Port only the relevant UI, asset, interaction, animation, or sound for the requested area.
- Preserve app functionality, Firebase state shape, i18n, and tests.
- Before recreating assets or sounds, inspect the supplied Claude HTML/project because assets are often embedded or already present there.

## Testing Workflow

Use the lightest verification that fits the requested mode:

- Fast UI Patch: `npm run test:syntax` plus a focused visual/browser check if layout matters.
- Standard Safe Patch: `npm run test:syntax` plus targeted Playwright/e2e for the affected flow.
- Production Patch: full `npm test`.
- Responsive-sensitive changes should be checked on desktop, tablet, and mobile. Playwright now has projects for `chromium`, `tablet` (`820 x 1180`), and `mobile`.

Available commands:

```bash
cd /Users/point/toolbox
npm run test:syntax
npm run test:assets
npm run test:unit
npm run test:e2e
npm test
npm run serve
```

Local preview:

```bash
cd /Users/point/toolbox
npm run serve
# http://127.0.0.1:4569/trip/
```

Production deploy:

```bash
cd /Users/point/toolbox
vercel --prod --yes
```

Push:

```bash
cd /Users/point/toolbox
git push origin main
```

## User Preferences

- For tiny visual changes, do not over-verify by default. Use Fast UI Patch.
- When the user says `commit deploy`, run full `npm test`, commit, push to GitHub, and deploy production.
- When refactoring `trip/index.html` / `trip/app.js`, keep changes incremental and run full `npm test`; the suite now covers desktop, tablet, and mobile.
- Keep responses concise and in Thai unless the user switches language.
- The user values high-fidelity Claude Design matching, but not at the cost of regressing newer requirements.
- Report clearly whether changes are uncommitted, committed, pushed, and/or deployed.

## Recent Commits

- `9096b38` Reset admin portal local slate
- `f5073c0` Add phase 1 admin portal
- `63cdfee` Add admin owned board tracking
- `216ce7b` Add archfiend black red swimmer skin
- `35c20fc` Add recoverable trip admin setup
- `6ed387e` Add archfiend swimmer skin
- `053239f` Update project memory and playbook
- `b717339` Refactor trip app shell
- `2554971` Shrink expense icon picker
- `410654a` Compact pixel icon picker
- `e7d13bc` Add labeled pixel icon pickers
- `df61b48` Add expanded hero roster and avatar skins
- `719b2a0` Add party ledger handoff features
- `5a58874` Add split expense admin character IDs
- `8e62ba7` Refactor shared app logic
- `29bfc73` Add automated tests
- `33a7788` Implement Claude expense splitter handoff
