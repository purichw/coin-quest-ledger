# Price Arena — October 13, 2026

Website-only implementation of the user's Price Arena reference. No commit,
push, deployment, native app change, Admin change or production data write.

## Design and ownership

- Preserve: existing account-scoped `pointy_compare_v2`, Firebase module registration,
  unit conversion, packs, buy/free promotions, shared navigation and brand fonts.
- Translate: sunny market hero, scales emblem, cream product panels, gold winner
  ribbon, green savings, ranked alternatives, overflow actions, search and sort.
- Responsive composition: three offer columns on desktop; compact offer rows on
  tablet; first ranked offer with an explicit disclosure on mobile. Equal-price
  alternatives remain marked equal, with no false champion.
- Final visual review corrected overly shallow offer cards and small price text:
  the desktop workspace is capped at 1,040 px, with taller offer cards, stronger
  unit prices, and a larger first-offer card on mobile. Fresh captures were reviewed.
- Adapt: the reference sidebar is replaced by the already accepted shared global
  navigation. The reference's tracking tab becomes **Active / กำลังเทียบ** because
  the existing product has active/archived status, not a following relationship.
  No new tracking or backend schema was invented.
- Real calculation wins over illustrative numbers: 59 / 1,500 ml, 42 / 1,000 ml
  and 18 / 180 ml produce 61% savings, 7% and 154% premiums respectively. The mockup's
  rounded/inconsistent examples are not hardcoded. Unit prices above ฿10 now retain
  up to two decimal places instead of rounding to whole baht.

Owners: `shared/price-arena.js`, `shared/price-arena.css`, `index.html` shell.
The old inline card grid, permanently expanded builders, hover-only delete buttons
and animated champion CSS were replaced, not layered underneath the new design.
Price styles are scoped to the comparison view so Home keeps its own composition.

The market backdrop was generated with the built-in image tool from the supplied
reference's landscape role, then encoded as WebP. Shared SVG scales and existing
pixel product icons remain real vector assets. No UI screenshot is used as a page.

## Verification

- 14 distinct Chromium E2E cases passed: 7 focused Price Arena cases, 1 existing
  price-ranking/icon-picker case, and 6 shared Home/navigation regression cases.
- 3 targeted pricing/offer-validation unit cases passed.
- Syntax: 48 browser scripts and 25 module files passed.
- Asset check: 79 local assets and 47 optional CDN entries passed.
- `git diff --check` passed.
- Browser runs used local fixtures and `POINTY_REAL_FIREBASE_E2E=0`; this is not
  evidence of a fresh production Firebase or physical Safari-device test.

Exercised through actual controls: create a product; preserve name/unit through
icon selection; reject blank names, negatives, zero quantity, excess price
precision, incomplete rows, fractional pack counts and invalid promotions; save
and edit offers; rerank; rename; remove an offer; reload persisted state; search,
sort, archive and restore; mobile disclosure; ties; long names; Escape/focus return.
The initial form rerender exposed invalid fieldset nesting that separated the
save control from its validation owner; that was corrected and the flows rerun.

## Visual evidence

Open [comparison.html](comparison.html). `manifest.json` records reference crops,
viewport sizes, route, fixture and source artwork. `qa/before-*` are actual captures
made before this turn's changes; `qa/after-*` and `qa/dark-en-*` are the real page.

Personally inspected: light desktop 1440, tablet 768, mobile 390; dark English
mobile; desktop/mobile offer dialogs; reference/development comparison crops.
Dark English desktop/tablet are also captured and checked for runtime errors and
horizontal overflow. Full-page mobile screenshots show the fixed navigation at
the first viewport boundary; it stays at the viewport bottom during scrolling.
Reference frame labels do not establish a measured CSS scale; crop comparisons
use equal display widths and preserve aspect ratios, not a pixel-parity claim.

Not rerun: whole-game journeys, native Simulator, Admin, production auth/cloud,
release/deploy gates. The shared navigation tests visit module shells only.

## Reproduce

```sh
PATH=/Users/point/.nvm/versions/node/v24.21.0/bin:$PATH \
PLAYWRIGHT_BROWSERS_PATH=/Users/point/toolbox/mobile/.artifacts/playwright \
POINTY_REAL_FIREBASE_E2E=0 \
npx playwright test tests/e2e/price-arena.spec.mjs tests/e2e/navigation-home.spec.mjs --project=chromium
```
