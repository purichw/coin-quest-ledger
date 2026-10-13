# Treasury monthly income

Implemented 14 October 2026 against the user's **Set Income** mockup, saved as
`reference.png`. Scope: the website's monthly income form only. No native,
Admin, account, banking or income-transaction feature changes.

## Visual contract

- Reuse Treasury's existing coin artwork, the site's parchment material and
  utility icon family. A centered crest/title/description precedes the amount,
  helper, sage information callout and actions.
- Desktop and tablet: centered 480px dialog with dimmed, blurred background.
  Phone: nearly full-width bottom modal; green Save above outline Cancel.
- Preserve the existing shared header, Treasury banner and game artwork.
  The field label stays centered to honor the site's established alignment;
  the amount and explanatory/error prose remain left-aligned.
- Existing Mitr / IBM Plex Sans Thai typography and green action treatment are
  retained. The parchment and coin asset are reused rather than traced from the
  slide. Annotations and illustrative sample values are not production UI.
- Ownership: `treasury/app.js` + `.income-*` in `treasury/design.css`; the native
  `mountModal`/`closeModal` lifecycle remains shared with other Treasury forms.
  The category add/edit follow-up shares `.treasury-paper`, `.tr-input-row`,
  currency, clear and error primitives while keeping its own composition.
  Expense/bill forms retain their existing styles. `shared/quest-icons.js` adds
  an info glyph. Both income and category verify local persistence through
  `persistTreasuryEdit`; their validation and feedback remain form-specific.

## Form contract

| Concern | Behavior |
| --- | --- |
| Mode / entry | Edit current monthly total from the Income summary tile; historical summaries remain read-only. |
| Initial value | Current `S.income`, grouped with commas. |
| Amount | Required baht, finite and ≥0, at most 2 decimals; existing safe-number maximum applies. Zero is valid. |
| Editing | Decimal keyboard hint; invalid single typed characters blocked. Invalid pasted/multi-character values are validated, never converted into a different amount. Clear empties the field and returns focus. |
| Validation | Under-field error on blur/submit, then revalidated while editing. Invalid submit returns focus to the amount. |
| Persistence | Existing account-scoped Treasury save and background module-cloud pipeline. Only income changes; expenses, categories, bills and history are preserved. |
| Success | Check local readback, close, rerender the monthly balance/forecast and announce a success toast; restore focus to the income tile. |
| Failure | Keep the form and draft open with retry guidance if local persistence fails. Do not label local success as completed cloud synchronization. A changed month requires reopening the form. |
| Exit | Cancel, X, Escape or backdrop discard the draft and restore focus. No autosave. |
| Keyboard / small screen | Native modal isolation plus existing tab loop. Short viewports scroll inside the dialog; mobile actions stack Save first visually. |

## Evidence and verification

Source: `http://127.0.0.1:4569/treasury/?test=1`, local Chromium, synthetic data
shared with the existing Treasury test fixture, fixed at 13 October 2026.
Income ฿45,000; saved expenses ฿14,360; Treasury background at scroll 0.
No real player data or backend writes were used.

- `qa/after-1440.png`: 1440×900 desktop, Tavern/Thai, income dialog open.
- `qa/after-768.png`: 768×1024 tablet, same state.
- `qa/after-390.png`: 390×844 phone, same state.
- `qa/english-dungeon-390.png`: English/Dungeon variant.
- `qa/invalid-1440.png`: negative amount retained with an inline error.
- `qa/save-failure-1440.png`: injected local-storage failure, retained draft.
- `qa/before-1440.png`: original form, same desktop fixture.
- `comparison.html`: context-preserving reference/development pairs; uniform
  inferred reference scale, no image stretching or retouching. Current panels
  were personally inspected at all three sizes, plus error and dark states.

**8 targeted Playwright checks passed:** three responsive save/reload flows;
invalid/empty/precision/overflow numbers and zero; all cancel paths and focus
loop; storage failure/retry; English dark theme and a 390×420 short viewport;
the pre-existing desktop Treasury form flow (income/category/expense).
The full stored Treasury object is compared before/after an income save, so
preservation is checked beyond the displayed totals. Syntax and diff checks pass.

```sh
PLAYWRIGHT_BROWSERS_PATH=mobile/.artifacts/playwright \
POINTY_REAL_FIREBASE_E2E=0 \
TREASURY_QA_DIR=docs/treasury-income-2026-10-14/qa \
npx playwright test tests/e2e/treasury-income.spec.mjs tests/e2e/treasury.spec.mjs \
  --project=chromium \
  --grep 'Monthly income|Treasury forms validate, save and reopen at 1440'
npm run test:syntax
git diff --check
```

The first run exposed that blocking all `insertText` events also blocked a
multi-character invalid value. The filter now only prevents individual invalid
keystrokes; pasted/autofilled input reaches validation unchanged. Tests assert
that `-1` remains visible and is rejected, rather than accepting a prior value.

Not verified in this scoped pass: live Firebase synchronization, production,
Safari/iOS keyboard, native app, or unrelated game suites. A short Chromium
viewport is layout evidence, not a real hardware-keyboard test. No push/deploy.
