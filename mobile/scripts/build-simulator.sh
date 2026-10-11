#!/bin/sh
set -eu

# Run from any directory; all outputs stay in this app.
coinquest_app_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$coinquest_app_root"

if [ "$(node -p 'process.versions.node.split(".")[0]')" != "24" ]; then
  printf '%s\n' 'Activate Node 24 from mobile/.nvmrc before building.' >&2
  exit 1
fi
if [ "$#" -ne 1 ]; then
  printf '%s\n' 'Usage: sh scripts/build-simulator.sh <available-simulator-UUID>' >&2
  printf '%s\n' 'Discover destinations with: xcrun simctl list devices available' >&2
  exit 1
fi

npm run typecheck
npm run lint
npm run check:dependencies
npx expo prebuild --platform ios --no-clean --no-install
(cd ios && pod install)
mkdir -p .artifacts

# No formatter pipeline: retain xcodebuild exit status and first causal errors.
xcodebuild -workspace ios/CoinQuestLedger.xcworkspace \
  -scheme CoinQuestLedger -configuration Debug \
  -destination "platform=iOS Simulator,id=$1" \
  -derivedDataPath .artifacts/ios-build -jobs 2 build \
  > .artifacts/ios-build.log 2>&1

printf '%s\n' 'Simulator binary built. Installation, launch, and UI verification are separate steps.'
printf '%s\n' "$coinquest_app_root/.artifacts/ios-build/Build/Products/Debug-iphonesimulator/CoinQuestLedger.app"
