# Split Expenses: expanded party layout

Reference: user-supplied `codex-clipboard-c5218b3f-2454-40ca-b5e4-4a050605853c.png`.
Scope: live `/trip/?id=…` board presentation. Existing gameplay wins over mockup
content; no production writes, commit, push or deployment in this pass.

## Design translation

| Preserve | Translate / adapt |
| --- | --- |
| Shared player header, village artwork, banner sizing and footer | Party and recent expenses stack in an independent desktop left column; expense form/settlement occupy the right, leaving no forced gap below members |
| Real character art, skins and canonical class colors | Full portraits on desktop/tablet; portrait beside all member information on mobile |
| Character ID invitation, final confirmation, account hero pinning, board-local Guests | Compact add form with one Hero-selection button opening the existing popup; no new real-hero creation flow |
| Budget, XP, HP, paid and pending settlement calculations | All member details visible by default, 3/2/1 columns at desktop/tablet/phone; no horizontal rail or Member details button |
| Game-stats preference | HP/XP can still be intentionally hidden in settings; financial details stay visible |
| Existing expense, receipt, search, import/export and settlement flows | Small secondary bottom-right expense shortcut replacing the broad floating summary panel |

The popup keeps all 18 classes × 2 genders and the existing filters. Picking a
hero returns to the add form, and the existing confirmation still commits it.
The mockup's class categories, immediate creation of real heroes, and suggested
party cap were not adopted. Mobile keeps all member details, per the explicit
user override to the compact reference. The add form remains user-opened rather
than showing a creation form on every board visit.

## Owners and cleanup

- `trip/index.html`: board composition, one expense log, small corner shortcut.
- `trip/board.css`: expanded grid, card media, form and picker presentation.
- `trip/board.js`: board labels and local controls; removed obsolete member
  disclosure and duplicated floating total. Places the same log node below
  members on desktop and after settlement at ≤1000px, retaining filter state
  and focus. This keeps DOM order consistent with the displayed arrangement.
- `trip/app.js`: existing member renderer and Hero picker; removed the unused
  inline gender controls/preview. Picker now supports Escape, contained Tab
  navigation and focus return. Data models and calculations are unchanged.
- Fixed an existing visual defect: `.bar-fill` was an inline span, so HP/XP fill
  widths were not painted. It is now block-level.

Class-specific backgrounds use `avatarBg` in all themes, including the chosen
Hero preview. The initial uniform pastel override was removed after feedback.

## Verification

Local fixture only, served at `http://127.0.0.1:4569`. Screenshots use 3 members,
zero expenses, Thai/Tavern at 1440×1000, 768×1000 and 390×844; English/Dungeon
also captured on phone. `before-*` was captured before this implementation.

Personally inspected whole-page composition and viewport captures at desktop,
tablet and phone, plus the Hero popup, selected Guest form, and English/Dungeon
phone. The footer, lower expense form, settlement and expense log were included.
Screenshots are local evidence, not a production or exact-pixel claim.

Initial layout verification: 16 passing cases (15 Chromium cases plus the mobile
skin flow). The later gap/cleanup verification is recorded separately below.

- Responsive 7-member / long-name fixtures; 3/2/1 columns, no overflow,
  log placement, corner shortcut size and action, always-visible member details.
- All 18 class backgrounds and 36 picker choices, gender filter, keyboard focus,
  selection/confirmation, Guest persistence after reload without a Character ID.
- Budget editing and actual HP fill, intentional stats-off state.
- Account hero pinning, invitation/acceptance/decline, Guest add and class locking.
- Skin choice and persistence on desktop and touch mobile.
- Saved expense/reload, filtering, draft preservation, receipts, exact multi-payer
  and itemized splits, repayment/XP, animations and empty-board validation.

Commands:

```sh
npx playwright test tests/e2e/split-party-layout.spec.mjs tests/e2e/split-board.spec.mjs tests/e2e/coin-quest-ledger.spec.mjs --project=chromium --grep 'Expanded party|Party board|Animated full|expense splitter.*(explicit|pins|exposes|duplicate|itemized|imports)' --reporter=list
npx playwright test tests/e2e/coin-quest-ledger.spec.mjs --project=mobile --grep 'exposes 18 avatar' --reporter=list
node docs/split-party-layout-2026-10-14/capture.mjs after
git diff --check
```

After the class-color correction, the three responsive chooser cases were rerun
with explicit checks for distinct canonical backgrounds. Broader site/admin,
native, live Firebase and release suites were intentionally outside this layout
pass. Prior Admin changes in the working tree were preserved.

## Follow-up: gap removal and legacy cleanup

The later user reference `codex-clipboard-c0aa6618-0f29-42c0-bfd6-72636da611b5.png`
may guide member-card composition only. Its Create Hero/User ID/Guest labels do
not replace the live four-digit Character ID invitation flow or board-local Guests.

`gap-fixed-{1440,768,390}.png` and matching viewport captures are the latest
whole-board images after the independent-column fix, with the same three-member
fixture. Earlier `after-*` captures preserve the prior layout/picker evidence.
The log is now 14px below the desktop members panel. A resize test checks DOM
order, focused search, its filter value and the unfinished expense draft.

The follow-up passed 58 targeted Admin/Party cases plus four existing Party
flows covering invitations, explicit Guest selection, new trips and campaign
history. See [cleanup scope and evidence](../post-deploy-cleanup-2026-10-14.md).
