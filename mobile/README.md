# Coin Quest Ledger Mobile

Fresh native rebuild started 2026-10-11. This directory replaces the retired
SDK 56 app; see `../docs/rollback-parking-lot.md` for its verified recovery copy.

## Finance contract update — 2026-10-17

New Debt Dragon records default to reducing-balance interest: outstanding
principal × annual rate × elapsed days / 365. Unpaid interest is tracked
separately and payments cover it before principal; saved compound/flat debts
retain their existing mode. The native form exposes all three modes and uses
the same canonical accrual, payment and history replay functions as web.

Split confirmations now record actual repayments. Editing an expense preserves
the money already returned and can produce an additional payment or a refund.
Settlement XP is awarded at most once per pair in each campaign. Native reads
and saves both current `repayment` records and historical `legacy_confirmation`
records without converting old history into an extra cash transfer.

The own-app Simulator passed new-debt creation, partial payment, server refresh,
Split repayment and the resulting refund after an expense edit. The Mac locked
before the final refund confirmation and process-restart checks; those two
native interaction checks remain unverified. Source contracts and the saved
emulator state passed. See [scoped evidence](docs/financial-canon-2026-10-17.md).
This source update does not distribute a new iPhone binary or OTA.

## Current work — iOS refresh, 2026-10-16

The current user decision is to bring the iOS player experience into the latest
mobile website's visual family, with native layout and interaction adaptations.
It supersedes the 2026-10-12 full-layout restoration. The user's later same-day
correction preserves the same illustrated world, including backgrounds and
living character art. The source includes doorway/parchment login, five
system-native tabs, a combined camp/hero with real XP, green/rust/blue/gold Home
cards, full scene backgrounds, compact debt lists and expandable secondary
content. Split puts existing boards before the create/join disclosure. Profile
edit/share/privacy remain visible and its long history/achievement sections
expand on demand. Existing artwork and Mitr/IBM Plex Sans Thai/Chakra Petch fonts
are reused; no new generated assets or Admin portal are included.

Home prioritizes four whole-card module targets and keeps native pull-to-refresh,
Account/Reminders, explicit retry and profile access. Featured Home/Profile
portraits and debt detail art use gentle native transforms with a pause/resume
control; Reduce Motion, route blur and app backgrounding stop the loops. The
auth seal plays one short cycle. Motion never changes layout or financial state.
Home uses the portrait doorway behind its tavern camp. Owner/public profiles
share a compact identity panel and native privacy switch; public Character-ID
views load only the public character and shared boards, without private-module
reads or progression writes. Owner amounts remain masked while privacy loads.

Debt and Prices now have native search plus collapsible status/sort tools;
Treasury category search/status uses the website's budget thresholds. Archive
restoration stays available. Board JSON import/export remains interoperable;
Excel report export remains available through Share, while Excel upload and
spreadsheet templates are outside the current native scope. The dated October
12 feature inventory below describes that older implementation.

Account can reveal/copy an available owner-held Recovery ID after checking the
fresh server hash. Acknowledged codes are stored best effort in this device's
Keychain; an explicit notice covers storage failure after the user has saved an
external copy. Native expense editing preserves a missing date or existing
timestamp until selection. Numeric keyboard Done and pending-save Back/swipe
guards keep form completion tied to its original focused screen.

See [design direction and palette](DESIGN_DIRECTION.md) and the
[current refresh report](docs/native-refresh-2026-10-16/README.md) for scoped
Simulator acceptance, completed local web/backend checks, exact native artifact
provenance and the remote CI/CD record. The dated evidence below describes earlier builds and does
not establish acceptance of this refresh. The requested device deliverable is
a signed standalone Release ready for a later authorized USB-C installation;
no physical iPhone connection is part of this pass. Follow
[device build/install instructions](IOS_BUILD_NOTES.md).

## Required workflow

Development is Simulator-first. Before feature work, build and install the
app's own iOS binary, open it on an actual iOS Simulator, and verify interaction.
For every subsequent flow, inspect native rendering, tap through the flow,
check keyboard/back navigation, and save a current Simulator screenshot.
TypeScript, JS exports, and browser previews do not satisfy this gate.

## Setup

- Node: 24.21.0 (`.nvmrc`); npm 11.19.0 and `package-lock.json`.
- Expo SDK 57; React Native and React versions follow its official template.
- iOS bundle identifier: `com.purichwc.coinquestledger`.
- Native projects are generated by Expo. Do not hand-edit `ios/` or `android/`.
- Xcode 27 calls the simulator UI **Device Hub**. On this Mac the launcher is
  `/Applications/Xcode.app/Contents/Applications/DeviceHub.app`; do not assume
  `Simulator.app` still exists.

From this directory, activate the pinned Node installation, then run `npm ci`.
Use Expo's installed CLI to add SDK-compatible dependencies. Build logs and
local binaries belong in the ignored `.artifacts/` directory.

## Product boundary

Canonical web origin: `https://coinquestledger.vercel.app`. Board/profile share
links, accepted web board URLs and the account-recovery API use this origin.
Firebase project, identity and data remain unchanged. The 2026-10-14 source
update passed native checks and actual Simulator share-preview verification;
it did not distribute a new app binary/OTA. Installed older releases need an app
update. See [domain migration evidence](../docs/domain-migration-2026-10-14/README.md).

Player-side native app. Existing web account, character, board, invitation,
settlement, recovery, and module storage contracts remain authoritative.
There are no production data writes during the setup gate. No feature or native
platform should be described as verified until actually exercised.

## Historical verification — 2026-10-12

The setup gate passed on 2026-10-12 (Asia/Bangkok), using the app's own Debug
binary on iPhone 17 Pro / iOS 26.5 in Device Hub. Native build, installation,
launch, forward/back navigation, software keyboard input and dismissal, native
alert, state update, Fast Refresh, and reload were exercised directly.

Simulator testing found a covered text field. The setup form now uses the
ScrollView's native automatic keyboard insets; the fix was verified again after
a fresh reload. TypeScript, lint, and Expo dependency compatibility passed.

See [verification evidence](../docs/mobile-simulator-qa-2026-10-11.md),
[build/run instructions](IOS_BUILD_NOTES.md), and the user-approved
[design direction](DESIGN_DIRECTION.md).

The entry screens at that checkpoint implemented account login/signup with the existing
Firebase project. Native build, signup, fresh password login after sign-out,
signed-in persistence after process restart, sign-out persistence, invalid-login
feedback, keyboard and Back behavior have been exercised. The requested account
Simulator gate passed on 2026-10-12; see
[account-flow evidence](../docs/mobile-auth-qa-2026-10-12.md).

The account screens use the website's Mitr, IBM Plex Sans Thai and Chakra Petch
font families from local licensed assets. Shared roles live in
`src/theme/typography.ts`; login/signup/account rendering was verified on Simulator.

## Player modules — 2026-10-12

Implemented routes now cover character creation/editing, Home, full profile,
Party Ledger, reminders/invites, Debt Dragon, Treasury, Price Arena, and
account backup/restore. Party Ledger includes five split modes, multi-payer,
Guest management, Character-ID invitations, budgets, settlements/PromptPay,
campaigns, receipts, text/Excel/JSON import and export. Finance modules include
editing, recoverable removal/history, projections, and shared progression.

All calculations import the website's `shared/pointy-logic.js` through
`src/domain/canon.ts`. The deployed website uses
`shared/module-cloud.js` connecting its account-scoped browser stores to the
same `playerModules/{uid}` used by native. Conflicting unsynced local data needs
an explicit choice with backups; stale writes stop instead of overwriting.
See `../Memory.md` and `../docs/release-2026-10-12.md` for the dated release
checkpoint. The website/API deployment does not distribute a native binary/OTA.

Native Simulator and local-web/live-Firebase round trips passed for character,
ledger, debt, treasury, comparisons and profile. Native backup export, Files
picker, restore preview, confirmed restore and rollback-file preview passed.
See [acceptance and remaining limits](../docs/mobile-completion-worklist.md).
Recovery reset/regeneration is implemented, but live credential-changing
submission requires a human handoff; validation/cancel were exercised only.
Two-account live invite delivery, Android, physical-device signing and Store
distribution were unverified at that checkpoint; consult the 2026-10-16 report
and `IOS_BUILD_NOTES.md` for current packaging status. Physical installation and
Store distribution remain separate from packaging. Later native-to-production-web Treasury checks
passed; see `../docs/post-release-simulator-2026-10-12.md`.

The 12 October restoration recovered the complete rebuilt native layout and
buttons of that period while retaining backend fixes. It is preserved in
`../docs/design-restoration-2026-10-12/README.md`; the current 16 October direction
is in `DESIGN_DIRECTION.md`. Use `$coin-quest-new-chat` and `../Memory.md` for
onboarding together with the newest dated report, not historical release assumptions.

Focused checks: `npm run test:auth`, `test:character`, `test:ledger`,
`test:modules`, `typecheck`, `lint`, and `check:dependencies`. Run the real native
interaction gate after changes; a green source check is not native QA.

The subsequent all-form validation pass uses shared numeric/range/precision,
offer and backup contracts, with immediate invalid-number feedback in `Field`.
Accrued debt balances retain precision when unchanged, and reloading preserves
initial principal even when accumulated interest makes the balance higher.
Typecheck, lint and 59 contract tests passed. After Mac unlock, actual Simulator
checks covered negative/invalid input and corrected saves in all four games,
web/native Firebase round trips, monthly history and login/character retention
after relaunch. A blank split form no longer previews NaN. Typecheck/lint passed
again after that fix. See `../docs/frontend-regression-2026-10-12/README.md` for
evidence and remaining limits. These changes are included in the release source;
the web deployment does not distribute a native binary or OTA update.

## Current native navigation and verification boundaries

- `/play`: Home; `/play/split`, `/play/debt`, `/play/prices` and
  `/play/treasury`: system-native tab destinations. Detail and edit screens retain
  their existing root-stack paths and return to the selected destination.
- Shared `SceneBackdrop`, `SceneHeader` and `Disclosure` live in
  `src/player/ui.tsx`; `LivingArt` owns motion lifecycle in
  `src/player/LivingArt.tsx`; `useSaveNavigation` guards delayed save completion.
  `src/character/profile-identity.tsx` owns compact identity/privacy controls;
  `public-profile-service.ts` owns read-only other-character loading.
  Auth fields, actions and the parchment-surface
  palette live in `src/auth/ui.tsx`. Existing financial
  canon, owner checks, board management and recovery contracts remain authoritative.
- An explicitly enabled development-only Firebase emulator mode isolates local
  Simulator QA under `demo-coin-quest` from production identity/data. Do not use
  `EXPO_PUBLIC_NATIVE_QA_EMULATORS=1` for a Release build; the final installed app
  must use the canonical production configuration.
- Before push, follow `../TESTING_MATRIX.md` and
  `../DEPLOYMENT_AND_ROLLBACK_RUNBOOK.md`: root `npm test` and
  `npm run test:backend`, native typecheck/lint and all contract tests, plus
  relevant actual Simulator evidence. CI repeats the required gates. A green
  CI job does not prove native visual suitability or
  distribute the iOS binary.

After the final source freeze, the native command gate is `npm run typecheck`,
`npm run lint`, `node --test tests/*.test.mjs`, `npm run test:qa`,
`npm run test:device`, `npm run check:dependencies`, and shell syntax checks for
the device build/install scripts. Record results against the exact source in
the dated refresh report; this command list alone is not acceptance. Simulator interaction,
motion/Reduce Motion, final signed Release packaging and physical USB-C install
remain separate evidence boundaries. Do not overlap a heavy web suite and native
build on this Mac; preserve required checks rather than increasing timeouts.
