# Admin Portal Implementation

Last updated: 2026-10-14

## Purpose

This file documents the live `/admin/` implementation. Use `ADMIN.md` only as
prototype/handoff history unless a fresh Admin Claude export is supplied.

## Source Files

- `admin/index.html`: static Admin shell and Firebase compat script loading.
- `admin/admin.css`: Admin feature layouts, tables, details and modal structure.
- `admin/design.css`: canonical Admin visual tokens, shared frame and responsive
  presentation. Avoid adding competing page-specific header/sidebar overrides.
- `admin/shell.js`: shared header, navigation, footer and compact-menu behavior.
- `admin/app.js`: Admin gate, data load, renderers, modals, draft/publish,
  lifecycle, reset, delete request, and support actions.
- `api/admin-delete-status.js`: privileged delete readiness endpoint.
- `api/admin-delete-user.js`: backend-only permanent delete.
- `api/admin-reset-user.js`: backend-only Super Admin password reset.
- `api/account-recovery-core.js`: shared backend account reset helpers.
- `firestore.rules`: Super Admin read/write guard for protected collections.

## Access Model

Canonical Admin URL: `https://coinquestledger.vercel.app/admin/`. Firebase Auth
authorizes this hostname; the retired web hostname was removed on 2026-10-14.
Fresh Google sign-in and real Admin reads passed after the cutover. The Firebase
project and Google OAuth helper callback remain unchanged, so the helper's
legacy project name can still appear during sign-in. The new browser origin
requires its own session and does not change the Super Admin allowlist or data.
See `docs/domain-migration-2026-10-14/README.md` for the verified release.

Production:

1. Initialize Firebase Auth.
2. Sign in through Google provider.
3. Accept only verified `purich.wc@gmail.com`.
4. Load Admin data from Firestore.

Test mode:

- `/admin/?test=1` uses a local gate and local/session fixtures for automated
  regression only. It is not security.

## Data Load

`loadPublished()`:

- loads `trips` into normalized board records with server-source Firestore reads;
- loads recent `adminRevisions` with server-source Firestore reads;
- loads `users` into cloud user records with server-source Firestore reads;
- loads reusable deleted username tombstones from `usernames` with server-source
  Firestore reads;
- initializes `draft` from local draft storage or the published board set.

Local Admin draft storage is an explicit unpublished-draft surface. It can keep
operator edits visible until Save/Restore/Publish, but it is not a live fallback.
Restore discards the draft and returns to the latest published server state.
Collection reads are treated as one complete load: a failed users/revisions/
tombstones read shows retry inside the shared frame with Save/Restore/Publish
disabled, never an editable partial dataset. Invalid
local draft JSON is retained with a visible warning until explicit Save/Restore.

`userRecords()` merges:

- real cloud users;
- board participant-derived users;
- admin owner/admin identity records;
- local lifecycle overlays only for `?test=1` or records that do not have a
  cloud UID. In production, fresh `users/{uid}` data wins over stale browser
  lifecycle cache;
- deleted tombstones.

## Admin Screens

| Screen | Main functions | Data |
| --- | --- | --- |
| Dashboard | `renderDashboard` | board/user/admin/revision summaries |
| Relationship Map | `renderRelationshipMap` | User -> Character -> Board/Admin relationships |
| Boards | `renderBoards`, `renderBoardDetail` | draft board list and board detail |
| Users | `renderUsers`, `renderUserDetail` | merged user/account records |
| Board Admins | `renderAdmins`, `renderAdminDetail` | Admin IDs and owned boards |
| Deleted IDs | `renderTombstones` | reusable username tombstones |
| Audit | `renderAuditLog` | published board revisions and local draft differences |
| Revisions | `renderRevisions` | Admin publish history |
| Support | `renderSupportTools` | backend password reset, JSON export, links to Users/Boards |

## Shared Admin Composition

The 2026-10-14 Dashboard reference defines one Admin frame for all nine screens
and board/user/admin detail views, including pages whose content has not been
redesigned. `renderMain()` owns the frame; `renderPageBody()` provides its contents.
Default entry remains Boards; `?tab=dashboard` opens Dashboard.

- The same green header, navigation rail, parchment surface, content gutters and
  landscape footer appear throughout. They use `assets/admin-reference/` artwork.
- At 1024px and above the 224px rail stays visible. Below 1024px, a hamburger
  opens an overlay with focus containment, background inertness, Escape, backdrop
  dismissal and focus return. Selecting a destination closes it.
- Below 1200px, header actions move into one disclosure. Save, Restore, Publish
  and Sign out retain their existing behavior and IDs; controls are not duplicated.
- The parchment uses sliced image borders. Do not stretch the entire transparent
  artwork as the page background: its transparent edges can intrude into headings.
  Mobile decorative border width is 12px; larger screens use 22px.
- Dashboard uses four centered KPI cards, recent draft changes, required-metadata
  attention rows and supported quick actions. Desktop panels use two columns;
  tablet/mobile panels stack and KPIs use two columns. Compact recent activity
  shows three rows with View all opening Version Control.
- Counts and draft changes come from current records. The reference's sample
  counts, relative timestamps, version string and unsupported Invite user action
  are not copied. View users opens the existing account list instead.
- Subpage tables/details keep their own information layouts. Shared composition
  does not require every page to become a dashboard grid.

Reference, artwork provenance, snapshots and verification are recorded in
`docs/admin-dashboard-2026-10-14/README.md`.

## Draft And Publish

Most board edits mutate `draft.boards` and call `markDirty()`. They are not live
until Publish.

Publish flow:

1. `validateDraft()`
2. `diffBoards()`
3. confirmation modal
4. Firestore transaction checks loaded baselines and writes only changed `trips/{id}` plus `adminRevisions/{id}`
5. local draft is cleared
6. published data is reloaded

## User Management

Recoverable lifecycle:

- `active`
- `archived`
- `deactivated`
- `delete_requested`
- `deleted`

`performUserLifecycle()` requires a reason and writes status fields to `users/{uid}` and
`usernames/{username}` and `userIds/{userId}` atomically. Player login guards must
respect blocked statuses.

Admin password reset:

- calls `/api/admin-reset-user` with the Google-auth Firebase ID token;
- verifies the Super Admin allowlist server-side;
- updates the existing Auth credential, recreating the same UID only when Auth
  is missing; rejects blocked accounts or changed identity ownership;
- preserves UID, public User ID and Character ID;
- updates character owner pointer;
- stores only the new recovery hash in `users/{uid}` and returns the raw Recovery
  ID once for handoff.

Permanent delete:

- disabled unless `/api/admin-delete-status` reports service-account env ready;
- requires reason and exact `DELETE <userId>` confirmation;
- sends Google-auth ID token to `/api/admin-delete-user`;
- backend verifies allowlisted Gmail and performs Auth/doc deletion and
  tombstoning.

## Cleanup and flow corrections — 2026-10-14

- Archive/Reopen changes `archived`, `archivedAt` and `status`, retaining members,
  expenses and unknown fields. Permanent deletion remains a separate confirmed
  action that takes effect on Publish. Archive must never call `deleteBoard`.
- New board IDs are four digits; changed IDs and board names validate before
  Publish. Unchanged legacy IDs remain readable. Board data-only edits are
  included in the publish diff. Revisions identify the actual signed-in Admin.
- Search updates results without replacing the focused input, including during
  continuous typing/composition. Modal keyboard focus is contained and returned;
  Close/Escape always cancel rather than executing the first action.
- Export downloads a real `coin-quest-admin-export-v1` JSON snapshot of loaded
  data (including drafts). Passwords, recovery values, tokens, owner hashes and
  auth metadata are recursively omitted. This is a support export, not a
  credential-complete disaster recovery backup.
- Removed obsolete impersonation, merge, invite-admin and add-account stubs,
  fabricated activity charts, fake unsettled totals, and unsupported historical
  Restore/View-diff buttons. Revision details remain expandable.
- Removed board-local character rename/class/XP and arbitrary Character ID
  mutation. These could orphan ledger name references or contradict canonical
  account identity. Profiles remain viewable; membership uses Party Ledger's
  Character ID invitation/Guest flows. Admin does not create fake character IDs.
- Removed the unused browser recovery hashing/email-minting helpers and CSS
  belonging only to the retired prototype controls.

## Current Limitations

- Account creation, merges, impersonation and canonical character editing are
  not offered by this portal. No placeholder operation should report success.
- Revisions store change summaries, not historical board snapshots; restoring
  an arbitrary historical version is therefore not supported.
- Audit Log displays board publish revisions/draft changes. It is not a claim
  that every credential/lifecycle operation has an immutable audit event.
- Debt/Treasury dashboard totals cover legacy board records, not all private
  `playerModules/{uid}` finance data.
- Board security is signed-in-only in Firestore rules, but not yet
  owner/member-scoped.

## Verification

Admin changes usually require Production Patch verification:

```bash
npm test
```

Focused checks:

```bash
npx playwright test tests/e2e/coin-quest-ledger.spec.mjs --grep "super admin"
npx playwright test tests/e2e/admin-flow-audit.spec.mjs
node --test tests/unit/admin-delete-user.test.mjs
```

Live browser and isolated-test evidence for this cleanup is in
`docs/flow-audit-2026-10-14/README.md`. Local changes are not deployed until a
separate release is completed.
## Backend repair notes — 2026-10-12

Publishing now writes only changed boards and checks the draft's captured content
against a fresh transaction read. Stale drafts or occupied destination IDs abort
without deleting local work or writing a revision. Lifecycle changes update user,
username and User ID together and refuse accounts with an active recovery lease.
Admin tombstone listing is allowed by rules while player enumeration stays denied.

Delete checks target ownership before Auth changes, clears module data/nested
invites, and preserves shared financial history as board-local guests. Legacy
orphan cleanup rereads each board in a transaction to preserve concurrent edits.
Both privileged APIs require verified allowlisted email and non-revoked tokens.
Historical local evidence and remaining limits are recorded in
`docs/backend-audit-2026-10-12.md`. Release status must be verified against the
exact CI commit, Vercel alias and Firebase Rules release.
