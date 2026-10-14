# Chat release — 2026-10-14

## Target and baseline

Canonical production origin: `https://coinquestledger.vercel.app`.
The domain cutover is already complete; this release uses the existing
`coinquestledger` Vercel project and the existing Firebase project. It must not
restore the retired hyphenated alias.

Before release, local `main` and `origin/main` both pointed to
`a4849cc8c9c7a7da303be66463593cb0f4cef634`. Its successful CI run was
`38535261868`; production was READY at deployment
`dpl_25P44dnEqK8rX9ibRsrEuouM9xuH`
(`coinquestledger-l8expu1wl-purich-w.vercel.app`). This is the rollback baseline.

## Included work

- Shared entry eye waits for initial route/account data, stylesheets, fonts,
  rendered images, CSS backgrounds and border artwork. Repeat entry and
  Home/Price Arena navigation use the same gate. Failed required assets keep
  content covered; local drawer/list loads use skeletons and actionable retry.
- Owl-note text alignment follows the paper angle and sits slightly higher.
- Admin Dashboard and all nine Admin destinations share the new header,
  navigation, parchment surface, gutters, footer and responsive controls.
  Generated tavern/landscape/KPI artwork is checked into deployed assets.
- The parchment border and content inset fix keeps headings inside the paper;
  compact navigation, header actions and detail layouts preserve existing
  draft and privileged-action behavior.
- Related tests, design contracts and reference/QA evidence are included.
  Unrelated handoff/export bundles remain outside this release.

Earlier redesigns in this conversation are already present in the baseline
history. Native source, backend handlers, Firebase rules, production records,
deployment secrets and domain configuration are unchanged by this release.

## Verification record

The local full preflight was started with Node 24. Syntax, 66 unit tests and
asset checks passed. Desktop and Tablet E2E completed, with one Tablet loader
wait timing out before the run later stopped during Mobile because the local
filesystem returned `ENOSPC`. The Tablet case passed unchanged in a diagnostic
run with its original assertion timeout. The Mobile recovery capture failure
explicitly reported `ENOSPC`, rather than a failed product assertion.

A separate regression holds a late `border-image` response and verifies that
the eye keeps content hidden until the parchment image decodes. The asset
inventory now checks 100 local files and 47 optional CDN entries. Production
smoke also covers the Admin Dashboard and visible CSS border/background artwork.

Local coverage is complete across the original run and targeted continuation:
616 unique E2E cases passed and 11 were skipped by existing applicability/opt-in
conditions. Mobile completed with one worker: 205 passed, four skipped. The new
parchment regression passed in all three projects. The rerun did not increase
timeouts or weaken assertions. The local production-smoke harness passed nine
routes plus signed-out Login/Sign Up at all three viewports. PNG integrity checks
found no truncated files in the 214 candidate QA/reference images.

The release uses the existing CI/CD workflow as the sole production writer:
web E2E/unit/syntax/assets and isolated Firebase integration tests, plus native
typecheck/lint/contracts, must pass before build, production deployment and
canonical alias promotion. No duplicate manual deployment or rule deployment.
Recent comparable successful CI runs took about 13–15 minutes; 22 minutes is
the diagnostic checkpoint, with immediate investigation for any explicit failure.

Final exact-commit CI/deployment results and production smoke evidence are
reported with the release completion. Local execution logs are under
`mobile/.artifacts/release-chat-2026-10-14/`; production screenshots are under
`test-results/prod-smoke/` and are not credentials or production database exports.
