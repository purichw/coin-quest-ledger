# Native character creation and Home — 2026-10-12

## Scope and gate

User-requested next flow: character creation and Home, existing Firebase and
website fonts, exercised on a real iOS Simulator before any later flow.
Gate passed: creation, Home, cold process restart and fresh password login.

## Runtime and source

- App's own Debug binary `com.purichwc.coinquestledger`, iPhone 17 Pro / iOS 26.5,
  Simulator `7FEE6572-2952-4E46-9649-532C62A2CA42`, Xcode 27 Device Hub.
- Node 24.21.0, Expo 57, React Native 0.86.3. Existing native modules only; no
  native rebuild needed for this JS/TS/asset change. Initial process PID 98926.
- Metro localhost:8093 restarted to load the scoped portrait watch folder.
  All portraits use the website's existing `assets/rpg-portraits/*.png` files;
  no second copy or remote artwork dependency.
- Mitr, IBM Plex Sans Thai and Chakra Petch remain local bundled font assets.
- Sources: `shared/profile-hub.js`, `shared/profile-character-create.js`,
  `shared/pointy-logic.js`, `data-contracts.md`, `leveling-canon.md`, and the
  relevant owner/public-get Firestore rules. No web/Admin/backend/rules changes.

## Product/data behavior

- Account without a character enters creation; an existing owned character
  enters Home. Recovery-key acknowledgement still precedes player entry.
- All 18 canonical classes and both appearances are available. Draft name,
  class and appearance stay in memory across native navigation/foreground
  checks; sign-out clears the draft. Unsaved drafts do not survive process exit.
- Creation uses the reserved User ID as the new Character ID. A Firestore
  transaction reads the latest owner profile, username mapping, User ID
  reservation and character before writing. It links `users/{uid}`,
  `usernames/{username}`, `userIds/{id}` and `characters/{id}` atomically.
- Repeated creation preserves the first saved character, XP and timestamps.
  Ownership conflicts, suspended pointers and missing linked characters fail
  closed. Existing linked legacy IDs are preserved instead of reallocated.
- Home displays real character identity, stored character XP and canonical
  character level; native account/details routes and refresh are functional.
  It does not display invented financial balances, boards or activity counts.
- XP display deliberately reads `characters/{id}.xp` and labels it as stored
  XP. Legacy records without a valid stored XP show an explicit unknown state;
  cross-board XP aggregation belongs to the later ledger/profile work.
- Creation starts at actual persisted `xp: 0`; no simulated progress or reward
  writes. Changing a saved character's appearance/name is outside this flow.

## Observed checks

| Check | Evidence |
| --- | --- |
| TypeScript / lint | PASS |
| Focused contract tests | 20 PASS (8 Auth + 12 character/canon/ownership cases) |
| Signed-in account without character | PASS; real `characters/2150` GET returned 404 before creation |
| Missing name / class | PASS; Thai validation, no write, missing name refocused |
| Actual software keyboard | PASS; native `A` key input, Thai name entered, Done dismisses keyboard |
| Appearance / class picker | PASS; male/female images change, selected state and persistent summary match; native swipe reaches final classes |
| Account navigation and Back | PASS; draft `ผู้กล้า QA`, class and appearance retained |
| Cancel confirmation | PASS; draft retained, exact character GET still 404 |
| Create on existing Firebase | PASS; `ผู้กล้า QA`, Ranger/female, ID 2150, stored XP 0 |
| Identity reservations | PASS; public character owner matches username/User ID owners, all links use 2150; see sanitized JSON |
| Home and character details | PASS; names, portrait, class, owner, ID, level 1 and 0 XP match; native Back returns Home |
| Refresh | PASS; visible loading state then same Home/character returned |
| Process terminate/relaunch | PASS; new PID 1230 restored Home, Ranger/female ID 2150 and XP 0 |
| Sign-out and fresh password login | PASS; native confirmation, loading, then Home with the same character; no creation prompt |

Only the existing test account `cqsim-20261012` was used. New credentials were
not created. The prior user-provided test password is not stored in the repo,
test fixtures, logs or screenshots. No other account or finance data was changed.

## Evidence

- [Loading state](mobile-character-home-qa-2026-10-12/loading.png)
- [Home after creation](mobile-character-home-qa-2026-10-12/home-created.png)
- [Character details](mobile-character-home-qa-2026-10-12/character-details.png)
- [Home restored after fresh login](mobile-character-home-qa-2026-10-12/home-restored.png)
- [Sanitized Firebase checks](mobile-character-home-qa-2026-10-12/firebase-check.json)

The character picker, keyboard and validation states were inspected directly
through Device Hub screenshots. The saved capture taken during Fast Refresh
shows loading, so it is labeled as loading rather than picker evidence.

## Limits

Android, physical iPhone, release signing, ledger modules, broad web/Admin
regressions, rules deployment and production-wide security review were skipped.
Race/collision/legacy cases have contract-test coverage; production collision,
offline transaction failure and process interruption during the write were not
injected against live accounts. No commit, push or deploy was requested.

## Primary API references

- [Expo 57 Metro and asset imports](https://docs.expo.dev/versions/v57.0.0/config/metro/)
- [Expo 57 native stack](https://docs.expo.dev/versions/v57.0.0/sdk/router/stack/)
- [React Native 0.86 Image](https://reactnative.dev/docs/0.86/image)
- [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
