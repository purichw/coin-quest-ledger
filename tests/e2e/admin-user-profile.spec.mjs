import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { openUsersFixture } from './helpers/users-fixture.mjs';

test.beforeEach(async ({ page }, info) => {
  await page.setViewportSize({ width: { chromium: 1440, tablet: 834, mobile: 390 }[info.project.name], height: 900 });
  await openUsersFixture(page);
  await page.getByRole('button', { name: 'Details 2150', exact: true }).click();
});
const modal = page => page.getByRole('dialog');
const status = page => page.locator('.user-account-facts .kv-row').first().locator('.v');
const noOverflow = async page => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
const back = page => page.locator('.crumbs').getByRole('button', { name: 'Users', exact: true }).click();

test('User profile keeps every section open, separates reputation from XP, and shares Board Info artwork', async ({ page }) => {
  expect(await page.locator('.user-detail-section').evaluateAll(els => els.map(el => el.id))).toEqual(['user-profile','user-chars','user-boards','user-admin','user-activity','user-lifecycle']);
  await expect(page.locator('.user-detail-section:visible')).toHaveCount(6);
  await expect(page.locator('.user-info-page [role="tab"], .user-info-page .tabs, .user-info-page [aria-expanded]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^(Tabs|Scroll|Impersonate|Edit|Invite admin)$/ })).toHaveCount(0);
  await expect(page.locator('.user-reputation-summary')).toContainText('LV 2 920');
  await expect(page.locator('.user-character-xp')).toContainText('120 XP');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', /\d+/);
  await expect(page.locator('#user-admin')).toContainText('Owner hash: —');
  const header = await page.locator('.admin-detail-heading').boundingBox();
  const title = await page.locator('.admin-detail-heading .page-title').boundingBox();
  const actions = await page.locator('.admin-detail-actions').boundingBox();
  expect(Math.abs(title.x + title.width / 2 - header.x - header.width / 2)).toBeLessThanOrEqual(1);
  expect(Math.abs(actions.x + actions.width / 2 - header.x - header.width / 2)).toBeLessThanOrEqual(1);
  expect(actions.y).toBeGreaterThanOrEqual(title.y + title.height);
  await page.getByRole('button', { name: 'Lifecycle', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#user-lifecycle-title')).toBeFocused();
  await expect(page.locator('#user-chars')).toBeVisible();
  const art = await page.locator('.admin-detail-heading .page-title').evaluate(el => getComputedStyle(el).backgroundImage);
  expect(art).toContain('admin-board-info/title-scroll.webp');
  expect(await page.locator('.user-info-page img').evaluateAll(imgs => imgs.every(img => img.complete && img.naturalWidth > 0))).toBe(true);
  await noOverflow(page);
  await page.locator('#user-boards').getByRole('button', { name: 'Open Board →', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('TEST Journey 4');
  expect(await page.locator('.admin-detail-heading .page-title').evaluate(el => getComputedStyle(el).backgroundImage)).toBe(art);
  await expect(page.locator('.board-info-flow')).toBeVisible();
});

test('User detail links target actual identities and exports only the selected account', async ({ page }) => {
  const draftBefore = await page.evaluate(() => JSON.stringify(draft));
  const link = page.locator('#user-chars').getByRole('link', { name: 'Profile', exact: true });
  const url = new URL(await link.getAttribute('href'), 'http://127.0.0.1:4569');
  expect(url.searchParams.get('id')).toBe('2150');
  expect(url.searchParams.get('from')).toBe('admin');
  expect(url.searchParams.get('return')).toBe('/admin/?test=1&tab=users');
  await page.getByRole('button', { name: 'Export data', exact: true }).click();
  await expect(modal(page).getByLabel('Select board / user')).toHaveValue('u:2150');
  const downloaded = page.waitForEvent('download');
  await modal(page).getByRole('button', { name: 'Export JSON', exact: true }).click();
  const raw = await readFile(await (await downloaded).path(), 'utf8');
  const exported = JSON.parse(raw);
  expect(exported.boards).toHaveLength(0);
  expect(exported.users.map(u => u.userId)).toEqual(['2150']);
  expect(raw).not.toMatch(/passwordHash|recoveryCode|ownerHash/);
  expect(await page.evaluate(() => JSON.stringify(draft))).toBe(draftBefore);
  await page.locator('#user-admin').getByRole('button', { name: 'Open Admin →', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Admin Detail', level: 1, exact: true })).toBeVisible();
  await expect(page.locator('.profile-name')).toHaveText('TEST Simulator QA');
  await expect(page.locator('.admin-page')).toContainText('9004');
});

test('User lifecycle requires confirmation and persists independently of board drafts', async ({ page }) => {
  const before = await page.evaluate(() => JSON.stringify(draft));
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await modal(page).getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(status(page)).toHaveText('active');
  for (const [action, next] of [['Archive','archived'],['Reactivate','active'],['Deactivate','deactivated']]) {
    await page.getByRole('button', { name: action, exact: true }).click();
    await modal(page).getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(page.locator('#lifecycle-error')).toContainText('Audit reason is required');
    await page.locator('#lifecycle-reason').fill(`TEST ${action} fixture account`);
    await modal(page).getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(status(page)).toHaveText(next);
  }
  expect(await page.evaluate(() => JSON.stringify(draft))).toBe(before);
  await page.reload();
  await openUsersFixture(page);
  await page.getByRole('button', { name: 'Details 2150', exact: true }).click();
  await expect(status(page)).toHaveText('deactivated');
  await page.getByRole('button', { name: 'Request delete', exact: true }).click();
  await modal(page).getByRole('button', { name: 'Request permanent delete', exact: true }).click();
  await expect(page.locator('#delete-error')).toContainText('Audit reason is required');
  await page.locator('#delete-reason').fill('TEST local fixture deletion request');
  await page.locator('#delete-confirm').fill('DELETE 1112');
  await modal(page).getByRole('button', { name: 'Request permanent delete', exact: true }).click();
  await expect(page.locator('#delete-error')).toContainText('Type DELETE 2150');
  await modal(page).getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(status(page)).toHaveText('deactivated');
});

test('User reset validates input and retains the selected identity without touching live Auth', async ({ page }) => {
  const calls = []; page.on('request', request => { if (request.url().includes('/api/admin-reset-user')) calls.push(request.url()); });
  await page.getByRole('button', { name: 'Reset password', exact: true }).click();
  await expect(page.locator('#reset-user-id')).toHaveValue('2150');
  await modal(page).getByRole('button', { name: 'Confirm reset', exact: true }).click();
  await expect(page.locator('#reset-error')).toContainText('Enter a username');
  await page.locator('#reset-username').fill('test.simulator');
  await page.locator('#reset-temp-password').fill('TEST-fixture-password');
  await modal(page).getByRole('button', { name: 'Confirm reset', exact: true }).click();
  await expect(modal(page)).toContainText('Test mode simulates the backend handoff');
  await modal(page).getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('TEST Simulator QA');
  expect(calls).toEqual([]);
});

test('User detail tolerates empty and legacy identities, long text and related activity without overflow', async ({ page }) => {
  await page.evaluate(() => {
    published.revisions = [{ createdAt: { seconds: 1791921600 }, author: 'TEST Admin', changes: [{ detail: '9004 renamed board' }, { detail: '9001 unrelated change' }] }];
    render();
  });
  await expect(page.locator('#user-activity')).toContainText('9004 renamed board');
  await expect(page.locator('#user-activity')).not.toContainText('unrelated change');
  await expect(page.locator('#user-activity')).not.toContainText('Invalid Date');
  await page.locator('#user-activity').getByRole('button', { name: 'Open Board →', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('TEST Journey 4');
  await page.evaluate(() => { openUserSection('2150'); cloudUsers.find(u=>u.userId==='2150').name = 'TEST ชื่อผู้ใช้'.repeat(15); cloudUsers.find(u=>u.userId==='2150').username = 'long_username_'.repeat(12); cloudUsers.find(u=>u.userId==='2150').uid = 'longuid'.repeat(30); boardById('9004').tripName = 'TEST ชื่อบอร์ดยาว'.repeat(12); render(); });
  await noOverflow(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await noOverflow(page);
  await back(page);
  await page.locator('.user-row[data-user-id="9000"]').getByRole('button', { name: 'Details', exact: true }).click();
  for (const text of ['No character yet','No boards','Not an admin','No activity yet']) await expect(page.getByText(text, { exact: true })).toBeVisible();
  await expect(page.locator('.user-summary-counts strong')).toHaveText(['0','0','0']);
  await noOverflow(page);
  await back(page);
  await page.locator('.user-row').filter({ hasText: 'TEST Guest 1' }).getByRole('button', { name: 'Details', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Profile unavailable: no Character ID', exact: true })).toBeDisabled();
  await expect(page.locator('#user-chars')).toContainText('No Character ID');
  await noOverflow(page);
});
