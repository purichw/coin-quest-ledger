# Testing Matrix

Last updated: 2026-07-07

## Purpose

Use this to choose the minimum responsible verification for a change. It keeps
test expectations out of scattered handoff notes.

## Commands

```bash
npm run test:syntax
npm run test:assets
npm run test:unit
npm run test:e2e
npm test
npm run serve
```

`npm test` runs syntax, asset, unit, and Playwright e2e tests.

Playwright runs desktop Chromium, tablet `820 x 1180`, and mobile Pixel 5 by
default. For Claude-to-a-tee or mobile-web work, add browser screenshots with
the relevant iPhone widths from `$mobile-web-qa` / `CLAUDE_TO_A_TEE_QA.md`.

## Change-To-Test Map

| Change | Minimum verification |
| --- | --- |
| Docs only | `git diff --check` |
| Small copy/static HTML edit | `npm run test:syntax` |
| CSS-only visual tweak | `npm run test:syntax` plus browser spot-check of affected route |
| Claude-to-a-tee visual work | `CLAUDE_TO_A_TEE_QA.md`, browser reference inspection, `vercel:agent-browser` screenshots, relevant syntax/e2e |
| Shared mobile shell/profile topbar | targeted browser checks on phone/tablet/desktop plus relevant e2e |
| Party Ledger UI | Split e2e around the touched flow |
| Settlement/split math | `npm run test:unit`; full `npm test` before deploy |
| Invite/guest/reminders | `npm run test:syntax`, `npm run test:unit`, targeted invite Playwright test |
| Character/Profile aggregation | `npm run test:unit`, Character Profile e2e |
| Auth/signup/recovery | targeted profile e2e, browser sanity, Firestore rules awareness |
| Admin Portal | Admin e2e group; usually full `npm test` |
| Admin delete backend | `tests/unit/admin-delete-user.test.mjs`; real Firebase e2e only with env |
| Firestore rules | affected auth/admin/invite/manual live checks after explicit rules deploy |
| Asset/class/skin registry | `npm run test:assets`, render affected picker/profile |
| Debt Dragon math | Debt unit tests and Debt e2e |
| Treasury web | Home/Treasury e2e |
| Native TypeScript | from `mobile/`: `npm run typecheck` |
| Native export | `npx expo export --platform ios --output-dir /tmp/coinquest-mobile-export` |
| Commit/push/deploy | full `npm test` unless docs-only or user explicitly accepts lighter coverage |

## Useful Targeted Tests

```bash
node --test tests/unit/pointy-logic.test.mjs
node --test tests/unit/admin-delete-user.test.mjs
npx playwright test tests/e2e/coin-quest-ledger.spec.mjs --grep "pins the signed-in account hero and invites others by Character ID"
npx playwright test tests/e2e/coin-quest-ledger.spec.mjs --grep "super admin"
npx playwright test tests/e2e/coin-quest-ledger.spec.mjs --grep "character profile"
npx playwright test tests/e2e/coin-quest-ledger.spec.mjs --grep "Debt Dragon"
```

## Browser Verification

Use browser verification when:

- visual fidelity matters;
- the change touches responsive layout, modals, overlays, keyboard-sensitive
  forms, scrolling, safe areas, sticky/fixed UI, or mobile shell;
- a dev server is running;
- the user asks to verify, deploy, or match Claude Design.

Use:

- `browser:control-in-app-browser` for offline Claude/reference inspection;
- `vercel:agent-browser` for implementation interaction/screenshots;
- WebKit/real Safari when making Safari-specific claims.

## Real Firebase E2E

The real account lifecycle Playwright test is skipped unless the environment is
explicitly configured:

```bash
POINTY_REAL_FIREBASE_E2E=1 FIREBASE_SERVICE_ACCOUNT_JSON='<json>' npm run test:e2e
```

Use this only when intentionally testing live Firebase account lifecycle. It can
create and delete real test accounts.

## Reporting

For final answers and release notes, report:

- exact commands run;
- pass/fail result;
- browser/device coverage;
- skipped checks and why;
- any residual risk.
