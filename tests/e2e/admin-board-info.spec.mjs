import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { openBoardInfoFixture, revealBoardSection } from './helpers/board-info-fixture.mjs';
import { adminTools } from './helpers/admin-fixture.mjs';

test.beforeEach(async ({ page }, info) => {
  await page.setViewportSize({ width: { chromium: 1440, tablet: 768, mobile: 390 }[info.project.name], height: 900 });
});
const confirm = page => page.getByRole('dialog').getByRole('button', { name: 'ยืนยัน', exact: true }).click();
const noOverflow = async page => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
const stored = page => page.evaluate(() => JSON.parse(sessionStorage.getItem('pointy_test_trip_1397')));

test('Board Info uses one responsive scroll flow with keyboard disclosures and no legacy layout switch', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await openBoardInfoFixture(page);
  await expect(page.locator('.board-info-page .tabs, .board-info-page .seg')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^(Tabs|Scroll|Danger zone)$/ })).toHaveCount(0);
  await expect(page.locator('.board-info-flow > *')).toHaveClass(['board-overview','card board-info-section','card board-info-section','card board-info-section','card board-info-section','board-danger']);
  await expect(page.locator('.board-stat')).toHaveCount(3);
  await expect(page.locator('#board-info-body')).toBeVisible();
  const width = page.viewportSize().width;
  if (width < 1200) {
    await expect(page.locator('#board-owner-body')).toBeHidden();
    const toggle = page.locator('#board-owner .board-section-toggle');
    await toggle.focus(); await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toBeFocused();
    await page.getByLabel('Name', { exact: true }).fill('TEST ชื่อบอร์ดที่ยาวมากและต้องไม่ล้นออกนอกกระดาษสำหรับการแสดงผลทุกขนาด');
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('#board-log-body')).toBeVisible();
    await page.setViewportSize({ width: 320, height: 900 });
    await expect(page.locator('#board-owner-body')).toBeVisible();
  }
  await revealBoardSection(page, 'members');
  await expect(page.getByRole('table', { name: 'Board members' })).toContainText('Pointy');
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('Board owner edits keep focus, save/reopen and publish without losing member data or secrets', async ({ page }) => {
  await openBoardInfoFixture(page);
  const original = await stored(page);
  await revealBoardSection(page, 'owner');
  const name = page.getByLabel('Name', { exact: true });
  const element = await name.elementHandle();
  await name.fill('TEST Journey edited'); await name.pressSequentially(' today');
  await expect(name).toBeFocused();
  expect(await element.evaluate(el => el.isConnected)).toBe(true);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('TEST Journey edited today');
  await page.getByLabel('URL', { exact: true }).fill('1398');
  await page.getByLabel('Admin ID', { exact: true }).fill('ADM-1398');
  await page.getByLabel('Nickname', { exact: true }).fill('TEST Owner');
  await expect(page.locator('[data-board-ledger]')).toHaveAttribute('href', '/trip/?id=1398&test=1');
  expect(await stored(page)).toEqual(original);
  await adminTools(page); await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'ปิด', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Detail 1398', exact: true }).click();
  await revealBoardSection(page, 'owner');
  await expect(name).toHaveValue('TEST Journey edited today');
  await expect(page.getByLabel('Admin ID', { exact: true })).toHaveValue('ADM-1398');
  await adminTools(page); await page.locator('#publish-btn').click(); await confirm(page);
  await expect(page.locator('#draft-badge')).toHaveText('Published version');
  const saved = await page.evaluate(() => JSON.parse(sessionStorage.getItem('pointy_test_trip_1398')));
  expect(saved.tripName).toBe('TEST Journey edited today');
  for (const key of ['participants','characterIds','expenses','futureField']) expect(saved[key]).toEqual(original[key]);
  expect(saved.admin.passwordHash).toBe(original.admin.passwordHash);
  expect(saved.admin.adminName).toBe('TEST Owner');
});

test('Board change log is isolated by identity and destructive actions remain confirmed draft changes', async ({ page }) => {
  await openBoardInfoFixture(page);
  await page.locator('.crumbs button').click();
  await page.getByRole('button', { name: 'Detail 9002', exact: true }).click();
  await revealBoardSection(page, 'owner');
  await page.getByLabel('Name', { exact: true }).fill('TEST Other board edited');
  await page.locator('.crumbs button').click();
  await page.getByRole('button', { name: 'Detail 1397', exact: true }).click();
  await revealBoardSection(page, 'log');
  await expect(page.locator('#board-log-body')).toContainText('No draft changes for this board');
  await revealBoardSection(page, 'owner');
  await page.getByLabel('Name', { exact: true }).fill('TEST Current board edited');
  await expect(page.locator('#board-log-body')).toContainText('TEST Current board edited');
  await expect(page.locator('#board-log-body')).not.toContainText('Other board');
  await page.getByRole('button', { name: 'Revert board changes' }).click(); await confirm(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('TEST ทริปใหม่');
  await page.getByRole('button', { name: 'Delete board', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.board-info-page')).toBeVisible();
  await page.getByRole('button', { name: 'Delete board', exact: true }).click(); await confirm(page);
  await expect(page.getByText('Board deletion pending', { exact: true })).toBeVisible();
  expect(await stored(page)).not.toBeNull();
  await page.getByRole('button', { name: 'Restore board', exact: true }).click(); await confirm(page);
  await expect(page.locator('.board-info-page')).toBeVisible();
  expect(await page.evaluate(() => boardById('9002').tripName)).toBe('TEST Other board edited');
  await page.locator('.crumbs button').click();
  await page.getByRole('button', { name: '+ เพิ่ม Board', exact: true }).click(); await confirm(page);
  const created = await page.evaluate(() => draft.boards.find(b => b.created).urlId);
  await page.locator(`.board-row[data-board-id="${created}"]`).getByRole('button', { name: 'Detail', exact: true }).click();
  await page.getByRole('button', { name: 'Delete board', exact: true }).click(); await confirm(page);
  await expect(page.getByText('Draft board discarded', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore board', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Back to Boards', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Boards', level: 1, exact: true })).toBeVisible();
});

test('Board Export downloads only this board with no credentials; missing admin identity remains reachable', async ({ page }) => {
  await openBoardInfoFixture(page);
  await page.getByRole('button', { name: 'Export data', exact: true }).click();
  const modal = page.getByRole('dialog');
  await expect(modal.getByLabel('Select board / user')).toHaveValue('b:1397');
  const download = page.waitForEvent('download');
  await modal.getByRole('button', { name: 'Export JSON', exact: true }).click();
  const raw = await readFile(await (await download).path(), 'utf8');
  expect(JSON.parse(raw).boards).toHaveLength(1);
  expect(raw).not.toMatch(/TEST-preserve-secret|passwordHash|ownerHash/);
  await page.locator('#board-info .k-admin').click();
  await expect(page.locator('.page-title')).toContainText('Admin');
  await expect(page.locator('.admin-page')).toContainText('1397');
});

test('Board versions retain global revision numbering and dates tolerate missing or Firestore timestamp values', async ({ page }) => {
  await openBoardInfoFixture(page);
  await page.evaluate(() => {
    draft.boards.find(b => b.originalId === '1397').data.updatedAt = { seconds: 1791921600 };
    published.revisions = [
      { createdAt: '2026-10-14T00:00:00Z', author: 'TEST Admin', changes: [{ detail: '9002 name changed' }] },
      { createdAt: '2026-10-13T00:00:00Z', author: 'TEST Admin', changes: [{ detail: '1397 name changed' }] }
    ];
    render();
  });
  await expect(page.locator('#board-info-body')).not.toContainText('Invalid Date');
  await revealBoardSection(page, 'versions');
  await expect(page.locator('#board-versions-body')).toContainText('v1');
  await expect(page.locator('#board-versions-body')).not.toContainText('v2');
  await page.evaluate(() => { boardById('1397').data.updatedAt = 'bad date'; render(); });
  await expect(page.locator('#board-info .kv-row').last().locator('.v')).toHaveText('—');
  await noOverflow(page);
});
