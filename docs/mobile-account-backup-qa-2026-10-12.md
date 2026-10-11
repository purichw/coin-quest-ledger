# Account recovery and native backup QA

2026-10-12, iPhone 17 Pro / iOS 26.5, own installed development binary
`com.purichwc.coinquestledger`, Metro 8093, existing synthetic test account
`cqsim-20261012`. Firebase project `pointy-personal-toolkit` was used throughout.

## Backup — actual Simulator

1. Exported `coin-quest-player-v1` through the native share sheet to Files.
2. Opened the iOS document picker and chose that saved JSON.
3. Preview showed one debt, two Treasury expenses, one price comparison.
4. Confirmed restore and observed the success message.
5. Opened the before-restore copy and verified the same module counts.
6. Treasury after restore still showed income 5000, spent 420, remaining 4580;
   character remained ID 2150 and XP 162 after signing in again.

The first real import exposed a legacy web debt-log date (`12 ต.ค.`) with a valid
timestamp. Validation now preserves that representation and validates its
timestamp; it does not demand a fabricated ISO date. Tests reject a different
owner, incomplete files, duplicate IDs, invalid money and invalid offers before
normalization can clamp/drop them.

Restore writes a rollback file in the app Documents directory before its
transaction. The transaction rereads account lifecycle, character identity and
the module baseline, preserving unrelated document fields and refusing a stale
overwrite. Credentials and board ownership are excluded from this format.

Inspected screenshot: [restore preview](mobile-account-backup-qa-2026-10-12/restore-preview.png).

## Recovery — implementation and limits

Native reset calls the existing `/api/recover-account` endpoint; rotation stores
only the hash in private `users/{uid}`. New codes are retained in device-only
SecureStore until acknowledged. Reveal is gated by “saved” confirmation, and the
account identity is retained. No backend recovery policy was changed.

Actual Simulator checks: opened the regeneration consequence dialog, cancelled,
signed out, opened “ลืมรหัสผ่าน”, submitted empty fields and saw validation, went
back, and successfully logged in with the unchanged existing password.
[Validation evidence](mobile-account-backup-qa-2026-10-12/recovery-validation.png).

Live password reset/regeneration submission is **not verified**. The Computer
Use policy requires human entry/confirmation/submission for new credentials.
Pure validation/hash compatibility tests passed; those tests do not establish a
successful live reset. Existing-session process restart passed after the rebuild.
