import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { treasuryFixture as fixture } from './helpers/treasury-fixture.mjs';

const evidence = process.env.TREASURY_QA_DIR || 'docs/treasury-redesign-2026-10-13/qa';
async function noOverflow(page) {
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
}
for (const width of [1440,768,390]) {
  test(`Treasury visual ${width}`, async ({page})=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.setViewportSize({width,height:width===390?844:1000});
    await fixture(page);await noOverflow(page);
    fs.mkdirSync(evidence,{recursive:true});
    await page.screenshot({path:`${evidence}/${process.env.TREASURY_CAPTURE_BEFORE?'before':'after'}-${width}.png`,fullPage:true});
    if (!process.env.TREASURY_CAPTURE_BEFORE) {
      expect(await page.locator('.tr-art').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0))).toBeTruthy();
      await page.locator('[data-profile-hub="theme"]').click();
      await page.locator(width===390?'.cq-lang-compact':'.lang-btn[data-lang="en"]').click();
      await expect(page.locator('html')).toHaveAttribute('data-theme','dungeon');
      await noOverflow(page);
      await page.screenshot({path:`${evidence}/dark-en-${width}.png`,fullPage:true});
    }
    expect(errors).toEqual([]);
  });
}

const stored = page => page.evaluate(()=>JSON.parse(localStorage.getItem('pointy_treasury_v1')));
async function expand(page,id) {
  if (!await page.locator('#section-'+id).getAttribute('open').then(v=>v!==null)) await page.locator('#section-'+id+'>summary').click();
}
for (const width of [1440,390]) {
  test('Treasury forms validate, save and reopen at '+width,async({page})=>{
    await page.setViewportSize({width,height:900});await fixture(page);
    await page.locator('[data-action="income"]').click();
    await expect(page.locator('#income-input')).toBeFocused();
    await page.locator('#income-input').fill('-1');
    await page.locator('.modal .btn-primary').click();
    await expect(page.locator('#income-input')).toHaveAttribute('aria-invalid','true');
    expect((await stored(page)).income).toBe(45000);
    await page.locator('#income-input').fill('50,000');
    await page.locator('.modal .btn-primary').click();
    await expect(page.locator('[data-action="income"]')).toBeFocused();
    await expand(page,'wards');
    await page.locator('.category-add[data-action="category"]').click();
    await page.locator('.modal .btn-primary').click();
    await expect(page.locator('#cat-name')).toHaveAttribute('aria-invalid','true');
    await page.locator('#cat-name').fill('TEST งบศูนย์');
    await page.locator('#cat-budget').fill('0');
    await page.locator('.modal .btn-primary').click();
    const id = (await stored(page)).categories.find(c=>c.name.th==='TEST งบศูนย์').id;
    const card = page.locator('[data-category-id="'+id+'"]');
    if (width<1100) await card.locator('summary').click();
    await expect(card.locator('.ward-nums')).toContainText('฿0 / ฿0');
    await card.locator('[data-action="category"]').click();
    await expect(page.locator('#cat-budget')).toHaveValue('0');
    await page.keyboard.press('Escape');
    await expect(card.locator('[data-action="category"]')).toBeFocused();
    await card.locator('[data-action="expense"]').click();
    await expect(page.locator('#expense-cat')).toHaveValue(id);
    await page.locator('#expense-amount').fill('0');
    await page.locator('.modal .btn-primary').click();
    await expect(page.locator('#expense-amount')).toHaveAttribute('aria-invalid','true');
    await page.locator('#expense-amount').fill('123.456');
    await page.locator('.modal .btn-primary').click();
    await expect(page.locator('#expense-amount')).toHaveAttribute('aria-invalid','true');
    await page.locator('#expense-amount').fill('123.45');
    await page.locator('#expense-date').fill('2026-09-12');
    await page.locator('.modal .btn-primary').click();
    await expect(page.locator('#expense-date')).toHaveAttribute('aria-invalid','true');
    await page.locator('#expense-date').fill('2026-10-13');
    await expect(page.locator('.modal-feedback')).toHaveCount(0);
    await page.locator('#expense-note').fill('TEST ขนม');
    await noOverflow(page);
    await page.screenshot({path:evidence+'/form-'+width+'.png'});
    await page.locator('.modal .btn-primary').click();
    await expect(page.locator('dialog')).toHaveCount(0);
    await expect(card).toHaveClass(/breached/);
    await page.locator('[data-filter="over"]').click();
    await expect(page.locator('.ward-card')).toHaveCount(1);
    await page.locator('[data-filter="near"]').click();
    await expect(page.locator('.empty-state')).toContainText('ไม่มีหมวด');
    await page.reload();
    const s = await stored(page);
    expect(s.income).toBe(50000);
    expect(s.expenses.filter(e=>e.note==='TEST ขนม')).toEqual([expect.objectContaining({amount:123.45,catId:id,date:'2026-10-13'})]);
    await noOverflow(page);
  });
}

test('Treasury bills validate, record once and persist',async({page})=>{
  await fixture(page);await expand(page,'bills');
  await page.locator('.category-add[data-action="bill"]').click();
  await page.locator('#bill-name').fill('TEST ค่าไฟ');
  await page.locator('#bill-amount').fill('1000');
  await page.locator('#bill-due').fill('32');
  await page.locator('.modal .btn-primary').click();
  await expect(page.locator('#bill-due')).toHaveAttribute('aria-invalid','true');
  await page.locator('#bill-due').fill('20');
  await page.locator('.modal .btn-primary').click();
  const s = await stored(page), id = s.bills.find(b=>b.name.th==='TEST ค่าไฟ').id;
  await page.locator('[data-action="pay"][data-id="'+id+'"]').click();
  expect((await stored(page)).expenses.filter(e=>e.billId===id)).toHaveLength(1);
  await expect(page.locator('[data-action="pay"][data-id="'+id+'"]')).toHaveCount(0);
  await page.reload();await expand(page,'bills');
  await expect(page.locator('.bill-row').filter({hasText:'TEST ค่าไฟ'})).toContainText('จ่ายแล้ว');
  await page.locator('[data-action="bill"][data-id="'+id+'"]').click();
  await page.locator('#bill-name').fill('TEST ค่าไฟใหม่');
  await page.locator('.modal .btn-primary').click();
  expect((await stored(page)).bills.find(b=>b.id===id).name.th).toBe('TEST ค่าไฟใหม่');
});

test('Treasury history browsing never replaces active data; close and clear are truthful',async({page})=>{
  await fixture(page);
  const before = await stored(page);
  await page.locator('[data-month-step="-1"]').click();
  await expect(page.locator('.historical-month')).toContainText('เดือนกันยายน');
  expect(await stored(page)).toEqual(before);
  await page.locator('[data-month-step="-1"]').click();
  await expect(page.locator('.historical-month')).toContainText('มีเฉพาะยอดสรุป');
  await expect(page.locator('[data-month-step="-1"]')).toBeDisabled();
  await page.locator('.historical-heading [data-action="current"]').click();
  await expand(page,'history');
  page.once('dialog',d=>d.accept());
  await page.locator('[data-action="close-month"]').click();
  expect((await stored(page)).history[0]).toEqual(expect.objectContaining({month:'2026-10',spent:14360,expenses:before.expenses}));
  page.once('dialog',d=>d.accept());
  await page.locator('[data-action="reset"]').click();
  const cleared = await stored(page);
  expect(cleared.expenses).toEqual([]);expect(cleared.categories).toEqual([]);expect(cleared.bills).toEqual([]);expect(cleared.income).toBe(0);
  await page.locator('[data-action="expense"]:visible').first().click();
  await expect(page.locator('#cat-name')).toBeVisible();
  await page.keyboard.press('Escape');
  await noOverflow(page);
});

test('Treasury responsive disclosures and keyboard dialog remain usable',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await fixture(page);
  await expect(page.locator('#section-wards')).toHaveAttribute('open','');
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('#section-wards')).not.toHaveAttribute('open','');
  await expand(page,'wards');
  await page.locator('[data-category-id="food"]>summary').click();
  await expect(page.locator('[data-category-id="food"] .ward-content')).toBeVisible();
  await page.locator('[data-category-id="food"] [data-action="expense"]').click();
  for (let i=0;i<12;i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(()=>document.activeElement.closest('dialog')!==null)).toBeTruthy();
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-category-id="food"] [data-action="expense"]')).toBeFocused();
  await noOverflow(page);
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:evidence+'/mobile-expanded.png',fullPage:true,animations:'disabled'});
});
