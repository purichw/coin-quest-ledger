# Coin Quest mobile rebuild recovery

## 2026-10-20 approved workspace cleanup (complete)

The user approved the exact manifest and cleanup command in
`.git/coinquest-cleanup-2026-10-20/PLAN.md`. The cleanup removed 851 untracked
temporary files and superseded handoff outputs, and restored 144 tracked QA
images to their committed baseline at `deb096345da5a95fa909156c390c39fbfb5c5644`.
Nine useful documentation/evidence files were preserved in commit `7e4f111`.
No runtime code, live route, user data, test coverage or Git history was removed;
no product feature is parked or awaiting restoration.

Local recovery checkpoint:
`/Users/point/toolbox/.git/coinquest-cleanup-2026-10-20/checkpoint/`.
It contains the status, binary working/staged diffs, manifest, restore instructions
and a byte-verified archive of all 995 affected files. The archive SHA-256 is
`a65fdd9973f086eea7e564a88131fb48bdc78ab0126c62a14eca7ed786974ab4`.
The adjacent `receipt.json` records the completed operations. This checkpoint
is local recovery material and is not included in the repository or deployment.

To recover an old output, extract only the selected archive entries into a new
review directory, compare their hashes with the manifest and check against the
current files. Obtain approval before overwriting newer work. Verify any restored
output for its intended use; do not restore a complete historical output set over
the active workspace. Post-cleanup Git status was clean apart from the preserved
documentation commit awaiting push. No feature restoration remains outstanding.

## 2026-10-12 full player design restoration (verified locally)

The user superseded the colors-only pass: restore Website and rebuilt Mobile
to their last design immediately before the ui-ux-expert redesign request.
Admin remains excluded. Restore presentation with scoped patches; preserve
current backend, Firebase, data, routes and feature fixes.

Recovery checkpoint: `.git/coinquest-recovery/2026-10-12-full-design-145231/`.
It contains the original HEAD (`34aa1a0`), status, binary working/staged diffs,
copies of untracked skills, all affected source files and uncommitted docs.
`restore-design.patch` records the proposed presentation-only change.
No Git history is rewritten and no runtime feature is being parked.

Web reference: original inline styles and composition at `b726368`, supported
by `redesign-2026-10-12/web-*-before.jpg`. Native reference: the exact native
presentation patches from this same chat between 04:15 and 04:44 Bangkok,
reversed against the rebuilt app while retaining subsequent backend fixes.
The retired 82-file app is not the native reference.

The redesigned player stylesheets remain in Git and on disk but are detached
from player pages; Admin continues to load its own tokens and design.
To reinstate a redesigned surface later, compare its checkpoint copy and apply
only the selected presentation changes, then verify route and native flows.
Completion requires current browser captures of every player module, responsive
checks, native Simulator walkthrough, native lint/typecheck and relevant tests.
These gates passed; see `design-restoration-2026-10-12/README.md`. No feature is
parked and no later feature restoration is required. The subsequent authorized
release includes this pass; deployment status is tracked separately in the
exact-SHA CI workflow and canonical alias (see `release-2026-10-12.md`).

## 2026-10-12 player website and mobile brand adjustment

The user's final scope is **player Website and Mobile colors/brand only**. The
user explicitly excluded Admin and narrowed the initial full-UI rollback to
retaining the current layout and functional work. Mobile was subsequently added
to the same brand-only scope. No earlier native app or backend code is restored.

Recovery ref: `checkpoint/player-brand-before-restore-68021cc`, pointing to
`68021cc1d8af23ed198ce48e97a91d8b4e7292f4`. The working tree was clean before
this pass. The original palette is referenced from `b726368` and its screenshots.

Implementation: add player-only `shared/player-brand.css` to the five player
HTML entry points, and restore native colors in its existing shared primitives
and Home/portrait styles. Shared/Admin tokens and runtime/data logic stay intact.
The new palette remains recoverable by removing those five stylesheet links in
a future approved patch. No feature, test, route, data or work is parked or lost;
there is no unresolved feature restoration item from this color adjustment.

Verification: light/dark player routes, narrow viewport, current-layout geometry,
one unchanged Admin palette check, native lint/typecheck, and the installed own
binary on iPhone 17 Pro Simulator. Backend/full release checks are not repeated
for this color-only scope. See `player-brand-2026-10-12/README.md` for evidence.

## Earlier approved mobile rebuild

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
