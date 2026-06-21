# Claude Design Index

Last updated: 2026-06-21

## Purpose

This index maps Claude Design reference files to live app surfaces so future work can start from the right source without re-opening giant artifacts first. Claude references are source-of-truth for requested visual/interaction ports, but the live implementation must preserve newer user requirements, data contracts, i18n, and tests.

Current user instruction: do not use `CLAUDE_RECOVERY.md` unless explicitly re-enabled.

## Reference Map

| Surface | Live files | Claude/reference source | Use for | Notes |
| --- | --- | --- | --- | --- |
| Home / module launcher | `index.html` | Current live repo plus any fresh Claude export supplied by user | Home view layout, launcher cards, mobile handoff details | Historical split zips may be absent; verify before use. |
| Party Ledger / Split | `trip/index.html`, `trip/app.js`, `trip/pixicons.jsx` | Current live repo plus any fresh Party Ledger export supplied by user | Party UI, interactions, animation, category icons, SFX | If split source includes `sound.jsx`, preserve it; SFX are WebAudio code. |
| Party assets | `assets/rpg-portraits/`, `assets/icons/` | Current live assets plus any fresh Claude resource export supplied by user | Extracted PNG/font resources | Keep large resources outside Git unless intentionally adding optimized assets. |
| Character Profile | `character/index.html`, `character/app.js` | Current live repo, `/Users/point/Downloads/CLAUDE.md`, `/Users/point/Downloads/HANDOFF.md`, and any fresh standalone Character Profile export supplied by user | Character banner, ID card, mobile responsive layout, trophies/account presentation, User ID, My Boards | Latest live loop includes side-panel full-profile route. |
| Admin Portal | `admin/index.html`, `admin/app.js`, `admin/admin.css` | `ADMIN.md`, current live repo, `/Users/point/Downloads/CLAUDE.md`, `/Users/point/Downloads/HANDOFF.md`, and any fresh Admin export supplied by user | Admin layout vocabulary, tables, detail panels, tabs, modals, relationship views, ops tools | Production gate is Firebase Google Auth allowlisted to `purich.wc@gmail.com`; local gate exists only under `?test=1`. |
| Shared mobile shell | `shared/mobile-shell.js`, `shared/mobile-shell.css` | Party Ledger/HomeView mobile references | Phone drawer and bottom tabs | Keep centralized; hidden above `600px`. |
| Profile/Login | `shared/profile-hub.js`, `shared/profile-hub.css`, `shared/profile-*.js` | Latest `CLAUDE.md` / `HANDOFF.md` plus live implementation | Real username/password Sign In/Sign Up, Character Creation, profile drawer, My Boards, logout, backup/restore, Recovery ID | Production uses Firebase Auth/Firestore with internal `@coinquest.local` emails; local fixtures exist only under `?test=1`. Mobile profile entry is through hamburger drawer. |

## Party Ledger Recovery Bundle

Older sessions used split Party Ledger zips and full offline HTML exports. Do not assume those files still exist. When the user re-exports them, prefer the smallest source that covers the requested surface and keep large artifacts out of Git.

Workflow:

1. Start with the smallest split zip that covers the surface.
2. Inspect DOM/component structure, class names, spacing, interactions, animations, and assets.
3. Fall back to the full offline HTML only when all-in-one behavior must be verified.
4. Do not commit the zips or giant offline HTML.

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

Open mobile decisions:

- Whether Character Profile should stay standalone with `cnav` or also include shared mobile shell.

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
