# Board Info — scroll layout

2026-10-14 · Local implementation on `2924f02`, preserving the earlier
uncommitted Admin changes. No commit, push, deployment or production writes.

## Design contract

Authority: the user-supplied Board Info reference (`reference.png`), with the
explicit override to remove Tabs and the Layout toggle entirely. Tavern icons
and decorative elements are required. The existing Dashboard header, rail,
parchment palette and landscape footer remain canonical across Admin screens.

Preserve draft editing, real members and financial metrics, export, versions,
and confirmed lifecycle actions. Translate the title scroll, Tavern artwork
strip, illustrated section icons, paper frames, centered statistics, section
ordering and mobile disclosures. Adapt dimensions for readable Thai/English
and touch controls. Do not invent ownership, data or unsupported metrics.

- Desktop ≥1200px: Board Info + Stats in two columns; full-width Owner/Admin,
  Members, Change Log, Versions and Archive/Delete below.
- Tablet: stacked sections; Info and Members open; secondary sections collapse.
- Mobile <768px: Info/Stats visible; Owner/Admin, Members, Change Log and Versions
  use keyboard-operable disclosures. Member tables become contained cards.
- Disclosure choices survive rerenders and resizing. The Boards list's Members
  action opens the section, scrolls to it, and moves focus appropriately.
- Shared shell, parchment tokens, header controls and footer are unchanged.
- Split displays three supported metrics. The reference's `Unsettled` draft
  proxy is intentionally absent. No fake fourth card is added.

## Behavior repairs

Removed both legacy board-view state variables and the alternate tabbed render.
Owner edits retain focus/caret while updating the title, IDs, Party Ledger URL
and Change Log. Log filtering now uses the original board identity so identical
board names cannot mix changes. Revision labels keep their global number;
missing/invalid dates render `—`, including safe Firestore timestamp handling.
Missing Admin IDs still open their actual group through the board identity.
Pending deletion has a Restore path; a discarded, never-published board instead
returns to Boards and does not offer an impossible server Restore.

No change to authorization, data ownership, financial calculations or existing
Save/Restore/Publish/export pipelines. Board changes remain drafts until Publish.

## Assets

Generated with built-in `imagegen` on 2026-10-14:

- `assets/admin-board-info/title-scroll.webp`: blank rolled parchment banner,
  original generated source `exec-de1134ae-0c04-40ab-a833-e34fd47409a6.png`.
- Eight transparent illustrated icons: shield, swords, scroll, coin purse,
  party, key, star and chest. Source sprite
  `exec-49f54611-d71e-4d89-ad56-bb7b40ce9c0a.png`; extracted and optimized as
  128px WebP assets. Decorative images have empty alt text and reserved sizes.

Original generated files remain in the Codex generated-images directory for
thread `01a12b87-cf17-7193-a1a2-63c61768c511`. No original files were overwritten.
Reused `assets/auth-guild/tavern.webp` for the desktop artwork strip and
`assets/auth-guild/parchment.webp` for sliced paper borders/quote. All nine new
assets are included in the required deployed-local-asset check.

## Verification

42 unique targeted E2E checks passed across Chromium desktop, tablet and mobile:

- New Board Info suite: responsive scroll structure, absence of Tabs/toggle,
  keyboard disclosures, resize persistence, 320px long-title containment,
  edit → Save → reload → reopen → confirmed test-mode Publish, data/secrets
  preservation, board-specific logs, revert, delete cancellation, pending
  deletion/restore, newly-created discard, sanitized per-board export, actual
  Admin-group destination and version/date rendering.
- Existing Boards suite: five cases across three projects, including Members
  navigation and draft editing across responsive layouts.
- Existing Admin audit/shell regressions: archive/reopen, invalid draft and
  storage failure handling, real member workflow, and Dashboard destinations.

Tests now reveal compact sections before interacting with them, instead of
using the removed tabs. A new mobile discard case initially targeted a shortcut
that mobile correctly limits to the first two boards; its locator was corrected
to use the actual new board row, then the case was rerun successfully.

Syntax: 51 browser scripts and 50 module files checked. Asset validation:
109 deployed local assets and 47 optional CDN entries. `git diff --check` passes.
These fixture-backed checks do not establish production auth/backend behavior.
Whole-site/native/production suites are intentionally outside this request.

## Visual evidence

`capture.mjs` uses the isolated `board-info-fixture.mjs`: two TEST boards with
the same name and one actual fixture member. Route:
`http://127.0.0.1:4569/admin/?test=1&tab=boards` → Detail 1397.
Chromium, DPR 1, 100% zoom, en-US, Asia/Bangkok; viewports 1440×900,
768×1024 and 390×900. Captures wait for fonts and artwork decoding.

Before captures show the old Scroll mode (explicitly selected before removal).
Final Desktop, Tablet, Mobile and expanded-mobile full-page images were
personally inspected, including title placement, icon geometry, paper edges,
members, lower-page actions and footer. Desktop/mobile reference comparisons
were also inspected. The prior half-width Owner/Admin form and clipped phone
members table are resolved. The title stays inside the paper.

`comparison.html` and `qa/comparison-*.png` retain image aspect ratios and
separate device crops. Reference CSS scale is inferred from its labels.
The reference's old controls are visible only in the reference images; real
data, shared shell, dates and the supported metric count differ intentionally.
No pixel-parity or user-approval claim is made.

Scoped verdict: verified locally for Board Info and the touched entry points.
