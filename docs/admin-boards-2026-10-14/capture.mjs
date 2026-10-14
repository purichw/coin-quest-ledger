import { chromium } from '@playwright/test';
import { openBoardsFixture } from '../../tests/e2e/helpers/boards-fixture.mjs';
import { fileURLToPath } from 'node:url';

const phase = process.argv[2] || 'after';
const output = name => fileURLToPath(new URL(`./qa/${name}.png`, import.meta.url));
const browser = await chromium.launch();
for (const width of [1440, 768, 390]) {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4569',
    viewport: { width, height: width === 768 ? 1024 : 900 }, deviceScaleFactor: 1,
    isMobile: width < 1024, hasTouch: width < 1024 });
  const page = await context.newPage();
  await openBoardsFixture(page);
  await page.evaluate(async () => {
    const urls = [...new Set([...document.querySelectorAll('*')].flatMap(el => {
      const style = getComputedStyle(el);
      return [...`${style.backgroundImage},${style.borderImageSource}`.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => m[1]);
    }))];
    await Promise.all(urls.map(src => new Promise(resolve => { const img = new Image(); img.onload = img.onerror = resolve; img.src = src; })));
  });
  await page.screenshot({ path: output(`${phase}-${width}`), fullPage: true });
  await page.screenshot({ path: output(`${phase}-${width}-viewport`) });
  if (phase === 'after' && width === 390) {
    await page.getByPlaceholder('ค้นหา board/admin').fill('no matching board');
    await page.screenshot({ path: output('after-mobile-no-results'), fullPage: true });
  }
  await context.close();
}
await browser.close();
