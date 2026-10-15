# Local iOS QA account

This harness runs the app against local Firebase Auth and Firestore Emulators.
The native UI, AuthProvider, services, domain normalization and repository
Firestore Rules remain active. All amounts and names below are synthetic QA
fixtures, not production records or a replacement release UI.

## Start

Use the Node version in `mobile/.nvmrc` (24.21.0), with the repository and mobile
dependencies already installed. From `mobile/`:

```sh
npm run qa:emulator
```

Wait for `Local native QA is ready`. The command starts the existing
`firebase.test.json` emulator configuration, seeds its local QA records and
verifies them with the client SDK. Leave that terminal running.

In a second terminal, restart Metro explicitly in QA mode:

```sh
EXPO_PUBLIC_NATIVE_QA_EMULATORS=1 npm run start:simulator
```

Reload the app's own development binary in iOS Simulator. Enter:

| Field | Value |
| --- | --- |
| Username | `nativeqa` |
| Password | `CoinQuest-QA-2026!` |
| Local Firebase UID | `native-qa-adventurer` |
| User / Character ID | `8601` |
| Board | `native-qa-party` |

The fixture includes an explicitly named QA adventurer, a two-person party
with an expense, one debt, a monthly treasury and one comparison with two
offers. Native edits persist in the local emulator and can be reopened through
the normal services. No production login or mutation is needed for these checks.

## Isolation

- Firebase project is fixed to `demo-coin-quest`.
- Auth is fixed to `127.0.0.1:19098`; Firestore to `127.0.0.1:18088`.
- The harness checks the local Emulator Hub before creating an Admin client and
  refuses externally supplied nonlocal emulator hosts or another project ID.
- The app uses the named Firebase app `coinquest-native-qa` and a different API
  key, separating its remembered Auth credential from the production app.
- Emulator mode requires both a development bundle and the explicit environment
  flag. A release bundle with this flag refuses startup before Firebase connects;
  it does not fall back to production.
- Native recovery refuses to call the production recovery API in this mode.
  Recovery API success is not part of this local harness's evidence.
- Sharing retains the product's canonical URL format. Do not send the QA links
  to others; the seeded IDs exist only in the local database.

The seed step writes only its named local fixture documents. It does not clear
the database. Running it again restores those fixture records; do so only when
the current QA edits no longer need inspection:

```sh
node scripts/native-qa-emulator.mjs seed
```

## Verification

```sh
npm run test:qa
node scripts/native-qa-emulator.mjs verify
```

`test:qa` checks normal production configuration, explicit development emulator
configuration, session separation, hot reload and refusal of QA mode in a
release bundle. It does not contact Firebase.

The live `verify` command uses local Firebase client SDK calls to check login,
the account and character contracts, the board list, an owner module
transaction, other-owner access denial and signed-out access denial under the
repository Rules. It preserves the current comparisons while writing the same
map through the owner transaction.

On 2026-10-16, all five isolation tests and the live verification passed. App
interaction and screenshot evidence are recorded separately in this directory.

## Web ↔ native synchronization

With the same emulator still running, start the response-only web adapter from
`mobile/`. This command neither seeds nor rewrites existing emulator data:

```sh
node scripts/native-qa-emulator.mjs web
```

Open **http://127.0.0.1:4570/** and log in normally with `nativeqa` /
`CoinQuest-QA-2026!`. The fixture board is
**http://127.0.0.1:4570/trip/?id=native-qa-party**. Do not add `?test=1`: that
existing website flag uses browser fixtures instead of real Firebase services.

The adapter serves the repository's current player web source. Only the HTTP
response for `shared/firebase-client.js` receives a fixed demo configuration
and eager compat-SDK emulator connections before the original page code runs.
The production source/configuration on disk is unchanged. The origin is fixed
to `127.0.0.1:4570`, uses a distinct browser Auth/storage origin, displays a
`LOCAL QA` marker, and disables caching. Its CSP permits data connections only
to itself and the two loopback emulators. API, Admin and private-file routes
are blocked; no requests are proxied to production. The old development server
on port 4569 is unrelated and must not be used for writes during this check.

The real shared storage/contracts are:

| Concern | Web and native source of truth |
| --- | --- |
| Identity | `usernames/nativeqa` → Firebase Auth → `users/native-qa-adventurer` |
| Character | `characters/8601` |
| Party and campaigns | `trips/native-qa-party` including the active campaign snapshot |
| Other financial modules | `playerModules/native-qa-adventurer` |
| Party XP / character levels | `shared/pointy-logic.js`: `computeParty`, `splitFrontedXp`, `levelFromXp` |
| Profile statistics / reputation / achievements | `buildCharacterProfile`, `playerProgress`, `PLAYER_ACHIEVEMENTS` from the same shared logic |

Native `domain/canon.ts` imports the shared implementation. Native profile
refresh recomputes per-board XP, combines debt XP, and persists the owned
character's `trips`, `debtXp` and `xp` under a transaction. The web board uses
the same calculations and persists its owned character's per-board XP while
preserving the other trip entries and debt XP. These are real service paths;
the adapter injects no session, UI state or calculation result.

Exercise and capture the actual UI in both directions:

1. Save a distinctly named expense through native. Reload the web board and
   verify its description, amount, total, participants and XP.
2. Add a distinctly named expense through the web form using the same payer
   and equal split. Refresh/reopen the native board and Home/profile. Verify
   the row, total, XP and progress statistics against the web.
3. For the existing two ฿680 expenses, the board total is ฿1,360 and the payer
   fronts ฿680, yielding 34 party XP. Adding ฿200 shared equally with the same
   payer should yield ฿1,560 total, ฿780 fronted and 39 party XP. This assumes
   no other fixture edits or settlement XP; inspect current data first.

Safety tests verify the web response bootstrap, origin refusal, API/Admin and
private-file denial, and outbound-connect policy. They are setup evidence,
not a substitute for the two real UI interactions and screenshots. Stop the
web adapter with Ctrl-C when finished; this leaves the shared emulator running.

Keep the QA browser tab visible while the page-entry gate finishes. The real
gate awaits two animation frames after its assets/fonts/data are ready; an
inactive browser surface can suspend those frames. The QA-only response adds
`data-qa-ready-phase`, `data-qa-holds`, `data-qa-pass`, `data-qa-revision` and
error diagnostics to the existing loader element. It never releases the gate.
`paint` with zero holds and no pass means those frame callbacks have not run.
The CSP permits the web's pinned ExcelJS/QR script URLs while keeping all data
connections restricted to the loopback emulators.

For the read-only other-character flow, add the isolated public record without
resetting the native account, boards or modules:

```sh
node scripts/native-qa-emulator.mjs public-fixture
```

This creates only `characters/8602`, named `มีรา · Public QA` with 420 saved XP
and no party history. Its owner is a distinct fixture identity. It does not
create a second login or any private account/module records, and never replaces
an existing character belonging to another fixture owner. Open native
`/character?id=8602` or web `/character/?id=8602` while signed in as `nativeqa`.
Confirm no edit/archive/recovery controls appear and a refresh does not write
XP. Also check invalid IDs, missing IDs and `&private=1` for both own and other
profiles. The native focused command is `node --test tests/public-character.test.mjs`.

## Stop and return to production configuration

Stop the emulator command with Ctrl-C. Stop and restart Metro without
`EXPO_PUBLIC_NATIVE_QA_EMULATORS`, then reload the app. Avoid placing this QA flag
in `.env` or a release build configuration.

The harness shares ports with `npm run test:backend`; stop it before running that
suite. Emulator data is temporary and disappears when its process exits.
No iPhone connection is required for this local Simulator workflow.
