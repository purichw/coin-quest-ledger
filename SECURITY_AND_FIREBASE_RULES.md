# Security And Firebase Rules

Last updated: 2026-07-07

## Purpose

This file is the security/runbook companion for Firebase Auth, Firestore Rules,
Super Admin access, Vercel Admin SDK endpoints, and the current Spark/Blaze
reality. Use it with `ACCOUNT_MANAGEMENT_IMPLEMENTATION.md`,
`data-contracts.md`, and `firestore.rules`.

## Current Backend Reality

- Firebase project id: `pointy-personal-toolkit`.
- Firebase plan: Spark at last local check, with `billingEnabled: false`.
- Web runtime: static pages on Vercel using Firebase compat SDK.
- Admin privileged backend: Vercel Serverless API using `firebase-admin`.
- Super Admin allowlist: verified Google Auth email `purich.wc@gmail.com`.
- Rules deploy config: `firebase.json` points to `firestore.rules`.

Spark does not block normal Firebase Auth signup/login or Firestore CRUD inside
free quotas. Blaze is needed only when a chosen Firebase/Google Cloud feature
or quota path requires billing.

## Firestore Rules Summary

Current deployed repo rule shape:

| Path | Read | Create/update | Delete | Notes |
| --- | --- | --- | --- | --- |
| `trips/{tripId}` | anyone | anyone | anyone | intentionally permissive today; hardening requires migration |
| `characters/{characterId}` | anyone | owner UID or Super Admin | Super Admin | update must preserve `ownerUid` |
| `users/{uid}` | anyone | owner UID or Super Admin | Super Admin | account profile and active character pointer |
| `users/{uid}/boardInvites/{inviteId}` | target owner or Super Admin | any signed-in inviter if `targetOwnerUid == uid` and `status == "pending"` | Super Admin | target owner can update immutable target/trip fields |
| `usernames/{username}` | public `get`; no `list` | owner UID or Super Admin; deleted reusable tombstone reclaim is constrained | Super Admin | prevents username takeover |
| `playerModules/{uid}` | owner UID or Super Admin | owner UID or Super Admin | Super Admin | native-owned Debt/Treasury/Compare state |
| `adminRevisions/{revisionId}` | Super Admin | Super Admin | Super Admin | Admin publish logs |

## Known Security Gaps

- `trips/{tripId}` is still fully public read/write. Do not claim board privacy
  until this is tightened and deployed.
- Character Profile `private=1` hides values for display only; it is not an
  authorization layer.
- Player recovery and Admin password reset currently rotate credentials by
  creating a new Firebase Auth user and moving username/User ID/Character ID
  pointers. This is functional Phase 1 behavior, not final hardened recovery.
- Admin password reset currently runs from the browser Firebase client SDK and
  can replace the active browser Auth session. Move it behind Vercel Admin SDK
  before treating it as hardened support tooling.
- Profile drawer can display the Recovery ID for the signed-in user. This is an
  intentional small-private-app convenience tradeoff.
- `?test=1` local gates and fixtures are regression helpers, not security.

## Privileged Backend

`/api/admin-delete-status`:

- method: `GET`;
- returns whether Vercel has Firebase Admin service-account env vars;
- does not return secrets.

`/api/admin-delete-user`:

- method: `POST`;
- requires `Authorization: Bearer <Firebase ID token>`;
- verifies the token with Firebase Admin SDK;
- rejects anyone except verified `purich.wc@gmail.com`;
- requires an audit reason;
- deletes Firebase Auth user, `users/{uid}`, character docs, writes a reusable
  deleted username tombstone, writes `adminDeleteRequests`, and cleans board
  references.

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

1. Replace permissive `trips/{tripId}` rules with owner/member/admin scoped
   access.
2. Move Admin password reset behind a Vercel Admin SDK endpoint.
3. Decide whether player recovery should remain code-based or move to a
   backend-mediated support flow.
4. Add Firestore Rules emulator tests before major rule tightening.
5. Decide whether public character/profile reads should stay public or become
   board/member scoped.
