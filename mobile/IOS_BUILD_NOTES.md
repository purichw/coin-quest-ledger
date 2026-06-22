# Coin Quest Ledger iOS Build Notes

Last updated: 2026-06-22

This is the repeatable native iOS runbook. It exists because the first real-device pass proved that "it builds" is not enough: the app must look like Claude Design and use real backend data before a physical install is worth doing.

## Non-Negotiable Gates

Before `xcodebuild` or installing on a real iPhone:

1. Design parity pass.
   - Compare the touched screens against the latest Claude iOS/Android exports in `/Users/point/Downloads/Coin iOS Android/`.
   - Check platform chrome, large-title spacing, cards, bottom tabs, raised `+` / FAB behavior, sheets, typography scale, avatar/dragon art, empty/loading/error states, and no overlap.
   - Product requirements beat Claude sample data, but the interaction quality and visual hierarchy should still match closely.

2. Backend parity pass.
   - Use real Firebase Auth/Firestore, not static local seed data.
   - Current contracts: `users/{uid}`, `usernames/{username}`, `characters/{id}`, `trips/{id}`, and `playerModules/{uid}`.
   - Debt Dragon, Treasury, and Compare must read/write `playerModules/{uid}` or show real empty states.

3. Source verification.
   - `npm run typecheck`
   - `npx expo export --platform ios --output-dir /tmp/coinquest-mobile-export`
   - Run root `npm test` before commit/push/deploy or when Firestore/backend contracts changed.

## Project Shape

- Source lives in `mobile/`.
- `ios/`, `android/`, `.expo/`, and `node_modules/` are local/generated and ignored.
- Commit source, package files, scripts, and assets only.
- Keep the app modular:
  - `App.tsx`: orchestration/state wiring.
  - `src/data.ts`: Firebase/Auth/Firestore data boundary.
  - `src/gameLogic.ts`: native module math/normalization.
  - `src/ui.tsx`, `src/theme.ts`, `src/copy.ts`: shared presentation.
  - `src/screens/*.tsx`: screen slices.
  - `src/sheets.tsx`: modal/sheet flows.

## Known Toolchain

- Expo SDK: 56.
- React Native: 0.85.3.
- Firebase JS SDK: 12.15.0.
- Bundle ID: `com.purichwc.coinquestledger`.
- Apple Development team used in the first successful physical build: `365NSPNKXD`.
- First installed physical device:
  - Name: `Pointy`
  - CoreDevice id: `360D4601-FBE4-54C7-BF87-C7A1813EDA66`
  - Physical UDID from `xctrace`: `00008110-000A24C40AD3A01E`

## Commands

From repo root:

```bash
cd "/Users/point/Library/Mobile Documents/com~apple~CloudDocs/Website Projects/toolbox/mobile"
npm install
npm run typecheck
npx expo export --platform ios --output-dir /tmp/coinquest-mobile-export
```

Generate native iOS project only when needed:

```bash
npx expo prebuild --platform ios
```

Build Release for the connected iPhone:

```bash
xcodebuild \
  -workspace ios/CoinQuestLedger.xcworkspace \
  -scheme CoinQuestLedger \
  -configuration Release \
  -destination 'id=00008110-000A24C40AD3A01E' \
  -derivedDataPath /tmp/coinquest-ios-device-build \
  -allowProvisioningUpdates \
  build
```

Install on the USB-connected iPhone:

```bash
xcrun devicectl device install app \
  --device 360D4601-FBE4-54C7-BF87-C7A1813EDA66 \
  /tmp/coinquest-ios-device-build/Build/Products/Release-iphoneos/CoinQuestLedger.app
```

Launch from Mac while the iPhone is unlocked:

```bash
xcrun devicectl device process launch \
  --device 360D4601-FBE4-54C7-BF87-C7A1813EDA66 \
  com.purichwc.coinquestledger
```

Confirm installed app:

```bash
xcrun devicectl device info apps \
  --device 360D4601-FBE4-54C7-BF87-C7A1813EDA66 | rg 'Coin Quest Ledger|com\.purichwc\.coinquestledger'
```

## Lessons Learned

- Expo and Xcode are not either/or here. Expo owns the React Native app/runtime and can generate the iOS project; Xcode/xcodebuild signs and builds the native app for a real iPhone.
- A Release device build bundles JS, so Metro is not required to launch the installed app.
- `devicectl` install can succeed while launch fails if the iPhone is locked. Unlock the phone and keep it on the Home Screen before launch.
- If iOS blocks the app, check Developer Mode and trust settings on the phone:
  - Settings > Privacy & Security > Developer Mode.
  - Settings > General > VPN & Device Management > Apple Development: purich.wc@icloud.com > Trust.
- The first simulator path was unreliable: Expo reached Metro/Expo Go, but the iPhone 17 Pro simulator stayed on the Apple boot screen. Do not make the simulator the only verification gate until it is healthy.
- `expo-modules-jsi` local Xcode builds needed a reproducible patch. `package.json` runs `scripts/patch-expo-modules-jsi.mjs` on postinstall to add `COPYFILE_DISABLE=1` and disable nested code signing for that xcframework build script.
- Firebase Auth persistence is not fully solved. The app currently uses `getAuth(app)` because Firebase 12's React Native AsyncStorage persistence helper is not exposed through the package export map used by TypeScript here. Login works, but persistent sessions across restarts need a focused follow-up.
- Firestore rejects nested `undefined`; normalization should omit optional fields or use `null` intentionally.

## First Successful Physical Install

- Build command: Release `xcodebuild` with `-allowProvisioningUpdates`.
- Signing identity: `Apple Development: purich.wc@icloud.com (NX2QR9D7QS)`.
- Provisioning profile: `iOS Team Provisioning Profile: com.purichwc.coinquestledger`.
- Built app path: `/tmp/coinquest-ios-device-build/Build/Products/Release-iphoneos/CoinQuestLedger.app`.
- Install result: `Coin Quest Ledger`, bundle `com.purichwc.coinquestledger`, version `1.0.0`.

## What To Improve Next

- Add a repeatable screenshot verification path once simulator boot is reliable.
- Add or document a physical-device screenshot capture path for design review.
- Solve Firebase Auth persistence cleanly for React Native/Expo.
- Continue moving native screens toward Claude Design fidelity before further device builds.
