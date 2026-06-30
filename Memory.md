# Memory: Coin Quest Ledger

Last updated: 2026-06-30

## Project

- Workspace: `/Users/point/Library/Mobile Documents/com~apple~CloudDocs/Website Projects/toolbox`
- GitHub: `git@github.com:purichw/coin-quest-ledger.git`
- Live production URL: `https://coin-quest-ledger.vercel.app`
- Vercel project: `coin-quest-ledger`
- Firebase project ID is still `pointy-personal-toolkit` intentionally. This is a legacy backend/internal identifier, not user-facing. Do not rename/migrate it just for aesthetics; migrate only as a planned infrastructure/security phase with backup, data copy, full regression, and rollback.
- Short URL `https://coin-quest.vercel.app` is unavailable because it is owned by another Vercel project outside this account.
- Main branch: `main`
- Latest pushed commit: `4a04d71` (`Add GitHub Actions CI CD`).
- Latest verified production deploy: commit `4a04d71`, CI deployment `https://coin-quest-ledger-o4haqkje6-purichwc-1517s-projects.vercel.app`, aliased to `https://coin-quest-ledger.vercel.app` on 2026-06-30 after GitHub Actions `CI/CD` passed full `npm test`.
- Latest production should still be verified with `vercel ls` or by curling the live URL after a new deploy.

## Start Here In A New Chat

1. Read `Memory.md` and `PLAYBOOK.md` first.
2. Check `git status --short --branch` before editing.
3. For small visual tweaks, default to Fast UI Patch unless the user asks to commit/deploy.
4. Preserve newest user requirements over any older Claude prototype/handoff behavior.
5. Never modify legacy inactive snapshots unless explicitly asked.
6. For system shape, read `architecture.md`; for route/module interactions, read `SITE_MAP_AND_INTERACTIONS.md`; for file lookup, read `PROJECT_STRUCTURE_GUIDE.md`; for data shape, read `data-contracts.md`; for invites/guests, read `INVITES_AND_GUESTS.md`; for leveling/XP, read `leveling-canon.md`; for Claude references and exact visual work, read `claude-design-index.md` plus `CLAUDE_TO_A_TEE_QA.md`; for next-step planning, read `roadmap.md`.
7. Current user instruction: ignore `CLAUDE_RECOVERY.md` unless the user explicitly re-enables it. For Party Ledger references, use the split zips in Downloads before loading the full 20MB+ offline HTML.

## Important Files

- `architecture.md`: current static app architecture, routes, shared modules, identity model, persistence, design sources, test/deploy flow, and hard invariants.
- `SITE_MAP_AND_INTERACTIONS.md`: route map, module dependency graph, cross-surface flows, side effects, and regression risks.
- `PROJECT_STRUCTURE_GUIDE.md`: practical file map for common edit tasks, shared modules, tests, assets, and do-not-edit-blindly areas.
- `data-contracts.md`: practical Firestore/local/session storage contracts, derived Character Profile shape, and migration rules.
- `INVITES_AND_GUESTS.md`: canon for Character-ID invites, Add Guest, Reminders accept/decline, direct invite links, and pairwise settlement regression.
- `CLAUDE_TO_A_TEE_QA.md`: exact Claude Design component-level fidelity and mobile/tablet/desktop audit protocol.
- `leveling-canon.md`: v1 XP/Reputation canon for Character XP, positive-only Profile Reputation, level thresholds, reward titles, and Admin display rules.
- `claude-design-index.md`: map of Claude reference sources to live surfaces, plus notes on mobile coverage and route wiring.
- `roadmap.md`: phased roadmap for profile integration, mobile parity, real auth/security, admin maturity, character progress, and recovery.
- `CLAUDE_RECOVERY.md`: deprecated/ignored for now by current user instruction. Do not read/use it unless explicitly re-enabled.
- Claude/offline design exports are kept outside Git; do not commit large offline HTML or zip copies.
- `trip/index.html`: live Expense Splitter / Party Ledger app shell, styles, static markup, and script loader.
- `trip/app.js`: live Expense Splitter / Party Ledger app behavior, state, rendering, Firebase/test persistence, event delegation, import/export, and overlays.
- `admin/index.html`: Phase 1 Super Admin Portal shell, responsive table/modal styling, and Firebase compat script loader.
- `admin/app.js`: Super Admin Portal behavior for Google-auth allowlist, board/admin/user editing, account lifecycle, drafts, publish, restore, and revision logs.
- `character/index.html`: responsive Character Profile shell and portrait/stats/history layout.
- `character/app.js`: Character Profile loading, board aggregation, privacy/share mode, i18n, and rendering.
- `index.html`: live toolbox home and price comparison entry.
- `lang.js`: shared i18n for Thai and English across the toolbox. Every user-facing string needs both languages.
- `shared/pointy-logic.js`: shared calculation, normalization, class registry, split logic, price comparison logic, and canonical level helpers.
- `shared/profile-hub.js` / `.css`: shared profile/auth orchestrator. Keep behavior orchestration here, but new pure helpers or isolated renderers should live in the focused `shared/profile-*.js` modules.
- `shared/profile-session.js`, `shared/profile-auth.js`, `shared/profile-cloud.js`, `shared/profile-recovery.js`, `shared/profile-backup.js`, `shared/profile-login.js`, `shared/profile-character-create.js`, `shared/profile-drawer.js`, `shared/profile-reminders.js`, and `shared/profile-tour.js`: focused profile helper modules split out from the original hub so auth, recovery, backup, login/character rendering, drawer blocks, reminder rendering, and Welcome Tour slices can be reverted independently.
- `shared/mobile-shell.css` and `shared/mobile-shell.js`: Claude-style native phone shell shared by Home/Compare, Split, Debt Dragon, and Treasury. It injects the hamburger drawer and bottom tab bar at `max-width: 600px`; desktop/tablet topbars remain controlled by each page.
- `mobile/`: Expo / React Native player-side native app. Current slice is iOS-first, not a WebView wrapper, and wired to real Firebase Auth/Firestore for username login/signup, Character Creation, Profile, Split board reads/writes, and native-owned `playerModules/{uid}` state for Debt Dragon, Treasury, and Compare.
- `mobile/IOS_BUILD_NOTES.md`: repeatable iOS native build/install runbook, including design-first gates, Xcode/device signing commands, `devicectl` install/launch, ExpoModulesJSI patch notes, and lessons learned from the first real iPhone install.
- `trip/pixicons.jsx`: labeled pixel icon registry/renderer/migration helpers.
- `assets/rpg-portraits/`: current full-body class portrait assets, 18 classes x 2 genders plus skin art.
- `assets/icons/loot-chest.svg`: app icon.
- `tests/e2e/coin-quest-ledger.spec.mjs`: critical browser flows for Expense Splitter, Debt Dragon, Character Profile, Admin Portal, and price comparison.
- `tests/unit/pointy-logic.test.mjs`: unit coverage for calculations and normalization.
- `PLAYBOOK.md`: workflow rules and change modes.
- `trip/index.legacy.html` and `index.legacy.html`: inactive legacy snapshots; do not touch unless requested.

## Claude Design / Recovery State

The original Claude Design project was accidentally deleted and Claude said it cannot be directly recovered. The recovery strategy is now:

- Use repo docs plus downloaded handoff files to reconstruct Claude context.
- `CLAUDE_RECOVERY.md` is currently ignored/deprecated by user instruction; use `Memory.md`, `PLAYBOOK.md`, `architecture.md`, `roadmap.md`, `ADMIN.md`, `claude-design-index.md`, and the actual downloaded references instead.
- Current local downloaded references verified on 2026-06-21: `/Users/point/Downloads/CLAUDE.md`, `/Users/point/Downloads/HANDOFF.md`, `/Users/point/Downloads/MOBILE-EXPORTS.md`, `/Users/point/Downloads/Coin Quest Ledger (iOS App).html`, and `/Users/point/Downloads/Coin Quest Ledger (Android App).html`.
- Fresh native-player export folder studied on 2026-06-21: `/Users/point/Downloads/Coin iOS Android/` with `CLAUDE.md`, `HANDOFF.md`, `MOBILE-EXPORTS.md`, `Coin Quest Ledger (iOS App).html`, and `Coin Quest Ledger (Android App).html`. Treat these as the latest iOS/Android player-native visual references when native MVP work resumes; they are player-side only and do not include Admin native.
- Older recovery bundle paths and split zips from earlier sessions may no longer exist locally. Check the filesystem before relying on them, or ask the user for a fresh Claude export.
- If Party Ledger split references are reintroduced, preserve `sound.jsx`; SFX are WebAudio code there, not separate `audio/*` files.

## Current App Shape

The app is still no-build static HTML/CSS/JS, but the Expense Splitter is now split between `trip/index.html` and `trip/app.js`. Firebase Firestore compat SDK is loaded from CDN in `trip/index.html`; app behavior loads from `/trip/app.js`. Trip ID comes from `?id=`; if absent, it can redirect to `localStorage.getItem('last_trip_id')`. Auto-save is debounced at 800ms.

`trip/app.js` owns the shell event delegation and the expense-entry dynamic controls. Some dynamic hero/admin/overlay renderers still use inline handlers; do not rewrite all of them casually unless doing a focused refactor with full tests.

Native phone navigation follows the Claude handoff: at `<= 600px`, the shared mobile shell shows a hamburger drawer plus a fixed bottom tab bar (`Home`, `Split`, `Debt`, `Prices`, `Treasury`). It is intentionally CSS-gated so desktop and tablet layouts keep their existing module-specific topbars. Tablet/touch uses the Claude `hover:none` / `pointer:coarse` tier from the 2026-06-20 exports: larger 44px tap targets, single-column Compare cards at `601-820px`, and module-specific touch polish without adopting the phone shell. The Compare view still exposes the visible `Home` back button on mobile because current regression tests and user flow depend on it.

2026-06-21 mobile web parity note: the live shared phone shell was aligned with the newest Claude mobile-web exports for iPhone SE / iPhone / iPhone Pro / Pro Max widths. Phone topbars are one compact row with burger, `Coin Quest`, and reminder bell; player module topbar back pills are hidden on Split/Debt/Treasury while Compare keeps its explicit Home back path; bottom tabs use the Claude labels `หน้าหลัก / แบ่งเงิน / มังกร / ราคา / คลัง`; Home uses the green hero title and chest Split card icon; the first-load eye is intentionally small. The iPhone touch pass also keeps hover-only controls visible on touch, protects Split banner actions from ragged wrapping, and preserves zero horizontal overflow at 375/393/430px.

2026-06-30 Party Ledger character/invite/settlement note: adding a real "other hero" while signed in is Character-ID-only and must resolve an existing character record. It must not show or validate "Other hero's name", must not generate a new Character ID from arbitrary input, and duplicate visible names are allowed. The action is `Invite`, not `Confirm Character`; the board admin confirms the invite, then the target account receives a Reminders notification and can Accept or Decline within 24 hours. Decline requires confirmation. A direct party invite link can join immediately, but unauthenticated users must be sent to login first. The alternate path is "Add Guest": user enters a display name and chooses class/gender/skin, but no real Character ID or character registry record is created. Guest participants are flagged in `guestHeroes` and omitted from Character XP/registry sync. Settlement must use pairwise per-expense obligations with reciprocal pair netting, not global creditor/debtor rerouting; the known regression case is `PPP -> Pointy ฿1,000`, `PPP -> PP ฿333.33`, and `PP -> Pointy ฿666.67`. Web and native/mobile logic should stay in parity for this calculation. See `INVITES_AND_GUESTS.md`.

2026-06-29 Claude Design micro-cosmetic rule: when the user says "TO A TEE" for Claude Design, do not stop at broad layout similarity. Audit component-level geometry against the offline HTML/CSS: exact-ish padding, font size/weight, radius, border style, hit target, icon centering, and mobile overrides. Recent locked examples: quest-row close button is a 22px circle with centered `x`; `Attach receipt` is the small dashed Claude-style button; `Whole party` is a compact dashed pill, not a large touch-expanded button; split segment sizing must preserve the Claude mobile proportions and avoid page-level horizontal overflow on iPhone SE / iPhone / iPhone Pro Max.

Keyword memory: whenever the user says "to a tee" about Claude Design, expand it internally to: `CLAUDE TO A TEE AUDIT. Implement from the offline Claude HTML exactly at component level, mobile included, and verify before commit/deploy.`

The shared profile/auth loop now supports real username/password account creation through Firebase Auth in production. Local test accounts exist only behind explicit `?test=1` regression mode; production must never fall back to built-in accounts when Firebase is missing or still loading. Users type a username, not a real email; the profile modules map it to an internal `username@coinquest.local` Firebase Auth email, create/load `users/{uid}`, route accounts without a character through one-time Character Creation, write the active character to `characters/{id}`, and mirror the session to `pointy_auth_v1`. Current canon remains one account = one active character. On mobile, profile is reached through the shared hamburger drawer. Signed-in module/profile progress is account-scoped through `shared/account-scope.js`; never treat stale browser-wide `localStorage` module keys as the signed-in account's progress.

Production profile/auth gate must not trust stale `pointy_auth_v1` mirrors before Firebase Auth has resolved the current user. Character Creation is allowed only after a real sign-in/signup account is established, or under explicit `?test=1` regression mode.

Debt Dragon web now uses daily interest accrual for the live local ledger. Each dragon tracks `interestAccruedAt`; opening the lair, advancing month, and striking a dragon accrue interest to the relevant date before applying payments. This means paying a compound-interest debt before the due/end date lowers the balance used for the remaining days' interest. The long-range payoff forecast is still a monthly approximation.

2026-06-22 native player app MVP slice: `mobile/` now uses the same production Firebase project and public username contract as the web app. Sign In and Sign Up use `username@coinquest.local`; Sign Up writes Recovery ID metadata to `users/{uid}` and recovery hash metadata to `usernames/{username}`; Profile displays the current Recovery ID and can regenerate it, overwriting the username recovery hash immediately; Character Creation writes `characters/{id}` and mirrors the active character to `users/{uid}`; Split reads real `trips/{id}` linked by `characterIds` or `admin.characterId`, can create a Firestore board, and can add an equal-split expense. Debt Dragon, Treasury, and Compare read/write native-owned `playerModules/{uid}` Firestore state so they are dynamic and do not use static Claude/sample data. Verification for this slice: `mobile/npm run typecheck` passed, `npx expo export --platform ios --output-dir /tmp/coinquest-mobile-export-github` passed, root `npm test` passed on rerun (`65 passed`, `4 skipped`), production deploy/curl passed, and a Release iPhone device build/install succeeded for bundle `com.purichwc.coinquestledger`.

Native design/build rule from the first iPhone install: do not repeat the "build first, discover ugly/static later" failure mode. Before a real device build or install, run a Claude Design parity pass screen by screen against the fresh iOS/Android exports, and verify the same screens use real Firebase/Firestore data. Design fidelity and backend reality are both gates; neither can be deferred until after physical install.

Profile refactor rule: keep changes reversible by slice. When splitting `shared/profile-hub.js`, commit each coherent boundary separately after targeted tests so a broken helper can be reverted without rolling back unrelated auth/recovery/UI work.

Latest profile refactor handoff: `shared/profile-hub.js` is now a smaller orchestrator backed by focused browser-global helpers: `profile-session`, `profile-auth`, `profile-cloud`, `profile-recovery`, `profile-backup`, `profile-login`, `profile-character-create`, `profile-drawer`, `profile-reminders`, and `profile-tour`. Script load order matters: helper modules must load before `shared/profile-hub.js`.

Admin Users now merges real Firestore `users/{uid}` accounts with board-derived participants/admin roles. Real accounts without board membership should still appear in `/admin/` Users; board/admin links are additive, not the only source of truth.

Firebase Auth setup note: on 2026-06-19, Identity Platform/email-password was enabled for `pointy-personal-toolkit`, authorized domains were patched for localhost and `coin-quest-ledger.vercel.app`, and real username signup/login, recovery-code password reset, and Super Admin temp-password reset were verified with live Firebase Auth/Firestore test accounts. As of 2026-06-21, the profile side panel shows the current Recovery ID for the signed-in account and can regenerate it; regeneration overwrites the recovery hash immediately so the old code no longer works.

Security setup note: the repo `firestore.rules` was tightened and deployed on 2026-06-20 through `npx firebase-tools deploy --only firestore:rules --project pointy-personal-toolkit`, then updated/deployed again on 2026-06-22 for native `playerModules/{uid}` owner read/create/update. Character writes require owner/Super Admin, username mapping updates cannot be taken over by another user, deleted username tombstones can only be reclaimed by the newly signed-in user while preserving the same User ID, `playerModules/{uid}` is owner/Super Admin readable/writable, and `adminRevisions` requires Super Admin.

Super Admin production access uses Firebase Google Auth and only allows `purich.wc@gmail.com`. The `google.com` Firebase Auth provider was enabled on 2026-06-20 through the Identity Toolkit API with an OAuth client for `https://pointy-personal-toolkit.firebaseapp.com/__/auth/handler`. The old local gate exists only under `/admin/?test=1` for automated regression. Permanent delete is backend-only through `/api/admin-delete-user`; `/api/admin-delete-status` reports whether Vercel has the required Firebase Admin service account env vars. Production Vercel now has encrypted `FIREBASE_SERVICE_ACCOUNT_JSON` for `vercel-admin-delete@pointy-personal-toolkit.iam.gserviceaccount.com`, with `roles/firebaseauth.admin` and `roles/datastore.user`. Delete keeps `usernames/{username}` as a reusable deleted tombstone with the old User ID/Character ID, so a recreated username gets the same public ID. `firebase-admin` is pinned to `13.10.0` because `14.0.0` currently pulls a `jwks-rsa`/`jose` path that crashes on the Vercel Serverless runtime with `ERR_REQUIRE_ESM`.

Theme selection is global across Home, Split, Debt Dragon, and Treasury. The source of truth is `localStorage.pointy_theme`, mirrored into `coin_quest_ui_v1.theme` for shared shell/profile compatibility. Per-board or per-module legacy `settings.theme` values must not override the global theme on route load.

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

Super Admin Portal lives at `/admin/`. In production it uses Firebase Google Auth and only allows the Gmail `purich.wc@gmail.com`; `?test=1` keeps a local gate only for automated regression. It follows the newer Claude Admin source set for Dashboard, Relationship Map, Boards, Users, Board Admins, Audit Log, Version Control, Support Tools, tabs, modal shells, and responsive table behavior. It can list and edit boards, Board Admin IDs/nicknames, board URLs, users/active character IDs, reset board passwords, add/delete boards/users, save drafts to `localStorage`, restore the latest published snapshot, publish changes to Firestore, show revision/audit logs, rotate a real username account to a temporary password while preserving User ID/Character ID, and manage user lifecycle status. User lifecycle now has recoverable Archive/Deactivate/Reactivate from Admin; player login blocks archived/deactivated/delete-requested/deleted accounts. Permanent user deletion is backend-only through `/api/admin-delete-user`, which verifies a Firebase ID token for `purich.wc@gmail.com`, deletes Auth/user/character data, and tombstones the username for same-ID recreation. Mobile/tablet Admin follows the latest Claude export: below `1000px` the sidebar becomes a horizontal scroll nav, below `900px` Relationship Map stacks, below `760px` headers/actions compress and modals become bottom sheets, and coarse-pointer tablet gets 44px nav/button/ID-chip targets.

## Character Profiles

Character Profile lives at `/character/?id=1234`. The hero card Character ID and Admin Portal Users table link to this page. It combines the `characters/{id}` record with matching `trips` documents and shows portrait/skin, class, level/XP, aggregate spending stats, board history, achievements, admin-owned boards, activity dates, and board links.

Profiles support Thai/English and responsive desktop/tablet/mobile layouts. Money privacy uses `private=1` in the URL and renders monetary values as hidden placeholders, so copied links open in privacy mode. This is display privacy, not database access control.

Board admin ownership can store `admin.characterId`. Party Ledger automatically links it when the admin nickname matches a participant and preserves it when that Character ID changes. Legacy boards still fall back to matching `adminName`.

Leveling canon v1: Character XP uses `PointyLogic.levelFromXp()` with total XP thresholds `0, 300, 800, 1500, 2500, 4000, 6000, 8500, 12000, 16000`; Profile Reputation uses `PointyLogic.levelFromReputation()` with total Reputation thresholds `0, 900, 2200, 4200, 7500, 12000, 18000, 26000, 37000, 50000`. Profile Reputation is positive-only and credit-bureau inspired: good financial behavior earns score, but missed/late/over-budget behavior does not subtract score. `PointyLogic.levelFromRenown()` remains only a compatibility alias. Do not add local level formulas in feature files; update `leveling-canon.md` and `shared/pointy-logic.js` first.

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

Claude source files in Downloads are the visual/interaction Holy Grail for the requested surface. Do not edit them directly.

When implementing Claude handoff:

- Treat Claude HTML/source as the primary visual source of truth. The live implementation should be almost pixel-perfect against the supplied Claude design unless the newest user request explicitly says otherwise.
- Study the supplied HTML/source thoroughly before patching. Match the expected DOM/component structure and CSS class semantics; do not just paste Claude CSS over incompatible markup.
- If the existing implementation cannot match the Claude design cleanly, rework the implementation structure even if that means replacing a large section. A real rework is preferred over compatibility hacks that cause broken layouts, overflowing fields, or mismatched spacing.
- Treat the newest user requirement as higher priority if there is a conflict.
- Port only the relevant UI, asset, interaction, animation, or sound for the requested area.
- Preserve app functionality, Firebase state shape, i18n, and tests.
- Before recreating assets or sounds, inspect the supplied Claude HTML/project because assets are often embedded or already present there.
- Admin Portal specifically must follow Claude Design structure closely (`page-head`, `card`, `stat`, `tbl`, `detail-grid`, `profile-card`, `log-list`, modal patterns). Do not use legacy markup with broad compatibility CSS if it diverges visually.
- For Party Ledger micro-components, verify live CSS/DOM geometry against the offline Claude HTML before finishing. Do not let touch-comfort overrides silently enlarge Claude-compact controls such as receipt buttons, `Whole party`, split segments, or quest-row close buttons.

## Testing Workflow

Use the lightest verification that fits the requested mode:

- Fast UI Patch: `npm run test:syntax` plus a focused visual/browser check if layout matters.
- Standard Safe Patch: `npm run test:syntax` plus targeted Playwright/e2e for the affected flow.
- Production Patch: full `npm test`.
- Responsive-sensitive changes should be checked on desktop, tablet, and mobile. Playwright now has projects for `chromium`, `tablet` (`820 x 1180`), and `mobile`.
- Changes to `shared/mobile-shell.*` require at least Home/Compare, Split, Debt Dragon, and Treasury mobile checks, plus a desktop smoke check to confirm the burger/tab bar remain hidden.
- The E2E test `all player modules and admin portal keep their mobile and tablet responsive shells` is the current phone/tablet smoke guard for Home, Compare, Split, Debt, Treasury, Character Profile, Admin horizontal nav, Admin Relationship Map stacking, and Admin phone bottom-sheet behavior.

Available commands:

```bash
cd "/Users/point/Library/Mobile Documents/com~apple~CloudDocs/Website Projects/toolbox"
npm run test:syntax
npm run test:assets
npm run test:unit
npm run test:e2e
npm test
npm run serve
```

Native mobile commands:

```bash
cd "/Users/point/Library/Mobile Documents/com~apple~CloudDocs/Website Projects/toolbox/mobile"
npm run typecheck
npx expo export --platform ios --output-dir /tmp/coinquest-mobile-export
# Only after design/backend gates pass:
npx expo prebuild --platform ios
xcodebuild -workspace ios/CoinQuestLedger.xcworkspace -scheme CoinQuestLedger -configuration Release -destination 'id=<physical-udid>' -derivedDataPath /tmp/coinquest-ios-device-build -allowProvisioningUpdates build
xcrun devicectl device install app --device <coredevice-id> /tmp/coinquest-ios-device-build/Build/Products/Release-iphoneos/CoinQuestLedger.app
```

Read `mobile/IOS_BUILD_NOTES.md` before changing native build settings, signing, or install commands.

Local preview:

```bash
cd "/Users/point/Library/Mobile Documents/com~apple~CloudDocs/Website Projects/toolbox"
npm run serve
# http://127.0.0.1:4569/trip/
```

Do not preview app pages with `file://`; absolute `/shared/...` and route scripts will fail. Use `npm run serve` or production.

Production deploy:

```bash
cd "/Users/point/Library/Mobile Documents/com~apple~CloudDocs/Website Projects/toolbox"
vercel --prod --yes
vercel alias set <deployment-url> coin-quest-ledger.vercel.app
```

Push:

```bash
cd "/Users/point/Library/Mobile Documents/com~apple~CloudDocs/Website Projects/toolbox"
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

- `4a04d71` Add GitHub Actions CI CD
- `fe02309` Extract board invite helpers
- `c6dcbbf` Add board invite approval flow
- `757fde0` Audit production-facing placeholder copy
- `85ad304` Polish auth placeholders
- `75874f3` Add native mobile app MVP
- `e07b148` Align mobile web with Claude design
- `5de54b2` Refresh handoff docs
- `cf35a35` Document login and character renderer boundaries
- `678f438` Extract character creation rendering
- `b3576e6` Extract profile login rendering
- `d0d5730` Document profile module boundaries
- `04f2dee` Extract profile reminder rendering
- `486f8b8` Extract profile cloud boundary
- `93f7258` Extract profile backup helpers
- `ac01f5a` Use profile session store in auth watcher
- `bbeff31` Extract profile drawer blocks
- `91f4670` Extract profile tour rendering
- `2ec8ace` Extract profile session storage
- `82cabcc` Extract profile auth core helpers
- `5e7f451` Extract profile recovery helpers
- `4b76b6b` Harden auth recovery and test-only fallbacks
- `a071890` Tighten Claude visual responsive polish
- `72d9179` Fix Debt Dragon account hero sync
- `8c88f22` Fix admin delete legacy cleanup
- `17a2042` Normalize player control chrome
