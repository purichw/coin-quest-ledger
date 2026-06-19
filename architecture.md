# Coin Quest Ledger Architecture

Last updated: 2026-06-19

## Purpose

Coin Quest Ledger is a no-build static web app for Pointy's personal finance and RPG-style tooling. The live repo favors plain HTML/CSS/JS, shared browser modules, Firebase compat SDKs, and Playwright regression coverage over a bundler or framework.

Claude Design handoffs are the visual/interaction source of truth for surfaces the user explicitly asks to port, but live app behavior, newer user requirements, state shape, and tests remain binding.

Companion docs:

- `data-contracts.md`: persisted data shapes and migration rules.
- `claude-design-index.md`: Claude reference map and inspection notes.
- `leveling-canon.md`: current XP/level tracks, rewards, thresholds, and recalibration backlog.
- `roadmap.md`: phased product/engineering plan and open decisions.

## Runtime Model

- Source root: `/Users/point/Library/Mobile Documents/com~apple~CloudDocs/Website Projects/toolbox`
- Production: `https://coin-quest-ledger.vercel.app`
- Hosting: Vercel static deployment
- Backend: Firebase Firestore compat SDK, project id `pointy-personal-toolkit`
- Build step: none
- Local preview: `npm run serve`, usually `http://127.0.0.1:4569/`

Do not preview app pages with `file://`. Pages use absolute paths such as `/shared/pointy-logic.js` and `/character/app.js`; those only resolve correctly through the static server or production host.

## App Surfaces

### Home / Price Arena

- Files: `index.html`
- Owns the toolbox launcher and price comparison view.
- Loads `shared/profile-hub.*` and `shared/mobile-shell.*`.
- Price comparison logic uses `shared/pointy-logic.js`.

### Party Ledger / Expense Splitter

- Files: `trip/index.html`, `trip/app.js`, `trip/pixicons.jsx`
- Route: `/trip/?id=1234`
- Owns trip state, expense entry, split modes, hero party cards, admin setup, import/export, board history, and Firestore trip sync.
- Uses `?test=1` with `sessionStorage.pointy_test_trip_*` in Playwright tests.
- Uses Firestore `trips/{id}` in normal mode.

### Debt Dragon

- Files: `debt/index.html`, `debt/app.js`
- Route: `/debt/`
- Local-first debt payoff game/tool using `localStorage`.
- Shares theme, profile hub, mobile shell, and character registry concepts.

### Treasury

- Files: `treasury/index.html`, `treasury/app.js`
- Route: `/treasury/`
- Local treasury ledger/tool using `localStorage`.
- Shares theme, profile hub, and mobile shell.

### Character Profile

- Files: `character/index.html`, `character/app.js`
- Route: `/character/?id=1234`
- Aggregates `characters/{id}` with readable trips containing that Character ID.
- Renders Claude Character Profile visual structure: banner, ID card, stats ribbon, module cards, trophies, account card, and board history.
- Supports `private=1` display privacy for money values. This is not authorization.
- The page is public-display oriented; actual data access still depends on Firestore rules.

### Super Admin Portal

- Files: `admin/index.html`, `admin/app.js`, `admin/admin.css`
- Route: `/admin/`
- Phase 1 admin tool for listing/editing boards, users, Board Admin metadata, passwords, drafts, publishing, and revision logs.
- Gate is local browser state only. Real private admin access requires Firebase Auth and Firestore Security Rules.

## Shared Modules

- `shared/pointy-logic.js`: shared data normalization, split math, price math, class registry, level helpers, and character profile aggregation.
- `lang.js`: Thai/English shared labels.
- `shared/profile-hub.js` / `.css`: mock Sign In/Sign Up gate, local account registry, one-time Character Creation, topbar/mobile-drawer profile entry, profile drawer, My Boards, theme/language helpers, backup/restore, sign out.
- `shared/mobile-shell.js` / `.css`: phone-only hamburger drawer and bottom tab bar for Home/Compare, Split, Debt, Prices, and Treasury.
- `shared/first-load.js` / `.css`: first-load splash.
- `shared/cloudinary-assets.js` and `shared/asset-urls.js`: production asset URL resolution.

Shared modules are browser globals. Keep additions conservative and compatible with static script loading order.

## Identity Model

Current product model has separate identities:

- User ID: account/person identity. Mock login currently stores this in `localStorage.pointy_auth_v1`; local signups are stored in `localStorage.pointy_accounts_v1`.
- Character ID: playable hero identity, four digits, stored in trip participant maps and `characters/{id}`.
- Admin ID: Board Admin identity, can own multiple boards and intentionally repeat across boards.
- Board ID / Trip ID: four-digit route/document ID for a board.

The latest Claude loop implemented in the live static app treats one mock account as having one active character. The broader product model can still evolve toward multiple characters per user later. One user can still have many admin IDs. One admin ID can own many boards. Do not globally de-dupe Admin IDs unless the user changes the requirement.

## Persistence

Normal mode:

- `trips/{id}`: Party Ledger board documents.
- `characters/{id}`: character records.
- `adminRevisions/{id}`: Super Admin publish logs.

Local/test mode:

- `sessionStorage.pointy_test_trip_*`: test trip fixtures.
- `localStorage.pointy_character_registry_v1`: local character registry/cache.
- `localStorage.pointy_auth_v1`: current mock login account, including the selected/created character.
- `localStorage.pointy_accounts_v1`: local Sign Up registry so newly created accounts can sign in again.
- `localStorage.pointy_theme`: global theme source of truth.
- `localStorage.coin_quest_ui_v1.theme`: compatibility mirror for older/shared UI.
- Module-specific local stores exist for Debt Dragon, Treasury, Price Arena, drafts, and settings.

Persistence changes require careful migration thinking and targeted tests at minimum.

See `data-contracts.md` for the practical shape of `trips`, `characters`, `adminRevisions`, mock auth, local stores, and derived Character Profile data.

## Design Sources

Claude Design remains the Holy Grail for requested visual ports:

- Party Ledger canon and split references live outside Git in `/Users/point/Downloads/Coin Quest Ledger - Claude Recovery Bundle/`.
- Current Character/Profile loop references came from `/Users/point/Downloads/Coin Quest Ledger/CLAUDE.md`, `/Users/point/Downloads/Coin Quest Ledger/HANDOFF.md`, `/Users/point/Downloads/Character Profile (standalone) (1).html`, and `/Users/point/Downloads/Coin Quest Ledger/party-ledger/character.html`.
- Admin Portal handoff notes are in `ADMIN.md`; Admin reference files are under `/Users/point/Downloads/admin/`.

`CLAUDE_RECOVERY.md` is currently ignored/deprecated by user instruction. Do not use it unless the user explicitly re-enables it.

See `claude-design-index.md` for the full reference map and per-surface notes.

## Testing And Deployment

Core commands:

```bash
npm run test:syntax
npm run test:assets
npm run test:unit
npm run test:e2e
npm test
npm run serve
```

Playwright projects cover desktop Chromium, tablet, and mobile. Responsive or shared-shell work should be checked across breakpoints.

Production deploy flow:

```bash
npm test
git add <focused files>
git commit -m "<focused message>"
git push origin main
vercel --prod --yes
vercel alias set <deployment-url> coin-quest-ledger.vercel.app
curl -fsSL https://coin-quest-ledger.vercel.app/<changed-route> | rg "<expected-marker>"
```

## Hard Invariants

- Keep the app static/no-build unless the user explicitly chooses a framework migration.
- Do not modify legacy inactive snapshots unless explicitly asked.
- Do not commit large Claude offline HTML/zip artifacts.
- Do not drop Party Ledger `sound.jsx` from Claude split references; SFX are WebAudio code there.
- Preserve i18n for user-facing text.
- Preserve newest user requirements over older handoffs.
- Preserve Firebase state shape unless doing a planned migration with regression coverage.
- Keep XP/level formulas centralized in `shared/pointy-logic.js` and documented in `leveling-canon.md`.
