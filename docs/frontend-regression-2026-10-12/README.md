# Frontend regression — 12 October 2026

Status: local repairs, automated regression and the post-fix interactive browser /
own-binary iPhone 17 Pro Simulator pass are complete for the flows below. Local
production-mode UI and native used the existing live Firebase project. Production
web remains at the source revision below; no push/deploy is included in this run.

## Target and data boundary

- Entry: `https://coin-quest-ledger.vercel.app/`, without test flags.
- Deployed source: `34aa1a04335d02d2933a9b2be378bacb726c8fa2`.
- Production `profile-hub.js`, `profile-auth.js`, and `profile-recovery.js`
  matched the pre-fix working source byte for byte.
- Dedicated account: `cqreg-20261012-zbrp7`; User/Character ID `8340`;
  character `TEST Hero 8340`. Only synthetic data belongs to this run.
- Password/recovery secrets are deliberately excluded from this report.
- Fresh post-fix signup: `cqfix-20261012-8idwn`, Character ID `2028`,
  `TEST Hero 2028`. Signup, character creation, reload and sign-out/sign-in passed
  on local production-mode UI with live Firebase. Opening TEST board 2214 also
  linked this hero as a third participant; existing expense splits were retained.
- Local UI restoration from the previous task remains uncommitted. It is not
  the production design tested here.

## Flow ledger

| Flow | Actions / expected result | Current evidence |
| --- | --- | --- |
| Signup | Empty form rejected; new TEST signup creates one identity | Empty display name rejected. Production signup twice showed generic sign-in error. Matching local source exposed `auth/network-request-failed`. Local reload resumed provisioning under the same username; public username record then existed with ID 8340. Production login could continue. The initial signup failure is not classified as a Firestore rules failure. |
| Character | Explicit class/name; save, reload, sign out/in retains identity | Created male warrior `TEST Hero 8340` on production; reload and sign out/in retained it. Read-only Firestore check confirmed character owner and username pointer both refer to 8340. A fresh browser tab also restored the account. |
| Party Ledger | Create own TEST board, add guest, expenses, settlement, invalid input, reopen | Board 2214 `TEST E2E 20261012 8340`, own hero + TEST Guest. Expense 100.01 produced 50.01 owed by the guest. Found negative input silently became positive and percentages 30+30 were accepted. Recorded synthetic settlement 75.01 and reopened: settlement stayed confirmed. No money was transferred. |
| Debt Dragon | Create TEST debt, payment, invalid input, reopen | TEST Dragon 8340, initial 1000.50, APR 0; payment 100.25, corrected to 200.25, reopened balance 800.25. Overpayment 2000 rejected. Empty create / zero payment silently did nothing. |
| Price Arena | Compare offers/units, invalid input, reopen | TEST Milk 8340: 60/1000 ml versus 55/1 l, correct 0.060 versus 0.055 per ml and winner, persisted on reload. Quantity zero disabled save. Found partial rows and fractional promotions could be silently omitted/normalized in source. |
| Treasury | Income, expense, category/budget, invalid input, reopen | Income 5000.50; TEST Food budget 1000.50; expense 125.25; bill 50.25 paid once, remaining 4825.00. Day 32 silently became 31. Empty expense silently did nothing. New tab restored the records. Monthly-summary native browser dialog stalled the original tab; that action is not claimed as passed. |

## Repairs in the working tree

1. Signup now explains transport failures, resumes an already-created matching
   Firebase identity, and removes the redundant display-name request between
   Auth creation and profile provisioning. The precise stage of the original
   transport failure remains unknown; it is not evidence of a rules rejection.
2. Character creation commits the local character only after the Firestore
   transaction succeeds. Retry returns an already-linked character without
   resetting it. Failed-write/retry/reload is exercised by production-mode
   frontend tests with an isolated Firebase transport fixture.
3. Auth hydration waits for the cloud account before showing a creation form.
   A delayed server read over a stale local `character: null` mirror is covered
   by a regression test. Revision checks discard superseded auth reads.
4. Shared number parsing rejects negative financial input, exponent/hex text,
   malformed numbers, unsafe magnitudes and excessive precision. It does not
   turn `-1` into `1`. Typing through thousands separators still works.
5. Web Party Ledger now calls the same expense validator as native for all
   five split modes and payer totals. Import rejects the entire invalid batch
   instead of dropping bad lines. Actual satang and measured fractional
   quantities remain valid; zero income/budget and zero APR remain supported.
6. Debt, Treasury and Prices create/edit paths validate required names, values,
   due days, dates and dependent fields. Partial comparison drafts are retained
   and reported instead of silently discarded. Treasury requires a category
   and a date in its open month. Day 31 still means the last available day in
   shorter months; day 32 is rejected. Local calendar dates replace UTC slicing.
7. Native numeric fields show immediate format feedback, and native save
   contracts use shared precision/range checks. Shared input appearance retains
   the approved brand; no new layout/redesign is part of these repairs.
8. JSON backup validation runs before writes and excludes auth/session/owner
   tokens and other accounts. Old version-1 files remain readable for approved
   current-account data; new exports use version 2 with the owner UID. A backup
   is never a way to replace the signed-in identity. Native module restore uses
   the same finance validation, alongside its existing owner checks.
9. Debt, Treasury and Party Ledger summaries preserve up to two decimal places
   instead of rounding real satang to whole baht. Party hero status uses pending
   settlements, so a fully settled hero no longer shows an outstanding debt badge.
10. Accrued debt may legitimately exceed principal and contain fractions of a
    satang. Editing its name/schedule preserves that precise balance and accrual
    date; freshly entered money still uses two decimals. Reload no longer raises
    the initial principal to match the accrued balance, which had inflated the
    next simple-interest calculation. Backup accepts precise stored final-payment
    results while still rejecting negative, non-finite and zero payment records.
11. Actual native entry exposed `NaN` in the split preview while amount/payer
    fields were incomplete. Preview now requires a valid draft, and itemized
    entries validate their name/value before insertion. Negative input retains
    the draft and shows the error; a corrected 20.02 previews 10.01 per person.
12. The debt headline had a second whole-baht rounding path; it now shows 890.25.
    Native date-only ledger entries no longer acquire a fictitious 07:00 time
    when rendered on web.
13. Web profile board discovery and the owned-board list now include Firebase
    `access.ownerUids`, alongside legacy ownership markers. This is display
    discovery, not an access-rule change. Live board 2214 appeared after the fix.
14. Shared-board character persistence now writes only an existing character
    owned by the current Firebase user. Switching test accounts exposed attempts
    to write the other member's character, which Rules correctly rejected.
    The frontend now skips those writes; missing heroes are not recreated by
    opening a board. Character creation remains the account flow's responsibility.
    Live re-opening of the two-account TEST board retained all five expenses and
    produced no final character-write/permission error. Firestore transaction
    precondition retries were observed and recovered normally.

## Post-fix interactive acceptance after Mac unlock

All actions below used visible UI, with no `test=1` flag or mocked Firebase.
Native was the installed `com.purichwc.coinquestledger` binary on iPhone 17 Pro /
iOS 26.5, using Metro 8093. Local web was served on port 4569.

| Flow | Failed case / correction | Persisted result |
| --- | --- | --- |
| Account/character | Fresh signup and explicit male warrior selection; reload, sign out and sign in again | Same `TEST Hero 2028`, ID 2028; no repeated creation prompt. Primary account 8340 also survived native terminate/relaunch. |
| Party Ledger | Web and native amount -1 rejected without losing draft; native blank draft no longer shows NaN | Web 10.01 + native 20.02 saved; 5 expenses, total 181.04 on both clients. Native date-only entry renders as 12 Oct without a fabricated time. |
| Debt | Web negative creation rejected, corrected to 100.01. Native overpayment 1000 rejected, corrected to 10.01 | New dragon 90.00; original 800.25; web total 890.25 including native repayment. |
| Prices | Web negative price rejected, corrected to 30.01/500 ml. Native buy-count 1.5 rejected, corrected to 2 | Four offers synchronized. Native 24.01/500 ml is the winning offer at 0.04802/ml (UI precision differs). |
| Treasury | Web negative expense and due day 32 rejected; corrected 10.01 and day 31 saved. Native income -1 rejected, corrected to 5000.51 | Both clients show expenses 185.51 and remaining 4815.00. Native monthly snapshot recorded these values and appeared in web history. |
| Profile boards | Board 2214 has Firebase owner UID but empty legacy admin name/character | Web profile now lists the board. |

Settlement confirmations remain scoped to the complete ledger revision: adding
or editing an expense invalidates an earlier confirmation and requires the new
balance to be confirmed. This pre-existing contract was preserved; it is not a
cumulative record of actual bank transfers.

## Player form coverage

| Surface | Validation / failure behavior |
| --- | --- |
| Login, signup, recovery | Username syntax, required credentials, signup display name ≤60, password minimum and confirmation. Recovery checks username, 12-character key and matching password before a request. No real password reset submitted. |
| Character create/edit, profile lookup | Name 1–30, explicit class/gender; lookup uses exactly 4 digits. Save failure retains the creation gate and draft. Native existing identity/owner checks remain authoritative. |
| Board create/open/settings | Board name 1–80, codes/links/slugs checked, bounded owner fields; existing authorization unchanged. |
| Guests, invites, budgets, PromptPay | Guest name, explicit hero, exact Character ID, positive satang budget, supported PromptPay lengths; self/duplicate invites rejected. No live invitation sent to another person. |
| Party expense + edit/import | Amount, optional date, payer membership/totals, selected participants, exact/percent/share/item sums, name lengths; receipts require image type and bounded size. Native edit shares the same boundary. |
| Debt create/edit/payment/history | Positive new debt/payment, nonnegative APR and balances, 1–31 integer due day, chronological real dates, no overpayment, max two decimals for entered money. Unchanged accrued balances keep full precision and may exceed initial principal. |
| Treasury income/category/bill/expense | Nonnegative income/budget; positive bills/expenses; existing category, 1–31 due day, current ledger month, bounded names/notes; duplicate bill payment guarded. |
| Prices product/offer/promotion | Name ≤80, option ≤100, positive money and measured quantity, compatible units, integer piece/pack/buy/free quantities; no partial-row loss. |
| Backup and file import | File size/type, format/owner, row IDs, numeric values, references and dates before mutation. Export/import never restores identity/session credentials. |
| Theme/language/sound/animation/privacy toggles | Existing finite choice controls; no arbitrary numeric/text payload introduced. |

## Verification checkpoints

- Subsequent authorized release preflight: **61 unit, 110 browser E2E
  (7 intentional skips), 21 isolated backend and 59 native contract tests passed**,
  with syntax/assets and native typecheck/lint. This full run includes the final
  ownership and account tests below; earlier targeted counts are not additive.
- Final combined web run: **61 unit tests and 101 browser tests passed**;
  7 intentional skips. Syntax and asset checks passed. Browser projects cover
  desktop, tablet and mobile viewports, not a native app.
- Follow-up targeted checks after the satang/status repairs: **12 passed**.
- Account failure/retry/reload, delayed hydration and invalid login/signup/
  recovery submission: **9 passed** across the same three viewports. The new
  invalid-auth test was added after the combined run; counts are not additive.
- Firebase Rules/Auth/Firestore emulator: **21 passed**, isolated project
  `demo-coin-quest`; no production rules change.
- Native final check: **59 contract tests**, typecheck and lint passed after the
  numeric input and accrued-debt repairs. Typecheck/lint passed again after the
  native preview/item validation correction; actual Simulator results are above.
- Final account/UID-owned-board fixture pass: **12 tests covered** across three
  viewports. Eleven passed in the combined targeted run; the mobile board case
  initially used the desktop profile button. Corrected it to use the actual
  mobile menu, and its isolated recheck passed. No product assertion was weakened.
- Debt follow-up: the four existing invalid-form flows still passed (**12** across
  three viewports); the new accrued-debt test initially expected no accrual on
  reload. Corrected it to assert preserved edit state, one legitimate elapsed day
  of simple interest, unchanged principal and no duplicate accrual: **3 passed**.
  The shared **61 unit tests** and syntax checks passed again after this repair.
- Initial broad web run: 95 passed, 7 deliberately skipped, 6 failures due to
  two old expectations (silently skipped import row; expense without category)
  across three viewports. Updated tests now require visible rejection and a
  corrected successful submission: **all six rechecks passed**.
- Logs: ignored `mobile/.artifacts/frontend-regression-*.log`.
- After the user unlocked the Mac, the interactive flows above passed. Syntax
  checks and `git diff --check` passed after the final display/ownership fixes.

## Evidence inventory

Pre-fix production captures (synthetic TEST data):
`production-signup-failure.png`, `production-party-reloaded.png`,
`production-debt-reloaded.png`, `production-prices-reloaded.png`,
`production-treasury-new-tab.png`. These establish observations on the deployed
revision, not proof that local fixes have shipped.

Post-fix local/live-Firebase captures: `local-treasury-invalid.png`,
`local-treasury-native-roundtrip.png`, `local-debt-native-roundtrip.png`,
`local-prices-native-roundtrip.png`, `local-ledger-native-roundtrip.png`.
Native evidence: `simulator-treasury-invalid.png`,
`simulator-ledger-corrected.png`, `simulator-auth-relaunch.png`,
`simulator-monthly-history.png`.

## Limits

No Admin operations, real financial transactions, permanent deletion, or
customer-data changes. Production and local/emulator evidence will be reported
separately. A mock flow does not establish live Firebase persistence.
The original production signup transport failure is not retroactively marked
passed by a later local/live signup. Both original and post-fix web monthly-summary
clicks stalled the in-app browser's native confirmation interaction: click timed
out, `getJsDialog()` returned no accessible dialog, and closing the tab also timed
out. This browser path remains unverified; the actual native snapshot and its web
history read passed. No real password reset, two-person invitation acceptance, physical-device
release, or exhaustive combination of every control is claimed by this pass.
