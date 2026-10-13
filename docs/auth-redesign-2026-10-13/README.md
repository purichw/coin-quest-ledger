# Tavern authentication — 13 October 2026

Scope: website Login and Sign Up, using the three user-provided Tavern mockups
at Desktop 1440px, Tablet 768px and Mobile 390px. Shared on Home, Split Expense,
Debt Dragon and Treasury. No native app or Admin changes in this increment.

## Design and product contract

- Full tavern scene, brown/gold hanging guild banner, parchment card, red toolbox
  badge, emerald mode tabs and primary action, icon fields, password reveal,
  upper-right theme/language controls, reassurance copy and decorative owl note.
- Tablet uses a compact brand, a centered form and reassurance inside the card;
  mobile uses dedicated portrait artwork and a compact banner above the form.
  Long Sign Up/recovery forms scroll naturally. Decoration cannot cover actions.
- Existing Mitr / IBM Plex Sans Thai roles and site English display font remain.
  Field labels follow the reference's leading alignment. Signup's extra display
  name and password confirmation remain; screenshot-only annotations are omitted.
- No new public routes, account identifiers, authentication providers, database
  schema, password rules or recovery mechanism. The required auth gate is not
  dismissible. Recovery keeps its existing route back to Login.
- Forgot password uses the same shell to avoid a visual discontinuity; the
  reset transport and validation rules are unchanged.

## Implementation

- `shared/profile-login.js`: shell, shared field markup, labelled reveal controls,
  keyboard focus containment and Login/Sign Up/recovery presentation.
- `shared/profile-hub.css`: `.auth-entry` materials and three responsive layouts.
  Removed superseded unscoped login-tab styling. Character creation retains its
  existing `.login-card` defaults.
- `shared/profile-hub.js`: localized copy, presentation-only draft restoration,
  accessible tab selection, busy/error feedback. Draft passwords stay in memory;
  theme/language changes preserve values, switching auth modes clears passwords.
- `shared/quest-icons.js`: matching toolbox, lock and eye-off glyphs.
- `assets/auth-reference/`: generated production art; prompts/source outputs in
  `assets.json`. Built-in image generation, optimized WebP; no mockup flattened
  into the live UI. Text on the decorative brand banner is fixed brand copy;
  all form/help copy remains selectable, localizable HTML.

## Signup regression found and fixed

An asynchronous live-board/reminder refresh matched every `.rem-panel`, including
the Recovery ID panel shown after character creation. It could replace that
panel before the user saved the code. Both remaining async refresh paths now
exclude `.recovery-panel`, matching the existing invite-refresh safeguard.
The new test begins at Sign Up in production-mode frontend code with a stubbed
Firebase transport, then creates the hero, checks Recovery ID priority, signs out,
signs in and reloads without creating a second character.

## Verification

Release regression follow-up: late font/artwork layout changes could move a
focused Sign Up field below a 320×450 viewport. The shared auth renderer now
keeps focused controls visible after focus and form-size changes, with observer
cleanup when the renderer is replaced. The short-screen regression explicitly
simulates late banner sizing; this is also exercised in tablet/mobile browser
contexts. No authentication or persistence rules changed.

Evidence is local, based on the dirty working tree over `df55bc7`; not deployed.
Only `manifest.json` lists final selected captures; other QA images may be earlier
iterations. Screens use synthetic TEST data or an empty anonymous form.

- Targeted Playwright tests in `tests/e2e/account-persistence.spec.mjs`: both
  forms and loaded artwork at 1440×900, 768×1024 and 390×844; field validation;
  English/dark mode; draft preservation; reveal; keyboard tabs/focus; loading and
  retry; Recovery; module entry; short 320×450 viewport; signup/sign-in/reload.
- Firebase transport is stubbed for these tests. No production accounts created,
  passwords changed or Firestore data written. These checks do not certify live
  Firebase Rules or a real Safari/iOS software keyboard.
- Screens personally inspected for artwork/crop, form hierarchy, button and
  icon treatment, scrolling, lower-page composition, and tablet ornament overlap.
- Syntax, deployed-asset inventory and `git diff --check` checked separately.
- Results: 9 targeted Chromium cases and 2 additional mobile/tablet signup
  round trips passed. Four affected visual/draft cases reran after final contrast
  refinements. Syntax: 48 browser scripts / 22 modules; assets: 76 local / 47 CDN.
- Broader game regression, native Simulator, full backend suite and deployment
  intentionally excluded from this UI request.

Command environment:
`PATH=/Users/point/.nvm/versions/node/v24.21.0/bin:$PATH`
`PLAYWRIGHT_BROWSERS_PATH=/Users/point/toolbox/mobile/.artifacts/playwright`
`POINTY_REAL_FIREBASE_E2E=0`

Run the auth slice with:
`npx playwright test tests/e2e/account-persistence.spec.mjs --project=chromium --grep 'Tavern auth|login and signup omit|login, signup and recovery'`
