# Coin Quest Ledger Architecture

Last updated: 2026-06-20

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
- Admin tool for listing/editing boards, users, active characters, Board Admin metadata, passwords, drafts, publishing, revision logs, support tools, relationship views, and user lifecycle.
- Production access uses Firebase Google Auth and only allows `purich.wc@gmail.com`. The old local gate remains only under `?test=1` for automated tests.
- User lifecycle is two-stage: recoverable `archived` / `deactivated` / `active` status is written to Firestore by the Super Admin UI, and permanent delete is delegated to `/api/admin-delete-user` using Firebase Admin SDK after verifying the Google-auth ID token. Permanent delete removes the Auth user, user doc, and character docs, but keeps a deleted reusable username tombstone so recreating the same username restores the same public User ID/Character ID.
- `/api/admin-delete-status` is a non-secret readiness endpoint for the Admin UI. It reports whether Vercel has the Firebase Admin service-account env vars needed for privileged delete, so production can disable permanent delete when backend credentials are missing.
- Responsive model is admin-specific: below `1000px` the sidebar becomes a horizontal scroll nav; below `900px` Relationship Map stacks; below `760px` topbar/actions compress, dense tables scroll, and modals render as bottom sheets; coarse-pointer tablets get 44px touch targets.
- Real private admin access requires Firebase Auth and deployed Firestore Security Rules.

## Shared Modules

- `shared/pointy-logic.js`: shared data normalization, split math, price math, class registry, level helpers, and character profile aggregation.
- `lang.js`: Thai/English shared labels.
- `shared/firebase-client.js`: shared Firebase app/Auth/Firestore initializer for static pages.
- `shared/account-scope.js`: account-scoped local storage helper. Module progress/cache keys derive from the active `pointy_auth_v1` account (`uid`, then User ID, then username) so a signed-in account does not inherit stale browser-wide progress.
- `shared/profile-hub.js` / `.css`: username/password Sign In/Sign Up, Firebase Auth + Firestore user/character binding in production, local mock fallback for tests, one-time Character Creation, topbar/mobile-drawer profile entry, profile drawer, My Boards, theme/language helpers, backup/restore, sign out.
- `shared/mobile-shell.js` / `.css`: phone-only hamburger drawer and bottom tab bar for Home/Compare, Split, Debt, Prices, and Treasury. Tablet/touch remains CSS-only in each surface plus shared profile CSS.
- `shared/first-load.js` / `.css`: first-load splash.
- `shared/cloudinary-assets.js` and `shared/asset-urls.js`: production asset URL resolution.

Shared modules are browser globals. Keep additions conservative and compatible with static script loading order.

## Identity Model

Current product model has separate identities:

- User ID: account/person identity. Production signups use Firebase Auth with username/password via an internal `@coinquest.local` auth email, then store profile data in `users/{uid}`. Local/test fallback still stores mirrors in `localStorage.pointy_auth_v1`.
- Character ID: playable hero identity, four digits, stored in trip participant maps and `characters/{id}`.
- Admin ID: Board Admin identity, can own multiple boards and intentionally repeat across boards.
- Board ID / Trip ID: four-digit route/document ID for a board.

The latest Claude loop implemented in the live static app treats one account as having one active character. The broader product model can still evolve toward multiple characters per user later. One user can still have many admin IDs. One admin ID can own many boards. Do not globally de-dupe Admin IDs unless the user changes the requirement.

## Persistence

Normal mode:

- `trips/{id}`: Party Ledger board documents.
- `users/{uid}`: Firebase Auth account profile, public User ID, username, and active character pointer.
- `usernames/{username}`: username lookup and recovery pointer for the internal Firebase Auth email currently attached to a public username.
- `characters/{id}`: character records.
- `adminRevisions/{id}`: Super Admin publish logs.

`firestore.rules` is the repository copy of the deployed rules. It keeps the current real-account loop usable, includes a Super Admin helper for the allowlisted Gmail `purich.wc@gmail.com`, restricts character writes to the owning account or Super Admin, prevents username mapping takeover, permits only same-ID reclamation of reusable deleted username tombstones, and restricts `adminRevisions` to Super Admin. Deploy through `firebase.json` with `npx firebase-tools deploy --only firestore:rules --project pointy-personal-toolkit`.

Local/test mode:

- `sessionStorage.pointy_test_trip_*`: test trip fixtures.
- `localStorage.<module-key>::<account-scope>`: signed-in account progress/cache for profile streaks, character registry fallback, trip snapshots, Debt Dragon, Treasury, Compare, and the last opened trip. Unsuffixed legacy keys are still read only where required for guest/test compatibility.
- `localStorage.pointy_character_registry_v1`: legacy local character registry/cache for guest/test compatibility; signed-in accounts use the scoped variant.
- `localStorage.pointy_auth_v1`: local mirror of current auth account, including selected/created character. It is authoritative only in tests/local fallback.
- `localStorage.pointy_accounts_v1`: local fallback Sign Up registry for tests and mock mode.
- `localStorage.pointy_theme`: global theme source of truth.
- `localStorage.coin_quest_ui_v1.theme`: compatibility mirror for older/shared UI.
- Module-specific local stores exist for Debt Dragon, Treasury, Price Arena, drafts, and settings.

Persistence changes require careful migration thinking and targeted tests at minimum.

See `data-contracts.md` for the practical shape of `trips`, `characters`, `adminRevisions`, mock auth, local stores, and derived Character Profile data.

## Design Sources

Claude Design remains the Holy Grail for requested visual ports:

- Party Ledger canon and split references live outside Git in `/Users/point/Downloads/Coin Quest Ledger - Claude Recovery Bundle/`.
- Current Character/Profile loop references came from `/Users/point/Downloads/Coin Quest Ledger/CLAUDE.md`, `/Users/point/Downloads/Coin Quest Ledger/HANDOFF.md`, `/Users/point/Downloads/Character Profile (standalone) (1).html`, and `/Users/point/Downloads/Coin Quest Ledger/party-ledger/character.html`.
- Admin Portal handoff notes are in `ADMIN.md`; the newest Admin reference files are under `/Users/point/Downloads/Coin Quest Ledger/admin/`, with related standalone HTML at `/Users/point/Downloads/Coin Quest Ledger/Admin Portal.html`.

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
