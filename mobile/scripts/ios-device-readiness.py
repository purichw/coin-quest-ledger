#!/usr/bin/env python3
"""Read-only signing/artifact checks; never contacts or modifies an iPhone."""

import argparse
import datetime
import hashlib
import json
import pathlib
import plistlib
import re
import subprocess
import sys

APP_ROOT = pathlib.Path(__file__).resolve().parents[1]


def fail(message):
    raise ValueError(message)


def read_profile(path):
    result = subprocess.run(
        ["security", "cms", "-D", "-i", str(path)], capture_output=True
    )
    if result.returncode:
        fail("Could not decode a provisioning profile; inspect it in Xcode.")
    return plistlib.loads(result.stdout)


def profile_allows_bundle(profile, bundle):
    app_id = profile.get("Entitlements", {}).get("application-identifier", "")
    allowed = app_id.partition(".")[2]
    return allowed == bundle or allowed == "*" or (
        allowed.endswith(".*") and bundle.startswith(allowed[:-1])
    )


def validate_profile(profile, bundle, team=None):
    expires = profile.get("ExpirationDate")
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    if not expires or expires <= now:
        fail("Provisioning profile is missing an expiry or has expired.")
    if not profile_allows_bundle(profile, bundle):
        fail("Provisioning profile does not cover this app's bundle identifier.")
    if team and team not in profile.get("TeamIdentifier", []):
        fail("Provisioning profile does not belong to the explicitly selected team.")
    if not profile.get("ProvisionedDevices"):
        fail("Use a development or ad hoc profile that includes the intended iPhone.")
    if "iOS" not in profile.get("Platform", []):
        fail("Provisioning profile does not support iOS.")


def valid_identities():
    result = subprocess.run(
        ["security", "find-identity", "-v", "-p", "codesigning"],
        text=True, capture_output=True,
    )
    if result.returncode:
        fail("Cannot read valid signing identities from the current Keychain.")
    return dict(re.findall(r'^\s*\d+\)\s+([A-F0-9]{40})\s+"([^"]+)"', result.stdout, re.M))


def certificate_team():
    """Apple Development CN ends in a user ID; the team is the certificate OU."""
    teams = set()
    for fingerprint, name in valid_identities().items():
        if not name.startswith(("Apple Development:", "iPhone Developer:")):
            continue
        certificates = subprocess.run(
            ["security", "find-certificate", "-a", "-c", name, "-p"], capture_output=True
        )
        for pem in re.findall(
            rb"-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----",
            certificates.stdout, re.S,
        ):
            der = subprocess.run(
                ["openssl", "x509", "-outform", "DER"], input=pem, capture_output=True
            )
            if der.returncode or hashlib.sha1(der.stdout).hexdigest().upper() != fingerprint:
                continue
            subject = subprocess.run(
                ["openssl", "x509", "-noout", "-subject", "-nameopt", "RFC2253"],
                input=pem, capture_output=True,
            ).stdout.decode()
            match = re.search(r"(?:^|,)OU=([A-Z0-9]{10})(?:,|$)", subject)
            if match:
                teams.add(match.group(1))
    if len(teams) != 1:
        fail("Expected exactly one existing development-certificate team; select the authorized team explicitly.")
    return teams.pop()


def signing_check(bundle, team, requested_profile):
    identities = set(valid_identities())
    locations = [
        pathlib.Path.home() / "Library/MobileDevice/Provisioning Profiles",
        pathlib.Path.home() / "Library/Developer/Xcode/UserData/Provisioning Profiles",
    ]
    profiles = []
    for location in locations:
        for path in location.glob("*.mobileprovision"):
            try:
                profile = read_profile(path)
            except (ValueError, plistlib.InvalidFileException):
                continue
            profiles.append(profile)
    print(f"Valid local signing identities: {len(identities)}")
    print(f"Local provisioning profiles: {len(profiles)}")
    print(f"Project signing team selected: {'yes' if team else 'no'}")
    if not team:
        fail("Select the authorized project team with --team; no team is inferred from other apps.")
    if not re.fullmatch(r"[A-Z0-9]{10}", team):
        fail("Team ID must be the 10-character identifier from the authorized Apple team.")
    matching = []
    for profile in profiles:
        try:
            validate_profile(profile, bundle, team)
        except ValueError:
            continue
        certs = {hashlib.sha1(cert).hexdigest().upper() for cert in profile.get("DeveloperCertificates", [])}
        if certs.intersection(identities):
            matching.append(profile)
    print(f"Usable matching profiles with a local signing identity: {len(matching)}")
    if not matching:
        fail("Install a current profile for this app/team, its matching certificate/private key, and the intended iPhone in Xcode.")
    if requested_profile and not any(profile.get("UUID") == requested_profile for profile in matching):
        fail("The explicitly selected profile is not a usable match for this app and team.")
    print("Signing prerequisites found. Target iPhone registration/trust still needs device verification.")


def validate_release_bundle(bundle):
    if not bundle:
        fail("Embedded JavaScript bundle is empty; this app is not standalone.")
    qa_markers = (
        b"demo-coin-quest",
        b"coinquest-native-qa-emulator-only",
        b"Native emulator QA is disabled in release builds",
    )
    if any(marker in bundle for marker in qa_markers):
        fail("Release bundle contains native emulator QA bootstrap markers. Rebuild with QA disabled.")


def verify_app(path, bundle):
    if not path.is_dir() or path.suffix != ".app":
        fail("Device .app is missing. Build the signed Release device app first.")
    with (path / "Info.plist").open("rb") as stream:
        info = plistlib.load(stream)
    if info.get("CFBundleIdentifier") != bundle:
        fail("Built app has a different bundle identifier.")
    if "iPhoneOS" not in info.get("CFBundleSupportedPlatforms", []):
        fail("This is not an iPhoneOS app; a Simulator binary cannot install on iPhone.")
    if not (path / "main.jsbundle").is_file():
        fail("Embedded JavaScript bundle is missing; this app is not standalone.")
    validate_release_bundle((path / "main.jsbundle").read_bytes())
    profile_path = path / "embedded.mobileprovision"
    if not profile_path.is_file():
        fail("Device app has no embedded provisioning profile; unsigned compilation is not install readiness.")
    validate_profile(read_profile(profile_path), bundle)
    result = subprocess.run(
        ["codesign", "--verify", "--deep", "--strict", str(path)], capture_output=True
    )
    if result.returncode:
        fail("App code-signature validation failed. Rebuild using the authorized signing inputs.")
    print("Verified signed iPhoneOS app with embedded JavaScript, no QA bootstrap markers and current device provisioning.")
    print("Installation, trust, launch and actual iPhone behavior remain separate checks.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--team", help="Explicit authorized Apple team ID (never inferred)")
    parser.add_argument("--certificate-team", action="store_true", help="Use the existing development-certificate team only when the user authorized that team")
    parser.add_argument("--print-team", action="store_true", help="Print only the selected team for the build wrapper")
    parser.add_argument("--profile", help="Explicit existing provisioning profile UUID")
    parser.add_argument("--app", type=pathlib.Path, help="Verify a built .app instead of local signing setup")
    args = parser.parse_args()
    config = json.loads((APP_ROOT / "app.json").read_text())["expo"]["ios"]
    try:
        if args.team and args.certificate_team:
            fail("Select either an explicit team or the authorized existing-certificate team.")
        team = certificate_team() if args.certificate_team else args.team or config.get("appleTeamId")
        if args.print_team:
            if not team or not re.fullmatch(r"[A-Z0-9]{10}", team):
                fail("No valid authorized team was selected.")
            print(team)
            return 0
        if args.app:
            verify_app(args.app.resolve(), config["bundleIdentifier"])
        else:
            signing_check(config["bundleIdentifier"], team, args.profile)
    except (ValueError, OSError, plistlib.InvalidFileException) as error:
        print(f"NOT READY: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
