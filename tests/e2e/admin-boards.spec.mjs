import { test, expect } from '@playwright/test';
import { openBoardsFixture } from './helpers/boards-fixture.mjs';
import { revealBoardSection } from './helpers/board-info-fixture.mjs';

test.beforeEach(async ({ page }, info) => {
  await page.setViewportSize({ width: { chromium: 1440, tablet: 768, mobile: 390 }[info.project.name], height: 900 });
});

const row = (page, id) => page.locator(`.board-row[data-board-id="${id}"]`);
const confirm = page => page.getByRole('dialog').getByRole('button', { name: 'ยืนยัน', exact: true }).click();
const noOverflow = async page => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

test('Boards adapts real records and actions to desktop, tablet and mobile compositions', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await openBoardsFixture(page);
  await expect(page.locator('.board-row')).toHaveCount(8);
  await expect(row(page, '7775').locator('.board-members')).toContainText('2 dragons');
  await expect(row(page, '3512').locator('.board-member-count')).toHaveAttribute('aria-label', '3 members');
  const width = page.viewportSize().width;
  expect(await page.locator('.boards-table th:visible').count()).toBe(width >= 1200 ? 8 : width >= 768 ? 5 : 0);
  expect(await page.locator('.boards-shortcuts button:visible').count()).toBe(width >= 768 ? 4 : 2);
  for (const label of ['all', 'split', 'debt', 'treasury']) await expect(page.locator('.boards-filter').getByRole('button', { name: label, exact: true })).toBeVisible();
  if (width < 768) {
    await expect(row(page, '1397').locator('.board-name .board-mobile-value')).toHaveText('TEST ทริปใหม่');
    const boxes = await Promise.all(['.boards-filter', '.boards-shortcuts', '.boards-add', '.boards-list'].map(selector => page.locator(selector).boundingBox()));
    boxes.slice(1).forEach((box, i) => expect(box.y).toBeGreaterThanOrEqual(boxes[i].y + boxes[i].height));
  }
  await noOverflow(page);
  await row(page, '3512').getByRole('button', { name: 'Members', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open Party Ledger' })).toHaveAttribute('href', '/trip/?id=3512&test=1');
  await expect(page.locator('.card')).toContainText(['Members']);
  await page.locator('.crumbs').getByRole('button', { name: 'Boards', exact: true }).click();
  await row(page, '1794').getByRole('button', { name: 'Detail', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('TEST Chiang Mai');
  await revealBoardSection(page, 'owner');
  await expect(page.locator('input[value="ADM-1794"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Boards combines search and type filters without losing typing focus or drafts', async ({ page }) => {
  await openBoardsFixture(page);
  const search = page.getByPlaceholder('ค้นหา board/admin');
  const input = await search.elementHandle();
  await search.pressSequentially('ADM-3512');
  await expect(page.locator('.board-row')).toHaveCount(1);
  await expect(search).toBeFocused();
  expect(await input.evaluate(el => el.isConnected)).toBe(true);
  await page.locator('[data-filter="debt"]').click();
  await expect(page.locator('[data-filter="debt"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(search).toHaveValue('ADM-3512');
  await expect(page.getByText('ไม่พบบอร์ดที่ตรงกัน', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'ล้างการค้นหาและตัวกรอง' }).click();
  await expect(search).toHaveValue('');
  await expect(search).toBeFocused();
  await search.fill('Mali');
  await expect(page.locator('.board-row')).toHaveCount(6);
  await search.fill('เชียงใหม่');
  await expect(page.locator('.board-row')).toHaveCount(1);
  await row(page, '2152').getByRole('button', { name: 'Detail', exact: true }).click();
  await revealBoardSection(page, 'owner');
  await page.locator('input[value="TEST เชียงใหม่"]').fill('TEST เชียงใหม่ updated');
  await page.locator('.crumbs').getByRole('button', { name: 'Boards', exact: true }).click();
  await expect(search).toHaveValue('เชียงใหม่');
  await expect(row(page, '2152').getByLabel('Board name')).toHaveValue('TEST เชียงใหม่ updated');
  await search.fill('');
  await page.locator('[data-filter="treasury"]').click();
  await expect(page.locator('.board-row')).toHaveCount(1);
  await expect(row(page, '5771')).toBeVisible();
  await noOverflow(page);
});

test('Board edits stay in the draft and mobile reading values follow desktop edits', async ({ page }) => {
  await openBoardsFixture(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  const original = await page.evaluate(() => sessionStorage.getItem('pointy_test_trip_1397'));
  await row(page, '1397').getByLabel('Board name').fill('TEST ชื่อบอร์ดที่ยาวมากสำหรับทดสอบการจัดหน้าบนมือถือและแท็บเล็ต');
  await row(page, '1397').getByLabel('Admin ID', { exact: true }).fill('ADM-LONG-IDENTIFIER-1397');
  await row(page, '1397').getByLabel('Board URL').fill('1398');
  await expect(row(page, '1397').getByRole('button', { name: 'ลบ Board 1398', exact: true })).toBeVisible();
  await row(page, '1397').getByLabel('Reset password').fill('TEST-password-only');
  await expect(page.getByRole('button', { name: 'Detail 1398', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(row(page, '1397').locator('.board-url .board-mobile-value')).toHaveText('1398');
  await expect(row(page, '1397').locator('.board-admin-id .board-mobile-value')).toContainText('ADM-LONG-IDENTIFIER-1397');
  await expect(row(page, '1397').getByRole('button', { name: 'Members', exact: true })).toBeVisible();
  await noOverflow(page);
  await page.getByPlaceholder('ค้นหา board/admin').fill('1398');
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(row(page, '1397').getByLabel('Reset password')).toHaveValue('TEST-password-only');
  await row(page, '1397').getByRole('button', { name: 'Detail', exact: true }).click();
  await expect(page.getByPlaceholder('ตั้งรหัสใหม่')).toHaveValue('TEST-password-only');
  expect(await page.evaluate(() => sessionStorage.getItem('pointy_test_trip_1397'))).toBe(original);
});

test('Board create and delete confirmations preserve draft-only behavior and reveal the new filtered board', async ({ page }) => {
  await openBoardsFixture(page);
  await page.locator('[data-filter="debt"]').click();
  await page.getByPlaceholder('ค้นหา board/admin').fill('missing');
  await page.getByRole('button', { name: '+ เพิ่ม Board', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByPlaceholder('ค้นหา board/admin')).toHaveValue('missing');
  await page.getByRole('button', { name: '+ เพิ่ม Board', exact: true }).click();
  await confirm(page);
  await expect(page.getByPlaceholder('ค้นหา board/admin')).toHaveValue('');
  await expect(page.locator('.board-row')).toHaveCount(2);
  const created = await page.evaluate(() => draft.boards.find(b => b.created));
  expect(created.type).toBe('debt');
  expect(await page.evaluate(id => sessionStorage.getItem(`pointy_test_trip_${id}`), created.urlId)).toBeNull();
  await row(page, '7775').getByRole('button', { name: 'ลบ Board 7775', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(row(page, '7775')).toBeVisible();
  await row(page, '7775').getByRole('button', { name: 'ลบ Board 7775', exact: true }).click();
  await confirm(page);
  await expect(row(page, '7775')).toHaveCount(0);
  expect(await page.evaluate(() => sessionStorage.getItem('pointy_test_trip_7775'))).not.toBeNull();
});

test('Boards empty state offers a real first draft instead of sample records', async ({ page }) => {
  await openBoardsFixture(page, { empty: true });
  await expect(page.getByText('ยังไม่มีบอร์ด', { exact: true })).toBeVisible();
  await expect(page.locator('.board-row')).toHaveCount(0);
  await page.getByRole('button', { name: '+ เพิ่ม Board', exact: true }).click();
  await confirm(page);
  await expect(page.locator('.board-row')).toHaveCount(1);
  await expect(page.locator('.board-member-count')).toHaveAttribute('aria-label', '0 members');
  await noOverflow(page);
});
