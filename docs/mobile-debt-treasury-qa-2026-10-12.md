# Debt and Treasury native round trips — 2026-10-12

Local native development build `com.purichwc.coinquestledger`, iPhone 17 Pro,
iOS 26.5, Expo 57 / RN 0.86.3. Account `cqsim-20261012`, character 2150.
Local web at port 4569 and native app both use existing `pointy-personal-toolkit`
Firebase. Web changes have **not been deployed**.

## Debt

- Created `หนี้ทดสอบ Simulator` on Simulator: original/current 1,000, APR 12%,
  compound, monthly payment 100, due day 15.
- Web read the same dragon and recorded a same-day payment of 100; cloud save
  succeeded. Simulator reloaded 900 with that payment in history.
- Simulator recorded 200; web reload showed 700, both payment rows, and the same
  eight-month forecast / 29 estimated interest. No money was transferred.
- Screenshot: `mobile-debt-qa-2026-10-12/native-roundtrip-700.png`.
- Fixed newly created detail route to retain its saved ID; foreground account
  refresh no longer discards module form drafts. Log removal/restore arithmetic,
  date/overpayment guards and repeat accrual have pure test coverage.

## Treasury

- Verified genuine empty state, then native income 5,000, category `อาหาร QA`
  budget 1,000, and expense `ข้าว QA จากแอป` 120.
- Web read all three. Web created `บิล QA จากเว็บ` 300, due day 15; native reload
  read it, then recorded its payment on 2026-10-12.
- Both clients showed spent 420, remaining 4,580, projected month spend 610,
  projected surplus 4,390, and bill paid. Native removed the duplicate-payment
  action; pure contract rejects duplicate bill IDs as well.
- Native month summary retained current entries and history details (120 + 300).
  Same-month close is a snapshot; actual month rollover archives then clears the
  new month's expense list. Both clients use the same pure functions.
- Visual QA found wrapped stats overlapping history. Replaced flex growth with
  explicit two-column widths and inspected the final Simulator screenshot:
  `mobile-treasury-qa-2026-10-12/month-summary-final.png`.

10 module tests passed at this checkpoint; typecheck/lint passed before the
small stats layout/copy fix. These are scoped flow checks, not a release claim.
Archive/restore UI, offline/conflict fault injection, other modules and the final
shared web regression remain in the completion worklist.
