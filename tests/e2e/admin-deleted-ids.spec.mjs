import { test, expect } from '@playwright/test';
import { openTombstonesFixture } from './helpers/tombstones-fixture.mjs';

test.beforeEach(async ({ page }, info) => {
  await page.setViewportSize({ width: { chromium: 1440, tablet: 768, mobile: 390 }[info.project.name], height: 900 });
});
const record = (page, id) => page.locator(`.tombstone-row[data-key="${id}"]`);
const search = page => page.getByPlaceholder('Search deleted ID / username');
const noOverflow = async page => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
const state = page => page.evaluate(() => JSON.stringify({ draft, cloudTombstones, lifecycle: localUserLifecycle(), dirty }));

test('Deleted IDs preserves historical fields and keeps all identities read-only', async ({ page }) => {
  const errors = []; page.on('pageerror', err => errors.push(err.message));
  await openTombstonesFixture(page);
  await expect(page.locator('.tombstone-row')).toHaveCount(6);
  await expect(page.locator('.page-desc')).toContainText('6 reusable tombstones');
  await expect(record(page, '4965').locator('.ts-characters')).toContainText('4965');
  await expect(record(page, '3186').locator('.ts-characters .ts-value')).toHaveText('—');
  await expect(page.locator('.tombstones-table .ts-status .badge')).toHaveText(Array(6).fill('deleted'));
  await expect(page.locator('.tombstones-table a, .tombstones-table button.idchip, .tombstones-table input')).toHaveCount(0);
  const tableDisplay = await page.locator('.tombstones-table').evaluate(el => getComputedStyle(el).display);
  expect(tableDisplay).toBe(page.viewportSize().width >= 1200 ? 'table' : 'block');
  if (page.viewportSize().width < 1200) {
    const toggle = await record(page, '3186').locator('.tombstone-toggle').boundingBox();
    const badge = await record(page, '3186').locator('.badge').boundingBox();
    expect(toggle.width).toBeGreaterThanOrEqual(44);
    expect(badge.x + badge.width).toBeLessThanOrEqual(toggle.x);
  }
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('Deleted IDs search retains input focus and distinguishes empty data from no matches', async ({ page }) => {
  await openTombstonesFixture(page);
  const original = await search(page).elementHandle();
  await search(page).pressSequentially('test.pointisiiz');
  await expect(record(page, '4965')).toBeVisible();
  await expect(page.locator('.tombstone-row')).toHaveCount(1);
  await expect(search(page)).toBeFocused();
  expect(await original.evaluate(el => el.isConnected)).toBe(true);
  await expect(page.locator('.page-desc')).toContainText('6 reusable tombstones');
  await expect(page.locator('.tombstones-list [role="status"]')).toHaveText('1 of 6 records');
  await search(page).fill('  TEST.RECLAIM.Q13G7O7  ');
  await expect(record(page, '7273')).toBeVisible();
  await page.evaluate(() => { cloudTombstones[1].characterIds = ['CHAR-unique']; });
  await search(page).fill('char-unique');
  await expect(record(page, '4965')).toBeVisible();
  await search(page).fill('9418');
  await expect(record(page, '9418')).toBeVisible();
  await search(page).fill('no matching identity');
  await expect(page.getByText('No matching deleted IDs', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await expect(search(page)).toBeFocused();
  await expect(page.locator('.tombstone-row')).toHaveCount(6);
  await page.evaluate(() => { cloudTombstones = []; render(); });
  await expect(page.getByText('No deleted IDs yet', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clear search' })).toHaveCount(0);
  await noOverflow(page);
});

test('Deleted ID detail shows full historical values with keyboard dismissal and no writes', async ({ page }) => {
  await openTombstonesFixture(page);
  const before = await state(page);
  const detail = record(page, '4965').getByRole('button', { name: 'Detail', exact: true });
  await detail.focus(); await page.keyboard.press('Enter');
  const modal = page.getByRole('dialog');
  await expect(modal).toContainText('TEST-previous-uid-4965-aB7xP9kL4mN8');
  await expect(modal).toContainText('TEST deletion audit 4965');
  await expect(modal).toContainText('Historical record · not an active account');
  await expect(modal.locator('input, select, textarea, a')).toHaveCount(0);
  await expect(modal.locator('.x-btn')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(modal.locator('.modal-foot').getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(modal.locator('.x-btn')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
  await expect(detail).toBeFocused();
  await detail.click();
  await modal.locator('.modal-foot').getByRole('button', { name: 'Close', exact: true }).click();
  await expect(detail).toBeFocused();
  expect(await state(page)).toBe(before);
});

test('Deleted ID disclosure survives filtering and viewport changes without losing focus', async ({ page }) => {
  await openTombstonesFixture(page);
  if (page.viewportSize().width >= 1200) await page.setViewportSize({ width: 1024, height: 900 });
  const before = await state(page);
  const first = record(page, '3186');
  const toggle = first.locator('.tombstone-toggle');
  await toggle.focus(); await page.keyboard.press('Space');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(first.locator('.ts-uid')).not.toBeVisible();
  await expect(first.locator('.ts-username')).toBeVisible();
  await search(page).fill('4965');
  await search(page).fill('');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(first.locator('.ts-uid')).toBeVisible();
  await expect(toggle).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(first.locator('.ts-uid')).not.toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const controls = (await toggle.getAttribute('aria-controls')).split(' ');
  for (const id of controls) await expect(page.locator(`[id="${id}"]`)).toBeVisible();
  await expect(first.getByRole('button', { name: 'Detail', exact: true })).toBeVisible();
  expect(await state(page)).toBe(before);
  await noOverflow(page);
});

test('Deleted IDs handles incomplete, long and unsafe-looking metadata without active-account links', async ({ page }) => {
  await openTombstonesFixture(page);
  await page.evaluate(() => {
    cloudTombstones[0].username = 'test.' + 'ชื่อผู้ใช้ที่ยาว'.repeat(10);
    cloudTombstones[0].previousUid = 'TEST-long-uid-'.repeat(15);
    cloudTombstones[0].characterIds = ['CHAR-A', 'CHAR-B', 'CHAR-C'];
    cloudTombstones[0].reason = '<img src=x onerror=alert(1)>';
    cloudTombstones[1].previousUid = ''; cloudTombstones[1].deletedAt = 0;
    cloudTombstones[1].reason = ''; cloudTombstones[1].source = '';
    cloudTombstones.push({ userId: '', username: "test.username-only'quoted", characterIds: [], previousUid: '', deletedAt: 0, reason: '', source: 'username' });
    cloudUsers = [normalizeCloudUser('TEST-active-account', { userId: '6929', name: 'TEST Active', character: { id: '6929', name: 'TEST Active' } })];
    render();
  });
  await expect(record(page, '6929')).toHaveCount(0);
  await expect(page.locator('.tombstone-row')).toHaveCount(6);
  await expect(record(page, '3186').locator('.ts-characters .idchip')).toHaveCount(3);
  await noOverflow(page);
  await record(page, '3186').getByRole('button', { name: 'Detail', exact: true }).click();
  const modal = page.getByRole('dialog');
  await expect(modal).toContainText('<img src=x onerror=alert(1)>');
  await expect(modal.locator('img')).toHaveCount(0);
  await noOverflow(page);
  await page.keyboard.press('Escape');
  await record(page, '4965').getByRole('button', { name: 'Detail', exact: true }).click();
  await expect(modal).toContainText('Not recorded');
  await page.keyboard.press('Escape');
  const noId = page.locator('.tombstone-row').filter({ hasText: 'No User ID' });
  await noId.getByRole('button', { name: 'Detail', exact: true }).click();
  await expect(modal).toContainText("test.username-only'quoted");
});
