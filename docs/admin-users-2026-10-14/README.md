# Admin Users

2026-10-14, local implementation on top of `2924f02`, preserving the preceding
Boards and Relationship Map changes. No commit, push, deployment or production
data writes were performed for this request.

## Design brief and coverage

Reference: user-supplied Desktop / Tablet / Mobile composite, saved as
`reference.png`. Dashboard's green shared header, navigation rail/drawer,
parchment tokens, sliced paper frame and landscape footer remain canonical.
No separate Users artwork or neutral palette is introduced.

- Desktop ≥1200px: eight-column table for User ID, display name, character,
  boards, profile reputation, admin role, status and primary actions.
- Tablet 768–1199px: compact rows group identity, character, reputation, board
  count and actions. Mobile <768px: reading cards with Profile / Detail buttons
  and a separate 44px More actions target.
- Search plus four Detail shortcuts preserve the reference's hierarchy;
  shortcuts wrap into two columns on phones. Matching rows are never truncated
  to reproduce the poster's sample height.
- Actual account/legacy participant records, statuses, counts, reputation and
  ownership remain the source of truth. Color remains confined to semantic
  identity/status badges; neutral surfaces reuse Dashboard's paper.

### Material adaptations

The reference's New User button is omitted because Admin has no supported
account-creation flow. Existing signup remains the account owner. No fabricated
creation action, sample account or new authentication/backend behavior is added.

Compact More actions uses the existing accessible portal dialog (bottom sheet
on phones) instead of introducing a separate menu implementation. Boards, Admin
roles and Account lifecycle open the selected user's existing sections; Export
data opens the existing selected-user export. Privileged operations retain
their existing confirmation and backend boundaries.

## Ownership and nearby fixes

- `admin/app.js`: responsive Users renderer, selected-user navigation/menu and
  shared Profile action for Users list/detail. Search now includes character
  names/IDs and username, matching the control's promise. The search input stays
  mounted during filtering. Opening Detail resets a stale previous section.
- Missing Character IDs disable Profile in both list and detail, preventing a
  legacy guest record from opening an unrelated character. Valid links retain
  the actual Character ID and Admin return URL.
- `admin/design.css`: Users-only responsive composition and controls. Shared
  header, rail, footer, parchment palette and artwork owners are unchanged.
- `ADMIN_PORTAL_IMPLEMENTATION.md`: responsive/data/interaction contract.

## Verification and evidence

Route: `http://127.0.0.1:4569/admin/?test=1&tab=users`.
`tests/e2e/helpers/users-fixture.mjs` supplies 13 isolated TEST records, combining
10 cloud-account fixtures with three legacy participants. Nine boards provide
real renderer-derived relationships. Includes Thai character names, one account
without a character, accounts without boards and guests without Character IDs.
Test mode is visibly labeled; no live user data or credentials appear.

Chromium, DPR 1, 100% zoom: 1440×900, 768×1024 and 390×900. `capture.mjs` waits
for fonts/background assets, captures full pages and viewport views, and adds
mobile actions/no-results states. Before captures predate the Users edits.
Final Desktop, Tablet, full Mobile, mobile menu and no-results images were
personally inspected. Initial inspection caught an overlapping mobile status
badge/More button; explicit status padding now works with and without touch.

All 24 targeted E2E checks pass:

- 15 new checks (five cases × three projects): responsive geometry, real data,
  search/focus/IME-compatible input retention, query persistence, Profile and
  Detail destinations, missing Character IDs, keyboard/modal focus behavior,
  selected-user section actions and JSON export, lifecycle statuses, long Thai
  text and empty/no-results states. Drafts remain unchanged by inspection.
- Nine existing checks: search input/focus retention, canonical identity/admin
  contracts and drill-in navigation including Profile → Back to Admin.
- Boundary probes at 1200, 1024, 767 and 320px found no horizontal document
  overflow or clipped visible buttons. Syntax checks cover 51 browser scripts
  and 44 modules. `git diff --check` passes.

Full website/native/backend/production suites are intentionally skipped for this
page-level redesign. Local fixture checks do not claim production auth or
backend verification; release verification remains separate.

`comparison.html` and `qa/comparison-*.png` pair cropped reference app regions
with local renders at equal display widths, preserving aspect ratios. Reference
CSS widths are inferred from poster labels. Sample data and visible heights
differ, so these are design comparisons, not pixel-parity claims. Full mobile
content is linked separately; no rows are hidden for presentation.
