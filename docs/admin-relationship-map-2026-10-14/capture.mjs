import { chromium } from '@playwright/test';
import { openRelationshipFixture } from '../../tests/e2e/helpers/relationship-fixture.mjs';
import { adminNav } from '../../tests/e2e/helpers/admin-fixture.mjs';
import { fileURLToPath } from 'node:url';

const phase = process.argv[2] || 'after';
const output = name => fileURLToPath(new URL(`./qa/${name}.png`, import.meta.url));
const browser = await chromium.launch();
for (const width of [1440, 768, 390]) {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4569',
    viewport: { width, height: width === 768 ? 1024 : 900 }, deviceScaleFactor: 1,
    isMobile: width < 1024, hasTouch: width < 1024 });
  const page = await context.newPage();
  await openRelationshipFixture(page);
  await page.evaluate(async () => {
    const urls = [...new Set([...document.querySelectorAll('*')].flatMap(el => {
      const style = getComputedStyle(el);
      return [...`${style.backgroundImage},${style.borderImageSource}`.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => m[1]);
    }))];
    await Promise.all(urls.map(src => new Promise(resolve => { const img = new Image(); img.onload = img.onerror = resolve; img.src = src; })));
  });
  await page.screenshot({ path: output(`${phase}-${width}`), fullPage: true });
  if (phase === 'after' && width === 390) {
    await page.locator('.relationship-help-toggle').click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: output('after-mobile-expanded'), fullPage: true });
  }
  if (phase === 'after' && width === 1440) for (const name of ['Dashboard', 'Boards', 'Users']) {
    await adminNav(page, name);
    await page.screenshot({ path: output(`shared-${name.toLowerCase()}`), fullPage: true });
  }
  await context.close();
}
await browser.close();
