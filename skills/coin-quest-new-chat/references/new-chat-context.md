# Coin Quest Ledger new-chat context

Resolve repo-relative paths against the current task's selected checkout.
This reference routes to living docs; it is not a live release status report.

## Project and first reads

- Primary checkout: `/Users/point/toolbox`.
- GitHub: `purichw/coin-quest-ledger`; verify current remote/upstream before release.
- Web: <https://coin-quest-ledger.vercel.app> — static HTML/CSS/JS plus Vercel APIs.
- Native: `mobile/`, Expo Router and React Native; versions come from its
  `package.json`, lockfile and `.nvmrc`, not this reference.
- Shared Firebase project: `pointy-personal-toolkit`. Its legacy internal name
  is intentional; do not rename/migrate it for branding.
- Product: RPG finance tools — Party Ledger, Debt Dragon, Treasury, Price Arena,
  with shared account/character/progression and a separate web Admin Portal.

Start with status, `Memory.md`'s current checkpoint, `PLAYBOOK.md` start guidance,
and the task index in `PROJECT_STRUCTURE_GUIDE.md`. Use `architecture.md` and
`SITE_MAP_AND_INTERACTIONS.md` for unfamiliar cross-module work. Read the latest
release/QA links only when the task needs that evidence. An old green run or
screenshot is not proof of current production/device health.

## Task map

| Task | Read next | Source owners / skills |
| --- | --- | --- |
| Web UI, colors or layout | `PLAYER_DESIGN_SYSTEM.md`, `Memory.md`; latest supplied reference and module sibling | `shared/player-layout.{css,js}`, `shared/navigation.css`, `shared/mobile-shell.js`, route design CSS; Admin/native keep their own shells; `$ui-ux-expert`, `$snapshot` |
| Native setup or UI | `mobile/AGENTS.md`, `mobile/README.md`, `mobile/IOS_BUILD_NOTES.md`, `mobile/DESIGN_DIRECTION.md`, `NATIVE_WEB_PARITY.md` | `mobile/src/app/`, `src/auth/`, `src/character/`, `src/player/`; `$coin-quest-native-parity`, `$ios-app-development` |
| Ledger, split, guests, invites | `data-contracts.md`, `INVITES_AND_GUESTS.md`, `leveling-canon.md` when progression is touched | `shared/pointy-logic.js`, `shared/board-invites.js`, `trip/app.js`, `mobile/src/ledger/`; `$coin-quest-ledger-logic` |
| Debt, Treasury, Compare, sync or backup | `data-contracts.md`, `NATIVE_WEB_PARITY.md`, relevant sections of `docs/backend-audit-2026-10-12.md` | `shared/module-cloud.js`, `shared/account-scope.js`, web module apps, `mobile/src/modules/`, `src/domain/canon.ts` |
| Auth, account or recovery | `ACCOUNT_MANAGEMENT_IMPLEMENTATION.md`, `SECURITY_AND_FIREBASE_RULES.md` | `shared/profile-*.js`, `mobile/src/auth/`, `api/account-recovery-core.js`, recovery/reset endpoints; `$firebase-account-management`, `$account-recovery-key` |
| Admin or lifecycle | `ADMIN_PORTAL_IMPLEMENTATION.md`, `SECURITY_AND_FIREBASE_RULES.md` | `admin/`, `api/admin-delete-user.js`, `api/admin-reset-user.js`; `$coin-quest-admin-ops` |
| Rules/access or migrations | `SECURITY_AND_FIREBASE_RULES.md`, `data-contracts.md`, deploy runbook | `firestore.rules`, `api/`, `tests/backend/`; `$firebase-security-rules` |
| Tests/release | `TESTING_MATRIX.md`, `DEPLOYMENT_AND_ROLLBACK_RUNBOOK.md`, `PROD_SMOKE_HARNESS.md` | `.github/workflows/test.yml`, `scripts/prod-smoke.mjs`; `$release-gate`, `$github-actions-repair` only when diagnosis is needed |
| Docs, context or next work | `Memory.md`, `roadmap.md`, relevant domain doc | `$docs-cartographer`, `$skill-creator` for skill edits |
| Restore/rollback | `docs/rollback-parking-lot.md`, current diff and recovery checkpoint | `$rollback-guardrail`; avoid reverting the combined rebuild/backend commit |

Use other specialists only for an actual task need. The map is not a requirement
to load every skill or document for every request.

## Contracts and evidence boundaries

- One Firebase account has one active character. Public four-digit identity
  pointers differ from Firebase UID. Recovery preserves UID and linked data;
  missing Auth recreation uses the existing UID. No passwords, recovery codes,
  credentials or session tokens belong in starter prompts/docs/skills.
- `users/{uid}`, `usernames/{username}`, `userIds/{id}`, `characters/{id}`,
  `trips/{id}`, nested board invitations and `playerModules/{uid}` are shared.
  Use canonical calculations from `shared/pointy-logic.js`; native imports them.
- Settlement is per-expense payer obligation with reciprocal pair netting.
  Character-ID adds invite the existing account; guests stay board-local.
  XP and Profile Reputation are separate tracks.
- Web finance data uses account-scoped local drafts plus the deployed cloud
  bridge. Preserve explicit conflict choices/backups; native replaces the
  selected module snapshot without resurrecting removed nested records.
  Cross-device refresh is explicit, not a realtime/offline-queue guarantee.
- Player colors are isolated from Admin. Fonts remain Mitr (display), IBM Plex
  Sans Thai (body) and Chakra Petch (stats/brand). Existing reference archives
  govern only tasks that explicitly request them; `archive/CLAUDE_RECOVERY.md`
  stays deprecated unless the owner re-enables it.
- Native build ownership and Device Hub/Simulator instructions live in
  `mobile/IOS_BUILD_NOTES.md`. Reuse a healthy installed binary/Metro when
  compatible; rebuild for native dependency/config changes. Use the currently
  available device, not a copied UUID. No global Xcode/cache cleanup by default.
- `docs/mobile-completion-worklist.md` indexes historical per-flow evidence;
  `docs/post-release-simulator-2026-10-12.md` covers later native/live-web checks.
  Browser `?test=1`, Firebase emulators, real Firebase and own-binary Simulator
  are distinct evidence sources. Current docs list remaining platform/flow gaps.
- Board ACL migration, old public recovery hashes and optional TTL cleanup
  are known separate work. Do not interpret earlier broad bug-fix requests as
  authorization to migrate live data, enable billing or alter credentials now.

## Commands: select only what this task needs

Use Node from `mobile/.nvmrc`; install dependencies only when setup requires it.
Reuse healthy local services. From the selected repo root:

```bash
git status --short --branch
npm run serve                         # local web, port 4569
npm run test:syntax
npm run test:unit
npm run test:e2e -- --grep '<affected flow>'
npm run test:backend                  # isolated demo-coin-quest emulators
```

From `mobile/`:

```bash
npm run typecheck
npm run lint
node --test tests/*.test.mjs
npm run start:simulator               # Metro, localhost 8093, two workers
npm run build:simulator -- <available-simulator-UUID>
```

For local Playwright, use the existing browser installation; this machine's
project cache is `mobile/.artifacts/playwright`. Set `PLAYWRIGHT_BROWSERS_PATH`
to its absolute path when needed. See the runbook before release: full `npm test`,
native checks, relevant backend checks, then the authorized single CI deploy and
`npm run smoke:prod`. No full suites or production probes are needed merely
to produce a new-chat prompt or edit docs.

## Copy-ready starter prompt

Replace the checkout path when a different worktree is explicitly selected.

```text
ทำงานต่อกับ Coin Quest Ledger ที่ /Users/point/toolbox

ใช้ $coin-quest-new-chat โดยอ่าน SKILL.md ปัจจุบันจาก
/Users/point/.codex/skills/coin-quest-new-chat/SKILL.md
ตรวจ git status แล้วอ่าน Memory.md, PLAYBOOK.md และ PROJECT_STRUCTURE_GUIDE.md
จาก checkout นี้ จากนั้นเลือกเอกสาร/ไฟล์เจ้าของงานตาม references/new-chat-context.md

ใช้เอกสารและ source ปัจจุบัน ไม่อาศัยความจำจากแชตเก่า อยู่ในแชตนี้และ checkout นี้
เว็บกับ Mobile ใช้ Firebase เดิมร่วมกัน ต้องรักษา identity, storage, sync และสูตรคำนวณ
สี/CI ฝั่งผู้เล่นคืนแบบเดิมแล้ว แต่คง layout และฟีเจอร์ปัจจุบัน; Admin คง redesign
งาน Mobile ต้องตรวจ flow ที่แก้บน Simulator จริงด้วย binary ของแอป
แยกสถานะ source, CI, production และ native distribution ให้ชัด
อย่า commit/push/deploy, rollback, migrate หรือแก้ข้อมูล production ถ้ายังไม่ได้สั่ง
เลือกการตรวจตามความเสี่ยง งานเอกสารไม่ต้อง build หรือรัน QA ทั้งระบบ

อ่านแล้วสรุปสถานะกับข้อจำกัดสั้น ๆ หากมีงานระบุต่อท้ายให้ทำต่อได้เลย
หากยังไม่มีงานให้รอคำสั่งถัดไป
```
