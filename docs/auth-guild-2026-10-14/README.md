# Guild account entry — 14 October 2026

Selected reference: `codex-clipboard-c54bd42d-8f15-4950-87bb-837609b97aca.png`,
supplied in the current request. This supersedes the 13 October login mockup
for website **login, signup and forgot-password / Recovery ID reset** only.
Native and Admin are outside this change.

## Design translation

| Preserve | Translate | Adapt | Do not infer |
| --- | --- | --- | --- |
| Firebase username/password, Recovery ID, persisted sign-in, drafts, validation, keyboard focus and loading handoff | Green/gold treasury seal, irregular parchment, tavern, guild banner, owl, green buttons and slim outlined fields | Right-hand desktop form; centered tablet/mobile; real four-field signup/reset forms may scroll; mobile scenic traveler footer | Google/Apple authentication, a new persistence policy, or a new destination called Treasury |

The welcome heading precedes the mode tabs. All three forms use the same frame,
seal, paper, field controls and footer. Existing Mitr / IBM Plex Sans Thai / Chakra
Petch roles remain; Georgia italic is used only for the decorative English motto.
Field labels follow the reference's leading alignment. Controls retain readable
16px inputs and 44px-or-larger primary form targets.

The reference explicitly makes social providers conditional. Neither is enabled
in the current product, so no inactive Google/Apple controls were added. Existing
automatic sign-in persistence is described by a read-only shield note rather
than represented by an unimplemented checkbox. Signup still includes the real
display-name and password-confirmation fields. Recovery still requires username,
Recovery ID, new password and confirmation.

Character creation keeps the previous tavern/artwork variant. Shared form
interaction bindings remain in `shared/profile-login.js`; this variant adds no
auth/session API. The account-loading night scene remains intact.

## Owners and assets

- `shared/profile-login.js`: markup and shared `.auth-guild` presentation;
  credential submission continues to be owned by `shared/profile-hub.js`.
- `shared/profile-hub.css`: guild tokens, paper, controls, responsive geometry,
  dark variant and a solid fallback beneath the paper artwork.
- `assets/auth-guild/tavern.webp`: desktop tavern, green banner and owl.
- `assets/auth-guild/doorway.webp`: tablet/mobile environment and footer crop.
- `assets/auth-guild/treasury-seal.webp`: transparent gold/green building crest.
- `assets/auth-guild/parchment.webp`: transparent aged paper and corner tacks.
- `assets.json`: built-in image generation prompts and reference provenance.

The new generated illustrations interpret the selected art direction; they are
not pixel-identical extracts from the mockup. All four runtime assets total
866,826 bytes. Old owl markup/styles and unused encouragement copy were removed.
Old tavern/banner assets remain because character creation still uses them;
the historical owl file is retained with the previous design evidence.

## Verification and evidence

Local route: `http://127.0.0.1:4569/`, baseline `94b96d0` plus this working diff.
Production-mode frontend, with only Firebase transport replaced by the existing
isolated test fixture. No real account or production data was created/modified.
All captures wait for fonts and image decode; animations are disabled.

Viewport captures use 1440×900, 768×1024 and 390×844. `in`, `up` and `recovery`
are the login, signup and reset forms. `top`/`bottom` refer to the actual fixed
login gate's scroll position; the page body does not scroll. English dark and
short-screen evidence are labeled separately. Before screenshots were captured
from the unmodified login at 1440 and 390px.

Reviewed the complete requested surfaces: seal/paper edges, heading/tab order,
input/action spacing, desktop banner/owl balance, tablet centering, mobile
footer/crop, lower signup/reset fields, and English dark text contrast. Sibling
character creation/picker captures were also reviewed for shared-style drift.

Targeted regression covers all three form layouts; keyboard tabs and focus;
drafts through language/theme changes; password visibility; invalid fields;
duplicate-submit prevention and failure recovery; signup → Recovery ID → hero
creation → sign-out/sign-in → reload with the same identity. Shared loading
handoff and character creation/picker behavior are included.

Commands:

```sh
POINTY_REAL_FIREBASE_E2E=0 POINTY_QA_DIR=docs/auth-guild-2026-10-14/qa \
  npx playwright test tests/e2e/account-persistence.spec.mjs \
  --grep 'Tavern auth|login, signup and recovery|shared loading scene|Character creation' \
  --project=chromium
npm run test:syntax
npm run test:assets
git diff --check
```

The main targeted run passed **15/15**. Final responsive recaptures and mobile
touch-emulation checks are recorded in `qa/verification.json`. Full unrelated
game/backend suites and production deployment are not part of this scoped UI
change. Do not describe fixture success as a new live Firebase certification.
