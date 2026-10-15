# Player feature inventory — native refresh

Checked against the current `NATIVE_WEB_PARITY.md`, player web routes and native
route/component source on 2026-10-16. This is a capability inventory. A route or
shared API being present does **not** mean its refreshed UI, persistence or error
states have passed device testing. Current visual and flow evidence belongs in
[the refresh report](README.md) and [native QA notes](native-qa.md).

## Player surfaces

| Web/player feature | Native entry and implementation | Status / native adaptation |
| --- | --- | --- |
| Login, signup, remembered session, logout | `/`, `/signup`; `auth/AccountEntry`, `AuthProvider`, `account-service` | Implemented. Compact login, native keyboard navigation, safe areas and explicit errors. Same Firebase account identity. |
| Forgot password and key regeneration | `/recover`, `/account` | Implemented against the canonical recovery endpoint. Regeneration invalidates the old key and requires saving the new one. Production password-changing submission is a separate verification boundary. |
| Recovery ID reveal/copy | `/account`; `auth/RecoveryPanel` | Added in this refresh. Reads the authenticated owner profile freshly, validates an existing device-held or legacy owner-held code against its current hash, then reveals/copies it. Missing raw code is explained; a hash is never reversed or presented as a code. |
| Account security storage | `account-service`, Expo SecureStore | Acknowledged keys are saved best effort in this device's Keychain with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`; plaintext is not added to Firestore, public identities or backups. If local storage fails, the already displayed key is checked against the fresh owner hash and an explicit notice tells the user to keep their confirmed external copy. Old keys fail current-hash verification after rotation elsewhere. Screen/background changes hide revealed text. |
| Character creation / editing | Creation gate, `/character-edit` | Implemented: name, class, gender and skins retain canonical identity and progression. |
| Home / progression / trophies | `/play`, `/character`; `character/Home`, `Profile` | Implemented: XP, levels, reputation, streak, canonical achievements and module/board summaries. Existing artwork and native motion preserve the brand. |
| Public view of someone else's character | Native `/character?id=…`, web `/character/?id=…` | Implemented read-only public view. Current Simulator QA opened character 8602 from account 8601 and showed 420 saved XP without owner edit/archive controls. Invalid/missing/private ID variants have separate acceptance. |
| Welcome Tour | `/account` → `/welcome` | Added native replay with four pages for tabs/progression, Party Ledger, Debt/Treasury and Price Arena. Reuses existing tour art, native navigation and safe-area footer. All four pages, Back and Close passed current Simulator interaction. First-signup automatic launch is separate from replay availability. |
| About, Privacy, Terms | `/account` links | Opens `/about/`, `/privacy/`, `/terms/` on `https://coinquestledger.vercel.app` in the system browser, preserving the maintained policy text. |
| Reminders and invitations | `/reminders` | Implemented financial reminders, board invites, accept/decline and expired-state contracts. Live two-account delivery is distinct from local emulator evidence. No OS push registration. |
| Board selection/create/join | `/play/split`, `/split/index` | Implemented board list, create/join and pasted canonical web board links. Existing boards lead; create/join is secondary. |
| Board finance | `/split/board`, `/split/expense` | Implemented the five split modes, multiple payers, precise amounts, exclusions, receipts, expense edit/trash, settlements and board budget. Uses canonical web calculations. |
| Player board-owner management | `/split/people`, `/split/guest`, `/split/settings` | Implemented real-ID invitation, guests, guest character edits, protected member removal, board settings and shared PromptPay. This is player functionality, separate from Admin. |
| Campaigns and recoverable history | `/split/campaigns` | Implemented campaign switching, archive/reopen and recoverable trash with preserved finance metadata. |
| Board import/export | `/split/settings`; `ledger/files` | JSON Files import with preview/confirmation and JSON export retained. Text/template entry retained. Excel report Share export retained. Excel Upload and its template-download action are intentionally removed. |
| Debt Dragon | `/play/debt`, `/debt/dragon`, `/debt/log` | Implemented debt creation/edit, principal/interest, payments, due plan, history and recoverable archives. Compact search matches name/type; expandable controls offer All/Active/Due/Paid/Archived and added/balance/APR sorting using the canonical due-date/payment rules. |
| Treasury | `/play/treasury`, `/treasury/edit`, `/treasury/history` | Implemented income, categories/budgets, expenses, recurring bills, payment state, month-close and historical snapshots. Category search and All/On track/Near/Over controls use the web thresholds: near from 80%, over only above budget. |
| Price Arena | `/play/prices`, `/prices/item`, `/prices/offer` | Implemented products/offers, unit conversions, pack/buy-free promotions and comparison. One offer per native form. Compact name search and expandable All/Active/Archived plus latest/name/savings controls preserve canonical ranking. |
| Player finance backup | `/backup` | Owner-checked `coin-quest-player-v1` JSON export/restore through native Files/Share, with preview and confirmation. This differs from the legacy browser-local backup format. |
| Shared data across web/native | Firebase `users`, `characters`, `trips`, `playerModules` and invites | Shared backend and canonical calculations are implemented. Connection/refresh loads changes; this is not a realtime listener or offline mutation queue. Conflict handling requires reload. Separate bidirectional tests establish actual behavior. |

## Intentional exclusions and differences

- Admin portal: excluded by the user's request. No native Admin route or embedded
  Admin web view. Player board ownership controls remain available.
- Excel Upload/import and its empty spreadsheet template: excluded by the user's
  request. Useful Excel report exports, JSON backups and the native Share/Files
  flows remain. ExcelJS is still required by report export.
- Website language/theme/sound preferences remain web presentation settings in
  the existing parity contract. Native uses its own illustrated composition,
  native tabs and system Reduce Motion, with pause/resume on animated artwork.
- Legal/about content opens in the browser rather than maintaining duplicate
  native policy text.
- Native history pages and one-at-a-time offer forms adapt navigation and input
  to the phone. They do not remove the underlying history or comparison data.
- Bulk "clear all" Debt/Treasury actions are not mirrored by the current native
  UI; recoverable per-item archive flows and JSON backup remain available.
- Universal Links, OS push notifications, Android verification, App Store
  submission and an actual iPhone connection are outside this local iOS pass.

## Verification and remaining acceptance

- Excel removal: TypeScript, targeted ESLint and 38 ledger/module contract tests
  passed. Existing Excel parsing contract tests cover the shared converter, not
  an exposed native Excel upload flow.
- Recovery display: tests cover current/rotated hash, another account, missing
  code, malformed code and corrupt candidate values. A focused regression checks
  successful reset acknowledgement when temporary and saved Keychain storage
  fail: the displayed new code remains sufficient after current-hash validation,
  with an explicit `stored: false` outcome. The current Simulator missing-code
  state passed; valid-key copy and hidden-on-background need separate proof.
- The current tour, owner/privacy and read-only public-profile checks, native
  status-filter/reset paths and web Treasury readback are recorded in the
  [QA matrix](qa-matrix.md). Account About opened in the system browser and
  returned to the app; Privacy/Terms return paths and remaining search/sort
  permutations retain their own verification boundaries. Do not interpret this table
  as claiming all routes have been visually inspected.
- Optional expense dates: three source/unit regressions cover editing an
  undated web record without adding today, preserving an existing timestamp and
  assigning today to a new expense. The final optional-date UI was not re-exercised.
- Signed standalone iPhone Release packaging is tracked in
  [iOS build notes](../../IOS_BUILD_NOTES.md). The signed Release passed
  after source freeze and SDK 57 patch updates, including embedded bundle,
  signature/profile and unchanged source-manifest checks. The final 04:41:06
  Bangkok artifact includes all four loading-title fixes; their bounded runtime
  check is recorded separately in the QA matrix. The rebuilt Simulator
  received the bounded isolated smoke recorded in the report; no physical phone
  has been connected.
- Push completion, CI results, web promotion and native installation are separate
  outcomes. A website deployment does not update the native binary.
