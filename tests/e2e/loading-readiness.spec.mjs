import { test, expect } from '@playwright/test';

const pixel = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="green"/></svg>';

async function hold(page, url) {
  let pending;
  await page.route(url, route => new Promise(resolve => { pending = { route, resolve }; }));
  return async (body = pixel, contentType = 'image/svg+xml') => {
    await expect.poll(() => !!pending).toBe(true);
    if (body === null) await pending.route.abort();
    else await pending.route.fulfill({ contentType, body });
    pending.resolve();
  };
}

async function fixture(page, { later = false, afterLoad = '' } = {}) {
  await page.addInitScript(later => {
    localStorage.setItem('lang', 'en');
    if (later) sessionStorage.setItem('coinQuestFirstLoadSeen', '1');
  }, later);
  await page.route('**/__readiness', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head>
    <link rel="stylesheet" href="/shared/first-load.css"></head><body>
    <div class="first-load" data-first-load></div><main><h1>Ready content</h1><button>Play</button><img src="/__held.svg" alt="" width="20" height="20"></main>
    <script src="/shared/first-load.js"></script><script>window.addEventListener('load', () => {${afterLoad}});</script></body></html>` }));
  await page.goto('/__readiness', { waitUntil: 'domcontentloaded' });
}

test('repeat navigation shields the page immediately while resources are pending', async ({ page }) => {
  const release = await hold(page, '**/__held.svg');
  await fixture(page, { later: true });
  // Read immediately; Playwright's retry must not mask a flash before the 500ms timer.
  expect(await page.locator('[data-first-load]').evaluate(el => getComputedStyle(el).visibility)).toBe('visible');
  await release();
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
});

test('late page data, CSS artwork and font loading all settle before revealing content', async ({ page }) => {
  const releaseImage = await hold(page, '**/__held.svg');
  const releaseArt = await hold(page, '**/__late-art.svg');
  const releaseFont = await hold(page, '**/__late-font.woff2');
  await fixture(page, { afterLoad: `
    window.releaseData = CoinQuestLoading.begin();
    document.body.style.backgroundImage = 'url(/__late-art.svg)';
    const font = new FontFace('Delayed font', 'url(/__late-font.woff2)');
    document.fonts.add(font); font.load().catch(() => {});
  ` });
  await releaseImage();
  await page.waitForTimeout(2300);
  await expect(page.locator('[data-first-load]')).toBeVisible();
  await page.evaluate(() => window.releaseData());
  await releaseArt();
  await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe('loading');
  await expect(page.locator('[data-first-load]')).toBeVisible();
  await releaseFont(null); // A settled font failure uses the browser's ready fallback.
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe('loaded');
  await page.evaluate(() => { window.releaseDrawer = CoinQuestLoading.begin(); });
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await expect(page.locator('main')).toHaveCSS('opacity', '1');
});

test('late parchment border artwork finishes before revealing the page', async ({ page }) => {
  const releaseImage = await hold(page, '**/__held.svg');
  const releaseBorder = await hold(page, '**/__late-border.svg');
  await fixture(page, { afterLoad: `
    const main = document.querySelector('main');
    main.style.border = '12px solid transparent';
    main.style.borderImage = 'url(/__late-border.svg) 1 fill / 12px';
  ` });
  await releaseImage();
  await page.waitForTimeout(2300);
  await expect(page.locator('[data-first-load]')).toBeVisible();
  await expect(page.locator('main')).toHaveCSS('opacity', '0');
  await releaseBorder();
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await expect(page.locator('main')).toHaveCSS('opacity', '1');
});

test('failed CSS stays covered and reload recovers instead of bypassing the gate', async ({ page }) => {
  const releaseImage = await hold(page, '**/__held.svg');
  const releaseCSS = await hold(page, '**/__late.css');
  await fixture(page, { afterLoad: `const css = document.createElement('link'); css.rel='stylesheet'; css.href='/__late.css'; document.head.append(css);` });
  await releaseImage(); await releaseCSS(null);
  await expect(page.locator('[data-first-load-status]')).toContainText('could not finish loading');
  await expect(page.locator('main')).toHaveCSS('opacity', '0');
  await page.unroute('**/__held.svg');
  await page.route('**/__held.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: pixel }));
  await page.unroute('**/__late.css');
  await page.route('**/__late.css', route => route.fulfill({ contentType: 'text/css', body: 'main { color: rgb(0, 128, 0); }' }));
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Reload page', exact: true }).click()]);
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await expect(page.locator('main')).toHaveCSS('color', 'rgb(0, 128, 0)');
});

test('styles inserted by page initialization keep the loader until they finish', async ({ page }) => {
  const releaseImage = await hold(page, '**/__held.svg');
  const releaseCSS = await hold(page, '**/__late.css');
  await fixture(page, { afterLoad: `const css = document.createElement('link'); css.rel='stylesheet'; css.href='/__late.css'; document.head.append(css);` });
  await releaseImage();
  await page.waitForTimeout(2300); // Pass the old minimum-duration gate, while CSS is deliberately held.
  await expect(page.locator('[data-first-load]')).toBeVisible();
  await releaseCSS('main { color: rgb(0, 128, 0); }', 'text/css');
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await expect(page.locator('main')).toHaveCSS('color', 'rgb(0, 128, 0)');
});
