# Treasury reference implementation — 13 October 2026

Scope: the website Treasury route on desktop, tablet and mobile. The supplied Treasury reference is authoritative for the game surface; the accepted shared navigation remains in place. Native, Admin and other games are outside this change.

## Design translation

- Golden castle hero, monthly navigation, green expense action, illustrated income/spend/balance/days overview and vault meter.
- Desktop: three budget cards per row with recent entries, editing and expense actions; forecast alongside, then bills and history disclosures.
- Tablet: compact budget rows. Mobile: four collapsed sections with the overview and expense action first. Opening a category exposes real amounts, recent expenses and working edit/add controls.
- Generated, transparent inventory art replaces the six default category emoji in the display. User-selected alternative category glyphs remain supported. Shared fonts and both themes/languages remain available.
- Removed the obsolete inline layout CSS. Current styling belongs to `treasury/design.css`.

## Product constraints and corrections

- Month navigation reads existing saved summaries only. It never replaces the active month or displays today's category budgets as historical budgets. Older summaries without expense snapshots explicitly show totals only.
- Forecast amounts and counts use the existing calculations, so they differ from decorative example figures in the reference.
- Existing account-scoped key, Firebase bridge and data schema remain intact. No production data was created or changed.
- Zero budgets display/save as zero. Clear-vault and missing-data fallback produce empty records rather than injecting the old example ledger; removed that obsolete seed path.
- Forms retain range/precision/date validation, keep drafts on failure, contain keyboard focus, support Escape/Enter and restore focus to the initiating control. Feedback clears when the input is corrected. Saved categories/expenses/bills reveal their section.

## Evidence and verification

`comparison.html` compares reference/game crops at equal display widths without stretching. Full before/after and dark-English captures live in `qa/`; fixture and source identity are recorded in `manifest.json`.

Personally inspected desktop 1440, tablet 768 and mobile 390 light renders; dark English mobile; mobile expanded category; mobile expense dialog after correcting invalid data. Visual review covered hierarchy, three-column density, icon rendering, compact mobile composition and form readability. Captures use synthetic local data.

Focused E2E covers all three responsive layouts, asset loads, light/dark and Thai/English overflow, income/category/expense validation and reload, bill validation/payment/editing, history browsing without data mutation, close/clear, responsive disclosure behavior, and keyboard focus. The existing Home → Treasury entry flow is also covered. Syntax and asset guards plus `git diff --check` pass.

Not run: whole-site suite, real Firebase account sync, native Simulator, Admin, production release. No commit, push or deployment in this request.

## Asset provenance

Built-in imagegen generated `assets/treasury-reference/castle-banner.webp` and twelve WebP inventory icons. The source reference is `reference.png`. Source PNGs remain at:

- `/Users/point/.codex/generated_images/01a12b87-cf17-7193-a1a2-63c61768c511/exec-81cb4e4c-9d52-498e-aef5-4f04ca951949.png`
- `/Users/point/.codex/generated_images/01a12b87-cf17-7193-a1a2-63c61768c511/exec-a015f77e-e7d5-4565-86ce-4c06e8726cef.png`

Hero prompt: create a wide 3:1 warm painted RPG treasury/castle street; ornate timber/stone building and amber lantern at the far left, purple heraldic banners at the edges, a golden castle at right, pale luminous central sky for overlay text. No characters, text, UI, annotations or framing. Reference used for composition/style.

Inventory prompt: one transparent 4×3 sprite sheet with isolated, centered painted RPG items and generous margins; brown contours, gold trim and jewel colors readable at 44px. Row 1: coins, crossed swords, green/gold chest, hourglass. Row 2: medieval cottage, noodle bowl, teal travel backpack, navy/gold controller. Row 3: purple shopping bag, red potion, purple crystal ball, antique ledger. No UI, text, backgrounds or overlapping cells. Cropping/resizing/encoding preserved generated alpha.
