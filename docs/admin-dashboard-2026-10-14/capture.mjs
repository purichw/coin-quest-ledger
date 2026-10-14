import { chromium } from '@playwright/test';
import { openAdminFixture, adminNav, adminTools } from '../../tests/e2e/helpers/admin-fixture.mjs';
import { fileURLToPath } from 'node:url';

const output = name => fileURLToPath(new URL(`./qa/${name}.png`, import.meta.url));
const browser = await chromium.launch();
for (const width of [1440, 768, 390]) {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4569',
    viewport: { width, height: width === 768 ? 1024 : 900 }, deviceScaleFactor: 1,
    isMobile: width < 1024, hasTouch: width < 1024 });
  const page = await context.newPage();
  await openAdminFixture(page);
  await page.evaluate(async () => {
    const urls = [...new Set([...document.querySelectorAll('*')].flatMap(el => {
      const style = getComputedStyle(el);
      return [...`${style.backgroundImage},${style.borderImageSource}`.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => m[1]);
    }))];
    await Promise.all(urls.map(src => new Promise(resolve => { const img = new Image(); img.onload = img.onerror = resolve; img.src = src; })));
  });
  await page.screenshot({ path: output(`after-${width}`), fullPage: true });
  if (width === 1440) {
    await page.screenshot({ path: output('dashboard-viewport') });
    for (const name of ['Boards', 'Users', 'Relationship Map']) {
      await adminNav(page, name);
      await page.screenshot({ path: output(`shared-${name.toLowerCase().replaceAll(' ', '-')}`) });
    }
  }
  if (width === 390) {
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    await page.screenshot({ path: output('mobile-navigation') });
    await page.keyboard.press('Escape');
    await adminTools(page);
    await page.screenshot({ path: output('mobile-actions') });
  }
  await context.close();
}
await browser.close();
