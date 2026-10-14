import { chromium } from '@playwright/test';
import { copyFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const target = path => fileURLToPath(new URL(path, import.meta.url));
await copyFile('/var/folders/3k/m69pt27s00bd_l2yzfjvmk8w0000gn/T/codex-clipboard-82fe2be1-0078-45d3-bb58-a881fc33d57f.png', target('./reference.png'));
const browser = await chromium.launch();
const page = await browser.newPage({viewport:{width:1240,height:900},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:4569/docs/admin-board-admins-2026-10-14/reference.png');
for (const [name,x,y,width,height] of [['desktop',32,134,883,678],['tablet',947,134,406,679],['mobile',1390,134,259,682]]) {
  const data = await page.evaluate(async ({x,y,width,height}) => {
    const img=document.querySelector('img'); await img.decode();
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    canvas.getContext('2d').drawImage(img,x,y,width,height,0,0,width,height);
    return canvas.toDataURL('image/png').split(',')[1];
  },{x,y,width,height});
  await writeFile(target(`./qa/reference-${name}.png`),Buffer.from(data,'base64'));
}
await page.goto('http://127.0.0.1:4569/docs/admin-board-admins-2026-10-14/comparison.html');
await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>img.decode()));});
for(const name of ['desktop','tablet','mobile']) await page.locator(`#${name}`).screenshot({path:target(`./qa/comparison-${name}.png`)});
await browser.close();
