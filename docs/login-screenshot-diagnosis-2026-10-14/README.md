# Login screenshot diagnosis — 2026-10-14

Source base: 330471b. Local visual fixture: http://127.0.0.1:4573/?test=1&capture=02

The fixture uses the current login renderer and CSS with synthetic data on the underlying Home page. No application source was changed; no account was submitted.

At a 1440 × 823 viewport, `.login-gate` is fixed and exactly 823px high. The underlying document is 1049px high. Full-page capture includes the extra 226px below the gate; viewport capture does not. The fixture screenshot exposes Home content there, while the user's screenshot has the cream body background. The precise capture tool/paint behavior for the user's image is unknown, but the geometry matches: 2880 × 2098 at 2×, with the login ending around 1646px.

The body background is rgb(231,220,198), or #e7dcc6. `body.login-locked` has overflow:hidden. PageDown leaves both document and login-gate scroll at zero; the gate has no internal overflow at this viewport.

Evidence: metrics.json, scroll-check.json and the two original browser screenshots. The comparison image is a scaled side-by-side of those screenshots, not a product change. Scope was this login capture behavior only; no broader tests or release checks.
