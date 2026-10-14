# Native And Web Parity

Last updated: 2026-10-14

## Canonical web links — 2026-10-14

Native board/profile shares, pasted-board URL validation and recovery API calls
use `https://coinquestledger.vercel.app`. Firebase identity/data stays in the
existing project. Profile and board share previews were exercised on the own
binary in iPhone 17 Pro / iOS 26.5 Simulator with the updated JavaScript;
typecheck, lint and 59 native contracts passed. No recovery reset was submitted.
This verifies the source/Simulator paths, not a native distribution update:
previously distributed binaries still need an app update. Web deployment does
not update their embedded URLs. See `docs/domain-migration-2026-10-14/README.md`.

## Rebuild status

The approved rebuild uses Expo SDK 57 and the app's own native development
binary on iPhone 17 Pro / iOS 26.5 Simulator. Account, character/Home, Party
Ledger, Debt Dragon, Treasury, Price Arena, profile/reminders and backup routes
are implemented. Actual Simulator and local-web/live-Firebase evidence, plus
the limits of each check, are in `docs/mobile-completion-worklist.md`.

The storage bridge and backend fixes were released in October; later player
colors were restored without changing those contracts. See `Memory.md` and
`docs/release-2026-10-12.md` for the dated exact-SHA checkpoint.
Verify new deployment claims against CI, the Vercel alias and Firebase Rules;
source availability alone is not deployment. Browser tests and JS checks
supplement actual Simulator evidence. The old app's recovery is documented in
`docs/rollback-parking-lot.md`.

## Purpose

This file maps what the web app and native Expo app share, where they differ,
and what must be verified before native work continues.

## Boundary

- Web app: static HTML/CSS/JS on Vercel.
- Native app: Expo / React Native under `mobile/`.
- Native is player-side only. Do not add Admin native screens or a WebView
  wrapper unless the user explicitly changes direction.
- Both use Firebase project `pointy-personal-toolkit`.

## Shared Backend Contracts

| Contract | Web | Native | Notes |
| --- | --- | --- | --- |
| Firebase Auth username/password | yes | signup/login/persistence/sign-out verified on Simulator | username maps to internal `username@coinquest.local` |
| `users/{uid}` | yes | live signup and owner-profile restore verified | account profile, public User ID, active character |
| `usernames/{username}` | yes | login lookup and live signup verified | public login pointer; recovery hash belongs in private `users/{uid}` |
| `characters/{id}` | yes | created/edited/read on Simulator and web | active character, owner UID, XP and class/skin |
| `trips/{id}` | yes | actual create/edit/import/campaign round trips | same five split modes, payer obligations and settlement records |
| `users/{uid}/boardInvites` | web player | implemented; contract tests and native reminders | 24-hour invite lifecycle; live two-account delivery not exercised |
| `playerModules/{uid}` | deployed cloud bridge | actual Debt/Treasury/Compare round trips | owner-scoped records, preserved legacy browser drafts and conflict protection |

## Intentional Differences

- Web keeps account-scoped localStorage drafts/caches and connects through
  `shared/module-cloud.js` to `playerModules/{uid}`. Differing unsynced local data
  requires an explicit choice, with backups. Native writes the same owner record.
- Cross-device changes load on connection/refresh. This is not realtime sync or
  a native offline write queue. Conflicting writes fail visibly and need reload.
- Successful web loads/saves run without a persistent sync banner. Reload the
  page to fetch changes from another device; connection failures offer retry,
  and conflicting drafts still require a choice and backup before replacement.
- Web uses Firebase compat SDK from script tags.
- Native uses the Firebase modular SDK and fresh owner/lifecycle reads before writes.
- Web uses shared browser globals such as `PointyLogic`.
- Native directly imports the web calculation module through `src/domain/canon.ts`.
- Native UI restores the rebuilt app's full pre-redesign Thai layout and brand;
  read `mobile/DESIGN_DIRECTION.md` and `docs/design-restoration-2026-10-12/README.md`. Website language,
  theme and decorative sound/animation controls remain web presentation settings.
- Native accepts pasted web board links and shares web URLs. Universal Link
  association and push notifications are not configured by this local build.
- Native backup `coin-quest-player-v1` is an owner-checked finance backup; legacy
  web local-data backup remains a distinct format. Board Excel/JSON is interoperable.

## Native Design Gate

The later all-player-form regression is recorded in
`docs/frontend-regression-2026-10-12/README.md`. Web and native share strict
financial number, split-total, offer and finance-backup validation. Money keeps
satang precision; measured quantities may be fractional, piece/pack/promotion
counts and due days must be integers. Negative financial input stays visible
as an error and is not converted into positive money. These repairs are included
in the authorized release source; web promotion does not distribute native code.
After Mac unlock, the own-binary Simulator and local web verified
invalid/corrected entries across all four games and bidirectional persistence.
Native relaunch retained hero 8340; a monthly snapshot appeared in web history.
Fresh web signup/relogin retained hero 2028. See the regression report for exact
actions, screenshots and deliberately untested boundaries.

For product flows before acceptance or a physical-device release (the initial
Simulator setup screen is explicitly a development harness):

1. Compare touched native screens against the current approved design direction.
   The historical `/Users/point/Downloads/Coin iOS Android/` export is absent on
   this machine and must not be claimed as a verified visual reference.
2. Check large-title spacing, cards, sheets, bottom tabs, FAB/plus behavior,
   typography scale, portraits, dragon art, empty/loading/error states, and no
   overlap.
3. Confirm no static Claude/sample finance data is displayed as real state.
4. Confirm real Firebase sign-in/signup and Firestore-backed data for the flows
   being restored. Never mark a pending feature as verified by the setup screen.

## Native Verification Commands

From `mobile/`:

```bash
npm run typecheck
npm run lint
npm run check:dependencies
sh scripts/build-simulator.sh <available-simulator-UUID>
```

Install and launch the resulting native app, then exercise the changed flow
on the actual Simulator and save current visual evidence. Follow
`mobile/IOS_BUILD_NOTES.md` for those steps. A JavaScript export alone cannot
establish native readiness.

Before commit/push/deploy after backend contract changes, also run root:

```bash
npm test
npm run test:backend
```

## Remaining verification and release boundaries

- Human handoff for live recovery/password-changing submissions; only validation,
  reveal contracts, cancellation and existing-password login were exercised.
- Two-account live invitation/expiry, legacy password-unlocked board fixture,
  native offline/fault injection, Android and physical-device/Store distribution.
- Production web promotion is separate. Current suite evidence is recorded in
  `docs/backend-audit-2026-10-12.md`; live account mutation checks are opt-in.
- Production Cloudinary manifest URLs for several portraits/dragon images returned
  404 during regression. The release serves checked-in artwork on production too;
  native bundles the same art. `?assets=cloud` remains an explicit diagnostic.
## Shared backend repair, 2026-10-12

Web/native now replace exact module snapshots and full transactional board
snapshots, preventing deleted fields from reappearing. Web invite acceptance is
transactional like native; new invitation attempts use unique IDs. Both clients
use canonical debt-history replay, local calendar dates and satang thresholds.
Recovery preserves the existing UID, and rules/lifecycle apply to both clients.

Backend evidence and known legacy boundaries are in
`docs/backend-audit-2026-10-12.md`. The Mac was subsequently unlocked and scoped
native flows passed in `docs/post-release-simulator-2026-10-12.md`. The later
color-only pass is in `docs/player-brand-2026-10-12/README.md`; neither record
claims exhaustive fault injection or every-platform coverage.
Web/API deployment does not distribute the native binary.
