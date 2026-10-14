import { chromium } from '@playwright/test';
import { openUsersFixture } from '../../tests/e2e/helpers/users-fixture.mjs';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const phase = process.argv[2] || 'after';
const output = name => fileURLToPath(new URL(`./qa/${name}.png`, import.meta.url));
await mkdir(fileURLToPath(new URL('./qa', import.meta.url)), { recursive: true });
const browser = await chromium.launch();
for (const width of [1440, 768, 390]) {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4569', viewport: { width, height: width === 768 ? 1024 : 900 }, deviceScaleFactor: 1, isMobile: width < 1024, hasTouch: width < 1024 });
  const page = await context.newPage();
  await openUsersFixture(page);
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
    await page.getByRole('button', { name: 'More actions for TEST PP', exact: true }).click();
    await page.screenshot({ path: output('after-mobile-actions') });
    await page.keyboard.press('Escape');
    await page.getByPlaceholder('Search user / character').fill('missing result');
    await page.screenshot({ path: output('after-mobile-no-results'), fullPage: true });
  }
  await context.close();
}
await browser.close();
