# Board settings — 14 October 2026

Scope: Party Ledger website settings dialog at 1440, 768 and 390 CSS pixels.
Local implementation; no production deployment or native app changes.

## Design translation

Reference: the user-supplied Board Settings Desktop / Tablet / Mobile mockup.
Preserve the cream parchment shell, teal selected navigation, green controls,
five board accent swatches, grouped game switches, admin/member controls and
owned-board cards. Actual character portraits and board data come from the
existing application. Fonts remain the site's Mitr / IBM Plex Sans Thai /
Chakra Petch family.

Desktop has left section navigation. Tablet and phone place the same navigation
above the scrollable content, with each icon-and-label group centered vertically
even when labels wrap. Navigation scrolls to real sections rather than discarding
form contents. Compact member rows reveal Profile / Save / New ID / Remove
actions. A guest has no registered Character ID, so identity actions are omitted
for that row while removal remains available through existing permission logic.

Adaptations: modal size and scroll accommodate real board counts, longer names
and reachable touch controls. The reference's data-tools navigation opens the
existing expense export/import section. No new backup format, data model or
destination was inferred. Theme/accent/game settings use the existing save path;
admin unlock, creation, ID mutation and removal retain existing handlers.

## Owners and behavior

- `trip/settings.js`: markup, disclosures, section navigation, modal focus /
  background inert state, draft and scroll preservation, share/copy feedback.
- `trip/settings.css`: scoped material, layout, responsive and dark variants.
- `trip/app.js`: existing data, permission and persistence functions; settings
  branch delegates presentation and tears down modal state on transitions.
- `trip/index.html`: loads the component and removes superseded settings CSS.

Input drafts survive theme, accent, game-setting and owned-board refreshes. A
newly committed or regenerated Character ID supersedes its previous draft.
Character ID input accepts at most four digits; saving still validates exactly
four. Admin URL uses an HTML pattern compatible with modern browser validation.
Copy failure leaves a selectable URL and visible explanation. Escape/backdrop
close, Tab containment, focus restoration and reduced motion are supported.

## Verification

`tests/e2e/board-settings.spec.mjs` covers three responsive sizes; geometry and
vertical navigation alignment; section reachability; compact member actions;
ID draft retention; persistent theme/accent/stats; modal keyboard behavior;
locked/incorrect-password/unlocked states; invalid/saved/regenerated IDs; copy
success/failure; owned-board links; import and create-board transitions; long
Thai board names and English dark mode.

Targeted legacy regressions also cover admin URL creation/collision handling,
creator-admin locks, new-board creation and quick settings. Tests use local
`?test=1` fixtures, not production Firebase. The screenshots show test data and
are design evidence, not proof of live Firebase behavior.

Current images: `qa/settings-1440.png`, `qa/settings-768.png`,
`qa/settings-390.png`; member disclosures and dark/locked states are adjacent.
`qa/settings-tabs-mobile.png` isolates the user's vertical-centering correction.

Broader game, backend, native and release suites are intentionally outside this
component pass. Earlier pending authentication and account-drawer changes remain
separate and were preserved.

## Follow-up: center matching control groups across the player site

The user expanded alignment to similar controls elsewhere. One scoped rule in
`shared/player-controls.css` centers compact segments, split methods, debt form
choices, gender/hero filters, login tabs, mobile-menu preferences, Treasury and
Debt filters, Price Arena filters and board-theme buttons. Existing shared
navigation, profile tabs, account segments and entry tabs already centered their
content groups; their layouts remain intact. Text alignment is centered for
compact navigation labels without changing left-aligned data/disclosure rows.

Rendered checks in `qa/alignment-check.json` cover split methods, entry tabs,
Debt filters, Treasury filters, Price Arena filters, profile navigation and auth
tabs at 390 / 768 / 1440px. Profile section navigation is intentionally hidden on
desktop. The controls center on both axes and do not overflow; representative
tab/filter clicks and Login / Sign Up switching were exercised. Auth uses the
existing mocked Firebase transport because `?test=1` bypasses the login gate.
Adjacent `alignment-*-390.png` files show the affected groups in context.

Board settings: 7 dedicated cases, 2 legacy admin/create-board regressions and
2 touch-mode cases passed. After the shared alignment change, the phone
composition and preference/draft regression passed again. Syntax checks and
`git diff --check` passed. Reference comparison: `comparison.html` and
`qa/comparison-desktop.png` (dialog detail scaled to equal widths).
