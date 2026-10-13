# Character Creation — 13 October 2026

Implemented the supplied Character Creation mockup for the website at 1440,
768 and 390 CSS pixels. Native and Admin are outside this task. No commit,
push, deployment or production account write was performed.

## Design and ownership

- `reference.png` is the supplied annotated image. Annotations and presentation
  framing are reference material, not controls or copy in the product.
- Desktop uses the existing Tavern scene and hanging banner, a large cream form,
  green heading/action, red toolbox crest, automatic User ID and hero preview.
  Tablet uses a compact brand above the form. Phone uses a full-height paper
  surface with preferences/back at the top and a single vertical form.
- Hero selection is a cream dialog with a fixed heading/filter area and an
  independently scrolling grid: three columns on desktop/tablet, two on phone.
  The real class registry supplies all 18 classes in both genders, including
  real portraits and localized names. The illustrative reference's visible
  subset is not the entire catalog.
- Existing website fonts and assets are retained: Mitr, IBM Plex Sans Thai,
  Chakra Petch, `assets/auth-reference/` and the existing RPG portrait pipeline.
  No new generated raster art or dependency. Toolbox uses the existing shared
  SVG; crossed swords were added to the same icon owner.
- `shared/profile-character-create.js` owns form/picker markup.
  `shared/profile-login.js` now exports `renderFrame` for the shared Tavern
  scene, brand and preferences; Login/Sign Up/recovery retain their content.
  `shared/profile-hub.css` scopes the new layout to `.auth-character` and
  `.creation-picker`. Obsolete creation styles were replaced; generic picker
  styles remain because other modules use them.
- `shared/profile-hub.js` owns the draft, localized copy, selection, modal focus
  and save lifecycle. Firebase persistence, ID ownership and auth storage
  continue through the existing helpers; no schema or Rules changes.

## Preserved interactions and state

- Begin stays disabled until a hero is selected. Name validation trims input,
  rejects blank/invalid values and retains the existing 30-character limit.
- Selection returns to the form without losing the name. Language and theme
  changes retain the current name and hero; drafts remain in the render
  closure, not new persistent storage.
- Filters update the grid without reopening/reanimating the dialog. The form
  behind the picker is inert. Tab/Shift+Tab stay inside; Escape, the close
  button and backdrop dismiss it and return focus to the portrait control.
- While saving, controls are disabled and the button reports progress;
  duplicate submissions are ignored. Failure leaves the name/hero intact,
  announces an actionable error and enables retry. Successful persistence
  closes the gate and continues the existing recovery/tour sequence.
- The back arrow uses existing sign-out behavior to return to account entry;
  it does not navigate into a game with an incomplete character.

## Verification

Scoped verdict: **VERIFIED for the local frontend and fixture-backed flow**.
The account-persistence suite uses the real production-mode frontend while
replacing only Firebase transport. This is not a live Firebase/backend claim.

Eleven relevant Chromium tests passed: three responsive creation/picker views,
draft/preferences/keyboard behavior, slow-save validation and duplicate guard,
failed save/retry/reload identity, delayed existing-account hydration, three
Login/Sign Up composition checks for the shared frame, and signup/recovery/sign-in
with the same character after reload. Three selected cases also passed with the
mobile touch configuration. Final geometry refinements were followed by six
successful targeted Chromium checks and fresh screenshots.

Additional assertions cover 36/18 choices, loaded portrait images, noncollapsed
card heights, grid scrolling to the last hero, selected state, form/picker
overflow, 320 × 480 reflow, reduced-motion preference, back-to-login, blank/max
name, busy controls, failure message and unchanged draft.

The early grid implementation collapsed rows; `grid-auto-rows: max-content`
fixed the actual scrolling owner and geometry assertions now prevent recurrence.
An existing persistence test filled the input behind the active page loader;
it now waits for the player-visible loading gate to finish before interacting.
No production name-truncation change was needed.

`npm run test:syntax` (48 browser scripts / 23 modules) and `git diff --check`
pass. Whole-game regression, backend/Rules tests, Safari, physical-device
keyboard behavior and production smoke were intentionally not run for this
scoped website redesign.

## Visual evidence

`comparison.html` / `qa/comparison.jpg` pair desktop and mobile reference areas
with current local implementation captures. Reference proportions are inferred
from the illustration; captures retain real control sizes and full viewport
heights. This is a faithful adaptation, not a pixel-equality score.

Personally inspected current captures: all three empty forms and picker views,
selected mobile hero, English dark state, save failure, and the final comparison.
Desktop form scale and mobile top spacing were refined after comparison.

`before-1440-*` are genuine pre-edit captures from this turn. Other files in
`qa/` cover empty, picker, selected, saving, failure and English/dark states.
`manifest.json` records current source hashes, screenshot hashes and conditions.
All account names and IDs shown are test fixtures, not production users.
