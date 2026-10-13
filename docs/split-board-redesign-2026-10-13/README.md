# Party Ledger board — October 13, 2026

Status: implemented and locally verified; **not pushed or deployed**.
Scope: website `/trip/?id=…`, desktop 1440px, tablet 768px and phone 390px.
Native, Admin, Home and the preceding Split entry redesign retain their owners.

## Design and ownership

The three user-supplied Party Ledger board mockups are saved as
`reference-desktop.png`, `reference-tablet.png` and `reference-mobile.png`.
They supersede the earlier board composition, without changing account,
Character ID, Guest, calculation, permission or persistence contracts.

- `trip/index.html`: board structure and existing shared/overlay primitives.
- `trip/board.css`: scoped responsive board presentation. The old board banner,
  two-column wrapper, quest-row cards and obsolete payer styles were removed.
- `trip/board.js`: labels, icons, board metadata, member detail disclosure,
  expense search/filter, mobile accordion previews and sticky form focus.
- `trip/app.js`: existing state, business actions and renderers; form and list
  markup adapted here, without introducing a competing state store.
- `assets/board-reference/village-dusk.webp`: new generated decorative village
  artwork, 2172 × 724, optimized to about 277 KiB. Original generation is kept
  in the tool's generated-images directory. No external image licensing source.
- `tests/e2e/split-board.spec.mjs`: maintained regression and screenshot fixture.

Adopted: dusk village banner, parchment total, brown outlined icons, green
primary buttons, compact member financial summaries, left members/log and
right entry/settlement columns, circular phone portraits, collapsed phone
previews and a persistent bottom entry action. Existing Mitr / IBM Plex Sans
Thai / Chakra Petch fonts and the previously approved shared navigation remain.
On a board, the phone bottom module tabs give way to the board action; the
top overflow menu still provides every module destination.

## Product adaptations

- Existing characters and skins supply portraits. Real membership determines
  the count; the mockup's sample names, amounts, dates and owner claims are not
  production defaults. The QA fixture has four people, including one Guest.
- The generated banner is decorative, not a trip photograph or editable trip
  cover. The banner uses the real creation date when present, not an invented
  travel date range or a new backend field.
- Member detail mode retains HP, XP, budget, rank, skins, removal permissions
  and Character Profile links. Compact mode prioritizes paid and net amounts.
- The form retains equal, shares, exact, percentage and itemized splitting,
  one/multiple payers, date/time, receipt images, quick entry, templates and
  import. Notes and PDF uploads are not added: existing description/date/image
  capabilities remain truthful. Receipt images retain the 10 MB limit.
- Recent entries retain receipt viewing, individual share/payer details, XP,
  export, recoverable deletion and new adventure actions. The mockup's edit and
  duplicate buttons were not turned into nonfunctional controls or new APIs.
- Repayment opens the existing PromptPay/confirmation flow. The mockup's three
  sample repayments are not substituted for canonical pairwise settlements;
  the fixture correctly produces six pending pairs before confirmation.
- Normal save/sync status stays unobtrusive; actionable save errors remain.

## Verification

**VERIFIED for this local board scope.** Twenty-one distinct E2E cases passed:
five new board cases in each of Chromium desktop, touch tablet and mobile
projects, plus six targeted existing Chromium regressions (Character-ID
invites/Guest, chooser, 18 classes/skins, multi-payer exact split and settlement
XP/victory, itemized split/date/campaign, import/theme/receipt/overflow).

The new suite explicitly checks all three requested viewport widths, no page
overflow, loaded portraits, search and payer filter, member detail expansion,
sticky focus, invalid/zero amounts, invalid percentages, saved expense reload,
draft switching/reset, receipt selection, repayment, TH/EN, dark mode and
animated portrait centering. Syntax, deployed asset allowlist and
`git diff --check` also pass. No financial formulas or Firestore rules changed.

```sh
PATH=/Users/point/.nvm/versions/node/v24.21.0/bin:$PATH \
PLAYWRIGHT_BROWSERS_PATH=/Users/point/toolbox/mobile/.artifacts/playwright \
POINTY_REAL_FIREBASE_E2E=0 CQ_BOARD_SNAPSHOTS=1 \
npx playwright test tests/e2e/split-board.spec.mjs --project=chromium
```

Screenshots and comparisons are in `qa/`; `manifest.json` records routes,
fixture, provenance and source hashes. Desktop, tablet, phone top/form/bottom,
and English dark mode were personally opened and visually inspected, not only
captured. Comparison crops remove slide/device framing, preserve aspect ratio
and retain any annotations that overlap the product. Source CSS scale is
inferred from the mockup labels; comparisons do not claim pixel identity.
Full-page captures show fixed controls at the capture's viewport position;
`mobile-scroll-states.png` supplies actual viewport context at three positions.

Live Chrome was also exercised through entry → sample board and the phone
sticky form action with animations enabled. This caught the image transform
collision, which is fixed using independent CSS translation. The skin menu
clipping and invisible fixed quick-toggle hit area found in regression were
also fixed. Quick toggles now live at the page footer.

Skipped intentionally: production Firebase writes, real payments, native
Simulator, Admin, other games, release CI and deploy. Browser device emulation
is not a physical phone keyboard test. Existing unrelated workspace edits are
preserved and are not part of this board verification claim.
