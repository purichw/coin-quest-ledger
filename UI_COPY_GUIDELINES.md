# UI copy guidelines

Updated: 2026-10-15

Coin Quest Ledger keeps its Tavern artwork, game names and character vocabulary.
Operational instructions explain the real action clearly, in the selected
language, without requiring knowledge of the implementation.

## Labels and terminology

- Use **All Boards**, **Split Expenses**, **Debt Dragon** and **Treasury** for
  Admin board filters. Keep `all`, `split`, `debt` and `treasury` as internal keys.
- Use **Details** for Admin record actions and shortcuts. Keep action groups
  centered under the Actions heading; freeform input values remain left-aligned.
- Use **รหัสกู้คืน / Recovery key** throughout account recovery and the drawer.
  Do not call it a User ID or suggest that exposing it is safe.
- Use **ชื่อผู้ใช้ / Username** for username authentication. Do not describe a
  username collision as an email collision.
- Show **No linked user account** or **No linked user** for administrator records
  without a linked account. Do not expose `orphaned` as the user-facing status.
- Describe Deleted IDs as historical deleted-account records retained for review.
  Technical storage terms such as `tombstone` belong in developer documentation.
- Keep User ID, Character ID and Admin ID distinct; changing their labels must
  never merge their permissions or data ownership.

## Instructions, feedback and safety

- Prefer specific actions: บันทึกการชำระ, ผู้ชำระเงิน, ส่งออกข้อมูล, กู้คืนข้อมูล.
  Recording a payment in this app does not initiate a bank transfer.
- Errors say what failed and what the user can do next. Describe a preserved
  draft only when the actual flow preserves it.
- Destructive confirmations name the affected data and loss of history. Keep
  immediate account operations distinct from board changes applied on Publish.
- Empty states describe what is recorded. An empty debt list does not establish
  that a person is debt-free.
- Keep game flavor in titles and decorative quotes. Financial form labels,
  validation, account security and Admin operations take precedence over metaphor.
- Keep Thai and English meanings aligned. Do not translate code keys, stored
  values, identifiers, user-authored names or event handlers during copy work.

## Verification

Review longer labels on desktop and mobile. Update existing accessible-name and
visible-copy assertions while retaining interaction, persistence and error
checks. Follow the deployment runbook for production releases.
