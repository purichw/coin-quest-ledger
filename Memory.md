# Memory: Coin Quest Ledger

Last updated: 2026-10-17

## Financial audit and repayment policy — 2026-10-17

The user approved keeping actual Split repayments after expense corrections and
making reducing-balance simple interest the default for new Debt Dragon entries.
Split now derives remaining debts or reverse refunds from those payments; a pair
earns settlement XP once per campaign. Existing debt modes remain unchanged.
The shared canon also fixes satang allocation, interest-first payment replay,
Treasury rewards/date boundaries and Compare Prices eligibility.

Use the [financial release record](docs/financial-release-2026-10-17/README.md)
for worked cases, verification and the pre-release rollback baseline. The
[native evidence](mobile/docs/financial-canon-2026-10-17.md) covers the matching
source and Simulator flows, with its final refund-confirm/restart gap explicit.
This release does not distribute a native binary or OTA. Promotion must be
confirmed from the intended commit's CI/CD run and canonical Vercel alias.

## Native refresh local acceptance evidence — 2026-10-16

This refresh was built from repository baseline
`44ad28e44832c9a7e1cdf229d92701c466a50ded` (`Record deployed OAuth pages and
pending Google brand verification`). Local source/Simulator and standalone
signing evidence is recorded in the refresh report below. On October 16, the
required root suite passed: syntax/assets, 67 unit tests and 760 browser tests
with 11 predefined skips; the separate emulator backend suite passed 21 tests.
The browser run used one worker and unchanged web/backend source in an isolated
project worktree. No physical iPhone has been connected. For push, CI and web
promotion, use the intended commit's
[CI/CD workflow run](https://github.com/purichw/coin-quest-ledger/actions/workflows/test.yml);
local checks and the historical deployment sections do not prove promotion.

The latest user direction supersedes the October 12 native layout restoration:
keep the website's illustrated Coin Quest world, backgrounds, category colors
and character motion, with native tabs and forms suited to a phone. All player
areas are in scope; Admin and Excel upload/template download are excluded.
JSON import/export and Excel report sharing remain. Existing Firebase identity,
financial canon and `https://coinquestledger.vercel.app` are unchanged.

Source now includes `/play` native tabs, compact login and profile identity,
read-only other-character profiles, module search/filter tools, keyboard Done,
pending-save navigation protection and optional expense-date preservation.
Owner Recovery ID display uses a fresh server hash and device-local Keychain
storage; failed local persistence does not block an acknowledged recovery key.
The isolated `demo-coin-quest` Simulator/web checks do not establish production
mutation or physical-device behavior.

The final signed iPhoneOS Release completed at 04:41:06 Bangkok, including the
four native loading-title fixes. Embedded JavaScript, strict signature,
authorized team/profile and production configuration passed verification. Exact
artifact/source hashes and the separate bounded title-runtime result belong in
the report; neither packaging nor Simulator evidence proves a physical install.

Use [the current refresh report](mobile/docs/native-refresh-2026-10-16/README.md)
and its QA matrix for exact observed flows and remaining checks;
[native design direction](mobile/DESIGN_DIRECTION.md) for the current visuals;
and [iOS build notes](mobile/IOS_BUILD_NOTES.md) for the artifact's exact source,
standalone signing and later explicit-device USB-C installation. The report
distinguishes each build from later source changes. Preserve the unrelated
pre-existing QA screenshots and exports when staging this release.

## Historical deployment baseline for the October 14 cleanup

`2924f02dad60a34c3fb964cdc3497c78ad5fc535` passed all release jobs in
[CI run 38547534989](https://github.com/purichw/coin-quest-ledger/actions/runs/38547534989).
Its deploy log confirms promotion of `coinquestledger-mvnbu3f2z-purich-w.vercel.app`
to `coinquestledger.vercel.app` at 10:26 UTC. This is the deployment baseline
used for the subsequent Admin detail/list and Split party cleanup. Those later
working-tree changes have not been pushed/deployed in this pass. Recheck remote
state before the next release; historical cutover evidence below is separate.

## Verified domain cutover — 2026-10-14

Production is `https://coinquestledger.vercel.app`, including `/admin/`.
Release `ff442e3c906bd4ae1b1f9671ee1d6a3d1d29dd06` passed all three jobs in
[CI run 38531883556](https://github.com/purichw/coin-quest-ledger/actions/runs/38531883556)
and was verified on Vercel deployment `dpl_23c9nDQHoVRov3yeob8Ze3pH4nAq`.
Browser CI passed 553 cases with 11 predefined skips.

The existing Vercel project was renamed to `coinquestledger`; its project ID,
secrets and GitHub connection are unchanged. All five legacy aliases were
removed. The retired canonical host returns 404 without a redirect; CI and
active source use only the new hostname. Firebase Auth authorizes the new web
hostname and no longer authorizes the retired one. Fresh Google Admin sign-in
and real Admin reads passed after cutover.

Firebase project `pointy-personal-toolkit`, its hosted OAuth helper, user UIDs,
Firestore data and Rules remain unchanged. The backend/helper name may still
appear during Google sign-in; a website-domain change does not rebrand that
OAuth flow. Browser sessions and local-only drafts are origin-scoped. Native
source share/recovery URLs changed, with profile and board share previews
verified on the own iPhone Simulator binary; existing distributed binaries
still require an app update. No native distribution occurred.

Evidence and limits: [domain migration record](docs/domain-migration-2026-10-14/README.md).
This is a dated verified checkpoint; compare the current SHA, CI and alias
before making a later production claim. Unrelated workspace changes were
excluded from this release.

## Current shared design direction — 2026-10-13

Player website mockups are screens in one product. Read `PLAYER_DESIGN_SYSTEM.md`
before changing shared UI or any game page, including a page not redesigned yet.
Header/footer, frame/gutters and banner scale have shared owners in
`shared/player-layout.{css,js}`, `shared/navigation.css` and `shared/mobile-shell.js`.
Keep artwork different between games; keep screens within one game in the same
visual family. Explicit context variants accommodate real differences.
This consolidation includes Character's common header and Party entry/board
artwork continuity; it does not redesign native/Admin. The October 13 release
also updates all affected integration selectors and responsive disclosure flows,
removes obsolete footer rules and keeps focused auth controls visible on short
screens. Release status is established by the exact commit's CI/deploy result.
Evidence: `docs/player-design-system-2026-10-13/README.md`.

## Project

- Workspace: `/Users/point/toolbox`
- GitHub: `git@github.com:purichw/coin-quest-ledger.git`
- Live production URL: `https://coinquestledger.vercel.app`
- Vercel project: `coinquestledger`
- Firebase project ID is still `pointy-personal-toolkit` intentionally. This is a backend identifier whose Firebase-hosted OAuth helper may appear during Google sign-in. Do not rename/migrate it just for aesthetics; migrate only as a planned infrastructure/security phase with backup, data copy, full regression, and rollback.
- Short URL `https://coin-quest.vercel.app` is unavailable because it is owned by another Vercel project outside this account.
- Main branch: `main`
- For the current pushed source snapshot, run `git log -1 --oneline origin/main`.
- Pre-October release baseline: `b726368`, successful CI/CD run `33385081176`.
  Read `docs/release-2026-10-12.md` for that historical scope and the domain
  cutover checkpoint above for the later verified release. Verify the current
  SHA/run/alias/Rules release before claiming a production snapshot.
- Latest production should still be verified with `vercel ls` or by curling the live URL after a new deploy.

## Start Here In A New Chat

1. Use `$coin-quest-new-chat`; read this current checkpoint and `PLAYBOOK.md`,
   then choose task-specific owners from `PROJECT_STRUCTURE_GUIDE.md`.
2. Check `git status --short --branch` before editing.
3. For small visual tweaks, default to Fast UI Patch unless the user asks to commit/deploy.
4. Preserve newest user requirements over any older Claude prototype/handoff behavior.
5. Never modify legacy inactive snapshots unless explicitly asked.
6. For system shape, read `architecture.md`; for route/module interactions, read `SITE_MAP_AND_INTERACTIONS.md`; for file lookup, read `PROJECT_STRUCTURE_GUIDE.md`; for data shape, read `data-contracts.md`; for account creation/recovery/Admin user management, read `ACCOUNT_MANAGEMENT_IMPLEMENTATION.md`; for Admin live implementation, read `ADMIN_PORTAL_IMPLEMENTATION.md`; for security/rules, read `SECURITY_AND_FIREBASE_RULES.md`; for deploy/rollback, read `DEPLOYMENT_AND_ROLLBACK_RUNBOOK.md`; for testing, read `TESTING_MATRIX.md`; for web/native parity, read `NATIVE_WEB_PARITY.md`; for invites/guests, read `INVITES_AND_GUESTS.md`; for leveling/XP, read `leveling-canon.md`; for Claude references and exact visual work, read `claude-design-index.md` plus `CLAUDE_TO_A_TEE_QA.md`; for next-step planning, read `roadmap.md`.
7. Ignore `archive/CLAUDE_RECOVERY.md` unless explicitly re-enabled. Use current supplied references and `PLAYER_DESIGN_SYSTEM.md`; old split zips/offline HTML are historical and must not override the current Party layout or invitation/Guest rules.

## Important Files

- `skills/coin-quest-new-chat/`: versioned onboarding skill; installed at
  `/Users/point/.codex/skills/coin-quest-new-chat/`. Keep the copies aligned.

- `architecture.md`: current static app architecture, routes, shared modules, identity model, persistence, design sources, test/deploy flow, and hard invariants.
- `SITE_MAP_AND_INTERACTIONS.md`: canonical player/admin site map, user journey map, interaction map, route/deep-link map, state-store side effects, and verification map.
- `PROJECT_STRUCTURE_GUIDE.md`: practical file map for common edit tasks, shared modules, tests, assets, and do-not-edit-blindly areas.
- `data-contracts.md`: practical Firestore/local/session storage contracts, derived Character Profile shape, and migration rules.
- `ACCOUNT_MANAGEMENT_IMPLEMENTATION.md`: implementation-level flow from Sign Up to recovery reset and Admin Portal user management, including Firebase Spark/Blaze reality, username pointers, backend credential reset, lifecycle actions, and permanent delete.
- `ADMIN_PORTAL_IMPLEMENTATION.md`: live `/admin/` implementation map, source boundaries, auth gate, screens, draft/publish behavior, account lifecycle, reset, delete, and verification.
- `SECURITY_AND_FIREBASE_RULES.md`: Firebase Auth/Firestore Rules/Admin SDK security map, Spark/Blaze reality, privileged endpoint contract, rule deploy runbook, and hardening backlog.
- `DEPLOYMENT_AND_ROLLBACK_RUNBOOK.md`: CI/CD, manual Vercel deploy, Firebase rules deploy, rollback, and release-report runbook.
- `TESTING_MATRIX.md`: targeted command matrix for docs, syntax, visual, mobile, Party Ledger, invites, settlement, auth, admin, rules, native, and production changes.
- `NATIVE_WEB_PARITY.md`: native/web boundary map for shared Firebase contracts, intentional differences, design/backend gates, and native verification.
- `REFACTOR_READINESS_AUDIT.md`: current refactor readiness verdict, hotspot list, slice plan, real dummy-account policy, and regression gates.
- `INVITES_AND_GUESTS.md`: canon for Character-ID invites, Add Guest, Reminders accept/decline, direct invite links, and pairwise settlement regression.
- `CLAUDE_TO_A_TEE_QA.md`: exact Claude Design component-level fidelity and mobile/tablet/desktop audit protocol.
- `leveling-canon.md`: v1 XP/Reputation canon for Character XP, positive-only Profile Reputation, level thresholds, reward titles, and Admin display rules.
- `claude-design-index.md`: map of Claude reference sources to live surfaces, plus notes on mobile coverage and route wiring.
- `roadmap.md`: phased roadmap for profile integration, mobile parity, real auth/security, admin maturity, character progress, and recovery.
- `archive/CLAUDE_RECOVERY.md`: deprecated/ignored historical recovery pack. Do not read/use it unless explicitly re-enabled.
- Claude/offline design exports are kept outside Git; do not commit large offline HTML or zip copies.
- `trip/index.html`: live Expense Splitter / Party Ledger app shell, styles, static markup, and script loader.
- `trip/app.js`: live Expense Splitter / Party Ledger app behavior, state, rendering, Firebase/test persistence, event delegation, import/export, and overlays.
- `trip/entry.js` and `trip/entry.css`: 2026-10-13 mockup-led Split entry/create/join screen, shared navigation and account-scoped recent boards; QA/design adaptations in `docs/split-entry-redesign-2026-10-13/README.md`.
- `trip/board.js` and `trip/board.css`: October 14 Party Ledger board presentation at `/trip/?id=…`; shared village banner, always-expanded party cards (3 desktop / 2 tablet / 1 phone), expense form and settlement alongside on desktop, and an expense log immediately below members in the independent left column (no gap imposed by the right column). At ≤1000px the same log follows members, entry and settlement in DOM/visual order. No Member details toggle or horizontal member rail. Preserve each class's canonical `avatarBg` colors in cards and the Hero popup. Hero choice is a button opening the existing 18-class / 2-gender picker; real characters still join by Character ID invite and Guests remain board-local. The expense shortcut is a small secondary button in the bottom-right corner, not a full-width summary panel. State/math/storage stay in `trip/app.js` and `shared/pointy-logic.js`; shared navigation stays with its existing owner. Current evidence and adaptations: `docs/split-party-layout-2026-10-14/README.md` (supersedes the October 13 member layout).
- `trip/trip-utils.js`: Party Ledger browser-global utility helpers for IDs, theme persistence, escaping, money formatting, and board/admin hashes. Must load before `trip/app.js`.
- `admin/index.html`, `admin/design.css`: Super Admin Portal shell and current responsive design.
- `admin/app.js`: Super Admin Portal behavior for Google-auth allowlist, board/admin/user editing, account lifecycle, drafts, publish, restore, and revision logs.
- `admin/admin-utils.js`: Super Admin browser-global utility helpers for escaping, cloning, user lifecycle status, username/reset helpers, recovery hash, and level display. Must load before `admin/app.js`.
- `character/index.html`: responsive Character Profile shell and portrait/stats/history layout.
- `character/design.css` is now the active October 13 mockup-led profile presentation (its historical unused contents and old inline CSS were replaced). `character/app.js` retains canonical aggregation and real character portraits; layout includes desktop four-module cards, tablet independent columns and mobile disclosure/anchor navigation with sticky privacy/share/Party Ledger actions. Other-character views no longer display the signed-in viewer's account or streak. Archive controls require matching account ownership. See `docs/character-profile-redesign-2026-10-13/README.md` for evidence, real-data adaptations and intentionally unsupported mockup actions.
- `character/app.js`: Character Profile loading, board aggregation, privacy/share mode, i18n, and rendering.
- `index.html`: live toolbox home and price comparison entry.
- `lang.js`: shared i18n for Thai and English across the toolbox. Every user-facing string needs both languages.
- `shared/pointy-logic.js`: shared calculation, normalization, class registry, split logic, price comparison logic, and canonical level helpers.
- `shared/profile-hub.js` / `.css`: shared profile/auth orchestrator. Keep behavior orchestration here, but new pure helpers or isolated renderers should live in the focused `shared/profile-*.js` modules.
- `shared/profile-session.js`, `shared/profile-auth.js`, `shared/profile-cloud.js`, `shared/profile-recovery.js`, `shared/profile-backup.js`, `shared/profile-login.js`, `shared/profile-character-create.js`, `shared/profile-drawer.js`, `shared/profile-reminders.js`, and `shared/profile-tour.js`: focused profile helper modules split out from the original hub so auth, recovery, backup, login/character rendering, drawer blocks, reminder rendering, and Welcome Tour slices can be reverted independently.
- `shared/navigation.css` and `shared/mobile-shell.js`: shared web navigation for Home/Compare, Split, Debt Dragon and Treasury, following the October 13 mockups. Desktop is one row, tablet two rows, phone utilities plus five bottom tabs and an accessible overflow menu. `shared/home.js`/`.css` own the new illustrated Home; `shared/quest-icons.js` owns navigation SVGs. Native and Admin are excluded from this redesign.
- `mobile/`: rebuilt Expo 57 / React Native player app using Expo Router and the
  app's own Simulator binary. All player modules use the existing Firebase
  project; `playerModules/{uid}` is shared with the website storage bridge.
- `mobile/IOS_BUILD_NOTES.md`: Simulator-first build/install/launch runbook;
  Node 24, two workers, no Expo Go substitute. See per-flow evidence and limits
  in `docs/mobile-completion-worklist.md` and `docs/backend-audit-2026-10-12.md`.
- `trip/pixicons.js`: live labeled pixel icon registry; `.jsx` is a legacy copy.
- `assets/rpg-portraits/`: current full-body class portrait assets, 18 classes x 2 genders plus skin art.
- `assets/icons/loot-chest.svg`: app icon.
- `tests/e2e/coin-quest-ledger.spec.mjs`: critical browser flows for Expense Splitter, Debt Dragon, Character Profile, Admin Portal, and price comparison.
- `tests/e2e/helpers/coin-quest-helpers.mjs`: shared Playwright helpers, real Firebase dummy-account harness, and Split hero helpers imported by the main E2E spec.
- `tests/unit/pointy-logic.test.mjs`: unit coverage for calculations and normalization.
- `PLAYBOOK.md`: workflow rules and change modes.
- `archive/legacy/trip-index.legacy.html` and `archive/legacy/index.legacy.html`: inactive legacy snapshots; do not touch unless requested.

## Current checkpoint — 2026-10-12

- Later working-tree task: all player forms on web/native now use stricter
  validation, with auth/character persistence and accrued-debt corrections.
  Dedicated live TEST account `cqreg-20261012-zbrp7` / Character ID `8340` was used
  for all four games. Read `docs/frontend-regression-2026-10-12/README.md` for
  observed production failures, local repairs, automated checks and evidence.
  Included in the subsequent authorized push/deploy; verify the exact commit's
  CI and canonical alias before assuming it is live. After Mac unlock,
  post-fix Browser/live-Firebase and
  own-binary Simulator checks passed for all four games, invalid/corrected inputs,
  cross-client persistence, monthly snapshot and app relaunch. Fresh signup
  `cqfix-20261012-8idwn` / hero `2028` retained its character after reload/relogin.
  The report records limits; this is not exhaustive acceptance of every control.
- Previous verified production source before this release: `34aa1a04335d02d2933a9b2be378bacb726c8fa2`,
  pushed to `main`. [CI/CD run 38217362692](https://github.com/purichw/coin-quest-ledger/actions/runs/38217362692)
  passed and promoted the canonical alias at 14:26 Bangkok. Exact deployment,
  test counts and evidence are in `docs/release-2026-10-12.md`.
- Current approved UI: restore **the complete player Website and rebuilt Mobile
  design immediately before the 12 October ui-ux-expert redesign request**,
  including buttons, spacing, layout and composition. The colors-only direction
  is superseded. **Admin remains excluded**. Preserve current features/backend.
  Player HTML uses its original inline styles at `b726368`; redesigned player
  stylesheets remain archived on disk but are no longer loaded. Admin continues
  to use `shared/quest-tokens.css` and `admin/design.css`. Native presentation
  is restored from the exact pre-redesign patches in this chat.
  See `docs/design-restoration-2026-10-12/README.md` for local verification;
  deployment evidence belongs to the exact release workflow, separately from
  these dated local captures. See `docs/release-2026-10-12.md`.
- The native app was rebuilt with Expo 57 / React Native 0.86 / Expo Router.
  Own-binary Simulator verification is mandatory for touched native flows.
  Setup, per-module work and post-release flows passed on iPhone 17 Pro / iOS
  26.5. The former Mac-lock blocker is resolved; evidence remains scoped to the
  recorded flows. See `NATIVE_WEB_PARITY.md` and `mobile/IOS_BUILD_NOTES.md`.
- Web/native share `playerModules/{uid}` through `shared/module-cloud.js` and
  `mobile/src/modules/service.ts`; refresh/conflict handling is explicit, not
  realtime sync. Recovery preserves the existing Firebase UID.
- Web deployment and source push do not release a native binary or OTA.
  Android, physical-device distribution, live two-account invitations and live
  credential-changing recovery submissions remain unverified.
- Remaining backend limits: legacy board link-join access policy and stored
  public recovery hashes need separately authorized migrations. Billing/TTL
  cleanup is deferred; see `SECURITY_AND_FIREBASE_RULES.md` and the runbook.
- No feature is parked by the design restoration. Do not
  restore the retired native app or revert the combined backend/rebuild commit.
- Read status locally first. This checkpoint is dated evidence, not a fresh
  production probe or authorization to access another chat, migrate data, or
  commit/push/deploy in a new task. Documentation/skill edits after this release
  are not automatically published.

## Claude Design / Recovery State

The original Claude Design project was accidentally deleted and Claude said it cannot be directly recovered. The recovery strategy is now:

- Use repo docs plus downloaded handoff files to reconstruct Claude context.
- `archive/CLAUDE_RECOVERY.md` is currently ignored/deprecated by user instruction; use `Memory.md`, `PLAYBOOK.md`, `architecture.md`, `roadmap.md`, `ADMIN_PORTAL_IMPLEMENTATION.md`, `ADMIN.md`, `claude-design-index.md`, and the actual downloaded references instead.
- Current local downloaded references verified on 2026-06-21: `/Users/point/Downloads/CLAUDE.md`, `/Users/point/Downloads/HANDOFF.md`, `/Users/point/Downloads/MOBILE-EXPORTS.md`, `/Users/point/Downloads/Coin Quest Ledger (iOS App).html`, and `/Users/point/Downloads/Coin Quest Ledger (Android App).html`.
- Fresh native-player export folder studied on 2026-06-21: `/Users/point/Downloads/Coin iOS Android/` with `CLAUDE.md`, `HANDOFF.md`, `MOBILE-EXPORTS.md`, `Coin Quest Ledger (iOS App).html`, and `Coin Quest Ledger (Android App).html`. Treat these as the latest iOS/Android player-native visual references when native MVP work resumes; they are player-side only and do not include Admin native.
- Older recovery bundle paths and split zips from earlier sessions may no longer exist locally. Check the filesystem before relying on them, or ask the user for a fresh Claude export.
- If Party Ledger split references are reintroduced, preserve `sound.jsx`; SFX are WebAudio code there, not separate `audio/*` files.

## Current App Shape

The app is no-build static HTML/CSS/JS. Party entry lives in `trip/entry.*`, board presentation in `trip/board.*`, settings in `trip/settings.*`, and state/rendering in `trip/app.js` with `trip/trip-utils.js`. `?id=` opens a board; without it the route shows the entry/create/join screen. Firebase compat loads from CDN. Local drafts are account-scoped; retain the current persistence implementation and debounce.

`trip/app.js` owns the shell event delegation and the expense-entry dynamic controls. Some dynamic hero/admin/overlay renderers still use inline handlers; do not rewrite all of them casually unless doing a focused refactor with full tests.

2026-07-14 refactor note: `trip/trip-utils.js` and `admin/admin-utils.js` are the first large-file extraction slice. They intentionally hold small browser-global helpers only; stateful rendering, persistence, and event handlers still live in the page app files. The E2E suite now imports common helpers from `tests/e2e/helpers/coin-quest-helpers.mjs`, and `scripts/check-inline-scripts.mjs` checks that helper module syntax as part of `npm run test:syntax`.

Player web navigation follows `PLAYER_DESIGN_SYSTEM.md` and the shared navigation
owners listed above. The October design supersedes June phone topbars, labels,
per-page tablet headers and small first-load styling. Page entry stays behind the
shared eye until required CSS, route content and media are ready; in-page loads
use local skeletons. Native has a separate shell and must follow its own docs.

2026-06-30 Party Ledger character/invite/settlement note: adding a real "other hero" while signed in is Character-ID-only and must resolve an existing character record. It must not show or validate "Other hero's name", must not generate a new Character ID from arbitrary input, and duplicate visible names are allowed. The action is `Invite`, not `Confirm Character`; the board admin confirms the invite, then the target account receives a Reminders notification and can Accept or Decline within 24 hours. Decline requires confirmation. A direct party invite link can join immediately, but unauthenticated users must be sent to login first. The alternate path is "Add Guest": user enters a display name and chooses class/gender/skin, but no real Character ID or character registry record is created. Guest participants are flagged in `guestHeroes` and omitted from Character XP/registry sync. Settlement must use pairwise per-expense obligations with reciprocal pair netting, not global creditor/debtor rerouting; the known regression case is `PPP -> Pointy ฿1,000`, `PPP -> PP ฿333.33`, and `PP -> Pointy ฿666.67`. Web and native/mobile logic should stay in parity for this calculation. See `INVITES_AND_GUESTS.md`.

For explicit reference-fidelity work, use the installed `reference-to-a-tee`
skill and current browser tools. For mockup adaptation use `mockup-to-product`.
Check real rendered geometry, interaction and responsive behavior; old fixed
button dimensions or retired browser tool names are not current requirements.

## Account, finance and theme contracts

- Production trusts resolved Firebase Auth, never a stale `pointy_auth_v1`
  mirror or built-in fixture fallback. Username login uses the internal
  `@coinquest.local` mapping. One account has one active Character; account
  creation/recovery details live in `ACCOUNT_MANAGEMENT_IMPLEMENTATION.md`.
- Signed-in drafts/progression are account-scoped via `shared/account-scope.js`.
  Web/native share Firebase identity and finance contracts; see `data-contracts.md`
  and `NATIVE_WEB_PARITY.md` before changing sync or persistence.
- Debt Dragon accrues daily interest before payments using `interestAccruedAt`;
  the long-range payoff forecast is a monthly approximation.
- Recovery hashes are owner-scoped, raw codes are one-time/local reveals, and
  permanent deletion stays backend-only. Current Rules, service-account setup,
  known migration gaps and the `firebase-admin` runtime pin are documented in
  `SECURITY_AND_FIREBASE_RULES.md`; old verification dates are not live proof.
- Global theme comes from `localStorage.pointy_theme`, mirrored into
  `coin_quest_ui_v1.theme`. Legacy per-board/module `settings.theme` must not
  override it on route load.

## Admin / Board Ownership

Party Ledger stores admin ownership metadata under `state.admin`:

- `ownerHash`: local hashed identity used to group one Board Admin across multiple boards.
- `adminId`: visible/admin-editable Board Admin ID.
- `adminName`: visible/admin-editable Board Admin nickname.
- `passwordHash`: board unlock password hash. The original password cannot be recovered; it can only be reset by an authorized admin surface.

The trip UI now asks for Board Admin ID and nickname when creating/admin-setting a board, and remembers the creator profile locally for convenience. Same Admin ID can intentionally own multiple boards.

Super Admin Portal lives at `/admin/`. In production it uses Firebase Google Auth and only allows the Gmail `purich.wc@gmail.com`; `?test=1` keeps a local gate only for automated regression. The current screen contracts are in `ADMIN_PORTAL_IMPLEMENTATION.md`; `ADMIN.md` is only an index. Board Info and User Detail are continuous scroll pages without Tabs or a Layout switch. Dashboard Cards/Command is intentionally retained. It can list and edit boards, Board Admin IDs/nicknames, board URLs, users/active character IDs, reset board passwords, add/delete boards/users, save drafts to `localStorage`, restore the latest published snapshot, publish changes to Firestore, show revision/audit logs, rotate a real username account to a temporary password while preserving User ID/Character ID, and manage user lifecycle status. User lifecycle now has recoverable Archive/Deactivate/Reactivate from Admin; player login blocks archived/deactivated/delete-requested/deleted accounts. Permanent user deletion is backend-only through `/api/admin-delete-user`, which verifies a Firebase ID token for `purich.wc@gmail.com`, deletes Auth/user/character data, and tombstones the username for same-ID recreation. The 2026-10-14 Admin shell shares one header, navigation, parchment content surface and illustrated footer across all nine destinations and detail views. Below `1024px` navigation opens as a modal drawer; below `1200px` header actions use a disclosure. Relationship Map stacks on narrow screens, phone modals remain bottom sheets, and coarse-pointer controls have 44px targets. See `docs/admin-dashboard-2026-10-14/README.md`.

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
- The E2E test `all player modules and admin portal keep their mobile and tablet responsive shells` is the current phone/tablet smoke guard for Home, Compare, Split, Debt, Treasury, Character Profile, Admin navigation drawer, Admin Relationship Map stacking, and Admin phone bottom-sheet behavior.

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

Native mobile commands:

```bash
cd /Users/point/toolbox/mobile
npm run typecheck
npm run lint
node --test tests/*.test.mjs
# Build only when needed; discover the current available device first.
npm run build:simulator -- <available-simulator-UUID>
npm run start:simulator
```

Read `mobile/IOS_BUILD_NOTES.md` before changing native build settings, signing, or install commands.

Local preview:

```bash
cd /Users/point/toolbox
npm run serve
# http://127.0.0.1:4569/trip/
```

Do not preview app pages with `file://`; absolute `/shared/...` and route scripts will fail. Use `npm run serve` or production.

Authorized release: follow `DEPLOYMENT_AND_ROLLBACK_RUNBOOK.md`. The single
GitHub CI/CD writer runs after push; do not start a duplicate manual deployment.
Track full-SHA CI, build readiness and production alias promotion separately.

```bash
cd /Users/point/toolbox
# Only when push/deploy is requested and preflight gates passed:
git push origin main
# After successful CI promotion:
npm run smoke:prod
```

## User Preferences

- For tiny visual changes, do not over-verify by default. Use Fast UI Patch.
- When the user says `commit deploy`, run full `npm test`, commit, push to GitHub, and deploy production.
- When refactoring `trip/index.html` / `trip/app.js`, keep changes incremental and run full `npm test`; the suite now covers desktop, tablet, and mobile.
- Keep responses concise and in Thai unless the user switches language.
- The user values high-fidelity Claude Design matching, but not at the cost of regressing newer requirements.
- Report clearly whether changes are uncommitted, committed, pushed, and/or deployed.

## Recent Commits

- `755eb5e` Document account and journey maps
- `6bae981` Document project maps and QA canon
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
