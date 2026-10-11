# Simulator-first development

This runbook belongs to the new app started 2026-10-11. The retired app's
device IDs, signing workarounds, and build claims do not establish readiness.

## Required evidence, in order

1. Compatible SDK dependencies, TypeScript, and lint.
2. Generated iOS project and a successful native Simulator build.
3. Installation and launch of `com.purichwc.coinquestledger`.
4. Personally inspect the live Simulator screen.
5. Exercise forward/back navigation, text input with the software keyboard,
   native alert confirm/dismiss, and reload.
6. Save current screenshots, logs, and the observed device/runtime/build state.

Do not start product feature development until this setup gate passes. Once it
does, repeat native interaction checks for each new flow before expanding.

## Local tools observed

- Apple Silicon Mac, 8 GB RAM.
- Node 24.21.0 installed through nvm; use `.nvmrc`.
- Xcode 27.0 (27A266a), iOS SDK 27.0.
- Installed Simulator runtimes: iOS 26.5 and 27.0.
- Xcode 27 uses **Device Hub**, bundle ID `com.apple.dt.Devices`.
  The application lives under Xcode's `Contents/Applications/DeviceHub.app`.
  The outer launcher is a trampoline; connect UI automation using the running
  bundle ID after launch, not the removed `Simulator.app` path.

Use only one Simulator and one native build at a time. Limit Xcode build and
Metro to two workers. Do not erase simulators, delete caches, close unrelated
apps, or change global Xcode selection as routine troubleshooting.

## Build path

Activate the pinned Node version in the current shell. From `mobile/`:

```sh
npm ci
npm run typecheck
npm run lint
npx expo install --check
npx expo prebuild --platform ios --no-clean --no-install
```

The installed SDK 57 CLI supports `--no-clean`; this preserves generated native
folders during incremental sync. If native directories are hand-maintained in
the future, review ownership before using prebuild.

Install Pods in `ios/`, then inspect the actual workspace and scheme. Discover
the chosen available simulator with `xcrun simctl list devices available`.
Build with the observed workspace, scheme, and destination:

```sh
xcodebuild -workspace ios/CoinQuestLedger.xcworkspace \
  -scheme CoinQuestLedger -configuration Debug \
  -destination 'platform=iOS Simulator,id=<current-simulator-id>' \
  -derivedDataPath .artifacts/ios-build -jobs 2 build
```

Generated native folders, binaries, and logs stay local/ignored. Never commit
personal device identifiers, signing identities, or user account data.

The repeatable wrapper runs the checks, prebuild, Pods, and Xcode build above:

```sh
npm run build:simulator -- <current-simulator-id>
```

## Install, launch, and inspect

Choose an available Simulator from `simctl list`. Boot it only if it is shut
down, wait for `xcrun simctl bootstatus <current-simulator-id> -b`, and inspect
the live Home screen in Device Hub. A boot-status result alone is insufficient.

Start Metro in one terminal with the pinned Node version:

```sh
npm run start:simulator
```

In a second terminal, from `mobile/`, install the successful build and open the
development-client URL printed by that Metro process. The verified commands are:

```sh
xcrun simctl install <current-simulator-id> \
  .artifacts/ios-build/Build/Products/Debug-iphonesimulator/CoinQuestLedger.app
xcrun simctl launch <current-simulator-id> com.purichwc.coinquestledger
xcrun simctl openurl <current-simulator-id> \
  'exp+coin-quest-ledger-mobile://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8093'
```

Accept the app-opening prompt and dismiss the development-menu introduction
when shown on first launch. Then exercise the current screen in Device Hub.
For a software keyboard check, use **Device → Keyboard → Toggle Software
Keyboard** if a connected hardware keyboard hides it. Prefer on-screen keys
for the verification; host keyboard layout can affect synthetic typed text.
Do not change unrelated system keyboard settings.

Press `r` in the project's Metro terminal to reload, then inspect and interact
with the app again. A reload message alone is not proof of a working screen.

## Diagnostics from setup

The first iOS 27 boot completed its migration according to `simctl bootstatus`,
but Device Hub still displayed the Apple logo and Home did not respond. This is
**not** a passed launch test. That simulator was shut down without erasing it.
Package installation also ran slowly under memory pressure (the Mac was already
using roughly 10 GB of swap). Serial installation and the existing iOS 26.5
runtime completed. The first native build took 47 minutes 57 seconds with two
workers and exited successfully. Logs and active compiler processes confirmed
progress during that build; it was not restarted. This is an observed first
build duration on this machine, not an expected incremental-build duration.

The first live keyboard check exposed a covered text field. Replacing the
setup form's outer KeyboardAvoidingView with native ScrollView keyboard inset
adjustment resolved it. The field was checked again after reload, using the
software keyboard, and the button passed the entered value to a native alert.
Reference: [React Native 0.86 ScrollView](https://reactnative.dev/docs/0.86/scrollview#automaticallyadjustkeyboardinsets-ios).

Current status: **setup gate passed on 2026-10-12**, on iPhone 17 Pro / iOS 26.5.
See `../docs/mobile-simulator-qa-2026-10-11.md` for the test record and images.
The binary was rebuilt with the date, image picker, document picker, file and
sharing dependencies on 2026-10-12 (approximately 02:32 Bangkok). Subsequent
player-flow checks used that installed binary plus the current Metro bundle.
See `../docs/mobile-completion-worklist.md` for per-flow evidence and limits.
Android and physical-device distribution remain unverified.

After the web/API and Rules release, the user unlocked the Mac and the same
installed own app with the current Metro bundle passed scoped save/read/restore
flows in all four modules, the member reference guard, profile/reminders and two
process restarts. See `../docs/post-release-simulator-2026-10-12.md`. This was
native Simulator evidence; no new binary or OTA was distributed.
