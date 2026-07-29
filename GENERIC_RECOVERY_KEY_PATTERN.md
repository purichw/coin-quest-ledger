# Generic Recovery Key Pattern

Use this note when a project needs an account-recovery mechanism for users who
forget their password. This is intentionally generic and can be adapted to
Firebase, Supabase, custom auth, or local-first apps.

## Goal

Give each user a recovery key during account creation, then allow the signed-in
user to regenerate it from their account/profile drawer. The recovery key can be
used later to reset the password when the user cannot sign in.

## Core Rules

- Generate the recovery key at account creation.
- Show the recovery key immediately after signup and ask the user to save it.
- Store a hash of the recovery key for verification.
- Do not rely on email access if the feature is meant to work when email is not
  available.
- Let signed-in users regenerate the recovery key from account settings/profile
  drawer.
- Regenerating a key invalidates the old recovery key.
- After a successful password reset, generate and show a new recovery key.
- When account data is server-backed, read the latest recovery metadata from the
  server before reset/regeneration decisions. Local cache, drawer state, or a
  previously revealed key must never override the current server hash/version.

## Recommended Data Shape

Store these fields on the user/account record:

```json
{
  "username": "normalized-login-name",
  "recoveryKeyHash": "sha256-or-server-side-hash",
  "recoveryKeyIssuedAt": 1784050000000,
  "recoveryKeyVersion": 3
}
```

If the auth system separates login records from user profile records, keep the
recovery hash on the lookup record used during password recovery too.

## Recovery Key Generation

Use a cryptographically secure random generator.

Recommended user-facing format:

```text
XXXX-XXXX-XXXX
```

Use an alphabet that avoids confusing characters:

```text
ABCDEFGHJKLMNPQRSTUVWXYZ23456789
```

Example behavior:

1. Generate 12 random characters.
2. Group them into 3 blocks of 4.
3. Normalize user input by removing spaces/dashes and uppercasing before
   verification.

## Hashing

Never compare the raw recovery key directly against a raw server-stored value in
serious production apps.

Minimum pattern:

```text
hash(normalizedAccountIdentifier + ":" + normalizedRecoveryKey)
```

Stronger production pattern:

```text
HMAC(serverSecret, normalizedAccountIdentifier + ":" + normalizedRecoveryKey)
```

The account identifier should be stable for recovery lookup, such as username,
email, user ID, or account ID. Normalize it the same way every time.

## Signup Flow

1. User submits signup form.
2. Server/client validates username, display name, password, and duplicate
   account rules.
3. Generate recovery key.
4. Hash recovery key.
5. Create auth account.
6. Create user/profile record with `recoveryKeyHash`, `recoveryKeyIssuedAt`,
   and optional `recoveryKeyVersion`.
7. Show the raw recovery key once in a blocking or prominent confirmation view.
8. Offer a copy button.
9. Continue onboarding only after the user confirms they saved it.

## Password Reset Flow

1. User opens "Forgot password".
2. User enters account identifier, recovery key, and new password.
3. Look up the account by normalized identifier.
4. Hash the submitted recovery key using the same hash strategy.
5. Compare with stored `recoveryKeyHash`.
6. If it matches, reset or rotate the password credential.
7. Generate a new recovery key.
8. Store the new recovery hash and issued timestamp.
9. Invalidate the old recovery key by replacing the hash.
10. Sign the user in or send them back to login, depending on product policy.
11. Show the new recovery key and ask them to save it.

## Profile Drawer Regeneration

Signed-in users should be able to regenerate their recovery key from a trusted
account surface such as profile drawer, account settings, or security settings.

Recommended drawer/account UI:

- Show current recovery key only if the product explicitly accepts this tradeoff.
- Provide `Copy recovery key`.
- Provide `Regenerate recovery key`.
- After regeneration, update the displayed key immediately.
- Show a success message: "New recovery key generated."
- Make clear that the old recovery key no longer works.

For stronger apps, do not persist or re-display the raw recovery key after the
initial reveal. Instead show:

```text
Recovery key created on <date>. Regenerate key
```

Then reveal only the newly generated key.

Before regenerating, sync the latest account/security record if the app has a
server source of truth. After regeneration, write the new hash/version first,
then update drawer UI from the confirmed result. If the server write fails, keep
the old key active and show an error instead of replacing local UI state.

## Security Notes

- Treat raw recovery keys like passwords.
- Do not log recovery keys.
- Do not send recovery keys to analytics.
- Do not expose recovery hashes to public clients unless your architecture
  explicitly accepts that risk.
- Rate-limit recovery attempts.
- Lock or throttle after repeated failed attempts.
- Consider requiring a second factor or email confirmation for high-stakes apps.
- Keep an audit event for recovery reset and regeneration.

## Product Decision

Small/private apps may choose convenience and show the current recovery key in a
profile drawer. Public or sensitive apps should usually show the raw key only at
generation time, then store only the hash.

Choose one policy deliberately and document it:

```text
Recovery key display policy:
- Small/private convenience mode: drawer can display and copy current key.
- Hardened mode: drawer shows status/date only and can regenerate a new key.
```

## Acceptance Checklist

- Signup generates and displays a recovery key.
- The stored value is a hash, not only a raw key.
- User can copy the key.
- User can reset password with account identifier + recovery key.
- Reset creates a new recovery key and invalidates the old one.
- Signed-in user can regenerate recovery key.
- Regeneration invalidates the old key.
- Wrong recovery key fails cleanly.
- Repeated failed attempts are throttled or rate-limited.
- The behavior is documented in the account management notes.
- Server-backed projects verify reset/regeneration against the latest server
  hash/version, not local cache.
