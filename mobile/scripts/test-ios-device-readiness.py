"""Safety checks: no Keychain, profile changes, build or device access."""

import datetime
import hashlib
import importlib.util
import io
import os
import pathlib
import plistlib
import subprocess
import sys
import unittest
from unittest.mock import MagicMock, patch

sys.dont_write_bytecode = True

spec = importlib.util.spec_from_file_location(
    "ios_device_readiness", pathlib.Path(__file__).with_name("ios-device-readiness.py")
)
readiness = importlib.util.module_from_spec(spec)
spec.loader.exec_module(readiness)

BUNDLE = "com.example.coinquest"
TEAM = "TEAM123456"


def profile():
    return {
        "ExpirationDate": datetime.datetime.now() + datetime.timedelta(days=1),
        "Entitlements": {"application-identifier": f"{TEAM}.{BUNDLE}"},
        "TeamIdentifier": [TEAM],
        "ProvisionedDevices": ["synthetic-device"],
        "Platform": ["iOS"],
    }


class ReadinessTests(unittest.TestCase):
    def test_release_bundle_rejects_missing_content_and_qa_bootstrap(self):
        readiness.validate_release_bundle(b"synthetic-production-bundle")
        for bundle in (b"", b"demo-coin-quest", b"coinquest-native-qa-emulator-only", b"Native emulator QA is disabled in release builds"):
            with self.subTest(bundle=bundle), self.assertRaises(ValueError):
                readiness.validate_release_bundle(bundle)

    def test_release_build_refuses_emulator_environment_before_signing(self):
        environment = os.environ.copy()
        environment["EXPO_PUBLIC_NATIVE_QA_EMULATORS"] = "1"
        script = pathlib.Path(__file__).with_name("build-device.sh")
        result = subprocess.run(
            ["sh", str(script), "--existing-certificate-team", "--automatic"],
            env=environment, capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 1)
        self.assertIn("Refusing Release build", result.stderr)

    def test_current_exact_and_wildcard_profiles(self):
        readiness.validate_profile(profile(), BUNDLE, TEAM)
        wildcard = profile()
        wildcard["Entitlements"]["application-identifier"] = f"{TEAM}.com.example.*"
        readiness.validate_profile(wildcard, BUNDLE, TEAM)
        self.assertFalse(readiness.profile_allows_bundle(wildcard, "com.examples.other"))

    def test_rejects_expired_wrong_team_wrong_app_and_store_profiles(self):
        changes = [
            {"ExpirationDate": datetime.datetime.now() - datetime.timedelta(days=1)},
            {"TeamIdentifier": ["OTHER12345"]},
            {"Entitlements": {"application-identifier": f"{TEAM}.com.other.app"}},
            {"ProvisionedDevices": []},
            {"Platform": ["OSX"]},
        ]
        for change in changes:
            with self.subTest(change=change), self.assertRaises(ValueError):
                readiness.validate_profile({**profile(), **change}, BUNDLE, TEAM)

    def test_certificate_team_uses_ou_not_display_name_suffix(self):
        der = b"synthetic-public-certificate"
        fingerprint = hashlib.sha1(der).hexdigest().upper()
        outputs = [
            b"-----BEGIN CERTIFICATE-----\nsynthetic\n-----END CERTIFICATE-----",
            der,
            f"subject=CN=Apple Development: Example (USER123456),OU={TEAM},O=Example,C=US".encode(),
        ]
        with patch.object(readiness, "valid_identities", return_value={fingerprint: "Apple Development: Example (USER123456)"}), patch.object(
            readiness.subprocess, "run", side_effect=[subprocess.CompletedProcess([], 0, value) for value in outputs]
        ):
            self.assertEqual(readiness.certificate_team(), TEAM)

    def test_rejects_simulator_bundle_before_signature_or_device_work(self):
        app = MagicMock()
        app.is_dir.return_value = True
        app.suffix = ".app"
        app.__truediv__.return_value.open.return_value = io.BytesIO(plistlib.dumps({
            "CFBundleIdentifier": BUNDLE,
            "CFBundleSupportedPlatforms": ["iPhoneSimulator"],
        }))
        with patch.object(readiness.subprocess, "run") as run, self.assertRaisesRegex(ValueError, "not an iPhoneOS app"):
            readiness.verify_app(app, BUNDLE)
        run.assert_not_called()

    def test_missing_device_binary_does_not_contact_any_tool(self):
        app = MagicMock()
        app.is_dir.return_value = False
        with patch.object(readiness.subprocess, "run") as run, self.assertRaisesRegex(ValueError, "Device .app is missing"):
            readiness.verify_app(app, BUNDLE)
        run.assert_not_called()


if __name__ == "__main__":
    unittest.main()
