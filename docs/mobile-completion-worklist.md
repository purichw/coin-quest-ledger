# Player app completion — 2026-10-12

**Later release status:** the web/API and Rules rollout completed; see the
[release record](release-2026-10-12.md). After the Mac was unlocked, the own
native app also passed the scoped [post-release verification](post-release-simulator-2026-10-12.md).
The statements below about local-only code and pending deployment describe the
earlier implementation checkpoint, not current production status.

The user expanded scope to all player modules and web interoperability, without
step-by-step permission prompts. Implementation continues one native flow at a
time with a real Simulator check before moving to the next flow. Admin stays web.
No publish, production migration, or release is claimed by this worklist.

## Acceptance ledger

| Surface | Required behavior | Current evidence |
| --- | --- | --- |
| Account | signup, login, recovery, persisted session, logout, lifecycle guard | implemented; live signup/login/persistence/logout passed. Recovery validation and rotation cancel passed; actual credential change requires human handoff |
| Character / Home | 18 classes, 41 portraits/skins, identity, progression, profile/history, privacy/share | native creation/edit/Home/restart/relogin and web profile round trip passed; shared XP 162, same ID 2150 |
| Party Ledger | create/open, access, Guests, invitations, five split modes, multi-payer, budgets, settlement/QR, campaigns, receipt, import/export, sharing | implemented; native/web expense round trip, exact split, Guest rename, settlement, receipt, Excel export/import, campaign switch and member remove/restore exercised; total 400, shares 160/240 |
| Reminders | invite accept/decline/expiry, debt/bill/settlement navigation | implemented; native reminder to board navigation passed; financial filtering/invite contracts tested. Live two-account invitation not exercised |
| Debt Dragon | create/edit, daily interest, dated payments/history, recoverable removal, strategy, forecasts, reminders, artwork | implemented; native 1000 → web payment 100 → native 900 → native payment 200 → web 700, dated history and strategy/forecast checked |
| Treasury | income, categories, expenses, bills, recoverable removal, monthly history/close, projections | implemented; native income 5000 and expense 120, web bill 300, native bill payment → both spent 420/left 4580; close/history and reference guard passed |
| Price Arena | comparison/offer CRUD, recoverable removal, unit conversion, promotions, ranking | implemented; native 30/1L vs web 20/500ml buy 2/free 1 → same winner, 11% saving |
| Backup | export, picker, owner validation, preview, restore, before-restore copy | implemented; real iOS share/Files export, pick/import preview, confirmed restore and rollback-file preview passed |
| Cross-client data | shared account/character/trips and finance storage bridge | local website ↔ existing Firebase ↔ native round trips passed; browser/cloud conflict and account-switch behavior tested; web update NOT deployed |
| Native finish | navigation, keyboard, loading/errors, duplicate-submit, fonts, relaunch | own installed iOS binary, native pickers/alerts, website fonts, per-flow screenshots and signed-in process restart verified |

## Discovered storage boundary

`users`, `usernames`, `userIds`, `characters`, `trips` and `boardInvites` remain
shared Firebase contracts. The web finance utilities previously used only scoped
localStorage. The implemented `shared/module-cloud.js` now bridges them to
`playerModules/{uid}` while keeping local drafts and an explicit local/cloud
conflict choice. Both choices are backed up before replacement. Writes serialize,
read the current server snapshot, reject conflicts, and stop after account changes.
Cross-device updates load on connection/refresh, not a realtime subscription.

Native imports `shared/pointy-logic.js` directly. Transactional native operations
read current owner/lifecycle/character documents, preserve unknown fields and
change only their owned state. New finance modules start empty. Quest templates
are editable previews and never become records without explicit import.

## Evidence and checks

- [Account](mobile-auth-qa-2026-10-12.md), [character/Home](mobile-character-home-qa-2026-10-12.md).
- [Party Ledger](mobile-ledger-qa-2026-10-12.md), [Debt/Treasury](mobile-debt-treasury-qa-2026-10-12.md).
- [Price/Profile](mobile-prices-profile-qa-2026-10-12.md), [account backup](mobile-account-backup-qa-2026-10-12.md).
- Native: TypeScript, ESLint and Expo dependency compatibility passed. Contract tests: auth 9, character 12, ledger 21, finance/reminders/backup 15 (57 total).
- Website: syntax checked 44 browser scripts + 12 modules; 42 unit tests passed; full Playwright 80 passed / 4 expected skips on desktop, tablet and mobile. The final file-import/campaign changes passed 9 targeted browser checks, including the new JSON → Excel → import test on all three viewports. `POINTY_REAL_FIREBASE_E2E=0` excludes real account deletion. Live Firebase checks above were manual synthetic-account workflows, separate from mocked browser tests.
- The native build with all added native dependencies succeeded around 02:32 Bangkok. Later checks used that own binary and the current Metro bundle on iPhone 17 Pro / iOS 26.5. No Expo Go or browser phone viewport was used as native proof.
- Final process relaunch returned to signed-in Home, ID 2150 / XP 162. Saved comparison still showed both web/native offers and the same 11% winner. [Inspected Home screenshot](mobile-character-home-qa-2026-10-12/home-final-162.png).
- After the final campaign snapshot fix, the targeted mobile-web itemized/receipt/campaign test passed again. The final backup validator also successfully parsed the JSON actually exported by the installed native app (1 debt / 2 expenses / 1 comparison).

## Honest remaining limits

- Live Recovery ID regeneration/password reset was not submitted: the Computer Use policy requires the human to enter and submit new credentials. No password or recovery key is saved in this documentation.
- Two-account invitation delivery/expiry, a legacy board password fixture, real offline/network-failure injection and every destructive/archive variant were not manually repeated on Simulator. Their relevant pure guards are covered; this is not a claim that every combination was exercised.
- Android, physical iPhone, App Store/TestFlight, push delivery and Universal Link association are separate work. Native accepts pasted web board links. Admin remains web-only.
- The native interface uses the approved Thai brand redesign. Web language/theme/decorative sound preferences and legacy browser backup format are not copied verbatim to native. Native finance backups are owner-checked; board JSON/Excel is interoperable.
- Website changes have not been committed, pushed or deployed. Current production cannot be claimed to have the new finance bridge.
- Several existing production Cloudinary portrait/dragon URLs returned 404. Local web now defaults to checked-in assets (`?assets=cloud` opts into CDN QA); native bundles the same art. Production CDN repair is not claimed.

## Verification depth / stop rule

Deep pass for auth, finance and persistence contracts. Targeted pure tests first,
then real Simulator flows and test-account Firebase writes, then browser reads
and writes of the same test records. Full existing web regression is required
for shared runtime/storage changes. Stop each flow's verification after its
highest-risk state transitions are covered; record untested fault injection.
Android, physical-device signing and Store distribution are not this Simulator
workflow. No unrelated production records, rules or Admin permissions are changed.
