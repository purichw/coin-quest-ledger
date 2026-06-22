# Coin Quest Ledger Mobile

Expo / React Native player-side runtime for the future native player app MVP.

## Current Scope

- iOS-first native shell, not a WebView wrapper.
- Real Firebase Auth username/password sign in and sign up using the web app mapping of `username@coinquest.local`.
- Real Firestore reads/writes for `users/{uid}`, `usernames/{username}`, `characters/{id}`, `trips/{id}`, and `playerModules/{uid}`.
- Screens included: Login, Sign Up with Recovery ID, Character Creation, Home Hub, Split board, Add Expense sheet, Create Board sheet, Profile sheet, and Character page.
- Debt Dragon, Treasury, and Compare use mobile-owned `playerModules/{uid}` Firestore state so native never shows fake static seed data.

## Web Parity Status

The mobile app now targets the same production backend contracts as the web app:

- Auth: user-entered username/password maps to Firebase Auth email `username@coinquest.local`.
- Account: loads and writes `users/{uid}` plus `usernames/{username}`.
- Character: one active character per account, stored in `characters/{id}` and mirrored into `users/{uid}.character`.
- Split: reads real `trips/{id}` documents linked by `characterIds` or `admin.characterId`; create-board and add-expense write back to Firestore.
- Player modules: reads and writes `playerModules/{uid}` for Debt Dragon, Treasury, and Compare. This keeps native dynamic today without pretending the web local-first module storage is already migrated.

Known limitation: Firebase Auth state is using the public `firebase/auth` entrypoint that compiles with Firebase 12 in Expo. The RN AsyncStorage persistence helper is present inside Firebase internals but is not exposed by the package export map used by TypeScript here, so persistent login across app restarts should be solved as a focused follow-up.

## Commands

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform ios --output-dir /tmp/coinquest-mobile-export
npm run ios
```

## Notes

- Use Expo SDK 56 docs for this project.
- `expo-linear-gradient`, `expo-crypto`, Firebase JS SDK, and AsyncStorage are installed.
- The first simulator attempt reached Metro/Expo Go install, but the iPhone 17 Pro simulator stayed on the Apple boot screen. The iOS bundle export succeeds.
