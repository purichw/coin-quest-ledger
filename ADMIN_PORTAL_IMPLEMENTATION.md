# Admin Portal Implementation

Last updated: 2026-07-07

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

- loads `trips` into normalized board records;
- loads recent `adminRevisions`;
- loads `users` into cloud user records;
- loads reusable deleted username tombstones from `usernames`;
- initializes `draft` from local draft storage or the published board set.

`userRecords()` merges:

- real cloud users;
- board participant-derived users;
- admin owner/admin identity records;
- local lifecycle overlays;
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
`usernames/{username}` when a UID/username exists. Player login guards must
respect blocked statuses.

Admin password reset:

- currently uses browser Firebase client SDK;
- creates a new Auth credential with admin-specific internal email;
- moves `usernames/{username}` to the new UID;
- preserves public User ID and Character ID when possible;
- updates character owner pointer.

This should move behind a Vercel Admin SDK route before being treated as final
hardened support tooling.

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
- Board security remains limited by permissive `trips/{id}` Firestore rules.
- Admin password reset should be moved backend-side.

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
