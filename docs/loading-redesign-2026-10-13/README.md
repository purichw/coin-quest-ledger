# Coin Quest loading state — 13 October 2026

Implemented the supplied loading mockup for the website at desktop 1440px,
tablet 768px and mobile 390px. Scope is the shared entry splash; native and
Admin are unchanged. No commit, push or deployment was performed.

## Design and owners

- Reference: `reference.png`, copied from the user attachment. Only the app
  viewport is product UI; device framing, annotations and the slide footer are
  excluded. `comparison.html` presents a proportionate desktop comparison.
- `shared/first-load.js` owns all markup and lifecycle. The five HTML entry
  points now contain a single mount instead of five duplicate splash templates.
- `shared/first-load.css` owns the midnight canyon/castle scene, gold torch/eye
  emblem, restrained flicker/breathing, progress, feather quote and desktop tip
  card. Tablet and phone use deliberate crops and omit the secondary tip card.
- Website fonts remain Mitr, IBM Plex Sans Thai and Chakra Petch. Status, tip
  text and slow-load action follow Thai/English preference; the illustrated
  brand quotes remain English as in the reference.
- New scene art was generated from the supplied reference with the built-in
  imagegen tool, then encoded as a 1536 × 1024 WebP (71,478 bytes). It is recreated
  art, not a crop of the screenshot. Torches/eye remain code-native CSS, and the
  feather uses inline SVG. No new icon/library dependency.
- Original generated source:
  `/Users/point/.codex/generated_images/01a12b87-cf17-7193-a1a2-63c61768c511/exec-c47caa30-ced2-47c9-a963-ae2c7f0c1290.png`.
  Production asset: `assets/loading-reference/night-quest.webp`; the asset
  inventory verifies its deployed local availability.

## Loading contract

This remains a page-entry splash, not an account synchronization gate. Firebase
auth/account readiness and account ownership behavior are unchanged.

- Retains the existing first-visit minimum of 2 seconds and the later-navigation
  reveal threshold of 500ms. Fast subsequent navigation stays quiet. `?test=1`
  still bypasses the splash; no production preview/bypass parameter was added.
- Progress is stage-based page preparation: 0 initially, 25 after DOM readiness,
  then up to 90 as eager images settle, and 100 only on the browser load event.
  It is not byte-download progress, a Firebase percentage or an ETA. The bar,
  number and accessible value now use the same value; independent timed fill
  animation and the old elapsed-time percentage loop were removed.
- Successful and failed image responses settle. Lazy off-screen images do not
  hold the page open. A failed background leaves a readable dark gradient.
- After 8 seconds without load completion, an accessible “Continue to the page”
  action allows dismissal. It does not mark unresolved work as 100%. Data/assets
  keep loading under the ordinary page's existing behavior.
- The active splash keeps keyboard focus inside, locks background scroll, and
  restores the underlying dialog's heading on completion. Timers/listeners are
  cleaned up; loading the remaining asset after early dismissal cannot reopen it.
- Reduced motion disables flicker, breathing, drifting embers and transitions,
  while preserving the actual progress value. Storage denial is tolerated.
- Each desktop page entry displays one randomly selected tip from eight local
  tips in Thai or English, without previous/next controls. Session storage tracks
  the previous tip to prevent immediate repeats. If storage is unavailable, tips
  still randomize but may repeat. Tips remain still while reading, do not extend
  the loading wait, and make no backend/analytics requests.

## Verification and evidence

Scoped browser checks: 8 tests in `tests/e2e/first-load.spec.mjs` on Chromium,
plus the real login gate integration test in `account-persistence.spec.mjs`,
plus the 390px composition test with the mobile touch/viewport project: 10
successful executions across these scopes. Targeted reruns followed the focus
fix and screenshot capture refinement.

Coverage includes three responsive sizes, shared artwork, synchronized fill,
random tips, keyboard containment/release, reduced motion, slow loading,
early exit, missing art/image errors, denied storage, 320px short screens,
fast and slow later navigation, all five HTML consumers, test bypass, and real
Login → Sign Up reachability after loading completes.

The isolated loading harness holds an actual image response to keep the
production loader visible; it does not alter progress or force styling.
The five-consumer smoke keeps each real page's markup/styles but omits app
scripts after the loader. The separate real Home/auth test runs the complete
frontend with Firebase transport mocked and holds the Home crest image.
No production accounts or data were created or modified.

Personally inspected:

- `qa/loading-1440.png`: full desktop loading composition and active tip card.
- `qa/loading-768.png`: tablet crop, centered stack, quote, no desktop tip card.
- `qa/loading-390.png`: phone composition and readable progress/quote.
- `qa/loading-390-slow-th.png`: Thai slow state, reduced motion and exit.
- `qa/loading-home-auth-1440.png`: actual Home/loading overlay with login behind.
- `qa/comparison-desktop.png`: reference viewport vs implementation, annotations
  retained only on the reference. This is an adaptation review, not a pixel score.

`git diff --check`, browser/module syntax checks and deployed asset inventory
also pass. No whole-game regression suite, backend tests, Safari engine tests,
physical device testing or production deploy smoke were run for this scope.

## Asset prompt summary

Dark midnight navy/violet fantasy canyon, distant right-side gothic castle with
small amber windows, wood/rope rails descending from both foreground sides,
quiet central negative space, sparse golden embers. No moon, central light,
characters, text, logos, UI or infographic framing. The reference supplied the
composition and mood; the rendered website supplies all text and controls.
