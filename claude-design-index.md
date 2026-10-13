# Claude Design Index

Last updated: 2026-07-07

## Purpose

This index maps Claude Design reference files to live app surfaces so future work can start from the right source without re-opening giant artifacts first. Claude references are source-of-truth for requested visual/interaction ports, but the live implementation must preserve newer user requirements, data contracts, i18n, and tests.

Current user instruction: do not use `archive/CLAUDE_RECOVERY.md` unless explicitly re-enabled.

For exact implementation requests, especially when the user says "to a tee",
invoke `$claude-to-a-tee` and follow `CLAUDE_TO_A_TEE_QA.md` before commit or
deploy. Use `browser:control-in-app-browser` to inspect the offline Claude HTML
source and `vercel:agent-browser` to verify the live/local implementation across
desktop, tablet, and mobile viewports.

## Reference Map

| Surface | Live files | Claude/reference source | Use for | Notes |
| --- | --- | --- | --- | --- |
| Home / module launcher | `index.html` | Current live repo plus any fresh Claude export supplied by user | Home view layout, launcher cards, mobile handoff details | Historical split zips may be absent; verify before use. |
| Party Ledger / Split | `trip/index.html`, `trip/app.js`, `trip/pixicons.jsx` | Current live repo plus any fresh Party Ledger export supplied by user | Party UI, interactions, animation, category icons, SFX | If split source includes `sound.jsx`, preserve it; SFX are WebAudio code. |
| Party assets | `assets/rpg-portraits/`, `assets/icons/` | Current live assets plus any fresh Claude resource export supplied by user | Extracted PNG/font resources | Keep large resources outside Git unless intentionally adding optimized assets. |
| Character Profile | `character/index.html`, `character/app.js` | Current live repo, `/Users/point/Downloads/CLAUDE.md`, `/Users/point/Downloads/HANDOFF.md`, and any fresh standalone Character Profile export supplied by user | Character banner, ID card, mobile responsive layout, trophies/account presentation, User ID, My Boards | Latest live loop includes side-panel full-profile route. |
| Admin Portal | `admin/index.html`, `admin/app.js`, `admin/admin.css` | `ADMIN.md`, current live repo, `/Users/point/Downloads/CLAUDE.md`, `/Users/point/Downloads/HANDOFF.md`, and any fresh Admin export supplied by user | Admin layout vocabulary, tables, detail panels, tabs, modals, relationship views, ops tools | Production gate is Firebase Google Auth allowlisted to `purich.wc@gmail.com`; local gate exists only under `?test=1`. |
| Shared web navigation and Home | `shared/mobile-shell.js`, `shared/navigation.css`, `shared/home.js`, `shared/home.css`, `shared/quest-icons.js` | October 13 Desktop / Tablet / Mobile Home mockups | One-row desktop, two-row tablet, compact phone utilities and bottom tabs; illustrated Home and live quick actions | Web only; see `docs/navigation-redesign-2026-10-13/README.md`. |
| Profile/Login | `shared/profile-hub.js`, `shared/profile-hub.css`, `shared/profile-*.js` | Latest `CLAUDE.md` / `HANDOFF.md` plus live implementation | Real username/password Sign In/Sign Up, Character Creation, profile drawer, My Boards, logout, backup/restore, Recovery ID | Production uses Firebase Auth/Firestore with internal `@coinquest.local` emails; local fixtures exist only under `?test=1`. Phone profile entry is the header avatar or overflow menu. |
| Player native app MVP | `mobile/` Expo / React Native app | `/Users/point/Downloads/Coin iOS Android/CLAUDE.md`, `/Users/point/Downloads/Coin iOS Android/HANDOFF.md`, `/Users/point/Downloads/Coin iOS Android/MOBILE-EXPORTS.md`, `/Users/point/Downloads/Coin iOS Android/Coin Quest Ledger (iOS App).html`, `/Users/point/Downloads/Coin iOS Android/Coin Quest Ledger (Android App).html` | Native player UX for iOS and Android: springboard, auth, character creation, home, Split, Debt, Treasury, Compare, profile sheet, Character page, reminders, sheets, tabs, FAB/plus, platform chrome | Player side only. Current `mobile/` runtime shares Firebase Auth/Firestore with the web app for account, character, profile, Split, and native-owned `playerModules/{uid}` for Debt/Treasury/Compare. Design parity must be checked before real device builds, and static Claude/sample financial data must never replace real backend state. |

## Party Ledger Recovery Bundle

Older sessions used split Party Ledger zips and full offline HTML exports. Do not assume those files still exist. When the user re-exports them, prefer the smallest source that covers the requested surface and keep large artifacts out of Git.

Workflow:

1. Start with the smallest split zip that covers the surface.
2. Inspect DOM/component structure, class names, spacing, interactions, animations, and assets.
3. Fall back to the full offline HTML only when all-in-one behavior must be verified.
4. Do not commit the zips or giant offline HTML.

## Party Ledger Locked Notes

- Claude Design fidelity means component-level fidelity. For the expense form and quest log, compare the live components against the offline HTML/CSS values for padding, radius, font size/weight, border style, dimensions, and mobile overrides.
- Exact keyword expansion lives in `CLAUDE_TO_A_TEE_QA.md`: whenever the user says "to a tee", treat it as `CLAUDE TO A TEE AUDIT. Implement from the offline Claude HTML exactly at component level, mobile included, and verify before commit/deploy.`
- Locked micro-cosmetic examples: quest-row close button is a centered 22px circle; `Attach receipt` is the compact dashed button; `Whole party` is the compact dashed pill; split segments should retain Claude mobile proportions and must not cause page-level horizontal overflow on iPhone SE / iPhone / iPhone Pro Max.
- Character add flow: real account-linked heroes are invited by existing Character ID only. Guest heroes are board-local only and do not create Character IDs or registry records. See `INVITES_AND_GUESTS.md`.
- Settlement flow: use pairwise per-expense obligations and reciprocal netting, not global net rerouting.

## Character Profile Reference Notes

Use current live `/character/`, current Downloads `CLAUDE.md` / `HANDOFF.md`, and any fresh standalone Character Profile export the user supplies.

Known facts:

- It is a large one-line standalone bundle; use Node/string extraction instead of raw `rg` when inspecting snippets.
- It includes viewport metadata and mobile CSS breakpoints around `600px` and `360px`.
- It has Character-specific responsive layout: `cnav`, `wrap`, `banner`, `idcard`, `ribbon`, `mods`, `trophies`, `acct`.
- It reads `pointy_auth_v1` for account display.
- It has a back link to `index.html` in the standalone reference.
- The newest `CLAUDE.md` / `HANDOFF.md` says `party-ledger/character.html` is linked from the Hero Profile side panel's full-profile button and includes a User ID chip plus My Boards section.

Current live implementation:

- `shared/profile-hub.*` now implements the full-profile link from the profile drawer.
- Mobile access goes through the shared hamburger drawer's Profile item.
- `/character/` now includes My Boards actions in the live static implementation.

## Admin Reference Notes

If the user supplies a fresh Admin source export, useful files usually include:

- `Admin Portal.html`
- `admin.css`
- `app.jsx`
- `data.jsx`
- `screens-boards.jsx`
- `screens-ops.jsx`
- `screens-overview.jsx`
- `screens-people.jsx`
- `ui.jsx`

Current conflict resolution:

- Source files are more actionable than damaged/offline-only HTML when both are available.
- Older admin copy allowed many Characters per User. The live player/auth canon
  remains one active Character per User ID unless the user explicitly changes it.
- Relationship Map should show User -> active Character -> Boards and User ->
  Admin IDs -> owned Boards.

Claude vocabulary to preserve when porting Admin work:

- `page-head`
- `card`
- `stat`
- `tbl`
- `detail-grid`
- `profile-card`
- `log-list`
- modal patterns

Do not restore legacy `panel`/ad hoc table markup if it visibly diverges from the supplied Admin design.

## Mobile Coverage Notes

Known mobile coverage from references:

- Character standalone includes mobile CSS, but not shared app drawer/bottom tab integration.
- Party Ledger/HomeView references include the mobile shell concept.
- Live shared mobile shell currently covers Home/Compare, Split, Debt Dragon, and Treasury.
- Live tablet/touch support follows the 2026-06-20 Claude exports: player modules keep desktop/tablet topbars above `600px`, add coarse-pointer 44px hit targets, and use `601-820px` grid refinements where needed.
- Live Admin Portal follows the latest Admin mobile/tablet export pattern: horizontal scroll admin nav under `1000px`, Relationship Map stack under `900px`, compressed topbar/actions under `760px`, scrollable dense tables, 44px tablet touch targets, and phone bottom-sheet modals.
- Fresh native-player exports in `/Users/point/Downloads/Coin iOS Android/` were visually studied on 2026-06-21. iOS uses a black device frame, Dynamic Island live activity, large-title spacing, a five-slot bottom tab bar with a raised center `+`, and iOS-style bottom sheets. Android uses a Pixel frame, hole-punch camera, Android status chip live activity, Material 3 Navigation Bar with four tabs, a separate green FAB, Google-search springboard pill, and the same sheet content. Both share the same player screens and sample design content.
- Standalone native offline HTMLs render layout/chrome cleanly via localhost, but in this inspection the packed avatar/dragon data URI fallback resolved at runtime to `data:image/png` without the full payload and portraits/dragons appeared as blank fallback boxes. For pixel-perfect art inspection, prefer fresh `.dc.html` source plus asset folder or rebuild/verify the standalones with `MOBILE-EXPORTS.md` Recipe C before treating portrait/dragon pixels as authoritative.
- Native implementation lesson from the first iPhone install: the user rejected the initial bland/static-looking build because it did not resemble Claude Design closely enough and some flows were not genuinely dynamic. Future native passes must start with a visual parity checklist against the Claude iOS/Android exports, then verify real Firebase data, before spending time on Xcode device builds.
- The native app can deviate from Claude copy/sample data when product requirements differ, but not from the intended interaction quality. Preserve backend contracts and web requirements first, then match Claude chrome, spacing, component hierarchy, sheets, tabs, cards, and visual density as closely as practical.

Open mobile decisions:

- Whether Character Profile should stay standalone with `cnav` or also include shared mobile shell.
- Whether the web Debt/Treasury/Compare localStorage contracts should migrate into the same `playerModules/{uid}` Firestore shape used by native, or whether native keeps this bridge until a broader data migration.

Closed mobile decisions:

- Admin Portal keeps admin-specific navigation rather than adopting the player bottom tab bar. The player shell is for Home/Compare, Split, Debt, Prices, and Treasury phone widths only; tablet keeps the desktop/topbar model with touch-comfort CSS.

## Inspection Tips

For huge one-line HTML references, use Node snippets:

```bash
node - <<'NODE'
const fs = require('fs');
const file = '/path/to/reference.html';
const s = fs.readFileSync(file, 'utf8');
for (const needle of ['Side Panel', 'drawer', 'banner', 'mobile']) {
  const idx = s.indexOf(needle);
  console.log('\\n===', needle, idx, '===');
  if (idx >= 0) console.log(s.slice(Math.max(0, idx - 300), idx + 800).replace(/\\n/g, '\n').replace(/\\"/g, '"'));
}
NODE
```

Avoid dumping embedded base64/PNG data into the terminal.

## Porting Rules

- Match structure and semantics first, then colors/spacing.
- Rework live DOM when needed for fidelity; do not paste CSS onto incompatible markup and call it done.
- Preserve live state shape, Firebase sync, i18n, tests, newer user requirements, and accessibility basics.
- Before recreating assets/sounds, inspect the reference because they are often embedded or already extracted.
- When the request is exact/fidelity-sensitive, document the checked viewports and components using `CLAUDE_TO_A_TEE_QA.md`.
