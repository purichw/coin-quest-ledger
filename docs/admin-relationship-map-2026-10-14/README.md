# Admin Relationship Map

Date: 2026-10-14. Local implementation on top of `2924f02`.
No production writes, commit, push or deployment in this pass.

## Design brief and coverage

Reference: `reference.png`, the user-supplied Desktop/Tablet/Mobile composite.
Latest user direction: every Admin tab uses Dashboard's parchment color,
including pages whose internal designs have not yet been updated.

Preserve the shared green header, rail/drawer, paper frame and landscape footer;
actual data ownership, auth, draft state and detail navigation remain unchanged.
Translate the reference into four labeled entity groups, distinct icons and soft
entity accents, gold connectors, a four-color legend and a model-rules panel.
At 1440/768px show four columns. Below 768px stack the groups and collapse only
the secondary legend/rules behind an accessible disclosure.

Adaptations: use existing shared artwork and icon library; no new page-specific
paper background. Multiple entities remain present rather than truncating to the
single illustrative record. Keep the current account-profile identity rules,
not the reference's obsolete suggestion of board-local character overrides.
Keep real User/Admin/Board detail links and noninteractive Character IDs.
"Managed by" describes a board's admin more accurately than the old "owns" label.
No new selector, account permission or backend behavior is inferred.

## Ownership

- `admin/app.js`: map rendering over existing user/character/admin/board records.
- `admin/design.css`: map geometry, entity accents and canonical Admin paper tokens.
- `admin/admin.css`: obsolete three-column map/breakpoint styles removed; flat
  panels inherit the shared card color instead of defining a separate paper tone.
- `ADMIN_PORTAL_IMPLEMENTATION.md`: shared parchment and map contracts.

## Verification

Local route: `http://127.0.0.1:4569/admin/?test=1&tab=map`.
`tests/e2e/helpers/relationship-fixture.mjs` seeds one isolated TEST board (3512),
one participant-derived user/character (2150), one Admin ID (2150), and 120 XP.
The test gate is intentionally visible; these are not live Admin records.
Chromium, DPR 1, 100% zoom; Desktop 1440×900, Tablet 768×1024, Mobile 390×900.
Fonts/background artwork are awaited. `capture.mjs before|after` reproduces
full-page captures; after also captures expanded mobile help and shared consumer
pages. Before captures were made before changing the renderer/styles.

Targeted checks: four-group geometry, real detail links, unchanged drafts,
keyboard disclosure/resize, multiple admin roles and boards, long Thai names,
empty relationships, no document overflow; shared shell/color checks across all
nine Admin destinations on three sizes. All 24 targeted map/shell E2E checks pass.
The existing Admin relationship/drill-in regression passes on all three projects
(3 additional checks). The old tablet smoke expectation is updated from one
column to four, covered by the new map geometry test at the exact 768px boundary.
Syntax and `git diff --check` pass. Full website, native, production and release
suites are intentionally outside this page/shared-palette request.

## Visual evidence

`qa/after-1440.png`, `qa/after-768.png` and `qa/after-390.png` show the full page.
`qa/after-mobile-expanded.png` covers all secondary content. Shared Dashboard,
Boards and Users captures verify the unchanged paper context. All listed views
are personally inspected after implementation, rather than judged only by DOM
or computed colors. Tests separately cover navigation and edge data.

`comparison.html` pairs cropped reference panels with actual local renders,
preserving aspect ratios. Reference source regions exclude the poster/device
framing; CSS widths are inferred from the labels, not measured source browser
viewports. Reference data and TEST data differ, so these are design comparisons,
not pixel-parity claims. Shared Dashboard shell/art intentionally takes precedence
over any differing shell illustration in the Relationship Map poster.
