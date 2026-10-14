# Admin Dashboard and shared frame

Date: 2026-10-14. Initial scope: local implementation, no production writes or deployment.
The subsequent authorized release is tracked in [the chat release record](../release-chat-2026-10-14.md).

## Brief and decisions

The supplied reference is `reference.png`. Implement its dark green tavern frame,
cream parchment, illustrated KPI medallions, grouped activity/attention/actions
and responsive composition. Apply header, sidebar, gutters, main surface and
footer across all nine Admin screens and their detail views.

Preserve actual metrics, original A Cards/B Command mode, default Boards entry,
Google allowlist, local drafts, explicit Publish and existing privileged actions.
Translate desktop rail to a modal navigation drawer below 1024px and compact
header actions below 1200px. Preserve distinct feature/table/detail layouts.
The unsupported reference Invite user action becomes View users. No invented
version number, timestamps, accounts or production metrics were added.

The follow-up parchment defect came from stretching an artwork with transparent
margins across the whole main surface. Sliced border rendering keeps decoration
at the actual perimeter. The mobile border is thinner so headings and cards have
clear space inside it. A detail-page action row was also constrained to its
container: its old intrinsic width enlarged the mobile layout viewport and
displaced modal hit targets. Touch controls remain at least 44px tall.

## Ownership

- `admin/shell.js`: shared header/navigation/footer and compact-menu lifecycle.
- `admin/design.css`: visual tokens and responsive frame; obsolete competing
  header/sidebar rules were removed from `admin/admin.css`.
- `admin/app.js`: real data and existing action handlers; new Dashboard renderer
  and one frame in `renderMain()`.
- `assets/admin-reference/`: new decorative artwork. See `ARTWORK.md` for prompts.
- `ADMIN_PORTAL_IMPLEMENTATION.md`: ongoing composition contract and source map.

Brand navigation uses the existing in-page navigation handler so clicking the
header does not discard unsaved in-memory drafts. Failed collection reads keep
the frame and expose Retry while Save/Restore/Publish remain disabled.

## Verification and evidence

Local URL: `http://127.0.0.1:4569/admin/?test=1&tab=dashboard`.
The isolated session fixture contains 12 boards, 13 participant-derived users,
five local draft edits and three metadata warnings. These are TEST records, not
production statistics. Native Chromium, 100% zoom, DPR 1, no emulated zoom;
screenshots at 1440×900, 768×1024 and 390×900, with touch/mobile context on compact
sizes. Fonts and decorative media are awaited before capture.

`capture.mjs` reproduces full Dashboard renders, a desktop first-viewport image,
representative Boards/Users/Relationship Map frames and compact navigation/actions.
`comparison.html` pairs the reference crops with full current app captures.
Before captures predate this redesign. `qa/modal-debug.png` is diagnostic only.

Checks completed:

- All nine destinations: same header height/main geometry, one shared footer,
  active navigation, no document overflow, unchanged drafts during navigation.
- Compact navigation: focus containment, inert background, Escape/backdrop,
  focus return, short viewport access, resize cleanup and sign-out cleanup.
- Dashboard: actual totals, both modes, empty state, metadata detail links,
  debt filter and all supported quick actions.
- Existing Admin E2E: save/restore/publish, revisions, export redaction, invalid
  draft/storage failure, failed collection retry, first-load gate, lifecycle and
  user/admin/tombstone separation. All test writes stayed in local fixtures.
- Initial selected run: 49 passed, seven failures diagnosed, one desktop-only
  exclusion. Repair run: 20 passed, one inapplicable desktop responsive test skipped.
  Failures were obsolete test title/radius expectations, touch target height and
  the mobile detail action overflow described above. No timeout was increased.
- Syntax, deployed local-asset checks and `git diff --check` pass.
- Final header-brand navigation regression: three viewport projects passed;
  clicking the brand returns to Dashboard without losing an unsaved draft.

No production Firebase/Auth/backend mutation test, full repository unit/E2E suite,
native app verification, commit, push or deploy was performed for this visual
scope. Pre-existing loading/other page changes were preserved.
