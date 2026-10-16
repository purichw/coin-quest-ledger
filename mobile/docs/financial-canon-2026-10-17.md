# Native financial contract verification — 2026-10-17

Scope: new reducing-balance debt default and durable Split repayments, using
the shared web/native canon. No native dependency or Expo API changed.

## Actual Simulator evidence

The existing own-app Debug development client (`com.purichwc.coinquestledger`,
SDK 57), on iPhone 17 Pro / iOS 26.5, loaded the current Metro bundle on port
8093. QA used only the explicit `demo-coin-quest` Auth/Firestore emulator
harness. No production account or finance data was modified.

1. The new-debt form selected **ลดต้นลดดอก** by default and displayed the
   principal-only, 365-day, interest-first explanation. Created “Reducing QA”
   with ฿1,000 principal, 36.5% APR and ฿100 monthly payment.
2. Recorded a ฿100 payment on the creation date. The detail showed ฿900,
   reducing-balance mode and one payment. Back navigation and explicit refresh
   showed the saved ฿900 row and updated aggregate total.
3. In the isolated two-member board, confirmed the guest's ฿340 repayment for
   a ฿680 equal-split expense using the native confirmation alert.
4. Edited that expense to ฿400 and saved. The board showed the original payer
   owing the guest a ฿140 refund; the prior ฿340 repayment remained credited.
5. Read-only assertions against the emulator verified both saved records:
   debt principal ฿1,000, balance ฿900, one ฿100 payment, unpaid interest zero;
   expense ฿400, one `kind: "repayment"` record of ฿340, pending refund ฿140,
   settlement XP still 180 for the guest and 120 for the recipient.

The Mac locked immediately before confirming the final refund. Final native
refund confirmation and app process restart were therefore **not verified**.
The native contract suite covers refund confirmation and repeat-XP prevention;
that is separate evidence from actual device interaction. Software keyboard
display was not established in this pass; text editing and the app's numeric
Done/dismiss action were exercised through the native accessibility controls.

Both screenshots were captured and inspected:

- [Reducing debt after payment](../.artifacts/financial-release-2026-10-17/native-reducing-payment.png)
- [Refund after expense edit](../.artifacts/financial-release-2026-10-17/native-split-refund.png)

Local evidence is ignored under `.artifacts/financial-release-2026-10-17/`:
`persisted-ui-state.log`, `emulator.log`, `metro.log`, `contracts.log`,
`typecheck.log`, `lint.log`, `qa.log` and `device.log`.

## Source gates

Pinned Node 24.21.0: TypeScript and full ESLint passed; 85 native contract tests,
five QA-isolation tests and seven device-readiness tests passed. Shell syntax
for the device build/install scripts passed. Dependencies are unchanged.

The harness and Metro were stopped cleanly after evidence collection; ports
8093, 18088, 19098 and 14408 were free for the repository release checks.
Web deployment does not publish this native source as a new binary or OTA.
