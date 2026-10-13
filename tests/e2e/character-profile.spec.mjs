import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const qa = path.resolve('docs/character-profile-redesign-2026-10-13/qa');
async function fixture(page, { owner = true, populated = true, long = false, dark = false } = {}) {
  await page.addInitScript(({owner,populated,long,dark}) => {
    if (sessionStorage.getItem('character-qa')) return;
    sessionStorage.setItem('character-qa','1');
    localStorage.setItem('lang','th'); localStorage.setItem('pointy_theme', dark ? 'dungeon' : 'tavern');
    const hero = { id:'1111', name:long ? 'มะลินักสำรวจดินแดนมหัศจรรย์และผู้ดูแลปาร์ตี้' : 'Mali', class:'ranger', gender:'female', xp:1500, ownerUid:'character-qa' };
    localStorage.setItem('pointy_auth_v1',JSON.stringify({ uid:owner ? 'character-qa' : 'visitor-qa', userId:owner ? '1111' : '2222', username:'design.demo', name:owner ? 'Mali' : 'Visitor', character:owner ? hero : {id:'2222',name:'Visitor'} }));
    localStorage.setItem('pointy_character_registry_v1',JSON.stringify({'1111':hero}));
    localStorage.setItem('pointy_profile_v1',JSON.stringify({streak:7,bestStreak:12,tourSeen:true}));
    if (!populated) return;
    const names=['Mali','Krit','Mochi'];
    sessionStorage.setItem('pointy_test_trip_9001',JSON.stringify({tripName:'เชียงใหม่ · ปาร์ตี้นักผจญภัย', participants:names, characterIds:{Mali:'1111',Krit:'2222',Mochi:'3333'}, heroClasses:{Mali:'ranger'}, heroGenders:{Mali:'female'}, expenses:[1200,900,1500].map((amount,i)=>({id:i+1,desc:'TEST ค่าใช้จ่าย '+i,amount,paidBy:'Mali',sharedBy:names})), admin:{characterId:'1111',adminName:'Mali',createdAt:1791864000000}, access:{ownerUids:['character-qa'],memberUids:['character-qa']}, updatedAt:1791864000000 }));
  },{owner,populated,long,dark});
}
async function ready(page) {
  await expect(page.locator('.banner-name')).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  await expect.poll(()=>page.locator('.portrait-stage img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBeTruthy();
  await expect.poll(()=>page.locator('.banner').evaluate(el=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(true);img.onerror=()=>resolve(false);img.src=getComputedStyle(el).backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];}))).toBeTruthy();
}
async function capture(page,testInfo,name) {
  await page.screenshot({path:testInfo.outputPath(name),fullPage:true});
  if(process.env.CQ_CHARACTER_SNAPSHOTS==='1') { await fs.mkdir(qa,{recursive:true}); await fs.copyFile(testInfo.outputPath(name),path.join(qa,name)); }
}
async function useEnglish(page) {
  if (page.viewportSize().width <= 600) await page.locator('.cq-lang-compact').click();
  else await page.getByRole('button',{name:'EN',exact:true}).click();
}
for(const width of [1440,768,390]) test(`Character composition and privacy at ${width}px`, async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:width===390?844:1000});await fixture(page);await page.goto('/character/?id=1111&test=1');await ready(page);
  await expect(page.locator('.banner-name')).toHaveText('Mali');await expect(page.locator('.summary')).toContainText('฿3,600');
  await expect(page.locator('.summary')).toContainText('12 วัน'); await expect(page.locator('#account')).toContainText('@design.demo');
  await expect(page.locator('.char-id')).toHaveText('#1111');await expect(page.locator('.badges .got')).toHaveCount(3);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
  if(width===390) expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThan(1450);
  await capture(page,testInfo,`character-${width}.png`);
  if(width===390 && process.env.CQ_CHARACTER_SNAPSHOTS==='1') {
    await page.screenshot({path:path.join(qa,'mobile-top.png')}); await page.evaluate(()=>window.scrollTo({top:document.querySelector('#achievements').getBoundingClientRect().top+scrollY-70,behavior:'instant'}));await page.screenshot({path:path.join(qa,'mobile-middle.png')});await page.locator('#boards').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(qa,'mobile-bottom.png')});
  }
  await page.locator('.mod-split .mod-h').click();await expect(page.locator('#stats-split')).toBeHidden();
  await page.getByRole('button',{name:'ซ่อนยอดเงิน',exact:true}).click();await expect(page.locator('.summary')).toContainText('••••'); await expect(page).toHaveURL(/private=1/);
  await expect(page.locator('#stats-split')).toBeHidden();
  expect(await page.locator('.money').allTextContents()).toEqual(expect.arrayContaining(['••••']));
  expect((await page.locator('.money').allTextContents()).every(s=>s.trim()==='••••')).toBeTruthy();
  await useEnglish(page);await expect(page.locator('html')).toHaveAttribute('lang','en');await expect(page.locator('#account')).toContainText('Account information');
  await expect(page.locator('#stats-split')).toBeHidden();await page.locator('.mod-split .mod-h').click();await expect(page.locator('#stats-split')).toBeVisible();
  if(width<1024) {await page.getByRole('button',{name:'View all →',exact:true}).click();await expect(page.locator('.trophies')).toHaveClass(/show-all/);await expect(page.locator('.tr').last()).toBeVisible();await page.getByRole('button',{name:'Show less ↑',exact:true}).click();}
  await page.reload();await ready(page);await expect(page.locator('.summary')).toContainText('••••');
  await page.getByRole('button',{name:'Show amounts',exact:true}).click();await expect(page.locator('.summary')).toContainText('฿3,600');
  await expect(page.locator('#history a')).toHaveAttribute('href','/trip/?id=9001&test=1');
  await expect(page.locator('.mod-compare .mod-link')).toHaveAttribute('href','/?view=compare&test=1');
  expect(errors).toEqual([]);
});
test('Character board archive is reversible, persists and returns to the board', async({page})=>{
  await fixture(page);await page.goto('/character/?id=1111&test=1');await ready(page);
  const details=page.locator('.board-details'); if(!(await details.getAttribute('open')!==null)) await details.locator('summary').click();
  await page.getByRole('button',{name:/เก็บเข้าคลัง/}).click();await expect(page.locator('.bd-status')).toHaveText('เก็บคลังแล้ว');
  await page.reload();await ready(page);await expect(page.locator('.bd-status')).toHaveText('เก็บคลังแล้ว');
  if(await details.getAttribute('open')===null) await details.locator('summary').click();
  await page.getByRole('button',{name:/นำกลับมา/}).click();await expect(page.locator('.bd-status')).toHaveText('ใช้งานอยู่');
  await page.locator('#history a').click();await expect(page).toHaveURL(/\/trip\/\?id=9001&test=1/);await expect(page.locator('#trip-name-display')).toHaveText('เชียงใหม่ · ปาร์ตี้นักผจญภัย');
});
test('Visitor profile never borrows account activity or ownership controls', async({page})=>{
  await fixture(page,{owner:false});await page.goto('/character/?id=1111&test=1');await ready(page);
  await expect(page.locator('#account')).not.toContainText('Visitor');await expect(page.locator('#account')).not.toContainText('design.demo');
  await expect(page.locator('.summary .rib').nth(2)).toContainText('—');
  if(await page.locator('.board-details').getAttribute('open')===null) await page.locator('.board-details summary').click();
  await expect(page.getByRole('button',{name:/เก็บเข้าคลัง/})).toHaveCount(0);await expect(page.locator('#history a')).toBeVisible();
});
test('Empty long-name profile, dark mode and narrow reflow',async({page},testInfo)=>{
  await fixture(page,{populated:false,long:true,dark:true});await page.setViewportSize({width:390,height:844});await page.goto('/character/?id=1111&test=1');await ready(page);
  await useEnglish(page);
  await expect(page.locator('#history')).toContainText('No boards found');await expect(page.getByRole('link',{name:'Start your first party →'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
  const overlap=await page.locator('.banner-meta').evaluate(el=>el.getBoundingClientRect().bottom>document.querySelector('.hero-level').getBoundingClientRect().top);expect(overlap).toBeFalsy();
  await capture(page,testInfo,'character-mobile-dark-long.png');
  await page.setViewportSize({width:320,height:740});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
});
test('Profile link retains privacy and copy succeeds',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);await fixture(page);await page.goto('/character/?id=1111&test=1&private=1');await ready(page);
  await page.getByRole('button',{name:'คัดลอกลิงก์',exact:true}).click();await expect(page.locator('#copy-profile-btn')).toContainText('คัดลอกแล้ว');
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toContain('private=1');
});
test('Admin return, keyboard disclosures, section navigation and theme stay usable',async({page})=>{
  await fixture(page);await page.setViewportSize({width:768,height:1000});await page.goto('/character/?id=1111&test=1&from=admin&return=%2Fadmin%2F%3Ftest%3D1%26tab%3Dusers');await ready(page);
  await expect(page.getByRole('link',{name:'← กลับ',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'← กลับ',exact:true})).toHaveAttribute('href','/admin/?test=1&tab=users');
  await page.getByRole('link',{name:'รางวัล',exact:true}).click();await expect(page.getByRole('link',{name:'รางวัล',exact:true})).toHaveAttribute('aria-current','location');
  await page.locator('.mod-debt .mod-h').focus();await page.keyboard.press('Enter');await expect(page.locator('#stats-debt')).toBeHidden();await page.keyboard.press('Enter');await expect(page.locator('#stats-debt')).toBeVisible();
  await page.getByRole('button',{name:'สลับธีม',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dungeon');await page.reload();await ready(page);await expect(page.locator('html')).toHaveAttribute('data-theme','dungeon');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.locator('.profile-grid > .panel').evaluateAll(nodes=>nodes.map(n=>n.id))).toEqual(['adventure','achievements','account','profile-tools-panel','history','boards']);
  await page.setViewportSize({width:768,height:1000});await expect(page.locator('.profile-grid > .profile-column')).toHaveCount(2);
});
