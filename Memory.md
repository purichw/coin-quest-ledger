# Memory: Pointy Super App

Last updated: 2026-06-15

## Project

- Workspace: `/Users/point/toolbox`
- GitHub: `git@github.com:purichw/Pointy-Super-App.git`
- Live production URL: `https://pointy-super-app.vercel.app`
- Vercel project: `pointy-super-app`
- Current main branch latest known commit: `b717339` (`Refactor trip app shell`)
- Last known production deployment: `dpl_9MqHYPu77irg3WVwQRxC7dyt6QDA`

## Start Here In A New Chat

1. Read `Memory.md` and `PLAYBOOK.md` first.
2. Check `git status --short --branch` before editing.
3. For small visual tweaks, default to Fast UI Patch unless the user asks to commit/deploy.
4. Preserve newest user requirements over any older Claude prototype/handoff behavior.
5. Never modify legacy inactive snapshots unless explicitly asked.

## Important Files

- `trip/index.html`: live Expense Splitter / Party Ledger app shell, styles, static markup, and script loader.
- `trip/app.js`: live Expense Splitter / Party Ledger app behavior, state, rendering, Firebase/test persistence, event delegation, import/export, and overlays.
- `index.html`: live toolbox home and price comparison entry.
- `lang.js`: shared i18n for Thai and English across the toolbox. Every user-facing string needs both languages.
- `shared/pointy-logic.js`: shared calculation, normalization, class registry, split logic, price comparison logic.
- `trip/pixicons.jsx`: labeled pixel icon registry/renderer/migration helpers.
- `assets/rpg-portraits/`: current full-body class portrait assets, 18 classes x 2 genders plus skin art.
- `assets/icons/loot-chest.svg`: app icon.
- `tests/e2e/pointy-super-app.spec.mjs`: critical browser flows for Expense Splitter and price comparison.
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
