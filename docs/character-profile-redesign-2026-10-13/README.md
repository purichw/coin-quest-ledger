# Character Profile — October 13, 2026

Local website implementation of the supplied Desktop / Tablet / Mobile character-profile direction. No commit, push, deploy, native build, Firebase rules change or production write was performed for this request.

Owners: `character/index.html` loads `character/design.css`, shared icons and `character/app.js`. The unused historical contents of `design.css` and obsolete inline page styles were replaced. `shared/pointy-logic.js` still owns all XP, level, badge and board calculations.

## Design and real-product adaptations

- Preserve the forest-green header, character landscape, parchment surfaces, gold standard, four summary cards, colored module cards, achievements, identity, board history and managed boards.
- Desktop: four module cards and a full achievement row; account/actions and history/managed boards below. Tablet: two independently sized columns, with account/actions grouped below statistics. Mobile: portrait hero, overlaid XP strip, four compact KPIs, section anchors, disclosure cards, horizontal achievement cards, account/history/boards and a fixed action bar with safe-area padding.
- Use the existing class/gender/skin portrait for the requested ID, not a hardcoded Mali. The `1111 / Mali` account in screenshots is a local test fixture only. The banner landscape is reusable decorative art.
- Keep the existing Mitr / IBM Plex Sans Thai / Chakra Petch font families. Compact metadata is intentionally smaller than main values and labels. Long names expand the hero and omit its decorative quote rather than overlap identity.
- Navigation uses existing Home / Split / Debt / Compare / Treasury destinations. The mockup's market, item, ranking and search destinations do not exist in this product. No dead controls were added. The existing return-to-Admin path stays reachable.
- There is no supported self-service edit-profile flow in the existing page or shared account UI, so the mockup's Edit Profile button is omitted. This request does not introduce account editing APIs. There is also no balance top-up feature; the sticky money action is the existing privacy toggle.
- The money KPI means **Total paid**, not wealth/assets. XP progress uses `level.into / level.need`, while the summary shows total XP. At 1,500 XP the current canonical level is 4 and progress is 0 / 1,000; the mockup's 1,500 / 2,000 bar was not substituted for real calculations. Unknown module metrics show an em dash.
- The profile now avoids borrowing the current viewer's account and streak when showing another character. Actual account ownership controls archive/restore visibility. The reversible test-mode archive path now uses the same session storage as board loading. Firestore permissions remain unchanged.
- Profile disclosure choices persist through language/privacy re-rendering. Tablet columns are arranged on breakpoint changes so DOM reading order follows the current composition. Board details are expanded on desktop and available as a disclosure on smaller screens.

## Compactness and visual evidence

Source mockups are saved as `reference-desktop.png`, `reference-tablet.png`, `reference-mobile.png`. They are annotated presentation images, not CSS screenshots. Product-surface crops exclude most device framing; original aspect ratios remain intact. Decorative outer signs/lanterns and annotations are not application UI.

Reference crop rectangles (source pixels): desktop `[246,126,1202,1018]`, tablet `[293,145,1154,1038]`, mobile `[329,198,757,1390]`. At the labeled CSS widths these illustrated extents imply roughly 1,344 / 797 / 1,086 px respectively; their actual browser viewport and hidden scroll extent are unknown. These are inferred scales, not measured source CSS.

Measured local full-page heights with the same three-expense/one-board fixture, Thai language and default disclosures:

| Viewport | Full page | Viewport equivalents |
| --- | ---: | ---: |
| 1440 × 1000 | 1395 px | 1.40 |
| 768 × 1000 | 1028 px | 1.03 |
| 390 × 844 | 1375 px | 1.63 |

The compact mobile regression budget is <1,450 px for this fixture. It includes the complete board details entry point, footer, and padding that prevents the fixed action bar from covering final content. Tablet retains larger readable labels/control areas than the scaled presentation. Expanded achievements, long names and additional boards are allowed to grow the page. This is faithful product adaptation, not pixel parity or an invented similarity percentage.

Current evidence in `qa/`:

- `character-1440.png`, `character-768.png`, `character-390.png`: full-page captures.
- `comparison-desktop.png`, `comparison-tablet.png`, `comparison-mobile.png`: labeled reference/current comparisons.
- `mobile-scroll-states.png`: top and bottom viewport contact sheet; together these cover the entire compact page, including fixed controls. Full-page browser captures paint the fixed action bar at the initial viewport location, so use the contact sheet to judge its actual screen position.
- `character-mobile-dark-long.png`: English/dark/empty/long-name case.

The current desktop, tablet, mobile, readable mobile scroll captures and dark/long-name output were personally opened and visually inspected. Findings addressed during review: duplicate identity blocks, oversized mobile module sections, long name/quote collision, tablet column gaps and incorrect icon semantics. No user approval is implied.

## Verification

13 focused E2E executions passed across the new profile suite and existing profile regression: 8 new Chromium cases, the existing aggregation/portrait/privacy case in Chromium/tablet/mobile, and 2 mobile touch-project cases for composition and reversible archive. Final layout/DOM-order changes were rechecked in the affected Chromium composition and keyboard/breakpoint cases; unrelated behavior evidence was reused.

Checks cover actual class/skin images, canonical amounts, privacy + reload, copy link with privacy query, Thai/English, theme persistence, keyboard disclosures, section navigation, achievement expansion, real board URL navigation, archive/restore + reload, visitor isolation, empty data, long name, narrow 320px reflow and runtime errors. Browser interaction was also exercised in Chrome through the UI with an existing local test board/profile.

`npm run test:syntax`, `npm run test:assets`, `git diff --check` passed. Production Firebase, all-game E2E, native Simulator, Safari/WebKit and full accessibility certification were intentionally outside this local route redesign pass.

To reproduce:

```sh
POINTY_REAL_FIREBASE_E2E=0 CQ_CHARACTER_SNAPSHOTS=1 npx playwright test tests/e2e/character-profile.spec.mjs --project=chromium
POINTY_REAL_FIREBASE_E2E=0 npx playwright test tests/e2e/coin-quest-ledger.spec.mjs -g 'character profile aggregates'
POINTY_REAL_FIREBASE_E2E=0 npx playwright test tests/e2e/character-profile.spec.mjs --project=mobile -g '390px|archive is reversible'
```

This machine uses Node `/Users/point/.nvm/versions/node/v24.21.0/bin` and `PLAYWRIGHT_BROWSERS_PATH=/Users/point/toolbox/mobile/.artifacts/playwright`. See `manifest.json` for route, data, source hashes and screenshot dimensions. The repository already contained unrelated pending work; it was preserved.

## Artwork provenance

Built-in `imagegen` produced the decorative scene. Final asset: `assets/character-reference/forest-valley.webp` (2172 × 724), converted from the generated PNG without changing composition. Original generator output: `/Users/point/.codex/generated_images/01a12b87-cf17-7193-a1a2-63c61768c511/exec-b6bda965-dccb-4e17-afaf-1fad2f17bac1.png`.

Prompt:

> Create a production website decorative hero background, fantasy illustrated game style matching the supplied Character Profile reference visual direction: panoramic lush emerald forest valley, mossy stone bridge, warm medieval castle turrets on left and distant right, bright soft blue sky, layered mountains, painted storybook game environment, intricate foliage and rich warm golden highlights, darker green lower foreground for readable UI overlay. Very wide landscape 3:1 composition. No people, no character, no text, no logos, no typography, no interface, no frame, no scrolls, no banners. Main scenery reads clearly across full width; leave calm low-detail space on right-middle for real character name rendered separately by HTML. Artwork only, beautiful polished fantasy RPG scenery.

Portraits remain existing product assets. Shared icons were reused and extended only with link, eye and stacked-coin glyphs. Existing Split-entry camp/key art is reused for board and achievement emblems.
