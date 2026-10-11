# Admin Portal Implementation

Last updated: 2026-10-12

## Purpose

This file documents the live `/admin/` implementation. Use `ADMIN.md` only as
prototype/handoff history unless a fresh Admin Claude export is supplied.

## Source Files

- `admin/index.html`: static Admin shell and Firebase compat script loading.
- `admin/admin.css`: Admin-specific responsive UI.
- `admin/app.js`: Admin gate, data load, renderers, modals, draft/publish,
  lifecycle, reset, delete request, and support actions.
- `api/admin-delete-status.js`: privileged delete readiness endpoint.
- `api/admin-delete-user.js`: backend-only permanent delete.
- `api/admin-reset-user.js`: backend-only Super Admin password reset.
- `api/account-recovery-core.js`: shared backend account reset helpers.
- `firestore.rules`: Super Admin read/write guard for protected collections.

## Access Model

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
| Audit | `renderAuditLog` | support/diff style audit surface |
| Revisions | `renderRevisions` | Admin publish history |
| Support | `renderSupportTools` | reset/export/merge/invite/add helper modals |

## Draft And Publish

Most board edits mutate `draft.boards` and call `markDirty()`. They are not live
until Publish.

Publish flow:

1. `validateDraft()`
2. `diffBoards()`
3. confirmation modal
4. Firestore batch writes `trips/{id}` and `adminRevisions/{id}`
5. local draft is cleared
6. published data is reloaded

## User Management

Recoverable lifecycle:

- `active`
- `archived`
- `deactivated`
- `delete_requested`
- `deleted`

`applyUserLifecycle()` writes status fields to `users/{uid}` and
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

## Current Limitations

- Admin Add User is not real Firebase Auth account creation yet.
- Merge accounts is support-tool placeholder behavior.
- Admin character edit primarily mutates board draft/published board data, not
  canonical `characters/{id}`.
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
node --test tests/unit/admin-delete-user.test.mjs
```
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
