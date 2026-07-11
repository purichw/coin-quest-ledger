# Claude Design Recovery Pack

Archived/deprecated: do not use this file by default. The current handoff canon
lives in `Memory.md`, `PLAYBOOK.md`, `architecture.md`, `roadmap.md`,
`claude-design-index.md`, `CLAUDE_TO_A_TEE_QA.md`, `SITE_MAP_AND_INTERACTIONS.md`,
`PROJECT_STRUCTURE_GUIDE.md`, `ACCOUNT_MANAGEMENT_IMPLEMENTATION.md`,
`ADMIN_PORTAL_IMPLEMENTATION.md`, `SECURITY_AND_FIREBASE_RULES.md`, and the
fresh Claude reference files the user supplies. This file remains only as
historical recovery context.

Last updated: 2026-07-07

Use this file when the original Claude Design project is lost or inaccessible.
It is not a backup of Claude's internal project state. It is a reconstruction
pack: upload or paste it into a new Claude Project together with the listed
reference files so Claude can resume from the same design and product context.

## Short Answer

If Claude Design says the deleted project cannot be restored, assume it cannot
be recovered directly. What we can still do is rebuild the working context from:

- The live repository in `/Users/point/toolbox`.
- The project memory files in this repo.
- The downloaded Claude handoff files still present in `/Users/point/Downloads`.
- The deployed app at `https://coin-quest-ledger.vercel.app`.

This should be enough for a new Claude Project to continue design work without
starting from zero.

## How To Recreate The Claude Project

1. Create a new Claude Project named `Coin Quest Ledger / Claude Design Recovery`.
2. Historical instruction only: this old bundle originally added these repo
   files to project knowledge, but current work should start from the docs
   listed in the archive banner above instead:
   - `/Users/point/toolbox/CLAUDE_RECOVERY.md`
   - `/Users/point/toolbox/Memory.md`
   - `/Users/point/toolbox/PLAYBOOK.md`
   - `/Users/point/toolbox/ADMIN.md`
3. Add the newest relevant downloaded Claude source files from the index below.
4. Start the new Claude chat with the prompt in `Recovery Prompt`.
5. Ask Claude for an understanding check before code or design output.
6. For any new Claude output, save a copy back to Downloads or this repo so the
   next accidental deletion is survivable.

## Ready-Made Upload Bundle

A Claude-ready recovery folder can be built at:

```text
/Users/point/Downloads/Coin Quest Ledger - Claude Recovery Bundle/
```

It contains:

- `README_FOR_CLAUDE.md`
- `CLAUDE_RECOVERY.md`
- `Memory.md`
- `PLAYBOOK.md`
- `ADMIN.md`
- `Party Ledger (offline).html`
- `Admin Portal (offline).html`
- `Party Ledger HomeView Reference.zip`
- `Party Ledger Internals Source.zip`
- `Party Ledger Resources.zip`
- `Party Ledger Full Split Reference.zip`

Upload the folder contents, or upload the zip created from that folder, into a
new Claude Project. The two HTML files are intentionally copied into the bundle
so Claude can inspect the actual design canon directly.

The repo keeps the Party Ledger offline canon as a committed zip copy:

```text
/Users/point/toolbox/claude-recovery/party-ledger-offline.zip
```

The split Party Ledger references are for easier Claude ingestion:

```text
/Users/point/Downloads/Coin Quest Ledger - Claude Recovery Bundle/Party Ledger HomeView Reference.zip
/Users/point/Downloads/Coin Quest Ledger - Claude Recovery Bundle/Party Ledger Internals Source.zip
/Users/point/Downloads/Coin Quest Ledger - Claude Recovery Bundle/Party Ledger Resources.zip
/Users/point/Downloads/Coin Quest Ledger - Claude Recovery Bundle/Party Ledger Full Split Reference.zip
```

Recommended usage:

- Start with `Party Ledger HomeView Reference.zip` for HomeView/module launcher work.
- Use `Party Ledger Internals Source.zip` for JSX/CSS/module logic inspection.
- Add `Party Ledger Resources.zip` only when exact PNG/font assets are needed.
- Use the full offline canon zip/HTML when checking pixel-perfect behavior or all embedded assets together.
- Do not omit `sources/sound.jsx`; Party Ledger SFX are WebAudio code there. The offline manifest has no separate `audio/*` files.

## Recovery Prompt

```text
Historical prompt only. For current work, read `Memory.md`, `PLAYBOOK.md`,
`architecture.md`, `roadmap.md`, `claude-design-index.md`, `CLAUDE_TO_A_TEE_QA.md`,
`SITE_MAP_AND_INTERACTIONS.md`, `PROJECT_STRUCTURE_GUIDE.md`, and the relevant
implementation runbooks first.

Read CLAUDE_RECOVERY.md, Memory.md, PLAYBOOK.md, and ADMIN.md first.

You are helping with Coin Quest Ledger. Treat the listed Claude Design HTML,
JSX, CSS, and markdown handoff files as the visual and interaction Holy Grail
for their requested surfaces. The implementation must stay almost pixel-perfect
to Claude Design unless the newest user requirement explicitly conflicts.

Do not edit Downloads reference files directly. Work against /Users/point/toolbox.
Newest user requirements prevail over older prototypes. Preserve existing app
functionality, Firebase state shape, i18n, responsive behavior, tests, and
production deployment requirements.

Before making changes, summarize:
1. Which source files you will use as canon.
2. Which live repo files you will touch.
3. Any conflicts between the Claude source and current requirements.
```

## Current Project Facts

- Repo: `/Users/point/toolbox`
- GitHub: `git@github.com:purichw/coin-quest-ledger.git`
- Production: `https://coin-quest-ledger.vercel.app`
- Vercel project: `coin-quest-ledger`
- Firebase project ID: `pointy-personal-toolkit`
- The Firebase project ID is intentionally legacy/internal. Do not migrate it
  just for naming aesthetics. A migration is a separate infrastructure/security
  phase with backup, data copy, regression testing, and rollback.
- The old Vercel alias/project-domain `pointy-super-app.vercel.app` was removed
  from the Vercel project domains. Do not re-add it.
- App architecture is no-build static HTML/CSS/JS.
- Production assets now use Cloudinary for heavy image assets. Local assets are
  kept for tests/reference, and `assets/` is ignored by Vercel deploy.
- Do not write secrets into docs or source. Keep provider secrets in local env
  files or Vercel env vars only.

## Recent Recovery Actions

- Created `CLAUDE_RECOVERY.md` and added it to repo memory.
- Created `/Users/point/Downloads/Coin Quest Ledger - Claude Recovery Bundle/`.
- Copied `Party Ledger (offline).html` and `Admin Portal (offline).html` into that bundle.
- Committed Party Ledger offline canon as `claude-recovery/party-ledger-offline.zip`.
- Replaced the earlier committed raw HTML with the smaller zip copy.
- Split Party Ledger into smaller Claude-friendly packages:
  - HomeView-only reference (~41KB).
  - Internals/source reference (~175KB), including `sound.jsx`.
  - Resources reference (~15MB).
  - Full split reference (~16MB).
- Verified the split internals zip includes `sound.jsx`; no `audio/*` resources were present in the manifest.

## Live App Surfaces

- Home / module launcher: `/Users/point/toolbox/index.html`
- Compare Prices: part of the home app.
- Split Expenses / Party Ledger: `/Users/point/toolbox/trip/index.html` and
  `/Users/point/toolbox/trip/app.js`
- Debt Dragon: `/Users/point/toolbox/debt/`
- Treasury: `/Users/point/toolbox/treasury/`
- Character Profile: `/Users/point/toolbox/character/`
- Super Admin Portal Phase 1: `/Users/point/toolbox/admin/`
- Shared logic: `/Users/point/toolbox/shared/pointy-logic.js`
- Shared mobile shell: `/Users/point/toolbox/shared/mobile-shell.css` and
  `/Users/point/toolbox/shared/mobile-shell.js`
- Shared i18n: `/Users/point/toolbox/lang.js`

## Claude Design Canon

Claude Design output is the Holy Grail for visual and interaction fidelity.
When source HTML/JSX/CSS exists, study it deeply instead of approximating.

Rules:

- Match structure, spacing, colors, border radii, shadows, typography, state,
  interactions, animations, and assets as closely as possible.
- If the live markup cannot match the Claude reference, rework the live markup.
  A real rework is better than compatibility CSS that creates overflow or broken
  containers.
- Newest user requirements beat older Claude prototypes.
- Do not add visible instructional text to the app unless the reference design
  or newest requirement includes it.
- Preserve current app behavior and data contracts.
- Responsive work must protect desktop, tablet, and mobile at the same time.

Admin Portal-specific canon:

- The Admin Portal must use the Claude vocabulary and layout primitives:
  `page-head`, `card`, `stat`, `tbl`, `detail-grid`, `profile-card`,
  `log-list`, and modal patterns.
- Do not restore legacy ad hoc table/panel markup if it diverges visually.

## Product Decisions To Preserve

- Board Admin IDs may repeat across boards. One admin can own multiple boards.
- Board URL/short code uniqueness matters.
- Trip URLs use short four-digit codes.
- Character IDs use four-digit public IDs.
- Character Profile is available at `/character/?id=1234`.
- Board Admin has an ID and nickname.
- Admin can see which boards they own.
- Super Admin Phase 1 local gate is not real security.
- True private admin access requires Firebase Auth plus Firestore Security Rules.
- Save in Admin Portal is local draft storage.
- Restore resets edits to the latest published snapshot.
- Publish writes changes and revision logs.
- Compare Prices is a tool/module, not a board.
- Global theme source of truth is `localStorage.pointy_theme`, mirrored to
  `coin_quest_ui_v1.theme`.

## Downloaded Reference File Index

These files still existed on disk on 2026-06-18. Prefer the newest relevant
file for each surface when there are multiple versions.

Top-level handoff and offline files:

```text
/Users/point/Downloads/ADDITIONS.md
/Users/point/Downloads/ADMIN_PORTAL.md
/Users/point/Downloads/Admin Portal (offline).html
/Users/point/Downloads/Admin Portal.html
/Users/point/Downloads/CLAUDE (1).md
/Users/point/Downloads/CLAUDE (2).md
/Users/point/Downloads/CLAUDE (3).md
/Users/point/Downloads/DEBT_DRAGON.md
/Users/point/Downloads/PROFILE_AND_REMINDERS.md
/Users/point/Downloads/Party Ledger (offline) (4).html
/Users/point/Downloads/Party Ledger (offline).html
```

Admin Portal React/CSS source folder:

```text
/Users/point/Downloads/admin/Admin Portal.html
/Users/point/Downloads/admin/admin.css
/Users/point/Downloads/admin/app.jsx
/Users/point/Downloads/admin/data.jsx
/Users/point/Downloads/admin/screens-boards.jsx
/Users/point/Downloads/admin/screens-ops.jsx
/Users/point/Downloads/admin/screens-overview.jsx
/Users/point/Downloads/admin/screens-people.jsx
/Users/point/Downloads/admin/ui.jsx
```

User-facing React/CSS source files:

```text
/Users/point/Downloads/app.jsx
/Users/point/Downloads/profile.jsx
/Users/point/Downloads/reminders.jsx
/Users/point/Downloads/state.jsx
/Users/point/Downloads/styles.css
/Users/point/Downloads/treasury.jsx
```

Known file sizes and timestamps at recovery time:

```text
2026-06-17 10:49 | 6925 bytes | /Users/point/Downloads/ADDITIONS.md
2026-06-17 15:53 | 10816 bytes | /Users/point/Downloads/ADMIN_PORTAL.md
2026-06-18 08:47 | 1793458 bytes | /Users/point/Downloads/Admin Portal (offline).html
2026-06-17 21:19 | 1580 bytes | /Users/point/Downloads/Admin Portal.html
2026-06-17 10:49 | 12558 bytes | /Users/point/Downloads/CLAUDE (1).md
2026-06-17 15:52 | 19466 bytes | /Users/point/Downloads/CLAUDE (2).md
2026-06-18 11:41 | 23616 bytes | /Users/point/Downloads/CLAUDE (3).md
2026-06-16 15:15 | 17179 bytes | /Users/point/Downloads/DEBT_DRAGON.md
2026-06-17 15:53 | 15065 bytes | /Users/point/Downloads/PROFILE_AND_REMINDERS.md
2026-06-17 20:30 | 22055949 bytes | /Users/point/Downloads/Party Ledger (offline) (4).html
2026-06-18 11:38 | 22097126 bytes | /Users/point/Downloads/Party Ledger (offline).html
2026-06-17 21:33 | 1580 bytes | /Users/point/Downloads/admin/Admin Portal.html
2026-06-17 21:33 | 24492 bytes | /Users/point/Downloads/admin/admin.css
2026-06-17 21:33 | 5498 bytes | /Users/point/Downloads/admin/app.jsx
2026-06-17 21:33 | 33017 bytes | /Users/point/Downloads/admin/data.jsx
2026-06-17 21:33 | 14618 bytes | /Users/point/Downloads/admin/screens-boards.jsx
2026-06-17 21:33 | 16855 bytes | /Users/point/Downloads/admin/screens-ops.jsx
2026-06-17 21:33 | 15400 bytes | /Users/point/Downloads/admin/screens-overview.jsx
2026-06-17 21:33 | 17396 bytes | /Users/point/Downloads/admin/screens-people.jsx
2026-06-17 21:33 | 5376 bytes | /Users/point/Downloads/admin/ui.jsx
2026-06-17 21:25 | 43399 bytes | /Users/point/Downloads/app.jsx
2026-06-17 21:26 | 19461 bytes | /Users/point/Downloads/profile.jsx
2026-06-17 21:26 | 4061 bytes | /Users/point/Downloads/reminders.jsx
2026-06-17 21:26 | 56582 bytes | /Users/point/Downloads/state.jsx
2026-06-17 21:25 | 150939 bytes | /Users/point/Downloads/styles.css
2026-06-17 21:26 | 36750 bytes | /Users/point/Downloads/treasury.jsx
```

## Implementation Guardrails

- Always read `Memory.md` and `PLAYBOOK.md` before coding in a new session.
- Run `git status --short --branch` before edits.
- For production/admin/core changes, run `npm test`.
- For responsive changes, verify desktop, tablet, and mobile.
- For Claude handoff changes, compare before/after visually.
- Do not modify inactive legacy snapshots unless explicitly requested:
  - `/Users/point/toolbox/archive/legacy/trip-index.legacy.html`
  - `/Users/point/toolbox/archive/legacy/index.legacy.html`
- Do not edit reference files in `/Users/point/Downloads` directly.
- If a new Claude source file is supplied for this project, prefer the newer
  `.jsx`, `.css`, or offline HTML over older handoff files for the same surface.

## Backup Habit Going Forward

After Claude produces any important design/source handoff:

1. Save the exported HTML/source files to `/Users/point/Downloads`.
2. Add or update a short repo note if the output becomes canonical.
3. Keep the newest source file names visible in `Memory.md` or this recovery
   pack.
4. Avoid relying on Claude Project storage as the only copy.
