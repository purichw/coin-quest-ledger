# Admin Portal documentation

Current implementation: [ADMIN_PORTAL_IMPLEMENTATION.md](ADMIN_PORTAL_IMPLEMENTATION.md).
This index replaces the superseded prototype/handoff specification. Prior
versions remain in Git history; do not restore their UI or data behavior by default.

- Shared header, sidebar, Dashboard parchment and footer: `admin/shell.js` and
  `admin/design.css`; feature structure lives in `admin/admin.css` and `admin/app.js`.
- Board Info and User Detail use continuous scroll layouts. There is no Tabs
  mode or Layout switch. Dashboard Cards/Command remains a separate supported view.
- Current screen contracts and QA links: `ADMIN_PORTAL_IMPLEMENTATION.md`.
- Account/lifecycle/reset contracts: `ACCOUNT_MANAGEMENT_IMPLEMENTATION.md`.
- Auth/Rules and privileged endpoints: `SECURITY_AND_FIREBASE_RULES.md`.
- Production origin, exact revision and release process: `DEPLOYMENT_AND_ROLLBACK_RUNBOOK.md`.
- Verification depth and commands: `TESTING_MATRIX.md`.

A supplied mockup governs visual composition within the current product contracts;
its sample users, IDs, figures, tabs or actions are not new production requirements.
