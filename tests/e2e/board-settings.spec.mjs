import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const qa = path.resolve('docs/board-settings-2026-10-14/qa');
async function seed(page, { locked = false, longName = false, empty = false } = {}) {
  await page.addInitScript(({ locked, longName, empty }) => {
    if (sessionStorage.getItem('settings-fixture')) return;
    sessionStorage.setItem('settings-fixture', '1');
    const hash = value => { let result = 0; for (const c of value) result = ((result << 5) - result + c.charCodeAt(0)) | 0; return Math.abs(result); };
    const hero = { id: '1111', name: 'Mali', class: 'ranger', cls: 'ranger', gender: 'male' };
    const account = { uid: 'settings-qa', email: 'settings.qa@coinquest.local', username: 'settings.qa', name: hero.name, userId: hero.id, character: hero };
    localStorage.setItem('pointy_auth_v1', JSON.stringify(account));
    localStorage.setItem('pointy_accounts_v1', JSON.stringify([account]));
    localStorage.setItem('pointy_character_registry_v1', JSON.stringify({ '1111': { ...hero, xp: 120 }, '2222': { id: '2222', name: 'Niran', class: 'warrior', gender: 'male', xp: 30 }, '3333': { id: '3333', name: 'Ploy', class: 'wizard', gender: 'female', xp: 20 } }));
    localStorage.setItem('lang', 'th'); localStorage.setItem('pointy_theme', 'tavern');
    localStorage.setItem('pointy_profile_v1', JSON.stringify({ tourSeen: true }));
    localStorage.setItem('pointy_admin_owner_token_v1', 'settings-owner');
    const board = { tripName: longName ? 'เชียงใหม่ · ปาร์ตี้นักผจญภัยเดินทางเที่ยวกับเพื่อนและครอบครัวในวันหยุดยาว' : 'เชียงใหม่ · ปาร์ตี้นักผจญภัย', participants: empty ? [] : ['Mali', 'Niran', 'Ploy'], characterIds: { Mali: '1111', Niran: '2222', Ploy: '3333' }, heroClasses: { Mali: 'ranger', Niran: 'warrior', Ploy: 'wizard' }, heroGenders: { Mali: 'male', Niran: 'male', Ploy: 'female' }, expenses: [], settings: { stats: true, sound: true, animations: false, theme: 'tavern', accent: '#2f8f5b' }, admin: { ownerHash: String(hash('pointy:settings-owner:owner')), passwordHash: String(hash('pointy:board-pass:admin')), createdAt: Date.now() }, access: { ownerUids: [account.uid], memberUids: [account.uid] } };
    sessionStorage.setItem('pointy_test_trip_9001', JSON.stringify(board));
    sessionStorage.setItem('pointy_test_trip_9002', JSON.stringify({ ...board, tripName: 'ทริปญี่ปุ่น 2026' }));
    if (locked) sessionStorage.setItem('pointy_admin_locked_9001', '1');
    else sessionStorage.setItem('pointy_admin_unlocked_9001', '1');
  }, { locked, longName, empty });
}
async function open(page) {
  await page.goto('/trip/?id=9001&test=1');
  await expect(page.locator('#trip-name-display')).toContainText('เชียงใหม่');
  await page.locator('.board-banner-actions [data-action="settings"]').click();
  await expect(page.locator('.bs-dialog')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function capture(page, name) {
  await fs.mkdir(qa, { recursive: true });
  await page.screenshot({ path: path.join(qa, name), scale: 'css', animations: 'disabled' });
}
for (const width of [1440, 768, 390]) test(`Board settings responsive composition and navigation at ${width}px`, async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: width === 768 ? 1024 : width === 390 ? 844 : 1000 });
  await seed(page); await open(page);
  await expect(page.locator('.bs-owned-board')).toHaveCount(2);
  await expect.poll(() => page.locator('.bs-member img').evaluateAll(imgs => imgs.every(img => img.complete && img.naturalWidth > 0))).toBeTruthy();
  expect(await page.locator('.bs-dialog').evaluate(el => {
    const b = el.getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight && el.scrollWidth <= el.clientWidth;
  })).toBe(true);
  expect(await page.locator('.bs-content').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  if (width < 1024) expect(await page.locator('.bs-nav button').evaluateAll(buttons => buttons.every(button => {
    const box = button.getBoundingClientRect(), icon = button.querySelector('svg').getBoundingClientRect(), label = button.querySelector('span').getBoundingClientRect();
    return Math.abs((icon.top + label.bottom) / 2 - (box.top + box.bottom) / 2) < 1;
  }))).toBe(true);
  await capture(page, `settings-${width}.png`);
  if (width === 390) await page.locator('.bs-nav').screenshot({ path: path.join(qa, 'settings-tabs-mobile.png'), scale: 'css' });
  await page.locator('[data-settings-nav="members"]').click();
  await expect(page.locator('.bs-member').first()).toBeInViewport();
  if (width < 1024) {
    await page.getByRole('button', { name: 'จัดการสมาชิก Niran', exact: true }).click();
    await expect(page.locator('.bs-member.is-expanded .bs-member-actions')).toBeVisible();
  }
  await capture(page, `settings-${width}-members.png`);
  await page.locator('[data-settings-nav="tools"]').click();
  await expect(page.getByRole('button', { name: 'ส่งออกรายการ Excel', exact: true })).toBeInViewport();
  await page.locator('[data-settings-nav="general"]').click();
  await expect(page.locator('#bs-general')).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(page.locator('.bs-dialog')).toHaveCount(0);
  await expect(page.locator('.board-banner-actions [data-action="settings"]')).toBeFocused();
  expect(errors).toEqual([]);
});

test('Board settings preserves ID drafts, persists preferences and restores keyboard focus', async ({ page }) => {
  await seed(page); await open(page);
  const id = page.locator('.bs-member').filter({ hasText: 'Niran' }).locator('input');
  await id.fill('23ab'); await expect(id).toHaveValue('23'); await expect(id).toHaveAttribute('aria-invalid', 'true');
  await id.fill('2345');
  await page.getByRole('switch', { name: 'สเตตัสเกม', exact: true }).click();
  await expect(id).toHaveValue('2345');
  await expect(page.getByRole('switch', { name: 'สเตตัสเกม', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'ม่วง', exact: true }).click();
  await expect(id).toHaveValue('2345');
  await page.getByRole('button', { name: 'ดันเจียน', exact: true }).click();
  await expect(id).toHaveValue('2345');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dungeon');
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('pointy_test_trip_9001')).settings.accent)).toBe('#6d5ae0');
  await page.keyboard.press('Escape');
  await expect(page.locator('.board-banner-actions [data-action="settings"]')).toBeFocused();
  await page.reload(); await page.locator('.board-banner-actions [data-action="settings"]').click();
  await expect(page.getByRole('switch', { name: 'สเตตัสเกม', exact: true })).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('button', { name: 'ม่วง', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'ดันเจียน', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(id).toHaveValue('2222');
  await page.locator('[data-settings-close]').focus(); await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'นำเข้ารายการ', exact: true }).last()).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.locator('[data-settings-close]')).toBeFocused();
});

test('Board settings gates admin controls, validates ID and keeps compact actions usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, { locked: true }); await open(page);
  await expect(page.locator('.admin-table')).toHaveCount(0);
  await page.locator('[data-settings-nav="members"]').click();
  await page.getByLabel('รหัสผ่านแอดมิน', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'ปลดล็อก', exact: true }).click();
  await expect(page.locator('.admin-table')).toHaveCount(0);
  await page.getByLabel('รหัสผ่านแอดมิน', { exact: true }).fill('board-pass');
  await page.getByRole('button', { name: 'ปลดล็อก', exact: true }).click();
  await expect(page.locator('.admin-table')).toContainText('Niran');
  const row = page.locator('.bs-member').filter({ hasText: 'Niran' });
  await row.locator('[data-settings-member-toggle]').click();
  await row.locator('input').fill('12'); await row.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('pointy_test_trip_9001')).characterIds.Niran)).toBe('2222');
  await row.locator('input').fill('2345'); await row.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('pointy_test_trip_9001')).characterIds.Niran)).toBe('2345');
  await expect(row.getByRole('link', { name: 'โปรไฟล์', exact: true })).toHaveAttribute('href', /id=2345/);
  await row.getByRole('button', { name: 'ID ใหม่', exact: true }).click();
  await expect(row.locator('input')).not.toHaveValue('2345');
  await page.getByRole('button', { name: 'ล็อกแอดมิน', exact: true }).click();
  await expect(page.locator('.admin-table')).toHaveCount(0);
  await capture(page, 'settings-mobile-locked.png');
});

test('Board settings copy failure, board links and import transition', async ({ page }) => {
  await seed(page); await open(page);
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('Clipboard unavailable'); }; });
  await page.locator('[data-settings-copy]').click();
  await expect(page.locator('#bs-copy-status')).toContainText('คัดลอกไม่ได้');
  await expect(page.locator('#bs-board-url')).toBeFocused();
  await page.evaluate(() => { navigator.clipboard.writeText = async text => { window.settingsCopied = text; }; });
  await page.locator('[data-settings-copy]').click();
  await expect(page.locator('#bs-copy-status')).toHaveText('คัดลอกลิงก์แล้ว');
  expect(await page.evaluate(() => window.settingsCopied)).toContain('id=9001');
  await expect(page.locator('.bs-owned-board').filter({ hasText: 'ทริปญี่ปุ่น' })).toHaveAttribute('href', /id=9002.*test=1/);
  await page.getByRole('button', { name: 'นำเข้ารายการ', exact: true }).last().click();
  await expect(page.locator('.bs-dialog')).toHaveCount(0);
  await expect(page.locator('#import-text')).toBeVisible();
  await expect(page.locator('body')).not.toHaveClass(/board-settings-open/);
  expect(await page.locator('.board-page').evaluate(el => el.inert)).toBe(false);
});

test('Board settings long names, dark theme and English stay within mobile dialog', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, { longName: true }); await open(page);
  await page.getByRole('button', { name: 'ดันเจียน', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.locator('.cq-lang-compact').click();
  await page.locator('.board-banner-actions [data-action="settings"]').click();
  await expect(page.locator('#bs-title')).toContainText('Board settings');
  expect(await page.locator('.bs-content').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await capture(page, 'settings-mobile-dark-en.png');
  await page.getByRole('button', { name: /Create a board/ }).click();
  await expect(page.locator('#new-trip-code')).toHaveValue(/\d{4}/);
  await expect(page.locator('body')).not.toHaveClass(/board-settings-open/);
});
