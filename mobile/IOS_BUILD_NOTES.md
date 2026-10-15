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

## Standalone iPhone Release build — 2026-10-16

The user authorized the team of the existing development certificate for Coin
Quest. The signing team is read from that certificate's **OU**, not the ID at
the end of its display name (Apple Development's CN suffix can be a user ID).
Do not copy a team or device identifier from another project into this app.

The read-only doctor checks the authorized certificate team, current local
profile, bundle identifier, expiry, registered-device presence and matching
certificate/private-key identity. It does not enumerate or contact an iPhone:

```sh
python3 scripts/ios-device-readiness.py --certificate-team
```

For the user's authorized existing-certificate team, the repeatable device
build is:

```sh
sh scripts/build-device.sh --existing-certificate-team --automatic
```

This runs the source/dependency checks, incremental prebuild, Pods and a local
`Release` build for `generic/platform=iOS`, with two workers. Explicit
`--automatic` allows Xcode's existing account to resolve this app's development
profile. It does not register a connected device, install the app, select an
account from another project or alter system security. For an already installed
specific profile, use the manual alternative:

```sh
sh scripts/build-device.sh <authorized-team-id> <existing-profile-UUID>
```

Release embeds JavaScript and assets; it does not need Metro to run. The build
refuses `EXPO_PUBLIC_NATIVE_QA_EMULATORS=1` and pins it to `0` for its process, so
an emulator QA Metro session cannot be packaged into this Release app. Keep QA
environment flags scoped to the Metro process used for Simulator checks.
The build
wrapper validates the resulting bundle ID, `iPhoneOS` platform, nonempty
`main.jsbundle` with no emulator QA bootstrap markers, embedded current
provisioning profile and code signature.
Artifacts and logs remain ignored under `mobile/.artifacts/`:

- Device binary: `ios-device-build/Build/Products/Release-iphoneos/CoinQuestLedger.app`
- Build log: `ios-device-build.log`
- Install log: `ios-device-install.log`
- Launch log: `ios-device-launch.log`

Simulator builds and unsigned device builds are not installable iPhone
deliverables. Rebuild Release after final JS/assets change; a previously built
binary will not pick up a newer Metro bundle.

### When the user is ready to connect by USB-C

No physical iPhone connection or installation is part of the 2026-10-16 refresh.
Once authorized, connect and unlock the intended iPhone, handle its observed
Trust This Computer / Developer Mode prompts, then find its current identifier
locally with `xcrun devicectl list devices`. Do not commit the identifier.

```sh
sh scripts/install-device.sh <explicit-connected-iPhone-identifier>
```

The installer validates the signed device binary again, upgrades in place
without uninstalling or erasing data, and launches the actual bundle ID. It
never chooses a device implicitly. Installation still requires that the
intended iPhone is included in the profile, paired, unlocked, trusted and
compatible with the app's minimum iOS version. If a new phone is not registered,
resolve that specific Xcode provisioning requirement after connecting it; do
not report the existing profile as evidence for an unobserved device.

Inspect the real phone after launch, with Metro stopped: sign-in and keyboard,
bottom tabs, one create/edit/save/read flow, recovery-key access, receipt
picker/camera, sharing and persistence after relaunch. Check any developer-app
trust prompt shown by iOS. Release packaging does not establish those physical
behavior checks.

### Signing diagnosis and current evidence

On 2026-10-16 the machine initially had one valid development identity and no
local provisioning profiles. After the user selected its existing certificate
team, Xcode automatic signing successfully resolved a matching development
profile from the existing account without connecting an iPhone. The doctor now
finds one usable matching profile covering one registered device. This profile
expires **2026-10-23 at 01:06 Bangkok time**; rebuild with valid provisioning
before installing or continuing to use an expired development build. The
registered device has not been compared with a connected iPhone in this task.
No private key, profile, team identifier,
personal device identifier or account details are committed.

The local iPhoneOS Release build passed on 2026-10-16, followed by independent
artifact checks for embedded JavaScript, absence of emulator QA bootstrap
markers, correct platform/bundle, current provisioning and strict code-signature
verification. The minimum deployment target is iOS 16.4. The first cold device
Release build took roughly 25 minutes with two workers; it continued through
native compilation, linking, Metro/Hermes bundling and signing. A quiet log
during linking/bundling did not mean a stalled build: its child compiler/bundler
process remained active. Reuse its project-owned DerivedData for final source
updates. Physical installation and behavior remain unverified by request.

The SDK 57 patch Release rebuild completed at 03:23 Bangkok in 9 minutes
17 seconds (Expo 57.0.30; React Native unchanged at 0.86.3). All native source
gates passed on that dependency set: typecheck, lint, 81 contract tests, five
QA-isolation tests, seven device tests, dependency/shell/diff checks. A generated
Podfile.lock mismatch was resolved with a targeted update of changed local Expo
Pods, without upgrading the SDK or changing global signing settings.

The final source-frozen Release rebuild completed **2026-10-16 at 04:41 Bangkok**
in 7 minutes 16 seconds, after assigning Thai default titles to the four player
tab stacks so a loading header does not display `index`. Only those four runtime
files changed; no native dependency changed. The normal cached build wrapper
again passed typecheck, lint and the dependency check. The final 6,153,292-byte
embedded bundle was generated at 04:40:55 Bangkok; its SHA-256 is
`306c12dc7fd53980a56298b6d672e10424a85b398f6adad54479c62113ce50fb`.
Independent checks confirmed strict signature validation, the authorized
certificate/profile team match, production project/domain markers and absence
of emulator QA bootstrap markers. The 258-file frozen runtime source manifest,
`c117b66f44c33509fd04b0ea6a10d4dc8f5a425d20d167f6f27959c63d16681e`,
was unchanged after building. Exact hashes and sanitized provenance are local
in `.artifacts/final-device-provenance.json`; see the
[refresh report](docs/native-refresh-2026-10-16/README.md) for acceptance boundaries.
The same patched dependency set built successfully for Simulator Debug at 03:33
Bangkok in 9 minutes 23 seconds, with the existing `.artifacts/ios-build` cache.
That development client still uses Metro. Its later isolated-emulator UI smoke
does not substitute for the standalone Release artifact checks or a future
physical-iPhone test.

If Xcode reports `No Account for Team`, verify the certificate OU team and the
existing account's credentials in **Xcode Settings → Accounts** before retrying.
If it reports `No profiles`, inspect the exact bundle/team/profile/device cause.
Do not repeat unchanged builds, create another certificate, change capabilities
or bypass signing to turn a failed device build into a claimed ready artifact.

References checked for this workflow: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/),
[Expo local Release builds](https://docs.expo.dev/guides/local-app-production/),
[Apple development profiles](https://developer.apple.com/help/account/provisioning-profiles/create-a-development-provisioning-profile/),
and [Apple Developer Mode](https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device).
