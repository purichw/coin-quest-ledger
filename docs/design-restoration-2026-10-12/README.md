# Full pre-redesign player design restoration — 12 October 2026

## Accepted direction and result

**VERIFIED for the restored presentation and the browser/Simulator scope below.**
The user explicitly requested the latest design immediately before the earlier
ui-ux-expert redesign instruction, including buttons, colors, typography,
layout and composition, on Website and Mobile. This supersedes the colors-only
pass at `34aa1a0`. Admin remains excluded. No commit, push or deploy is included.

- Website: restore the original inline CSS in Home/Compare, Trip, Debt,
  Treasury and Character from `b726368`. Detach `quest-tokens.css`,
  `quest-design.css`, `player-brand.css` and `character/design.css` from player
  pages. Restore the vertically stacked Party Ledger workspace and original
  floating controls. Detached files remain recoverable on disk and in Git.
- Mobile: restore the rebuilt app's presentation, not the retired native app.
  Recover and reverse the exact native presentation patches from this same chat
  after the redesign request at 04:15 Bangkok. Auth primitives, shared player
  primitives and Home are byte-identical to their original pre-redesign reads.
  Profile, Debt, Treasury, Prices, Split and artwork layout are restored too.
- Current backend/feature fixes remain. Admin, API, shared JavaScript and
  Firestore Rules have no diff in this pass. Current archive/restore actions,
  module sync, UID-preserving recovery, calculations and validation remain.
  Native Treasury exposes its existing income form directly again.

See [source proof](source-proof.json) and [visual review](review.html).
The latter contains original reference/current pairs for all six web surfaces,
the native Home pair, native module/form captures and mobile web evidence.

## Verification

- `npm test`: syntax and asset checks passed; **55 unit tests**, **83 browser
  tests passed**, **7 intentional skips** (opt-in live/visual fixtures).
  Browser projects cover desktop, tablet and phone; interactions include
  split modes, forms, settings, skins, comparisons, Treasury and auth/profile.
- Native `npm run typecheck`, `npm run lint`: passed.
- Native `node --test tests/*.test.mjs`: **58 passed**.
- `git diff --check`: passed. Source proof confirms all five inline style
  owners match `b726368` and all ten native owners match the recovered target.
- Actual own binary `com.purichwc.coinquestledger`, iPhone 17 Pro / iOS 26.5,
  device `7FEE6572-2952-4E46-9649-532C62A2CA42`, Metro 8093. Restarted the app,
  reopened its development server, and verified the existing login persisted.
  No native dependencies changed; the installed binary loaded the current JS.
- Simulator walkthrough: Home top/bottom and every module destination; large
  Profile portrait; Debt overview/detail/back; Treasury's restored income form
  with actual keyboard; Prices list/item/back; Split list/board/expense;
  native date picker open/cancel with date unchanged; back to Home.
  Existing QA Firebase data remained visible: board 3512 total 400 / 2 people /
  4 expenses, Debt 700, Treasury income 5000 / spent 420 / remaining 4580,
  and two price offers. No finance records were changed during this walkthrough.

## Capture conditions and limits

Current browser captures: local `http://127.0.0.1:4569`, Chromium, 1280×900 and
390×844, loaded fonts, test-mode QA fixtures. The website reference screenshots
are the original `../redesign-2026-10-12/web-*-before.jpg`, not reconstructed
renders. Data differs from the earlier live QA state; zero/fixture amounts are
not evidence of missing Firebase data. Native captures use the authorized real
QA account, character 2150 / 162 XP, with no mock financial data.

Home comparison preserves the later fix for the missing chest icon. The current
web sync banner depends on connection state and is absent in test-mode captures.
Treasury's explanatory forecast labels and truthful backend-derived profile
metrics remain. These are retained functional fixes, not a new visual direction.
Native Home reference `home-final-162.png` and current `native-home.png` match
device, content and scroll top; only the clock differs. The comparison HTML
scales original images proportionally without reconstructing or editing pixels.
Full-page web captures show fixed mobile navigation at the viewport boundary;
interactive responsive tests separately verify actual reachability and overflow.

No production promotion, native distribution, Android or physical-device run,
fresh live cross-client write test, account creation/recovery submission or
backend migration was performed. Backend emulator tests were not repeated:
this pass changes presentation only and preserves backend source exactly.

## Recovery

Base HEAD: `34aa1a04335d02d2933a9b2be378bacb726c8fa2`.
Checkpoint `.git/coinquest-recovery/2026-10-12-full-design-145231/` contains the
pre-edit status, HEAD, binary working/staged patches, affected source copies,
uncommitted docs and untracked skills. See `../rollback-parking-lot.md`.
Prior documentation work is preserved. No feature restoration remains parked.

Local test logs: `mobile/.artifacts/design-restore-web-tests.log` and
`mobile/.artifacts/design-restore-native-tests.log` (ignored artifacts).
