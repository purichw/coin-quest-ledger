# Security And Firebase Rules

Last updated: 2026-10-14

## Purpose

This file is the security/runbook companion for Firebase Auth, Firestore Rules,
Super Admin access, Vercel Admin SDK endpoints, and the current Spark/Blaze
reality. Use it with `ACCOUNT_MANAGEMENT_IMPLEMENTATION.md`,
`data-contracts.md`, and `firestore.rules`.

## Current Backend Reality

- Firebase project id: `pointy-personal-toolkit`.
- Web production origin: `https://coinquestledger.vercel.app`.
- Firebase Auth authorized domains verified on 2026-10-14:
  `coinquestledger.vercel.app`, `pointy-personal-toolkit.firebaseapp.com`,
  `pointy-personal-toolkit.web.app`, `localhost`, and `127.0.0.1`.
  The retired web hostname was removed; fresh Google Admin sign-in passed.
  The Firebase project, user UIDs, database and OAuth helper callback at
  `https://pointy-personal-toolkit.firebaseapp.com/__/auth/handler` are unchanged.
  Do not set `authDomain` to the Vercel hostname merely to change branding;
  a custom OAuth helper/callback setup is a separate infrastructure change.
  Evidence: `docs/domain-migration-2026-10-14/README.md`. This cutover did not
  deploy or modify Firestore Rules.
- Firebase plan: Spark at last local check, with `billingEnabled: false`.
- Web runtime: static pages on Vercel using Firebase compat SDK.
- Admin privileged backend: Vercel Serverless API using `firebase-admin`.
- Super Admin allowlist: verified Google Auth email `purich.wc@gmail.com`.
- Rules deploy config: `firebase.json` points to `firestore.rules`.

Spark does not block normal Firebase Auth signup/login or Firestore CRUD inside
free quotas. Blaze is needed only when a chosen Firebase/Google Cloud feature
or quota path requires billing.

## Firestore Rules Summary

Current repository rule shape (verify the Firebase release before claiming live parity):

| Path | Read | Create/update | Delete | Notes |
| --- | --- | --- | --- | --- |
| `trips/{tripId}` | signed-in user | active account or Super Admin | Super Admin | owner/member scoping still requires migration |
| `characters/{characterId}` | anyone | owner UID or Super Admin | Super Admin | update must preserve `ownerUid` |
| `users/{uid}` | owner UID or Super Admin; list is Super Admin only | owner UID or Super Admin | Super Admin | raw `recoveryCode` writes are blocked |
| `users/{uid}/boardInvites/{inviteId}` | target owner or Super Admin | any signed-in inviter if `targetOwnerUid == uid` and `status == "pending"` | Super Admin | target owner can update immutable target/trip fields |
| `usernames/{username}` | public `get`; Super Admin `list` | owner UID or Super Admin; deleted reusable tombstone reclaim is constrained | Super Admin | prevents username takeover; new public recovery hashes are blocked |
| `userIds/{userId}` | public `get`; no `list` | owner UID or Super Admin; deleted reusable tombstone reclaim is constrained | Super Admin | low-detail reservation record for four-digit User ID collision checks |
| `playerModules/{uid}` | owner UID or Super Admin | owner UID or Super Admin | Super Admin | native-owned Debt/Treasury/Compare state |
| `adminRevisions/{revisionId}` | Super Admin | Super Admin | Super Admin | Admin publish logs |
| `adminDeleteRequests/{requestId}` | Super Admin | Super Admin | Super Admin | backend delete audit |
| `accountRecoveryEvents/{eventId}` | Super Admin | Super Admin | Super Admin | backend recovery/admin reset audit |

## Known Security Gaps

- `trips/{tripId}` is no longer anonymous-public in repo rules, but any signed-in
  user can still read/write boards. Do not claim board/member privacy until
  owner/member scoped access metadata is migrated and enforced.
- Character Profile `private=1` hides values for display only; it is not an
  authorization layer.
- Player recovery and Admin password reset now run through Vercel Admin SDK API
  routes. They update the existing Auth user password when the UID exists and
  create a replacement credential only when the old Auth user is missing.
- Existing legacy `usernames/{username}.recoveryHash` values may remain until the
  account signs up/reclaims, regenerates, resets, or receives an admin reset.
  New client/backend writes delete or avoid that public field.
- Profile drawer can display the Recovery ID for the signed-in user. This is an
  intentional small-private-app convenience tradeoff backed by the local signed-in
  mirror; raw Recovery IDs must not be newly written to Firestore.
- `?test=1` local gates and fixtures are regression helpers, not security.

## Privileged Backend

`/api/admin-delete-status`:

- method: `GET`;
- returns whether Vercel has Firebase Admin service-account env vars;
- reports delete/reset/recovery backend readiness;
- does not return secrets.

`/api/recover-account`:

- method: `POST`;
- accepts username, Recovery ID, and new password;
- verifies the recovery hash server-side against `users/{uid}` with legacy
  `usernames/{username}.recoveryHash` fallback;
- counts attempts in Firestore across serverless instances (8 per IP/username
  digest per 15 minutes; no raw IP stored);
- updates the existing Auth user password when possible, generates a new Recovery
  ID, stores only the new hash on `users/{uid}`, deletes the public username hash,
  and writes `accountRecoveryEvents`.

`/api/admin-reset-user`:

- method: `POST`;
- requires `Authorization: Bearer <Firebase ID token>`;
- verifies the token with Firebase Admin SDK;
- rejects anyone except verified `purich.wc@gmail.com`;
- resets or recreates the account credential without replacing the Admin browser
  session;
- stores only the recovery hash on `users/{uid}` and returns the new raw Recovery
  ID once for handoff.

`/api/admin-delete-user`:

- method: `POST`;
- requires `Authorization: Bearer <Firebase ID token>`;
- verifies the token with Firebase Admin SDK;
- rejects anyone except verified `purich.wc@gmail.com`;
- requires an audit reason;
- deletes Firebase Auth user, `users/{uid}`, character docs, writes a reusable
  deleted username/User ID tombstone, writes `adminDeleteRequests`, and cleans
  board references.

### Shared backend hardening, 2026-10-12

- Strict verified-email and revoked-token checks protect both Admin APIs.
- Both lifecycle fields are checked. Owners cannot reactivate themselves, alter
  identity pointers, mint a second linked character, or rotate credentials during
  a recovery lease. A deleted UID cannot reclaim its tombstones using an old token.
- Recovery validates identity and the current hash inside a transaction, leases
  the account for up to five minutes, preserves its UID (including missing Auth
  recreation), rejects blocked profiles/Auth users, and revokes refresh tokens.
  The old recovery hash remains usable on a failed operation. Auth + Firestore
  are separate services; this is a retryable operation, not a cross-service ACID
  transaction. Expired leases can be retried. Password reset does not reactivate.
- `accountRecoveryLimits` is Admin SDK only. `expiresAt` supports an optional
  Firestore TTL policy. Billing is disabled on this project at release preflight,
  so physical TTL cleanup is deferred; see the deployment runbook. Expired windows
  are logically reset even without TTL cleanup. No billing upgrade is implied.
- Invite replies may only transition pending to accepted/declined before expiry,
  or to expired afterward. Payload rewrites and repeat replies are rejected.
- Account deletion checks current ownership, blocks further player writes, and
  removes `playerModules` and nested invites. Shared financial rows remain as
  board-local guest history so other participants' obligations do not change.
  Legacy orphan cleanup retains its separate cleanup behavior.
- `npm run test:backend` runs isolated Auth/Firestore emulators under the
  **demo-coin-quest** project. Tests refuse to run without emulator environment
  variables. No production credentials or production records are required.

Remaining boundaries: signed-in board reads and active-account board writes are
still the documented legacy policy; per-board ACL enforcement needs a migration
and coordinated link-join/admin-password changes. Existing public legacy hashes
also need a separately authorized production cleanup. See
`docs/backend-audit-2026-10-12.md` for verification and limitations.

Accepted Vercel env:

- `FIREBASE_SERVICE_ACCOUNT_JSON`; or
- `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`.

Keep `firebase-admin` pinned to `13.10.0` unless the Vercel runtime issue noted
in `ADMIN.md` is retested and resolved.

## Rules Deploy Runbook

Before changing rules:

1. Read `data-contracts.md`, `ACCOUNT_MANAGEMENT_IMPLEMENTATION.md`, and this
   file.
2. Identify every client write path that the rule change affects.
3. Run focused auth/admin/invite tests locally.
4. Deploy rules only after code and tests match the new contract.

Deploy:

```bash
npx firebase-tools deploy --only firestore:rules --project pointy-personal-toolkit
```

After deploy:

- sign in with a real player account;
- verify signup/login/recovery if touched;
- verify invite accept/decline if `boardInvites` changed;
- verify `/admin/` Google sign-in and Admin Portal loads;
- verify `/api/admin-delete-status` still reports expected readiness.

## Hardening Backlog

1. Migrate `trips/{tripId}` access metadata into owner/member/admin scoped
   enforcement instead of broad signed-in access.
2. Extend the existing Auth/Firestore emulator suite when access contracts change.
3. Decide whether public character/profile reads should stay public or become
   board/member scoped.
4. Purge legacy public `usernames/{username}.recoveryHash` values with a
   controlled backend maintenance pass after production verification.
5. Add Firebase App Check for web and native clients.
