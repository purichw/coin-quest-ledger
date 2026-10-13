# Welcome Tour — October 13, 2026

Local website implementation of the supplied Welcome Tour reference. No commit,
push, deploy, native change, or production Firebase write in this request.

## Scope and owners

The five steps are Welcome → Party Ledger → Debt Dragon → Treasury → Compare
Prices. `shared/profile-tour.js` renders the shared tour;
`shared/profile-hub.js` owns localized copy, lifecycle, Recovery ID priority,
account replay and the existing account-scoped `tourSeen` flag.
`shared/profile-hub.css` owns its responsive presentation. The old emoji hero,
capsule indicator, outlined primary action and obsolete tour CSS were replaced.

Preserved contracts: no data entry during the tour, no navigation or game-data
mutation, skip/finish return to the current page, replay starts at Welcome, and
Recovery ID remains in front until the player saves it. Escape now has the same
completion semantics as Skip. Background interaction/scroll is blocked while
open; Tab stays inside; closing restores focus and the background's prior inert
state. Step changes focus the named heading without replaying the modal animation.

## Design translation

- Cream parchment, illustrated ranger/owl, four miniature feature illustrations,
  emerald primary button, outlined Back, translucent Skip, five round indicators,
  and a dimmed/blurred live page behind the modal.
- Desktop: 820px maximum card; Welcome art and editable HTML copy share a scene.
  Other steps use art/text columns with short checkmarked lists. Footer controls
  and indicators share a row.
- Tablet: 520px maximum card, illustration above copy and checkmarked details.
  Indicators sit above Back/Next. Welcome uses a deliberate character crop.
- Mobile: 360px maximum card, compact illustration and summary, secondary bullet
  lists omitted as in the reference. Welcome keeps four illustrated summaries.
  Controls remain visible on short screens while the body can scroll.
- Existing site fonts remain authoritative. The Tavern-colored tour is preserved
  when opened over the Dungeon theme; the underlying page keeps its chosen theme.
- The supplied image is an annotated presentation, not a CSS screenshot. Device
  frames, numbered annotations and its explanatory panels are not product UI.
  Five indicators follow its explicit five-step content (some drawings show an
  extra dot). The final action is the existing Begin action, not another Next.

## Assets

`assets/tour/` contains five original generated illustrations and two transparent
miniature illustrations. Dragon/scales feature icons reuse the Home assets.
Artwork contains no UI copy; Thai/English text remains selectable HTML.

Generated using the built-in image tool, in a warm illustrated fantasy RPG style:
Welcome is a green-hood ranger with an owl and blank parchment in a castle town;
Party is an open gold-filled chest in a tavern; Debt is a red dragon in a cavern;
Treasury is a gold-roof guild house; Compare is winged fantasy money on emerald.
Friends and Budget are transparent adventurer-group and gold-pouch icons.

The Welcome, Party, Treasury and Compare compositions were widened after visual
review so hoods, chest lids, rooftops and wings remain visible across frames.
WebP encoding preserves alpha on the icons. Final source paths, dimensions and
hashes are recorded in `manifest.json`. Original generator outputs remain intact.

## Verification and evidence

14 distinct targeted E2E executions passed across runs:

- Six new Chromium tests cover all five steps at 1440×900, 768×1024 and 390×844;
  complete/skip/replay, persisted seen state after reload, Back/direct indicators,
  keyboard trapping and restored focus, Escape, unchanged financial/account data,
  English copy, Dungeon backdrop, reduced motion and 320×400 reflow.
- The keyboard/replay test additionally passed in tablet and mobile touch projects.
- Existing Recovery ID priority and primary/secondary control tests passed in all
  three projects. The latter was updated for the explicitly requested filled
  primary action; a transient transparent hover background was fixed in CSS.
- Shared consumers were exercised on Split entry, Debt and Treasury: opening and
  dismissing the tour preserved the route and restored interaction.
- Syntax, deployed-asset checks and `git diff --check` passed.

`qa/tour-{1440,768,390}-{welcome,party,debt,treasury,compare}.png` are current local
viewport captures with surrounding page context. Their page account is a local
TEST fixture, not production player data. Images were decoded before capture.
The representative views and all step compositions were personally inspected;
the cropped-first-draft artwork was revised before final captures.

The tests use `?test=1` and `POINTY_REAL_FIREBASE_E2E=0`. This proves local tour
behavior and persisted state; it is not a fresh production signup or a live
Firebase sync check. Existing automatic-after-auth scheduling remains unchanged.
Broader game, backend, native, admin and release suites were intentionally skipped
because this request changes only the shared website tour.

```sh
POINTY_REAL_FIREBASE_E2E=0 npx playwright test tests/e2e/welcome-tour.spec.mjs --project=chromium
POINTY_REAL_FIREBASE_E2E=0 npx playwright test tests/e2e/coin-quest-ledger.spec.mjs --grep 'recovery code stays visible|onboarding tour navigation distinguishes'
```
