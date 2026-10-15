#!/bin/sh
set -eu

coinquest_app_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$coinquest_app_root"

if [ "$#" -ne 1 ] || [ -z "$1" ]; then
  printf '%s\n' 'Usage: sh scripts/install-device.sh <explicit-connected-iPhone-identifier>' >&2
  printf '%s\n' 'Run only after the user authorizes connecting/installing on their iPhone.' >&2
  printf '%s\n' 'Discover the target locally with: xcrun devicectl list devices' >&2
  exit 1
fi
coinquest_device_app="$coinquest_app_root/.artifacts/ios-device-build/Build/Products/Release-iphoneos/CoinQuestLedger.app"
python3 scripts/ios-device-readiness.py --app "$coinquest_device_app"
coinquest_bundle_id=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$coinquest_device_app/Info.plist")
mkdir -p .artifacts

# Upgrade in place; never uninstall or erase the user's existing app data.
if xcrun devicectl device install app --device "$1" "$coinquest_device_app" \
  > .artifacts/ios-device-install.log 2>&1; then
  :
else
  coinquest_install_status=$?
  printf '%s\n' 'Install failed. Inspect mobile/.artifacts/ios-device-install.log for the actual pairing/trust/profile error.' >&2
  exit "$coinquest_install_status"
fi
if xcrun devicectl device process launch --device "$1" "$coinquest_bundle_id" \
  > .artifacts/ios-device-launch.log 2>&1; then
  :
else
  coinquest_launch_status=$?
  printf '%s\n' 'Launch failed. Inspect mobile/.artifacts/ios-device-launch.log before changing the app or signing.' >&2
  exit "$coinquest_launch_status"
fi
printf '%s\n' 'Install and launch commands succeeded. Inspect the iPhone and verify the actual app flows.'
printf '%s\n' 'This Release app contains its JavaScript; Metro is not required.'
