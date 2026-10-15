import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { treasuryFixture } from './helpers/treasury-fixture.mjs';

const evidence = 'docs/treasury-category-2026-10-14/qa';
const stored = page => page.evaluate(() => PointyScope.getJSON('pointy_treasury_v1', null));
const save = page => page.locator('.category-form button[type="submit"]').click();
async function open(page, id = '') {
  const wards = page.locator('#section-wards');
  if (await wards.getAttribute('open') === null) await wards.locator(':scope > summary').click();
  if (id) {
    const card = page.locator(`[data-category-id="${id}"]`);
    if (await card.getAttribute('open') === null) await card.locator(':scope > summary').click();
    await card.locator('[data-action="category"]').click();
  } else await page.locator('.category-add[data-action="category"]').click();
  await expect(page.locator('#cat-name')).toBeFocused();
}
async function capture(page, name) {
  fs.mkdirSync(evidence, {recursive:true});
  await page.screenshot({path:`${evidence}/${name}.png`});
}
async function storageFailure(page, enabled) {
  await page.evaluate(enabled => {
    if (!enabled) {Storage.prototype.setItem = window.categoryOriginalStorage;return;}
    window.categoryOriginalStorage = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key,value) {
      if (key.startsWith('pointy_treasury_v1')) throw new DOMException('Full','QuotaExceededError');
      return window.categoryOriginalStorage.call(this,key,value);
    };
  }, enabled);
}

for (const width of [1440,768,390]) {
  test(`Treasury category add and edit persist at ${width}`, async ({page}) => {
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.setViewportSize({width,height:width===390?844:width===768?1024:900});
    await treasuryFixture(page);
    const before=await stored(page);
    await open(page);
    await expect(page.getByRole('dialog')).toHaveAccessibleName('เพิ่มหมวด');
    await expect(page.locator('.cat-delete')).toHaveCount(0);
    await page.locator('#cat-name').fill('กินดื่ม');
    await page.locator('#cat-budget').fill('9000');
    await page.locator('#cat-monster-type').focus();
    await expect(page.locator('#cat-budget')).toHaveValue('9,000');
    expect(await page.locator('.cat-monster-select img').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
    const bounds=await page.getByRole('dialog').boundingBox();
    expect(bounds.width).toBeLessThanOrEqual(width-16);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    if(width>=1024) await expect(page.locator('.cat-preview')).toBeVisible();
    else await expect(page.locator('.cat-preview')).toBeHidden();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await capture(page,`add-${width}`);
    await save(page);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const added=await stored(page), category=added.categories.at(-1);
    expect(category).toMatchObject({name:{th:'กินดื่ม',en:'กินดื่ม'},budget:9000,glyph:'🍜',monster:{th:'สไลม์',en:'Slime'}});
    expect(added).toEqual({...before,categories:[...before.categories,category]});
    await open(page,category.id);
    await expect(page.getByRole('dialog')).toHaveAccessibleName('แก้ไขหมวดหมู่');
    await expect(page.locator('#cat-monster-type')).toHaveValue('slime');
    await page.locator('#cat-monster-type').focus();
    const buttons=await page.locator('.cat-actions button').evaluateAll(nodes=>nodes.map(n=>({x:n.getBoundingClientRect().x,y:n.getBoundingClientRect().y,h:n.getBoundingClientRect().height})));
    expect(buttons.every(b=>b.h>=44)).toBe(true);
    expect(new Set(buttons.map(b=>b.y)).size).toBe(1);
    await capture(page,`edit-${width}`);
    await page.locator('#cat-name').fill('อาหารและเครื่องดื่ม');
    await page.locator('#cat-budget').fill('10500.50');
    await page.getByRole('radio',{name:'บ้าน',exact:true}).check();
    await save(page);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.reload();
    const after=await stored(page);
    expect(after.categories.find(c=>c.id===category.id)).toMatchObject({name:{th:'อาหารและเครื่องดื่ม',en:'อาหารและเครื่องดื่ม'},budget:10500.5,glyph:'🏠'});
    expect({...after,categories:before.categories}).toEqual(before);
    await open(page,category.id);
    await expect(page.locator('#cat-budget')).toHaveValue('10,500.5');
    await expect(page.getByRole('radio',{name:'บ้าน',exact:true})).toBeChecked();
    expect(errors).toEqual([]);
  });
}

test('Treasury category rejects invalid input and saves a zero allocation', async ({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await treasuryFixture(page);const before=await stored(page);await open(page);
  await save(page);
  await expect(page.locator('#cat-name')).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('#cat-name')).toBeFocused();
  await page.locator('#cat-name').fill('  ');await save(page);
  await expect(page.locator('#cat-name-error')).toBeVisible();
  await page.locator('#cat-name').fill('ศูนย์บาท');
  for(const value of ['','-1','abc','1e3','1,23','1.2.3','12.345','999999999999999']) {
    await page.locator('#cat-budget').fill(value);await save(page);
    await expect(page.locator('#cat-budget')).toHaveAttribute('aria-invalid','true');
    await expect(page.locator('#cat-budget')).toBeFocused();
    await expect(page.locator('#cat-budget-error')).toBeVisible();
    expect(await stored(page)).toEqual(before);
  }
  await page.locator('#cat-budget').fill('-1');await capture(page,'invalid-1440');
  await page.getByRole('button',{name:'ล้างวงเงิน',exact:true}).click();
  await expect(page.locator('#cat-budget')).toHaveValue('');
  await expect(page.locator('#cat-budget')).toBeFocused();
  await expect(page.getByRole('button',{name:'ล้างวงเงิน',exact:true})).toBeDisabled();
  await page.locator('#cat-budget').pressSequentially('9000-a');
  await expect(page.locator('#cat-budget')).toHaveValue('9,000');
  await page.locator('#cat-budget').fill('0');await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await stored(page)).categories.at(-1).budget).toBe(0);
});

test('Treasury category retains legacy custom names, translations and icons', async ({page})=>{
  await page.setViewportSize({width:390,height:844});await treasuryFixture(page);
  await page.evaluate(()=>{
    const s=PointyScope.getJSON('pointy_treasury_v1');
    s.categories[0].glyph='🦉';s.categories[0].monster={th:'ผู้พิทักษ์บ้าน',en:'House guardian'};
    s.categories[0].customMetadata='preserve';PointyScope.setJSON('pointy_treasury_v1',s);
  });
  await page.reload();const before=await stored(page);await open(page,'home');
  await expect(page.getByRole('radio',{name:'ไอคอนเดิม',exact:true})).toBeChecked();
  await expect(page.locator('#cat-monster')).toHaveValue('ผู้พิทักษ์บ้าน');
  await save(page);await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await stored(page)).toEqual(before);
  await open(page,'home');
  await page.getByRole('button',{name:'ไอคอนเพิ่มเติม',exact:true}).click();
  await page.getByRole('radio',{name:'สัตว์เลี้ยง',exact:true}).check();
  await page.locator('#cat-monster').fill('เพื่อนสี่ขา');await save(page);
  const changed=(await stored(page)).categories[0];
  expect(changed).toEqual({...before.categories[0],glyph:'🐾',monster:{th:'เพื่อนสี่ขา',en:'เพื่อนสี่ขา'}});
  await open(page,'home');
  await expect(page.getByRole('radio',{name:'สัตว์เลี้ยง',exact:true})).toBeVisible();
  await expect(page.getByRole('radio',{name:'สัตว์เลี้ยง',exact:true})).toBeChecked();
  await capture(page,'custom-expanded-390');
});

test('Treasury category cancels drafts and keeps keyboard focus in the dialog', async ({page})=>{
  await treasuryFixture(page);const before=await stored(page);
  for(const exit of ['cancel','close','escape','backdrop']) {
    await open(page,'food');await page.locator('#cat-name').fill('ยังไม่บันทึก');
    if(exit==='cancel')await page.getByRole('button',{name:'ยกเลิก',exact:true}).click();
    if(exit==='close')await page.getByRole('button',{name:'ปิด',exact:true}).click();
    if(exit==='escape')await page.keyboard.press('Escape');
    if(exit==='backdrop')await page.mouse.click(5,5);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.ward-edit[data-action="category"][data-id="food"]')).toBeFocused();
    expect(await stored(page)).toEqual(before);
  }
  await open(page);
  await page.getByRole('radio',{name:'อาหาร',exact:true}).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio',{name:'บ้าน',exact:true})).toBeChecked();
  await page.getByRole('button',{name:'ปิด',exact:true}).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button',{name:'บันทึก',exact:true})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button',{name:'ปิด',exact:true})).toBeFocused();
});

test('Treasury category deletion confirms destination and preserves expenses and bills', async ({page})=>{
  await page.setViewportSize({width:1440,height:900});await treasuryFixture(page);
  const before=await stored(page);await open(page,'home');
  await page.locator('#cat-name').fill('ชื่อที่ยังไม่บันทึก');
  await page.locator('.cat-delete').click();
  await expect(page.locator('.cat-delete-confirm')).toContainText('ย้าย 1 รายจ่าย และ 2 บิล ไปที่ “อาหาร & เครื่องดื่ม”');
  await expect(page.getByRole('button',{name:'เก็บหมวดไว้',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'เก็บหมวดไว้',exact:true}).click();
  await expect(page.locator('#cat-name')).toHaveValue('ชื่อที่ยังไม่บันทึก');
  expect(await stored(page)).toEqual(before);
  await page.locator('.cat-delete').click();await capture(page,'delete-confirm-1440');
  await storageFailure(page,true);
  await page.getByRole('button',{name:'ยืนยันลบหมวด',exact:true}).click();
  await expect(page.locator('.cat-delete-confirm [role="alert"]')).toContainText('ลบหมวดไม่สำเร็จ');
  expect(await stored(page)).toEqual(before);
  await storageFailure(page,false);
  await page.getByRole('button',{name:'ยืนยันลบหมวด',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.category-add[data-action="category"]')).toBeFocused();
  await page.reload();
  expect(await stored(page)).toEqual({...before,categories:before.categories.filter(c=>c.id!=='home'),expenses:before.expenses.map(e=>e.catId==='home'?{...e,catId:'food'}:e),bills:before.bills.map(b=>b.catId==='home'?{...b,catId:'food'}:b)});
  await expect(page.locator('.stat-spent .hs-val')).toContainText('14,360');
});

test('Treasury category cannot delete the final category', async ({page})=>{
  await treasuryFixture(page);
  await page.evaluate(()=>{
    const s=PointyScope.getJSON('pointy_treasury_v1');s.categories=s.categories.slice(0,1);
    s.expenses=s.expenses.map(e=>({...e,catId:'home'}));s.bills=s.bills.map(b=>({...b,catId:'home'}));
    PointyScope.setJSON('pointy_treasury_v1',s);
  });
  await page.reload();await open(page,'home');
  await expect(page.locator('.cat-delete')).toBeDisabled();
  await expect(page.locator('#cat-delete-help')).toContainText('ไม่สามารถลบหมวดสุดท้ายได้');
});

test('Treasury category keeps failed saves editable and creates only one category on retry', async ({page})=>{
  await treasuryFixture(page);const before=await stored(page);await open(page);
  await page.locator('#cat-name').fill('งบวันหยุด');await page.locator('#cat-budget').fill('1234.50');
  await storageFailure(page,true);await save(page);
  await expect(page.locator('#cat-save-error')).toContainText('บันทึกไม่สำเร็จ');
  await expect(page.locator('#cat-name')).toHaveValue('งบวันหยุด');
  await expect(page.locator('#cat-budget')).toHaveValue('1,234.50');
  expect(await stored(page)).toEqual(before);await capture(page,'save-failure-1280');
  await storageFailure(page,false);await save(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const after=await stored(page);
  expect(after.categories).toHaveLength(before.categories.length+1);
  expect(after.categories.at(-1)).toMatchObject({name:{th:'งบวันหยุด',en:'งบวันหยุด'},budget:1234.5});
  expect({...after,categories:before.categories}).toEqual(before);
});

test('Treasury category English Dungeon, custom option and short mobile viewport', async ({page})=>{
  await page.setViewportSize({width:390,height:844});await treasuryFixture(page);
  await page.evaluate(()=>{localStorage.setItem('lang','en');localStorage.setItem('pointy_theme','dungeon');});
  await page.reload();await open(page,'food');
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Edit category');
  await page.locator('#cat-monster-type').selectOption('slime');
  await expect(page.locator('#cat-monster')).toBeDisabled();
  await capture(page,'english-dungeon-390');
  await page.setViewportSize({width:390,height:420});
  await page.locator('#cat-monster-type').selectOption('custom');
  await page.locator('#cat-monster').fill('A very long name for a friendly guardian of the monthly food budget');
  await page.getByRole('button',{name:'More icons',exact:true}).click();
  await page.getByRole('radio',{name:'Pets',exact:true}).check();
  await page.locator('#cat-budget').fill('-1');await save(page);
  await expect(page.locator('#cat-budget-error')).toHaveText('Minimum 0');
  const bounds=await page.getByRole('dialog').boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(420);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#cat-budget').fill('9500');await save(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await stored(page)).categories.find(c=>c.id==='food').budget).toBe(9500);
});
