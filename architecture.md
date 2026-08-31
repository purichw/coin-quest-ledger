# Coin Quest Ledger Architecture

Last updated: 2026-07-14

## Purpose

Coin Quest Ledger is a no-build static web app for Pointy's personal finance and RPG-style tooling. The live repo favors plain HTML/CSS/JS, shared browser modules, Firebase compat SDKs, and Playwright regression coverage over a bundler or framework.

Claude Design handoffs are the visual/interaction source of truth for surfaces the user explicitly asks to port, but live app behavior, newer user requirements, state shape, and tests remain binding.

Companion docs:

- `data-contracts.md`: persisted data shapes and migration rules.
- `SITE_MAP_AND_INTERACTIONS.md`: route/module dependency map, interaction flows, side effects, and cross-module risks.
- `PROJECT_STRUCTURE_GUIDE.md`: practical file-finding guide for common tasks.
- `ACCOUNT_MANAGEMENT_IMPLEMENTATION.md`: account creation, recovery reset, and Admin Portal user-management implementation flow.
- `ADMIN_PORTAL_IMPLEMENTATION.md`: live Admin Portal source map, behavior boundaries, lifecycle operations, reset/delete flows, and verification.
- `SECURITY_AND_FIREBASE_RULES.md`: Firebase Auth, Firestore Rules, Admin SDK endpoints, Spark/Blaze reality, and hardening notes.
- `DEPLOYMENT_AND_ROLLBACK_RUNBOOK.md`: CI/CD, deploy, alias, Firebase rules deploy, and rollback runbook.
- `TESTING_MATRIX.md`: targeted test selection by change type.
- `NATIVE_WEB_PARITY.md`: web/native backend contract map and native design/backend gates.
- `INVITES_AND_GUESTS.md`: Party Ledger participant-entry canon for invites, guests, reminders, direct links, and settlement risks.
- `CLAUDE_TO_A_TEE_QA.md`: exact Claude Design component-level QA protocol.
- `claude-design-index.md`: Claude reference map and inspection notes.
- `leveling-canon.md`: current XP/level tracks, rewards, thresholds, and recalibration backlog.
- `roadmap.md`: phased product/engineering plan and open decisions.

## Runtime Model

- Source root: `/Users/point/Library/Mobile Documents/com~apple~CloudDocs/Website Projects/toolbox`
- Production: `https://coin-quest-ledger.vercel.app`
- Hosting: Vercel static deployment
- Backend: Firebase Firestore compat SDK, project id `pointy-personal-toolkit`
- Build step: none
- Local preview: `npm run serve`, usually `http://127.0.0.1:4569/`
- For the current pushed source snapshot, run `git log -1 --oneline origin/main`.
- Verify live production with the deploy runbook before claiming a deployment snapshot.

Do not preview app pages with `file://`. Pages use absolute paths such as `/shared/pointy-logic.js` and `/character/app.js`; those only resolve correctly through the static server or production host.

## App Surfaces

### Home / Price Arena

- Files: `index.html`
- Owns the toolbox launcher and price comparison view.
- Loads `shared/profile-hub.*` and `shared/mobile-shell.*`.
- Price comparison logic uses `shared/pointy-logic.js`.

### Party Ledger / Expense Splitter

- Files: `trip/index.html`, `trip/trip-utils.js`, `trip/app.js`, `trip/pixicons.jsx`
- Route: `/trip/?id=1234`
- Owns trip state, expense entry, split modes, hero party cards, admin setup, import/export, board history, and Firestore trip sync.
- Real-character participant add is an invite flow by Character ID; guests are board-only and do not create Character IDs. See `INVITES_AND_GUESTS.md`.
- Settlement uses pairwise per-expense obligations with reciprocal pair netting, not global debtor/creditor routing.
- Uses `?test=1` with `sessionStorage.pointy_test_trip_*` in Playwright tests.
- Uses Firestore `trips/{id}` in normal mode.

### Debt Dragon

- Files: `debt/index.html`, `debt/app.js`
- Route: `/debt/`
- Local-first debt payoff game/tool using `localStorage`.
- Shares theme, profile hub, mobile shell, and character registry concepts.
- Uses daily interest accrual for the live ledger: each dragon tracks
  `interestAccruedAt`; strikes accrue interest to the payment date before
  applying the payment, so early payments reduce the following days' compound
  interest. The payoff forecast remains a monthly approximation.

### Treasury

- Files: `treasury/index.html`, `treasury/app.js`
- Route: `/treasury/`
- Local treasury ledger/tool using `localStorage`.
- Shares theme, profile hub, and mobile shell.

### Character Profile

- Files: `character/index.html`, `character/app.js`
- Route: `/character/?id=1234`
- Aggregates `characters/{id}` with readable trips containing that Character ID.
- Renders Claude Character Profile visual structure: banner, ID card, stats ribbon, module cards, trophies, account card, and board history.
- Supports `private=1` display privacy for money values. This is not authorization.
- The page is public-display oriented; actual data access still depends on Firestore rules.

### Super Admin Portal

- Files: `admin/index.html`, `admin/admin-utils.js`, `admin/app.js`, `admin/admin.css`
- Route: `/admin/`
- Admin tool for listing/editing boards, users, active characters, Board Admin metadata, passwords, drafts, publishing, revision logs, support tools, relationship views, and user lifecycle.
- Live implementation details are maintained in `ADMIN_PORTAL_IMPLEMENTATION.md`; `ADMIN.md` is retained as prototype/handoff history.
- Production access uses Firebase Google Auth and only allows `purich.wc@gmail.com`. The old local gate remains only under `?test=1` for automated tests.
- User lifecycle is two-stage: recoverable `archived` / `deactivated` / `active` status is written to Firestore by the Super Admin UI, and permanent delete is delegated to `/api/admin-delete-user` using Firebase Admin SDK after verifying the Google-auth ID token. Permanent delete removes the Auth user, user doc, and character docs, but keeps a deleted reusable username tombstone so recreating the same username restores the same public User ID/Character ID.
- `/api/admin-delete-status` is a non-secret readiness endpoint for the Admin UI. It reports whether Vercel has the Firebase Admin service-account env vars needed for privileged delete, so production can disable permanent delete when backend credentials are missing.
- Responsive model is admin-specific: below `1000px` the sidebar becomes a horizontal scroll nav; below `900px` Relationship Map stacks; below `760px` topbar/actions compress, dense tables scroll, and modals render as bottom sheets; coarse-pointer tablets get 44px touch targets.
- Real private admin access requires Firebase Auth and deployed Firestore Security Rules.

### Native Player App

- Files: `mobile/`
- Runtime: Expo / React Native, currently iOS-first.
- Scope: player side only, not Admin and not a WebView wrapper.
- Current state: committed in `75874f3` as an Expo SDK 56 TypeScript app wired to the shared production backend for player identity, character/profile, Split, and native player modules. It includes real username/password Sign In and Sign Up, Recovery ID creation/regeneration, one-time Character Creation, Home Hub, Split board selection, Firestore board creation, equal-split expense creation, Debt Dragon, Treasury, Compare, Profile sheet, and Character page.
- Persistence/auth: uses the same Firebase project as the web app. Username/password maps to internal `username@coinquest.local`; `users/{uid}`, `usernames/{username}`, `characters/{id}`, `trips/{id}`, and `playerModules/{uid}` are the native runtime contracts.
- `playerModules/{uid}` is native-owned Firestore state for Debt Dragon, Treasury, and Compare. This keeps native dynamic without pretending the browser localStorage stores for those web modules have already been migrated.
- Build/install reality: generated `ios/` and `android/` folders are ignored and should be regenerated locally with Expo prebuild when needed. The first physical Release install succeeded on iPhone `Pointy` with bundle `com.purichwc.coinquestledger` using an Apple Development profile for team `365NSPNKXD`.
- Verification: from `mobile/`, `npm run typecheck` passes and `npx expo export --platform ios --output-dir /tmp/coinquest-mobile-export-github` passes. Root `npm test` passed on rerun (`65 passed`, `4 skipped`) before `75874f3` was pushed/deployed. See `mobile/IOS_BUILD_NOTES.md` for the full device build/install runbook and pitfalls.

## Shared Modules

- `shared/pointy-logic.js`: shared data normalization, split math, price math, class registry, level helpers, and character profile aggregation.
- `lang.js`: Thai/English shared labels.
- `shared/firebase-client.js`: shared Firebase app/Auth/Firestore initializer for static pages.
- `shared/account-scope.js`: account-scoped local storage helper. Module progress/cache keys derive from the active `pointy_auth_v1` account (`uid`, then User ID, then username) so a signed-in account does not inherit stale browser-wide progress.
- `shared/board-invites.js`: board invite payloads, 24-hour expiry, test-mode localStorage persistence, production `users/{uid}/boardInvites` writes, status updates, and active filtering.
- `shared/profile-hub.js` / `.css`: profile orchestrator for username/password Sign In/Sign Up, Firebase Auth + Firestore user/character binding, one-time Character Creation, topbar/mobile-drawer profile entry, My Boards, theme/language helpers, profile drawer events, and sign out.
- `shared/profile-session.js`: `?test=1` mode detection plus local auth/account storage helpers for `pointy_auth_v1` and `pointy_accounts_v1`.
- `shared/profile-auth.js`: username normalization, internal `@coinquest.local` email formatting, account login keys, and blocked account status helpers.
- `shared/profile-cloud.js`: Firebase Auth/Firestore/server timestamp access boundary for profile code.
- `shared/profile-recovery.js`: Recovery ID generation and hashing helpers.
- `shared/profile-backup.js`: profile drawer export/restore helpers for local Coin Quest data.
- `shared/profile-login.js`: Sign In/Sign Up and recovery reset form renderers.
- `shared/profile-character-create.js`: one-time Character Creation card and hero picker renderer.
- `shared/profile-drawer.js`: profile drawer recovery/account block renderers.
- `shared/profile-reminders.js`: reminder overlay renderer.
- `shared/profile-tour.js`: Welcome Tour step data and renderer.
- `shared/mobile-shell.js` / `.css`: phone-only hamburger drawer and bottom tab bar for Home/Compare, Split, Debt, Prices, and Treasury. Tablet/touch remains CSS-only in each surface plus shared profile CSS.
- `shared/first-load.js` / `.css`: first-load splash.
- `shared/cloudinary-assets.js` and `shared/asset-urls.js`: production asset URL resolution.
  Production `?test=1` uses manifest-backed assets; local assets are forced only
  on localhost/private hosts or explicit `?assets=local`. The tiny
  `fallback-assets/` directory covers known production-only gaps while the
  larger `assets/` tree stays out of the Vercel payload.

Page-local helper globals:

- `trip/trip-utils.js`: Party Ledger utility layer for ID/code generation,
  theme persistence, HTML/attribute escaping, money formatting, and admin hash
  helpers. It deliberately avoids trip state and rendering.
- `admin/admin-utils.js`: Super Admin utility layer for escaping, cloning,
  user lifecycle status normalization, username/reset helpers, recovery hashing,
  and level display helpers. It deliberately avoids Firebase reads/writes and
  app state.

Shared modules are browser globals. Keep additions conservative and compatible with static script loading order.

Current profile boundary rule: `shared/profile-hub.js` orchestrates flows and event wiring; helper modules own isolated rendering, recovery/auth/session/cloud/backup utilities, and drawer/tour/reminder blocks. Preserve that split so individual slices can be reverted without rolling back the whole auth/profile stack.

## Identity Model

Current product model has separate identities:

- User ID: account/person identity. Production signups use Firebase Auth with username/password via an internal `@coinquest.local` auth email, then store profile data in `users/{uid}`. `?test=1` regression mode stores mirrors in `localStorage.pointy_auth_v1`.
- Character ID: playable hero identity, four digits, stored in trip participant maps and `characters/{id}`.
- Admin ID: Board Admin identity, can own multiple boards and intentionally repeat across boards.
- Board ID / Trip ID: four-digit route/document ID for a board.

The latest Claude loop implemented in the live static app treats one account as having one active character. The broader product model can still evolve toward multiple characters per user later. One user can still have many admin IDs. One admin ID can own many boards. Do not globally de-dupe Admin IDs unless the user changes the requirement.

Recovery ID is intentionally visible in the signed-in profile side panel for this small private app through the local signed-in mirror. Firestore stores only the recovery hash on owner-scoped `users/{uid}`; new writes delete/avoid the legacy public `usernames/{username}.recoveryHash` field. Regenerating a Recovery ID overwrites the owner-scoped hash immediately so older codes are invalid.

## Persistence

Normal mode:

- `trips/{id}`: Party Ledger board documents.
- `users/{uid}`: Firebase Auth account profile, public User ID, username, and active character pointer.
- `usernames/{username}`: public username lookup and internal Firebase Auth email pointer.
- `userIds/{userId}`: low-detail public User ID reservation used for collision
  checks without querying private `users/{uid}` records.
- `characters/{id}`: character records.
- `playerModules/{uid}`: native-owned dynamic state for Debt Dragon, Treasury, and Compare.
- `adminRevisions/{id}`: Super Admin publish logs.
- `users/{uid}/boardInvites/{inviteId}`: pending/responded board invites for real-character additions.

`firestore.rules` is the repository copy of the deployed rules. It keeps the
current real-account loop usable, includes a Super Admin helper for the
allowlisted Gmail `purich.wc@gmail.com`, makes `trips/{id}` signed-in-only,
restricts `users/{uid}` to owner/Super Admin access, blocks new raw Recovery ID
writes, restricts character writes to the owning account or Super Admin,
prevents username mapping takeover, permits only same-ID reclamation of reusable
deleted username/User ID tombstones, allows `playerModules/{uid}` owner
read/create/update, and restricts admin/recovery audit collections to Super
Admin. Deploy through `firebase.json` with `npx firebase-tools deploy --only
firestore:rules --project pointy-personal-toolkit`.

Local/test mode:

- `sessionStorage.pointy_test_trip_*`: test trip fixtures.
- `localStorage.<module-key>::<account-scope>`: signed-in account progress/cache for profile streaks, character registry fallback, trip snapshots, Debt Dragon, Treasury, Compare, and the last opened trip. Unsuffixed legacy keys are still read only where required for guest/test compatibility.
- `localStorage.pointy_character_registry_v1`: legacy local character registry/cache for guest/test compatibility; signed-in accounts use the scoped variant.
- `localStorage.pointy_auth_v1`: local mirror of current auth account, including selected/created character. It is authoritative only in explicit `?test=1` regression mode; production rehydrates from Firebase Auth/Firestore.
- `localStorage.pointy_accounts_v1`: local Sign Up registry for `?test=1` regression mode only.
- `localStorage.pointy_theme`: global theme source of truth.
- `localStorage.coin_quest_ui_v1.theme`: compatibility mirror for older/shared UI.
- Module-specific local stores exist for Debt Dragon, Treasury, Price Arena, drafts, and settings.

Persistence changes require careful migration thinking and targeted tests at minimum.

See `data-contracts.md` for the practical shape of `trips`, `characters`, `adminRevisions`, production/test auth mirrors, local stores, and derived Character Profile data.

## Design Sources

Claude Design remains the Holy Grail for requested visual ports. Reference files live outside Git and may be replaced by new exports during a session.

- Current verified local Downloads references on 2026-06-21 are `/Users/point/Downloads/CLAUDE.md`, `/Users/point/Downloads/HANDOFF.md`, `/Users/point/Downloads/MOBILE-EXPORTS.md`, `/Users/point/Downloads/Coin Quest Ledger (iOS App).html`, and `/Users/point/Downloads/Coin Quest Ledger (Android App).html`.
- Older recovery bundles, split zips, standalone Character/Profile HTML, and Admin HTML paths from earlier sessions are historical only unless they still exist on disk. Verify with `ls`/`find` before using them.
- Admin Portal handoff notes are in `ADMIN.md`.

`archive/CLAUDE_RECOVERY.md` is currently ignored/deprecated by user instruction. Do not use it unless the user explicitly re-enables it.

See `claude-design-index.md` for the full reference map and per-surface notes.

## Testing And Deployment

Core commands:

```bash
npm run test:syntax
npm run test:assets
npm run test:unit
npm run test:e2e
npm test
npm run serve
```

Playwright projects cover desktop Chromium, tablet, and mobile. Responsive or shared-shell work should be checked across breakpoints. Use `TESTING_MATRIX.md` to choose the narrowest sufficient checks. After deploys that touch production routes/assets/admin shell, run `npm run smoke:prod` from `PROD_SMOKE_HARNESS.md`.

Manual production deploy flow, when not relying on CI/CD:

```bash
npm test
git add <focused files>
git commit -m "<focused message>"
git push origin main
vercel --prod --yes
vercel alias set <deployment-url> coin-quest-ledger.vercel.app
curl -fsSL https://coin-quest-ledger.vercel.app/<changed-route> | rg "<expected-marker>"
```

CI/CD is also active through `.github/workflows/test.yml`: pull requests run the
full test suite, and pushes to `main` run tests then deploy production to Vercel
when the required GitHub secrets are present.

See `DEPLOYMENT_AND_ROLLBACK_RUNBOOK.md` for CI/CD secrets, manual deploy, alias,
Firebase rules deploy, and rollback steps.

Native iOS build/install flow is intentionally separate from Vercel production. Before building for a real iPhone, verify both:

- Claude Design parity: compare the relevant native screens against the fresh iOS/Android Claude exports and fix obvious spacing/chrome/content mismatches before install.
- Backend parity: sign in or create a real Firebase test account and verify Firestore-backed account, character, Split, Debt Dragon, Treasury, and Compare flows are dynamic.

Then follow `mobile/IOS_BUILD_NOTES.md` for `expo export`, `xcodebuild`, `devicectl install`, and `devicectl launch`.

## Hard Invariants

- Keep the app static/no-build unless the user explicitly chooses a framework migration.
- Do not modify legacy inactive snapshots unless explicitly asked.
- Do not commit large Claude offline HTML/zip artifacts.
- Do not drop Party Ledger `sound.jsx` from Claude split references; SFX are WebAudio code there.
- Preserve i18n for user-facing text.
- Preserve newest user requirements over older handoffs.
- Preserve Firebase state shape unless doing a planned migration with regression coverage.
- Keep XP/level formulas centralized in `shared/pointy-logic.js` and documented in `leveling-canon.md`.
- Native app work must stay modular by screen/data/sheet/theme files; do not collapse `mobile/src/*` back into a monolithic `App.tsx`.
