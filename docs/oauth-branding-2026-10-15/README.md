# Google OAuth branding — 15 October 2026

Status: **partial; the public brand has not been verified or published.**

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

The app is External / Testing. Branding now has the saved application home page
`https://coinquestledger.vercel.app/about/`, privacy policy `/privacy/` and terms
of service `/terms/`. The console confirmed **Branding changes saved!**. Audience
now enables Publish app; its confirmation is prepared but has not been accepted
while the corresponding deployment is pending. No Verify Branding action is
available while Testing.

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
been opened with the existing owner account and a URL-prefix verification
challenge created for `https://coinquestledger.vercel.app/`. The exact Google
HTML verification meta tag is in root `index.html`; verification must be run
after that revision is live. No unrelated property was modified.

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

## Remaining sequence

1. Deploy this isolated change through the existing CI/CD workflow.
2. Check public pages, Admin gate and required production smoke.
3. Record exact commit/run/deployment evidence below.
4. Verify the actual domains in Search Console where Google requires it.
5. Complete Branding URLs, move through the available verification workflow,
   then publish the approved branding. Review any submission declarations
   before accepting them.
6. Verify the real Google sign-in/consent screen and the original Admin account.

Official references:

- [Manage OAuth App Branding](https://support.google.com/cloud/answer/15549049?hl=en)
- [Firebase: customizing the Google sign-in redirect domain](https://firebase.google.com/docs/auth/web/google-signin#customizing-the-redirect-domain-for-google-sign-in)
