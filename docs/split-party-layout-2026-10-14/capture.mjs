import { chromium, expect } from '@playwright/test';
import { partyLayoutFixture } from '../../tests/e2e/helpers/party-layout-fixture.mjs';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
const phase = process.argv[2] || 'after';
const target = name => fileURLToPath(new URL(`./qa/${name}.png`, import.meta.url));
await mkdir(fileURLToPath(new URL('./qa', import.meta.url)), { recursive: true });
const browser = await chromium.launch();
async function ready(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
    const urls = [...new Set([...document.querySelectorAll('*')].flatMap(el => [...getComputedStyle(el).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => m[1])))];
    await Promise.all(urls.map(src => new Promise(resolve => { const img = new Image(); img.onload = img.onerror = resolve; img.src = src; })));
  });
}
for (const width of [1440, 768, 390].filter(width => !process.argv[3] || width === Number(process.argv[3]))) {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4569', viewport: { width, height: width === 390 ? 844 : 1000 }, deviceScaleFactor: 1, locale: 'th-TH', timezoneId: 'Asia/Bangkok', isMobile: width < 1024, hasTouch: width < 1024 });
  const page = await context.newPage();
  await partyLayoutFixture(page);
  await page.goto('/trip/?id=4821&test=1');
  await expect(page.locator('#party-count')).toHaveText('3');
  await ready(page);
  await page.screenshot({ path: target(`${phase}-${width}`), fullPage: true });
  await page.screenshot({ path: target(`${phase}-${width}-viewport`) });
  if (phase === 'after') {
    await page.locator('.add-hero').click();
    await page.getByRole('button', { name: 'เพิ่ม Guest', exact: true }).click();
    await page.locator('#new-hero-name').fill('นักเดินทาง');
    await page.locator('.choose-hero-btn').click();
    await ready(page);
    await page.screenshot({ path: target(`${phase}-${width}-picker`) });
    await page.locator('.picker-cell[data-class="ranger"][data-gender="female"]').click();
    await ready(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: target(`${phase}-${width}-add-guest`), fullPage: true });
    if (width === 390) {
      await page.getByRole('button', { name: '✕ ยกเลิก', exact: true }).click();
      await page.locator('.cq-lang-compact').click();
      await page.locator('[data-profile-hub="theme"]').click();
      await ready(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: target('after-390-en-dark'), fullPage: true });
    }
  }
  await context.close();
}
await browser.close();
