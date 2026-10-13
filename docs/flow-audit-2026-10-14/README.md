# Website and Admin flow audit — 2026-10-14

Scope: current website on Desktop, Tablet and Mobile, plus the signed-in
production Admin session. No native app work, credential rotation, permanent
production deletion or deployment was performed. Existing unrelated work was
preserved.

## Findings and corrections

| Finding | Correction / evidence |
| --- | --- |
| **Archive board called permanent delete** | Archive/Reopen now writes archive state; tests publish, reload, reopen and compare all expenses, participants, IDs and unknown fields. |
| Search lost focus after the first character | Confirmed in production with `TEST` becoming `T`. Search now keeps the original input mounted while updating results; continuous typing verified in the local Chrome UI. |
| Export closed without downloading anything | Real scoped JSON download; tests parse it, verify satang values and ensure credential/owner secrets are omitted. |
| Prototype actions falsely claimed success/audit logging | Removed impersonate, merge, invite-admin and add-account stubs, unused browser auth helpers and their CSS. Current Support Tools offer only implemented actions. |
| Board-local character edits could contradict account identity and orphan ledger names | Removed arbitrary ID/character overrides and fake ID minting. Profiles remain viewable; membership routes through the current Party Ledger invite/Guest flow. No financial records were migrated. |
| Historical Restore / View diff controls had no valid historical snapshot behavior | Removed those controls; actual revision summaries remain expandable. Restore now fresh-reads published data. |
| Fake activity charts and unsettled totals appeared as real values | Removed fabricated charts/zero proxy. Amount formatting retains satang. Audit list no longer fabricates events from board snapshots. |
| Partial Admin reads silently became empty collections | A failed collection read blocks the editable portal and offers retry. Covered with a mocked production read failure. |
| Corrupt local draft broke Admin initialization | Preserve original draft, show published data with a warning, require explicit Save/Restore before Publish. |
| Invalid board IDs/names and failed browser storage were not handled | Four-digit IDs for new/renamed boards, bounded nonempty names, visible save failure with retry and preserved edits. |
| Modal cancellation and focus were incomplete | Close/Escape cancel; keyboard focus stays inside and returns to the opener. Removed the unused input modal with a broken footer Cancel button. |
| Reminders scroll regression test failed on tall tablets | Six items did not overflow. The test now uses twelve and proves it starts at scrollTop 100 before testing preservation; assertions were not weakened. |

## Flow coverage

| Area | Exercised |
| --- | --- |
| Authentication and character | Signup, validation, login, recovery, one-time key, character selection/save, slow/failing hydration, reload and return login with the same identity. |
| Home and navigation | Shared header/footer/banner contracts, mobile navigation, theme/language, tour and route transitions. |
| Party Ledger | Create/join/reopen board, existing Character ID invites, Guest, all split modes, multi-payer, receipts, import/export, settlement, settings and archived state. |
| Debt Dragon | Create/edit/validate, payment history, interest accrual, filters, archive/restore and persistence. |
| Price Arena | Product/offer forms, units/promotions, ranking, validation, archive/restore and persistence. |
| Treasury | Income, categories add/edit/delete, expense/bill validation, storage failure, month handling, persistence and existing records after changes. |
| Profile, drawer and Reminders | Privacy/account ownership, progress, boards, backup controls, invite accept/decline/expiry, retry, account switching, keyboard and responsive layouts. |
| Admin | All nine sections, board drafts, save/reload/publish/restore, revision history, search, scoped export, read failure, corrupt draft, lifecycle validation, safe archive/reopen. |
| Isolated Firebase backend | 21 Auth/Firestore emulator tests: account recovery, delete/detach, lifecycle transactions, stale publish/collision checks, invite permissions and account-owned data. |

## Live production evidence

- Opened Dashboard, Relationship Map, Boards, Users, Board Admins, Deleted IDs,
  Audit Log, Version Control and Support Tools in the existing logged-in session.
- Reproduced the search focus bug and nonfunctional Export on production.
- Used existing **TEST board 2214** only for writes: renamed it with a QA suffix,
  saved the draft, reloaded, published, reloaded, then restored the exact original
  name and published/reloaded again. Final UI showed **Published version**, the
  original name, 3 members and 5 quests. Two revision entries record the round trip.
- Screenshot: `qa/production-test-board-restored.png`.
- This verifies the already-deployed Admin write path. The fixes in this working
  tree have not been deployed; their evidence is local browser/E2E coverage.

## Local visual evidence

`qa/local-admin-archive.png` is an actual Chrome capture of a separately created
local TEST board, showing `archived` with a working Reopen action. It was
personally inspected. Automated tests separately verify financial data remains
intact for a populated fixture.

## Verification runs

- Baseline: syntax/assets and 64 unit tests passed; browser 510 passed, 11 skipped,
  1 failed (the non-scrollable Reminders tablet fixture described above).
- Backend: **21 passed** in isolated `demo-coin-quest` Auth/Firestore emulators.
- Targeted Admin + Reminders: **51 passed** across all three browser projects.
- Initial new Admin tests had selector errors (decorative icons in button names,
  live input value vs HTML attribute, duplicate Lifecycle buttons); these were
  corrected without changing product assertions or increasing timeouts.
- Final whole-site run: syntax/assets and **64 unit tests passed**; browser
  **533 passed, 11 skipped, 2 failed**. Both failures were legacy responsive
  checks opening the removed Add user prototype. They now open the implemented
  Export modal while retaining the original mobile placement, touch-target and
  overflow assertions. See `test-final.log`.
- Affected Admin/integration rerun after that correction: **107 passed,
  4 skipped** across Desktop, Tablet and Mobile (`test-admin-final.log`).
  This is targeted confirmation of the repair, not a claim that a subsequent
  single full-suite run was green.
- Final diff inspection found one remaining inert View diff button in Audit Log;
  it was removed and the archive/reopen test now checks Audit Log as well.
  That final check passed on **all 3 browser projects** (`test-audit-final.log`).
- Final syntax check and `git diff --check` passed. The full suite also refreshed
  tracked screenshots in the existing redesign QA directories; these generated
  results remain in the working tree, separately from this audit's evidence.

## Boundaries and retained compatibility

- No claim of exhaustive absence of bugs. Automated browser flows use fixtures;
  production write coverage above is specifically Admin TEST-board publishing.
- Password reset/permanent deletion are covered by isolated backend tests, not
  executed against a production account during this audit.
- Admin does not support account merging, impersonation, account creation or
  canonical character editing; the old placeholders are gone.
- Revisions are change summaries, not historical board snapshots. Audit Log is
  scoped to board revisions/drafts, not an immutable audit of every operation.
- Legacy Debt/Treasury board summaries do not aggregate all `playerModules` data.
- Existing signed-in-only board rules and compatibility readers are retained;
  owner/member ACL migration was not attempted.
- Historical reference documents and files were retained. No bulk file deletion
  or unrelated reset was used. Changes remove proven obsolete runtime code/CSS.

See `ADMIN_PORTAL_IMPLEMENTATION.md` and `tests/e2e/admin-flow-audit.spec.mjs`.
