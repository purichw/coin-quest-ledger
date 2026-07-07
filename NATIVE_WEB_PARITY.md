# Native And Web Parity

Last updated: 2026-07-07

## Purpose

This file maps what the web app and native Expo app share, where they differ,
and what must be verified before native work continues.

## Boundary

- Web app: static HTML/CSS/JS on Vercel.
- Native app: Expo / React Native under `mobile/`.
- Native is player-side only. Do not add Admin native screens or a WebView
  wrapper unless the user explicitly changes direction.
- Both use Firebase project `pointy-personal-toolkit`.

## Shared Backend Contracts

| Contract | Web | Native | Notes |
| --- | --- | --- | --- |
| Firebase Auth username/password | yes | yes | username maps to internal `username@coinquest.local` |
| `users/{uid}` | yes | yes | account profile, public User ID, active character |
| `usernames/{username}` | yes | yes | login pointer and recovery hash |
| `characters/{id}` | yes | yes | active character and owner UID |
| `trips/{id}` | yes | yes | Split board reads/writes |
| `users/{uid}/boardInvites` | web player | not primary today | Reminders/invite parity is future native work |
| `playerModules/{uid}` | no for web modules today | yes | native Debt/Treasury/Compare dynamic state |

## Intentional Differences

- Web Debt Dragon and Treasury are local-first and account-scoped through
  localStorage.
- Native Debt Dragon, Treasury, and Compare use Firestore
  `playerModules/{uid}`.
- Web uses Firebase compat SDK from script tags.
- Native uses Firebase modular SDK through `mobile/src/firebaseClient.ts`.
- Web uses shared browser globals such as `PointyLogic`.
- Native mirrors only needed gameplay math in `mobile/src/gameLogic.ts`.

## Native Design Gate

Before any real iPhone build/install:

1. Compare touched native screens against the latest Claude iOS/Android exports
   in `/Users/point/Downloads/Coin iOS Android/`.
2. Check large-title spacing, cards, sheets, bottom tabs, FAB/plus behavior,
   typography scale, portraits, dragon art, empty/loading/error states, and no
   overlap.
3. Confirm no static Claude/sample finance data is displayed as real state.
4. Confirm real Firebase sign-in/signup and Firestore-backed data.

## Native Verification Commands

From `mobile/`:

```bash
npm run typecheck
npx expo export --platform ios --output-dir /tmp/coinquest-mobile-export
```

Before commit/push/deploy after backend contract changes, also run root:

```bash
npm test
```

## Parity Backlog

- Decide whether web Debt/Treasury/Compare should migrate to
  `playerModules/{uid}` or remain local-first.
- Bring board invite/reminder accept/decline parity to native if native board
  collaboration becomes part of MVP.
- Avoid native-only XP/level thresholds; port or share the web canon when
  native displays character/profile levels.
- Solve persistent Firebase Auth across native app restarts as a focused
  follow-up.
