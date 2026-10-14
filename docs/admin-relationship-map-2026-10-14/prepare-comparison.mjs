import { chromium } from '@playwright/test';
import { copyFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const target = path => fileURLToPath(new URL(path, import.meta.url));
await copyFile('/var/folders/3k/m69pt27s00bd_l2yzfjvmk8w0000gn/T/codex-clipboard-0b0a2218-39ec-4543-90b1-11c09d8c4315.png', target('./reference.png'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1240, height: 900 }, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4569/docs/admin-relationship-map-2026-10-14/reference.png');
for (const [name, x, y, width, height] of [['desktop', 36, 150, 821, 642], ['tablet', 890, 152, 434, 638], ['mobile', 1360, 153, 281, 637]]) {
  const data = await page.evaluate(async ({ x, y, width, height }) => {
    const img = document.querySelector('img'); await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    canvas.getContext('2d').drawImage(img, x, y, width, height, 0, 0, width, height);
    return canvas.toDataURL('image/png').split(',')[1];
  }, { x, y, width, height });
  await writeFile(target(`./qa/reference-${name}.png`), Buffer.from(data, 'base64'));
}
await page.goto('http://127.0.0.1:4569/docs/admin-relationship-map-2026-10-14/comparison.html');
await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode())); });
for (const name of ['desktop', 'tablet', 'mobile']) await page.locator(`#${name}`).screenshot({ path: target(`./qa/comparison-${name}.png`) });
await browser.close();
