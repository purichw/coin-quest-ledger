import { chromium } from '@playwright/test';
import { openTombstonesFixture } from '../../tests/e2e/helpers/tombstones-fixture.mjs';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const phase = process.argv[2] || 'after';
const output = name => fileURLToPath(new URL(`./qa/${name}.png`, import.meta.url));
await mkdir(fileURLToPath(new URL('./qa', import.meta.url)), { recursive: true });
const browser = await chromium.launch();
for (const width of [1440, 768, 390]) {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4569', viewport: { width, height: width === 768 ? 1024 : 900 }, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'Asia/Bangkok', isMobile: width < 1024, hasTouch: width < 1024 });
  const page = await context.newPage();
  await openTombstonesFixture(page);
  await page.evaluate(async () => {
    await document.fonts.ready;
    const urls = [...new Set([...document.querySelectorAll('*')].flatMap(el => {
      const style = getComputedStyle(el);
      return [...`${style.backgroundImage},${style.borderImageSource}`.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => m[1]);
    }))];
    await Promise.all(urls.map(src => new Promise(resolve => { const img = new Image(); img.onload = img.onerror = resolve; img.src = src; })));
  });
  await page.screenshot({ path: output(`${phase}-${width}`), fullPage: true });
  await page.screenshot({ path: output(`${phase}-${width}-viewport`) });
  if (phase === 'after' && width === 390) {
    await page.locator('.tombstone-row').first().getByRole('button', { name: 'Detail', exact: true }).click();
    await page.screenshot({ path: output('after-mobile-detail') });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => getComputedStyle(document.getElementById('modal-root'), '::before').opacity === '0');
    await page.getByRole('button', { name: 'Collapse deleted ID 3186', exact: true }).click();
    await page.screenshot({ path: output('after-mobile-collapsed') });
    await page.getByPlaceholder('Search deleted ID / username').fill('no matching record');
    await page.screenshot({ path: output('after-mobile-no-results') });
  }
  await context.close();
}
await browser.close();
