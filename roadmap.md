# Coin Quest Ledger Roadmap

Last updated: 2026-06-19

## North Star

Coin Quest Ledger should feel like Claude Design's playful RPG finance suite while remaining reliable enough for real personal data: clear identities, recoverable boards, mobile-first ergonomics, safe admin operations, and no regressions in split/debt/treasury math.

## Current Baseline

Done recently:

- Party Ledger offline zip removed from Git; large Claude references stay outside the repo.
- Mock login gate added through `shared/profile-hub.*`.
- Sign out fixed so logout returns to the mock login gate.
- Claude Character Profile design ported to `/character/`.
- Character banner animation and chip spacing tuned, committed, pushed, and deployed.
- Latest Claude profile loop partially ported into the static app: Sign In/Sign Up tabs, local account registry, one-time Character Creation, profile drawer full-profile link, User ID display, My Boards, and Character Profile My Boards actions.
- Production domain verified at `https://coin-quest-ledger.vercel.app`.

Known constraints:

- Auth is still mock/local, not secure.
- Super Admin Phase 1 gate is local only.
- Firestore rules/auth are not yet the product security boundary.
- App pages require server hosting; `file://` preview is not supported.
- Claude Design references are fragmented across downloaded bundles and standalone HTML.

## Decision Log

- `CLAUDE_RECOVERY.md` is ignored/deprecated for now by current user instruction.
- Character Profile route remains `/character/?id=####`.
- The latest Claude handoff specifies a profile side panel full-profile entry; the live shared profile drawer now links to `/character/?id=####`.
- Current mock loop is one account = one active character. Demo User ID `3720` maps to Character ID `3720`.
- Character Profile currently keeps its own `cnav`/standalone profile layout; whether to add shared mobile shell is undecided.
- Phase 1 Admin and mock login are local/browser gates only, not real security.
- `pointy-personal-toolkit` remains the Firebase project id unless a planned infrastructure migration is explicitly chosen.

## Phase 0 - Keep The Canon Stable

Goal: make every future chat easy to resume without rediscovery.

- Keep `Memory.md`, `PLAYBOOK.md`, `architecture.md`, and `roadmap.md` current after meaningful changes.
- Keep `data-contracts.md` current when storage keys, Firestore fields, or derived profile shapes change.
- Keep `claude-design-index.md` current when new Claude reference files arrive.
- Keep Claude reference files outside Git.
- Keep `.zip` and large offline HTML artifacts ignored.
- Keep deploy notes tied to the actual production domain.
- Keep `sound.jsx` preserved in Party Ledger split references.

Exit criteria:

- A new agent can read the docs, run status/tests, and understand the current product without opening old recovery notes.

## Phase 1 - Character/Profile Integration

Goal: make User Profile, Side Panel profile, and Character Profile feel like one intentional identity flow.

Near-term work:

- Continue refining the explicit Character Profile entry point from the profile drawer/side panel.
- Preserve the current one-account-one-character mock mapping unless the user asks for multiple characters.
- Keep `/character/?id=####` as the shareable public route.
- Preserve privacy link behavior with `private=1`.
- Verify desktop/tablet/mobile after any profile drawer changes.

Open decisions:

- Future product decision: stay one character per user or add multiple characters per user after real auth exists.
- Should the Character Profile account card deep-link back to User Profile once real auth exists?

## Phase 2 - Mobile Design Parity

Goal: all core modules respect the Claude mobile model without duplicating shell code.

Work:

- Audit Home/Compare, Split, Debt, Treasury, Character, and Admin mobile behavior against supplied Claude/mobile references.
- Keep shared phone drawer/bottom tabs centralized in `shared/mobile-shell.*`.
- Decide whether Character Profile should adopt shared mobile shell or remain a standalone profile page with its own nav.
- Check text fitting, no horizontal overflow, and no overlapping controls at `390px`, `360px`, tablet, and desktop.

Testing:

- Targeted Playwright checks for affected flows.
- Full `npm test` when shared shell or routing changes.

## Phase 3 - Real Auth And Security

Goal: replace mock/local gates with real access control.

Work:

- Choose Firebase Auth strategy and account model.
- Map User ID to auth user safely.
- Add Super Admin allowlist.
- Add Board Admin permissions scoped to owned boards.
- Write Firestore Security Rules for `trips`, `characters`, and `adminRevisions`.
- Add rollback/export plan before rule enforcement.

Important:

- Do not present Phase 1 local gates as secure.
- Do not rename `pointy-personal-toolkit` just for aesthetics.

Exit criteria:

- Unauthorized users cannot read/write private board/admin data from the client or Firestore API.

## Phase 4 - Admin Portal Maturity

Goal: make admin operations trustworthy and recoverable.

Work:

- Continue aligning `/admin/` with Claude Admin Portal structure when the user asks for Admin work.
- Keep draft/restore/publish semantics clear.
- Improve board/user/admin relationship views.
- Add safer password reset and board ownership workflows after real auth exists.
- Add audit trail details for meaningful admin actions.

Testing:

- Admin changes default to Production Patch: full `npm test`.

## Phase 5 - Data Model And Character Progress

Goal: make cross-module RPG progress coherent.

Work:

- Keep class metadata and portrait assets centralized through `shared/pointy-logic.js` and `assets/rpg-portraits/`.
- Define how Debt Dragon and Treasury progress should write back into character history.
- Decide whether Compare Prices contributes to character achievements or remains a pure utility.
- Keep migrations optional/backward-compatible.

Risks:

- Cross-module writes can corrupt old local data if migration is too aggressive.
- Character aggregation can become slow if it scans too many public trip docs without indexing/security design.

## Phase 6 - Polish, Backup, And Recovery

Goal: improve resilience without changing the static-app spirit.

Work:

- Harden backup/restore in `profile-hub`.
- Add clearer local data export/import for users.
- Keep Cloudinary asset references verified.
- Improve production smoke checks after deploy.
- Consider small UX affordances for stale/offline Firebase states.

## Always-On Quality Gates

- Tiny visual tweak: `npm run test:syntax` plus a focused visual check.
- User asks commit/deploy: full `npm test`, commit, push, deploy, alias, live curl.
- Shared logic/data/admin/routing: full `npm test`.
- Responsive/mobile shell: check desktop, tablet, mobile.
- Claude Design port: inspect source, match DOM/style semantics, preserve live behavior.
