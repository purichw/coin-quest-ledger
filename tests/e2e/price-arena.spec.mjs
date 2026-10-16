import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const evidence = process.env.PRICE_QA_DIR || 'docs/price-arena-redesign-2026-10-13/qa';
async function fixture(page) {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('price-design-fixture')) return;
    sessionStorage.setItem('price-design-fixture', '1');
    localStorage.setItem('lang', 'th');
    localStorage.setItem('pointy_theme', 'tavern');
    localStorage.setItem('pointy_profile_v1', JSON.stringify({ tourSeen: true }));
    localStorage.setItem('pointy_compare_v2', JSON.stringify([
      { id: 'milk', name: 'นมจืด UHT', icon: '🥛', baseUnit: 'ml', offers: [
        { id: 'milk1', merchant: 'ไฮเปอร์มาร์เก็ต', price: 59, qty: 1.5, unit: 'l', buy: 1, free: 0 },
        { id: 'milk2', merchant: 'ซูเปอร์มาร์เก็ต', price: 42, qty: 1, unit: 'l', buy: 1, free: 0 },
        { id: 'milk3', merchant: 'ร้านสะดวกซื้อ', price: 18, qty: 180, unit: 'ml', buy: 1, free: 0 }
      ] },
      { id: 'tissue', name: 'กระดาษทิชชู', icon: '🧻', baseUnit: 'ชิ้น', offers: [
        { id: 'tissue1', merchant: 'ร้าน A', price: 79, qty: 6, unit: 'ชิ้น', buy: 1, free: 0 },
        { id: 'tissue2', merchant: 'ร้าน B · ซื้อ 2 แถม 1', price: 35, qty: 1, unit: 'ชิ้น', buy: 2, free: 1 },
        { id: 'tissue3', merchant: 'ร้าน C', price: 25, qty: 1, unit: 'ชิ้น', buy: 1, free: 0 }
      ] }
    ]));
  });
  await page.goto('/?view=compare&test=1');
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await expect(page.locator('.cmp-name')).toHaveCount(2);
  await page.evaluate(() => document.fonts.ready);
}
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
}
for (const width of [1440, 768, 390]) {
  test(`Price visual ${width}`, async ({ page }) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await fixture(page); await noOverflow(page);
    if (!process.env.PRICE_CAPTURE_BEFORE) {
      expect(await page.locator('.arena-hero').evaluate(async el => { const url = getComputedStyle(el).backgroundImage.match(/url\("?([^"\)]+)"?\)/)[1]; const img = new Image(); img.src = url; await img.decode(); return img.naturalWidth > 0; })).toBeTruthy();
      await expect(page.locator('.cmp-card').first().locator('.offer-row').first().locator('.of-pu')).toContainText('฿0.039');
      if (width === 390) {
        await expect(page.locator('.cmp-card').first().locator('.offer-row').nth(1)).toBeHidden();
      }
    }
    fs.mkdirSync(evidence, { recursive: true });
    await page.screenshot({ path: `${evidence}/${process.env.PRICE_CAPTURE_BEFORE ? 'before' : 'after'}-${width}.png`, fullPage: true });
    if (!process.env.PRICE_CAPTURE_BEFORE) {
      await page.locator('[data-profile-hub="theme"]').click();
      await page.locator(width === 390 ? '.cq-lang-compact' : '.lang-btn[data-lang="en"]').click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dungeon');
      await noOverflow(page);
      await page.screenshot({ path: `${evidence}/dark-en-${width}.png`, fullPage: true });
    }
    expect(errors).toEqual([]);
  });
}

for (const width of [1440, 390]) {
  test(`Price create, validate, edit, save and reopen at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await fixture(page);
    await page.locator('.arena-new').click();
    await expect(page.locator('#new-name')).toBeFocused();
    await page.locator('.form-actions .btn-primary').click();
    await expect(page.locator('#new-name')).toHaveAttribute('aria-invalid','true');
    await page.locator('#new-name').fill('TEST สบู่');
    await page.locator('#new-unit').selectOption('g');
    await page.locator('.icon-btn').click();
    await page.locator('.icon-opt', { hasText: 'ผงซักฟอก' }).click();
    await expect(page.locator('#new-name')).toHaveValue('TEST สบู่');
    await expect(page.locator('#new-unit')).toHaveValue('g');
    await page.locator('.form-actions .btn-primary').click();
    await expect(page.locator('#arena-dialog')).toBeVisible();
    const card = page.locator('.cmp-card').filter({ has: page.locator('.cmp-name', { hasText: 'TEST สบู่' }) });
    const id = await card.getAttribute('data-product-id');
    const input = (slot,field) => page.locator(`#draft-${id}-${slot}-${field}`);
    const save = page.locator('.offer-actions .btn-primary');
    await expect(input(1,'price')).toBeDisabled();
    await input(0,'merchant').fill('ร้าน A');
    await input(0,'price').fill('-1'); await input(0,'qty').fill('850');
    await expect(save).toBeDisabled();
    await input(0,'price').fill('200.001'); await expect(save).toBeDisabled();
    await input(0,'price').fill('200');
    await input(0,'qty').fill('0'); await expect(save).toBeDisabled();
    await input(0,'qty').fill('850');
    await expect(input(1,'price')).toBeEnabled();
    await input(1,'merchant').fill('ร้าน B');
    await input(1,'price').fill('100'); await expect(save).toBeDisabled();
    await input(1,'qty').fill('300');
    await expect(save).toBeEnabled();
    await noOverflow(page);
    await page.screenshot({ path: `${evidence}/form-${width}.png` });
    await save.click();
    await expect(page.locator('#arena-dialog')).not.toBeVisible();
    await expect(card.locator('.card-menu summary')).toBeFocused();
    await expect(card.locator('.offer-row').first()).toContainText('ร้าน A');
    await expect(card.locator('.offer-row').first().locator('.of-pu')).toContainText('฿0.24');
    if (width === 390) await card.locator('.offer-disclosure').click();
    await card.locator('.offer-row').nth(1).click();
    await page.locator('.draft-slot input[id$="-price"]').fill('50');
    await save.click();
    await expect(card.locator('.offer-row').first()).toContainText('ร้าน B');
    await card.locator('.card-menu summary').click();
    await card.getByRole('button',{name:'แก้ไขสินค้า',exact:true}).click();
    await expect(page.locator('#new-unit')).toBeDisabled();
    await page.locator('#new-name').fill('TEST สบู่ใหม่');
    await page.locator('.form-actions .btn-primary').click();
    await page.reload();
    const saved = page.locator(`.cmp-card[data-product-id="${id}"]`);
    await expect(saved.locator('.cmp-name')).toHaveText('TEST สบู่ใหม่');
    await expect(saved.locator('.offer-row').first()).toContainText('ร้าน B');
    await saved.locator('.offer-row').first().click();
    await page.locator('.remove-offer summary').click();
    await page.locator('.remove-offer .btn-danger').click();
    await expect(saved.locator('.offer-row')).toHaveCount(1);
    await expect(saved.locator('.offer-row').first()).toContainText('ร้าน A');
    await noOverflow(page);
  });
}

test('Price filter, search, sort, archive and restore preserve offers', async ({ page }) => {
  await fixture(page);
  await page.locator('#arena-query').fill('ไม่มีสินค้า');
  await expect(page.locator('.cmp-card')).toHaveCount(0);
  await expect(page.locator('#cmp-empty')).toContainText('ไม่พบสินค้า');
  await page.locator('#cmp-empty button').click();
  await page.locator('#arena-sort').selectOption('saving');
  await expect(page.locator('.cmp-name').first()).toHaveText('นมจืด UHT');
  await page.locator('#arena-sort').selectOption('name');
  await expect(page.locator('.cmp-name').first()).toHaveText('กระดาษทิชชู');
  const card = page.locator('[data-product-id="milk"]');
  await card.locator('.card-menu summary').click();
  await card.getByRole('button',{name:'เก็บสินค้า',exact:true}).click();
  await expect(page.locator('.cmp-card')).toHaveCount(1);
  await page.locator('.arena-filters button').nth(2).click();
  await expect(card).toBeVisible();
  await expect(card.locator('.offer-row')).toHaveCount(3);
  await card.getByRole('button',{name:'นำกลับมา',exact:true}).click();
  await page.locator('.arena-filters button').first().click();
  await expect(page.locator('.cmp-card')).toHaveCount(2);
  await page.reload();
  await expect(card.locator('.offer-row')).toHaveCount(3);
});

test('Price pack promotions, ties, long content and keyboard modal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await fixture(page);
  await page.locator('.arena-help').click();
  await expect(page.locator('#arena-dialog')).toContainText('ราคาต่อหน่วย');
  await page.keyboard.press('Escape');
  await expect(page.locator('.arena-help')).toBeFocused();
  const card = page.locator('[data-product-id="tissue"]');
  await card.locator('.card-menu summary').click();
  await card.getByRole('button',{name:'เพิ่มตัวเลือก',exact:true}).click();
  await page.locator('#draft-tissue-0-merchant').fill('ชื่อร้านยาวมากเพื่อทดสอบการตัดบรรทัดและการแสดงผลบนมือถือ');
  await page.locator('#draft-tissue-0-price').fill('60');
  await page.locator('#draft-tissue-0-qty').fill('1');
  await page.locator('#draft-tissue-0-unit').selectOption('แพ็ค/กล่อง');
  await page.locator('#draft-tissue-0-pack').fill('2.5');
  await expect(page.locator('.offer-actions .btn-primary')).toBeDisabled();
  await page.locator('#draft-tissue-0-pack').fill('6');
  await page.locator('.btn-chip').first().click();
  await page.locator('#draft-tissue-0-buy').fill('2');
  await page.locator('#draft-tissue-0-free').fill('-1');
  await expect(page.locator('.offer-actions .btn-primary')).toBeDisabled();
  await page.locator('#draft-tissue-0-free').fill('1');
  await page.locator('.offer-actions .btn-primary').click();
  await expect(card.locator('.offer-row').first().locator('.of-pu')).toContainText('฿6.67');
  await noOverflow(page);
  // Seed an equal-value edge state through the same persistence owner, then render the real UI.
  await page.evaluate(() => {
    const items = window.PointyScope.getJSON('pointy_compare_v2',[]);
    items[0].offers = [{id:'a',merchant:'A',price:10,qty:100,unit:'ml'}, {id:'b',merchant:'B',price:100,qty:1,unit:'l'}];
    window.PointyScope.setJSON('pointy_compare_v2',items);
  });
  await page.reload();
  await expect(page.locator('[data-product-id="milk"] .champion-ribbon')).toHaveCount(0);
  await expect(page.locator('[data-product-id="milk"] .of-tag').first()).toHaveText(/เท่ากัน/);
  await page.locator('[data-product-id="milk"] .offer-disclosure').click();
  await expect(page.locator('[data-product-id="milk"] .offer-row').nth(1)).toBeVisible();
  await noOverflow(page);
});
