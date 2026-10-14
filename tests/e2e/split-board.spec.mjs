import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

async function fixture(page, populated = true) {
  await page.addInitScript(populated => {
    if (sessionStorage.getItem('board-fixture')) return;
    sessionStorage.setItem('board-fixture', '1');
    const names = ['Pointy', 'Krit', 'Mochi', 'Guest 1'];
    const hero = { id: '7777', name: 'Pointy', class: 'seraph', cls: 'seraph', gender: 'female' };
    localStorage.setItem('pointy_auth_v1', JSON.stringify({ uid: 'board-qa', username: 'board.qa', userId: hero.id, name: hero.name, character: hero }));
    localStorage.setItem('pointy_character_registry_v1', JSON.stringify({ '7777': hero }));
    localStorage.setItem('lang', 'th'); localStorage.setItem('pointy_theme', 'tavern');
    localStorage.setItem('pointy_profile_v1', JSON.stringify({ streak: 2, tourSeen: true, lastVisit: new Date().toISOString().slice(0, 10) }));
    const expenses = [
      ['อาหารเย็น ร้านริมปิง', 1200, { Pointy: 1200 }], ['ที่พัก (คืนที่ 2)', 4800, { Krit: 3800, Mochi: 1000 }],
      ['เช่ารถตู้เที่ยวดอย', 3000, { Pointy: 3000 }], ['กาแฟยามเช้า', 650, { Mochi: 650 }], ['ของฝากและอาหารกลางวัน', 2800, { 'Guest 1': 2000, Mochi: 800 }],
    ].map(([desc, amount, payers], i) => ({ id: 'fixture-' + i, desc, amount, payers, paidBy: Object.keys(payers)[0], sharedBy: names, date: `2026-10-${13-i}`, icon: '🍜' }));
    sessionStorage.setItem('pointy_test_trip_4821', JSON.stringify({ tripName: 'ทริปเชียงใหม่ 2026', participants: names, heroClasses: { Pointy:'seraph', Krit:'warrior', Mochi:'wizard', 'Guest 1':'engineer' }, heroGenders: { Pointy:'female', Krit:'male', Mochi:'female', 'Guest 1':'male' }, characterIds: { Pointy:'7777', Krit:'7778', Mochi:'7779' }, guestHeroes: { 'Guest 1':true }, expenses: populated ? expenses : [], settings: { animations:false, sound:false, entry:'form', stats:true }, admin: { createdAt:1791540000000 }, access: { ownerUids:['board-qa'], memberUids:['board-qa'] } }));
  }, populated);
}
async function ready(page) {
  await expect(page.locator('#trip-name-display')).toHaveText('ทริปเชียงใหม่ 2026');
  await expect(page.locator('#party-count')).toHaveText('4');
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.locator('.portrait-img').evaluateAll(imgs => imgs.every(img => img.complete && img.naturalWidth > 0))).toBeTruthy();
}
async function capture(page, testInfo, name) {
  await page.evaluate(() => window.scrollTo(0,0));
  await page.screenshot({ path: testInfo.outputPath(name), fullPage:true });
  if (process.env.CQ_BOARD_SNAPSHOTS === '1') {
    const dir = path.resolve('docs/split-board-redesign-2026-10-13/qa');
    await fs.mkdir(dir,{recursive:true}); await fs.copyFile(testInfo.outputPath(name),path.join(dir,name));
  }
}
for (const width of [1440,768,390]) test(`Party board composition and saved expense at ${width}px`, async ({ page }, testInfo) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height:width === 390 ? 844 : 1000 });
  await fixture(page); await page.goto('/trip/?id=4821&test=1'); await ready(page);
  await expect(page.locator('#party-total')).toHaveText('฿12,450');
  await expect(page.locator('.board-table tbody tr')).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  await capture(page,testInfo,`board-${width}.png`);
  if (width === 390 && process.env.CQ_BOARD_SNAPSHOTS === '1') {
    const dir = path.resolve('docs/split-board-redesign-2026-10-13/qa');
    await page.screenshot({path:path.join(dir,'board-mobile-top.png')});
    await page.locator('#entry-section').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(dir,'board-mobile-form.png')});
    await page.locator('#settle-panel').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(dir,'board-mobile-bottom.png')});
  }
  if (width === 390) await page.locator('.board-disclosure[data-board-collapse="board-log-content"]').click();
  await page.locator('#board-log-search').fill('กาแฟ'); await expect(page.locator('.board-table tbody tr')).toHaveCount(1);
  await page.locator('#board-log-search').fill('no such expense'); await expect(page.locator('[data-board-clear-filter]')).toBeVisible();
  await page.locator('[data-board-clear-filter]').click(); await expect(page.locator('.board-table tbody tr')).toHaveCount(5);
  await page.locator('#board-log-filter').selectOption('Krit'); await expect(page.locator('.board-table tbody tr')).toHaveCount(1);
  await page.locator('#board-log-filter').selectOption('');
  await expect(page.locator('[data-board-details]')).toHaveCount(0);
  for (const card of await page.locator('#party-grid > .hero-card').all()) {
    await expect(card.locator('.bars')).toBeVisible();
    await expect(card.locator('.hero-foot')).toBeVisible();
  }
  await page.locator('[data-board-add]').click(); await expect(page.locator('#exp-desc')).toBeFocused();
  await page.locator('#exp-desc').fill('TEST ค่าอาหารใหม่'); await page.locator('#exp-amount').fill('-1');
  await expect(page.locator('#exp-amount')).toHaveAttribute('aria-invalid','true');
  await page.locator('[data-entry-action="add-expense"]').click(); await expect(page.locator('#expense-count')).toHaveText('5');
  await page.locator('#exp-amount').fill('0'); await page.locator('[data-entry-action="add-expense"]').click();
  await expect(page.locator('#expense-count')).toHaveText('5'); await expect(page.locator('#exp-desc')).toHaveValue('TEST ค่าอาหารใหม่');
  await page.locator('#exp-amount').fill('400'); await page.locator('[data-entry-action="add-expense"]').click();
  await expect(page.locator('#expense-count')).toHaveText('6'); await expect(page.locator('#party-total')).toHaveText('฿12,850');
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('pointy_test_trip_4821')).expenses.length)).toBe(6);
  await page.reload(); await ready(page); await expect(page.locator('#quest-log')).toContainText('TEST ค่าอาหารใหม่');
  await expect(page.locator('#party-total')).toHaveText('฿12,850');
  if (width === 390) await page.locator('.board-disclosure[data-board-collapse="board-log-content"]').click();
  await page.locator('.board-disclosure[data-board-collapse="board-log-content"]').click(); await expect(page.locator('#quest-log')).toBeHidden();
  await page.locator('.board-disclosure[data-board-collapse="board-log-content"]').click(); await expect(page.locator('#quest-log')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Party board retains draft, receipt and settlements through layout controls', async ({ page }, testInfo) => {
  await page.setViewportSize({width:390,height:844}); await fixture(page); await page.goto('/trip/?id=4821&test=1'); await ready(page);
  await page.locator('#exp-desc').fill('TEST draft'); await page.locator('#exp-amount').fill('800');
  await page.locator('[data-entry-mode="quick"]').click(); await expect(page.locator('#exp-desc')).toHaveValue('TEST draft');
  await page.locator('[data-entry-mode="form"]').click(); await expect(page.locator('#exp-amount')).toHaveValue('800');
  await page.locator('[data-entry-action="toggle-receipt-picker"]').click();
  await expect(page.locator('[data-entry-action="receipt-camera"]')).toBeVisible();
  await expect(page.locator('[data-entry-action="receipt-library"]')).toBeVisible();
  await page.locator('#receipt-library-input').setInputFiles({ name:'test-receipt.png', mimeType:'image/png', buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64') });
  await expect(page.locator('.receipt-thumb')).toBeVisible();
  await page.locator('[data-entry-action="reset-draft"]').click(); await expect(page.locator('#exp-desc')).toHaveValue(''); await expect(page.locator('.receipt-thumb')).toHaveCount(0);
  await page.locator('.board-disclosure[data-board-collapse="board-settle-content"]').click();
  const before = await page.locator('.tribute').count(); await page.locator('.tribute .btn-primary').first().click();
  await expect(page.locator('.picker-overlay')).toBeVisible();
  await page.locator('#promptpay-input').fill('0812345678');
  await page.getByRole('button',{name:'บันทึกพร้อมเพย์'}).click();
  await page.getByRole('button',{name:/ยืนยันชำระแล้ว/}).click();
  await expect(page.locator('.tribute')).toHaveCount(before-1);
  await page.locator('.cq-lang-compact').click(); await expect(page.locator('#entry-title')).toContainText('Add expense');
  await page.locator('[data-profile-hub="theme"]').click();
  await capture(page,testInfo,'board-mobile-en-dark.png');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
});

test('Animated full portraits remain centered and empty boards remain actionable', async ({ page }) => {
  await fixture(page, false); await page.goto('/trip/?id=4821&test=1'); await ready(page);
  await page.locator('#quick-toggles button').nth(1).click();
  await expect(page.locator('body')).not.toHaveClass(/no-animations/);
  const centers = await page.locator('.portrait-img').evaluateAll(imgs => imgs.map(img => {
    const image = img.getBoundingClientRect(), frame = img.parentElement.getBoundingClientRect();
    return Math.abs((image.left + image.right) / 2 - (frame.left + frame.right) / 2);
  }));
  expect(centers.every(offset => offset < 12)).toBeTruthy();
  await expect(page.locator('#quest-log')).toContainText('ยังไม่มีการผจญภัย');
  await page.locator('#exp-desc').fill('TEST invalid split'); await page.locator('#exp-amount').fill('100');
  await page.locator('[data-split-mode="percent"]').click();
  await page.locator('.weight-value').first().fill('101'); await page.locator('[data-entry-action="add-expense"]').click();
  await expect(page.locator('#expense-count')).toHaveText('0'); await expect(page.locator('#exp-desc')).toHaveValue('TEST invalid split');
  await page.locator('[data-entry-action="reset-draft"]').click();
  await expect(page.locator('#exp-desc')).toHaveValue('');
});
