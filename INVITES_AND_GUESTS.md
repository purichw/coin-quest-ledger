# Invites And Guests Canon

Last updated: 2026-06-30

## Purpose

This file is the source of truth for Party Ledger participant entry flows:
real-character invites, board-only guests, direct invite links, reminders, and
settlement risks.

Use this with `SITE_MAP_AND_INTERACTIONS.md` for cross-surface flow context and
`data-contracts.md` for storage shape.

## Participant Types

### Signed-In Account Hero

- The signed-in account's active character is pinned to the board.
- It comes from the account profile, not from manual name entry.
- The UI must not ask for "Other hero's name" for this path.
- The user's own Character ID can resolve to their profile hero, but it should
  not create a duplicate participant.

### Real Other Hero

- Added by Character ID only.
- The Character ID must resolve an existing `characters/{id}` record or test
  registry entry.
- The app must never generate a new Character ID from arbitrary input in this
  path.
- The UI action is `Invite`, not `Confirm Character`.
- The board admin must confirm before the invite is sent.
- Inviting by ID does not add the participant to the board immediately.

### Guest Hero

- Added through the explicit `Add Guest` tab/path.
- Guest requires only a display name plus class/gender/skin choice.
- Guest does not create a real Character ID.
- Guest does not write to the character registry.
- Guest is board-local and flagged in `guestHeroes`.
- Guest may have a visible duplicate name; use local uniqueness only when needed
  to avoid object-key collisions inside the board state.

## Name Rules

- Duplicate visible hero names are allowed in the game.
- Do not block duplicate names as a product rule.
- Do not validate real other heroes by name. Character ID owns identity.
- If a board-local storage key would collide, append a local suffix while keeping
  the UX casual and non-punitive.

## Invite Lifecycle

1. Admin enters a four-digit Character ID.
2. App resolves the target character record.
3. Admin clicks `Invite`.
4. App shows a confirmation modal explaining that the target hero will receive a
   board invite.
5. Confirming creates a pending invite.
6. Target account sees the invite in Reminders.
7. Target can `Accept` or `Decline`.
8. Decline opens a confirmation prompt/modal before final decline.
9. Accept joins the target character to the board and navigates to the board.
10. Pending invite expires after 24 hours.

## Direct Invite Link

- A direct party invite link can join immediately.
- If the visitor is not logged in, route them to login first.
- After login, continue the join flow for the intended board.
- This path is separate from Character-ID admin invites.

## Reminder Behavior

- Board invites appear in the shared Reminders overlay.
- Reminder copy should include inviter, board name, and time remaining.
- Actions: `Accept` and `Decline`.
- Accept writes the target character into the board.
- Decline updates invite status and removes it from active reminders.
- Expired invites should be ignored or marked expired.

## Storage

Production:

- `users/{targetOwnerUid}/boardInvites/{tripId_characterId}` stores pending and
  responded invite records.

Test mode:

- `localStorage.pointy_board_invites_v1` stores invite records.

Board state:

- `participants`: board participant display keys.
- `characterIds`: maps real participants to real Character IDs.
- `heroClasses`, `heroGenders`, `heroSkins`: portrait metadata.
- `guestHeroes`: flags board-only guest display keys.

## Settlement Canon

Settlement must preserve pairwise per-expense payer obligations and then net
reciprocal pairs. Do not reduce the whole board to global debtors and creditors.

Locked regression case:

```text
Participants: Pointy, PP, PPP
Gift: 1000 paid by PP, shared by all
Coffee: 2000 paid by Pointy, shared by all
Food 1: 1000 paid by Pointy, shared by all

Expected settlement:
PPP pays Pointy 1000.00
PPP pays PP 333.33
PP pays Pointy 666.67
```

This is covered by `tests/unit/pointy-logic.test.mjs`.

## Files To Check

- `trip/app.js`: participant UI, invite modal, guest add flow, board writes.
- `shared/board-invites.js`: invite payloads, status updates, active filtering.
- `shared/profile-hub.js`: reminders, accept/decline handlers, board join write.
- `shared/profile-reminders.js`: reminder overlay rendering.
- `shared/pointy-logic.js`: split and settlement math.
- `data-contracts.md`: persisted shape.
- `tests/e2e/coin-quest-ledger.spec.mjs`: invite/guest browser coverage.
- `tests/unit/pointy-logic.test.mjs`: settlement coverage.

## Required Tests

For invite or guest changes, run at least:

```bash
npm run test:syntax
npm run test:unit
npx playwright test tests/e2e/coin-quest-ledger.spec.mjs --grep "pins the signed-in account hero and invites others by Character ID"
```

For commit/deploy or settlement changes, run full:

```bash
npm test
```

