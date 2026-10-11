# Coin Quest mobile rebuild recovery

Date: 2026-10-11 (Asia/Bangkok).

The user approved removing only `mobile/` with `git rm -r -- mobile` and
rebuilding it in place. The previous 82 files were clean at commit
`b726368f50eb9bd251e7882f13388551e23e0c8a`. A byte-verified local recovery copy,
file manifest, original status, and working/staged patches are saved under
`.git/coinquest-recovery/2026-10-11-mobile/`.

The previous native implementation is intentionally retired. Web, Admin,
Firebase records, and Git history are outside the removal scope. Shared product
contracts remain authoritative; old native UI and build workarounds do not.

To recover, first preserve the new mobile work. Inspect the recovery manifest,
then copy the archived `mobile/` into an unused review directory. Compare it
with the desired revision before any replacement. Git also retains the full
old implementation at the commit above. Recovery over the active app needs
explicit approval because it would overwrite the rebuild.

The rebuild must build, install, launch, and be exercised on the actual iOS
Simulator before feature development progresses. Browser previews and bundle
exports cannot substitute for this gate. Each implemented flow needs native
interaction evidence and a current Simulator screenshot.
