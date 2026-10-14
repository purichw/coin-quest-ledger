# User Profile — continuous scroll

2026-10-14 · Local changes on `2924f02`. Existing uncommitted Admin work is
preserved. No commit, push, deploy or production account mutation in this pass.

## Authority and composition

User-supplied User Detail image: `reference.png`. Board Info is explicitly the
authority when the mockups conflict. Shared Dashboard parchment, global header,
sidebar and footer remain canonical; title scroll, illustrated Tavern icons and
paper borders are reused from Board Info.

The initial implementation placed the title on the left and actions on the
right. The user explicitly corrected that composition during implementation.
Final User Profile has a centered title, account metadata and action row, stacked
inside one parchment panel. The former large quoted Tavern banner becomes a
narrow decorative background separator. The final heading is shown alongside
the reference in `qa/comparison-heading.png`.

All sections remain open: Profile Summary → Character → Boards → Admin roles →
Activity → Account lifecycle. Desktop has a summary aside and a main column;
tablet/mobile stack the main sections. Mobile board rows become contained cards.
No tabs, layout toggle or legacy tab state remains. Lifecycle and list shortcut
actions scroll to the requested heading and focus it without hiding content.

## Product contracts

- Separate Profile Reputation from Character XP and keep actual account counts.
- Profile links retain actual Character IDs and the Admin return route; missing
  IDs have disabled Profile actions. Board and Admin links target real records.
- Export uses the selected user and existing credential redaction.
- Missing owner hashes render `—`; a group key is not presented as an owner hash.
- Activity uses existing related board changes, safe dates, and empty states.
  Local draft changes have a Local draft label instead of an invented timestamp.
- Existing lifecycle/reset/delete handlers and authorization are unchanged.
  Account actions retain validation and confirmation, and take effect separately
  from the Board Publish pipeline.
- No unsupported character editor, Impersonate, Invite Admin or fake activity
  chart is added from the mockup.

## Source and artwork

`admin/app.js`: continuous User Detail renderer and shared detail-heading,
Tavern-icon and banner helpers. Board Info consumes the same shared helpers.
`admin/design.css`: shared paper/title styling and scoped responsive User Detail.
`admin/admin.css`: obsolete tab selectors removed.

Existing assets only: `assets/admin-board-info/` title and illustrated icons,
`assets/auth-guild/tavern.webp`, `assets/auth-guild/parchment.webp`, plus the
shared Admin medallions, shell and landscape footer. No image generation or
new artwork was needed. Decorative images reserve dimensions and have empty
alternative text.

## Verification

39 unique targeted E2E checks passed across Chromium desktop/tablet/mobile:

- User Profile: all sections open, centered heading geometry, shared title art,
  assets decoded, keyboard jump focus, real reputation/XP, actual navigation,
  sanitized export, lifecycle cancellation/reason validation/confirmation and
  reload persistence without board-draft changes, reset validation/test handoff,
  exact delete confirmation, related activity, empty/legacy accounts, long text
  and 320px overflow containment.
- Existing Users list: five cases per viewport, including updated shortcut
  focus behavior and real Profile destinations.
- Shared Board Info: responsive flow and edit → Save → reload → test Publish
  with member data and credential preservation, across three viewports.
- Existing Admin drill-in journey: list → player profile → Admin return → user
  lifecycle → Board Admins → Audit/Support, across three viewports.

One new test initially expected the account name in the Admin Detail page title;
it now checks the actual profile name and Admin Detail title separately. The
older drill-in test used ambiguous Members/Change Log text selectors after the
earlier Board Info redesign; it now targets the respective section headings.
Both affected cases were rerun successfully. No assertions or checks bypassed.

`node --check admin/app.js` and `git diff --check` passed. Test outputs are under
`qa/test-results`, `qa/recheck-results`, and `qa/drill-in-results`. These isolated
fixtures do not establish live Google/Firebase authorization or backend writes.
Whole-site, native and production suites were outside this route-level request.

## Visual evidence

Route: `http://127.0.0.1:4569/admin/?test=1&tab=users` → Detail 2150.
State: `openUsersFixture`, synthetic TEST Simulator QA, no production data.
Chromium, DPR 1, 100% zoom, en-US, Asia/Bangkok. Viewports: 1440×900,
834×1112 and 390×900. `capture.mjs` waits for fonts and image/background assets.

Before and final full-page/viewport captures live in `qa/`. Final desktop,
tablet, mobile, heading comparison and the shared Board Info capture were
personally inspected for hierarchy, artwork, paper edges and overflow.
`comparison.html` shows device-specific reference crops next to the actual page;
aspect ratios are preserved and reference CSS scale is inferred from labels.
Real data and supported behavior differ intentionally. This is local visual
verification, not a pixel-parity or user-approval claim.
