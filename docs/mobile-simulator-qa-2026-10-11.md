# Native setup verification — 2026-10-11

Started 2026-10-11; interaction verification completed 2026-10-12, Asia/Bangkok.
**Result: setup gate passed. Product features remain pending.**

## Scope

Verify the new Coin Quest Ledger development binary on an actual iOS Simulator
before restoring product features. The two current screens are a setup harness;
they do not represent completed authentication, ledger, or character features.
No account, board, financial record, or other Firebase data is written.

## Environment

- Apple Silicon Mac, 8 GB RAM; one native build with two workers.
- Node 24.21.0, npm 11.19.0, Expo SDK 57, React Native 0.86.3.
- Xcode 27.0 (27A266a), iOS SDK 27.0, Debug arm64 Simulator build.
- Selected device: iPhone 17 Pro, iOS 26.5, displayed in Xcode Device Hub.
- App identifier: `com.purichwc.coinquestledger`.
- Metro destination: local machine, port 8093.
- Data state: signed out, setup harness only; disposable text input.

## Evidence

| Check | Observed result |
| --- | --- |
| TypeScript | Passed `npm run typecheck` |
| ESLint | Passed `npm run lint` |
| Expo dependency compatibility | Passed `npm run check:dependencies` |
| Native generation | Passed Expo prebuild without cleaning |
| CocoaPods | Installed 105 Pods successfully |
| Simulator boot | Live iOS 26.5 Home screen personally inspected |
| Own native binary | `BUILD SUCCEEDED`, exit 0, 2,877 seconds; built bundle identifier verified |
| Installation and launch | `simctl install` and `launch` succeeded; own development client opened the live app |
| Forward/back navigation | Welcome → check → native back; also returned safely with keyboard open |
| Software keyboard and input | Visible software keyboard; typed via on-screen key, field showed `Simulator`; Done dismissed keyboard |
| Native alert and local state update | Alert showed `สวัสดี Simulator`; dismiss returned to form with count 1; second press advanced count to 2 |
| Reload | Metro reload completed; welcome and a fresh check form remained usable; keyboard fix retested |
| Current app screenshots | Captured directly from Simulator at 1206 × 2622 pixels; listed below |

The initial keyboard check revealed a hidden field with the outer
KeyboardAvoidingView. The fix uses native `automaticallyAdjustKeyboardInsets`
on ScrollView instead. Fast Refresh applied it to the installed development
binary, and a full Metro reload verified the corrected initial-focus behavior.
TypeScript and lint passed again after this source change. The first Metro
bundle took 38.289 seconds; the observed reload bundle took 91 ms.

The first native build includes dependency warnings; no build error or native
runtime error was observed in these exercised setup flows. This is not a claim
about unimplemented product flows or all possible native behavior.

## Screenshots

All images are raw Simulator captures, inspected after capture. The blue/gray
gear is the development-client tools control, not a player feature. The fixture
is a disposable local text field with no account or financial data.

- [Welcome screen](mobile-qa-2026-10-12/welcome.png): live initial route.
- [Keyboard](mobile-qa-2026-10-12/keyboard.png): field and action visible after text input with software keyboard open.
- [State update](mobile-qa-2026-10-12/check-passed.png): keyboard dismissed, count 1, entered text preserved.
- [Native alert](mobile-qa-2026-10-12/native-alert.png): real iOS alert echoed the field value; count advanced to 2.

Full native build and Pods logs remain in ignored `mobile/.artifacts/`.
The first iOS 27 Simulator attempt stayed on the Apple logo despite a successful
boot-status response. It was shut down without erasing; it is not counted as a
successful native test. The iOS 26.5 Simulator reached a working Home screen.

## Not covered by this setup gate

Android, a physical iPhone, release signing/distribution, tablet layouts,
accessibility assistive technology, Firebase authentication/persistence, and all
player flows remain unverified. No web/Admin runtime source changed, so their
broad regression suites are outside this setup pass. Dependency audit advisories
reported during installation remain release follow-up; compatibility checks do
not establish security or production readiness.

For each restored player flow, update its parity status only after exercising
the native interaction and its relevant data contract on Simulator.
