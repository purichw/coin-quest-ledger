# All-games financial audit — 2026-10-17

## Scope and evidence boundary

Audited Split Expenses, Debt Dragon, Treasury, and Compare Prices against
independently worked examples, financial conservation properties, real web form
interactions, reloads, and shared native contracts. Split scenarios cover 3–5
people in the browser and 3–6 people in generated satang checks, through
settlement and linked EXP. See the [Split report](../split-financial-audit-2026-10-17/README.md).

Web evidence uses fresh isolated `?test=1` state on the local server. Firebase
evidence uses the `demo-coin-quest` emulators. No production accounts, financial
records, or live boards were changed. The initial audit below predates the
approved follow-up implementation and release. Follow-up acceptance and exact
deployment evidence belong in [the release record](../financial-release-2026-10-17/README.md).

## Financial assumptions

Different interest contracts must not be treated as one formula. The
[Bank of Thailand explains flat and reducing-balance interest](https://www.bot.or.th/th/research-and-publications/articles-and-publications/bot-magazine-issues/Phrasiam-66-3/FinancialWisdom_interest-rate.html).
Supported game modes are reducing-balance simple interest (`reducing`, the
approved default for new debts), flat interest on original principal (`simple`)
and daily compounding (`compound`), all using a 365-day basis. Reducing interest
uses outstanding principal, excluding unpaid interest; payments cover interest
first. Entering a new debt treats its initial balance as principal, as the form
explains. Existing modes, including missing legacy modes defaulting to compound,
are preserved.

Debt forecasts use a monthly approximation (APR / 12, payments at month end).
They are explicitly labelled as estimates, exclude unscheduled debts, and do not
model lender fees, grace periods, contract-specific day counts or settlement
rebates. The [CFPB debt-reduction worksheet](https://www.consumerfinance.gov/documents/5782/cfpb_ymyg-toolkit_reducing-debt-worksheet.pdf)
supports paying minimums across debts and directing available extra budget by
the selected priority. Closing one debt now rolls the unused part of its final
installment into the next debt in that same simulated month.

## Demonstrated defects and corrections

| Area | Before | Corrected behavior |
| --- | --- | --- |
| Debt allocation | Interest accrued before payment could be labelled as principal | Persistent unpaid interest is consumed before principal; partial interest payments carry the rest forward |
| Debt payment date | Zero-rate payments did not advance the financial cutoff | The date advances even with zero interest |
| Monthly due reminders | Any payment, even ฿1, satisfied a larger installment | Sum dated payments against the installment; ignore undated legacy rows |
| Actual vs simulated debt | “Advance month” applied future interest to real balances and could block today's payment | Actual update stops at today; the forecast remains read-only |
| Final installment | Unused minimum payment waited until next month | Remaining cash moves to the next active debt immediately |
| Forecast coverage | Ad-hoc-only debt could display zero months until debt-free | Incomplete/all-unscheduled coverage cannot advertise a complete payoff date |
| Unpayable forecasts | Interest accumulated over the simulation cap appeared as a final lifetime total | No final date/interest savings advertised when payoff is not reached |
| Debt EXP | `debtXp` changed while stored total XP remained stale | Total is saved trip XP plus debt XP; legacy non-debt XP is retained |
| Debt write failure | Failure could look saved and award XP; character linking published XP before saving | Verify local persistence first; restore saved state on failure; award after success only |
| Treasury cents | 0.1+0.2 could exceed a 0.3 budget; one-satang overspend rounded to “on track” | Satang totals, projections and surplus |
| Daily allowance | Last-day allowance omitted unpaid bills; earlier days excluded today from divisor | Reserve unpaid bills on every day and distribute cash across today through month end |
| Treasury rewards | Module used 800/60/8 while profile used 500/80/10, and UI said XP | Canonical Reputation: 500/won month, 80/on-time bill, 10/distinct logged day |
| Reward history | 13th month erased an older earned month | Compact reward keys survive the 12-month detail limit; repeats do not multiply rewards |
| Bill dates | YYYY-MM-DD parsing could move a paid bill into the previous month west of UTC | Calendar month is read from the saved date |
| Compare savings | Incompatible units made valid offers show 100% saving | Only valid compatible offers set price bounds; invalid rows stay editable |
| Compare rewards | Single/invalid offers elsewhere inflated comparison rewards | Qualification and merchant cap are evaluated within each valid comparison |
| Malformed promotions | Legacy buy=2.5 silently became buy=2 | Preserve the value as invalid instead of silently repricing it |

## Worked examples

| Scenario | Expected and checked |
| --- | --- |
| Flat interest: ฿1,000, 36.5% annually, 10 days | ฿10 interest. Pay ฿5: interest5/principal0/balance1005. Pay another10 same day: interest5/principal5/balance995 |
| Two zero-rate debts: balances50 and150, monthly100 each | Both clear in one month using total budget200 |
| Monthly installment100; pay50 then50 | Still overdue after first50; next due month only after total100 |
| Fresh debt1000, zero APR; pay50,50,900 | Balance0, 3 logs, debt XP600 including close bonus; prior Split XP300 remains, combined XP900; reload adds nothing |
| Treasury income1000, expenses0.1+0.2, unpaid bill500, last day | Available499.70; after paying bill, spent500.30, surplus499.70 |
| Same-day Treasury entries, on-time bill, under-budget close | Reputation590; repeated close remains590; Character XP unchanged |
| January1 available3100 / leap-February1 available2900 | 100/day over31 /29 days respectively |
| 25 won budget months, one logged day each | 25 wins and25 days remain while detailed history has12 rows; Reputation12750 |
| Weight prices10/kg and20/kg plus an incompatible100/l | Best saving50%, never100%; invalid row remains available to correct |
| Six-piece pack60, buy2/free1 vs individual piece10 | Pay120 for18 pieces → 6.6667/piece; 33% rounded saving |

## Initial audit verification (before the approved follow-up)

- New financial unit audit: 16 tests (the original 10 regression examples all
  failed before fixes); includes multiple interest rates/modes, partial
  allocation, partition invariance, rounding, leap month and 25 rollovers.
- Root unit suite: **90 passed**, including the prior Split invariants.
- Focused all-games browser suite: **24 checks**, desktop/tablet/mobile.
- Prior Split financial suite rechecked this turn: **27 passed**.
- Existing Debt/Treasury/Compare form, payment, history and promotion regressions:
  **30 passed** across the three browser projects.
- Firebase emulator backend: **23 passed**, including new unpaid-interest and
  compact reward-ledger storage round-trip checks.
- Native contract suite: **81 passed**; native TypeScript and touched-file lint
  pass. No claim of native UI or binary validation.
- Browser/module syntax and `git diff --check` run on the final source.

Logs and inspected screenshots are in the ignored local directory
`mobile/.artifacts/all-games-audit-2026-10-17/`. In particular,
`debt-forecast-mobile.png`, `treasury-rewards-chromium.png`, and
`price-promotion-chromium.png` show the changed outcomes. Synthetic fixture names
start with TEST; screenshots are local development evidence, not production.

## Approved decisions and remaining limitations

1. **Split repayments are durable.** The user delegated the policy choice;
   recorded money remains credited after edits. Overpayment becomes a reverse
   refund. Rewards are once per pair/campaign. Legacy current-revision checkmarks
   migrate once; older checkmarks remain history, not duplicate money.
2. **Debt interest models:** the user approved reducing-balance simple interest
   as the new-debt default. Neither existing mode is silently converted or
   assumed appropriate for every loan type.
3. Legacy debt rows without adequate balance/payment allocation evidence cannot
   reconstruct an exact principal/interest bank statement. Legacy Treasury
   `stats.logged` is an entry count; missing historic distinct dates cannot be
   honestly reconstructed. New explicit fields prevent further loss.
4. Manual balance/contract changes are adjustments, not payment history. Existing
   replay guards reject incomplete or changed-contract history; actual bank fees,
   holidays, overpayment refunds and contractual early-settlement rebates remain
   outside this model. The schedule uses a calendar-month minimum, not an imported
   lender statement or an arrears ledger.
5. No bank-transfer execution or lender reconciliation is performed. Web release
   does not distribute a new native binary or OTA. See the follow-up release
   record for current web, native Simulator and CI evidence; the initial audit
   counts above are not a claim that later changes were already released.
