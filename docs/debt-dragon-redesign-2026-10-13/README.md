# Debt Dragon website redesign — 2026-10-13

Scope: the Debt Dragon game at `/debt/`, translated from the user's Desktop / Tablet / Mobile mockup. The existing shared top navigation and mobile tab bar remain in place. No sidebar, native app, Admin, Firebase schema or financial calculation changes.

## Design and product contracts

- A valley-and-dragon hero, four live summary metrics, green add action, strategy action, and game settings.
- Compact horizontal dragon rows use the game's existing portrait assets. Progress means **percentage repaid**, matching its label. Real balances, APR, payment schedule, dates and logs remain authoritative; reference sample totals are not hardcoded.
- Desktop rows expose payment/details actions. Tablet rows retain the payment action. On phones, tapping a row opens details, payment, edit, artwork replacement and payment history.
- All payment history is reachable, including paid dragons. Search, status filters and sorting operate on real saved debt data. Existing archived debts can be restored on desktop and mobile.
- Financial summary and slayer sections collapse on phones. Strategy/simulation and lair management use explicit disclosures. Settings retain theme, accent, sound, animation and battle-effect controls; Escape, focus trapping and return focus work.
- Existing debt validation, payment/history recalculation, profile links, per-account identity and persistence are retained. Form drafts survive language/theme rerenders.
- Fonts stay Mitr / IBM Plex Sans Thai / Chakra Petch. Tavern and Dungeon are supported in Thai and English. The hero illustration is generated for this product, not an exact duplicate of the mockup painting.

## Ownership

- `debt/app.js`: rendering, filters, disclosures, settings accessibility and draft continuity. Shared PointyLogic remains the calculation owner.
- `debt/design.css`: game styles extracted from the old inline block, with superseded overview/card/sidebar/floating-control styles removed.
- `assets/debt-reference/valley-dragon.webp`: decorative hero, generated with imagegen using the supplied reference. Original generation is retained outside the repository by the image tool.
- `tests/e2e/debt-dragon.spec.mjs`: local seeded visual and interaction checks. Existing Debt Dragon regression assertions were updated for the new control placement and current profile heading.

## Verification

Verified locally in real Chromium at 1440, 768 and 390px, plus 320px reflow and mobile touch emulation. Inspected full-page Tavern and Dungeon captures and payment form captures. The comparison excludes unrelated sidebar/device framing; mobile top and lower-page viewports show the retained fixed navigation.

- 9 scoped Chromium E2E cases passed, including the 2 existing Debt Dragon cases.
- 3 mobile-emulation flow cases passed.
- 6 debt history unit tests passed.
- Syntax check passed: 48 browser scripts / 24 modules.
- Asset check passed: 78 local assets / 47 optional CDN entries.
- `git diff --check` passed.

Flows covered: add/edit/save/reload; blank name and zero balance; invalid due day; zero payment and future payment date; payment and payment-history correction; both strategies and extra-payment simulation; completed debt; active/paid/archived filters, query empty state and sorting; archived restore; settings keyboard handling; account hero and profile navigation; local empty-lair recovery.

Skipped deliberately: whole-site regression, real Firebase account mutations, native Simulator, Admin, Safari/WebKit, production smoke and deploy. No push/deploy performed. These checks do not certify a live cross-device cloud round trip.

## Evidence

- [Comparison viewer](comparison.html)
- [Desktop reference / implementation](comparison-desktop.jpg)
- [Mobile reference / top / lower page](comparison-mobile.jpg)
- [Capture provenance and source hashes](manifest.json)
- `qa/before-*.png`: actual pre-edit captures, same local seed and dimensions.
- `qa/after-*.png`, `qa/dark-en-*.png`: current full-page captures.

The fixture intentionally has four active dragons and no paid dragon initially. The mockup's fourth dragon is paid; `qa/paid-mobile.png` covers that real completed-payment state separately.
