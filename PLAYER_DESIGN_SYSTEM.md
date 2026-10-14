# Player design system

Current direction: 2026-10-13. Applies to the player website, including pages
that have not received an individual redesign. Admin and the native app have
their own shells; this document does not authorize changing either one.

## One product, distinct games

The user explicitly wants shared components to remain consistent across the
site. A new mockup is a design for a screen within Coin Quest Ledger, not a new
website. Carry the shared shell and the existing module identity through every
entry, board/detail, form, empty/error state and older page in that module.

**Each game's artwork should be different.** Keep Party Ledger's shared journey,
Debt Dragon's dragon valley, Price Arena's market and Treasury's castle. Do not
replace them with one generic banner. Within one game, reuse its artwork family,
palette, icon vocabulary and treatments; responsive crops and purpose-specific
illustrations may differ. An identical image on every screen is not required.

## Shared owners

| Contract | Source owner | Consumers |
| --- | --- | --- |
| Brand/header markup and footer markup/copy | `shared/player-layout.js`: `<cq-player-header>` and `<cq-footer>` | Home, Split entry/board, Debt, Treasury, Price, Character |
| Main navigation, active destination, overflow menu, language, phone tabs | `shared/mobile-shell.js` | All player routes; public Character uses only available actions |
| Header/nav appearance and breakpoints | `shared/navigation.css` | All player headers, drawer and phone game tabs |
| Frame, gutters, banner scale, family artwork, footer | `shared/player-layout.css` | All current player route owners |
| Navigation/utility SVG icons | `shared/quest-icons.js` | Shared shell and route UI |
| Reminders/invitations presentation, filters, modal behavior | `shared/profile-reminders.js`, `.rem-*` / `.ri-*` in `shared/profile-hub.css`; data/actions in `shared/profile-hub.js` | Home/Price Arena, Party entry/board, Debt, Treasury |
| Game composition, crop, overlay, controls, disclosures | `shared/home.css`, `trip/entry.css`, `trip/board.css`, `debt/design.css`, `shared/price-arena.css`, `treasury/design.css`, `character/design.css` | Respective route only |

Load the shared layout CSS on each player document. Load `player-layout.js`
before its custom elements are mounted; load `quest-icons.js` before mounting
the profile header. Do not copy header/footer HTML back into individual pages.
Language changes refresh the shared footer without touching finance/account data.

## Geometry and responsive behavior

| Token/role | Desktop ≥1200 | Tablet 601–1199 | Phone ≤600 |
| --- | --- | --- | --- |
| Outer frame maximum | 1240px | 1240px | viewport |
| Content gutter | 24px | 16px | 12px |
| Standard scenic banner minimum | 260px | 220px | 234px |
| Profile portrait banner | 266px | 210px | 234px |
| Page top space | 20px | 16px | 0px |
| Header | one row | brand/utilities + navigation row | compact utilities + overflow |

Banner values are minimums for normal content, not clipping rules. Long titles,
translation, zoom and metadata may grow them. Character's long-name variant
retains extra space. Borders may account for a 1px inset on each side.
Use the shared tokens rather than a new route-specific width or banner height.
Fonts remain Mitr, IBM Plex Sans Thai and Chakra Petch for their existing roles.

## Intentional differences

- Home is the tavern introduction. Auth/character creation use a full-screen
  tavern flow; Welcome Tour is an overlay; Loading uses its night scene. They
  inherit brand/type/control conventions, not a game workspace layout.
- Login, signup and Recovery ID reset share the guild parchment variant in
  `profile-login.js` / `profile-hub.css` (2026-10-14 reference): green/gold
  treasury seal, heading above tabs, irregular paper, right-hand desktop form,
  centered tablet/mobile form, shared controls and scenic footer. Artwork lives
  in `assets/auth-guild/`; see `docs/auth-guild-2026-10-14/README.md`.
  Character creation retains its existing variant. Do not add mock Google/Apple
  buttons or a cosmetic remember-me checkbox: social providers are not enabled
  and the current auth contract already remembers sign-in.
- Every page entry (including Admin and repeat visits) uses the single eye
  scene in `shared/first-load.js` / `first-load.css`. The early HTML guard hides
  content until applicable CSS, fonts, rendered images/backgrounds/border artwork and initial
  account/route data have settled. Data owners register `CoinQuestLoading.begin()`
  before starting asynchronous work and release it in `finally`. Failed assets
  keep the scene with a reload action; never bypass into an unfinished page.
- Home/Price Arena route changes (including browser Back/Forward) explicitly use
  `CoinQuestLoading.navigate(render)` to prepare their new page before reveal.
  This is the same gate, without an artificial minimum wait on repeat visits.
- Once a page is ready, the eye never reappears for drawers, in-page tabs, refreshes
  or form submissions. Pending lists use the shared `CoinQuestLoading.skeleton()`
  in their own region, with accessible busy status and reduced-motion support.
  Keep errors/retry distinct from empty states; preserve form action feedback.
  Do not add a second account loader or standalone loading-text placeholder.
  Verification: `docs/loading-readiness-2026-10-14/README.md`.
- Account drawer uses one parchment presentation in `shared/profile-drawer.js`
  and `profile-hub.css` across player routes (2026-10-14 reference). Keep its
  green/gold account palette independent of the current game's accent. Profile,
  streak/trophies and the latest three owned boards lead; remaining boards and
  all trophies stay accessible. Desktop expands settings/backup/recovery;
  tablet expands settings; phone collapses secondary tools and keeps Tour visible.
  Preserve disclosure, focus and scroll state during live refresh or preference
  changes. Mask Recovery ID initially, with explicit reveal/copy/regenerate.
  Use actual character art and account metrics, never mockup sample values.
  Evidence and scoped tests: `docs/account-drawer-2026-10-14/README.md`.
- The Recovery Key save view is a centered, blurred-backdrop parchment modal,
  owned by `showRecoveryCode` in `shared/profile-hub.js` and `.recovery-*` in
  `shared/profile-hub.css`. Signup/onboarding and successful password recovery
  share the same chest crest, precautions, selectable key, copy feedback and
  Back/Save actions. Phone puts the primary action first at full width.
  Keep warnings truthful: the existing account drawer can reveal the current
  key, so do not promise a one-time-only display. Copy success must follow the
  clipboard result; denial leaves the key selectable with an actionable error.
  Preserve focus trapping/return, deferred Welcome Tour and the unchanged
  account/rotation contract. Evidence: `docs/recovery-key-2026-10-14/README.md`.
- Reminders uses a compact cream paper panel, gold bell, green centered tabs,
  actual inviter portraits, red outline Decline and green Accept actions, and
  document/coin/dragon financial glyphs. Desktop ≥1024 anchors below the bell;
  tablet centers a 460px dialog; phone uses nearly the full width and puts invite
  actions below the row. One owner serves every existing reminder consumer.
  Keep filters, expanded list, keyboard focus and internal scroll during refresh.
  Loading/failure/retry must not masquerade as an empty inbox. Read state is
  account-scoped device metadata, not payment completion or cross-device sync;
  badge/tab counts show unread items while read pending tasks remain accessible.
  View all expands the same list; there is no separate notification-history or
  settings route. Use initials for legacy invites without known portrait data.
  Evidence and scoped tests: `docs/reminders-2026-10-14/README.md`.
- Party entry and board use the village artwork family. Entry centers its
  introduction; the board reserves room for name, actions and a total. Its
  breadcrumb occupies a separate row. Labels and real data remain live HTML.
- Board settings belongs to Party Ledger: `trip/settings.js` and
  `trip/settings.css` own its parchment dialog. Desktop uses section navigation
  on the left; tablet/phone move the same navigation above a scrolling body.
  Center each icon-and-label group vertically, including two-line labels.
  Keep theme, game controls, admin/member controls, owned boards and data tools
  together. Compact member rows disclose their existing actions; do not hide
  capabilities or manufacture Character IDs for guests. Preserve drafts,
  scroll, focus, admin gates and current real-data links during rerenders.
  Evidence: `docs/board-settings-2026-10-14/README.md`.
- Debt's statistics sit below its banner. Treasury overlaps its statistics
  with the banner edge and retains its month selector. These are valid game
  compositions, not competing global styles.
- Treasury monthly income uses a local `.income-dialog` variant of its existing
  native dialog owner (`treasury/app.js`, `treasury/design.css`). Reuse the game's
  coin artwork, shared parchment material, utility icons and green actions.
  Desktop/tablet center a 480px panel; phone uses a nearly full-width bottom
  modal, Save above Cancel. Keep the field label centered with other site forms,
  and the amount/helper/error text leading-aligned. Editing changes only the
  current month's income, never its expenses/bills; local save failure keeps the
  draft open. Numeric validation permits zero and at most two decimal places.
  Evidence and form contract: `docs/treasury-income-2026-10-14/README.md`.
- Treasury category add/edit shares `.treasury-paper`, `.tr-input-row`, currency,
  clear-button and validation styles with monthly income. Keep the same native
  dialog lifecycle, parchment, typography, utility icons and green save action.
  At 1024px and up, the 720px category panel places the icon/name/budget form
  beside a companion preview; tablet uses a centered 460px single column;
  phone uses a nearly full-width bottom sheet with a handle. Category labels
  and icon controls remain centered. Slime has dedicated artwork; existing
  custom monster names and legacy category icons remain editable. Delete is
  edit-only, confirms the destination and moves expenses/bills without changing
  their amounts; the last category cannot be removed. Zero remains an
  unallocated budget, not an unlimited budget. See
  `docs/treasury-category-2026-10-14/README.md` for behavior and visual evidence.
- Character keeps its portrait, privacy controls and admin-return link, but
  now uses the common wood header and destinations. It is a public profile;
  the shell must not misrepresent the viewed character as the signed-in user
  or show nonfunctional account actions when the account hub is absent.
- Party board and Character keep their contextual sticky actions on phones.
  They replace phone game tabs; the same game destinations remain in the
  header overflow menu. Other games keep the shared phone navigation.
- Party members use an always-expanded 3/2/1-column grid (desktop/tablet/phone),
  with each class's canonical portrait background and the existing Hero picker.
  Desktop's members and expense log share an independent left column, so the
  entry/settlement column cannot leave a hole between them. Stacked layouts
  retain members → entry → settlement → log in DOM and visual order. The expense
  shortcut is a small secondary corner button. Real members still join through
  Character ID invitations; Guests remain board-local. A mockup's create-Hero
  fields, compact mobile members or new party limits do not override those rules.
- Game-specific accents, illustrations, card density, battle animation and
  data layouts remain local. Do not standardize them merely for sameness.

## Rules for future mockups and unfinished screens

Compact tabs, segmented choices, language/theme selectors and icon-and-label
navigation center their content as a group. The common choice-control contract
lives in `shared/player-controls.css`; stacked navigation retains its component
direction and centers the complete icon/label stack, even with wrapped labels.
Do not apply this rule to prose, table cells, disclosure rows or actions that
deliberately align a label on the left and its control on the right.

1. Inspect the shared owner and the closest screen in the same module before
   implementing a new page. Use this file alongside the latest supplied mockup.
2. Reuse or extend a shared component/token first. Do not recreate a header,
   footer, banner size or navigation convention for a single route.
3. Bring older screens within the touched module into the same visual family.
   Do not leave create/detail/empty states looking like unrelated products.
4. A necessary exception must name its role and reason here or in the module's
   design note. Prefer a scoped variant; do not override another game's CSS.
5. Remove superseded selectors when migrating their owner. Keep actual data,
   auth, validation, links, drafts and accessibility behavior intact.
6. Verify only the touched risk. Shared shell changes need representative
   Desktop/Tablet/Phone coverage, navigation, language/theme, focus and no
   overflow; a tiny local change does not require a full-site rerun.

Evidence for this consolidation: `docs/player-design-system-2026-10-13/README.md`.
The regression is `tests/e2e/player-consistency.spec.mjs`. Fixtures and local
screenshots are design evidence, not production/Firebase or native acceptance.
