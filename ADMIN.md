# ADMIN.md - Admin Portal Handoff Notes

Last updated: 2026-06-20

## Purpose

This file preserves the current understanding of the newest Admin Portal handoff
files in `/Users/point/Downloads/Coin Quest Ledger/admin/` so the next
implementation pass does not need to rediscover the model, screens, and styling
from scratch.

These files are a Claude-style Admin Portal prototype/reference. The live app is
still the static no-build Coin Quest Ledger repo, but the current `/admin/`
implementation has now been workback-ported toward the newer source set for
People, Boards, Ops, relationship views, and modal flows.

## Source Files

Current reference folder:

```text
/Users/point/Downloads/Coin Quest Ledger/admin/
```

Files studied:

```text
Admin Portal.html
admin.css
app.jsx
data.jsx
screens-boards.jsx
screens-ops.jsx
screens-overview.jsx
screens-people.jsx
ui.jsx
```

Standalone HTML/reference context:

```text
/Users/point/Downloads/Coin Quest Ledger/Admin Portal.html
```

The newer `.jsx` source files are the more actionable source of truth than the
older broken/offline HTML. Work back from the source files when the standalone
export is stale or damaged.

Offline/source load order:

```text
admin.css
React 18.3.1 UMD
ReactDOM 18.3.1 UMD
Babel standalone 7.29
data.jsx
ui.jsx
screens-overview.jsx
screens-boards.jsx
screens-people.jsx
screens-ops.jsx
app.jsx
```

## Handoff Rule

- Treat the newest files in `/Users/point/Downloads/Coin Quest Ledger/admin/` as
  the Admin Portal reference until a newer offline Admin Portal HTML/source set
  is supplied.
- For this project, newer `.jsx` handoff files should replace older handoff
  files when the user explicitly says to use the new version.
- Do not edit the Downloads reference files directly.
- Preserve newer user requirements over older prototype behavior.
- Do not overwrite current app persistence blindly. Map prototype behavior into
  the live app storage/Firebase shape carefully.

## Current Live Repo Reality

The live app is still static HTML/CSS/JS with no build step. The current Admin
Portal in the repo lives at:

```text
/Users/point/Library/Mobile Documents/com~apple~CloudDocs/Website Projects/toolbox/admin/index.html
/Users/point/Library/Mobile Documents/com~apple~CloudDocs/Website Projects/toolbox/admin/app.js
```

The prototype is React/Babel JSX. Current direction is to port it faithfully into
the existing static admin implementation instead of adding a new React island.

The existing repo already has tests around Admin Portal behavior. Any Admin
Portal implementation work should use Production Patch verification, meaning
`npm test`, because admin changes affect persistence and user data.

## Security Reality

The Claude prototype included a local mock gate only. The live production `/admin/` now uses Firebase Google Auth and only allows the Gmail `purich.wc@gmail.com`.

Permanent user delete is not a client-side Firebase Auth action. The Admin UI calls `/api/admin-delete-status` to check whether the privileged backend is configured, disables permanent delete if Vercel lacks Firebase Admin service-account env vars, and calls `/api/admin-delete-user` only after the Super Admin signs in with Google. The backend verifies the Firebase ID token and allowlisted Gmail before deleting Auth, `users`, `usernames`, and `characters` records.

As of 2026-06-20, production Vercel has encrypted `FIREBASE_SERVICE_ACCOUNT_JSON` for `vercel-admin-delete@pointy-personal-toolkit.iam.gserviceaccount.com`. That service account has `roles/firebaseauth.admin` and `roles/datastore.user`. Keep `firebase-admin` pinned to `13.10.0` unless the Vercel runtime/dependency issue with `firebase-admin@14.0.0` and `jwks-rsa`/`jose` is resolved.

Real "outsiders cannot enter" behavior now depends on:

- Firebase Google Auth.
- Firestore Security Rules or equivalent database access rules.
- Vercel Firebase Admin env vars for backend-only destructive actions: `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`.
- Super Admin allowlist: `purich.wc@gmail.com`.
- Board Admin permissions scoped to owned boards.

Do not describe the `?test=1` local gate as secure access control. It exists only for automated regression.

## Product Model

Core identities:

- `User ID`: global person/account identity across the app.
- `Character ID`: playable hero identity. Current player/auth canon is one
  active Character per User ID.
- `Admin ID`: Board Admin identity. One User can have many Admin IDs.
- `Board`: one managed workspace owned by an Admin ID.

Important rules:

- One User ID can appear across Split Expenses, Debt Dragon, Treasury, and
  Character Profile.
- Current player/auth canon: one User ID has one active Character. Multiple
  characters per user is a future product decision, not the current live loop.
- Each Character has its own class, level, XP, and board history.
- The same Character can gain progress from multiple modules.
- Admin Portal displays levels from the shared leveling canon: Character rows use `PointyLogic.levelFromXp()` and overall/user rows use `PointyLogic.levelFromRenown()`. Do not add admin-only level thresholds.
- One User ID can hold multiple Admin IDs.
- One Admin ID can own multiple Boards.
- Admin IDs are intentionally reusable across Boards; do not globally de-dupe
  them unless the user changes the requirement.
- Board URL/short code uniqueness still matters.
- Compare Prices is a tool, not a Board in the current product model.
- The prototype includes `split`, `debt`, and `treasury` board types.

## Data Model From Prototype

Defined in `data.jsx`.

Main entities:

- `users`
  - `uid`
  - `display`
  - `contact`
  - `status`
  - `chars`
  - `adminIds`
- `characters`
  - `cid`
  - `name`
  - `class`
  - `xp`
  - `level`
  - module participation via board membership
- `admins`
  - `aid`
  - `nick`
  - `userId`
  - `ownerHash`
  - `boards`
  - `created`
  - `lastActive`
- `boards`
  - `id`
  - `name`
  - `type`: `split`, `debt`, or `treasury`
  - `url`
  - `adminId`
  - `members`
  - module-specific stats
  - `status`
  - activity timestamps
- `changelog`
  - per-board events and diffs
- `boardVersions`
  - board-level snapshots/restores
- `systemVersions`
  - portal-wide publish snapshots
- `audit`
  - system, user, admin, and board actions

Seed board examples:

- `3410`: split board
- `6480`: split board
- `2087`: debt board
- `7733`: archived debt board
- `5290`: treasury board
- `8174`: treasury board

## App Shell

Defined in `app.jsx`.

Navigation groups:

- Overview
  - `dashboard`
  - `relmap`
- Manage
  - `boards`
  - `users`
  - `admins`
- Ops
  - `audit`
  - `versions`
  - `support`

Topbar:

- Brand: `Super Admin Portal`
- Phase 1 environment pill.
- Language toggle.
- Super Admin identity area.

State:

- `lang` from `localStorage.pointy_admin_lang`
- `authed` mock gate boolean
- `route`: `{ screen, id }`
- `modal`
- `payload`
- `toasts`

Screens route to:

- Dashboard
- Relationship Map
- Boards List
- Board Detail
- Users List
- User Detail
- Admins List
- Admin Detail
- Audit Log
- Version Control
- Support Tools

## Shared UI Components

Defined in `ui.jsx`.

Important primitives:

- `IdChip`
- `ModBadge`
- `StatusBadge`
- `LevelBadge`
- `StatCard`
- `SearchBar`
- `Seg`
- `Tabs`
- `KV`
- `Empty`
- `Pager`
- `Modal`
- `Crumbs`
- `PageHead`
- `Spark`

Behavior notes:

- `Modal` closes on Escape.
- `Modal` closes on scrim click.
- ID chips can navigate when given a target.
- Module badges support split, debt, and treasury.

## Overview Screens

Defined in `screens-overview.jsx`.

`LoginGate` / Admin gate:

- Production uses Google sign-in through Firebase Auth.
- Only `purich.wc@gmail.com` is accepted.
- Test mode (`?test=1`) keeps the mock PIN/local gate for Playwright.
- Includes language toggle.

`Dashboard`:

- KPI cards for boards, users, characters, admins, overdue, unsettled, slain,
  and related operational stats.
- Activity feed.
- Attention list.
- Quick actions.
- Two layout modes: cards and command.

`RelationshipMap`:

- Shows relationship from User to active Character to Boards.
- Shows Admin ID relationship to owned boards.
- Documents the intended ID model visually.

Prototype mismatch to remember:

- Relationship copy says Board is Split or Debt in some places.
- Current prototype seed also includes Treasury boards.
- Older prototype copy allowed many Characters per User. The live canon now says
  one active Character per User ID until the user explicitly changes that model.
- User previously reminded that Compare Prices exists, but Compare Prices should
  not become a Board unless explicitly requested.

## Board Screens

Defined in `screens-boards.jsx`.

`BoardsList`:

- Search by board/admin/user.
- Filter: all, split, debt, treasury.
- Table columns:
  - board
  - name
  - type
  - admin
  - members
  - figures
  - status
  - activity
  - open

Figures vary by module:

- split: quests and total THB
- debt: dragons, balance THB, overdue
- treasury: spent, income, over-ward count

`BoardDetail`:

- Supports tabbed and scroll layouts.
- Overview section with board info and module stats.
- Members section with character, user, class, level, and role.
- Changelog section with diffs and reversible log items.
- Versions section with board snapshot restore.
- Danger zone for reset/archive/delete with confirmation.
- Actions include export and open board.

## People Screens

Defined in `screens-people.jsx`.

`UsersList`:

- Search users.
- Table shows User ID, display name, active character, board count, renown, admin
  role, and status.

`UserDetail`:

- Identity card.
- Tabs:
  - character
  - boards
  - admin roles
  - activity
- Character cards include class, level, XP, progress bar, and linked boards.
- Actions include impersonate, reset password, and export.

`AdminsList`:

- Search admins.
- Table shows Admin ID, nickname, linked user, owner hash, boards owned, and
  last active.

`AdminDetail`:

- Shows Admin ID, nickname, linked user, owner hash, owned boards, and reset
  password action.

## Ops Screens

Defined in `screens-ops.jsx`.

`AuditLog`:

- Search.
- Scope filter: all, board, user, admin, system.
- Table shows when, actor, scope, action, target, and diff.

`VersionControl`:

- Save snapshot.
- Publish now with confirmation.
- Phase warning.
- System version history.
- View diff.
- Restore version.

`SupportTools`:

- Impersonate user, read-only.
- Reset password.
- Export data.
- Merge users.

`PortalModals`:

- New board.
- Invite admin.
- Add user.
- Export.
- Impersonate.
- Reset password.
- Merge users.
- Edit character.
- Confirm.

`NewBoardModal`:

- Board type radio cards for split, debt, treasury.
- Board name.
- Assign admin user.

`AddUserModal`:

- Existing or new user.
- Select board.
- New character starts at level 1.

## Styling Reference

Defined in `admin.css`.

Theme:

- Warm tavern-admin look, lighter and more parchment-based than dungeon dark.
- Fonts:
  - `Mitr`
  - `IBM Plex Sans Thai`
  - `IBM Plex Mono`
- Core colors:
  - parchment backgrounds
  - green success/admin action
  - gold highlights
  - danger red
  - blue and purple accents
- Module accents:
  - `--split`
  - `--debt`
  - `--treasury`

Layout:

- Sticky topbar: 60px.
- Sidebar: 248px, sticky below topbar.
- Main content max width: about 1240px.
- Below 1000px:
  - shell collapses to one column
  - sidebar is hidden
  - detail grids become one column

Common UI:

- Card surfaces with warm borders.
- Tables for dense admin data.
- ID chips.
- Status badges.
- Module badges.
- Search/filter bars.
- Detail pages with side cards and tabs.
- XP/progress bars.
- Audit/version log rows.
- Relationship map.
- Toasts.
- Confirmation modals.
- Login gate.
- Danger zone.

## Existing Live Admin Gaps vs Prototype

The current live Admin Portal now covers the major newer-source structure for
Dashboard, Relationship Map, Boards, Users, Board Admins, Audit Log, Version
Control, Support Tools, tabs, modal shells, and mobile/tablet table behavior.
It is still static/no-build and should continue to preserve live persistence.
The mobile responsive layer now follows the latest Admin mobile export: the
sidebar becomes a horizontal scroll nav below `1000px`, topbar/page actions
compress below `760px`, dense tables scroll horizontally, and modals present as
bottom sheets on phone widths.
The tablet/touch layer is included: Relationship Map stacks below `900px`, and
coarse-pointer Admin tablets at `min-width: 761px` get 44px nav/button/ID-chip
targets plus roomier table rows.

Likely gaps to close later:

- Rich toasts and confirmations.
- More exact modal microcopy/confirmation behavior from a future fresh standalone
  export.
- Deeper board version restore semantics beyond the current revision model.
- Richer audit diff payloads.
- Fine visual tuning against future fresh Admin mobile exports.
- Real backend-backed permissions.

## Persistence Caution

Current live admin already has local draft/publish behavior and tests around it.
Do not replace it with static `SEED` data.

Before implementation, map:

- Prototype `SEED.users` to live user/character records.
- Prototype `SEED.admins` to live board admin ownership metadata.
- Prototype `SEED.boards` to Firestore/local board documents.
- Prototype changelog/version data to current revision-log model.
- Local Save/Restore/Publish to current `localStorage` and Firebase behavior.

Save / Publish / Restore requirements from user:

- Save stores edits locally.
- Restore resets current edits to the latest published version.
- Publish writes changes to the real source of truth.
- Version Control should show simple added/removed/updated details in an
  accordion-style history.

## Regression Checklist For Future Implementation

Run full regression for Admin work:

```bash
cd "/Users/point/Library/Mobile Documents/com~apple~CloudDocs/Website Projects/toolbox"
npm test
```

Focused browser checks should include:

- `/admin/` desktop.
- `/admin/` tablet.
- `/admin/` mobile.
- `/admin/` mobile Users and Add User modal, specifically checking horizontal
  admin nav and bottom-sheet modal behavior.
- `/admin/` tablet Relationship Map, specifically checking one-column stack,
  horizontal admin nav, 44px touch targets, and no overflow.
- Login gate does not expose admin data before unlock.
- Boards list renders split, debt, and treasury board types.
- Board detail opens and returns.
- User detail links characters and boards correctly.
- Admin detail shows owned boards.
- Audit log search/filter works.
- Version Control Save, Restore, Publish flows preserve current semantics.
- Modals open, confirm, cancel, and toast correctly.
- No console errors.
- No blank screens.
- No horizontal overflow on mobile/tablet.

Also ensure existing user-facing modules still pass:

- Home.
- Compare Prices.
- Split Expenses.
- Debt Dragon.
- Treasury.
- Character Profile.

## Decisions To Lock Before Full Port

- Whether production Admin Portal should remain no-build static JS or adopt
  React/Babel for this route.
- Whether Treasury is fully first-class in Admin Portal for Phase 1 or only a
  visible board type placeholder.
- Super Admin auth provider is Firebase Google Auth; the current allowlist is
  the Gmail `purich.wc@gmail.com`.
- Whether Super Admin edits publish directly to Firestore or stage in local
  draft first every time.
- How merge-users should behave with Character IDs, Admin IDs, and board
  history.
- Whether support impersonation is read-only only, or can perform scoped edits.

## Implementation Principle

When the real offline Admin Portal HTML arrives, study it before coding and keep
visual fidelity high. However, do not regress the live product model:

- Admin IDs can own multiple boards.
- Character IDs are global public links.
- Compare Prices remains separate from Board ownership.
- Debt Dragon and Treasury are now part of the product surface.
- `/admin/?test=1` local gate is regression-only and not real security.
