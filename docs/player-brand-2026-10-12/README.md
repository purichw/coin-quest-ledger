# Classic player brand restoration — 2026-10-12

Scope: restore Website and Mobile colors/CI while keeping the current layout,
fonts, navigation and functionality. Admin is explicitly excluded. The initial
visual pass was local, based on `68021cc`; the user subsequently requested
push/deploy. The exact release commit and terminal deployment result are recorded
by the repository's CI/CD run for this change.
Recovery branch: `checkpoint/player-brand-before-restore-68021cc`.

## Sources and implementation

- Classic website palette: `b726368`, with warmer parchment, brown ink, green
  actions, brass accents and purple Dungeon colors. Text/action shades are
  slightly darkened where needed for contrast.
- Native reference: `../mobile-character-home-qa-2026-10-12/home-final-162.png`
  from the rebuilt app, used for colors only. The old retired app is not restored.
- Player web colors are isolated in `shared/player-brand.css`, loaded by all
  five player entry points. Admin retains `shared/quest-tokens.css` unchanged.
- Native colors stay in `mobile/src/auth/ui.tsx` and its shared style consumers.
  No Firebase, auth, ledger, routing or feature logic changed.

## Inspected current evidence

Browser: local server `http://127.0.0.1:4569`, explicit `?test=1` local fixtures.
These images are visual evidence, not a new production sync test.

| Capture | Route/state | Viewport |
| --- | --- | --- |
| `home-before.png` | Home before this pass, Tavern | 1280 wide, full-page 951 px |
| `home-after.png` | Home after, Tavern, no overlay | Same |
| `home-dark.png` | Home after, Dungeon | Same |
| `treasury-mobile.png` | Treasury, Tavern, top, no overlay | 390 × 844 |
| `character-after.png` | Character 2150, Tavern, top | 1280 × 720 |

Home hero and all four cards retain exactly the same bounding rectangles:
hero 1144 × 193.1953125 at (68, 105); cards 562 × 250 at x=68/650,
y=298.1953125/568.1953125. The fixture streak changes from 0 to 1 between
the Home captures as the existing daily-visit behavior runs.
Treasury has document width 390 at viewport width 390, with readable labels
and bottom navigation. Character cards and banner use the restored palette.
Admin computed tokens remain `--bg: #f4f3ec`, `--ink: #203c32`, and its
stylesheet list does not contain `player-brand.css`.

Native: the installed own development binary `com.purichwc.coinquestledger`,
iPhone 17 Pro / iOS 26.5, device `7FEE6572-2952-4E46-9649-532C62A2CA42`.
The existing Oct 12 binary loads the current JS from Metro port 8093 via Fast
Refresh; no native dependencies or APIs changed, so no new binary build.
All native captures are 1206 × 2622 pixels, signed in as the approved synthetic
QA account, with the existing character 2150 and existing Firebase QA records.

- `mobile-home-before.png` and `mobile-home-after.png`: matched Home at the
  top, same character and four module tiles. Current geometry is preserved.
- `mobile-expense-form.png`: Treasury → add expense, untouched empty form,
  existing selected QA category, keyboard closed. Warm inputs, brown borders,
  green selected state and primary action are legible.
- Exercised Home → Treasury → expense form → input focus → back to Treasury
  → Home. No financial record was submitted or modified in this pass.

## Checks and limits

- Targeted existing web Playwright checks: **11 passed, 1 intentional skip**
  (`themed chrome`, `responsive shells`, `home view opens`,
  `character profile aggregates`).
- Web syntax: **44 browser scripts and 15 modules passed**.
- Native `npm run typecheck` and `npm run lint`: **passed**.
- Release preflight: full `npm test` passed (55 unit tests, 83 browser tests,
  7 intentional browser skips, syntax and assets); native contracts **58 passed**.
- `git diff --check`: **passed**.
- **VERIFIED for this color-only scope**: inspected the listed images,
  confirmed current layout preservation, Admin isolation and native navigation.
- The initial visual pass did not repeat the full backend/release suite, a new
  Firebase synchronization run, Android run or every-screen interaction audit.
  Release checks follow `DEPLOYMENT_AND_ROLLBACK_RUNBOOK.md`; production is
  published only after both CI jobs pass, followed by the non-mutating smoke.
  This change does
  not add native dark mode or change app icons/splash assets.
