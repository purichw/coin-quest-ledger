# Claude Design Index

Last updated: 2026-06-19

## Purpose

This index maps Claude Design reference files to live app surfaces so future work can start from the right source without re-opening giant artifacts first. Claude references are source-of-truth for requested visual/interaction ports, but the live implementation must preserve newer user requirements, data contracts, i18n, and tests.

Current user instruction: do not use `CLAUDE_RECOVERY.md` unless explicitly re-enabled.

## Reference Map

| Surface | Live files | Claude/reference source | Use for | Notes |
| --- | --- | --- | --- | --- |
| Home / module launcher | `index.html` | `Party Ledger HomeView Reference.zip` | Home view layout, launcher cards, mobile handoff details | Use split zip first. |
| Party Ledger / Split | `trip/index.html`, `trip/app.js`, `trip/pixicons.jsx` | `Party Ledger Internals Source.zip`, `Party Ledger Full Split Reference.zip`, `Party Ledger (offline).html` | Party UI, interactions, animation, category icons, SFX | SFX are WebAudio in `sound.jsx`; do not drop it. |
| Party assets | `assets/rpg-portraits/`, `assets/icons/` | `Party Ledger Resources.zip` | Extracted PNG/font resources | Keep large resources outside Git unless intentionally adding optimized assets. |
| Character Profile | `character/index.html`, `character/app.js` | `/Users/point/Downloads/Character Profile (standalone).html` | Character banner, ID card, mobile responsive layout, trophies/account presentation | Includes mobile CSS. Does not mention side panel/profile drawer route wiring. |
| Admin Portal | `admin/index.html`, `admin/app.js`, `admin/admin.css` | `/Users/point/Downloads/admin/` and `ADMIN.md` | Admin layout vocabulary, tables, detail panels, modals, relationship views | Phase 1 live gate is local only, not real security. |
| Shared mobile shell | `shared/mobile-shell.js`, `shared/mobile-shell.css` | Party Ledger/HomeView mobile references | Phone drawer and bottom tabs | Keep centralized; hidden above `600px`. |
| Profile/Login | `shared/profile-hub.js`, `shared/profile-hub.css` | Live implementation plus Claude visual direction | Mock login, profile drawer, logout, backup/restore | Real auth is future roadmap work. |

## Party Ledger Recovery Bundle

Folder:

```text
/Users/point/Downloads/Coin Quest Ledger - Claude Recovery Bundle/
```

Files:

- `Party Ledger HomeView Reference.zip`: small Home/module launcher reference.
- `Party Ledger Internals Source.zip`: app/module JSX/CSS source, including `sound.jsx`.
- `Party Ledger Resources.zip`: extracted PNG/font resources.
- `Party Ledger Full Split Reference.zip`: source, template, and resources together.
- `Party Ledger (offline).html`: full offline canon; use only when split references are insufficient.
- `Admin Portal (offline).html`: Admin reference artifact in the bundle.

Workflow:

1. Start with the smallest split zip that covers the surface.
2. Inspect DOM/component structure, class names, spacing, interactions, animations, and assets.
3. Fall back to the full offline HTML only when all-in-one behavior must be verified.
4. Do not commit the zips or giant offline HTML.

## Character Profile Reference Notes

Source:

```text
/Users/point/Downloads/Character Profile (standalone).html
```

Known facts:

- It is a large one-line standalone bundle; use Node/string extraction instead of raw `rg` when inspecting snippets.
- It includes viewport metadata and mobile CSS breakpoints around `600px` and `360px`.
- It has Character-specific responsive layout: `cnav`, `wrap`, `banner`, `idcard`, `ribbon`, `mods`, `trophies`, `acct`.
- It reads `pointy_auth_v1` for account display.
- It has a back link to `index.html` in the standalone reference.
- It does not contain `Side Panel`, `drawer`, `profile drawer`, `hamburger`, `mobile-shell`, or direct route wiring from a profile side panel.

Live integration decision:

- If Character Profile should be opened from Side Panel/Profile Drawer, implement that in `shared/profile-hub.*` or shared shell intentionally. Do not claim Claude specified that route.

## Admin Reference Notes

Primary handoff folder:

```text
/Users/point/Downloads/admin/
```

Files previously studied:

- `Admin Portal.html`
- `admin.css`
- `app.jsx`
- `data.jsx`
- `screens-boards.jsx`
- `screens-ops.jsx`
- `screens-overview.jsx`
- `screens-people.jsx`
- `ui.jsx`

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

Open mobile decisions:

- Whether Character Profile should stay standalone with `cnav` or also include shared mobile shell.
- Whether Admin Portal should get a separate admin-specific mobile navigation or remain utility/table-first.

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
