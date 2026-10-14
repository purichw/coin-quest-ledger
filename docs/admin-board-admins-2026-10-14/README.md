# Board Admins

2026-10-14 · local implementation on `2924f02`, preserving previous uncommitted
Admin work. No commit, push, deploy or production data writes in this request.

## Design and product contract

Reference: the user-supplied Board Admins composite, retained as `reference.png`.
The existing Dashboard header, rail/drawer, paper palette, sliced border and
landscape footer remain canonical. No new artwork or competing theme is needed.

Preserve real groups, editable IDs/nicknames, owner links, board drill-ins and
draft operations. Translate the full-width search, Detail shortcuts, quiet
table, identity chips, compact grouped rows and mobile cards. Adapt dimensions
and wrapping to real data and touch targets. Do not infer new account creation,
ownership changes, deletion or recovery operations from the reference.

- Desktop ≥1200px: six columns; editable ID/nickname; centered headers/actions.
- Tablet 768–1199px: four columns combining ID/name and User/Owner Hash.
- Mobile <768px: cards with a trailing Detail action, owner metadata and boards.
  The first two shortcuts can expand to four. Extra boards have a keyboard-
  operable disclosure. Every matching record remains reachable.
- Compact views edit in Admin Detail. Its owned boards also reflow on phones.
- Search includes linked owner username, in addition to ID/name/hash fields,
  and retains focus while typing. Empty/no-results states are distinct.
- Missing actual Owner Hash displays `—`. The fallback grouping key is not
  misrepresented as a recorded hash. Orphaned identities have no fabricated
  User link. Existing groups with equal Admin IDs but different hashes remain
  independent.

An existing edit bug was fixed: groups without Owner Hash use Admin ID as their
key, so editing that ID invalidated subsequent input handlers. Handlers now
capture the group's original active board IDs. Detail and list shortcuts follow
the updated identity; a self-link on Detail is now a passive ID chip. No backend
or grouping-model change is involved.

Owners: `admin/app.js` for rendering/search/group editing; `admin/design.css`
for scoped responsive rules; `ADMIN_PORTAL_IMPLEMENTATION.md` for the contract.
Existing Save/Restore/Publish pipelines, auth and permissions remain unchanged.

## Verification and evidence

Route: `http://127.0.0.1:4569/admin/?test=1&tab=admins`. Fixture:
`tests/e2e/helpers/board-admins-fixture.mjs`, eight synthetic TEST identities
across 12 boards, with linked and orphaned owners. No live credentials/data.
The test-mode security notice is intentionally visible.

24 E2E checks passed: six new cases × three projects, plus two existing Admin
drill-in/identity-separation regressions × three projects. Coverage includes
real groups, orphaned/missing metadata, responsive containment, all Detail hit
targets, search and focus, shortcut/board disclosures, User/Board destinations,
empty state, long labels, distinct groups with the same Admin ID, and sequential
ID typing → Save → reload → reopen → confirmed test-mode Publish. Stored money,
members, unknown fields and password hashes remain intact; other groups are
unchanged. This does not establish production authorization/security behavior.

Syntax check: 51 browser scripts and 48 module files. Additional responsive
checks at 1200, 1024, 767 and 320px found no document or row overflow. The user's
reported phone overflow came from generic `table.tbl { min-width:560px }` plus
table selector specificity. The scoped table now resets that width and applies
the compact cell layout at the correct specificity. No global clipping mask was
added. The first E2E pass also exposed a test locator following an aria-label
that correctly changes on expansion; the assertion now follows the expanded
label. Final 24 checks pass. `git diff --check` passes.

`capture.mjs` records before/after at 1440×900, 768×1024 and 390×900, Chromium,
DPR 1, 100% zoom, en-US locale, Asia/Bangkok timezone, waiting for fonts/assets.
Before captures precede the edits. Final Desktop and Tablet full-page renders,
Mobile viewport/full-page, Admin Detail and no-results captures were personally
inspected. The full phone capture includes all eight identities and the footer.
The final reference comparisons were also inspected. `comparison.html` and
`qa/comparison-*.png` preserve aspect ratios and exclude poster framing; CSS
scale is inferred from the reference labels. Sample content/visible height
differ. No pixel-parity or user-approval claim is made.

Scoped verdict: VERIFIED for this local responsive page and its touched flows.
Full-site/native/backend/production suites are intentionally skipped.
