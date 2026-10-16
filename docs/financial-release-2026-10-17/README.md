# Financial rules and repayment release — 2026-10-17

## Approved behavior

This release includes the preceding [Split audit](../split-financial-audit-2026-10-17/README.md)
and [all-games audit](../all-games-financial-audit-2026-10-17/README.md), plus the
user-approved financial policies below. It targets `https://coinquestledger.vercel.app`.

- Split confirmations record actual money returned. Later expense edits deduct
  that money from the new pairwise obligation; overpayments become reverse
  refunds. Clearing/deleting expenses preserves repayment history. Cash can be
  confirmed without entering PromptPay. No bank transfer is executed by the app.
- Each participant pair earns settlement XP once per campaign. Corrections,
  top-ups, reverse refunds, reloads and duplicate confirmations do not repeat XP.
  Real-character registry sync follows a successful save; guests stay local.
- Legacy revision checkmarks migrate before edits: the current revision's paid
  pair becomes one repayment; superseded confirmations remain labelled history
  without another deduction. Campaign IDs survive profile aggregation. Removed
  members' object history is retained; malformed placeholders do not affect money.
- New Debt Dragon entries default to reducing-balance simple interest. Accrual
  is outstanding principal × APR / 100 / 365 × elapsed calendar days. Unpaid
  interest never becomes principal. Payments cover interest first, then principal.
  Existing flat/daily-compound contracts and missing legacy compound mode remain.
  The form explains that a newly entered starting balance is principal.
- Debt replay, payment allocation and monthly estimates share the same mode;
  the monthly forecast remains an APR/12 approximation, not a lender statement.
  Explicit zero installments remain zero rather than becoming a guessed plan.
- Treasury uses satang and one Reputation canon across the module/profile;
  calendar-date paid bills remain paid in reminders west of UTC. Compare Prices
  excludes invalid/incompatible offers from savings and reward qualification.

## Worked acceptance cases

| Input / action | Expected |
| --- | --- |
| A pays300 for A/B/C; B returns100; change bill to450 | B owes A50; C owes A150 |
| Same repayment; change bill to150 | A refunds B50; C owes A50 |
| Same repayment; delete all expenses | A refunds B100; prior XP remains |
| A/B/C all settle300; replace bill with150; refund both | All balances0; no second settlement bonus |
| Four people settle400; change payer and participants | Refund original recipients separately; never reroute unrelated pairs |
| Old pair confirmed in two expense revisions | Current balance preserved; old checkmarks are not summed into invented refunds |
| Reducing principal1000 at36.5%,10days; pay110 | Interest10, principal100, remaining900 |
| Next10days; pay909 | Interest9, principal900, debt cleared |
| Accrue twice vs once over same period | Same reducing interest; no compounding |
| Partial interest-only payment | Principal unchanged; unpaid remainder carried without compounding |

## Evidence and release gates

Synthetic boards are created through the web flow. Three-character scenarios
use real invitation controls in isolated test storage. Browser checks cover
desktop, tablet and phone; backend checks use only `demo-coin-quest` emulators.
No production financial data is mutated.

Local evidence is kept in `mobile/.artifacts/financial-release-2026-10-17/` and
`mobile/.artifacts/all-games-audit-2026-10-17/`. Root unit, browser, backend,
native contracts/Simulator and final release results are recorded as gates finish.

- Shared unit checks: 106 passed; syntax and asset checks passed.
- Isolated Firebase backend: 23 passed, including concurrent duplicate repayment
  and reverse-refund writes, plus reducing-interest storage round trips.
- Native: typecheck, lint, 85 contracts, five QA-isolation and seven device checks
  passed. The Simulator saved a reducing debt payment (1,000 → 900) and preserved
  a 340 Split repayment after changing the expense from 680 to 400, showing the
  correct reverse refund of 140. Read-back assertions confirmed persisted values.
- The Mac locked before native final refund confirmation and process restart.
  These two native UI steps are not claimed as passed; see the
  [precise Simulator evidence](../../mobile/docs/financial-canon-2026-10-17.md).
- The full browser gate exposed an old assertion for the removed “skip month”
  action. It now asserts “update interest through today” and absence of the old
  control. The complete affected Debt journey passed all three viewports after
  that test-only correction (`debt-regression.log`).
- The local full run completed in 17.6 minutes: 824 passed, 11 predefined skips,
  and two failures for that stale Debt label (desktop/tablet). Both are covered
  by the subsequent three-viewport passing rerun; no runtime change followed.
  CI runs the entire suite again on the final commit before production promotion.

The exact release commit's [CI/CD run](https://github.com/purichw/coin-quest-ledger/actions/workflows/test.yml)
must pass Test, Native contracts and Deploy production before claiming promotion.

### First CI attempt and targeted repair

[Run 38979397616](https://github.com/purichw/coin-quest-ledger/actions/runs/38979397616)
tested `60ba6b1d86d1790c965fe5da40e7bd65fbd0c24a`: native passed; browser tests
reported 822 passes, 11 predefined skips and four failures, so backend and
production deployment were correctly skipped.

Three failures shared one fixture issue: Thai midnight timestamps were evaluated
in the runner's UTC browser calendar, producing 11 calendar days rather than the
intended 10. The failure was reproduced locally under `TZ=UTC`; the audit fixture
now explicitly uses `Asia/Bangkok`, while the western-UTC reminder regression
retains its own `America/Los_Angeles` override. All 33 audit/reducing-interest
browser cases then passed under a UTC host, without changing any financial
assertion or runtime formula.

The fourth failure measured the drawer during its entrance animation. The
controlled initial frame's right edge was 1446 on a 1440 viewport; its finished
edge was 1422 with no internal overflow. The test's open helper now waits for
the transform to finish before the existing strict containment assertion.
No animation, viewport tolerance or production layout was changed. All nine
drawer composition cases then passed across desktop, tablet and mobile projects.

Before this release, remote main was
`5c30e4b9c84f7f7f28a390541fde07e00c257357`, and the canonical alias pointed to
`https://coinquestledger-q035wycij-purich-w.vercel.app`
(`dpl_HXjBrG4pf1dnsMFLLaSByA5apLeo`). This is the rollback baseline.
Comparable successful full CI took 17–20 minutes, with deployment about 1m33;
inspect current phase/logs beyond 28 minutes, or immediately on a causal error.
CI is the sole production deployment writer; no duplicate manual deployment.

Native source shares the new financial contracts. This web release does not
distribute an iOS/Android binary or OTA. Previously installed clients need the
updated native build before using these new contracts. Forecasts omit fees,
grace periods, lender-specific day counts and early-settlement rebates.

Unrelated account/OAuth documentation, historical screenshots, exports and
handoff bundles in the shared checkout are excluded from this release.
