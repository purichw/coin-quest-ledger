# iOS player refresh — 2026-10-16

**Local acceptance evidence, 2026-10-16:** native source checks, scoped Simulator
flows, shared-data checks and required web/backend suites passed as recorded
below. Signed-build provenance is tracked separately from later source changes.
No physical iPhone has been connected or tested. The intended commit's
[CI/CD workflow run](https://github.com/purichw/coin-quest-ledger/actions/workflows/test.yml)
is the authority for push, CI and web promotion; local acceptance does not claim
a future remote result.

## Scope and native direction

The app follows the current `coinquestledger.vercel.app` player experience while
using native tabs, stack navigation, safe areas, keyboard insets, numeric Done
controls and a native Welcome Tour modal. Login is designed to fit a normal
viewport; larger text and errors can scroll. Existing Coin Quest artwork,
category colors, Thai fonts, character portraits and restrained motion preserve
its illustrated identity. No new assets were generated.

All player areas are in scope. Admin and Excel Upload are excluded by the user's
request. JSON import/backup and useful Excel report exports through Share remain.
See [player capability inventory](player-parity.md) for routes and differences,
[design direction](../../DESIGN_DIRECTION.md) for implementation intent, and the
[QA matrix](qa-matrix.md) for observed behavior versus remaining checks.

Research informing the adaptation includes Apple's
[layout](https://developer.apple.com/design/human-interface-guidelines/layout),
[tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
and [text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields),
[Expo 57 native tabs](https://docs.expo.dev/versions/v57.0.0/sdk/router/native-tabs/),
and React Native's [Animated](https://reactnative.dev/docs/0.86/animated) and
[AccessibilityInfo](https://reactnative.dev/docs/0.86/accessibilityinfo).
These references guide the composition and controls; acceptance comes from the
actual app's rendered screens and interactions.

## Actual UI and shared-data evidence

The app's own iOS Simulator development binary used the current Metro bundle.
The main native viewport is 402 × 874 points; clean captures are 1206 × 2622 pixels.
Final auth checks also used an iPhone SE at 375 × 667 points.
The local web viewport is 402 × 874 pixels. Both clients used isolated Firebase
Auth/Firestore emulators (`demo-coin-quest`), the normal product service paths
and repository Rules. No production data was changed. Reproduction and isolation
details are in [native QA notes](native-qa.md).
The feature-flow captures below used the preceding native SDK binary with the
final feature source. A bounded smoke on the rebuilt SDK 57 binary then passed
against a freshly seeded local emulator, as recorded separately below.

| Observed action | Actual result |
| --- | --- |
| Initial two-person board fixture | ฿680 total; 17 party XP. |
| Save another ฿680 expense in native, then reload web | Web showed ฿1,360 and 34 XP. |
| Add `ข้ามแพลตฟอร์ม · Web QA` for ฿200 through the real web form, then refresh native | Native showed three records, ฿1,560 total, 39 XP and ฿780 settlement. |
| Edit native Treasury expense from ฿180 to ฿200, then read web Treasury | Actual web DOM showed ฿28,000 income, ฿200 used and ฿27,800 remaining. |
| Open public character `8602` while using account `8601` | Read-only public profile showed 420 saved XP, without owner edit/archive controls. |
| Open owner profile and toggle financial privacy | Compact profile showed 39 XP; the native accessibility tree confirmed financial amounts were hidden after toggling privacy. |

Current [Home](qa/native-home-art-402.png),
[native board](qa/native-sync-board-402.png),
[web board](qa/web-sync-board-402.png),
[public profile](qa/native-public-profile-402.png),
[Welcome Tour](qa/native-tour-402.png) and
[numeric keyboard](qa/native-keyboard-done-402.png) captures were inspected.
The [mobile web Home reference](qa/web-home-current-402.jpg) records the source
visual family used for comparison.
Home's illustrated doorway/camp composition, four category cards and native tab
bar fit together without obscuring their actions. The board keeps money and
settlements readable against its scene; the tour retains a reachable fixed
footer; the numeric keyboard has an explicit Done control.
Numeric Done also appeared and dismissed the keyboard in the inline Treasury
tab form. Debt's closed filter and Price's archived filter each reached an empty
state, then Reset restored one item; Treasury's over-budget filter reached its
empty state with a working reset path. The
[current owner profile](qa/native-profile-art-402.png) and
[web Treasury capture](qa/web-treasury-402.png) record the additional checks and
were inspected. Current [native Treasury](qa/native-treasury-art-402.png),
[Prices](qa/native-prices-art-402.png) and
[Dragon detail](qa/native-dragon-detail-402.png) artwork/layouts were also inspected.

Both the [375 × 667 login](qa/native-login-se.png) and
[402 × 874 login](qa/native-login-large.png) were inspected with all normal
actions visible in one viewport. On SE, the software keyboard kept username
visible, Next moved focus to the [visible password field](qa/native-password-keyboard-se.png)
with automatic scrolling, and blank Go dismissed the keyboard and showed inline
validation. [Signup](qa/native-signup-se.png) and
[recovery](qa/native-recovery-se.png) opened and returned with native Back;
the [signup bottom action](qa/native-signup-bottom-se.png) remained reachable by
scrolling. Regular auth parchment padding was increased to clear its decorative
border; compact login padding was unchanged.

All four tour pages, Back and Close passed native interaction checks. Account's
missing-key state explains that a new Recovery ID can be generated instead of
inventing a code from its hash. Home pause/resume passed the accessibility-label
interaction check. Static captures alone do not establish Reduce Motion or
background lifecycle behavior; those remaining checks are listed in the matrix.
Account About opened in the system browser and returned to the app; all three
About/Privacy/Terms endpoints returned HTTP 200. Only About's native return path
was exercised.

The final native source gate passed on Node 24.21.0 / npm 11.19.0: TypeScript,
full ESLint, all 81 native contract tests, five QA-isolation tests, seven
device-tooling tests, shell syntax, diff check and a clean Expo dependency check.
The contract suite includes 38 ledger/module and 13 auth/recovery tests.
Recovery regression coverage includes a successful reset whose temporary
Keychain write fails: the displayed code is validated against the fresh owner
hash, local persistence is best effort and failure is explicitly reported.
Required web/backend release suites passed separately as recorded below.

The dependency check required routine same-SDK patches: Expo **57.0.30**,
Constants **57.0.22**, Crypto **57.0.4**, Dev Client **57.0.20**, Linking
**57.0.13**, Router **57.0.28** and Sharing **57.0.23**. React Native remains
**0.86.3**. The npm lockfile captures the corresponding Expo transitive updates;
no SDK 58 migration was made. A targeted update of changed local Expo Pods
resolved the generated Podfile.lock mismatch before rebuilding.
The patched Simulator Debug build then completed at **03:33 Bangkok** in
9 minutes 23 seconds, using the existing Simulator DerivedData. Its signature
and bundle/platform checks passed, and the same frozen runtime source manifest
was unchanged. Local provenance is in
`mobile/.artifacts/final-simulator-provenance.json`. This development-client
binary uses Metro; its isolated-emulator smoke is distinct from the
standalone signed iPhone Release artifact checks below.
Three optional-date source/unit regressions also passed: saving an undated web
expense keeps its date absent, an existing timestamp stays intact until changed,
and a new expense defaults to today. The final optional-date UI was not re-exercised.

The rebuilt binary's [login](qa/native-login-final-sdk57.png) fit the viewport;
keyboard Next/Go signed in, and termination/relaunch restored the remembered
session. Its [Home](qa/native-home-final-sdk57.png) correctly showed 17 XP from
the fresh emulator seed. Home's Debt card selected the actual native Debt tab,
where the ฿12,000 fixture and artwork were
inspected. One temporary emulator-unavailable warning recovered after relaunch;
Debt data then loaded normally.

The [native JSON Share sheet](qa/native-share-final-sdk57.png) opened and its
native Cancel action cleared busy state and restored the controls. The real iOS
Files picker also opened to Recents with Search and tabs; no file was selected.
Picker cancellation/return was not verified because its controls were not
exposed through the available accessibility interface; the app was relaunched.
Active portrait frames differed by 31,197 pixels in the measured portrait area.
After Pause changed to Play, two portrait frames 39.8016 seconds apart had
exactly zero changed pixels. This verifies active/paused motion; system Reduce
Motion and app-background lifecycle remain untested runtime boundaries.

## Full local web and backend gates

The required root sequence finished successfully at **04:32 Bangkok on
2026-10-16**: syntax checked 51 browser scripts and 53 module files; assets checked
116 local files and 40 optional CDN manifest entries; all 67 unit tests passed.
Playwright completed **760 passed / 11 predefined skips / zero failures** across
desktop, tablet and mobile in **30.1 minutes**, using one worker. The separate
Auth/Firestore emulator backend suite then passed **21/21** tests and shut down
cleanly. No assertions, projects or timeouts were weakened.

This ran in `mobile/.artifacts/web-release-check`, based on `44ad28e` with the
current native/docs snapshot, shared installed dependencies and unchanged
web/backend source. The exact command sequence was `test:syntax`, `test:assets`,
`test:unit`, `test:e2e -- --workers=1`, then `test:backend`. Local log:
`mobile/.artifacts/root-release-tests-final-20261016.log`; tested snapshot:
`mobile/.artifacts/web-release-check-final-manifest-20261015T210217Z.json`.
The four subsequent native loading-title changes do not change these web/backend
inputs; their targeted native checks and artifact provenance are tracked below.
All 132 unrelated pre-existing QA PNGs retained their original hashes.

## iPhone packaging and release status

The final standalone iPhoneOS Release build succeeded on **2026-10-16 at
04:41:06 Bangkok time**, including the four native loading-title fixes after
the SDK 57 patch update. Embedded
JavaScript/assets, strict signature validation and the user-authorized existing
certificate team were verified. Automatic signing resolved one matching
development profile covering one registered device. It expires **2026-10-23 at
01:06:31 Bangkok time**. Minimum iOS is 16.4. The final incremental build took
7 minutes 16 seconds, starting at 04:33:50; the earlier cold signing proof took
roughly 25 minutes.

The app is local at
`mobile/.artifacts/ios-device-build/Build/Products/Release-iphoneos/CoinQuestLedger.app`.
Its embedded bundle was generated at 04:40:55 Bangkok, is 6,153,292 bytes and has
SHA-256 `306c12dc7fd53980a56298b6d672e10424a85b398f6adad54479c62113ce50fb`.
The frozen 258-file runtime source manifest remained unchanged after building:
`c117b66f44c33509fd04b0ea6a10d4dc8f5a425d20d167f6f27959c63d16681e`.
This describes the refresh tree based on `44ad28e`; it does not claim
that the older base commit contains the refresh. Sanitized local provenance,
including the executable and app-tree hashes, is saved in
`mobile/.artifacts/final-device-provenance.json`.

The four native tab-stack layouts supply Thai default titles during initial
loading. TypeScript, lint and the dependency check passed for this final build;
strict signature, team/profile, production markers and absence of emulator QA
bootstrap markers were verified. This artifact supersedes the earlier 03:23
bundle. The completed web/backend suites have unchanged inputs.

The bounded title check passed at **04:51 Bangkok**, using the patched Debug
binary with the latest Metro source. A cold emulator login initially timed out;
diagnostics confirmed a healthy hub (HTTP 200 in 0.21 seconds) and Firestore
fixture (HTTP 200 in 0.95 seconds), then one retry signed in successfully.
Termination/relaunch retained the session without saving an OS password, and
Home showed the fresh-seed 17 XP. Home → Debt exposed the Thai heading
`มังกรหนี้` while its progress indicator was still active, with no `index` title;
the [loaded ฿12,000 fixture](qa/native-debt-final-title.png) was then visually
inspected. The other three tab defaults share the same source change but were
not newly traversed. This was a targeted title check, not another full UI suite.

The build wrapper rejects emulator QA mode, checks the embedded bundle and
profile, and produces an app that runs without Metro. The explicit-device USB-C
installer is prepared; it has not been run. The intended phone still needs to
be paired, trusted, unlocked, Developer Mode enabled and covered by provisioning
when the user connects it. See [iOS build notes](../../IOS_BUILD_NOTES.md).

| Gate | Current status |
| --- | --- |
| Current native UI and local cross-platform board flow | Passed for the concrete checks above; see remaining matrix rows. |
| Final native source checks | Passed on the patched SDK set: 81 + 5 + 7 tests and clean dependency check. |
| Rebuilt native smoke | Passed isolated-emulator login/session, native Debt tab, JSON Share cancel and active/paused portrait checks; Files picker launch only. |
| Final loading-title runtime | Passed Home → Debt loading title and loaded fixture at 04:51 Bangkok; other three defaults covered by the same source change, without a new traversal claim. |
| Required web and backend suites | Passed: syntax/assets, 67 unit, 760 E2E with 11 predefined skips, 21 backend. |
| Final signed standalone iPhone Release | Passed 04:41:06 Bangkok with all four loading-title fixes; embedded bundle, source manifest, signature/team/profile and QA-off production configuration verified. |
| Commit, push, CI and web promotion | Check the intended commit in the linked CI/CD workflow; these remote outcomes are separate from this dated local evidence and native packaging. |
| Physical USB-C install and device behavior | Not performed, as requested. |

Older `before`, intermediate module and date-sheet captures remain supporting
history. They must not be used to accept source changes made after capture.
