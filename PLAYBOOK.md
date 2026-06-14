# Pointy Super App Playbook

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

- Treat Claude HTML/source as the visual and interaction reference.
- Treat the newest user requirements as higher priority than Claude if they conflict.
- Port only the relevant UI/asset/interaction surface for the requested area.
- Keep existing app functionality, data shape, Firebase sync, i18n, and tests intact.
- If Claude includes assets or sounds, check whether they already exist in the supplied HTML/project before recreating them.

## Expense Splitter Notes

- `trip/index.html` is the live Expense Splitter app.
- `lang.js` is shared across the toolbox; every new UI string needs Thai and English keys.
- `shared/pointy-logic.js` owns shared calculation and normalization logic.
- `tests/e2e/pointy-super-app.spec.mjs` covers critical Expense Splitter and price comparison flows.
- `trip/index.legacy.html` and `index.legacy.html` are legacy/inactive snapshots and should not be modified unless explicitly requested.
