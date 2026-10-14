# Coin Quest Ledger Roadmap

Last updated: 2026-10-12

## North Star

Coin Quest Ledger is a playful RPG finance suite with the approved Coin Quest
brand: clear identities, recoverable boards, native mobile usability, safe Admin
operations and reliable split/debt/treasury math. Current user direction governs
visual changes; historical Claude exports apply only when explicitly requested.

## Current Baseline

- Production domain: `https://coinquestledger.vercel.app`. The latest verified
  release is recorded in `Memory.md` and `docs/release-2026-10-12.md`; do not
  infer deployment from source or documentation-only changes.
- Large Claude references stay outside Git. Files listed in historical notes
  must be checked for existence and relevance before use; do not assume old
  Downloads exports describe the approved current native app.
- Real account loop is live: username/password signup uses Firebase Auth with
  internal `@coinquest.local` emails and atomic identity provisioning. Recovery
  and Admin reset preserve the existing Firebase UID and public identity pointers;
  they rotate credentials/recovery keys and revoke sessions, not the UID.
- Character/Profile surfaces are live: Sign In/Sign Up, one-time Character Creation, profile drawer full-profile link, User ID display, My Boards, Character Profile My Boards actions, privacy links, and Recovery ID display/regeneration.
- Super Admin is live at `/admin/` with Firebase Google Auth allowlisted to `purich.wc@gmail.com`, Admin user lifecycle, backend-only permanent delete, revision/publish tooling, and desktop/tablet/mobile responsive behavior.
- Responsive baseline is live: Home/Compare, Split, Debt, Treasury use the shared phone shell at `<=600px`; tablet/touch keeps desktop topbars with larger hit targets; Character Profile keeps its standalone `cnav`; Admin Portal uses its admin-specific mobile/tablet pattern.
- Mobile web parity pass is live for iPhone SE / iPhone / iPhone Pro / Pro Max widths: compact Claude-style phone topbar, Claude bottom-tab labels, Safari safe-area metadata, visible touch-only controls, two-row Split banner actions, smaller first-load eye, and zero-overflow checks at 375/393/430px. Android remains secondary but covered through the same responsive shell and tablet/mobile Playwright smoke.
- Leveling canon is centralized in `leveling-canon.md` and `shared/pointy-logic.js`.
- Profile/auth refactor slices are deployed: recovery, auth core, session storage, Firebase boundary, backup, drawer blocks, reminders, tour rendering, login forms, and Character Creation renderers now live in focused `shared/profile-*.js` helpers.
- The rebuilt Expo 57 / React Native 0.86 app implements all player modules;
  web/native share `playerModules/{uid}`. Native flow acceptance requires the
  own binary on an actual Simulator; browser/JS checks are supplementary.
- Current design decision: restore the complete player Website/rebuilt Mobile
  design from immediately before the 12 October redesign, preserving current
  features/backend and the Admin redesign. See the design-restoration evidence.
- CI/CD is active through `.github/workflows/test.yml`: pull requests run the full test suite, and pushes to `main` deploy production through Vercel when GitHub secrets are present.
- Documentation canon now includes `SITE_MAP_AND_INTERACTIONS.md`, `PROJECT_STRUCTURE_GUIDE.md`, `ACCOUNT_MANAGEMENT_IMPLEMENTATION.md`, `ADMIN_PORTAL_IMPLEMENTATION.md`, `SECURITY_AND_FIREBASE_RULES.md`, `DEPLOYMENT_AND_ROLLBACK_RUNBOOK.md`, `TESTING_MATRIX.md`, `NATIVE_WEB_PARITY.md`, `INVITES_AND_GUESTS.md`, and `CLAUDE_TO_A_TEE_QA.md` so future chats can recover route, module, account, admin, security, deploy, native, invite, and exact-design context quickly.

Known constraints:

- Local test fixtures are `?test=1` only; production username/password auth uses Firebase Auth/Firestore and does not fall back to local accounts.
- Super Admin production gate now uses Firebase Google Auth and allowlists only `purich.wc@gmail.com`; `?test=1` keeps the local gate for regression.
- Firestore rules include the Super Admin email helper for user lifecycle operations. Permanent user deletion requires the backend Firebase Admin function and service-account env vars.
- App pages require server hosting; `file://` preview is not supported.
- Claude Design references can move or be replaced between sessions; verify local paths before using old handoff filenames.

## Decision Log

- `archive/CLAUDE_RECOVERY.md` is ignored/deprecated for now by current user instruction.
- Character Profile route remains `/character/?id=####`.
- The latest Claude handoff specifies a profile side panel full-profile entry; the live shared profile drawer now links to `/character/?id=####`.
- Current loop is one account = one active character. Demo User ID `3720` maps to Character ID `3720`; real users get a Firebase Auth `uid`, public four-digit User ID, and active Character ID.
- Character Profile currently keeps its own `cnav`/standalone profile layout; whether to add shared mobile shell is undecided.
- Admin Portal mobile/tablet decision: keep admin-specific horizontal navigation, not the player bottom tab bar. This matches the latest Admin mobile/tablet export and keeps dense admin tables/tooling usable.
- Admin production access is Google-auth gated to `purich.wc@gmail.com`; keep admin-specific horizontal navigation, not the player bottom tab bar. This matches the latest Admin mobile/tablet export and keeps dense admin tables/tooling usable.
- Signed-in progress is account-scoped, not browser-scoped. `shared/account-scope.js` derives local module/cache keys from the active account so new real users start at LV1/0 Reputation even if the same browser has legacy demo progress.
- Admin Users now merges Firestore `users/{uid}` records with board-derived participants/admin roles, so real accounts with no board membership still appear in the portal.
- Older admin copies that allow many Characters per User are overridden by the current one-account-one-active-character canon.
- `pointy-personal-toolkit` remains the Firebase project id unless a planned infrastructure migration is explicitly chosen.
- Character XP and Profile Reputation are separate tracks. Character XP uses `PointyLogic.levelFromXp()`; overall/profile displays use `PointyLogic.levelFromReputation()`.
- Character-ID board additions are invites, not immediate adds. Guests are board-local and do not create real Character IDs. See `INVITES_AND_GUESTS.md`.

## Phase 0 - Keep The Canon Stable

Goal: make every future chat easy to resume without rediscovery.

- Keep `Memory.md`, `PLAYBOOK.md`, `architecture.md`, and `roadmap.md` current after meaningful changes.
- Keep `SITE_MAP_AND_INTERACTIONS.md` current when route wiring, cross-module flows, shared dependencies, reminders, or side effects change.
- Keep `PROJECT_STRUCTURE_GUIDE.md` current when files move, helper modules split, or common task ownership changes.
- Keep `ACCOUNT_MANAGEMENT_IMPLEMENTATION.md` and `ADMIN_PORTAL_IMPLEMENTATION.md` current when signup, recovery, account lifecycle, user reset, delete, publish, or admin screens change.
- Keep `SECURITY_AND_FIREBASE_RULES.md` current when Auth, Firestore Rules, Admin SDK endpoints, service-account env vars, Spark/Blaze assumptions, or hardening gaps change.
- Keep `DEPLOYMENT_AND_ROLLBACK_RUNBOOK.md` and `TESTING_MATRIX.md` current when CI/CD, Vercel deploy, Firebase rules deploy, rollback, or verification commands change.
- Keep `NATIVE_WEB_PARITY.md` current when native contracts, playerModules, web/native divergence, or native build gates change.
- Keep `INVITES_AND_GUESTS.md` current when participant entry, invite/reminder, direct-link join, or settlement behavior changes.
- Keep `CLAUDE_TO_A_TEE_QA.md` current when exact-design audit expectations or locked cosmetic regressions change.
- Keep `data-contracts.md` current when storage keys, Firestore fields, or derived profile shapes change.
- Keep `claude-design-index.md` current when new Claude reference files arrive.
- Keep Claude reference files outside Git.
- Keep `.zip` and large offline HTML artifacts ignored.
- Keep deploy notes tied to the actual production domain.
- Keep `sound.jsx` preserved in Party Ledger split references.

Exit criteria:

- A new agent can read the docs, run status/tests, and understand the current product without opening old recovery notes.

## Phase 1 - Character/Profile Integration

Goal: make User Profile, Side Panel profile, and Character Profile feel like one intentional identity flow.

Near-term work:

- Continue refining the explicit Character Profile entry point from the profile drawer/side panel.
- Preserve the current one-account-one-active-character canon unless the user asks for multiple characters. Production accounts are real Firebase Auth/Firestore accounts; local mock fixtures are `?test=1` only.
- Keep `/character/?id=####` as the shareable public route.
- Preserve privacy link behavior with `private=1`.
- Verify desktop/tablet/mobile after any profile drawer changes.

Open decisions:

- Future product decision: stay one character per user or add multiple characters per user after the current real-auth loop is stable enough.
- Should the Character Profile account card deep-link back to a fuller User Profile / account settings surface?

## Phase 2 - Mobile Design Parity

Goal: all core modules respect the Claude mobile model without duplicating shell code.

Work:

- Keep Home/Compare, Split, Debt, Treasury phone drawer/bottom tabs centralized in `shared/mobile-shell.*`.
- Keep tablet/touch polish as CSS media rules, not separate tablet files: `hover:none` / `pointer:coarse` with `min-width:601px` for player modules and `min-width:761px` for Admin.
- Keep Admin Portal's admin-specific responsive nav, Relationship Map stack, and phone bottom-sheet modal rules in `admin/admin.css`.
- Decide whether Character Profile should adopt shared mobile shell or remain a standalone profile page with its own nav.
- Check text fitting, no horizontal overflow, and no overlapping controls at `390px`, `360px`, tablet, and desktop.

Testing:

- Targeted Playwright checks for affected flows.
- Full `npm test` when shared shell or routing changes.

## Phase 2N - Player Native App MVP

Current implementation: Expo 57, Expo Router, persisted Firebase Auth session,
character/Home/profile, all five split modes and multi-payer ledger, invitations,
guests, campaigns, receipts, import/export, debt history, treasury, comparison,
reminders and account backup. It is player-only and not a WebView wrapper.

The web bridge is deployed, with explicit refresh/reconciliation and preserved
browser drafts. Auth persistence and the recorded module flows passed on the own
iPhone Simulator binary. Read `NATIVE_WEB_PARITY.md`,
`docs/mobile-completion-worklist.md` and the post-release evidence for limits.

Remaining work when requested:

- Live two-account invitation/expiry, native offline/fault injection and legacy
  password-unlocked board coverage.
- Android, physical-device signing, Store/TestFlight distribution and any OTA
  release process. These are separate from web deployment/source push.
- Live credential-changing recovery submissions with the required user handoff.
- Further visual polish only under the latest approved direction, preserving
  shared backend contracts and the mandatory Simulator gate for touched flows.

## Phase 3 - Real Auth And Security

Goal: harden the now-real Google-auth Super Admin boundary and move remaining privileged flows server-side.

Work:

- Keep the chosen username strategy: username maps to internal `username@coinquest.local`; users do not need real email addresses.
- Preserve the current verified mapping: username -> Firebase Auth credential -> `users/{uid}` public User ID -> active Character ID.
- Recovery/admin reset uses server-side Admin SDK routes with shared Firestore
  throttling and a bounded reset lease. Remaining work includes owner notification,
  App Check, and a separately authorized migration to remove legacy
  public username recovery hashes.
- Super Admin allowlist is now `purich.wc@gmail.com` via Firebase Google Auth.
- Permanent user delete is backend-only via Vercel Serverless Function + Firebase Admin SDK. Production Vercel has encrypted `FIREBASE_SERVICE_ACCOUNT_JSON` for the dedicated `vercel-admin-delete` service account; keep verifying `/api/admin-delete-status` after recovery/reset changes or redeploys. Delete now tombstones the username and User ID instead of removing them, allowing the same username to be recreated with the same User ID/Character ID.
- October Rules enforce owner/lifecycle/identity boundaries and preserve the
  documented signed-in board link-join policy. New public recovery hashes are
  blocked; already-stored legacy values need migration. Read the security docs
  before changing Rules; web deployment does not publish them.
- Add Board Admin permissions scoped to owned boards.
- Tighten the still-open board/trip write model once Board Admin auth is real.
- Add rollback/export plan before rule enforcement.

Important:

- Do not present `?test=1` local gates as secure; they exist only for automated regression.
- Do not rename `pointy-personal-toolkit` just for aesthetics.

Exit criteria:

- Unauthorized users cannot read/write private board/admin data from the client or Firestore API.

## Phase 4 - Admin Portal Maturity

Goal: make admin operations trustworthy and recoverable.

Work:

- Continue aligning `/admin/` with Claude Admin Portal structure when the user asks for Admin work.
- Keep draft/restore/publish semantics clear.
- Deepen board/user/admin relationship views only where the newer source or user request adds behavior beyond the current workback.
- Harden password reset and board ownership workflows now that the real-auth foundation exists.
- Add audit trail details for meaningful admin actions.

Testing:

- Admin changes default to Production Patch: full `npm test`.

## Phase 5 - Data Model And Character Progress

Goal: make cross-module RPG progress coherent.

Work:

- Keep class metadata and portrait assets centralized through `shared/pointy-logic.js` and `assets/rpg-portraits/`.
- Recalibrate XP rewards only after updating `leveling-canon.md`; do not mix canon cleanup with balance changes.
- Define how Debt Dragon and Treasury progress should write back into character history.
- Decide whether Compare Prices contributes to character achievements or remains a pure utility.
- Keep migrations optional/backward-compatible.

Risks:

- Cross-module writes can corrupt old local data if migration is too aggressive.
- Character aggregation can become slow if it scans too many public trip docs without indexing/security design.

## Phase 6 - Polish, Backup, And Recovery

Goal: improve resilience without changing the static-app spirit.

Work:

- Continue shrinking `shared/profile-hub.js` only in reversible slices. Recovery, auth identity, session storage, Firebase boundary, backup, login/character rendering, drawer blocks, reminders, and tour rendering are now split; future slices should target cloud persistence/load-save helpers, profile computation, and full drawer shell rendering only with focused tests and their own commits.
- Add clearer local data export/import for users.
- Keep Cloudinary asset references verified.
- Improve production smoke checks after deploy.
- Consider small UX affordances for stale/offline Firebase states.

## Always-On Quality Gates

- Tiny visual tweak: `npm run test:syntax` plus a focused visual check.
- User asks commit/deploy: full `npm test`, commit, push, deploy, alias, live curl.
- Shared logic/data/admin/routing: full `npm test`.
- Responsive/mobile shell: check desktop, tablet, mobile.
- Claude Design port: inspect source, match DOM/style semantics, preserve live behavior.
- "To a tee" Claude Design request: follow `CLAUDE_TO_A_TEE_QA.md`, including component-level and mobile/tablet/desktop verification before commit/deploy.
