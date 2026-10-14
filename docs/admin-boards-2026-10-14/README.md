# Admin Boards

2026-10-14, local implementation on top of `2924f02`, preserving the preceding
Relationship Map changes. No commit, push, deployment or production data writes.

## Design brief and coverage

Reference: the user-supplied Desktop/Tablet/Mobile composite, saved as
`reference.png`. Latest shared-surface direction takes precedence: use
Dashboard's green Admin header, navigation rail/drawer, parchment tokens, paper
frame and landscape footer. This page reuses those owners and artwork rather
than creating a separate visual theme.

- Preserve actual boards, counts, record IDs, draft edits, validation,
  permissions and Save / Restore / Publish behavior.
- Translate the heading, search + type filters, green create action, shortcut
  chips, compact editable table, type badges and grouped row actions.
- Adapt the list into five columns on tablets and reading cards on phones,
  retaining complete forms through Detail. Keep all result rows rather than
  truncating records to match the illustrative screenshot's height.
- Do not infer new account creation from `+ User`. Use `Members` to open the
  existing board Members section, which links to Party Ledger's real invitation
  and Guest flows. No new backend/auth/data-model behavior.

Desktop ≥1200: eight columns. Tablet 768–1199: URL, type, name, member/entry
counts and actions. Mobile <768: ID + badge, title/admin, counts, and Detail /
Members / Delete actions. Four shortcuts on larger screens, two on phones.
Inputs use existing product fonts; small type badges reuse the SVG icon library.
Neutral cards use Dashboard parchment tokens; only module badges carry color.

## Ownership and flow fixes

- `admin/app.js`: one responsive row per board, labeled inline inputs, search,
  pressed filter state, shortcuts, distinct empty/no-results states and existing
  Detail/Members navigation. Search retains its mounted input for typing/IME.
- `admin/design.css`: scoped Boards composition; no changes to shared artwork,
  header, rail, footer or canonical paper colors.
- Confirmed creation clears the active Boards search so the new draft is
  visible, retaining the selected type. Cancel keeps the query unchanged.
- Inline edits update the phone's reading values and URL shortcut/delete label.
  Pending password resets remain masked and present through filtering and Detail.
- `ADMIN_PORTAL_IMPLEMENTATION.md` records the responsive contract.
- Relevant existing E2E consumers now open Detail for full-form editing; they
  no longer assume hidden desktop inputs are visible on phones.

## Verification and evidence

Route: `http://127.0.0.1:4569/admin/?test=1&tab=boards`.
`tests/e2e/helpers/boards-fixture.mjs` seeds eight isolated TEST records (six
Split, one Treasury, one Debt) with real renderer-derived counts. No live Admin
records or credentials appear in this evidence. Test mode is visibly labeled.

Chromium, DPR 1, 100% zoom: 1440×900, 768×1024 and 390×900. `capture.mjs`
waits for fonts/background assets and captures full pages plus viewport views.
Before captures were taken before changing the renderer/styles. After captures
include the mobile no-results state. Desktop, Tablet and full Mobile are
personally visually inspected, including all rows and the footer.

Targeted E2E: 15 new checks (five cases across three projects) cover responsive
columns/cards, unclipped filters/actions, real counts, search/focus, query/type
combinations, long Thai content, Detail/Members, draft-only edits, masked password
retention, create/delete confirmation and empty state. Another 18 existing
checks cover search focus, cancel/focus trap, invalid drafts, failed Save + retry,
Restore from corrupt local data, Save/Publish/URL rename/revisions and relationship
drill-in navigation. All pass. Syntax and `git diff --check` pass.

The existing full website/native/backend/production suites are intentionally
skipped for this page-level redesign; release verification remains separate.

`comparison.html` and `qa/comparison-*.png` pair cropped reference app regions
with local renders at equal display widths, preserving aspect ratios. The
reference's CSS widths are inferred from poster labels, not captured browser
viewports. Reference and TEST data differ. These are design comparisons, not
pixel-parity claims. Mobile reference includes a taller visible app area; the
full implemented list is separately linked, with no rows hidden for presentation.
