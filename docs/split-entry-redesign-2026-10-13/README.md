# Split entry + board creation — 13 October 2026

Scope: the website `/trip/` entry at 1440, 768 and 390 CSS px. The supplied
Desktop, Tablet and Mobile Party Ledger Entry mockups govern this surface.
This does not redesign the expense editor at `/trip/?id=...`, Admin or native.

## Design translation

- Preserve: existing Firebase board shape, account/character ownership, generated
  four-digit IDs, board links, create/join and TH/EN + theme controls.
- Translate: wooden navigation, tavern hero/chest, green title, Create/Join tabs,
  cream form card, recent boards, key/code panel, parchment note and footer.
- Adapt: two columns on desktop/tablet; one column on phones, with one recent
  board initially and “View all”. Field labels remain centered per project
  preference. Names and member/expense counts come from existing account data.
- Do not infer: fake sample memberships, pending-payment totals or board photos.
  Counts say **expenses**, not unpaid expenses. Recent-board thumbnails use a
  reusable decorative tent because boards have no cover-image field. The existing
  Home tavern art is reused; the supplied mug/sign artwork is not pixel-identical.
  Tent, key, clock, crown and mountains are local vector illustrations.
  Device frames, explanatory callouts and outside-slide scenery are not product UI.

## Owners and behavior

- `trip/entry.js` + `trip/entry.css`: entry composition, tabs, draft/error/busy
  states and recent-board presentation. Old `.bc-*` chooser CSS/renderers removed.
- `trip/app.js`: existing persistence and permissions. Entry creation now handles
  failed reads/writes, repeated submits and exhausted code collisions. It keeps
  form drafts on failure, commits before navigation and records account ownership.
- `shared/profile-hub.js`: read-only `boardEntries()` exposes the existing
  account-scoped list; `pointy-boards-updated` refreshes only the recent section.
  No second Firestore list query. Landing no longer publishes an uncreated board
  as a current-board snapshot.
- `assets/split-entry/*.svg`: five decorative illustrations. Hero/chest reuse
  `assets/home-reference`. Shared navigation remains the existing owner.
- `/trip/?action=new` now lands on the inline creation form. In-board advanced
  “new adventure” setup remains available and unchanged.

## Evidence and limits

Current captures in `qa/` use isolated TEST account/board fixtures, local static
server and Chromium. Source/reference hashes and crop bounds are in
`qa/manifest.json`. Reference images are cropped only to remove slide/device
framing, then uniformly scaled. Remaining callout overlap is part of the supplied
reference. Mobile top/bottom captures retain the actual fixed navigation; the
full-page capture naturally paints that bar at the initial viewport's bottom.

Checked: creation/reload/reopen, joining, invalid names/codes, unknown boards,
write failure/retry, duplicate-submit prevention, code collisions, live recent
list failure/retry, keyboard tabs, language/theme draft retention, image loading
and overflow at all three requested widths. Production-mode frontend tests use
stubbed Firebase transport; no production account/data was created or changed.

Visual review: personally inspected desktop, tablet and phone renders, including
the phone's lower form and fixed navigation. Dark/English and write-error evidence
are captured separately. Broader finance math, Admin/native, real Firebase writes
and release/deploy checks are outside this scoped pass. No push or deploy.

Result: **VERIFIED for the local entry redesign**. 26 E2E cases passed (6 entry,
6 Home/navigation, 11 account/transport, and the existing chooser/join case on
desktop, tablet and mobile). Syntax, required-asset checks and `git diff --check`
passed. This is not a production-release verdict or a pixel-perfect-art claim.

Run targeted checks:

```sh
POINTY_REAL_FIREBASE_E2E=0 npx playwright test tests/e2e/split-entry.spec.mjs tests/e2e/navigation-home.spec.mjs tests/e2e/account-persistence.spec.mjs --project=chromium
npm run test:syntax
npm run test:assets
git diff --check
```

Set `CQ_ENTRY_SNAPSHOTS=1` for the Split entry spec to refresh documented captures.
