import { chromium } from '@playwright/test';
import { openBoardInfoFixture } from '../../tests/e2e/helpers/board-info-fixture.mjs';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
const phase=process.argv[2] || 'after';
const target=name=>fileURLToPath(new URL(`./qa/${name}.png`,import.meta.url));
await mkdir(fileURLToPath(new URL('./qa',import.meta.url)),{recursive:true});
const browser=await chromium.launch();
for(const width of [1440,768,390]) {
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4569',viewport:{width,height:width===768?1024:900},deviceScaleFactor:1,locale:'en-US',timezoneId:'Asia/Bangkok',isMobile:width<1024,hasTouch:width<1024});
  const page=await context.newPage();
  await openBoardInfoFixture(page);
  if(phase==='before') await page.getByRole('button',{name:'Scroll',exact:true}).click();
  await page.evaluate(async()=>{
    await document.fonts.ready;
    await Promise.all([...document.images].map(img => img.decode()));
    const urls=[...new Set([...document.querySelectorAll('*')].flatMap(el=>[...`${getComputedStyle(el).backgroundImage},${getComputedStyle(el).borderImageSource}`.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m=>m[1])))];
    await Promise.all(urls.map(src=>new Promise(resolve=>{const img=new Image();img.onload=img.onerror=resolve;img.src=src;})));
    window.scrollTo(0,0);
  });
  await page.screenshot({path:target(`${phase}-${width}`),fullPage:true});
  await page.screenshot({path:target(`${phase}-${width}-viewport`)});
  if(phase==='after' && width===390) {
    await page.locator('#board-owner .board-section-toggle').click();
    await page.locator('#board-members .board-section-toggle').click();
    await page.evaluate(() => window.scrollTo(0,0));
    await page.screenshot({path:target('after-mobile-expanded'),fullPage:true});
  }
  await context.close();
}
await browser.close();
