# Coin Quest Ledger Data Contracts

Last updated: 2026-06-19

## Purpose

This file documents the live data shapes that should be preserved when adding features, refactoring, or migrating to real auth/security. These are practical contracts, not strict TypeScript schemas. The app has legacy data and normalization paths, so new code should tolerate missing optional fields and keep migrations backward-compatible.

## Global Conventions

- Four-digit public IDs are strings, not numbers.
- Monetary values are numbers in Thai baht unless a field explicitly says otherwise.
- Timestamps are mixed today: local/test data often uses `Date.now()` numbers; Firestore writes may use `serverTimestamp()`. Read code should handle both.
- `?test=1` routes use local/session storage instead of Firestore.
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
  settings: TripSettings,
  updatedAt: timestamp
}
```

Important rules:

- `participants` names are still important keys across several maps.
- `characterIds[name]` links a board participant to `/character/?id=####`.
- `admin.characterId` is optional and links Board Admin ownership to a Character ID when known.
- `settings.theme` is legacy/module-local and must not override global `localStorage.pointy_theme` on route load.
- Preserve unknown fields when editing a board unless the operation is explicitly "publish normalized snapshot".

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

- Missing `class`, `gender`, or `skin` should fall back from latest matching board or deterministic defaults.
- `xp` is preferred when present.
- If `xp` is absent, profile aggregation can derive XP from `trips`, `debtXp`, fronted money, and settlement XP.
- Character XP level math is canonical in `PointyLogic.levelFromXp()` and currently uses 600 XP per level. See `leveling-canon.md`.

### Leveling / Renown

Leveling has two explicit tracks:

```js
CharacterXP -> PointyLogic.levelFromXp(xp) // 600 XP per level
ProfileRenown -> PointyLogic.levelFromRenown(renown) // 1200 Renown per level
```

Feature files must not define their own level thresholds. When XP rewards, thresholds, or title milestones change, update `leveling-canon.md`, `shared/pointy-logic.js`, and tests together.

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

## Local Storage Contracts

### `pointy_auth_v1`

Mock login account. This is not secure auth.

```js
{
  email: string,
  userId: string,
  name: string,
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

Current demo accounts:

- `pointy@line.me` / `quest123` / User ID `3720`
- `nok.k@line.me` / `quest123` / User ID `9637`
- `bank@line.me` / `quest123` / User ID `5521`

The current Claude loop implemented in `shared/profile-hub.*` is one mock account = one active character. Accounts without `character` are routed through Character Creation, and the character is mirrored into `pointy_character_registry_v1`.

### `pointy_accounts_v1`

Local Sign Up registry. This is convenience persistence, not secure auth.

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

- Demo accounts are built in; Sign Up-created accounts live here so they can sign in again.
- Passwords are mock/local plaintext for the prototype only. Do not treat this as production auth.
- When Character Creation finishes, both `pointy_auth_v1.character` and the matching `pointy_accounts_v1[].character` are updated.

### `pointy_character_registry_v1`

Local character cache/registry, keyed by Character ID:

```js
{
  [characterId]: CharacterRecord
}
```

Used by Party Ledger, Debt Dragon, Character Profile, and tests. In normal mode, Firestore `characters/{id}` should be treated as the durable source when available.

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

Party Ledger and Super Admin use session keys for local unlock state. These gates are convenience only, not security.

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
