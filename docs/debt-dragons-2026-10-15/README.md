# Debt Dragon artwork — 15 October 2026

Replaced all seven default debt-type portraits with the user's supplied
`CoinQuest_Debt_Dragons 2` mini-boss set. The PNG masters in
`assets/debt-dragons/` now contain the new artwork; their SHA-256 values match the
supplied `dragons.json`. The catalog is retained beside the images.

| Type key | Character | Debt category |
|---|---|---|
| autoloan | เกียร์กอน / Geargon | รถยนต์ |
| card | รูดี้ / Rudy | บัตรเครดิต |
| medical | เมดดี้ / Meddy | ค่ารักษาพยาบาล |
| mortgage | คีย์ล็อก / Keylock | บ้าน / ที่อยู่อาศัย |
| other | เชนกริม / Chaingrim | หนี้อื่น ๆ |
| student | บุ๊กกอน / Bookgon | การศึกษา |
| tax | แท็กซ์ตัน / Taxton | ภาษี |

## Runtime and image quality

- `debt/app.js` renders the corresponding `.webp` in every default portrait:
  debt rows, add/edit type choices and strategy target. Custom uploaded artwork
  still takes precedence; saved debts, category keys and calculations are unchanged.
- WebP uses quality 92, method 6, sharp YUV and alpha quality 100. Dimensions
  remain 1254 × 1254; alpha-channel signatures match each source exactly.
  Color compression is lossy, so this is not a pixel-identical RGB claim.
- The seven runtime files total **3,335,196 bytes**, versus **14,777,346 bytes**
  for the supplied PNGs: **77% smaller**. PNG masters remain for source fidelity
  and consumers of the original file paths. SVG wrappers would still embed
  raster data and would not provide a useful size or sharpness advantage.
- Removed the seven retired Cloudinary mappings, so diagnostic CDN mode cannot
  resurrect the previous set. Asset inventory now checks both new local formats.
- This updates the seven debt characters, not the separate decorative landscape
  banner or module navigation emblem. No production data was changed.

## Verification

- Asset inventory: 116 local assets and 40 optional CDN entries passed.
- Three targeted asset URL tests passed, including retired CDN rejection.
- Nine Debt Dragon Chromium E2E tests passed: all seven type choices at 1440
  and 390px; layouts at 1440/768/390px; create/edit/pay/reload; filters, archived
  restore, keyboard controls and narrow-screen overflow.
- Source PNG hashes and identical alpha channels: all seven passed. See
  [asset-verification.json](qa/asset-verification.json).
- Inspected desktop/mobile debt screens, all seven type choices and the
  source-versus-WebP comparison. No clipping or opaque image backgrounds found.

Release preflight also exposed a delayed battle-effect refresh closing the
mobile search/sort disclosure after payment. The refresh now preserves the
operator's open/closed choice; the existing filter test explicitly exercises
that refresh while sorting.

Evidence uses the local `/debt/?test=1` seed, without production credentials or
backend writes. These tests do not certify native Simulator or production
rendering; no build, push or deployment was performed.

- [Desktop debt screen](qa/after-1440.png)
- [Mobile debt screen](qa/mobile-top.png)
- [All seven choices](qa/dragon-types-1440.png)
- [Reference / runtime comparison](comparison.html)
- [Comparison screenshot](qa/reference-webp-comparison.png): first pair, Chrome,
  1440 × 635, local comparison page. Full-page CDP capture timed out; the viewport
  capture succeeded. Full responsive game captures came from the E2E runner.
