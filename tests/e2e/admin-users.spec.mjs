import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { openUsersFixture } from './helpers/users-fixture.mjs';

test.beforeEach(async ({ page }, info) => {
  await page.setViewportSize({ width: { chromium: 1440, tablet: 768, mobile: 390 }[info.project.name], height: 900 });
});
const row = (page, id) => page.locator(`.user-row[data-user-id="${id}"]`);
const search = page => page.getByPlaceholder('Search users or characters');
const back = page => page.locator('.crumbs').getByRole('button', { name: 'Users', exact: true }).click();
const noOverflow = async page => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

test('Users keeps actual identities, counts and reputation in all responsive compositions', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await openUsersFixture(page);
  await expect(page.locator('.user-row')).toHaveCount(13);
  await expect(page.locator('.users-shortcuts button')).toHaveCount(4);
  await expect(row(page, '2150').locator('.user-reputation')).toContainText('920');
  await expect(row(page, '2150').locator('.user-role')).toContainText('1 Admin role');
  await expect(row(page, '4717').locator('.user-boards')).toContainText('2');
  await expect(row(page, '6616').locator('.user-boards')).toContainText('0');
  await expect(row(page, '9000').getByRole('button', { name: 'Profile unavailable: no Character ID' })).toBeDisabled();
  await expect(row(page, '9000').locator('.user-character')).toContainText('No character yet');
  await expect(page.getByRole('button', { name: /New User/ })).toHaveCount(0);
  expect(await page.locator('.users-table th:visible').count()).toBe(page.viewportSize().width >= 1200 ? 8 : 0);
  if (page.viewportSize().width < 1200) {
    const status = await row(page, '1112').locator('.user-status .badge').boundingBox();
    const more = await row(page, '1112').locator('.user-more').boundingBox();
    expect(status.x + status.width).toBeLessThanOrEqual(more.x);
    expect(more.height).toBeGreaterThanOrEqual(44);
    await expect(row(page, '1112').locator('.user-compact-label')).toBeVisible();
  }
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('Users search matches account and character fields without replacing the focused input', async ({ page }) => {
  await openUsersFixture(page);
  const original = await search(page).elementHandle();
  await search(page).pressSequentially('test.purich');
  await expect(page.locator('.user-row')).toHaveCount(1);
  await expect(row(page, '6616')).toBeVisible();
  await expect(search(page)).toBeFocused();
  expect(await original.evaluate(el => el.isConnected)).toBe(true);
  await search(page).fill('นักล่า');
  await expect(row(page, '2150')).toBeVisible();
  await expect(page.locator('.user-row')).toHaveCount(1);
  await expect(page.locator('.page-desc')).toContainText('13 global users');
  await expect(page.locator('.users-list [role="status"]')).toHaveText('1 of 13 users');
  await search(page).fill('2028');
  await expect(row(page, '2028')).toBeVisible();
  await search(page).fill('  TEST HERO 2028  ');
  await expect(row(page, '2028')).toBeVisible();
  await row(page, '2028').getByRole('button', { name: 'Details', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('TEST Postfix Signup');
  await back(page);
  await expect(search(page)).toHaveValue('  TEST HERO 2028  ');
  await search(page).fill('no such account');
  await expect(page.getByText('ไม่พบผู้ใช้ที่ตรงกัน', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'ล้างการค้นหา', exact: true }).click();
  await expect(search(page)).toBeFocused();
  await expect(page.locator('.user-row')).toHaveCount(13);
});

test('Users profile links target the real character and retain the Admin return route', async ({ page }) => {
  await openUsersFixture(page);
  const snapshot = await page.evaluate(() => JSON.stringify(draft));
  const link = row(page, '1112').getByRole('link', { name: 'Profile', exact: true });
  const target = new URL(await link.getAttribute('href'), 'http://127.0.0.1:4569');
  expect(target.searchParams.get('id')).toBe('1112');
  expect(target.searchParams.get('from')).toBe('admin');
  expect(target.searchParams.get('return')).toBe('/admin/?test=1&tab=users');
  const guest = page.locator('.user-row').filter({ hasText: 'TEST Guest 1' });
  await expect(guest.getByRole('link', { name: 'Profile' })).toHaveCount(0);
  await guest.getByRole('button', { name: 'Details', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Profile unavailable: no Character ID' })).toBeDisabled();
  await back(page);
  await page.getByRole('button', { name: 'Details 2150', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('TEST Simulator QA');
  await page.getByRole('button', { name: 'Lifecycle', exact: true }).click();
  await back(page);
  await row(page, '1112').getByRole('button', { name: 'Details', exact: true }).click();
  await expect(page.locator('#user-chars')).toBeVisible();
  await expect(page.locator('#user-lifecycle')).toBeVisible();
  await expect(page.locator('.user-info-page .tabs')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.stringify(draft))).toBe(snapshot);
});

test('Users compact actions use existing destinations, export only the selected account and restore focus', async ({ page }) => {
  await openUsersFixture(page);
  if (page.viewportSize().width >= 1200) await page.setViewportSize({ width: 1024, height: 900 });
  const snapshot = await page.evaluate(() => JSON.stringify(draft));
  const more = row(page, '2150').getByRole('button', { name: 'More actions for TEST Simulator QA', exact: true });
  const modal = page.getByRole('dialog');
  await more.focus(); await page.keyboard.press('Enter');
  await expect(modal).toContainText('Actions · TEST Simulator QA');
  await expect(modal.locator('.x-btn')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(modal.locator('.modal-foot button')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(more).toBeFocused();
  for (const [name, section] of [['Boards 1', 'boards'], ['Admin roles 1', 'admin'], ['Account lifecycle', 'lifecycle']]) {
    await more.click();
    await modal.getByRole('button', { name, exact: true }).click();
    expect(await page.evaluate(() => detail)).toEqual({ kind: 'user', id: '2150' });
    await expect(page.locator(`#user-${section}-title`)).toBeFocused();
    await expect(page.locator('.user-detail-section:visible')).toHaveCount(6);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('TEST Simulator QA');
    await back(page);
  }
  await more.click();
  await modal.getByRole('button', { name: 'Export data', exact: true }).click();
  await expect(modal.getByLabel('Select board / user')).toHaveValue('u:2150');
  const downloaded = page.waitForEvent('download');
  await modal.getByRole('button', { name: 'Export JSON', exact: true }).click();
  const file = await downloaded;
  const result = JSON.parse(await readFile(await file.path(), 'utf8'));
  expect(result.users).toHaveLength(1); expect(result.users[0].userId).toBe('2150');
  await page.keyboard.press('Escape');
  await expect(more).toBeFocused();
  expect(await page.evaluate(() => JSON.stringify(draft))).toBe(snapshot);
});

test('Users handles long labels, account lifecycle states and empty data without overflow or invented rows', async ({ page }) => {
  await openUsersFixture(page);
  await page.evaluate(() => {
    cloudUsers[0].name = 'TEST ' + 'ชื่อผู้ใช้ที่ยาวมากสำหรับทดสอบ'.repeat(4);
    cloudUsers[0].username = 'very.long.username.'.repeat(6);
    cloudUsers[0].chars[0].name = 'ชื่อตัวละคร'.repeat(10);
    cloudUsers[0].status = 'archived'; cloudUsers[1].status = 'deactivated';
    cloudUsers[2].status = 'delete_requested'; cloudUsers[3].status = 'deleted';
    render();
  });
  await expect(page.locator('.user-row')).toHaveCount(12);
  for (const [id, status] of [['1112', 'archived'], ['2000', 'deactivated'], ['2028', 'delete requested']]) await expect(row(page, id).locator('.user-status')).toHaveText(status);
  await expect(row(page, '2150')).toHaveCount(0);
  await expect(row(page, '1112').getByRole('button', { name: 'Details', exact: true })).toBeVisible();
  await noOverflow(page);
  await page.evaluate(() => { cloudUsers = []; draft.boards = []; render(); });
  await expect(page.getByText('ยังไม่มีผู้ใช้', { exact: true })).toBeVisible();
  await expect(page.locator('.user-row')).toHaveCount(0);
  await expect(page.locator('.users-shortcuts')).toHaveCount(0);
  await noOverflow(page);
});
