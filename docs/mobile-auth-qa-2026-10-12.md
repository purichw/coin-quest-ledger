# Native account flow — 2026-10-12

## Scope and gate

User-requested scope: login, signup and persistent login with the existing
Firebase project, verified on a real iOS Simulator before any subsequent flow.
**The requested account Simulator gate passed on 2026-10-12.** Signup, fresh
password login after sign-out, persistent login and sign-out persistence were
observed on the app's own native binary. This gate covers this account flow;
other player features and release verification remain outside its scope.

## Runtime provenance

- Working tree based on `b726368f50eb9bd251e7882f13388551e23e0c8a`; no commit,
  push, rules deploy or production web deploy in this work.
- Own Debug binary: `com.purichwc.coinquestledger`.
- Xcode 27, iPhone 17 Pro / iOS 26.5 in Device Hub.
- Simulator UUID: `7FEE6572-2952-4E46-9649-532C62A2CA42`.
- Node 24.21.0, Expo 57.0.27, React Native 0.86.3, Firebase JS 13.0.0.
- New native modules: AsyncStorage 2.2.0, Expo Crypto 57.0.3, SecureStore 57.0.4.
- Native build succeeded, binary installed and launched. Logs:
  `mobile/.artifacts/auth-native-build.log` and `mobile/.artifacts/ios-build.log`.
- Metro localhost:8093; direct Device Hub interactions, no Expo Go or browser
  phone viewport used as acceptance evidence.

## Implementation boundary

`mobile/src/auth/` owns Firebase initialization, auth/session state, account
provisioning and reusable auth fields. Expo Router `/` and `/signup` own entry.
The earlier `/check` setup screen has no entry in normal player navigation.

- Existing project `pointy-personal-toolkit`; public config matches
  `shared/firebase-client.js`. No service account or Admin SDK in the app.
- Username login resolves `usernames/{username}.authEmail`, including recovered
  credentials; normal signup maps to `username@coinquest.local`.
- Firebase manages persistent credentials through its React Native AsyncStorage
  adapter. The app never writes the user's password to disk.
- Startup and foreground validate the Firebase token and fetch the current
  owner profile from the server. Network/profile failures show retry/sign-out;
  a cached account is not presented as verified access.
- Signup provisions `users/{uid}`, `usernames/{username}` and `userIds/{id}` in
  one Firestore transaction. ID/character collisions fail closed, with bounded
  retry; existing identities are not replaced with invented fallback IDs.
- A partial Auth signup resumes profile provisioning on next startup/login.
- Recovery hashes use the existing SHA-256 username/code contract. Raw recovery
  keys are held in device-only SecureStore until the user confirms saving them;
  no raw key is written to Firestore or public username records.
- Draft signup fields survive native Back in memory, and are cleared on account
  resolution. Nothing in this flow creates characters, boards or finance data.

## Observed checks

| Check | Result / evidence |
| --- | --- |
| Own native build, install, launch | PASS |
| Signed-out login screen | PASS, inspected native rendering |
| Empty login validation | PASS, Thai error appears |
| Invalid Firebase login | PASS, loading/disabled controls then generic credential error; typed values retained |
| Empty signup validation | PASS, missing display name message |
| Native keyboard | PASS on login: visible software keyboard, actual `a` key input, Next focuses password, Go dismisses keyboard and validates |
| Signup Back with keyboard | PASS; reopen retains display name and username |
| TypeScript | PASS |
| Contract tests | 8 PASS: web identity/hash compatibility, validation, lifecycle blocking, tombstones, profile identity, generic errors |
| Lint | PASS; form-secret cleanup moved into account resolution, avoiding state-setting effects |
| Signed-out process terminate/relaunch | PASS; new PID 77691 returns to login, fresh Metro bundle without runtime errors |
| Signup + recovery reveal | PASS; user entered credentials, reported saving Recovery ID; native account screen verified `cqsim-20261012`, User ID `2150` |
| Successful login | PASS; user supplied the existing test credential, entered only into the app's secure field; loading/disabled state then `cqsim-20261012`, User ID `2150` |
| Signed-in terminate/relaunch | PASS; PID 80659 restored signup session; after fresh password login and font integration, PID 90180 again restored the same account and User ID without entering credentials |
| Sign-out cancellation | PASS; native confirmation cancelled, account retained |
| Sign-out | PASS; confirmed native alert, login form returned without account data |
| Sign-out + terminate/relaunch | PASS; new PID 81473 remains signed out; repeated after font integration with PID 86243 |
| Live username/User ID contract | PASS; both exact test documents return 200, matching UID and ID `2150`; no raw recovery key or recovery hash in public records |
| Private owner profile, unauthenticated read | PASS; exact test account profile returns 403 without authentication |
| Website typography | PASS for login/signup/account, including native header, typed Thai accents and User ID `2150`; Mitr + IBM Plex Sans Thai + Chakra Petch loaded from local assets |

The computer-use tool requires the user to enter, confirm and submit new
credentials. The user completed signup for `cqsim-20261012` and confirmed saving
the Recovery ID. The resulting native account screen and public reservation
records were then verified. For the final fresh-login check, the user supplied
the existing test password for entry into the app. No password or raw recovery
key is included in repository files or screenshot evidence. No other account,
character, board or finance records were changed.

## Screenshots

Captured with `simctl io screenshot`; inspected against the current native UI.

- [Login error](mobile-auth-qa-2026-10-12/login-error.png)
- [Signup after Back/reopen](mobile-auth-qa-2026-10-12/signup.png)
- [Signed-out cold start](mobile-auth-qa-2026-10-12/login-cold-start.png)
- [Signup success](mobile-auth-qa-2026-10-12/signup-success.png)
- [Persisted account after process restart](mobile-auth-qa-2026-10-12/session-restored.png)
- [Signed out after process restart](mobile-auth-qa-2026-10-12/signout-restarted.png)
- [Login with website fonts](mobile-auth-qa-2026-10-12/login-web-fonts.png)
- [Signup with website fonts and typed Thai accents](mobile-auth-qa-2026-10-12/signup-web-fonts.png)
- [Fresh login success with website fonts](mobile-auth-qa-2026-10-12/login-success-web-fonts.png)
- [Session restored after fresh login, with website fonts](mobile-auth-qa-2026-10-12/session-restored-web-fonts.png)

Never save a raw recovery-key reveal or unmasked real password as a QA artifact.

## Typography follow-up

The user requested website fonts on 2026-10-12. The account flow now uses Mitr
for display/actions, IBM Plex Sans Thai for body/fields, and Chakra Petch for
IDs/codes, matching the roles in `index.html`. Six unmodified local TTF assets
include each family's OFL license. See `mobile/assets/fonts/README.md` for sources.

Expo Font 57.0.4 was already included in the verified native binary and is now a
direct dependency. `useFonts` loads local assets before account screens mount;
development assets come from Metro. This font-only follow-up did not require a
new native-module build. Login and signup were personally inspected in Device
Hub, including cold-start font loading and Thai upper/lower marks in a text field.
The reveal button now occupies a separate field column, preventing the wider
Thai placeholder from touching it. TypeScript and lint passed again after the
field-layout follow-up; Expo dependency compatibility also passed.

## Known limits and intentionally skipped checks

No Android, physical-device, release signing, password reset, character, ledger,
web/Admin regression suite, rules deployment or broad security audit this pass.
Rules were inspected only for the account paths used here. Existing broad trip
rules and legacy public hashes are outside this change. Live signup/profile
permissions, fresh login and restored auth were verified only for the scoped
test account.
Partial-provisioning interruption and blocked-account behavior have contract/code
coverage only; neither was simulated against a real production account.

The dependency install reports 32 audit advisories (10 moderate, 22 high).
No force upgrade was applied; this is not a release-readiness claim.

## Primary API references consulted

- [Firebase native persistence source](https://github.com/firebase/firebase-js-sdk/blob/main/packages/auth/src/platform_react_native/persistence/react_native.ts)
- [Expo 57 AsyncStorage](https://docs.expo.dev/versions/v57.0.0/sdk/async-storage/)
- [Expo 57 Crypto](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/)
- [Expo 57 SecureStore](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/)
- [Expo 57 Font](https://docs.expo.dev/versions/v57.0.0/sdk/font/)

Firebase 13's React Native runtime exports `getReactNativePersistence`, but its
shared `firebase/auth` type entry omits it. The local declaration augmentation
matches the upstream storage/Persistence signature; there is no runtime shim.
