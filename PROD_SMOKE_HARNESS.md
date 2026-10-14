# Production Smoke Harness

Last updated: 2026-10-13

## Purpose

Use this harness after production deploys or when a production-facing asset,
route, auth shell, admin shell, or responsive contract changes. It verifies the
live URL with real browser rendering while avoiding production data mutation.

## Command

```bash
npm run smoke:prod
```

Optional target override:

```bash
PROD_SMOKE_URL=https://coinquestledger.vercel.app npm run smoke:prod
```

Screenshots are written to `test-results/prod-smoke/<run-id>/`.

## What It Does

- Runs HTTP checks for the production app routes and shared asset scripts.
- Opens Chromium desktop `1366 x 900`, tablet `768 x 1024` and mobile `390 x 844`.
- Seeds only `localStorage` and `sessionStorage` on `?test=1` routes.
- Exercises Home, Compare, Split entry, Party Ledger, Debt Dragon, Treasury, Character
  Profile, and the Admin `/admin/?test=1` gate.
- Includes a Tiderunner classic-skin fixture so production fallback assets are
  actually requested.
- Fails on app console errors, failed requests, or 4xx/5xx document, script,
  stylesheet, image, font, XHR, or fetch responses.
- Fails on horizontal document overflow.
- Decodes rendered images and each module's CSS banner artwork; an HTTP 200
  alone is not asset acceptance.
- Opens the actual signed-out Login and Sign Up views in a separate, unseeded
  browser context at each viewport. No credentials are entered or submitted.

## Boundaries

This is not a live Firebase account lifecycle test. It intentionally does not
create, edit, or delete production Firestore/Auth records. For real Firebase
account lifecycle coverage, use the existing opt-in harness:

```bash
POINTY_REAL_FIREBASE_E2E=1 FIREBASE_SERVICE_ACCOUNT_JSON='<json>' npm run test:e2e
```

Admin production auth uses Google/Firebase. Routine production smoke must use
`/admin/?test=1` unless the project owner explicitly provides an approved
least-privilege smoke admin account and cleanup policy.

## Asset Contract

Production and local routes use checked-in same-origin artwork by default,
including `?test=1`. The release baseline found 404s in the old Cloudinary
manifest, so `?assets=cloud` is now an explicit CDN diagnostic option only.
`assets/` must be included in the Vercel upload. `npm run test:assets` verifies
the required local files and that deploy exclusions do not remove them.

Legacy CDN diagnostic fallbacks remain:

- `fallback-assets/tiderunner-classic-female.png`
- `fallback-assets/tiderunner-classic-male.png`

They are routed from the original `assets/rpg-portraits/tiderunner-classic-*.png`
keys in `shared/asset-urls.js` and checked by `npm run test:assets`.
