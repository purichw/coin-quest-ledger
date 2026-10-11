# Post-release native verification — 2026-10-12

**VERIFIED for the scoped flows below.** The user unlocked the Mac and the
remaining native check ran approximately 05:35–05:45 Bangkok, after the web/API
and Firestore Rules release. This closes the lock-related gap for these flows;
it is not a claim that every platform or destructive variant was tested.

## Environment and source

- Own `com.purichwc.coinquestledger` development app on iPhone 17 Pro / iOS 26.5.
  The binary was rebuilt around 02:32 with the native date/image/file/share
  dependencies. Current JavaScript came from Metro at localhost:8093.
- Base source: `ba143555cc37d6f4fab6db8a75fced1a2556779e`. During QA, only the
  debt-history helper and removal confirmation copy changed; neither calculation
  nor persistence code changed. The current wording was rendered and inspected.
- Production web: <https://coin-quest-ledger.vercel.app>, release `ba14355`.
  Firebase: `pointy-personal-toolkit`, with the matching deployed Rules.
- Existing synthetic account `cqsim-20261012`, Character ID 2150, board 3512.
  All changes were made through the real app controls. Independent authenticated
  Firestore reads verified saved state; no Admin writes or hidden UI injection.
  No credentials, recovery keys or raw receipt payloads are included here.

## Executed flows and results

| Flow | Actions and observed result |
| --- | --- |
| Session | Terminated and launched the app twice. Both returned to signed-in Home without entering credentials, same character 2150 / stored XP 162. |
| Debt Dragon | Edited the existing payment 200 → 210: balance 700 → 690 in app and Firebase. Restored payment to 200 / balance 700. Removed that payment into recoverable history: balance 900, active log 100, trash 200. Restored it: balance 700, active logs 100/200, empty trash. Other finance modules remained unchanged. |
| Treasury | Changed income 5000 → 5100: expenses remained 420, remaining 4680. Signed into the deployed website and opened Treasury: the same 5100 / 420 / 4680 appeared after hydration. Restored income to 5000 in native; financial fields match their original values. The keeper's stale display name was synchronized to the current linked character. |
| Price Arena | Opened the web-created offer 20 / 500 ml, buy 2 free 1. Changed price to 21: 0.0280/ml and 7% savings. Restored 20: 0.0267/ml and 11%. Firebase comparison data exactly matches the original; debt data was unchanged by this write. |
| Party Ledger | Changed an existing 120-baht exact-split expense description, saved, reopened and restored it. Total stayed 400, shares 160/240, amount owed 240. Final board equals the original except `updatedAt`, including the existing receipt, participants and campaign state. |
| Member guard | Tried removing the Guest referenced by expenses. UI rejected it with the financial-reference explanation. Both participants and all expenses remained unchanged. |
| Profile / reminders | After the final restart, profile loaded current name, ID, XP, reputation 765 and board history. Reminders showed no pending invites and one unresolved settlement; tapping it reopened board 3512 with the restored totals. |

## Repair and checks

The debt editor incorrectly said edits only applied a difference and did not
recompute historical interest. `shared/pointy-logic.js::reviseDebtLog` actually
replays payment history and refuses insufficient reconciliation evidence. Updated
the editor and removal confirmation to describe that behavior. A fresh native
capture shows the complete helper text and both actions without clipping.

- Targeted ESLint for `mobile/src/app/debt/log.tsx`: passed.
- `git diff --check`: passed before publication.
- No new unit tests for the copy-only repair. Existing source/contract and
  emulator gates passed in the base release; the normal CI gates run on push.
- Stopped after persistence, module isolation, recoverable history, ledger
  protection and the native-to-production-web read were covered. No redundant
  full local suite or fresh native dependency build was needed.

## Inspected captures

All native images are real Simulator captures at 1206×2622 pixels, Thai/light
theme, approved QA account, no modal or keyboard. The web capture is the actual
deployed Treasury at 1280×720, after account hydration, top of page. Its 5100-baht
income is the temporary native test value; the final restored income is 5000.

- [Signed-in Home after launch](post-release-simulator-2026-10-12/home-restored.png)
- [Corrected debt-history explanation](post-release-simulator-2026-10-12/debt-history-copy.png)
- [Production web reading the native change](post-release-simulator-2026-10-12/web-treasury-native-change.png)
- [Ledger after final restart and reminder navigation](post-release-simulator-2026-10-12/ledger-after-restart.png)

## Remaining limits

Live password reset/recovery-key rotation and two-account invitation acceptance
were not exercised in this pass. Android, physical iPhone, TestFlight/App Store,
push delivery, offline fault injection and every archive/import variant remain
outside this scoped check. Earlier individual-flow evidence is linked from the
[completion worklist](mobile-completion-worklist.md). The separate legacy board
ACL/public recovery-hash migrations and billing-dependent TTL cleanup remain
as documented in the [release record](release-2026-10-12.md).
