# Coin Quest Ledger Playbook

## Start Of Work

- Read `Memory.md` first in a new chat or after a long context reset.
- Read `architecture.md` when the request touches system shape, routing, shared modules, persistence, or deployment.
- Read `data-contracts.md` when the request touches Firestore, localStorage/sessionStorage, character IDs, admin ownership, imports/exports, or migrations.
- Read `claude-design-index.md` when the request involves Claude Design references, visual parity, mobile handoff files, or finding the right downloaded source.
- Read `leveling-canon.md` when the request touches XP rewards, Reputation rewards, level thresholds, title milestones, Profile Reputation, Treasury scoring, or Admin level displays.
- Read `roadmap.md` when the request asks what to build next, how to phase work, or whether Codex vs Claude Design should own a step.
- Read `mobile/IOS_BUILD_NOTES.md` before native iOS build/signing/install work.
- Check `git status --short --branch` before editing.
- If the user asks for a small visual tweak, default to Fast UI Patch unless they explicitly ask for commit/deploy.
- If the user asks to commit or deploy, escalate to Production Patch.
- For profile/auth refactors, keep slices independently revertible. Commit each completed boundary separately after targeted tests, even when the user gives one broad refactor instruction.
- Keep `Memory.md`, `architecture.md`, `roadmap.md`, and any touched contract/reference docs updated before intentionally moving work to a new chat.
- Current user instruction: ignore `CLAUDE_RECOVERY.md` unless explicitly re-enabled.
- Level math must start in `shared/pointy-logic.js`; feature files should call `PointyLogic.levelFromXp()` or `PointyLogic.levelFromReputation()` instead of adding local formulas.

## Change Modes

Use the lightest mode that fits the request. Escalate only when the change touches shared logic, data migration, cloud sync, deployment, or the user explicitly asks.

### Fast UI Patch

Use for small visual copy/CSS/layout tweaks, especially when the user is iterating on design.

- Read only the directly relevant source and reference design.
- Patch the smallest possible surface.
- Run `npm run test:syntax`.
- Do a quick browser or Playwright spot-check when visual placement matters.
- Do not run the full e2e suite, commit, push, or deploy unless requested.

Good prompt:

```text
แก้เร็ว ไม่ต้อง test/deploy แค่ patch UI ก่อน
```

### Standard Safe Patch

Use for normal feature or UX changes that affect a user flow.

- Read the local implementation and any handoff/source-of-truth files.
- Preserve the newest user requirements over older Claude/prototype behavior.
- Run `npm run test:syntax` and a targeted Playwright/e2e check for the affected flow.
- If layout may change across breakpoints, include tablet/mobile checks; the e2e suite has `chromium`, `tablet`, and `mobile` projects.
- Commit/deploy only when requested.

Good prompt:

```text
แก้แบบปลอด regression แต่ยังไม่ deploy
```

### Production Patch

Use when the user asks to commit, push, or deploy, or when the change affects core calculation, persistence, admin, imports/exports, assets, or routing.

- Run `npm test`.
- Commit with a focused message.
- Push to `origin main` when requested or when the user asks for GitHub.
- Deploy with `vercel --prod --yes` when requested.
- Alias the canonical domain after deploy when needed.
- Curl the changed production route for a marker that proves the deployed content is current.
- Confirm `git status --short --branch` is clean except unrelated user files.
- Report commit hash, test result, deployment URL, and push status.

Good prompt:

```text
ทำ production-safe + commit + deploy
```

## Release Checklist

When the user asks to commit, push, or deploy:

1. Run `npm test`.
2. Check `git status --short --branch`.
3. Stage only focused files.
4. Commit with a focused message.
5. Push to `origin main`.
6. Deploy with `vercel --prod --yes`.
7. Alias `coin-quest-ledger.vercel.app` to the new deployment when needed.
8. Curl the changed live route for an expected marker.
9. Re-check `git status --short --branch`.
10. Report commit hash, tests, push, deploy URL, alias status, and any remaining dirty files.

## Claude Handoff Rule

When implementing from Claude Design:

- Treat Claude HTML/source as the visual and interaction Holy Grail for the requested surface.
- Aim for almost pixel-perfect output. Study the HTML/source thoroughly enough to understand its DOM/component structure, spacing model, class semantics, interactions, animations, assets, and sounds before patching.
- Match the reference structure, not only the reference colors. Do not paste Claude CSS onto incompatible legacy markup and call it done.
- If legacy implementation blocks a close match, rework the affected surface completely. A larger structural rework is expected when needed; avoid broad compatibility hacks that produce overflow, broken containers, or mismatched layouts.
- Treat the newest user requirements as higher priority than Claude if they conflict.
- Port only the relevant UI/asset/interaction surface for the requested area.
- Keep existing app functionality, data shape, Firebase sync, i18n, and tests intact.
- If Claude includes assets or sounds, check whether they already exist in the supplied HTML/project before recreating them.
- For Party Ledger specifically, prefer smaller split reference zips when the user supplies them, then fall back to a full offline canon only when exact all-in-one behavior must be verified. Do not assume old Downloads paths still exist.
- Do not drop `sound.jsx`; the Party Ledger offline bundle stores SFX as WebAudio code there, not as separate `audio/*` files.
- If the user says "TO A TEE", run a micro-cosmetic audit, not just a screen-level glance. Compare offline Claude CSS/DOM values for padding, radius, font size/weight, border style, button dimensions, icon alignment, and mobile overrides. Recent Party Ledger regressions to guard: centered 22px quest-row `x`, compact dashed `Attach receipt`, compact dashed `Whole party`, and split segment sizing on iPhone SE / iPhone / Pro Max.
- Exact keyword expansion: "to a tee" means `CLAUDE TO A TEE AUDIT. Implement from the offline Claude HTML exactly at component level, mobile included, and verify before commit/deploy.`

## Architecture And Roadmap

- `architecture.md` is the current technical map: app surfaces, shared modules, identity model, persistence, design sources, test/deploy flow, and hard invariants.
- `data-contracts.md` documents the practical persisted shapes for Firestore, local/session storage, and derived Character Profile data.
- `claude-design-index.md` maps downloaded Claude references to live surfaces and records what each reference does or does not specify.
- `roadmap.md` is the phased product/engineering plan: profile integration, mobile parity, real auth/security, admin maturity, character progress, and recovery polish.
- Keep these docs current when a change alters product direction, system shape, deployment assumptions, data contracts, reference sources, or major cross-module behavior.
- When doing a handoff-only docs pass, update the latest production snapshot, recent commits, stale "mock/future auth" wording, and next-slice guidance without changing implementation files.

## Claude Recovery References

Use these when rebuilding context in a new chat or a new Claude Project:

- Do not use `CLAUDE_RECOVERY.md` by default. It is currently ignored/deprecated by user instruction.
- Current verified Downloads references on 2026-06-21: `/Users/point/Downloads/CLAUDE.md`, `/Users/point/Downloads/HANDOFF.md`, `/Users/point/Downloads/MOBILE-EXPORTS.md`, `/Users/point/Downloads/Coin Quest Ledger (iOS App).html`, and `/Users/point/Downloads/Coin Quest Ledger (Android App).html`.
- Historical recovery bundles, standalone Character/Profile HTML, Admin HTML, and split zips from earlier sessions are not guaranteed to still exist. Check with `ls`/`find` before depending on any older path.
- Do not commit large offline zip/HTML copies.

## Expense Splitter Notes

- `trip/index.html` is the live Expense Splitter app shell and styles.
- `trip/app.js` owns Expense Splitter behavior, state, rendering, Firebase/test persistence, event delegation, imports/exports, and overlays.
- `shared/mobile-shell.css` and `shared/mobile-shell.js` provide the Claude native phone shell across Home/Compare, Split, Debt Dragon, and Treasury. They should stay hidden above `600px`; do not duplicate this shell per page unless a page truly needs custom behavior.
- `lang.js` is shared across the toolbox; every new UI string needs Thai and English keys.
- `shared/pointy-logic.js` owns shared calculation and normalization logic.
- `tests/e2e/coin-quest-ledger.spec.mjs` covers critical Expense Splitter, Debt Dragon, Character Profile, Admin Portal, and price comparison flows.
- `trip/index.legacy.html` and `index.legacy.html` are legacy/inactive snapshots and should not be modified unless explicitly requested.
- Keep refactors incremental. The shell and expense entry controls use delegated events, but some dynamic hero/admin/overlay renderers still use inline handlers; migrate those only in focused slices with full `npm test`.
- Signed-in "other hero" add flow is Character-ID-only for real characters. It must resolve an existing character, never generate one from arbitrary input, never ask for "Other hero's name", and never block duplicate visible names. Use "Add Guest" when a board-only participant is needed; guests get name + hero selection only and no real Character ID.
- Settlement logic must preserve pairwise per-expense payer obligations. Do not simplify it back to global net creditor/debtor routing; that breaks cases where one participant owes different people from different expenses.

## Admin Portal Notes

- `/admin/` is the Phase 1 Super Admin Portal. Changes here affect admin/persistence behavior, so use Production Patch verification (`npm test`) even if the visible diff looks small.
- Admin Portal design must stay aligned to the supplied Claude Admin Portal HTML. Keep the Claude component vocabulary and layout primitives (`page-head`, `card`, `stat`, `tbl`, `detail-grid`, `profile-card`, `log-list`, modal patterns) rather than restoring legacy `panel`/ad hoc table markup.
- Admin Portal should preserve the current one-user-one-active-character canon when any older Admin copy says users can have many characters.
- Production `/admin/` uses Firebase Google Auth allowlisted to `purich.wc@gmail.com`. The local browser gate exists only under `/admin/?test=1` for automated regression; do not describe it as real access control.
- Permanent user delete is backend-only and requires Vercel Firebase Admin env vars. The Admin UI must surface `/api/admin-delete-status` readiness instead of letting destructive actions fail silently.
- Save is local draft storage, Restore discards the draft back to the latest published snapshot, and Publish writes board/admin/user changes plus a revision log.
- Board Admin IDs may intentionally repeat across boards because one admin can own multiple boards. Keep duplicate validation focused on board URLs unless the user asks otherwise.

## Character Profile Notes

- `/character/?id=1234` aggregates the `characters` record with every readable trip containing that Character ID.
- Profile aggregation belongs in `shared/pointy-logic.js`; keep the page renderer focused on loading and presentation.
- Preserve the four-digit public Character ID links from hero cards and Admin Portal Users.
- `private=1` only hides monetary values in the rendered profile. It is not authorization or Firestore security.
- The shared profile drawer now has the canonical full-profile entry for the active account character. On phone width, open it through the shared hamburger drawer's Profile item.
- Current auth loop is one account = one active character. Production Sign Up uses Firebase Auth username/password through an internal `@coinquest.local` email and writes `users/{uid}`, `usernames/{username}`, and `characters/{id}`; explicit `?test=1` regression mode keeps local fixtures through `pointy_accounts_v1` / `pointy_auth_v1`. Production must never fall back to local test accounts. Profile helper boundaries now live in focused `shared/profile-*.js` modules; preserve script load order when adding or reverting slices.
- Signed-in progress must be account-scoped, not browser-scoped. Use `shared/account-scope.js` for module/profile cache keys and do not let stale unsuffixed localStorage module data count toward a real account.
- Recovery without email is Phase 1 credential rotation: player recovery code and Super Admin temp-password reset create a new Firebase Auth credential, then move the username/User ID/Character pointer to the new `uid`. Do not describe this as final security; future hardening needs server-side Admin SDK or locked-down rules.
- The profile side panel intentionally shows the current Recovery ID and offers Regenerate for this small, casual app. Regenerate must update the recovery hash immediately so the previous code is invalid.
- Keep `firestore.rules` in sync with identity changes and deploy it before testing production auth flows.
- Character Profile, character persistence, or `admin.characterId` changes require full `npm test` and responsive verification.

## Responsive Shell Notes

- Claude mobile source expects a hamburger drawer and fixed bottom tab bar at phone width. Keep that behavior centralized in `shared/mobile-shell.*`.
- Desktop and tablet should retain their current module topbars; verify the mobile shell is `display:none` there.
- Compare mobile intentionally keeps the visible `Home` back button when active, even though the Claude prototype hides `.tb-back`, because the live app and tests depend on that return path.

## Native Player App Notes

- `mobile/` is the Expo / React Native player app. It is not a WebView wrapper and does not include Admin native.
- Keep native code modular: `App.tsx` orchestrates; `mobile/src/data.ts`, `gameLogic.ts`, `ui.tsx`, `theme.ts`, `copy.ts`, screen files, and `sheets.tsx` should remain focused so future fixes are point edits.
- Do not build/install a real iPhone app until design and backend gates are both checked.
- Design gate: compare the changed native screens against the latest Claude iOS/Android exports and fix obvious mismatches in platform chrome, spacing, card hierarchy, sheets, tabs/FAB, typography scale, and asset usage before device build.
- Backend gate: verify the screen uses real Firebase Auth/Firestore data. Current native contracts are `users/{uid}`, `usernames/{username}`, `characters/{id}`, `trips/{id}`, and `playerModules/{uid}`.
- Never fill Debt/Treasury/Compare with static Claude/sample financial data. Empty states are acceptable only when they are tied to real create/log actions.
- For iOS build/install commands, signing caveats, ExpoModulesJSI patching, and first-install lessons learned, use `mobile/IOS_BUILD_NOTES.md`.

## Preview Notes

- Do not open live app pages directly with `file://`. They use absolute `/shared/...` and route script paths, so scripts/assets fail outside a server.
- Use `npm run serve` and open `http://127.0.0.1:4569/...`, or use the production URL.
- For Vercel deploys, alias the canonical domain after deploy when needed: `vercel alias set <deployment-url> coin-quest-ledger.vercel.app`.
