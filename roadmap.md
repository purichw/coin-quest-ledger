# Coin Quest Ledger Roadmap

Last updated: 2026-06-22

## North Star

Coin Quest Ledger should feel like Claude Design's playful RPG finance suite while remaining reliable enough for real personal data: clear identities, recoverable boards, mobile-first ergonomics, safe admin operations, and no regressions in split/debt/treasury math.

## Current Baseline

- Production domain: `https://coin-quest-ledger.vercel.app`; latest pushed and verified production snapshot is commit `75874f3`, deployment `dpl_GbjV8KwadCfdkanY7N4UCP4LQ2Uw`.
- Large Claude references stay outside Git. Current verified Downloads references are the top-level `CLAUDE.md`, `HANDOFF.md`, `MOBILE-EXPORTS.md`, and the iOS/Android standalone HTML exports; older split/reference folders must be filesystem-checked before use.
- Real account loop is live: username/password signup uses Firebase Auth with internal `@coinquest.local` emails and writes `users/{uid}`, `usernames/{username}`, and `characters/{id}`. Recovery-code reset and Super Admin temp-password reset both preserve public User ID and Character ID while rotating the underlying Firebase Auth `uid`.
- Character/Profile surfaces are live: Sign In/Sign Up, one-time Character Creation, profile drawer full-profile link, User ID display, My Boards, Character Profile My Boards actions, privacy links, and Recovery ID display/regeneration.
- Super Admin is live at `/admin/` with Firebase Google Auth allowlisted to `purich.wc@gmail.com`, Admin user lifecycle, backend-only permanent delete, revision/publish tooling, and desktop/tablet/mobile responsive behavior.
- Responsive baseline is live: Home/Compare, Split, Debt, Treasury use the shared phone shell at `<=600px`; tablet/touch keeps desktop topbars with larger hit targets; Character Profile keeps its standalone `cnav`; Admin Portal uses its admin-specific mobile/tablet pattern.
- Mobile web parity pass is live for iPhone SE / iPhone / iPhone Pro / Pro Max widths: compact Claude-style phone topbar, Claude bottom-tab labels, Safari safe-area metadata, visible touch-only controls, two-row Split banner actions, smaller first-load eye, and zero-overflow checks at 375/393/430px. Android remains secondary but covered through the same responsive shell and tablet/mobile Playwright smoke.
- Leveling canon v0 is centralized in `leveling-canon.md` and `shared/pointy-logic.js`.
- Profile/auth refactor slices are deployed: recovery, auth core, session storage, Firebase boundary, backup, drawer blocks, reminders, tour rendering, login forms, and Character Creation renderers now live in focused `shared/profile-*.js` helpers.
- Player native app work is committed in `mobile/` as an Expo / React Native iOS-first app. The current slice uses real Firebase Auth/Firestore for username login/signup, Recovery ID, Character Creation, Profile, Split board reads/writes, and native-owned `playerModules/{uid}` state for Debt Dragon, Treasury, and Compare.
- Native design lesson learned: do not build/install a bland static shell and call it progress. Claude Design parity and real backend parity are both pre-build gates for every meaningful native screen.

Known constraints:

- Local test fixtures are `?test=1` only; production username/password auth uses Firebase Auth/Firestore and does not fall back to local accounts.
- Super Admin production gate now uses Firebase Google Auth and allowlists only `purich.wc@gmail.com`; `?test=1` keeps the local gate for regression.
- Firestore rules include the Super Admin email helper for user lifecycle operations. Permanent user deletion requires the backend Firebase Admin function and service-account env vars.
- App pages require server hosting; `file://` preview is not supported.
- Claude Design references can move or be replaced between sessions; verify local paths before using old handoff filenames.

## Decision Log

- `CLAUDE_RECOVERY.md` is ignored/deprecated for now by current user instruction.
- Character Profile route remains `/character/?id=####`.
- The latest Claude handoff specifies a profile side panel full-profile entry; the live shared profile drawer now links to `/character/?id=####`.
- Current loop is one account = one active character. Demo User ID `3720` maps to Character ID `3720`; real users get a Firebase Auth `uid`, public four-digit User ID, and active Character ID.
- Character Profile currently keeps its own `cnav`/standalone profile layout; whether to add shared mobile shell is undecided.
- Admin Portal mobile/tablet decision: keep admin-specific horizontal navigation, not the player bottom tab bar. This matches the latest Admin mobile/tablet export and keeps dense admin tables/tooling usable.
- Admin production access is Google-auth gated to `purich.wc@gmail.com`; keep admin-specific horizontal navigation, not the player bottom tab bar. This matches the latest Admin mobile/tablet export and keeps dense admin tables/tooling usable.
- Signed-in progress is account-scoped, not browser-scoped. `shared/account-scope.js` derives local module/cache keys from the active account so new real users start at LV1/0 Renown even if the same browser has legacy demo progress.
- Admin Users now merges Firestore `users/{uid}` records with board-derived participants/admin roles, so real accounts with no board membership still appear in the portal.
- Older admin copies that allow many Characters per User are overridden by the current one-account-one-active-character canon.
- `pointy-personal-toolkit` remains the Firebase project id unless a planned infrastructure migration is explicitly chosen.
- Character XP and Profile Renown are separate tracks. Character XP uses `PointyLogic.levelFromXp()`; overall/profile displays use `PointyLogic.levelFromRenown()`.

## Phase 0 - Keep The Canon Stable

Goal: make every future chat easy to resume without rediscovery.

- Keep `Memory.md`, `PLAYBOOK.md`, `architecture.md`, and `roadmap.md` current after meaningful changes.
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

Goal: build a true native player MVP that shares backend identity/data with the web app.

Current slice:

- `mobile/` exists as an Expo SDK 56 TypeScript app.
- It is iOS-first and intentionally player-side only.
- The runtime now uses real Firebase Auth/Firestore for Login, Sign Up, Recovery ID creation/regeneration, Character Creation, Home, Split, Debt Dragon, Treasury, Compare, Profile, and Character Profile.
- Split reads real `trips/{id}` linked to the active Character ID and can create a Firestore board plus add an equal-split expense.
- Debt Dragon, Treasury, and Compare read/write `playerModules/{uid}`. These native modules are dynamic today, while the web app's older browser localStorage stores remain separate until a planned migration.
- It is not a WebView wrapper and does not replace the static web production app.
- `mobile/IOS_BUILD_NOTES.md` records the repeatable iOS build/install flow and first-install lessons learned.

Near-term work:

- Design-first rebuild pass: compare each screen against the fresh Claude iOS/Android exports and fix the obvious fidelity gaps before the next real-device build. This includes native chrome, large-title spacing, bottom tabs/FAB, sheets, cards, typography scale, icon/art usage, and empty/loading/error states.
- Keep every screen dynamic. If a feature cannot sync with Firebase yet, label it as unavailable; do not fill it with static Claude/sample data.
- Add a focused solution for persistent Firebase Auth state across native app restarts. Firebase 12's RN persistence helper exists internally but is not exposed through the package export map used by TypeScript in this Expo project.
- Decide whether and how to migrate the web Debt Dragon/Treasury/Compare localStorage stores into shared Firestore contracts, or keep `playerModules/{uid}` as a native-only bridge until the web migration is planned.
- Expand Split beyond equal-split add flow toward the web app's payer/split-mode parity.
- Add repeatable Simulator/screenshot verification once the local iOS simulator is healthy. Until then, use the physical iPhone only after source-level design review, `expo export`, and backend QA have already passed.
- Keep `mobile/src/*` modular by data, game logic, UI primitives, screens, and sheets so future fixes are point edits rather than a monolithic `App.tsx` rewrite.

## Phase 3 - Real Auth And Security

Goal: harden the now-real Google-auth Super Admin boundary and move remaining privileged flows server-side.

Work:

- Keep the chosen username strategy: username maps to internal `username@coinquest.local`; users do not need real email addresses.
- Preserve the current verified mapping: username -> Firebase Auth credential -> `users/{uid}` public User ID -> active Character ID.
- Harden recovery/admin reset with server-side Admin SDK or equivalent so credential rotation is no longer purely client-driven.
- Super Admin allowlist is now `purich.wc@gmail.com` via Firebase Google Auth.
- Permanent user delete is backend-only via Vercel Serverless Function + Firebase Admin SDK. Production Vercel has encrypted `FIREBASE_SERVICE_ACCOUNT_JSON` for the dedicated `vercel-admin-delete` service account; keep verifying `/api/admin-delete-status` after credential rotation or redeploys. Delete now tombstones the username instead of removing it, allowing the same username to be recreated with the same User ID/Character ID.
- The tightened `firestore.rules` from 2026-06-20 are deployed. Keep `firebase.json` + `firestore.rules` together, and redeploy rules after identity model changes.
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
