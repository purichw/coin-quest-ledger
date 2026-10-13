# Reminders — 2026-10-14

Scope: the shared player website Reminders surface on Home/Price Arena, Party
entry/board, Debt Dragon and Treasury. Native and Admin are unchanged. Local
implementation only; no production writes, commit, push or deployment this turn.

## Design and real behavior

Preserves the latest supplied mockup's cream paper, blurred backdrop, compact
header, gold bell, green three-way tabs, portraits/category icons, invite action
pairs, financial detail buttons and centered footer. Mitr/IBM Plex Sans Thai stay
consistent with the site. Desktop (≥1024px) anchors a 480px panel below the bell;
tablet centers a 460px modal; phone (≤767px) uses nearly the full viewport width,
with two full-width invite actions in their own row. Long lists scroll inside
the panel while the header, tabs and footer stay available. Dungeon uses the same
composition and contrast-adjusted colors. Mobile/Desktop dimensions are adapted
to readable live controls, not copied from the annotated slide's framing.

- Uses existing pending invitations, unpaid bills, due debts and outstanding
  settlements. Overdue financial tasks retain their existing priority. Actual
  names, amounts, dates and portrait assets replace the mockup's example data.
- New invites carry optional inviter class/gender/skin snapshots from the current
  character. Old invites use a known registry portrait or initials, not a made-up
  character. Icons come from the shared SVG family; the document glyph is added
  there, not as a page-specific duplicate.
- All / Party invites / Finance filter the same data. Counts and bell badge mean
  unread. Mark all as read never pays, accepts or removes anything. Read state
  persists in `pointy_reminders_read_v1` via `PointyScope`, on this device for this
  account. Changed financial amounts/cycles and fresh invitation attempts become
  unread again. This is not server-synced read history.
- View all expands the current category beyond its recent four items; Back to
  recent restores the compact list. This adapts the reference's footer to the
  existing product, which has no notifications index/history/settings route.
  No dead settings gear is added. Empty categories omit the footer action.
- Accept and Decline keep the real existing invitation transaction, board access,
  identity and 24-hour expiry rules. Decline still asks for confirmation. Successful
  responses leave the pending list; no fictitious accepted/declined history is
  introduced. Accept opens the joined board with the account's existing character.
- Both row actions disable during a response; errors remain visible and allow
  retry. Expired invitations cannot be accepted and disappear from an open panel.
  Loading/retry preserves filters and list scroll. An older in-flight fetch cannot
  replace the next account's invitations. Backend authorization/rules are unchanged.
- Bills and debt open their existing game. Settlement opens the correct board;
  the summary distinguishes outgoing payments from money owed back to the player.
- Tabs support arrows/Home/End, focus is trapped, background content is inert,
  Escape/X/backdrop close, and focus returns to the invoking control. Desktop
  positioning follows the shared bell, including after resizing.

## Owners and cleanup

`shared/profile-reminders.js` owns rendering/filtering/modal interaction;
`shared/profile-hub.js` owns live data, read metadata and invitation actions;
`shared/profile-hub.css` owns the single `.rem-*`/`.ri-*` visual family.
Superseded legacy reminder card/popover selectors and copy are removed. Recovery,
account drawer and tour remain separate overlay variants. `shared/board-invites.js`
only adds optional portrait metadata to new invitation payloads.

## Verification

Local browser UI with deterministic `?test=1` fixtures, real DOM interactions and
existing test-mode board persistence; selected service failures are injected.
This is frontend integration evidence, not a live Firebase or production pass.

- Desktop 1440×900, tablet 768×1024 and mobile 390×844: tab filtering, loaded
  images, aligned controls, bell anchoring/centering, no overflow, Escape/focus.
- Read all → pending tasks remain → another game/reload retains read state →
  changed bill amount becomes unread → Details opens Treasury and marks it read.
- Decline cancel, failed response, busy actions, retry, successful persistence
  and retained selected tab. Existing full invite-by-Character-ID → decline/
  accept → board membership regression passes with the new labels/portrait.
- Loading failure → retry with retained filter/expanded list/scroll; expired
  invitation cannot join; a delayed old-account response cannot leak invitations.
- Overdue debt stays first and its Details opens Debt Dragon. Dark/English long
  content and empty state render on Price Arena; keyboard loop/backdrop close.
- Touch-enabled Chromium tablet/mobile checks at 768/390px and overdue-debt flow.
- JavaScript syntax and `git diff --check`. No full-site/backend/native suite or
  Safari/physical-device claim is made for this focused component change.

Personally inspected the current Desktop, Tablet and Mobile screenshots, plus
dark long-content and empty views. Face cropping and mobile close alignment were
corrected after the first render. Reference crops are scaled uniformly to match
the panel display widths in [comparison.html](comparison.html); annotation markers
remain in the reference. Its pixel crop is not a claim about source CSS geometry.

Full context: [Desktop](qa/reminders-1440.png), [Tablet](qa/reminders-768.png),
[Mobile](qa/reminders-390.png), [Dark/long](qa/reminders-390-dark-long.png),
[Empty](qa/reminders-390-empty.png). `qa/before-desktop.png` is the real previous UI
diagnostic with three fixture reminders, not a matched four-row before/after.

Tests: `tests/e2e/reminders.spec.mjs`, fixture in
`tests/e2e/helpers/reminders-fixture.mjs`, and the focused invite-by-Character-ID
case in `tests/e2e/coin-quest-ledger.spec.mjs`.

```sh
POINTY_REAL_FIREBASE_E2E=0 npx playwright test tests/e2e/reminders.spec.mjs --project=chromium
POINTY_REAL_FIREBASE_E2E=0 npx playwright test tests/e2e/coin-quest-ledger.spec.mjs \
  --project=chromium --grep 'pins the signed-in account hero'
POINTY_REAL_FIREBASE_E2E=0 npx playwright test tests/e2e/reminders.spec.mjs \
  --project=tablet --project=mobile --grep 'at 768px|at 390px|Overdue debt'
```
