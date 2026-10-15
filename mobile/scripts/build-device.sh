#!/bin/sh
set -eu

coinquest_app_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$coinquest_app_root"

# A QA Metro process is separate from this shell. Never package an emulator
# request into Release: firebase.ts intentionally rejects it at runtime.
if [ "${EXPO_PUBLIC_NATIVE_QA_EMULATORS:-}" = '1' ]; then
  printf '%s\n' 'Refusing Release build: unset EXPO_PUBLIC_NATIVE_QA_EMULATORS in this shell first.' >&2
  exit 1
fi
# An explicit production value also wins over a stale local Expo .env file.
export EXPO_PUBLIC_NATIVE_QA_EMULATORS=0

if [ "$#" -ne 2 ]; then
  printf '%s\n' 'Usage: sh scripts/build-device.sh <authorized-team-id|--existing-certificate-team> <existing-profile-UUID|--automatic>' >&2
  printf '%s\n' '--automatic requests provisioning for this app from the authorized team in the existing Xcode account.' >&2
  exit 1
fi
if [ "$(node -p 'process.versions.node.split(".")[0]')" != "24" ]; then
  printf '%s\n' 'Activate Node 24 from mobile/.nvmrc before building.' >&2
  exit 1
fi

if [ "$1" = '--existing-certificate-team' ]; then
  coinquest_team=$(python3 scripts/ios-device-readiness.py --certificate-team --print-team)
else
  coinquest_team=$(python3 scripts/ios-device-readiness.py --team "$1" --print-team)
fi
# Automatic provisioning is an explicit choice. Manual mode stops before
# prebuild/Pods unless its exact profile and a matching local identity exist.
if [ "$2" != '--automatic' ]; then
  python3 scripts/ios-device-readiness.py --team "$coinquest_team" --profile "$2"
fi
npm run typecheck
npm run lint
npm run check:dependencies
npx expo prebuild --platform ios --no-clean --no-install
(cd ios && pod install)
mkdir -p .artifacts

# Release embeds its JS/assets. Keep its DerivedData separate from Simulator.
unset SKIP_BUNDLING
export EXTRA_PACKAGER_ARGS='--max-workers 2'
if [ "$2" = '--automatic' ]; then
  set -- CODE_SIGN_STYLE=Automatic -allowProvisioningUpdates
else
  set -- CODE_SIGN_STYLE=Manual "PROVISIONING_PROFILE_SPECIFIER=$2"
fi
if xcodebuild -workspace ios/CoinQuestLedger.xcworkspace \
  -scheme CoinQuestLedger -configuration Release \
  -destination 'generic/platform=iOS' \
  -derivedDataPath .artifacts/ios-device-build -jobs 2 \
  DEVELOPMENT_TEAM="$coinquest_team" "$@" build \
  > .artifacts/ios-device-build.log 2>&1; then
  :
else
  coinquest_build_status=$?
  printf '%s\n' 'Device build failed. Inspect mobile/.artifacts/ios-device-build.log before retrying.' >&2
  exit "$coinquest_build_status"
fi

coinquest_device_app="$coinquest_app_root/.artifacts/ios-device-build/Build/Products/Release-iphoneos/CoinQuestLedger.app"
python3 scripts/ios-device-readiness.py --app "$coinquest_device_app"
printf '%s\n' "$coinquest_device_app"
printf '%s\n' 'Signed Release app prepared. Connect/install only when physical iPhone testing is authorized.'
