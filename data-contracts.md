# Coin Quest Ledger Data Contracts

Last updated: 2026-10-16

## Purpose

This file documents the live data shapes that should be preserved when adding features, refactoring, or migrating to real auth/security. These are practical contracts, not strict TypeScript schemas. The app has legacy data and normalization paths, so new code should tolerate missing optional fields and keep migrations backward-compatible.

2026-06-21 profile refactor note: splitting `shared/profile-hub.js` into focused `shared/profile-*.js` modules did not change the persisted Firestore/localStorage contracts below.

2026-10-12 rebuild: native and web share owner-scoped `playerModules/{uid}` for Debt Dragon, Treasury and Compare. `shared/module-cloud.js` bridges account-scoped browser stores, preserving unsynced local data through an explicit conflict choice and backups. Verify the release commit and production alias before claiming that an installed/deployed client has these contracts.

2026-10-12 local frontend regression: financial forms use the shared strict
validators in `shared/pointy-logic.js` before mutation. Browser character creation
persists its local mirror only after the Firebase transaction commits; account
hydration waits for the cloud record before offering character creation. Browser
local backup exports now use `__coin_quest_backup: 2` with the owner UID and an
allowlist of current-account finance/profile keys and presentation preferences.
Version-1 imports are accepted only for compatible current-account keys;
authentication/session/owner tokens are never imported. Finance payloads are
validated before any writes. This remains a local-data format, distinct from
native `coin-quest-player-v1`; restoring local data is not evidence of a completed
cloud sync. See `docs/frontend-regression-2026-10-12/README.md` for test and release
status.

Player profile board discovery includes `access.ownerUids`; legacy name/character
and owner-hash links remain supported. Shared-board frontend XP persistence only
updates an existing character whose `ownerUid` is the currently authenticated
UID; it never creates a missing character or writes another player's record.
Date-only expense strings remain date-only on web (no implied UTC time).
Native editing preserves an existing optional expense date, including an absent
date or an existing timestamp, until the user explicitly selects another date.
Only new native expenses default to today; opening/canceling the date picker
does not add a date to an existing undated record.

For account lifecycle implementation details, see `ACCOUNT_MANAGEMENT_IMPLEMENTATION.md`
and `ADMIN_PORTAL_IMPLEMENTATION.md`. For access control and rule deploy
assumptions, see `SECURITY_AND_FIREBASE_RULES.md`.

## Global Conventions

- Four-digit public IDs are strings, not numbers.
- Monetary values are numbers in Thai baht unless a field explicitly says otherwise.
- Timestamps are mixed today: local/test data often uses `Date.now()` numbers; Firestore writes may use `serverTimestamp()`. Read code should handle both.
- `?test=1` routes use local/session storage instead of Firestore.
- Production Firestore reads for live/admin-editable content should request the
  server source through `PointyFirebase.freshGet`. Browser cache or local
  fallback may be used for explicit local-first modules and `?test=1`, but must
  not replace a live `trips`, `users`, `usernames`, `characters`, or
  `boardInvites` server read.
- Do not remove unknown fields from persisted board data unless doing an intentional migration.
- User-facing strings must remain Thai/English capable through `lang.js` or local module copy maps.

## Firestore Collections

### `trips/{id}`

Source of truth for Party Ledger boards in normal mode. Normalization lives in `PointyLogic.normalizeTripState`.

```js
{
  tripName: string,
  participants: string[],
  expenses: Expense[],
  budgets: Record<string, number>,
  heroClasses: Record<participantName, classId>,
  heroGenders: Record<participantName, "male" | "female">,
  heroSkins: Record<participantName, skinId>,
  settleXp: Record<participantName, number>,
  characterIds: Record<participantName, characterId>,
  promptpay: Record<participantName, string>,
  activeCampaignId: string,
  campaigns: Campaign[],
  admin: BoardAdminMeta,
  access?: TripAccessMeta,
  settings: TripSettings,
  updatedAt: timestamp
}
```

Important rules:

- `participants` names are still important keys across several maps.
- `characterIds[name]` links a board participant to `/character/?id=####`.
- `admin.characterId` is optional and links Board Admin ownership to a Character ID when known.
- `access` is forward-compatible access metadata written by current boards. It is
  not yet enforced by Firestore Rules; `trips` remain signed-in-only until the
  owner/member migration is complete.
- `settings.theme` is legacy/module-local and must not override global `localStorage.pointy_theme` on route load.
- Preserve unknown fields when editing a board unless the operation is explicitly "publish normalized snapshot".

### `TripAccessMeta`

```js
{
  visibility: "authenticated" | string,
  ownerUids: string[],
  memberUids: string[],
  memberCharacterIds: characterId[],
  updatedAt: epochMs
}
```

Rules:

- `ownerUids` is seeded from the signed-in Board Admin when available.
- `memberUids` includes the current signed-in user on writes.
- `memberCharacterIds` is derived from board `characterIds`.
- This object is migration scaffolding only until `firestore.rules` moves from
  signed-in-only board access to owner/member scoped board access.

### `Expense`

```js
{
  id: string | number,
  desc: string,
  icon: string,
  amount: number,
  paidBy: participantName,
  payers?: Record<participantName, number>,
  sharedBy: participantName[],
  split: SplitRule,
  receipt?: string,
  date?: string
}
```

Rules:

- Multi-payer expenses prefer `payers` when present and positive.
- Fallback is `{ [paidBy]: amount }`.
- `sharedBy` must be non-empty for a valid expense.

### `SplitRule`

```js
{
  mode: "equal" | "shares" | "exact" | "percent" | "items",
  weights?: Record<participantName, number>,
  items?: Array<{
    desc?: string,
    amount: number,
    claimedBy: participantName[]
  }>
}
```

Rules:

- `equal` ignores weights.
- `shares`, `exact`, and `percent` use `weights`.
- `items` uses item claimers; unclaimed items fall back to all shared participants.

### `Campaign`

```js
{
  id: string,
  tripName: string,
  participants: string[],
  expenses: Expense[],
  budgets: Record<string, number>,
  heroClasses: Record<participantName, classId>,
  heroGenders: Record<participantName, "male" | "female">,
  heroSkins: Record<participantName, skinId>,
  characterIds: Record<participantName, characterId>,
  promptpay: Record<participantName, string>,
  settleXp: Record<participantName, number>,
  createdAt: timestamp,
  completedAt: timestamp | null
}
```

Campaigns are quest-board history slices. They reuse most board-level maps.

### `BoardAdminMeta`

```js
{
  passwordHash: string,
  ownerHash: string,
  adminId: string,
  adminName: string,
  characterId: string,
  createdAt: timestamp | null,
  urlLocked: boolean
}
```

Rules:

- `adminId` may intentionally repeat across boards.
- `ownerHash` groups a local Board Admin identity across boards.
- `passwordHash` cannot be reversed. Password reset means replacing the hash.
- `urlLocked` prevents accidental URL/board ID edits in the trip UI.

### `TripSettings`

```js
{
  entry: "form" | string,
  settleView: "list" | string,
  theme: "tavern" | "dungeon" | string,
  accent: string,
  stats: boolean,
  sound: boolean,
  animations: boolean
}
```

`theme` is retained for backward compatibility. The live global theme source is `localStorage.pointy_theme`.

### `characters/{id}`

Character records are merged with board-derived history by `PointyLogic.buildCharacterProfile`.

```js
{
  id: characterId,
  name: string,
  class: classId,
  gender: "male" | "female",
  skin: skinId,
  xp: number,
  debtXp?: number,
  trips?: Record<tripId, number>,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

Rules:

- Real account-created characters include `ownerUid`, `userId`, `username`, and
  `accountName` so Character ID can be traced back to the Firebase Auth user.
- Missing `class`, `gender`, or `skin` should fall back from latest matching board or deterministic defaults.
- `xp` is preferred when present.
- If `xp` is absent, profile aggregation can derive XP from `trips`, `debtXp`, fronted money, and settlement XP.
- Character XP level math is canonical in `PointyLogic.levelFromXp()` and uses the current threshold curve in `leveling-canon.md`.

### Leveling / Reputation

Leveling has two explicit tracks:

```js
CharacterXP -> PointyLogic.levelFromXp(xp)
ProfileReputation -> PointyLogic.levelFromReputation(reputation)
```

Feature files must not define their own level thresholds. `PointyLogic.levelFromRenown()` exists only as a compatibility alias. When XP/Reputation rewards, thresholds, or title milestones change, update `leveling-canon.md`, `shared/pointy-logic.js`, and tests together.

### `adminRevisions/{id}`

Created by Super Admin publish.

```js
{
  id: string,
  createdAt: timestamp,
  author: string,
  changes: RevisionChange[]
}
```

`changes` is currently a simple list of board/admin/user changes produced by `/admin/`. Treat it as audit metadata, not a full event-sourced restore log.

Repo rules now restrict `adminRevisions` to the Google-auth Super Admin. Deploy the latest `firestore.rules` through Firebase CLI/Console before treating live revision logs as protected.

### `users/{uid}`

Created by `shared/profile-hub.js` after Firebase Auth username/password signup.
The user types a username, not a real email; the app maps it to an internal
Firebase Auth email of `username@coinquest.local`.

```js
{
  uid: firebaseAuthUid,
  username: string,
  email: internalAuthEmail,
  userId: fourDigitPublicUserId,
  name: displayName,
  character: CharacterRecord | null,
  characterId: characterId | "",
  provider: "firebase",
  recoveryHash?: sha256(normalizedUsername + ":" + normalizedRecoveryCode),
  recoveryIssuedAt?: epochMs,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

Rules:

- `uid` is the durable account owner key.
- `userId` remains the public four-digit app identity.
- Current product canon is one active `character` per user.
- Firebase Authentication/email-password is enabled for `pointy-personal-toolkit`.
- The profile side panel may display the locally mirrored raw Recovery ID for the
  signed-in owner. New production writes must not persist raw `recoveryCode` to
  Firestore.
- `users/{uid}.recoveryHash` is owner/Super Admin scoped by rules and is the
  current server authority for Recovery ID reset.
- Player recovery and Super Admin reset run through Vercel Admin SDK endpoints,
  then preserve `userId` and `characterId` by updating `usernames/{username}`,
  `userIds/{userId}`, `users/{uid}`, and `characters/{characterId}`.

Native device-local recovery storage (October 16 source; release tracked
separately) uses Expo SecureStore with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`:

- `coinquest.signup.{uid}` and `coinquest.recovery.{normalizedUsername}` hold
  temporary reveal data. `coinquest.recovery.saved.{uid}` holds the acknowledged
  `{ username, code }` for that device only.
- Display/copy requires the current authenticated owner and a fresh private
  user record. A candidate must match its normalized username and current
  `recoveryHash`; an old code after rotation is rejected.
- Acknowledgment validates the code actually displayed before trying to save
  it. Storage failure remains explicit and does not invalidate the user's
  confirmed external copy. An in-memory map of owner UID to acknowledged hash
  can suppress an uncleared temporary reveal for the current session only.
- No new raw recovery value is written to Firestore or included in native
  public profiles, finance backup/export or telemetry. The native account
  panel hides revealed text on blur/background. This changes local convenience
  storage, not backend reset authority or existing UIDs.

Native public-profile loading reads `characters/{id}` and shared `trips`, then
passes only public character fields to canonical profile aggregation. It does
not load `users/{uid}` or `playerModules/{uid}` for another owner and performs
no progression writes. `private=1` and the profile privacy switch mask monetary
display/share defaults; they do not alter Firestore read permissions.

### `users/{uid}/boardInvites/{inviteId}`

Board invite subcollection for adding another account's real character to a
Party Ledger board. The document lives under the target account owner, not the
inviter.

`shared/board-invites.js` owns payload construction and status updates.

```js
{
  id: `${tripId}_${targetCharacterId}`,
  tripId: boardId,
  tripName: boardName,
  targetCharacterId: characterId,
  targetOwnerUid: firebaseAuthUid,
  targetName: characterDisplayName,
  targetClass: classId,
  targetGender: "male" | "female",
  targetSkin: skinId | "",
  inviterUid: firebaseAuthUid | "",
  inviterName: displayName,
  inviterCharacterId: characterId | userId | "",
  status: "pending" | "accepted" | "declined" | "expired",
  createdAt: epochMs,
  expiresAt: epochMs,
  respondedAt?: epochMs
}
```

Rules:

- Created when a board admin invites by an existing four-digit Character ID.
- Real-character invite does not add the participant to the board until the
  target account accepts from Reminders.
- Pending invites expire after 24 hours.
- Decline requires user confirmation before status becomes `declined`.
- Accept writes the target character into the board and marks the invite
  `accepted`.
- Test mode mirrors this collection in `localStorage.pointy_board_invites_v1`.
- This flow is distinct from `Add Guest`, which is board-local and creates no
  real Character ID.

### `usernames/{username}`

Lookup table for username login without requiring real user email addresses.

```js
{
  username: string,
  uid: firebaseAuthUid,
  authEmail: internalAuthEmail,
  userId: fourDigitPublicUserId,
  characterId: characterId | "",
  recoveryIssuedAt?: epochMs,
  adminResetAt?: epochMs,
  updatedAt: timestamp
}
```

Deployed repo rules prevent username mapping takeover: an update is allowed only
for Super Admin or the current owner UID preserving the same UID, with deleted
tombstone reuse limited to same-ID recovery. `usernames/{username}` remains
public `get` for login resolution, so new writes must not add or change
`recoveryHash`; backend recovery/reset deletes legacy public hashes when it
touches an account.

### `userIds/{userId}`

Low-detail reservation collection for four-digit public User ID collision
checks. This avoids querying `users` from normal player clients after
`users/{uid}` became owner/Super Admin scoped.

```js
{
  userId: fourDigitPublicUserId,
  uid: firebaseAuthUid | "",
  characterId: characterId | "",
  characterIds?: characterId[],
  status: "active" | "deleted",
  lifecycleStatus?: "deleted",
  deleteReusable?: boolean,
  previousUid?: firebaseAuthUid,
  deletedAt?: timestamp,
  updatedAt: timestamp
}
```

Rules:

- Public `get` is allowed for collision checks; `list` is denied.
- Owner/Super Admin can create/update the active reservation.
- Deleted reusable tombstones can be reclaimed by a new signed-in UID while
  preserving the same User ID.
- Permanent delete tombstones this record along with `usernames/{username}`.

### `playerModules/{uid}`

Shared player module state for Debt Dragon, Treasury, and Compare. The document ID is always the Firebase Auth `uid` of the owner.

```js
{
  uid: firebaseAuthUid,
  characterId: characterId,
  schemaVersion: 2,
  debt: {
    strategy: "avalanche" | "snowball",
    dragons: Array<{
      id: string,
      name: string,
      type: "card" | "autoloan" | "student" | "mortgage" | "medical" | "tax" | "other",
      original: number,
      balance: number,
      apr: number,
      payment: number,
      interestMode: "compound" | "simple",
      payMode: "monthly" | "adhoc",
      dueDay?: number,
      log: Array<{ id: string, amount: number, date: string, ts: number, move: string }>,
      slain: boolean,
      slainAt?: epochMs | null
    }>,
    stats: { interest: number }
  },
  treasury: {
    month: "YYYY-MM",
    income: number,
    categories: Array<{ id: string, name: string, glyph: string, budget: number }>,
    bills: Array<{ id: string, name: string, amount: number, catId: string, dueDay: number, archived?: boolean }>,
    expenses: Array<{ id: string, note: string, catId: string, amount: number, date: "YYYY-MM-DD", billId?: string, onTime?: boolean }>,
    history: Array<{ month: string, income: number, spent: number, expenses?: Array<object> }>,
    stats: { monthsWon: number, logged: number, onTime: number }
  },
  comparisons: Array<{
    id: string,
    name: string,
    icon: string,
    baseUnit: string,
    offers: Array<{ id: string, merchant: string, price: number, qty: number, unit: string, buy?: number, free?: number }>
  }>,
  updatedAt: timestamp
}
```

Rules:

- Only the owner UID or Super Admin can read/create/update. Only Super Admin can delete.
- Native imports `shared/pointy-logic.js` through `src/domain/canon.ts`. Legacy Treasury `name/category` are read as `note/catId`; unknown fields survive normalization.
- Native writes fresh-read the owner lifecycle and active character, compare the loaded module baseline, and merge only the affected module. Concurrent web/native changes produce a reload-required error.
- Web `shared/module-cloud.js` serializes saves, compares server baselines, and stops stale writes. Account changes invalidate in-flight work. Differing browser/cloud data needs a user choice; both sides are backed up first.
- Do not write `undefined` into nested state; Firestore rejects it. Optional fields should be omitted or set to `null` intentionally.
- Web browser stores remain account-scoped caches/drafts. The bridge loads cloud on connection; this is not a realtime listener or an offline write queue. Reload/refresh before continuing edits from another device.
- Native screens must never show static Claude/sample financial data. If a document is absent, create an empty owned module document or show an empty state with a real create/log action.
- Recoverable rows use `expenseTrash`, `logTrash`, `offerTrash`, `categoryTrash` or an `archived` flag. Campaign snapshots include their own `expenseTrash`, `removedMembers`, and `settlementRecords`; these must not leak across campaign switches.
- Native `coin-quest-player-v1` backup contains the owner UID and all three finance modules, not authentication secrets or board ownership. Restore validates the owner and values, previews counts, saves a before-restore file, then uses a transaction/baseline check. Board exports are separate. This format is distinct from the legacy web local-data backup.

### Admin Delete Backend

Backend-only permanent delete endpoints:

- `/api/admin-delete-status`: `GET`, no secrets returned. Reports whether Vercel has Firebase Admin service-account env vars.
- `/api/recover-account`: `POST`, public recovery form endpoint. Verifies
  Recovery ID server-side, updates the existing Auth password when possible,
  stores only the new hash on `users/{uid}`, deletes legacy public username
  hashes, and returns the new raw Recovery ID once.
- `/api/admin-reset-user`: `POST`, requires a Google-auth Super Admin Firebase
  ID token. Resets or recreates a user credential through Firebase Admin SDK
  without replacing the Admin browser session.
- `/api/admin-delete-user`: `POST`, requires `Authorization: Bearer <Firebase ID token>` from Google-auth Super Admin `purich.wc@gmail.com`. Deletes the Firebase Auth user, `users/{uid}`, and character docs. It writes `usernames/{username}` as a `lifecycleStatus: "deleted"` / `deleteReusable: true` tombstone with the old `userId` and `characterId`, so a future signup with the same username reuses the same public identity.

Accepted production env:

- `FIREBASE_SERVICE_ACCOUNT_JSON`, or
- `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`

Delete payload:

```js
{
  uid?: firebaseAuthUid,
  userId?: fourDigitPublicUserId,
  username?: string,
  characterIds?: characterId[],
  reason: string
}
```

## Local Storage Contracts

### `pointy_auth_v1`

Local mirror of the current auth account. In production it mirrors Firebase
Auth/Firestore `users/{uid}`; in explicit `?test=1` regression mode it remains
the local account source. This is not a security boundary.

```js
{
  uid?: firebaseAuthUid,
  provider?: "firebase" | string,
  username: string,
  email: string,
  userId: string,
  name: string,
  recoveryCode?: string,
  recoveryHash?: string,
  recoveryIssuedAt?: epochMs,
  character?: {
    id: characterId,
    name: string,
    class: classId,
    cls: classId,
    gender: "male" | "female",
    skin: skinId
  }
}
```

Current `?test=1` regression accounts:

- `pointy` / `quest123` / User ID `3720`
- `nok` / `quest123` / User ID `9637`
- `bank` / `quest123` / User ID `5521`

The current Claude loop implemented in `shared/profile-hub.*` is one account =
one active character. Accounts without `character` are routed through Character
Creation, and the character is mirrored into the account-scoped character
registry.

### Account-scoped local keys

`shared/account-scope.js` scopes browser-local progress/cache to the active
account. The key format is:

```txt
<base-key>::uid_<firebaseUid>
<base-key>::user_<publicUserId>
<base-key>::name_<username>
```

Priority is `uid`, then public User ID, then username. When there is no signed-in
account, legacy unsuffixed keys remain the guest/test fallback. Signed-in users
must not read old browser-wide module progress as account progress.

Currently scoped bases:

- `pointy_profile_v1`
- `pointy_character_registry_v1`
- `coin_quest_trip_snapshots_v1`
- `pointy_debt_v5`
- `pointy_treasury_v1`
- `pointy_compare_v2`
- `last_trip_id`

`coin_quest_trip_snapshots_v1` is a convenience snapshot for current open
boards, guest/test flows, and local profile summaries. For a real signed-in
account in production it must not override live board data; profile surfaces
should use fresh Firestore board reads when showing boards or computing
Firestore-backed board history.

### `pointy_accounts_v1`

Local Sign Up registry for explicit `?test=1` regression mode. Production
signups use Firebase Auth and `users/{uid}`.

```js
Array<{
  email: string,
  password: string,
  userId: string,
  name: string,
  character: pointy_auth_v1.character | null
}>
```

Rules:

- Regression accounts are built in only under `?test=1`; Sign Up-created test accounts live here so they can sign in again.
- Passwords are local plaintext in regression mode only. Do not treat this as production auth.
- When Character Creation finishes, both `pointy_auth_v1.character` and the matching `pointy_accounts_v1[].character` are updated.

### `pointy_character_registry_v1`

Local character cache/registry, keyed by Character ID:

```js
{
  [characterId]: CharacterRecord
}
```

Used by Party Ledger, Debt Dragon, Character Profile, and tests. In normal mode,
the account-scoped key is the local fallback and Firestore `characters/{id}`
should be treated as the durable source when available. Character Profile may
also use the active `pointy_auth_v1.character` when the requested Character ID
matches the signed-in account.

### `pointy_theme`

Global theme source of truth:

```js
"tavern" | "dungeon"
```

Mirrored into `coin_quest_ui_v1.theme` for compatibility.

### `coin_quest_ui_v1`

Shared UI compatibility/settings object. At minimum:

```js
{
  theme: "tavern" | "dungeon"
}
```

Do not assume this object only contains `theme`.

### `pointy_compare_v2`

Price Arena comparisons stored in Home/Compare.

```js
Array<{
  id: string,
  name: string,
  icon: string,
  offers: Array<{
    id: string,
    store: string,
    price: number,
    qty: number,
    unit: string,
    promo?: string
  }>
}>
```

Normalization/ranking belongs in `shared/pointy-logic.js`.

### Debt Dragon

- Normal key: `pointy_debt_v5`
- Test key: `pointy_test_debt_v1`
- Settings key: `pointy_debt_settings_v1`

Debt Dragon is local-first today. If it starts writing character progress to Firestore, make that a planned migration.

Debt Dragon debts now track daily interest state in addition to the legacy
monthly forecast fields:

```js
{
  dragons: Array<{
    id: string,
    original: number,
    balance: number,
    apr: number,
    payment: number,
    payMode: "monthly" | "adhoc",
    interestMode: "compound" | "simple",
    dueDay: 0 | 1..31,
    createdAt: epochMs,
    interestAccruedAt: epochMs,
    log: Array<{
      id: string,
      date: string,
      amount: number,
      interest?: number,
      principal?: number,
      accruedInterest?: number,
      balanceBefore?: number,
      balanceAfter?: number,
      days?: number,
      ts: epochMs,
      move: string
    }>
  }>,
  lastAccrued: epochMs,
  stats: { interest: number }
}
```

Rules:

- `interestAccruedAt` is the date through which the current `balance` has already absorbed daily interest.
- New/legacy debts without `interestAccruedAt` normalize from `lastAccrued`, then `createdAt`, then now.
- Strike/payment first accrues interest from `interestAccruedAt` to the payment date, then applies the payment to the updated balance.
- Compound interest uses the current balance as the daily base; simple interest uses the original principal as the daily base.
- `dueDay: 31` represents "the 31st when it exists"; due display clamps it to the last valid day for shorter months.

### Treasury

Treasury uses local module storage in `treasury/app.js`. Keep it local-first until a broader persistence/security plan is chosen.

### Admin Drafts

The Admin Portal stores local drafts and local test revisions in browser storage before publish. Draft data should never be treated as published truth.

The current Admin UI derives Users and active Characters from board data and the
character registry, then displays one active Character per User ID to match the
current player/auth canon. Do not reintroduce admin-only multi-character user
state unless the product model changes first.

## Session Storage Contracts

### `pointy_test_trip_{id}`

Test-mode trip document used by Playwright and `?test=1` routes.

Shape should match `trips/{id}` after normalization.

### Admin Unlock Session Keys

Party Ledger still uses session keys for local board/admin convenience flows. Super Admin production access uses Firebase Google Auth allowlisted to `purich.wc@gmail.com`; the local Admin gate remains only under `?test=1` for automated regression and is not security.

## Derived Contracts

### Character Profile

`PointyLogic.buildCharacterProfile(characterId, boards, record, opts)` returns:

```js
{
  id: characterId,
  record: CharacterRecord,
  names: string[],
  displayName: string,
  class: classId,
  gender: "male" | "female",
  skin: skinId,
  xp: number,
  level: { lvl: number, pct: number, into: number, need: number },
  reward: { glyph: string, title: { th: string, en: string } },
  createdAt: number,
  updatedAt: number,
  totals: {
    paid: number,
    share: number,
    fronted: number,
    balance: number,
    quests: number,
    boards: number,
    settledBoards: number,
    activeBoards: number,
    settlementXp: number
  },
  boards: CharacterBoardRow[],
  adminBoards: CharacterBoardRow[],
  badges: Badge[]
}
```

The Character Profile renderer should stay presentation-focused. Aggregation changes belong in `shared/pointy-logic.js`.

## Migration Rules

- Add optional fields instead of replacing existing fields when possible.
- Normalize on read; write only the fields needed for the current operation.
- Preserve unknown board data unless a publish/migration operation intentionally rewrites a normalized snapshot.
- Full `npm test` is required for changes to `trips`, `characters`, admin ownership, character aggregation, split math, imports/exports, or storage keys.
## Contract corrections — 2026-10-12

- `playerModules/{uid}` module snapshots replace the chosen top-level map via
  `mergeFields`; other modules stay intact. Backup restore replaces all three
  module fields. Full freshly read board snapshots replace the document so
  deleted nested keys cannot reappear through deep merge.
- `boardInvites` IDs can now include a unique attempt suffix. Legacy IDs remain
  readable. Reply + board membership are one transaction, with current account,
  character, expiry, board availability and pending status revalidated.
- `users/{uid}.recoveryReset = { id, expiresAt }` is a server-owned temporary
  lease. Client modifications during the lease are rejected. Recovery preserves
  UID and consumes the old recovery hash only when its Firestore completion commits.
- `accountRecoveryLimits/{digest}` stores `{count, firstAt, expiresAt}` for shared
  rate limiting. It is private to Admin SDK; `expiresAt` can use a TTL policy.
- Debt `historyBase` records balance, calendar day and interest terms at the first
  tracked payment. Edits/removal/restore replay later payments and interest.
  Incomplete legacy histories or changed terms that cannot be reconciled fail
  visibly rather than silently modifying money. Removed rows stay in `logTrash`.
- Removing an Auth-linked account converts its board member into a local guest:
  participant names, expenses and shares remain; registry/access links are removed.
  It does not delete another participant's financial history.
