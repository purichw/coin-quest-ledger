# Relationship Map: illustrated account relationships

## Scope

Make the map understandable without technical knowledge. Preserve the Admin
Dashboard parchment, shared shell and existing data/detail navigation contracts.
The current UI replaces the previous four-column User → Character → Admin →
Board chain; that chain incorrectly suggested a single sequence of relationships.

The selected user now branches into:

- Character(s), each followed by its joined boards.
- Administrator identities, each followed by the boards managed by that identity.

Every child board comes from its actual parent's current records. A board can
appear on both paths when the selected person is both member and administrator.
The board summary below counts it once and names both roles. The view never
grants permissions, edits a draft, changes account links or publishes records.

Names are prominent; IDs remain secondary, clickable references. Existing Tavern
portrait medallions, painted swords, shields, scrolls and parchment frames make
the flow read as an illustrated map. Thai connector labels explain “uses”,
“joins” and “manages”. The original generic arrows, legend and English rules
were replaced with named branches, plain Thai definitions and FAQ disclosures.

The user selector preserves its choice when returning from a detail view. A
record derived only from board members is explicitly distinguished from a known
linked account; Guest records do not acquire invented Character IDs. Empty
relationships remain empty. Admin ID does not imply Super Admin access.

## Verification

VERIFIED for this local presentation and navigation scope:

- 24 targeted Playwright checks passed across desktop, tablet and mobile.
- Multiple Admin IDs have separate, correct board children; board summary is
  deduplicated. Membership-only and administration-only examples remain distinct.
- Empty data, Guest/unlinked records, long names, user selection, return from
  detail navigation and keyboard FAQ operation were exercised.
- Existing detail links and shared Admin shell checks passed without draft edits.
- `node --check admin/app.js` and `git diff --check` passed.
- Browser captures at 1440 × 1000, 768 × 1024 and 390 × 844 were inspected.
  No document overflow; painted assets loaded; mobile retains nested connectors.

This is a local change, not a production release. Full-site, backend and native
test suites were not run because auth, storage, permissions and gameplay were
unchanged. No production records were modified.

## Evidence provenance

- Base commit: `0e933cc0cdfd91de6cceed445322fa34f85d8e86` plus this working diff.
- Route: `http://127.0.0.1:4569/admin/?test=1&tab=map`.
- Auth/data: isolated local test gate and synthetic TEST boards; not production.
- Browser: Chrome, local app source, light Admin theme, no overlays, page top.
- `qa/before-1440.jpg`: original one-board fixture, captured before changes.
- `qa/after-1440.jpg`, `qa/after-768.jpg`, `qa/after-390.jpg`: same one-board
  fixture after the final runtime changes; full-page screenshots.
- `qa/multiple-1440.jpg`: explicit three-board/two-Admin-ID illustration fixture.
- `qa/fixture.html`: local-only fixture bootstrap. Open with `?multiple=1` in a
  fresh browser session to reproduce the multiple-branch example.

Source hashes are recorded in `qa/source-hashes.json`.
