# Split Expenses financial and gameplay audit — 2026-10-17

## Scope and evidence boundary

The user requested complete Split Expenses scenario coverage, specifically more
than two users, sensible payer/consumer obligations, repayment and linked EXP.
Fresh four-digit boards are created through the actual web entry flow. Browser
cases use isolated `?test=1` accounts/storage; three-character cases send and
accept invitations through the UI, and guest cases use the Hero chooser. These
are not live Firebase accounts or production mutations. Backend evidence uses
the isolated `demo-coin-quest` emulators. The approved follow-up release is tracked
in [the release record](../financial-release-2026-10-17/README.md).

The finance oracle is per-expense payer obligations with reciprocal pair netting.
It does not reroute debts through an unrelated creditor just to reduce transfers.
All amounts below are baht. Generated checks additionally conserve integer satang
for each person's money paid, personal consumption and outgoing/incoming transfers.

## Worked business cases

| Case | People / input | Expected repayment |
| --- | --- | --- |
| Equal meal | A pays 300; A/B/C consume equally | B → A 100; C → A 100 |
| Weighted use | A pays 600; A/B/C weights 1/2/3 | B → A 200; C → A 300 |
| Exact amounts | B pays 600; A uses 50, B 150, C 400 | A → B 50; C → B 400 |
| Percent | C pays 800; A/B/C use 25/25/50% | A → C 200; B → C 200 |
| Item claims, five people | A pays 400; B/C share food 300; water 100 unclaimed, shared by all five | B/C → A 170 each; D/E → A 20 each |
| Two payers, three people | A pays 600, B pays 300; everyone uses 300 | B → A 100; C → A 200; C → B 100 |
| Partially repaid party | Previous case, C has returned 200 to A | B → A 100; C → B 100. B's net is zero but both pair obligations still exist. |
| Excluded payer, minimum currency | A pays 0.01 entirely for B/C/D | B → A 0.01; nothing disappears through rounding |
| Locked three-person regression | PP pays 1,000; Pointy pays 2,000 and 1,000; all three share every entry | PPP → Pointy 1,000; PPP → PP 333.33; PP → Pointy 666.67 |

Every mode above is entered through the form and repaid through the PromptPay
dialog to completion. The equal/weighted/exact/percent cases reload after the
last repayment. The three-character case switches the active account after a
partial repayment, reopens the board and verifies the remaining pairs.

## Defects fixed

1. **Satang could disappear or be created.** Fractions were rounded independently
   per transfer. A 0.01 bill shared by three other people generated no repayment.
   Shares now use integer satang, and a rounded allocation matrix conserves each
   payer contribution and each consumer share before removing self-transfers.
   Stable tie handling absorbs the smallest rounding error, preferring a shared
   payer and then the stored participant order. Payer-map key order cannot change
   results after a Firestore round trip. Duplicate item claimers are rejected.
2. **Paid pairs still appeared in map/profile/export balances.** Those consumers
   used expense-only balances. They now use pending transfers; the map and Excel
   report also preserve sub-baht amounts.
3. **Changing the viewer reordered the persisted ledger.** This changed the
   settlement revision and could reopen confirmations. The viewer is pinned only
   in the rendered party; persisted order remains stable.
4. **Removing a member could rewrite or erase financial history.** Web now blocks
   removal when expenses, trash or repayments reference the member, consistent
   with the native contract. Use a new trip for a different party.
5. **A redraw could change an intentionally empty share selection to everyone.**
   Drafts now retain the explicit empty selection and fail normal validation.
6. **Multi-payer preview accepted a shortfall of up to one baht.** It now uses the
   same 0.005 threshold as saving. A missing 0.50 is visibly incomplete.
7. **Weighted/exact splits displayed an equal-per-person hint.** That hint is now
   limited to equal splits with exactly divisible satang. Preview rounding uses
   the actual selected payer(s).
8. **Loading/refreshing a hero could replace existing XP metadata with zero.**
   Existing `trips`, `debtXp` and character metadata are retained. Character cards
   include other-trip and Debt Dragon XP while current-trip XP stays separate.
9. **Unsaved edits could publish persistent XP.** Registry/profile-cache sync now
   happens only after the board write succeeds and the submitted state is still
   current. Failure/retry checks verify 300 prior XP remains 300 on failure and
   becomes 320 only after the 600-baht, three-person bill successfully saves.
   Confirmed board reads also refresh a stale character profile when another
   member has already recorded a repayment, without requiring another edit.
10. **Profile fronted XP could differ near a rounding threshold.** The fronted
    amount remains in satang until XP is calculated, rather than rounding baht
    first. Character rename mapping also preserves expense trash and matching
    settlement confirmations.
11. **A zero net balance was labelled settled even with two pending directions.**
    Cards now show both repay/receive amounts; the map labels the zero as net,
    and the Excel status distinguishes it from settled. Hero amounts and board
    totals retain satang as well.
12. **Two real characters with the same visible name could be merged on login.**
    Character ID now determines membership; duplicate labels get distinct local
    keys. A rename after settlement retains the same three identities, history,
    confirmations and original board owner.

The prior fully confirmed pair stays confirmed on the same financial revision
even if the corrected satang allocation differs from the older rounded amount.
This prevents a rounding repair from reinstating an old fully paid obligation.

## EXP checks and approved policy

The existing canon awards fronted-money XP at amount/20 (rounded, capped at 250
per board), 180 to a repayment sender and 120 to its recipient. A guest has
board-local progress only, with no real Character ID or registry reward.

For A=600/B=300/C=0 paid on a 900 equally shared bill, full settlement yields:

| Character | Fronted XP | Repayment XP | Total |
| --- | ---: | ---: | ---: |
| A | 15 | 240 | 255 |
| B | 0 | 300 | 300 |
| C | 0 | 360 | 360 |

Reloading does not award those confirmations again. Zero net does not mean no
pair obligations: B still receives from C and repays A. The test follows both.
These fixed first-pair awards mean a tiny valid transfer also awards 180/120.
This is the existing game policy, not a proportional-money reward; changing its
threshold/cap requires a product decision rather than silently changing rewards.

## Resolved business requirement — actual payments across later expenses

The user approved the sensible-policy choice and requested deployment. A
confirmation now records real money returned, by bank transfer or cash. The
application does not transfer money. Later expense edits preserve these records,
and each unordered pair earns settlement XP only once per campaign.

Reproduction with three people:

1. A pays a 300 meal, used equally by A/B/C.
2. B confirms returning 100 to A.
3. C pays a new 90 taxi, used equally by A/B/C.
4. Old result: **B → A 100 again**, B → C 30, C → A 70.
5. Corrected result: only B → C 30
   and C → A 70. B must not be charged the returned 100 or earn repeat EXP for it.

Editing/deleting paid bills creates refund obligations without deleting payment
history. Clearing the log also preserves refunds and XP. Reload, name changes,
campaign boundaries and duplicate confirmations retain the records.

Legacy migration preserves the old current balance: only confirmations matching
the current financial revision become repayments, once per pair. Superseded
checkmarks remain labelled history and are not summed as additional transfers.
Normalization happens before edits on web/native, including campaign snapshots.
No bulk production financial-data rewrite is run.

## Initial audit verification ledger (follow-up results in the release record)

- Before repair: all four new math regressions failed, including a generated
  person-balance mismatch. Captured in `math-before.log`.
- Original Split entry/board/party/settings baseline: 69 browser checks passed.
- Unit + syntax after repair: 74 unit checks passed; 51 browser scripts and 54
  modules parsed. Includes 600 deterministic scenarios with 3–6 participants and
  1–5 expenses, independent cent/balance invariants, all five methods and the
  locked historical pairwise fixture.
- Native shared contracts: all 81 tests passed. This is source-contract evidence;
  no new native binary, Simulator flow or app distribution is claimed.
- Backend Auth/Firestore emulator suite: 22 passed, including concurrent invite
  acceptance, stale writes, owner boundaries and deleted-user history retention.
  A three-account ledger is saved and read through Firestore transactions;
  concurrent duplicate confirmations create one record and one EXP award, and
  completing all pairs preserves unknown metadata and yields EXP 255/300/360.
- Broad whole-web browser regression after the main repairs: 786 passed, 11
  skipped, 1 failed out of 798 in 14.8 minutes. The only failure was an untouched
  Account drawer viewport assertion at 390px in the tablet project. Its unchanged
  targeted rerun passed (1/1, trace captured). The helper checks geometry before
  explicitly awaiting the drawer's 240 ms entrance animation, which is a likely
  timing cause; the run is not described as an all-green first pass.
- Final focused browser run after the last read-to-EXP and two-way-status changes:
  **27/27 passed** across desktop/tablet/mobile. Includes the stale-profile refresh
  on a confirmed read, duplicate-name identity, failed save/retry, PromptPay
  confirmation, reload, invitations and all five split methods.
- Final syntax and `git diff --check` passed. No broader rerun was needed after
  those targeted checks covered the last changes.

Local logs and inspected screenshots:
`mobile/.artifacts/split-audit-2026-10-17/` (intentionally ignored artifacts).
Screenshots show local synthetic boards, the current source changes, 1280-wide
desktop, 820-wide tablet and Pixel 5 browser settings. They do not prove native
or production behavior. Final desktop and mobile captures were inspected: B's
100-to-pay / 100-to-receive status agrees with the two remaining transfer rows;
hero status text is contained at both sizes. Evidence files are
`partial-chromium.png` and `partial-mobile.png`. New test owners are
`tests/unit/split-financial-audit.test.mjs` and
`tests/e2e/split-financial-audit.spec.mjs`; the emulator case is in
`tests/backend/firebase.test.mjs`.
Source baseline: `5c30e4b9c84f7f7f28a390541fde07e00c257357` plus this audit's
uncommitted changes. Unrelated pre-existing docs/screenshots were not reverted.

Skipped: production payment/data mutation, real bank transfer verification,
native device acceptance, deployment. Partial-amount repayment and on-web inline
expense editing are not exposed by the current Split UI, so those are not claimed
as played UI scenarios. Existing native edit contracts are checked separately.
