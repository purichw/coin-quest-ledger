# Coin Quest mobile direction

Current user decision: **2026-10-16 (Asia/Bangkok)**. Bring the iOS player app
into the visual family of the latest mobile website while adapting the layout
and interaction to native iPhone use. Reuse existing artwork and fonts; crop or
resize only where the native composition needs it. No Admin portal or WebView.
The normal login state should fit one viewport, with a usable keyboard path
and scrolling when errors or accessibility text sizes require more room.

The user's same-day correction is explicit: the first cream-led native pass
lost too much of the website's character. Keep the **same illustrated world**,
including scene backgrounds, category colors and living character artwork,
while making task order, navigation and form entry better for a native phone.
Brand fidelity does not require copying the web page's vertical composition.

This supersedes the **2026-10-12 full-layout restoration** for current native
work. It does not authorize changing financial calculations, account identity,
permissions or saved meaning. The user requested a push and an iPhone-installable
build, with no physical iPhone connection yet. Implementation, visual acceptance,
signed packaging and release are separate gates; see the
[2026-10-16 refresh report](docs/native-refresh-2026-10-16/README.md) for the
current evidence and outstanding work. This direction document is not a QA or
release completion record.

## Brand to preserve

Preserve Coin Quest's tavern/parchment atmosphere, emerald actions, warm gold
accents and RPG identity. Current native light tokens live in `src/auth/ui.tsx`:

| Role | Native light |
| --- | --- |
| Utility/form background | `#f2eadb` |
| Surface | `#fff9ed` |
| Primary text | `#302b20` |
| Supporting text | `#6f634e` |
| Primary action | `#205b49` |
| Gold | `#956b22` |
| Border | `#d8c7a5` |
| Error | `#a33228` |

Player Home and the refreshed module/profile screens use full-screen existing
scene art behind readable panels, not a cream gutter. `SceneBackdrop` uses a
`#10271f66` scrim; scenic native headers use `#193c30` with ivory text. The Home
cards use distinct category roles:

| Destination | Panel | Action strip |
| --- | --- | --- |
| Split | `#e3eee3` | `#32684e` |
| Debt | `#f5e0d8` | `#9b4435` |
| Prices | `#dfedf5` | `#2c6487` |
| Treasury | `#f1e6c5` | `#796021` |

Web typography uses Mitr for display, IBM Plex Sans Thai for body text, and
Chakra Petch for statistics. Native uses these same families
from local licensed TTF assets in `assets/fonts/`, mapped by
`src/theme/typography.ts`. Body text and numeric contrast
must be checked in context; web token values do not override accessibility.

Existing art is bundled directly from `../assets/`: auth doorway/seal, Home
tavern and chest/dragon/scales/treasury illustrations, the board village, debt
valley, treasury castle, price market, character forest and existing portraits.
`SceneBackdrop` and `SceneHeader` in `src/player/ui.tsx` provide full-screen
atmosphere and the compact illustrated scene;
`DragonArt` keeps full detail art and a smaller list variant. No new generated
artwork is required for this refresh.
Home's full-screen backdrop uses the existing portrait doorway, while its camp
hero uses the tavern banner. The wide banner's empty center is unsuitable as a
full-height phone crop; the doorway keeps visible scenery around the panels.

## Native interaction direction

- Login uses the existing doorway as its background, a prominent seal and a
  parchment form sized for the viewport. Clear fields, a primary sign-in action,
  reachable recovery/signup links, Next/Go, password autofill, reveal controls
  and automatic keyboard insets support native form entry.
- Five system-native tabs under `/play` expose Home, Split, Debt, Prices and
  Treasury. Module roots have native stack headers. Existing detail/edit routes
  remain root-stack pushes; their Back path returns to the selected tab.
  Tab persistence, back/swipe and insets require actual Simulator checks.
- Home combines the camp scene and an approximately 104 × 158-point portrait
  with real level/XP. Four 2×2 color-coded destination cards use 80-point-tall
  art and a clear action strip; the whole card is the tap target. The redundant
  greeting was removed so the four entry actions have more room above the tab
  bar. Both portrait and identity panel open Profile; the motion control is a
  separate target. Account and Reminders remain visible header actions.
  Pull-to-refresh and an explicit refresh both load the real player profile;
  errors retain a recovery path. Larger type can scroll rather than truncate.
- Profile uses an approximately 180-point portrait with edit/share/privacy
  controls in the compact shared `ProfileIdentity` composition, followed by the
  native privacy switch and XP. Reputation, achievements and board history can
  expand on demand; all owner board archive/restore actions remain. Public
  Character-ID views share the identity layout with read-only data/actions.
  `private=1` is respected in owner and public views; owner amounts start masked
  until the account-scoped preference is read.
- Split puts existing boards first. Create/join is an explicit disclosure,
  expanded for an empty account, and switching modes keeps each form's draft.
  Debt uses compact illustrated rows. Treasury leads with balance and totals;
  income editing is behind a visible toggle. Prices show the real merchant and
  canonical per-unit comparison result.
- Shared `Disclosure` sections reduce secondary content while keeping their
  child state mounted. Strategy, accrual, archive, history and other operations
  remain available; collapsing content never removes a product capability.
- `LivingArt` in `src/player/LivingArt.tsx` animates only featured Home/Profile
  portraits and debt detail art, plus one short auth-seal cycle. Native-driver
  transforms provide a gentle 4.4-second cycle, 3–5-point lift and 1.2% scale;
  text and financial layout do not move. Repeating art has a 44-point pause/
  resume control. Reduce Motion starts and stays static, and loops stop on
  route blur, app backgrounding and unmount. Home card press feedback uses
  90/110ms scale feedback, with opacity retained when motion is disabled.
- Center above-field labels and numeric summary groups. Keep body text and
  freeform input leading-aligned; preserve native date controls and keyboard
  behavior. Do not compress the 44-point minimum target to fit more content.
- Numeric fields expose native keyboard Done. Existing undated web expenses
  show a date placeholder and remain undated unless a date is explicitly chosen.
  Pending financial saves disable native Back/swipe; completion navigation runs
  only while the original form is focused. These protections preserve input and
  data meaning without changing the canonical calculations.

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
- Keep the canonical web origin `https://coinquestledger.vercel.app` and the
  existing Firebase/account/finance contracts. Player board-owner controls are
  part of the ledger; the absence of a native Admin portal does not remove them.

## Implementation sequence and acceptance

1. Prove the app's own binary on iOS Simulator: build, install, launch, tap,
   keyboard, native alert, back, reload, and current screenshots.
2. Verify account entry and session persistence using existing Firebase
   contracts; verify signed-out, loading, error, signed-in, and restart states.
3. Verify character/Home navigation and native tabs with real account state and
   useful empty states; then exercise one ledger flow at a time.
4. Verify calculations and writes against `../data-contracts.md` and
   `../NATIVE_WEB_PARITY.md`, including board-local guests, invitations, and
   reciprocal pairwise settlement rules.
5. Inspect current native captures beside the current web references, recording
   build, route, viewport and data state. Deliberate native adaptations should
   remain recognizably Coin Quest and visually suitable.
   Check the final Home density after the greeting/card-height adjustment,
   portrait navigation, pause/resume, tab return, background/resume and Reduce
   Motion. Static screenshots alone do not verify motion behavior.
6. Build the final signed device Release with JavaScript/assets embedded after
   final source changes. Keep physical USB-C installation and device testing
   pending until the user authorizes connection; follow `IOS_BUILD_NOTES.md`.

Each step is accepted using observed native behavior and current screenshots.
Neither this document nor the setup harness establishes product completion.

## Research and historical direction

The native adaptation follows Apple's guidance on
[layout](https://developer.apple.com/design/human-interface-guidelines/layout),
[tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
and [text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields),
using the installed SDK's
[Expo 57 native tabs](https://docs.expo.dev/versions/v57.0.0/sdk/router/native-tabs/).
The bounded motion implementation follows React Native 0.86
[Animated](https://reactnative.dev/docs/0.86/animated),
[AccessibilityInfo](https://reactnative.dev/docs/0.86/accessibilityinfo) and
[AppState](https://reactnative.dev/docs/0.86/appstate), using the installed
Expo Router's focus hook to stop mounted tab artwork when it is not active.
These references inform the interaction decisions; they do not substitute for
testing this app.

The 2026-10-11 decision established a native rebuild preserving the brand. The
2026-10-12 decision restored the then-current rebuilt layouts, large character
cards and always-visible Treasury income form. Its recovered patches and
screenshots remain historical evidence in
[design restoration](../docs/design-restoration-2026-10-12/README.md), not the
visual target for the 2026-10-16 refresh. Backend and feature fixes from that
period remain authoritative.
