import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const evidence = 'docs/debt-dragon-redesign-2026-10-13/qa';
async function fixture(page) {
  await page.clock.setFixedTime(new Date('2026-06-14T12:00:00+07:00'));
  await page.addInitScript(() => {
    if (sessionStorage.getItem('debt-design-fixture')) return;
    sessionStorage.setItem('debt-design-fixture', '1');
    localStorage.setItem('lang', 'th');
    localStorage.setItem('pointy_theme', 'tavern');
    localStorage.setItem('pointy_debt_settings_v1', JSON.stringify({ theme: 'tavern', sound: false, animations: false, battlefx: 'minimal', strategy: 'avalanche' }));
    localStorage.setItem('pointy_profile_v1', JSON.stringify({ tourSeen: true }));
  });
  await page.goto('/debt/?test=1');
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await expect(page.locator('.dragon-card[data-dragon-id]')).toHaveCount(4);
  await page.evaluate(() => document.fonts.ready);
}
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
}
for (const width of [1440, 768, 390]) {
  test(`Debt visual ${width}`, async ({ page }) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await fixture(page); await noOverflow(page);
    expect(await page.locator('#app img').evaluateAll(imgs => imgs.every(img => img.complete && img.naturalWidth > 0))).toBeTruthy();
    fs.mkdirSync(evidence, { recursive: true });
    await page.screenshot({ path: `${evidence}/${process.env.DEBT_CAPTURE_BEFORE ? 'before' : 'after'}-${width}.png`, fullPage: true });
    if (!process.env.DEBT_CAPTURE_BEFORE && width === 390) {
      await page.screenshot({ path: `${evidence}/mobile-top.png` });
      await page.locator('.cq-footer').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${evidence}/mobile-bottom.png` });
      await page.evaluate(() => scrollTo(0, 0));
    }
    if (!process.env.DEBT_CAPTURE_BEFORE) {
      if (width === 390) expect(await page.locator('#debt-finance').getAttribute('open')).toBeNull();
      const appWidth = await page.locator('#app').evaluate(el => el.getBoundingClientRect().width);
      expect(appWidth).toBeLessThanOrEqual(1240);
      await page.locator('[data-profile-hub="theme"]').click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dungeon');
      await page.locator(width === 390 ? '.cq-lang-compact' : '.lang-btn[data-lang="en"]').click();
      await expect(page.locator('.lair-panel h2')).toContainText('My dragons');
      await noOverflow(page);
      await page.screenshot({ path: `${evidence}/dark-en-${width}.png`, fullPage: true });
    }
    expect(errors).toEqual([]);
  });
}

for (const width of [1440, 390]) {
  test(`Debt create, validate, edit, pay and reload at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await fixture(page);
    await page.locator('.add-dragon').click();
    await expect(page.locator('#new-name')).toBeFocused();
    await page.locator('.df-actions .btn-primary').click();
    await expect(page.locator('#new-balance')).toHaveAttribute('aria-invalid', 'true');
    await page.locator('#new-balance').fill('1000');
    await page.locator('#new-original').fill('1000');
    await page.locator('.df-actions .btn-primary').click();
    await expect(page.locator('#new-name')).toHaveAttribute('aria-invalid', 'true');
    await page.locator('#new-name').fill('TEST ค่าเรียนมังกร');
    await page.locator('#new-apr').fill('0');
    await page.locator('#new-payment').fill('200');
    await page.locator('#new-dueDay').fill('32');
    await page.locator('.df-actions .btn-primary').click();
    await expect(page.locator('#new-dueDay')).toHaveAttribute('aria-invalid', 'true');
    await page.locator('#new-dueDay').fill('20');
    // A rerender must not discard a draft.
    await page.locator(width === 390 ? '.cq-lang-compact' : '.lang-btn[data-lang="en"]').click();
    await expect(page.locator('#new-name')).toHaveValue('TEST ค่าเรียนมังกร');
    await expect(page.locator('#new-balance')).toHaveValue('1,000');
    await page.locator(width === 390 ? '.cq-lang-compact' : '.lang-btn[data-lang="th"]').click();
    await page.locator('.df-actions .btn-primary').click();
    await expect(page.locator('.dragon-card')).toHaveCount(5);
    const card = page.locator('.dragon-card').filter({ has: page.locator('.dc-name', { hasText: 'TEST ค่าเรียนมังกร' }) });
    await card.locator('.dc-summary').click();
    await card.locator('.dc-edit').click();
    await card.locator('[id$="-name"]').fill('TEST ค่าเรียนใหม่');
    await card.locator('.df-actions .btn-primary').click();
    const edited = page.locator('.dragon-card').filter({ has: page.locator('.dc-name', { hasText: 'TEST ค่าเรียนใหม่' }) });
    await edited.getByRole('button', { name: 'บันทึกการจ่าย', exact: true }).filter({ visible: true }).click();
    const amount = edited.locator('[id^="strike-amt-"]');
    await amount.fill('0');
    await edited.locator('.dc-strike-form .btn-danger').click();
    await expect(amount).toHaveAttribute('aria-invalid', 'true');
    await amount.fill('250');
    await edited.locator('[id^="strike-date-"]').fill('2026-06-15');
    await edited.locator('.dc-strike-form .btn-danger').click();
    await expect(edited.locator('[id^="strike-date-"]')).toHaveAttribute('aria-invalid', 'true');
    await edited.locator('[id^="strike-date-"]').fill('2026-06-14');
    await noOverflow(page);
    await edited.screenshot({ path: `${evidence}/payment-${width}.png` });
    await edited.locator('.dc-strike-form .btn-danger').click();
    await expect(edited.locator('.dc-bal')).toHaveText('฿750');
    await expect(edited.locator('.dc-log-row')).toContainText('250');
    await page.reload();
    await expect(page.locator('.dc-name', { hasText: 'TEST ค่าเรียนใหม่' })).toBeVisible();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pointy_test_debt_v1')));
    const debt = saved.dragons.find(d => String(d.name).includes('TEST'));
    expect(debt.balance).toBe(750); expect(debt.log[0].amount).toBe(250);
    await noOverflow(page);
  });
}

test('Debt filters, completed debt, search, sorting and keyboard disclosure', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await fixture(page);
  const friend = page.locator('[data-dragon-id="d4"]');
  await friend.locator('.dc-summary').focus(); await page.keyboard.press('Enter');
  await expect(friend.locator('.dc-detail')).toBeVisible();
  await friend.locator('.dc-mobile-pay').click();
  await friend.locator('[id^="strike-amt-"]').fill('8000');
  await friend.locator('.dc-strike-form .btn-danger').click();
  await expect(friend).toHaveClass(/slain/);
  await expect(friend.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '100');
  await page.locator('.debt-filter-tools > summary').click();
  await page.locator('[data-debt-filter="paid"]').click();
  await expect(page.locator('.dragon-card:visible')).toHaveCount(1);
  await page.locator('[data-debt-filter="active"]').click();
  await expect(page.locator('.dragon-card:visible')).toHaveCount(3);
  await page.locator('#debt-query').fill('หาไม่เจอ');
  await expect(page.locator('.debt-no-results')).toBeVisible();
  await page.locator('.debt-no-results button').click();
  await expect(page.locator('.dragon-card:visible')).toHaveCount(4);
  await page.locator('#debt-sort').selectOption('balance');
  await expect(page.locator('.dragon-card:visible').first()).toHaveAttribute('data-dragon-id', 'd2');
  await page.locator('#debt-sort').selectOption('apr');
  await expect(page.locator('.dragon-card:visible').first()).toHaveAttribute('data-dragon-id', 'd1');
  await page.locator('.debt-filter-tools > summary').click();
  await friend.locator('.dc-summary').click();
  await page.screenshot({ path: `${evidence}/paid-mobile.png`, fullPage: true });
  await page.reload();
  await expect(friend).toHaveClass(/slain/);
  await expect(page.locator('.hoard-stat').nth(1).locator('.hs-val')).toHaveText('3');
});

test('Debt narrow layout, archived restore, settings keyboard and empty state', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 }); await fixture(page);
  await page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem('pointy_test_debt_v1')) || structuredClone(window.PointyLogic.SEED_DEBT);
    value.dragons[0].archived = true;
    value.dragons[1].name = 'TEST ชื่อหนี้ที่ยาวมากเพื่อทดสอบการตัดบรรทัดและปุ่มบนหน้าจอเล็ก';
    localStorage.setItem('pointy_test_debt_v1', JSON.stringify(value));
  });
  await page.reload(); await noOverflow(page);
  await page.locator('.debt-filter-tools > summary').click();
  await page.locator('[data-debt-filter="archived"]').click();
  const archived = page.locator('[data-dragon-id="d1"]');
  await archived.locator('.dc-summary').click();
  await archived.locator('.dc-mobile-restore').click();
  await expect(archived).toBeHidden();
  await page.locator('.debt-view-all').click();
  await expect(archived).toBeVisible();
  await page.getByRole('button', { name: 'ตั้งค่าเกม', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.picker-close')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.picker .settings-row').last().getByRole('button').last()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.debt-settings')).toBeFocused();
  await page.locator('#debt-manage > summary').click();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#debt-manage .dc-remove').click();
  await expect(page.locator('.dragon-card')).toHaveCount(0);
  await expect(page.locator('.debt-no-results')).toBeVisible();
  await noOverflow(page);
  await page.locator('.add-dragon').click();
  await expect(page.locator('#new-name')).toBeFocused();
});
