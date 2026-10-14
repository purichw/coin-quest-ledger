import { test, expect } from '@playwright/test';
import { adminNav, adminTools } from './helpers/admin-fixture.mjs';
import { readFile } from 'node:fs/promises';

const board = {
  tripName: 'TEST Audit Board', participants: ['Mali', 'Niran'], characterIds: { Mali: '1111', Niran: '2222' },
  heroClasses: { Mali: 'ranger', Niran: 'warrior' },
  expenses: [{ id: 'food', desc: 'Dinner', amount: 100.25, paidBy: 'Mali', sharedBy: ['Mali', 'Niran'], split: { mode: 'equal' } }],
  admin: { adminId: 'ADM-AUDIT', adminName: 'Mali', characterId: '1111', passwordHash: 'never-export-me', ownerHash: 'private-owner' },
  futureField: { keep: true }, updatedAt: 100
};
async function openAdmin(page, { corrupt = false } = {}) {
  await page.addInitScript(({ board, corrupt }) => {
    if (sessionStorage.getItem('audit-seeded')) return;
    sessionStorage.setItem('audit-seeded', '1');
    sessionStorage.setItem('pointy_test_trip_9001', JSON.stringify(board));
    sessionStorage.setItem('pointy_super_admin_unlocked_v2', '1');
    if (corrupt) localStorage.setItem('pointy_super_admin_draft_v2', '{broken');
  }, { board, corrupt });
  await page.goto('/admin/?test=1');
  await expect(page.getByRole('heading', { name: 'Boards', exact: true, level: 1 })).toBeVisible();
}
const dialog = page => page.getByRole('dialog');
async function publish(page) {
  await adminTools(page);
  await page.locator('#publish-btn').click();
  await dialog(page).getByRole('button', { name: 'ยืนยัน', exact: true }).click();
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.locator('#draft-badge')).toHaveText('Published version');
}
const stored = page => page.evaluate(() => JSON.parse(sessionStorage.getItem('pointy_test_trip_9001')));

test('Admin search retains focus and complete typed text across filtered rerenders', async ({ page }) => {
  await openAdmin(page);
  const search = page.getByPlaceholder('ค้นหา board/admin');
  const originalInput = await search.elementHandle();
  await search.pressSequentially('TEST Audit');
  expect(await originalInput.evaluate(el => el.isConnected)).toBe(true);
  await expect(search).toHaveValue('TEST Audit');
  await expect(search).toBeFocused();
  await expect(page.locator('input[value="TEST Audit Board"]')).toBeVisible();
  await search.press('ControlOrMeta+A'); await search.press('Backspace');
  await expect(search).toHaveValue('');
  await adminNav(page, 'Users');
  const users = page.getByPlaceholder('Search user / character');
  await users.pressSequentially('Mali'); await expect(users).toBeFocused();
  await expect(users).toHaveValue('Mali');
});

test('Admin archives and reopens without deleting members, money, secrets or unknown data', async ({ page }, info) => {
  await openAdmin(page);
  await page.getByRole('button', { name: 'Detail 9001', exact: true }).click();
  await page.getByRole('button', { name: 'Danger zone', exact: true }).click();
  await page.getByRole('button', { name: 'Archive board', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'ยืนยัน', exact: true }).click();
  expect((await stored(page)).archived).toBeUndefined();
  await publish(page);
  const archived = await stored(page);
  expect(archived.archived).toBe(true);
  for (const key of ['expenses', 'participants', 'characterIds', 'futureField']) expect(archived[key]).toEqual(board[key]);
  expect(archived.admin.passwordHash).toBe(board.admin.passwordHash);
  await page.screenshot({ path: info.outputPath('admin-archived.png'), fullPage: true });
  await page.reload();
  await page.getByRole('button', { name: 'Detail 9001', exact: true }).click();
  await page.getByRole('button', { name: 'Danger zone', exact: true }).click();
  await page.getByRole('button', { name: 'Reopen board', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'ยืนยัน', exact: true }).click();
  await publish(page);
  expect((await stored(page)).archived).toBe(false);
  expect((await stored(page)).expenses).toEqual(board.expenses);
  await adminNav(page, 'Version Control');
  await expect(page.locator('.rev')).toHaveCount(2);
  await expect(page.locator('.rev').first()).toContainText('Test Admin');
  await expect(page.getByRole('button', { name: 'View diff', exact: true })).toHaveCount(0);
  await adminNav(page, 'Audit Log');
  await expect(page.locator('.tbl tbody tr')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'View diff', exact: true })).toHaveCount(0);
});

test('Admin export downloads the chosen board with satang and no credentials', async ({ page }) => {
  await openAdmin(page);
  await adminNav(page, 'Support Tools');
  await expect(page.getByRole('button', { name: /Impersonate|Invite admin|Merge|Add user/ })).toHaveCount(0);
  const opener = page.getByRole('button', { name: 'Export JSON', exact: true });
  await opener.click();
  await dialog(page).getByLabel('Select board / user').selectOption('b:9001');
  const download = page.waitForEvent('download');
  await dialog(page).getByRole('button', { name: 'Export JSON', exact: true }).click();
  const file = await download;
  const raw = await readFile(await file.path(), 'utf8'), exported = JSON.parse(raw);
  expect(exported.boards).toHaveLength(1);
  expect(exported.users).toEqual([]);
  expect(exported.boards[0].data.expenses).toEqual(board.expenses);
  expect(raw).not.toMatch(/never-export-me|private-owner|passwordHash|ownerHash/);
  await expect(opener).toBeFocused();
});

test('Admin dialogs cancel safely with Escape, close and trapped keyboard focus', async ({ page }) => {
  await openAdmin(page);
  const opener = page.getByRole('button', { name: '+ เพิ่ม Board', exact: true });
  await opener.click();
  const close = dialog(page).getByRole('button', { name: 'Close', exact: true });
  await expect(close).toBeFocused();
  await close.press('Shift+Tab');
  await expect(dialog(page).getByRole('button', { name: 'ยืนยัน', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toHaveCount(0); await expect(opener).toBeFocused();
  await opener.click(); await dialog(page).getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('input[value="New Board"]')).toHaveCount(0);
});

test('Admin invalid drafts cannot publish; save failures retain edits and retry works', async ({ page }) => {
  await openAdmin(page);
  const id = page.locator('input[value="9001"]'); await id.fill('../bad');
  await adminTools(page);
  await page.locator('#publish-btn').click(); await expect(dialog(page)).toContainText('4 หลัก');
  await dialog(page).getByRole('button', { name: 'ปิด', exact: true }).click();
  await id.fill('9001');
  await page.locator('input[value="TEST Audit Board"]').fill(' ');
  await adminTools(page);
  await page.locator('#publish-btn').click(); await expect(dialog(page)).toContainText('1–100');
  await dialog(page).getByRole('button', { name: 'ปิด', exact: true }).click();
  await page.locator('input[value="TEST Audit Board"]').fill('TEST Retry');
  await page.evaluate(() => { window.originalStorageSet = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'pointy_super_admin_draft_v2') throw new DOMException('Quota', 'QuotaExceededError'); return window.originalStorageSet.call(this, key, value); }; });
  await adminTools(page);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog(page)).toContainText('บันทึกไม่สำเร็จ');
  await dialog(page).getByRole('button', { name: 'ปิด', exact: true }).click();
  await expect(page.locator('input[value="TEST Audit Board"]')).toHaveValue('TEST Retry');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalStorageSet; });
  await adminTools(page);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'ปิด', exact: true }).click();
  await page.reload(); await expect(page.locator('input[value="TEST Retry"]')).toBeVisible();
});

test('Corrupt local draft is reported and explicit Restore recovers published data', async ({ page }) => {
  await openAdmin(page, { corrupt: true });
  await expect(page.getByRole('alert')).toContainText('อ่าน draft');
  expect(await page.evaluate(() => localStorage.getItem('pointy_super_admin_draft_v2'))).toBe('{broken');
  await adminTools(page);
  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'ยืนยัน', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('input[value="TEST Audit Board"]')).toBeVisible();
});

test('Admin no longer offers board-only identity mutation or fabricated financial charts', async ({ page }) => {
  await openAdmin(page);
  await page.getByRole('button', { name: 'Detail 9001', exact: true }).click();
  await expect(page.getByText('฿100.25', { exact: true })).toBeVisible();
  await expect(page.getByText('Unsettled', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /^Members/ }).click();
  await expect(page.getByText('Edit ID', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Open Party Ledger', exact: true })).toHaveAttribute('href', /id=9001/);
  await adminNav(page, 'Users');
  await page.getByRole('button', { name: 'Detail 1111', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Edit', exact: true })).toHaveCount(0);
  await expect(page.getByText('14-day activity', { exact: false })).toHaveCount(0);
  await page.getByRole('button', { name: 'Lifecycle', exact: true }).click();
  await page.getByRole('button', { name: 'Deactivate', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(dialog(page)).toContainText('Audit reason is required');
});

test('A failed Admin collection read shows retry instead of an empty or partially editable portal', async ({ page }) => {
  await page.route('https://www.gstatic.com/firebasejs/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.route('**/api/admin-delete-status', route => route.fulfill({ json: { adminDeleteConfigured: true } }));
  await page.route('**/shared/firebase-client.js', route => route.fulfill({ contentType: 'application/javascript', body: `
    window.auditFailRead = true;
    const db = { collection(name) { return {
      orderBy() { return this; }, limit() { return this; }, where() { return this; },
      async get() { if (name === 'users' && window.auditFailRead) throw new Error('offline-users'); return {docs: []}; }
    }; } };
    const auth = { onAuthStateChanged(callback) { queueMicrotask(() => callback({email: 'purich.wc@gmail.com'})); } };
    window.firebase = {apps: [{}], firestore: () => db};
    window.PointyFirebase = {auth: () => auth, firestore: () => db, freshGet: ref => ref.get()};
  ` }));
  await page.goto('/admin/');
  await expect(page.getByRole('alert')).toContainText('โหลดข้อมูล Admin ไม่ครบ');
  await expect(page.locator('#publish-btn')).toBeDisabled();
  await page.evaluate(() => { window.auditFailRead = false; });
  await page.getByRole('button', { name: 'ลองใหม่', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Boards', level: 1, exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('Admin page readiness holds the eye until initial collections are ready', async ({ page }) => {
  await page.route('https://www.gstatic.com/firebasejs/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.route('**/api/admin-delete-status', route => route.fulfill({ json: { adminDeleteConfigured: true } }));
  await page.route('**/shared/firebase-client.js', route => route.fulfill({ contentType: 'application/javascript', body: `
    const ready = new Promise(resolve => { window.releaseAdmin = resolve; });
    const db = { collection(name) { return {
      orderBy() { return this; }, limit() { return this; }, where() { return this; },
      async get() { if (name === 'users') await ready; return {docs: []}; }
    }; } };
    const auth = { onAuthStateChanged(callback) { queueMicrotask(() => callback({email: 'purich.wc@gmail.com'})); } };
    window.firebase = {apps: [{}], firestore: () => db};
    window.PointyFirebase = {auth: () => auth, firestore: () => db, freshGet: ref => ref.get()};
  ` }));
  await page.goto('/admin/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2300);
  await expect(page.locator('[data-first-load]')).toBeVisible();
  await expect(page.locator('#app')).toHaveCSS('opacity', '0');
  await page.evaluate(() => window.releaseAdmin());
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Boards', level: 1, exact: true })).toBeVisible();
});
