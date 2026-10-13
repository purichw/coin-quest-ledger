# Treasury category · add and edit

Implemented 14 October 2026 against the supplied **Treasury Category** mockup
(`reference.png`). Scope: the website's Treasury category form, its existing
delete action, and shared material/amount primitives with monthly income.

## Visual contract

- Desktop ≥1024px: a centered 720px parchment dialog, dimmed/blurred Treasury
  backdrop, icon palette and name/budget on the left, Slime companion preview
  and selector on the right. Add and edit use the same composition.
- Tablet 768–1023px: centered 460px single-column form, compact icon row with
  More, no decorative preview. Phone ≤767px: full-width bottom sheet with 8px
  side margins, a small handle, vertical fields and reachable footer actions.
  Very short viewports scroll inside the native dialog.
- Reuse the site's parchment asset, Mitr/IBM Plex Sans Thai fonts, Treasury
  green actions and utility SVG family. Name/select labels and compact icon
  controls are centered per the user's alignment preference. Amounts and
  explanatory/error text remain left-aligned.
- The reference's callout numbers and sample title/data are not embedded UI.
  Delete appears only in edit mode even though the supplied slide shows a
  delete button under an Add heading. The mobile sheet keeps the reference's
  soft cream surface; the desktop/tablet parchment has the stronger edge of
  the site's shared asset. This is deliberate material reuse, not pixel parity.
- Owner files: `treasury/app.js`, `treasury/design.css`. `.category-*`/`.cat-*`
  owns composition; `.treasury-paper`, `.tr-input-row`, currency/clear/error
  styles and `persistTreasuryEdit` are shared with the income form. No stacked
  override of the old category form remains. Other game artwork and global
  header/banner geometry are unchanged by this scoped implementation.

## Form and data contract

| Concern | Behavior |
| --- | --- |
| Entry | Add from the category section; edit from a category or forecast shortcut. Titles match the mode. |
| Defaults | New category keeps the existing ฿3,000 budget default, food icon, empty name; Slime is the new default companion. Edit loads actual values. |
| Category icon | Accessible radio palette, keyboard arrows, More disclosure. Existing hidden/unknown glyphs are preserved and exposed on reopen. |
| Name | Required, trimmed, max 80 characters; clear returns focus. Under-field error on blur/submit, updated during correction. |
| Budget | Required, finite, ≥0, max two decimals, existing safe-number cap. Commas accepted/formatted. Invalid single typed characters blocked; invalid pasted/multichar values are retained and rejected without silent conversion. |
| Zero | Still means zero allocated budget. An expense against zero remains over budget. The helper does not imply an unlimited budget. |
| Companion | Slime selector plus custom name preserves the previous free-text capability. Original localized names/metadata survive unchanged saves. Empty new custom name falls back to the category name. Cosmetic only; no change to calculations. |
| Save | Validate, focus first invalid field, persist through existing account-scoped storage/cloud pipeline, verify local readback, close, rerender and toast. Updates categories only. No claim of completed cloud sync. |
| Failure | Keep draft and show inline retry guidance; restore previous in-memory state on local persistence failure. Retry creates one category. |
| Cancel | Cancel, X, Escape and backdrop discard draft, restore the opener's focus; no autosave. Native modal isolation and Tab loop remain. |
| Delete | Edit only; disabled with explanation for the last category. Confirmation names source/destination and counts current expenses/bills. Keep restores the draft. Confirm moves entries to the first remaining category, preserving amounts, bill links and history. Failed deletion is retryable. |
| Stale data | Removed category or unavailable deletion destination cannot silently recreate a category or lose entries; user is told to reopen. |

## Asset provenance

`assets/treasury-reference/slime.webp` is a generated transparent illustration:
a friendly orange-red Slime with glossy flame curl, large oval eyes and warm
brown outline, matching the role/style of the supplied reference. Generated
with the built-in imagegen tool, then optimized with cwebp to 320×320 at q88.
The original generated PNG is retained outside the repository. This is an
illustration asset, not a flattened screenshot of the form. Shared parchment
is `/assets/auth-guild/parchment.webp`; food/forecast images are existing
Treasury artwork. Utility icons reuse the SVG family in `shared/quest-icons.js`.
The local asset checker requires Slime so a missing deploy asset fails checks.

## Evidence and checks

Local source: `http://127.0.0.1:4569/treasury/?test=1`. Chromium, Tavern/Thai
except the labeled Dungeon/English variant. Synthetic fixture: October 2026,
฿45,000 income, ฿14,360 expenses, six categories. Screenshots open the form
through the UI; underlying scroll varies because the Add/Edit buttons are in
the category section. No live player or backend data was mutated.

- `qa/add-{1440,768,390}.png`: new category, name กินดื่ม, budget ฿9,000,
  Slime selected, no Delete. Actual viewports: 1440×900, 768×1024, 390×844.
- `qa/edit-{1440,768,390}.png`: persisted category reopened in edit mode,
  delete/cancel/save visible. Dropdown focus ring intentionally visible.
- `qa/custom-expanded-390.png`: legacy/custom name and expanded icon palette.
- `qa/english-dungeon-390.png`: dark theme, English edit form.
- `qa/invalid-1440.png`: invalid amount with field error.
- `qa/delete-confirm-1440.png`: destination and preservation confirmation.
- `qa/save-failure-1280.png`: failed local save retains draft (1280×720).
- `qa/income-regression/`: shared form primitives tested against income.
- `qa/before-1440.png`: previous category form. `draft-*` are intermediate,
  superseded by the final Add/Edit captures.
- `comparison.html`: reference/development pairs with context, uniform inferred
  reference scaling, no stretching or retouching of screenshots. Actual
  desktop/tablet/mobile and dark/custom/deletion states were personally viewed.

**19 targeted Playwright checks passed:** 10 category checks, 7 income checks,
2 existing Treasury form journeys at desktop and phone. Coverage includes
save/reopen/reload, persisted object preservation, invalid numeric cases/zero,
clear, custom names/translations/glyphs, cancel/focus/keyboard, delete relocation,
last-category protection, storage failure/retry, and short viewport scrolling.
Syntax, asset and diff checks passed. The new tests initially caught incorrect
test expectations for existing edit wording and an ambiguous focus selector;
those were corrected. English “Edit ward” was aligned to “Edit category”.
Visual inspection caught a dropdown arrow hidden by the old appearance reset;
the category select now has an explicit shared chevron.

```sh
PLAYWRIGHT_BROWSERS_PATH=mobile/.artifacts/playwright \
POINTY_REAL_FIREBASE_E2E=0 \
TREASURY_QA_DIR=docs/treasury-category-2026-10-14/qa \
TREASURY_INCOME_QA_DIR=docs/treasury-category-2026-10-14/qa/income-regression \
npx playwright test tests/e2e/treasury-category.spec.mjs \
  tests/e2e/treasury-income.spec.mjs tests/e2e/treasury.spec.mjs \
  --project=chromium \
  --grep 'Treasury category|Monthly income|Treasury forms validate, save and reopen'
npm run test:syntax
npm run test:assets
git diff --check
```

Not verified: live Firebase synchronization, production, Safari/iOS keyboard,
native app or unrelated game suites. A 390×420 Chromium viewport checks
scroll/reachability, not a real software keyboard. No push/deploy in this task.
