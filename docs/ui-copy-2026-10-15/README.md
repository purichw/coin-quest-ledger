# User-facing copy review — 2026-10-15

Scope: Admin board filters, record actions, search, account relationships and
operation guidance; player module descriptions, financial form labels, account
authentication/recovery, account drawer and reminders. Includes the requested
centering of the Boards Actions button group.

The implementation follows [UI copy guidelines](../../UI_COPY_GUIDELINES.md).
This changes display text only: board-type keys, IDs, saved records, permissions,
calculation rules and Publish behavior retain their existing contracts.

## Visual evidence

Captured with CUA/Chrome from the local candidate based on `7dc7bf5`, at
`http://127.0.0.1:4569/admin/?test=1&tab=boards`. The three TEST boards are
synthetic local session records. No production records were changed.

- [Desktop, 1440 × 900](qa/boards-desktop.jpg)
- [Tablet, 768 × 1024](qa/boards-tablet.jpg)
- [Mobile, 390 × 844](qa/boards-mobile.jpg)

Inspected all three captures. Full module names fit the filters; mobile wraps
Split Expenses without clipping. No document overflow was measured. Actions
remain centered with their header. Browser error/warning log was empty for this
fixture. These captures demonstrate the Boards surface, not every account state.

Existing E2E assertions were updated for the new labels, including shared Admin
fixtures, while retaining behavior, keyboard, error and persistence coverage.
Local release checks passed: syntax, asset validation, 66 unit tests and 739 E2E
tests (11 existing conditional skips), across desktop, tablet and mobile.
Release validation follows the root deployment runbook. Raw local logs and the
unrelated historical QA captures are excluded from the release commit.
