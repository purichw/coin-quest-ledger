# Website loading-readiness audit — 2026-10-14

Scope: the current website, including player routes and Admin. This is a loading
contract audit and fix, not a redesign or a native-app change. Local browser tests
run the production frontend with Firebase transport fixtures; no production
accounts or records were changed. The initial audit was local; the subsequent
authorized release is tracked in [the chat release record](../release-chat-2026-10-14.md).

## Findings and changes

1. The original loader ended at `window.load`, which does not cover asynchronous
   account/game data, font settling or artwork inserted by later rendering.
   Initial owners now register a shared readiness hold. Before reveal, the gate
   waits for applicable stylesheets, rendered images, CSS backgrounds and border artwork (including
   pseudo-elements), fonts and a stable render. Hidden dialogs/catalogs are not
   downloaded merely to release entry. A valid, styled data-error/retry state is
   a completed request; failed required page assets remain covered.
2. Repeat visits originally delayed the overlay by 500 ms. Every entry now has
   an inline head guard and activates immediately. Subsequent visits have no
   artificial minimum display time. The existing first-visit minimum remains.
3. The slow-load button previously bypassed readiness. It now reloads the page;
   it cannot expose incomplete content. A failed loading-scene illustration can
   use the existing dark fallback, while failed content assets keep the gate.
4. Account hydration used a duplicate full-screen loader. It now belongs to the
   same entry gate; its old renderer, CSS and unused loading translations were
   removed. Character/Admin standalone loading cards were removed or changed
   to local skeletons.
5. Home and Price Arena change URL without a document reload. Their navigation,
   including Back/Forward, now explicitly enters the shared gate and prepares
   the destination's artwork before showing it.
6. Account drawer, Reminders, recent boards and Board Settings use a shared
   local skeleton. Their loading does not reactivate the eye. Board-list failures
   have an error and retry instead of a misleading empty list. Skeletons expose
   accessible busy status; reduced motion disables the pulse. Admin's in-page
   collection retry uses the same skeleton.

## Route and state coverage

| Surface | Entry readiness | In-page behavior reviewed |
| --- | --- | --- |
| Home | Account, game summaries, owned boards, notification badge, artwork | Account drawer; Welcome Tour; theme/language |
| Login / signup / recovery / character creation | Initial auth resolution hands off behind the same eye | Form submissions keep action feedback; no second page loader |
| Price Arena | Account/module data and market artwork; direct URL and client navigation | Product/offer forms and filters use data already loaded |
| Split entry | Account and recent-board query | Board-list retry uses a local skeleton and preserves the draft |
| Split board | Board and character records, account, artwork | Settings board-list pending/error/retry; expense/member forms remain local |
| Debt Dragon | Initial account/module data and artwork | Dragon/payment/strategy forms remain local; save feedback retained |
| Treasury | Initial account/module data and artwork | Income/category/expense/bill forms remain local; save feedback retained |
| Character | Character, related boards, owner modules/activity and artwork | Disclosures, profile actions and account drawer stay local |
| Admin | Auth, collections and backend capability status | Failed collection read/retry; local skeleton without a second eye |

The text audit covers active HTML/JS/CSS in root, `shared`, `trip`, `debt`,
`treasury`, `character` and `admin`. Archived references and native code are not
active website routes. Accessible skeleton labels may still say “Loading” to
screen readers. Save/create/join feedback and success-before-reload feedback
are action states, not competing loading placeholders.

## Verification

- Initial targeted Chromium suite: **53 passed**, covering entry loader,
  account persistence/auth/character creation and Reminders.
- Expanded production-frontend fault injection: **11 passed** on Chromium.
- Responsive loading audit: **51 passed** across desktop Chromium, tablet
  (820×1180) and mobile (Pixel 5). Includes seven player destinations, Admin,
  late CSS, artwork/font settling, local skeletons, failed reads and retry.
- Final navigation/gate checks: **21 passed** across the same three projects,
  including Home → Price Arena → Back → Forward with held destination artwork,
  slow reload, repeat entry and failed CSS recovery. One initial test fixture
  accidentally held the same asset again on Forward; it was corrected to serve
  already-released responses. No product assertion or timeout was weakened.
- Syntax validation: 51 browser scripts and 36 modules checked.
- Asset validation: 97 deployed local assets and 47 optional CDN entries checked.
- `git diff --check` passed.

Tests: `tests/e2e/loading-readiness.spec.mjs`, `first-load.spec.mjs`,
`account-persistence.spec.mjs`, `reminders.spec.mjs`, `admin-flow-audit.spec.mjs`.
Run logs are in `test-results/loading-{targeted,expanded,responsive,final-gate}.log`.
The responsive run is a targeted loading audit, not a rerun of every financial
calculation, destructive Admin operation, backend rule or native test. Production
promotion/live-site checks are intentionally outside this request.

## Inspected visual evidence

Current local screenshots, with deterministic TEST data and held reads:

- `qa/loading-1440.png`, `qa/loading-768.png`, `qa/loading-390.png`: branded eye,
  responsive composition, progress below 100 while resources are pending.
- `qa/loading-home-auth-1440.png`: same eye shields the real auth handoff.
- `qa/drawer-skeleton-chromium.png`, `qa/drawer-skeleton-tablet.png`,
  `qa/drawer-skeleton-mobile.png`: local board-list skeleton while the account
  drawer and loaded page remain present. Desktop/tablet/mobile inspected; no
  horizontal clipping or full-screen eye during the local load.

The maintained design contract is in `PLAYER_DESIGN_SYSTEM.md`.
