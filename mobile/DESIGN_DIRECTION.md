# Coin Quest mobile direction

User decision, 2026-10-11: preserve the Coin Quest brand and redesign screens
and interactions for a native mobile app. The retired native layouts are not
the visual source of truth. The setup harness is temporary and is not a final
design proposal.

## Brand to preserve

The player web palette (`../shared/player-brand.css`) restores the classic
parchment surfaces, green actions, brass rewards and purple Dungeon theme.
The user requested this color/brand restoration on 2026-10-12 for both Website
and Mobile while retaining the current layout and behavior. Admin is excluded;
its shared base tokens remain in `../shared/quest-tokens.css`.
Native light colors live in `src/auth/ui.tsx`; fonts and character art are unchanged.

| Role | Tavern / native light | Website Dungeon |
| --- | --- | --- |
| Background | `#e7dcc6` | `#14121f` |
| Surface | `#fbf6ea` | `#221d33` |
| Primary text | `#2f2515` | `#ece8f8` |
| Action | `#277b4e` | `#80d3a3` |
| Gold | `#987016` | `#ecc14e` |
| Border | `#ddc9a3` | `#3b3357` |

Web typography uses Mitr for display, IBM Plex Sans Thai for body text, and
Chakra Petch for statistics. The native account flow now uses these same families
from local licensed TTF assets in `assets/fonts/`, mapped by
`src/theme/typography.ts`. Body text and numeric contrast
must be checked in context; web token values do not override accessibility.

## Native interaction direction

- Home gives all four modules priority within the first viewport, with a compact
  character card above and progression details below. Module introductions,
  cards, rows and centered statistic groups share `src/player/ui.tsx`.
- Center above-field labels and numeric summary groups. Keep body text and
  freeform input leading-aligned; preserve native date controls and keyboard
  behavior. Do not compress the 44-point minimum target to fit more content.

- Lead each screen with its purpose and one clear primary action. Keep balance,
  payer, participant, and settlement information explicit; RPG copy must not
  obscure who owes whom or what an action changes.
- Use native stack navigation, reachable primary actions, sheets for focused
  forms, and safe-area spacing. Back navigation must preserve an unfinished
  form or make discarding it explicit.
- Use at least 44-point interactive targets, readable Thai line height,
  predictable keyboard dismissal, and a visible path to recover from errors.
- Present loading, empty, offline/error, and success states truthfully. Never
  fill real financial screens with invented balances, boards, or transactions.
- Keep character artwork and RPG details as supporting identity. Financial
  amounts, names, and actions retain the strongest useful hierarchy.
- Put setup diagnostics outside normal player navigation once product screens
  replace this temporary harness.

## Implementation sequence and acceptance

1. Prove the app's own binary on iOS Simulator: build, install, launch, tap,
   keyboard, native alert, back, reload, and current screenshots.
2. Restore account entry and session persistence using existing Firebase
   contracts; verify signed-out, loading, error, signed-in, and restart states.
3. Restore character/home navigation with real account state and useful empty
   states; then restore one ledger flow at a time.
4. Verify calculations and writes against `../data-contracts.md` and
   `../NATIVE_WEB_PARITY.md`, including board-local guests, invitations, and
   reciprocal pairwise settlement rules.
5. Expand to other player modules and platforms only with native evidence for
   the preceding flow. Maintain a feature-by-feature parity record.

Each step is accepted using observed native behavior and current screenshots.
Neither this document nor the setup harness establishes product completion.
