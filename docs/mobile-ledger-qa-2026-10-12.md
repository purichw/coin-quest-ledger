# Native Party Ledger / web round trip

This record distinguishes actual Simulator/web checks from pure contract coverage.

Environment: iPhone 17 Pro, iOS 26.5, simulator
`7FEE6572-2952-4E46-9649-532C62A2CA42`; own development binary
`com.purichwc.coinquestledger`, Metro port 8093. New native build including date,
photo, document and sharing modules completed successfully on 2026-10-12 at
approximately 02:32 Bangkok time; installed and launched on the same Simulator.

Only the existing test account `cqsim-20261012` / character `2150` was used.
Synthetic board `3512`, `CQ Simulator QA 20261012`:

- Native created the board and added `เพื่อน QA` as a female wizard Guest.
  Guest has no registry Character ID.
- Native saved `อาหาร QA จากแอป`, 120 baht, equal split, own hero pays.
- Local website connected to the same Firebase read the board, both appearances,
  expense and 60 baht pairwise obligation correctly.
- Web initially rejected saving an 80 baht expense because the normalized
  Firestore payload contained nested undefined fields. Corrected the serializer,
  reloaded and re-entered the unsaved test item. The UI then showed saved ✓.
- Simulator subsequently showed both expenses, total 200, own hero paid 200,
  each share 100, Guest owes own hero 100. Screenshot personally inspected:
  [roundtrip-200.png](mobile-ledger-qa-2026-10-12/roundtrip-200.png).
- New native binary restored the existing session and character, XP 5 from the
  web's registry sync. No signup or duplicate character required.
- Native date spinner opened in Thai and confirmed 2026-10-12 without losing
  the existing expense draft.
- Exact split controls accepted 40/80 and previewed those amounts.

The standard ExcelJS browser bundle recursively patched Hermes promises during
runtime testing. Replaced it with the documented bare bundle; relaunched the
binary, Home and board routes opened successfully. Excel export then completed
through the native share sheet/Files, and the exported file was imported through
the actual document picker. Import preview and confirmation added two preserved
expenses, bringing the test total to 400. The exported workbook includes a full
Coin Quest Data sheet so payer maps and split modes are not flattened to report
cells. Excel excludes receipt images; board JSON preserves them. Both clients
now read native board JSON and the exact Excel sheet, and share the legacy
spreadsheet row parser and financial validation.
The final web UI regression imported a native-format JSON expense with receipt,
multi-payer 80/20 and exact shares 40/60; exported and reimported Excel, then
verified totals 100 → 200 and obligations 40 → 80. It passed on all three browser
viewports. The final shared validator also saved an existing 120-baht exact-split
expense on the actual Simulator and returned to the unchanged 400-baht board.
The legacy web spreadsheet parser also understands multi-payer/exact-share cells
and skips the Total footer (contract tests).

## Final additions exercised

- Exact split 40/80 saved and reloaded. Receipt photo picker attached the test image;
  web exposed its receipt control. Two 120 exact rows plus two 80 equal rows total
  400: own paid 400/share 160, Guest share 240. The old settlement confirmation is
  invalidated when financial content changes, so the current pending amount is 240.
- Guest renamed to `เพื่อน QA Mobile`; web reload retained financial references,
  class and total. Canonical own hero remained `ผู้กล้า QA Mobile`, ID 2150.
- Created `แคมเปญ QA รอบ 2`, completed it with zero expenses, and switched back.
  Later removed/restored its unused Guest; both members returned. The original
  four-expense campaign remained unchanged at 400 on native and web reload.
- Removing the Guest from the original campaign was rejected because money
  references exist. Owner/self removal is also guarded.
- Quest template preview showed four editable items totaling 6400. Cancelling
  left the real board total at 400; no sample expense was written.
- Pasted the production web board URL in native and opened the same board.
- Campaign snapshots now isolate trash, removed members and settlement records;
  a focused test covers older snapshots without those fields.

Inspected evidence: [campaigns](mobile-ledger-qa-2026-10-12/campaign-roundtrip.png),
[Excel save](mobile-ledger-qa-2026-10-12/excel-file-save.png). The earlier 200 image
records the first round trip; it is not the final balance.

Shared changes are local only. No production deployment, rule update, or Admin
permission change is included. Remaining gates are tracked in
[the completion worklist](mobile-completion-worklist.md).
