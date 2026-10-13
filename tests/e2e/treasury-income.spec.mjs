import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { treasuryFixture } from './helpers/treasury-fixture.mjs';

const evidence = process.env.TREASURY_INCOME_QA_DIR || 'docs/treasury-income-2026-10-14/qa';
const stored = page => page.evaluate(() => PointyScope.getJSON('pointy_treasury_v1', null));
const open = async page => {
  await page.locator('[data-action="income"]').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#income-input')).toBeFocused();
};
async function capture(page, name) {
  fs.mkdirSync(evidence, {recursive:true});
  await page.screenshot({path:`${evidence}/${name}.png`});
}

for (const width of [1440, 768, 390]) {
  test(`Monthly income layout and save ${width}`, async ({page}) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize({width, height:width === 390 ? 844 : width === 768 ? 1024 : 900});
    await treasuryFixture(page);
    const before = await stored(page);
    await open(page);
    await expect(page.getByRole('dialog')).toHaveAccessibleName('ตั้งรายรับของเดือน');
    await expect(page.locator('#income-input')).toHaveValue('45,000');
    expect(await page.locator('.income-crest img').evaluate(i => i.complete && i.naturalWidth > 0)).toBe(true);
    const bounds = await page.locator('.income-dialog').boundingBox();
    expect(bounds.width).toBeLessThanOrEqual(width - 20);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    const save = page.getByRole('button', {name:'บันทึก', exact:true});
    const cancel = page.getByRole('button', {name:'ยกเลิก', exact:true});
    const a = await save.boundingBox(), b = await cancel.boundingBox();
    expect(a.height).toBeGreaterThanOrEqual(44);
    if (width < 768) expect(a.y + a.height).toBeLessThan(b.y);
    else expect(a.y).toBe(b.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await capture(page, `after-${width}`);
    await page.locator('#income-input').fill('50,000.50');
    await save.click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('[data-action="income"]')).toBeFocused();
    await expect(page.locator('#toast.show')).toHaveText('บันทึกรายรับของเดือนแล้ว');
    const after = await stored(page);
    expect(after).toEqual({...before, income:50000.5});
    await expect(page.locator('.stat-remaining .hs-val')).toContainText('35,640.5');
    await expect(page.locator('.stat-spent .hs-val')).toContainText('14,360');
    await page.reload();
    await expect(page.locator('[data-action="income"]')).toBeVisible();
    expect(await stored(page)).toEqual(after);
    await open(page);
    await expect(page.locator('#income-input')).toHaveValue('50,000.5');
    await page.keyboard.press('Escape');
    expect(errors).toEqual([]);
  });
}

test('Monthly income validates amount, allows zero, and formats typed digits', async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await treasuryFixture(page);
  const before = await stored(page);
  await open(page);
  const input = page.locator('#income-input');
  for (const value of ['', '-1', '1e3', '1,23', 'abc', '1.2.3', '12.345', '999999999999999']) {
    await input.fill(value);
    if (value === '-1' || value === 'abc') await expect(input).toHaveValue(value);
    await page.getByRole('button', {name:'บันทึก', exact:true}).click();
    await expect(input).toHaveAttribute('aria-invalid','true');
    await expect(input).toBeFocused();
    await expect(page.locator('#income-error')).toBeVisible();
    await expect(input).toHaveAttribute('aria-describedby','income-example income-error');
    expect(await stored(page)).toEqual(before);
  }
  await input.fill('');
  await input.pressSequentially('50000');
  await expect(input).toHaveValue('50,000');
  await input.pressSequentially('-a');
  await expect(input).toHaveValue('50,000');
  await expect(page.locator('#income-error')).toBeHidden();
  await page.getByRole('button', {name:'ล้างจำนวนเงิน'}).click();
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  await expect(page.getByRole('button', {name:'ล้างจำนวนเงิน'})).toBeDisabled();
  await input.fill('-1');
  await capture(page, 'invalid-1440');
  await input.fill('0');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await stored(page)).toEqual({...before, income:0});
});

test('Monthly income cancellation paths discard edits and preserve focus', async ({page}) => {
  await treasuryFixture(page);
  const before = await stored(page);
  for (const exit of ['cancel','close','escape','backdrop']) {
    await open(page);
    await page.locator('#income-input').fill('123');
    if (exit === 'cancel') await page.getByRole('button', {name:'ยกเลิก', exact:true}).click();
    if (exit === 'close') await page.getByRole('button', {name:'ปิด', exact:true}).click();
    if (exit === 'escape') await page.keyboard.press('Escape');
    if (exit === 'backdrop') await page.mouse.click(5, 5);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('[data-action="income"]')).toBeFocused();
    expect(await stored(page)).toEqual(before);
  }
  await open(page);
  await page.getByRole('button', {name:'ปิด', exact:true}).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', {name:'บันทึก', exact:true})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', {name:'ปิด', exact:true})).toBeFocused();
});

test('Monthly income keeps a failed save editable and retries without losing expenses', async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await treasuryFixture(page);
  const before = await stored(page);
  await open(page);
  await page.locator('#income-input').fill('51000');
  await page.evaluate(() => {
    window.originalIncomeStorage = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key.startsWith('pointy_treasury_v1')) throw new DOMException('Full','QuotaExceededError');
      return window.originalIncomeStorage.call(this,key,value);
    };
  });
  await page.getByRole('button', {name:'บันทึก', exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#income-save-error')).toContainText('บันทึกไม่สำเร็จ');
  await expect(page.locator('#income-input')).toHaveValue('51,000');
  expect(await stored(page)).toEqual(before);
  await capture(page,'save-failure-1440');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalIncomeStorage; });
  await page.getByRole('button', {name:'บันทึก', exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await stored(page)).toEqual({...before, income:51000});
});

test('Monthly income English Dungeon and short mobile viewport', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await treasuryFixture(page);
  await page.evaluate(() => {
    localStorage.setItem('lang','en');
    localStorage.setItem('pointy_theme','dungeon');
  });
  await page.reload();
  await open(page);
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Set monthly income');
  await expect(page.locator('body')).toHaveAttribute('data-theme','dungeon');
  await capture(page,'english-dungeon-390');
  await page.setViewportSize({width:390,height:420});
  await page.locator('#income-input').fill('-1');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect(page.locator('#income-error')).toHaveText('Minimum 0');
  const dialog = await page.getByRole('dialog').boundingBox();
  expect(dialog.y).toBeGreaterThanOrEqual(0);
  expect(dialog.y + dialog.height).toBeLessThanOrEqual(420);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
