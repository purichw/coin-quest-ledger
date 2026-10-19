# Google OAuth branding — 15 October 2026

Status (19 October 2026, Bangkok): **website changes deployed; OAuth app In
production; branding submitted for manual review and currently under review.**

## Saved configuration

- Google Cloud/Firebase project remains `pointy-personal-toolkit`.
- The existing OAuth Branding app name is `Coin Quest Ledger`; it was already
  set when this session inspected the console.
- Support and developer contact remain `purich.wc@gmail.com`.
- The existing web OAuth client now has the JavaScript origin
  `https://coinquestledger.vercel.app`. Retired Vercel origins were removed.
- Branding Authorized domains now contains only
  `coinquestledger.vercel.app` and `pointy-personal-toolkit.firebaseapp.com`.
  The console displayed **Branding changes saved!**, and a subsequent read
  showed the same saved list.
- The existing client ID, secret and Firebase callback remain unchanged:
  `https://pointy-personal-toolkit.firebaseapp.com/__/auth/handler`.
- No Firebase project, user, UID, account data or admin allowlist was migrated.

## Public pages and owner decisions

The owner approved Coin Quest Ledger as the public provider name and
purich.wc@gmail.com as the contact, and authorized adding policy text. No fixed
retention policy existed. The published-page source therefore describes the
actual deletion behavior and explicitly says retained audit/deletion records
have no fixed automatic deletion schedule. No cleanup job or new data deletion
was added.

Public source: `about/index.html`, `privacy/index.html`, `terms/index.html`.
All three pages are Thai with an English version, have reciprocal links, and
load no authentication gate. Public navigation and login links expose them before
sign-in. The login focus loop includes the new links. The Admin gate's public
allowlisted-email notice was removed at the owner's request; access checks,
login hint, Firebase identity, accounts and rules remain unchanged.

The original `*-DRAFT.md` files below are historical drafting records, superseded
by those HTML pages. Their pending-input notes are no longer current.

## Google verification and publishing

The app is External / In production. Branding has the saved application home page
`https://coinquestledger.vercel.app/about/`, privacy policy `/privacy/` and terms
of service `/terms/`. The console confirmed **Branding changes saved!**. After
the website deployment, Publish app was confirmed and Audience displayed
**In production**. No scopes, Firebase permissions or Admin allowlist changed.

Verify branding then ran and returned one issue: Google had not yet associated
the home-page website with the verified owner. Search Console had already
confirmed **Ownership verified — HTML tag** for the URL-prefix property
`https://coinquestledger.vercel.app/`. Google's issue explicitly says to wait
24 hours after ownership verification before retrying. No repeated verification
request or unsupported appeal was submitted. Retry no earlier than 17 October
2026 at 01:00 Asia/Bangkok, then publish branding if Google makes that action
available. This was the initial follow-up plan; see the 17 October result below.

### 17 October follow-up

After the 24-hour window, one automated re-verification again returned the same
homepage-ownership finding. Search Console Settings still showed **You are a
verified owner** for `https://coinquestledger.vercel.app/` and the same Google
account. The root verification tag and all three public information pages remain
live. URL-prefix/HTML-tag ownership is distinct from the DNS Domain Property
method described in Google's current
[domain verification guidance](https://support.google.com/cloud/answer/13804266?hl=en).
Do not assume waiting another 24 hours alone resolves that difference.

A manual-review appeal was prepared with reason **Other**, explicitly explaining
the URL-prefix verification method, Vercel subdomain, elapsed waiting period and
public homepage/policy links. It asks Google to review that evidence and advise
whether another verification method or a custom domain is required; it does not
claim DNS verification. The final questionnaire was completed in the browser
while this follow-up was active. The agent did not select its acknowledgments or
press its final Submit button. The subsequent authoritative console state is
**Your branding is currently under review**. Data access separately says
verification is not required because no sensitive/restricted scopes are requested.

Google's additional-review UI estimates **2–3 business days**, not a guaranteed
completion time. Do not resubmit or change publishing status while that review
is pending. No new domain is selected or required from the owner at this point;
wait for the review outcome before choosing that remedy. The real Google sign-in
name has not yet been accepted as changed, and no branding Publish action was
available during this follow-up. Firebase, OAuth client, accounts, data, scopes
and Admin access remain unchanged.

Evidence: `mobile/.artifacts/oauth-branding-2026-10-17/` (ignored), containing
`search-console-verified-owner.png`, `branding-reverification-issue.png`, and
`branding-under-review.png`. `verification-questionnaire-pending.png` captured
the in-progress submission transition, not an unsubmitted/unchecked form.
The existing daily 01:00 Asia/Bangkok heartbeat remains active to check the review,
publish branding when available and verify the visible sign-in name before stopping.

### 18 October scheduled check

The fresh Verification Center read still shows **Your branding is currently under
review**, with no new actionable finding or Publish control. Data access still
requires no verification for sensitive/restricted scopes. No configuration was
changed and no review was resubmitted. The sign-in name is not yet confirmed as
changed; the existing daily follow-up continues silently while review is pending.
Fresh evidence: `mobile/.artifacts/oauth-branding-2026-10-18/branding-under-review.png`
(ignored).

### 19 October scheduled check

Verification Center still shows **Your branding is currently under review**.
No new finding or Publish control is visible. No configuration changes or
resubmission were made; the existing daily follow-up remains active. The real
Google sign-in name has not yet been confirmed as changed.
Fresh evidence: `mobile/.artifacts/oauth-branding-2026-10-19/branding-under-review.png`
(ignored).

Google requires a public descriptive home page, policy/terms links and domain
ownership verification as applicable. Saving the app name does not make it
the published consent-screen name. Until verification, Google can show the
application domain instead. The Firebase helper hostname is a separate
setting; changing the project display name does not rename that hostname.

Historical content drafts:

- [About](ABOUT-DRAFT.md)
- [Privacy policy](PRIVACY-DRAFT.md)
- [Terms](TERMS-DRAFT.md)

These draft records under `docs/` are excluded from Vercel. Search Console has
been opened with the existing owner account and the URL-prefix property verified
for `https://coinquestledger.vercel.app/` using the Google HTML verification meta
tag in root `index.html`. Keep that tag in place. No unrelated property was
modified.

## Fresh login test

Production route: `https://coinquestledger.vercel.app/admin/` in the existing
Chrome session. The expected allowlisted Google account is
`purich.wc@gmail.com`.

**FAIL:** three popup attempts ended with the app's
`auth/popup-closed-by-user` message. One attempt visibly reached Google's
callback with a returned authorization code, but that is not proof of a
completed Firebase login. The last attempt followed a page reload and did
not claim or move the popup; the same UI error remained. No further blind
retries were performed.

The inspected Admin auth code still calls `signInWithPopup`, retains the
existing allowlist and Firebase helper, and maps this error to the visible
message. The current production response has no COOP header; its CSP is
Report-Only. The available captured console warning/error log was empty.
These observations do not establish the cause. The earlier 14 October login
success is historical evidence and does not turn this fresh test into a pass.

The owner subsequently reported “เรียบร้อย” after the requested normal manual
Google login with the same email. This is user-reported successful completion,
not an automated success capture. Do not infer an app auth failure solely from
the automation popup result. Never paste auth codes or tokens into reports.

## Evidence and scope

Evidence directory:
`mobile/.artifacts/oauth-branding-2026-10-15/` (ignored).

- `branding-current.jpg`: saved app name, empty application links, Testing.
- `branding-domains.jpg`: saved domain list.
- `verification-status.jpg`: verification status.
- `admin-google-login.jpg`: failed popup login UI, not a success capture.

Additional local evidence: `about-desktop.jpg` (1440-wide) and
`about-mobile.jpg` (390 × 844), visually reviewed. Syntax and asset checks pass.
The targeted Tavern auth draft/language/theme/password/keyboard test passes,
including Tab navigation through About/Privacy/Terms and opening Privacy without
the login gate. Its initial failure was a test selector matching both shared
footer and login links; the corrected selector is scoped to `.auth-legal-links`.
The shared game footer links were subsequently removed to preserve the existing
compact layout; policy links remain on login and the three public pages.

Release scope is the three public pages, their shared styling/navigation,
ownership metadata, Admin notice removal, focused test and this documentation.
No Firebase rules, credentials or account lifecycle behavior changed. Unrelated
workspace changes are excluded. Full local app/native suites were intentionally
skipped; required CI gates and post-deploy smoke remain the release checks.

The preceding CI run `38769473606` on `3592363` failed in all three viewport
projects because the Debt Dragon test still expected `card.png` after the
existing implementation moved to `card.webp`. This release includes only that
one assertion correction, with no game behavior change. The targeted test
passes on desktop, tablet and mobile with one worker (3 passed, 1.1 minutes).
An initial parallel local run hit the unchanged 30-second overall test timeout
later in the flow while host load exceeded 24; the serial diagnostic run kept
the same timeout and assertions. No CI budgets or gates were weakened.

Commit `0844fc2224c1d8785fed9fc06a70d306d26120f5` was pushed. Its CI run
`38773215191` failed only the 390px Character composition height check in all
three browser projects (1493px against the existing <1450px budget; 757 passed,
11 skipped). The added shared footer policy row caused this increase. The repair
removes that global row and keeps policy navigation on login/public pages;
the height assertion remains unchanged. Deploy was skipped by the required gate.
After the repair, Character composition at 1440/768/390px and the Tavern login
keyboard/policy journey pass in Chromium, tablet and mobile projects (12 passed,
1 minute, one worker). The failed check and affected navigation are covered
before pushing the repair.

## Deployed release

- Commit: `2b5f8f18ec80fc14e7ab88710b6badc8fa41a60e`.
- CI/CD: [38775986929](https://github.com/purichw/coin-quest-ledger/actions/runs/38775986929),
  successful: 67 unit tests, 760 E2E passed / 11 skipped, 21 isolated Firebase
  integration tests, and Native contracts.
- Deployment: `https://coinquestledger-qjjxlbvbu-purich-w.vercel.app`.
- Canonical alias: `https://coinquestledger.vercel.app`, assigned at
  2026-10-15 17:36:45 UTC.
- `/`, `/about/`, `/privacy/`, `/terms/`, `/admin/app.js` and
  `/shared/player-layout.js` returned HTTP 200 with bytes matching the deployed
  commit. A fresh signed-out production Admin screenshot confirms the public
  email notice is absent.
- Evidence: `ci-38775986929-complete.log`, `admin-production-no-email.png`,
  `admin-test-gate-mobile.png`, and
  `branding-awaiting-domain-propagation.png` in the ignored evidence directory.

Production smoke passed with `PROD_SMOKE_RUN_ID=2b5f8f1` using the unchanged
harness and assertions; all 33 route/auth screenshots are in
`test-results/prod-smoke/2b5f8f1/`. The log is
`prod-smoke-2b5f8f1-standard-id.log` in the evidence directory.

Two earlier runs with long descriptive run IDs failed only mobile
`admin-test-gate`. That route unlocks into **Boards**, not just the login gate.
The harness embeds its run ID in the synthetic board ID; the existing mobile
Boards grid uses a `max-content` URL column, so a long synthetic ID expands it.
The signed-out test gate itself measured 390px scroll/client width with fonts
loaded. The normal-length run ID passes the same overflow assertion. Admin CSS
and the smoke harness are unchanged from pre-release `3592363`; the actual
new-board contract accepts four-digit IDs. Retain this long/legacy-ID layout
limitation as a separate finding; do not describe the two earlier runs as passes
or infer a font-loading race from them. No assertions or time budgets changed.

## Remaining sequence

1. Wait for the current manual branding review; inspect any new findings before changing configuration.
2. Publish the approved branding when Google makes it available.
3. Verify the visible Google sign-in name and original Admin account again.

Official references:

- [Manage OAuth App Branding](https://support.google.com/cloud/answer/15549049?hl=en)
- [Firebase: customizing the Google sign-in redirect domain](https://firebase.google.com/docs/auth/web/google-signin#customizing-the-redirect-domain-for-google-sign-in)
