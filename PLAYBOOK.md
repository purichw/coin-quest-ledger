# Coin Quest Ledger Playbook

## Start Of Work

- Read `Memory.md` first in a new chat or after a long context reset.
- Check `git status --short --branch` before editing.
- If the user asks for a small visual tweak, default to Fast UI Patch unless they explicitly ask for commit/deploy.
- If the user asks to commit or deploy, escalate to Production Patch.
- Keep `Memory.md` updated before intentionally moving work to a new chat.

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
- Report commit hash, test result, deployment URL, and push status.

Good prompt:

```text
ทำ production-safe + commit + deploy
```

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
- For Party Ledger specifically, prefer the smaller split reference zips in `/Users/point/Downloads/Coin Quest Ledger - Claude Recovery Bundle/` for initial study, then fall back to the full offline canon when exact all-in-one behavior must be verified.
- Do not drop `sound.jsx`; the Party Ledger offline bundle stores SFX as WebAudio code there, not as separate `audio/*` files.

## Claude Recovery References

Use these when rebuilding context in a new chat or a new Claude Project:

- Repo recovery doc: `CLAUDE_RECOVERY.md`
- Party Ledger canon lives outside Git in `/Users/point/Downloads/Coin Quest Ledger - Claude Recovery Bundle/`; do not commit large offline zip copies.
- Upload bundle folder: `/Users/point/Downloads/Coin Quest Ledger - Claude Recovery Bundle/`
- Small HomeView package: `/Users/point/Downloads/Coin Quest Ledger - Claude Recovery Bundle/Party Ledger HomeView Reference.zip`
- Small app/source package: `/Users/point/Downloads/Coin Quest Ledger - Claude Recovery Bundle/Party Ledger Internals Source.zip`
- Resource package: `/Users/point/Downloads/Coin Quest Ledger - Claude Recovery Bundle/Party Ledger Resources.zip`
- Full split package: `/Users/point/Downloads/Coin Quest Ledger - Claude Recovery Bundle/Party Ledger Full Split Reference.zip`

## Expense Splitter Notes

- `trip/index.html` is the live Expense Splitter app shell and styles.
- `trip/app.js` owns Expense Splitter behavior, state, rendering, Firebase/test persistence, event delegation, imports/exports, and overlays.
- `shared/mobile-shell.css` and `shared/mobile-shell.js` provide the Claude native phone shell across Home/Compare, Split, Debt Dragon, and Treasury. They should stay hidden above `600px`; do not duplicate this shell per page unless a page truly needs custom behavior.
- `lang.js` is shared across the toolbox; every new UI string needs Thai and English keys.
- `shared/pointy-logic.js` owns shared calculation and normalization logic.
- `tests/e2e/coin-quest-ledger.spec.mjs` covers critical Expense Splitter, Debt Dragon, Character Profile, Admin Portal, and price comparison flows.
- `trip/index.legacy.html` and `index.legacy.html` are legacy/inactive snapshots and should not be modified unless explicitly requested.
- Keep refactors incremental. The shell and expense entry controls use delegated events, but some dynamic hero/admin/overlay renderers still use inline handlers; migrate those only in focused slices with full `npm test`.

## Admin Portal Notes

- `/admin/` is the Phase 1 Super Admin Portal. Changes here affect admin/persistence behavior, so use Production Patch verification (`npm test`) even if the visible diff looks small.
- Admin Portal design must stay aligned to the supplied Claude Admin Portal HTML. Keep the Claude component vocabulary and layout primitives (`page-head`, `card`, `stat`, `tbl`, `detail-grid`, `profile-card`, `log-list`, modal patterns) rather than restoring legacy `panel`/ad hoc table markup.
- Phase 1 uses a local browser gate only. Do not describe it as real access control; true private admin access needs Firebase Auth and Firestore Security Rules.
- Save is local draft storage, Restore discards the draft back to the latest published snapshot, and Publish writes board/admin/user changes plus a revision log.
- Board Admin IDs may intentionally repeat across boards because one admin can own multiple boards. Keep duplicate validation focused on board URLs unless the user asks otherwise.

## Character Profile Notes

- `/character/?id=1234` aggregates the `characters` record with every readable trip containing that Character ID.
- Profile aggregation belongs in `shared/pointy-logic.js`; keep the page renderer focused on loading and presentation.
- Preserve the four-digit public Character ID links from hero cards and Admin Portal Users.
- `private=1` only hides monetary values in the rendered profile. It is not authorization or Firestore security.
- Character Profile, character persistence, or `admin.characterId` changes require full `npm test` and responsive verification.

## Responsive Shell Notes

- Claude mobile source expects a hamburger drawer and fixed bottom tab bar at phone width. Keep that behavior centralized in `shared/mobile-shell.*`.
- Desktop and tablet should retain their current module topbars; verify the mobile shell is `display:none` there.
- Compare mobile intentionally keeps the visible `Home` back button when active, even though the Claude prototype hides `.tb-back`, because the live app and tests depend on that return path.
