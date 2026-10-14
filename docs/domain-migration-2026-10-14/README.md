# Production domain migration — 2026-10-14

Canonical website: <https://coinquestledger.vercel.app>.
Admin: <https://coinquestledger.vercel.app/admin/>.

Release commit: `ff442e3c906bd4ae1b1f9671ee1d6a3d1d29dd06`.
CI: <https://github.com/purichw/coin-quest-ledger/actions/runs/38531883556>.

## Completed cutover

- All three CI jobs succeeded for the exact release commit: Test, Native
  contracts and Deploy production. Browser CI: **553 passed, 11 predefined
  skips**. No failed tests were bypassed and no timeout budget was raised.
- Production deployment: `dpl_23c9nDQHoVRov3yeob8Ze3pH4nAq`, READY, URL
  `coinquestledger-br92b5m1m-purich-w.vercel.app`. Its GitHub commit SHA matches
  the release commit above, and the new canonical alias points to it.
- All five legacy aliases belonging to this project were removed. Remaining
  aliases are `coinquestledger.vercel.app` and
  `coinquestledger-purich-w.vercel.app`. Historical deployment records remain.
- The retired canonical hostname returns **404 with no redirect**. The new
  hostname returns **200 with no redirect** for `/`, `/trip/`, `/debt/`,
  `/treasury/`, `/character/` and `/admin/`.
- Firebase Auth authorized domains now contain the new hostname, both existing
  Firebase helper domains, `localhost` and `127.0.0.1`; the retired web hostname
  is absent. Firebase project, users, data and security rules are unchanged.
- After removing the old domains, a fresh Google sign-in succeeded on the new
  Admin origin and real Admin reads loaded successfully. The privileged backend
  reports account recovery, Admin reset and Admin deletion as configured; none
  of those mutation operations were invoked.
- The committed active source/current operational files contain no retired
  hostname. CI now aliases only the new hostname, with a regression guard.

Final browser evidence: `qa/new-domain-admin-after-cutover.jpg`.

## Scope

- Replace the retired hyphenated production hostname in active code, native
  share/recovery URLs, URL parsing, tests, CI aliases and current operational docs.
- Rename the existing Vercel project to `coinquestledger`, preserving project ID
  `prj_ZhaR03b1Ukx5Tzi8FPDH4IFI1fM3`, production secrets and GitHub integration.
- Authorize the new web origin in Firebase Auth, then remove the retired origin
  after the new deployment is verified. No old-domain redirect is requested.
- Preserve Firebase project `pointy-personal-toolkit`, user UIDs, Firestore data,
  OAuth provider and the Firebase-hosted auth helper callback.

## Verification record

The release candidate is isolated from unrelated work in the shared checkout.
Its source snapshot and command logs are in the ignored
`mobile/.artifacts/domain-migration/` directory. Test-only port changes in that
snapshot are excluded from the release.

- Syntax, deployed-asset references and 66 unit tests passed.
- Native typecheck, lint and 59 contract tests passed.
- 21 isolated Firebase emulator tests passed; no production account recovery,
  account deletion or financial-data writes were performed.
- Real Google sign-in and Admin collection reads succeeded on the new origin.
- The app's own installed binary on iPhone 17 Pro Simulator, iOS 26.5, loaded
  the updated JavaScript. Profile and board share previews both showed the new
  hostname for the existing test account. No share was sent.
- The full browser run passed 530 cases and skipped 11 predefined cases. Five
  failures were investigated: three used a hardcoded test-server port, and two
  exhausted the screenshot budget. The loader cases passed on all three browser
  projects after correcting the isolated harness port. The welcome-tour case
  passed with one worker; the split auth composition cases all passed (27/27).
  An additional Admin/loader run passed 44 cases with one predefined skip.
  The isolated server uses port 4578 because the normal
  development port is occupied; its loader-test origin was adjusted locally.
- Local diagnostic logs showed high-DPI screenshots taking 4–6 seconds each.
  The auth composition test previously took six screenshots under one 30-second
  budget. Login, Sign Up and Recovery now have separate cases, preserving all
  images/assertions and the same timeout. This focused test repair is included
  in the release; unrelated loading changes in the checkout are excluded.

Evidence: `qa/new-domain-admin-login.jpg`, `qa/native-profile-share.jpg`, and
`qa/native-board-share.jpg`.

## Boundaries and recovery

The web origin changes browser storage boundaries: users may need to sign in
again, and browser-only drafts do not automatically transfer. Native source is
updated; an already distributed app needs an updated app build for embedded
URLs to change. Android/device distribution was not performed.

Historical screenshots, ZIP handoffs and capture manifests retain their actual
capture-time origin. They are not active website or deployment configuration.

The pre-cutover Firebase domain list is saved locally at
`mobile/.artifacts/domain-migration/firebase-authorized-domains-before.json`.
Alias inventories before/after retirement and the verified deployment metadata
are stored in the same ignored directory. This report and its screenshots are
dated migration evidence; `.vercelignore` excludes them from the deployed app.
The release facts above describe the named migration commit, not the health of
any later deployment.
The prior production deployment is `dpl_B5a6xfWvdacVtoSjWhmBpzhTW37S`, source
`574e54a3030e791231a5741f6c9ca9df2097ce70`. If application rollback is needed,
keep the new canonical hostname and inspect embedded native links before
reverting the domain-specific source. Do not silently re-enable retired aliases.
