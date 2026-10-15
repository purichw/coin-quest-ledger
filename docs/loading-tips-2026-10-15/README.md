# Random loading tips — 15 October 2026

The shared entry loader previously always started with the first of three tips,
so short visits looked as though only one existed. It now chooses one of eight
Thai/English tips at each page entry. The previous tip is remembered for the
current tab session and excluded from the next draw. Denied or invalid storage
falls back to a random tip. Previous/next arrows and their handlers/styles have
been removed. The selected text stays still while the page loads.

This retains the existing desktop tip card, responsive composition, page-ready
gate and wait duration. It adds no backend request or interval.

Verification: 12 Chromium E2E checks in `tests/e2e/first-load.spec.mjs` passed,
including 1440/768/390px layouts, nine successive page entries without adjacent
repeats, Thai/English rendering, blocked storage, focus containment/release,
slow/failed loading and shared entry-point smoke. Syntax and diff checks passed.
Broader release tests were not run; no push or deployment was performed.

The first test attempt encountered a screenshot font-readiness wait in the new
fixture without external fonts. Localized screenshot checks now use the existing
web-font fixture; production font/readiness gates were not changed.

Current browser screenshots from the local fixture (real loader markup/styles,
with one image response held to keep it visible):

- [Thai desktop](qa/loading-tips-th-1440.png)
- [English desktop](qa/loading-tips-en-1440.png)
- [Tablet](qa/loading-768.png)
- [Mobile](qa/loading-390.png)
