# Production Smoke Harness

Last updated: 2026-07-15

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
PROD_SMOKE_URL=https://coin-quest-ledger.vercel.app npm run smoke:prod
```

Screenshots are written to `test-results/prod-smoke/<run-id>/`.

## What It Does

- Runs HTTP checks for the production app routes and shared asset scripts.
- Opens Chromium desktop `1366 x 900` and mobile `390 x 844`.
- Seeds only `localStorage` and `sessionStorage` on `?test=1` routes.
- Exercises Home, Compare, Party Ledger, Debt Dragon, Treasury, Character
  Profile, and the Admin `/admin/?test=1` gate.
- Includes a Tiderunner classic-skin fixture so production fallback assets are
  actually requested.
- Fails on app console errors, failed requests, or 4xx/5xx document, script,
  stylesheet, image, font, XHR, or fetch responses.
- Fails on horizontal document overflow.

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

Production `?test=1` routes must still use `shared/cloudinary-assets.js` for
manifest-backed assets. Local assets are forced only on localhost/private-host
test routes or when explicitly using `?assets=local`.

The only production fallback assets outside Cloudinary are:

- `fallback-assets/tiderunner-classic-female.png`
- `fallback-assets/tiderunner-classic-male.png`

They are routed from the original `assets/rpg-portraits/tiderunner-classic-*.png`
keys in `shared/asset-urls.js` and checked by `npm run test:assets`.
