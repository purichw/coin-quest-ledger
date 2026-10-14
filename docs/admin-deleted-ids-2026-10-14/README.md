# Admin Deleted IDs

2026-10-14 · local implementation on top of `2924f02`, preserving existing
uncommitted Boards, Relationship Map and Users work. No commit, push, deployment
or production data writes are part of this request.

## Design brief and coverage

Reference: user-supplied Desktop / Tablet / Mobile composite, saved as
`reference.png`. Dashboard's existing green header, navigation rail/drawer,
canonical parchment, paper frame, typography and landscape footer remain the
shared visual source. The reference's slightly different neutral surfaces do
not introduce a separate Admin theme.

Preserve historical identity fields, actual loaded records and tombstone/active
account separation. Translate the heading/count, document-icon information
banner, full-width search, compact table, colored ID/status badges and Detail
actions. Adapt layout and wrapping to real content and readable touch controls.
Do not infer restoration, manual ID reuse, deletion or new backend operations.

- Desktop ≥1200px: eight columns with quiet separators, centered table headers
  and leading-aligned identity/metadata. Compact Detail buttons open full values.
- Tablet 768–1199px: identity/status header plus labeled metadata and a trailing
  Detail action. Mobile <768px: reading cards and full-width Detail actions.
- Compact disclosures begin expanded and retain per-record state during search
  and responsive changes. Desktop always exposes all metadata.
- All matching loaded records stay available. Empty data and no matching search
  results are separate states. Total and filtered counts remain truthful.

## Product adaptation and ownership

Detail opens the existing accessible portal modal/bottom sheet for read-only
inspection, including the actual recorded reason and complete previous UID.
The reference does not supply a detail-screen design, so this reuses the
established dialog and paper treatment. Long previous UIDs truncate in the list
and wrap completely in Detail; no identifiers are discarded.

Historical User/Character IDs are static chips. They do not navigate into an
active profile that could now own a reused ID. Missing dates/UIDs/characters are
shown as missing; an absent deletion reason is "Not recorded".

- `admin/app.js`: tombstone list, per-record disclosure, read-only detail and
  empty/no-results states. Existing `tombstoneRecords()` merging/exclusion and
  Firestore read behavior are unchanged.
- The existing Users clear-search helper is renamed `clearAdminSearch()` and
  reused by both lists. Search retains the focused input during filtering.
- `admin/design.css`: scoped Deleted IDs composition using existing semantic
  tokens and primitives. Shared header, sidebar, footer and artwork unchanged.
- `ADMIN_PORTAL_IMPLEMENTATION.md`: responsive and read-only inspection contract.

This is a view/list/search change. Auth, allowlist, Firestore rules, ID reuse,
permanent-delete backend, query limits and persisted account data are unchanged.
The current cloud query limit remains in place; counts describe loaded records.

## Verification and visual evidence

Route: `http://127.0.0.1:4569/admin/?test=1&tab=tombstones`.
`tests/e2e/helpers/tombstones-fixture.mjs` creates six isolated TEST tombstones
through the existing normalizer, with stable timestamps, synthetic usernames,
synthetic previous UIDs and two Character IDs. No live records or credentials
appear. Test mode is visibly labeled.

`capture.mjs` records Chromium, DPR 1, 100% zoom, locale en-US, timezone
Asia/Bangkok at 1440×900, 768×1024 and 390×900. Captures wait for fonts and image
assets; the collapsed state also waits for the dialog backdrop to finish fading.
Before captures predate the UI edits. Final Desktop/Tablet full pages, Mobile
viewport/full page, Detail, collapsed and no-results states were personally
inspected. The old phone table clipped metadata offscreen; the new cards expose
all fields in the reading order, with complete UID values available in Detail.

21 targeted E2E checks pass:

- 15 new checks (five cases × three projects): historical field rendering,
  passive identity chips, responsive layout, search/counts/focus, empty states,
  full detail values, modal keyboard focus/dismissal/return, disclosure state
  across filtering/resizing, no writes during inspection, long/partial values,
  safe text rendering and active-account exclusion.
- Six existing checks: Users search/clear behavior and separation between active
  Users, orphan Board Admin identities and Deleted IDs. The latter now checks
  Users' current empty state rather than requiring an empty table wrapper.
- Syntax checks pass for 51 browser scripts and 46 module files. Boundary checks
  at 1200, 1024, 767 and 320px found no document overflow or clipped visible
  buttons. `git diff --check` passes.

The first test pass exposed test-selector assumptions: the shared status badge
does not have a `st-deleted` class, and both dialog close controls are named
Close. Assertions now check actual status text and the scoped footer control.
The affected cases were rerun successfully; production behavior was not changed
to satisfy those assumptions.

Scoped verdict: VERIFIED for the local responsive audit list and its read-only
interactions. Full site/native/backend/production suites are intentionally
skipped. Local fixture checks do not establish production auth/security behavior.

`comparison.html` and `qa/comparison-*.png` show cropped reference app regions
beside local captures at equal display widths, preserving aspect ratios. CSS
viewport sizes of the poster are inferred from its labels; source sample data
and visible heights differ. Mobile uses a labeled viewport comparison and links
to the complete six-record page. These are design comparisons, not pixel-parity
claims or evidence of user approval.
