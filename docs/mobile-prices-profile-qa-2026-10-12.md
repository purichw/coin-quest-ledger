# Prices and profile native checks — 2026-10-12

Same native iPhone 17 Pro iOS 26.5 development binary, existing Firebase and
local web at port 4569 as the Ledger/Debt/Treasury checks. Test account character
2150. No website deployment was performed.

- Native created `น้ำดื่ม QA`, ID `5199d1f4-a85f-4771-85ed-8082cf301cd3`.
- Native offer `ร้าน A จากแอป`: 30 per 1 l; web read 0.030 per ml.
- Web offer `ร้าน B จากเว็บ`: 20 per 500 ml, buy 2 free 1; cloud write succeeded.
- Native reopened the product and ranked B first, equivalent 750 ml, 0.0267 per
  ml, saving 11% against A. Website displays 0.027 due to its 3-place formatting.
- Screenshot inspected: `mobile-prices-qa-2026-10-12/roundtrip-promotion.png`.
- Full native profile read Character XP 162, Reputation 765 (Ledger 45, Debt 30,
  Treasury 590, Prices 100), four of 19 reputation trophies, one-day streak.
- Web profile drawer matched Reputation 765 and four trophies. Formula and
  trophy definitions now come from `shared/pointy-logic.js` for both clients.
- Native renamed the synthetic character to `ผู้กล้า QA Mobile`; ID 2150,
  XP 162 and historical board participant `ผู้กล้า QA` remained intact.
- Web full profile initially failed because it read protected boards before
  Auth restoration. Fixed its auth-ready gate, reloaded, and verified new name,
  XP 162, actual Debt/Treasury/Prices metrics and original board history.
- Native Hide Money action masked finance statistics and board shares.

11 module contract tests and native typecheck/lint passed before progression
additions. Root unit 35/35 and syntax passed at that checkpoint. Added subsequent
progression/streak/reminder cases; final combined suite remains pending.
