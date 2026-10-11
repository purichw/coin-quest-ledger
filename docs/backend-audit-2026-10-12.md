# Shared backend repair — 12 October 2026

Scope: functional correctness across Website, Expo native app, Admin APIs and
Firestore rules. This is a local working-tree change, not a deployment. The
pre-existing mobile rebuild and design changes were preserved. No production
records, passwords, accounts or security rules were changed during this audit.

Both clients retain the existing `pointy-personal-toolkit` Firebase project and
identity/collection contracts. The new automated backend checks use the separate
`demo-coin-quest` Auth/Firestore emulators and synthetic fixtures.

## Fixed and covered

| Area | Defect and repair |
| --- | --- |
| Module sync | Refresh could race a local edit. Pause writes while reading, retain the new draft, require reconciliation, and ignore obsolete requests. |
| Snapshot persistence | Deep merge could resurrect deleted nested keys. Replace the selected module field, preserving other modules; replace freshly read full board snapshots. Backup restore replaces all three module fields. |
| Signup and character | Web profile, username and ID writes were independent and raced the Auth watcher. Provision atomically, keep a pending recovery reveal, retry ID collisions, and link character/profile in one transaction. Do not manufacture missing identities or reset progression. |
| Invites | Web acceptance overwrote a stale board and updated invitation status separately. Accept and join atomically using current account/character and board data. Replies cannot rewrite the invite, replay a response, or accept expiry. Re-invites use new attempt IDs. |
| Recovery | Missing Auth recreated a new UID, orphaning modules/invites. Recreate under the original UID; validate ownership/hash, serialize resets with a bounded lease, preserve the old key on failure, reject blocked accounts, revoke sessions, and rotate the key only on completion. |
| API boundaries | Reject malformed/non-object/oversized JSON including pre-parsed platform bodies. Compare full SHA-256 hex only. Require verified allowlisted Admin email and check token revocation. |
| Recovery abuse | Replace per-process attempt counters with a Firestore transaction shared across instances. Store an IP/username digest, no raw IP. |
| Rules | Block owner reactivation/identity changes, extra linked characters, writes by blocked accounts, credential edits during reset, and old-token tombstone reclaim. Allow Admin tombstone listing while denying player enumeration. |
| Admin publish | Only changed boards are written, against their captured baseline in a transaction. Concurrent edits or destination ID collisions abort while retaining the draft; no revision is recorded for failure. |
| Admin lifecycle | Update both lifecycle fields on user, username and ID reservation atomically. Refuse changed ownership or an ongoing recovery. |
| Account deletion | Validate all identity pointers before Auth deletion, block new player writes, delete module data/nested invites, and read board cleanup data again transactionally. Auth-linked members become board-local guests with financial history intact; balances/obligations are unchanged. Legacy orphan cleanup stays separate. |
| Debt history | Recalculate later payments and daily interest after edit/delete/restore. Retain removed rows. Refuse incomplete or irreconcilable legacy history rather than silently changing money. |
| Money/date edges | Remaining satang stays outstanding, exact-share adjustments conserve satang, same-day timestamps do not reject today's payment, ISO dates remain local in western time zones, and retrying a final native payment is idempotent. |

## Verification

- Firestore + Auth emulator integration suite: **21 passed**. Includes real
  allow/deny rules, concurrent board updates, account recreation, recovery failure
  and retry, stale Admin drafts, lifecycle, deletion guards and financial history.
- Native contract tests: **58 passed**; TypeScript and ESLint passed.
- Web syntax and asset checks passed; **53 unit tests passed**. The full browser
  suite passed **83 tests**, with **7 intentional skips** (production Firebase
  mutations and opt-in/device-specific checks). Desktop, tablet and phone browser
  projects ran; these are not native-device checks.
- Root unit regressions include a refresh/edit race reproduced before fixing it,
  debt replay/interest allocation, malformed API bodies, strict Admin claims,
  local calendar dates and small monetary balances.
- Targeted browser journeys cover invitations, Debt Dragon, recovery reveal and
  rotation, Admin draft/publish and tombstones using local test fixtures.

Commands (Node 24.21.0 used locally):

```sh
npm run test:backend
POINTY_REAL_FIREBASE_E2E=0 \
PLAYWRIGHT_BROWSERS_PATH=/Users/point/toolbox/mobile/.artifacts/playwright npm test
cd mobile
npm run typecheck
npm run lint
node --test tests/*.test.mjs
```

The emulator runner keeps downloads/config/logs under
`mobile/.artifacts/backend-emulator`, uses ports 18088/19098, and requires Java 17
or newer for the pinned Firebase CLI 14 emulator. It refuses production execution.
Expected `PERMISSION_DENIED` logs are produced by deny tests.

## Limits and deployment requirements

**Follow-up:** the web/API and matching Rules release completed; the Mac was
unlocked and native post-release flows passed. See the
[release record](release-2026-10-12.md) and
[Simulator evidence](post-release-simulator-2026-10-12.md). The first two bullets
below describe the audit-time checkpoint; the migration limits still apply.

- **Native Simulator interaction is blocked:** CUA reports the Mac is locked.
  The installed own-app binary exists from the rebuild, but this turn does not
  establish tap/navigation/persistence results on Simulator. Unlock the Mac to
  finish that gate. Browser phone viewport tests are not native Simulator tests.
- **Nothing is deployed.** Release APIs, web/native clients and Firestore rules
  together after the remaining native gate; production behavior is unchanged.
- Board reads still allow signed-in users; writes allow active accounts. This is
  the documented legacy link-join policy. Per-board ACL enforcement needs a
  coordinated migration and join/admin-password contract; it is not claimed fixed.
- Legacy public username recovery hashes may remain in production. A separate
  authorized data migration is needed to remove those already stored values.
- Configure Firestore TTL on `accountRecoveryLimits.expiresAt` when deploying.
  Logical limits expire without TTL, but physical records otherwise remain.
- Auth and Firestore do not share a transaction. Recovery uses a five-minute
  lease and retryable old hash, not a claim of cross-service atomicity. Network
  failure after a successful response commit can still require recovery with the
  new key or an Admin reset.
- Histories with changed debt terms or missing reconciliation evidence are
  protected by an explicit error. They require an opening-balance/history repair;
  no guessed interest or silent destructive normalization is performed.
- Safari, Android, physical devices, visual polish, production integration and
  real Firebase account mutation tests are outside this local verification.
