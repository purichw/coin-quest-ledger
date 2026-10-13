import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const routes = [
  ['home', '/?test=1', '.home-hero'],
  ['split-entry', '/trip/?test=1', '.be-hero'],
  ['split-board', '/trip/?id=9001&test=1', '.board-banner'],
  ['debt', '/debt/?test=1', '.debt-hero'],
  ['treasury', '/treasury/?test=1', '.treasury-hero'],
  ['price', '/?view=compare&test=1', '.arena-hero'],
  ['character', '/character/?id=1111&test=1', '.banner'],
];
async function fixture(page) {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('consistency-fixture')) return;
    sessionStorage.setItem('consistency-fixture', '1');
    const hero = { id:'1111', name:'Mali', class:'ranger', gender:'female', xp:1500, ownerUid:'consistency-qa' };
    localStorage.setItem('lang','th'); localStorage.setItem('pointy_theme','tavern');
    localStorage.setItem('pointy_auth_v1',JSON.stringify({uid:'consistency-qa',userId:'1111',username:'design.demo',name:'Mali',character:hero}));
    localStorage.setItem('pointy_character_registry_v1',JSON.stringify({'1111':hero}));
    localStorage.setItem('pointy_profile_v1',JSON.stringify({streak:7,bestStreak:12,tourSeen:true,lastVisit:new Date().toISOString().slice(0,10)}));
    sessionStorage.setItem('pointy_test_trip_9001',JSON.stringify({tripName:'TEST เชียงใหม่',participants:['Mali'],characterIds:{Mali:'1111'},heroClasses:{Mali:'ranger'},heroGenders:{Mali:'female'},expenses:[],admin:{characterId:'1111',adminName:'Mali'},access:{ownerUids:['consistency-qa'],memberUids:['consistency-qa']}}));
  });
}

for (const width of [1440,768,390]) test(`Shared player shell and module families at ${width}px`, async ({page}) => {
  test.setTimeout(90_000);
  await fixture(page);
  await page.setViewportSize({width,height:width===390?844:1000});
  const before = process.env.CQ_CONSISTENCY_BEFORE === '1';
  const dir = path.resolve('docs/player-design-system-2026-10-13/qa');
  await fs.mkdir(dir,{recursive:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const metrics=[];
  for (const [name,url,hero] of routes) {
    await page.goto(url);
    await expect(page.locator(hero)).toBeVisible();
    await expect(page.locator('[data-first-load]')).toHaveCount(0);
    await page.evaluate(()=>document.fonts.ready);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' overflow').toBeTruthy();
    if (!before) {
      await expect(page.locator('cq-player-header .cq-brand')).toHaveText('Coin Quest Ledger');
      await expect(page.locator('.cq-nav a')).toHaveCount(5);
      await expect(page.locator('cq-footer:visible .cq-footer strong')).toHaveText('Coin Quest Ledger');
      const background=await page.locator(hero).evaluate(el=>getComputedStyle(el).backgroundImage);
      expect(background,name+' artwork').toContain(name.startsWith('split')?'village-dusk.webp':name==='character'?'forest-valley.webp':name==='debt'?'valley-dragon.webp':name==='treasury'?'castle-banner.webp':name==='price'?'market-banner.webp':'tavern-');
      const header = await page.locator('.topbar').boundingBox();
      expect(header.y,name+' header starts at viewport top').toBe(0);
      metrics.push({name,headerHeight:header.height,hero:await page.locator(hero).boundingBox()});
      if (width===390) {
        await page.locator('.tb-burger').click();
        await expect(page.getByRole('dialog',{name:'Coin Quest Ledger'})).toBeVisible();
        await expect(page.locator('[data-mm-tab]')).toHaveCount(5);
        await page.keyboard.press('Escape');
        await expect(page.locator('.tb-burger')).toBeFocused();
      }
    }
    await page.screenshot({path:path.join(dir,`${before?'before':'after'}-${name}-${width}.png`),fullPage:true});
  }
  if (!before) {
    await fs.writeFile(path.join(dir,`metrics-${width}.json`),JSON.stringify(metrics,null,2));
    expect(new Set(metrics.map(m=>m.headerHeight)).size).toBe(1);
    const widths=metrics.map(m=>m.hero.width);
    expect(Math.max(...widths)-Math.min(...widths),'shared scenic frame').toBeLessThanOrEqual(2);
    const gameHeights=metrics.filter(m=>m.name!=='character').map(m=>m.hero.height);
    expect(Math.max(...gameHeights)-Math.min(...gameHeights),'shared banner size').toBeLessThanOrEqual(2);
  }
  expect(errors).toEqual([]);
});

test('Public profile uses shared menu without borrowing account actions', async ({page}) => {
  await fixture(page); await page.setViewportSize({width:390,height:844});
  await page.goto('/character/?id=1111&test=1');
  await expect(page.locator('.banner-name')).toHaveText('Mali');
  await expect(page.locator('.cq-nav [aria-current]')).toHaveCount(0);
  await page.locator('.tb-burger').click();
  await expect(page.locator('[data-mm-action]')).toHaveCount(0);
  await page.locator('[data-mm-theme="dungeon"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dungeon');
  await page.locator('[data-mm-lang="en"]').click();
  await expect(page.locator('#account')).toContainText('Account information');
  await expect(page.locator('.cq-footer')).toContainText('Every expense');
  await expect(page.locator('[data-mm-lang="en"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.tb-burger')).toBeFocused();
  await page.locator('.tb-burger').click();
  await page.locator('[data-mm-tab="compare"]').click();
  await expect(page).toHaveURL(/view=compare&test=1/);
  await expect(page.locator('#compare-view')).toBeVisible();
  await expect(page.locator('.mtabbar [aria-current="page"]')).toHaveAttribute('data-mtab','compare');
  await page.goto('/character/?test=1');
  await expect(page.locator('.search-card')).toBeVisible();
  await expect(page.locator('cq-footer')).toBeVisible();
  await expect(page.locator('.cq-nav a')).toHaveCount(5);
});
