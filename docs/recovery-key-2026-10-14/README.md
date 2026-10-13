# Recovery Key save view — 2026-10-14

Scope: the player website's Recovery Key reveal/save dialog after signup and
character creation, and after a successful password reset. This is local work;
no deployment or production account was created for this task.

## Design and product contract

- Implements the supplied parchment modal, chest tile, centered heading, amber
  precautions, dashed gold key/copy row, green copy confirmation and two actions.
  Desktop and tablet use a centered dialog; phone uses nearly the full width and
  places the green Save action above Back. The backdrop dims and blurs the game.
- Reuses the guild parchment asset and the existing chest, typography and shared
  SVG icon family. The paper's burned edge/pins follow the current auth material;
  the reference uses a subtler edge. Controls retain at least 44px touch height.
  Dialog widths are adapted to readable product sizes (600/520/440px maximum),
  rather than scaling the annotated presentation's text to its viewport labels.
- The actual issued key is used. `DEMO-TEST-ONLY` and the reset fixture's demo
  keys exist only in test transport/captures; nothing is seeded into production.
- The mockup says the key is shown only once. The current product allows explicit
  reveal from the account drawer, so that bullet reads “Save this code before
  closing this window.” Storage, hashing and backend rotation are unchanged.
- Copy confirmation appears only after clipboard success. A denied/unavailable
  clipboard produces a retry/manual-copy message and selects the unchanged key.
  Dismissing during a pending copy cannot update a later overlay.
- Back, X, Escape, backdrop and Save retain dismissal behavior. Background content
  is inert and scrolling is locked while open; focus is trapped and restored.
  Welcome Tour continues to wait until this dialog closes. When a recovered
  account has no character, creation is mounted first beneath the modal and
  receives focus in the name field after dismissal.
- The account drawer's existing reveal/copy/regenerate treatment is preserved.
  This task does not redesign the recovery reset form or backend authorization.

## Source ownership

- `shared/profile-hub.js`: TH/EN copy, shared reveal markup and interaction,
  cleanup, reset/character ordering.
- `shared/profile-hub.css`: one responsive `.recovery-*` owner, isolated from
  the reminder popover; old `.recovery-body` styles removed.
- `shared/quest-icons.js`: check, check-circle and warning glyphs.
- `tests/e2e/account-persistence.spec.mjs`: focused recovery UI/transport tests.

## Verification and evidence

Real local Chromium UI with intercepted Firebase/API transport and synthetic
credentials; this verifies frontend integration, not production key invalidation.

- Desktop 1440×900, tablet 768×1024 and phone 390×844: loaded assets/fonts,
  layout, centered groups, key selection, real clipboard success, focus loop and
  Save/Back/X dismissal.
- Clipboard denial → visible error and selected key → successful retry; Escape.
- English/Dungeon rendering and 320×480 reflow with reachable actions.
- Password reset reveals the rotated fixture key on Debt, both with an existing
  character and with character creation still required.
- Existing signup → Recovery Key → deferred Welcome Tour → reload/sign-in
  identity regression remains passing.
- Syntax check and `git diff --check` pass. Whole-site/backend suites, real
  Firebase changes, native app testing and production deployment are out of scope.

[Reference versus implementation](comparison.html) aligns modal crops at equal
display width, preserves aspect ratios and keeps the annotation markers in the
reference. Crop coordinates are measured from the supplied 1536×1024 composite;
they are not claims about its CSS dimensions.

Full contextual captures:
[Desktop](qa/recovery-1440-copied.png), [Tablet](qa/recovery-768-copied.png),
[Mobile](qa/recovery-390-copied.png), [copy failure](qa/recovery-390-copy-error.png),
[English Dungeon](qa/recovery-390-en-dungeon.png).

`qa/before-1440.png` is an initial legacy-popover diagnostic captured during its
entry animation, not a settled before/after comparison or fidelity baseline.

Reproduce the focused frontend tests:

```sh
POINTY_REAL_FIREBASE_E2E=0 npx playwright test tests/e2e/account-persistence.spec.mjs \
  --project=chromium --grep 'Recovery save modal|Recovery reset reveals|Tavern auth signup'
```
