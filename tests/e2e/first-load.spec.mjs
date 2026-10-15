import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const qa = path.resolve(process.env.POINTY_QA_DIR || 'docs/loading-readiness-2026-10-14/qa');
const origin = 'http://127.0.0.1:4569';
const routes = ['/', '/trip/', '/debt/', '/treasury/', '/character/', '/admin/'];
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>';

// A real browser load event is held by a network response. Production code and
// styles run unchanged: no fake percentage API, forced classes, or Firebase.
async function fixture(page, { english = true, seen = false, held = true, blockedStorage = false, missingArt = false, externalFonts = true } = {}) {
  await page.addInitScript(({ english, seen, blockedStorage }) => {
    localStorage.setItem('lang', english ? 'en' : 'th');
    if (seen) sessionStorage.setItem('coinQuestFirstLoadSeen', '1');
    if (blockedStorage) Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('Storage unavailable'); } });
  }, { english, seen, blockedStorage });
  let pending;
  if (held) await page.route('**/__loading-hold.svg', route => new Promise(resolve => { pending = { route, resolve }; }));
  if (missingArt) await page.route('**/assets/loading-reference/night-quest.webp', route => route.abort());
  await page.route('**/__loading-fixture', async route => {
    await route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="${english ? 'en' : 'th'}"><head>
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
      ${externalFonts ? '<link href="https://fonts.googleapis.com/css2?family=Mitr:wght@400;500;600;700&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=Chakra+Petch:wght@500;600;700&display=swap" rel="stylesheet">' : ''}
      <link rel="stylesheet" href="/shared/first-load.css"></head><body>
      <div class="first-load" data-first-load></div>
      <main><h1>Loading fixture</h1><button id="ready-button">Ready to play</button><output></output>
      <img src="/assets/home-reference/crest.webp" width="20" height="20" alt="">
      ${held ? '<img src="/__loading-hold.svg" alt="" width="1" height="1">' : ''}</main>
      <script src="/shared/first-load.js"></script>
      <script>document.querySelector('#ready-button').onclick = () => document.querySelector('output').textContent = 'Playable';</script>
      </body></html>` });
  });
  await page.goto('/__loading-fixture', { waitUntil: 'domcontentloaded' });
  return async (fail = false) => {
    if (!held) return;
    await expect.poll(() => Boolean(pending)).toBe(true);
    if (fail) await pending.route.abort();
    else await pending.route.fulfill({ contentType: 'image/svg+xml', body: svg });
    pending.resolve();
  };
}

async function capture(page, testInfo, name) {
  const output = testInfo.outputPath(name);
  await page.screenshot({ path: output, animations: 'disabled' });
  await fs.mkdir(qa, { recursive: true });
  await fs.copyFile(output, path.join(qa, name));
}

for (const width of [1440, 768, 390]) test(`loading scene and progress at ${width}px`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: width === 768 ? 1024 : width === 390 ? 844 : 900 });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const release = await fixture(page);
  const overlay = page.locator('[data-first-load]');
  await expect(overlay).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '68');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.locator('.first-load-scene').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.locator('.first-load-tip')).toBeVisible({ visible: width >= 1024 });
  expect(await overlay.evaluate(el => el.scrollWidth <= innerWidth && el.scrollHeight <= innerHeight)).toBe(true);
  await expect.poll(() => page.locator('.first-load-track').evaluate(el => {
    const track = el.clientWidth - 2 * parseFloat(getComputedStyle(el).paddingLeft);
    return Math.round(el.firstElementChild.getBoundingClientRect().width / track * 100);
  })).toBe(68);
  await capture(page, testInfo, `loading-${width}.png`);
  await expect(page.locator('.first-load-tip button')).toHaveCount(0);
  await overlay.press('Shift+Tab');
  await expect(overlay).toBeFocused();
  await overlay.press('Tab');
  expect(await overlay.evaluate(el => el.contains(document.activeElement))).toBe(true);
  // Progress must not reach 100% just because time passed while an image is pending.
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '68');
  await release();
  await expect(overlay).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveClass(/first-load-(boot|open)/);
  await page.getByRole('button', { name: 'Ready to play' }).click();
  await expect(page.locator('output')).toHaveText('Playable');
  expect(errors).toEqual([]);
});

test('page entries randomize tips without immediate repeats', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const release = await fixture(page, { externalFonts: false });
  const tips = [];
  for (let visit = 0; visit < 9; visit++) {
    if (visit) await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-first-load-tip]')).toBeVisible();
    tips.push(await page.locator('[data-first-load-tip]').textContent());
    await release();
    await expect(page.locator('[data-first-load]')).toHaveCount(0);
  }
  for (let visit = 1; visit < tips.length; visit++) expect(tips[visit]).not.toBe(tips[visit - 1]);
});

for (const english of [true, false]) test(`one random tip tolerates unavailable storage (${english ? 'English' : 'Thai'})`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // Exercise the end of the random range as well as the longer localized copy.
  await page.addInitScript(() => { Math.random = () => 0.99; });
  const release = await fixture(page, { english, blockedStorage: true });
  const tip = page.locator('[data-first-load-tip]');
  await expect(tip).toHaveCount(1);
  await expect(tip).toContainText(english ? 'Group expenses by category' : 'แยกรายจ่ายเป็นหมวดหมู่');
  await expect(page.locator('.first-load-tip button')).toHaveCount(0);
  expect(await tip.evaluate(el => {
    const text = el.getBoundingClientRect(), card = el.parentElement.getBoundingClientRect();
    return text.left >= card.left && text.right <= card.right && text.bottom <= card.bottom;
  })).toBe(true);
  await capture(page, testInfo, `loading-tips-${english ? 'en' : 'th'}-1440.png`);
  await release();
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
});

test('slow loading offers reload without exposing incomplete content', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const release = await fixture(page, { english: false });
  await expect(page.getByRole('button', { name: 'โหลดหน้าใหม่' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '68');
  expect(await page.locator('.first-load-eye').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await capture(page, testInfo, 'loading-390-slow-th.png');
  await page.locator('[data-first-load]').press('Tab');
  await expect(page.getByRole('button', { name: 'โหลดหน้าใหม่' })).toBeFocused();
  await expect(page.locator('main')).toHaveCSS('opacity', '0');
  await release();
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ready to play' }).click();
  await expect(page.locator('output')).toHaveText('Playable');
});

test('optional loading art has a fallback but failed content stays shielded', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 450 });
  const release = await fixture(page, { blockedStorage: true, missingArt: true });
  await expect(page.locator('[data-first-load]')).toBeVisible();
  expect(await page.locator('.first-load-box').evaluate(el => {
    const r = el.getBoundingClientRect(); return r.x >= 0 && r.right <= innerWidth && r.y >= 0 && r.bottom <= innerHeight;
  })).toBe(true);
  await capture(page, testInfo, 'loading-320-fallback.png');
  await release(true);
  await expect(page.locator('[data-first-load]')).toBeVisible();
  await expect(page.locator('[data-first-load-status]')).toContainText('could not finish');
  await expect(page.getByRole('button', { name: 'Reload page' })).toBeVisible();
  await expect(page.locator('main')).toHaveCSS('opacity', '0');
});

test('later fast navigation has no minimum wait and later slow navigation stays shielded', async ({ page }) => {
  await fixture(page, { seen: true, held: false });
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await page.unroute('**/__loading-fixture');
  const release = await fixture(page, { seen: true });
  await expect(page.locator('[data-first-load].is-active')).toBeVisible();
  await release();
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
});

for (const externalFonts of [true, false]) test(`completion releases focus to a dialog that appeared beneath the loader (${externalFonts ? 'web fonts' : 'fast styles'})`, async ({ page }) => {
  const release = await fixture(page, { externalFonts });
  await expect(page.locator('[data-first-load]')).toBeFocused();
  await page.evaluate(() => {
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.innerHTML = '<h2 tabindex="-1">Welcome back</h2><button>Log in</button>';
    document.body.append(dialog);
    dialog.querySelector('h2').focus();
  });
  await expect(page.locator('[data-first-load]')).toBeFocused();
  await release();
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeFocused();
});

test('every real page consumes the shared loader and test mode still bypasses it', async ({ page }) => {
  // No Firebase requests or credentials: keep each real route's header, loader,
  // styles and DOM, stopping only app scripts after the loader for this smoke.
  await page.route('**/*', async route => {
    const request = route.request();
    if (request.isNavigationRequest() && request.url().startsWith(origin)) {
      const response = await route.fetch();
      const html = (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, match => {
        return match.includes('/shared/first-load.js') || match.includes('first-load-boot') ? match : '';
      });
      await route.fulfill({ response, body: html });
    } else if (!request.url().startsWith(origin) && !request.url().includes('fonts.')) await route.abort();
    else await route.continue();
  });
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('[data-first-load]')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveClass(/first-load-(boot|open)/);
    await page.goto(route + '?test=1');
    await expect(page.locator('[data-first-load]')).toHaveCount(0);
  }
});
