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
- Party entry and board use the village artwork family. Entry centers its
  introduction; the board reserves room for name, actions and a total. Its
  breadcrumb occupies a separate row. Labels and real data remain live HTML.
- Debt's statistics sit below its banner. Treasury overlaps its statistics
  with the banner edge and retains its month selector. These are valid game
  compositions, not competing global styles.
- Character keeps its portrait, privacy controls and admin-return link, but
  now uses the common wood header and destinations. It is a public profile;
  the shell must not misrepresent the viewed character as the signed-in user
  or show nonfunctional account actions when the account hub is absent.
- Party board and Character keep their contextual sticky actions on phones.
  They replace phone game tabs; the same game destinations remain in the
  header overflow menu. Other games keep the shared phone navigation.
- Game-specific accents, illustrations, card density, battle animation and
  data layouts remain local. Do not standardize them merely for sameness.

## Rules for future mockups and unfinished screens

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
