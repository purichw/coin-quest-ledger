# Account drawer · 14 October 2026

Local implementation of the user's [selected Account Drawer mockup](reference.png).
This change is not committed, pushed or deployed. The preceding guild-auth
redesign remains in the same working tree and is preserved.

## Design and ownership

- Keep the right-side parchment panel, dark blurred backdrop, gilded portrait,
  green/gold progression, compact streak/trophy row, board list, settings,
  backup, Recovery ID and red outlined logout. Desktop also reuses the owl note.
- `shared/profile-drawer.js` owns rendering, disclosure state, focus trapping,
  background inertness and recovery-code display. `profile-hub.js` supplies live
  data and existing account/backup operations. `profile-hub.css` is the shared
  styling owner; superseded drawer/account blocks were removed in place.
- Shared glyphs come from `quest-icons.js`; character portraits remain the
  selected user's RPG art. The existing `auth-reference/owl-note.webp` is reused.
  Portrait frame/pennant use CSS. No new raster assets or backend schema added.
- Account green/gold stays consistent even on games with another accent.
  Preserve the existing Mitr / IBM Plex Sans Thai / Chakra Petch font roles.
- Adapt the illustration into a 460px desktop / 430px tablet drawer and an inset
  phone panel. Long names and extra rows grow inside the scroll region; never
  clip essential actions to force screenshot height.

## Real product contracts

- The existing **owned/admin board** filter is unchanged. This is not a new list
  of every joined board. Show the latest three, with Show all/Show less when
  needed; keep all actual links, member counts and quest counts.
- Streak, level, reputation and trophies come from the current calculations.
  All 19 trophies remain reachable through the compact summary disclosure.
- Settings opens initially on desktop/tablet. Backup and Recovery ID open
  initially on desktop. Phone keeps these secondary sections collapsed and
  places the Tour replay row after them. Boards starts open everywhere.
- Theme/language changes and live board refresh preserve disclosure, expanded
  board list, scroll and focused control. Closing restores the profile opener;
  Tab stays in the dialog, Escape/backdrop/close dismiss it. Tour receives its
  own modal focus/inert lifecycle without leaving the page locked.
- Recovery ID starts masked. Reveal/hide changes presentation only; Copy uses
  the complete code and reports clipboard success/failure. Regenerate uses the
  existing save/hash flow and reveals the new code; failures retain the old one.
- Backup keeps the existing account-scoped JSON contract. Identity/credentials
  are not exported/restored; imports validate before confirmation or writes.
- No native-app, Admin, Firebase rules, authentication storage or finance logic
  changes are included.

## Visual evidence

Actual local browser renders, personally opened and visually inspected:

| View/state | Evidence |
| --- | --- |
| Desktop 1440×900, TH/light, three boards | [drawer](qa/drawer-1440.png), [bottom](qa/drawer-1440-bottom.png) |
| Tablet 768×1024, touch, TH/light | [drawer](qa/drawer-768.png), [bottom](qa/drawer-768-bottom.png) |
| Phone 390×844, touch, TH/light | [drawer](qa/drawer-390.png), [bottom](qa/drawer-390-bottom.png) |
| Phone 390×844, EN/dark, long character/board names, five boards | [expanded state](qa/drawer-390-dark-long.png) |

These use a local test account named Mali with real rendering/data paths and
fixture boards. Its metrics intentionally differ from the illustrative mockup.
The genuine pre-edit [desktop](qa/before-1440.png) and [phone](qa/before-390.png)
captures show the default demo account, so they are not a like-for-like data
comparison. `first-*` files are intermediate renders, not completion evidence.

Review corrections included portrait centering independent of its idle animation,
close-button/pennant separation, desktop density so default tools fit at 900px,
touch targets, and consistent readable dark colors across game routes.

## Verification

- 11 targeted Chromium E2E checks passed: responsive layouts, empty/many boards,
  disclosure/focus preservation, theme/language, backdrop/keyboard/Tour handoff,
  export/import validation/cancel/restore, masked copy and regeneration failure,
  real-mode Firebase transport ownership/logout, recovery hash invalidation,
  and existing Tour behavior. The copy-failure check passed again after adding
  explicit feedback for a denied clipboard.
- Tablet touch composition: 1 passed. Mobile run: 5 passed (drawer composition,
  Firebase-mode logout, profile-link journey, plus existing creation/auth views).
  Firebase transport is a fixture; this is not a production Firebase test.
- Backup unit checks: 2 passed. Browser/module syntax and `git diff --check`
  passed. No broad game/backend/native/production suite was run for this drawer.

Main regression: `tests/e2e/account-drawer.spec.mjs`. Existing recovery test in
`coin-quest-ledger.spec.mjs` now reveals the masked code before asserting it.
Production-mode logout test lives in `account-persistence.spec.mjs`.

Use the existing dev server at `http://127.0.0.1:4569`. For legacy screenshot
tests, set `POINTY_QA_DIR=docs/account-drawer-2026-10-14/qa` to keep this run's
artifacts separate from historical captures.
