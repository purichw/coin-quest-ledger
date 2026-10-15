import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { seedReminders } from './helpers/reminders-fixture.mjs';

const qa = path.resolve('docs/reminders-2026-10-14/qa');
async function open(page, route = '/') {
  await page.goto(`${route}${route.includes('?') ? '&' : '?'}test=1`);
  await page.locator('[data-profile-hub="reminders"]').click();
  await expect(page.getByRole('dialog', { name: /^(การแจ้งเตือน|Reminders)$/ })).toBeVisible();
  await expect(page.locator('.rem-panel .cq-skeleton')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.rem-panel').evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished)));
}
async function capture(page, name) {
  await fs.mkdir(qa, { recursive: true });
  await page.screenshot({ path: path.join(qa, name), animations: 'disabled', scale: 'css' });
}
test.beforeEach(async ({ page }) => {
  page.reminderErrors = [];
  page.on('pageerror', error => page.reminderErrors.push(error.message));
});
test.afterEach(async ({ page }) => { expect(page.reminderErrors).toEqual([]); });

for (const width of [1440, 768, 390]) {
  test(`Reminders reference composition and filters at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 768 ? 1024 : width === 390 ? 844 : 900 });
    await seedReminders(page); await open(page);
    await expect(page.locator('.rem-item')).toHaveCount(4);
    await expect(page.locator('.ri-avatar img')).toHaveCount(2);
    await page.locator('.ri-avatar img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await expect(page.getByRole('tab', { name: 'ทั้งหมด (4)' })).toHaveAttribute('aria-selected', 'true');
    const box = await page.locator('.rem-panel').boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(await page.locator('.rem-panel').evaluate(el => el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().bottom <= innerHeight)).toBe(true);
    if (width === 1440) {
      const bell = await page.locator('[data-profile-hub="reminders"]').boundingBox();
      expect(box.y).toBeCloseTo(bell.y + bell.height + 12, 0);
      expect(bell.x).toBeGreaterThan(box.x); expect(bell.x + bell.width).toBeLessThan(box.x + box.width);
    } else expect(Math.abs(box.x + box.width / 2 - width / 2)).toBeLessThan(1);
    if (width === 390) expect(await page.locator('.k-invite .ri-action').first().evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(42);
    await capture(page, `reminders-${width}.png`);
    await page.getByRole('tab', { name: 'คำเชิญปาร์ตี้ (2)' }).click(); await expect(page.locator('.rem-item')).toHaveCount(2);
    await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'การเงิน (2)' })).toBeFocused();
    await expect(page.locator('.rem-item')).toHaveCount(2); await expect(page.locator('.rem-list')).toContainText('฿1,200.00');
    await page.keyboard.press('Escape'); await expect(page.locator('.rem-overlay')).toHaveCount(0);
    await expect(page.locator('[data-profile-hub="reminders"]')).toBeFocused();
    await expect(page.locator('body')).not.toHaveClass(/reminders-open/);
    if (width === 1440) {
      await page.locator('[data-home-action="reminders"]').click();
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-home-action="reminders"]')).toBeFocused();
    }
  });
}

test('Read state persists across routes while tasks remain, and changed amounts become unread', async ({ page }) => {
  await seedReminders(page); await open(page);
  await page.locator('[data-rem-mark]').click();
  await expect(page.locator('.rem-feedback')).toContainText('ทำเครื่องหมายว่าอ่านแล้ว');
  await expect(page.locator('.rem-item.is-read')).toHaveCount(4);
  await expect(page.locator('.rb-badge')).toHaveCount(0);
  await page.keyboard.press('Escape'); await open(page, '/debt/');
  await expect(page.getByRole('tab', { name: 'ทั้งหมด (0)' })).toBeVisible();
  await expect(page.locator('.rem-item')).toHaveCount(4);
  await page.getByRole('tab', { name: 'การเงิน (0)' }).click();
  await page.evaluate(() => {
    const treasury = JSON.parse(localStorage.getItem('pointy_treasury_v1')); treasury.bills[0].amount = 599;
    localStorage.setItem('pointy_treasury_v1', JSON.stringify(treasury)); window.PointyProfileHub.refresh();
  });
  await expect(page.getByRole('tab', { name: 'การเงิน (1)' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-rem-id="tbsubscriptions"]')).not.toHaveClass(/is-read/);
  await page.locator('[data-rem-open="tbsubscriptions"]').click(); await expect(page).toHaveURL(/\/treasury\/\?test=1/);
  await page.locator('[data-profile-hub="reminders"]').click();
  await expect(page.locator('[data-rem-id="tbsubscriptions"]')).toHaveClass(/is-read/);
  await page.evaluate(() => {
    const boards = JSON.parse(localStorage.getItem('coin_quest_trip_snapshots_v1'));
    boards['9010'].expenses[0].paidBy = 'Mali';
    localStorage.setItem('coin_quest_trip_snapshots_v1', JSON.stringify(boards)); window.PointyProfileHub.refresh();
  });
  await expect(page.locator('[data-rem-id="settle-9010"]')).toContainText('รอรับเงินคืน');
  await expect(page.locator('[data-rem-id="settle-9010"] .ri-amount.positive')).toHaveText('฿1,200.00');
});

test('Invite rejection preserves selected tab, prevents duplicate submits, and handles failure then retry', async ({ page }) => {
  await seedReminders(page); await open(page);
  await page.getByRole('tab', { name: 'คำเชิญปาร์ตี้ (2)' }).click();
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('[data-invite-id="9000_1111"][data-rem-action="declineInvite"]').click();
  await expect(page.locator('.rem-item')).toHaveCount(2);
  await page.evaluate(() => {
    const original = window.PointyBoardInvites.updateStatus; window.inviteCalls = 0;
    window.PointyBoardInvites.updateStatus = async args => {
      window.inviteCalls++;
      if (window.inviteCalls === 1) return new Promise((_, reject) => { window.failInvite = () => reject(new Error('simulated-write-failure')); });
      return original(args);
    };
  });
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-invite-id="9000_1111"][data-rem-action="declineInvite"]').click();
  await expect(page.locator('[data-invite-id="9000_1111"][data-rem-action="acceptInvite"]')).toBeDisabled();
  await expect(page.locator('.ri-busy')).toBeVisible();
  await page.evaluate(() => window.failInvite());
  await expect(page.locator('.rem-feedback[role="alert"]')).toContainText('จัดการคำเชิญไม่สำเร็จ');
  await expect(page.locator('.rem-item')).toHaveCount(2);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-invite-id="9000_1111"][data-rem-action="declineInvite"]').click();
  await expect(page.locator('.rem-feedback')).toContainText('ปฏิเสธคำเชิญแล้ว');
  await expect(page.getByRole('tab', { name: 'คำเชิญปาร์ตี้ (1)' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.rem-item')).toHaveCount(1);
  expect(await page.evaluate(() => window.inviteCalls)).toBe(2);
  await page.reload(); await page.locator('[data-profile-hub="reminders"]').click();
  await expect(page.locator('[data-rem-id="invite-9000_1111"]')).toHaveCount(0);
});

test('Load failure is recoverable without resetting filter or scroll, and expired invites cannot join', async ({ page }) => {
  await seedReminders(page, { count: 12 }); await open(page);
  await page.getByRole('tab', { name: 'คำเชิญปาร์ตี้ (12)' }).click();
  await page.locator('[data-rem-all]').click(); await expect(page.locator('.rem-item')).toHaveCount(12);
  await page.locator('.rem-scroll').evaluate(el => { el.scrollTop = 100; });
  // Ensure this test exercises a genuinely scrollable list even on tall tablets.
  await expect.poll(() => page.locator('.rem-scroll').evaluate(el => el.scrollTop)).toBe(100);
  await page.evaluate(() => {
    window.originalInviteLoad = window.PointyBoardInvites.loadForAccount;
    window.PointyBoardInvites.loadForAccount = () => new Promise((_, reject) => { window.failLoad = () => reject(new Error('simulated-offline')); });
    window.PointyProfileHub.showReminders();
  });
  await expect(page.locator('.rem-panel .cq-skeleton')).toBeVisible();
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await expect(page.locator('.rem-panel .cq-skeleton')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('.rem-panel .cq-skeleton')).toHaveText('');
  await page.evaluate(() => window.failLoad());
  await expect(page.locator('.rem-error')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'คำเชิญปาร์ตี้ (12)' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-rem-all]')).toHaveAttribute('aria-expanded', 'true');
  expect(await page.locator('.rem-scroll').evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  await page.evaluate(() => { window.PointyBoardInvites.loadForAccount = window.originalInviteLoad; });
  await page.locator('[data-rem-retry]').click(); await expect(page.locator('.rem-error')).toHaveCount(0);
  await page.clock.setFixedTime(new Date('2026-10-15T05:00:00Z'));
  await page.locator('[data-invite-id="9000_1111"][data-rem-action="acceptInvite"]').click();
  await expect(page.locator('.rem-feedback')).toContainText('หมดอายุ');
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('pointy_test_trip_9000')).participants.includes('Mali'))).toBe(false);
});

test('An older invitation request cannot replace the next account’s invitations', async ({ page }) => {
  await seedReminders(page); await open(page);
  await page.evaluate(() => {
    window.PointyBoardInvites.loadForAccount = ({ characterId }) => {
      if (characterId === '1111') return new Promise(resolve => { window.resolveOldInvites = () => resolve(JSON.parse(localStorage.getItem('pointy_board_invites_v1'))); });
      return Promise.resolve([]);
    };
    window.PointyProfileHub.showReminders();
  });
  await expect(page.locator('.rem-panel .cq-skeleton')).toBeVisible();
  await page.evaluate(() => {
    const account = JSON.parse(localStorage.getItem('pointy_auth_v1'));
    account.uid = 'reminders-other'; account.userId = '5555'; account.character.id = '5555';
    localStorage.setItem('pointy_auth_v1', JSON.stringify(account)); window.PointyProfileHub.refresh();
  });
  await expect(page.locator('.k-invite')).toHaveCount(0);
  await page.evaluate(() => window.resolveOldInvites());
  await expect(page.locator('.rem-panel .cq-skeleton')).toHaveCount(0);
  await expect(page.locator('.k-invite')).toHaveCount(0);
  await expect(page.locator('.rem-panel')).not.toContainText('Mochi');
});

test('Overdue debt stays first and its details open Debt Dragon', async ({ page }) => {
  await seedReminders(page);
  await page.addInitScript(() => localStorage.setItem('pointy_debt_v5', JSON.stringify({
    dragons: [{ id: 'credit', name: { th: 'บัตรเครดิตทดสอบ', en: 'Test credit card' }, type: 'card', original: 10000, balance: 9000,
      apr: 22, payment: 500, interestMode: 'compound', dueDay: 10, payMode: 'monthly', log: [], slain: false }], history: [], settings: {}
  })));
  await open(page);
  await expect(page.locator('.rem-item').first()).toContainText('บัตรเครดิตทดสอบ');
  await expect(page.locator('.rem-item').first()).toContainText('เกินกำหนดชำระ');
  await page.locator('[data-rem-open="dcredit"]').click(); await expect(page).toHaveURL(/\/debt\/\?test=1/);
});

test('Mobile dark English long names, empty state and focus containment', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedReminders(page, { count: 5, language: 'en', theme: 'dungeon', longName: true }); await open(page, '/?view=compare');
  await page.locator('[data-rem-all]').click(); await expect(page.locator('.rem-item')).toHaveCount(7);
  expect(await page.locator('.rem-scroll').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.locator('.rem-scroll').evaluate(el => { el.scrollTop = 0; }); await capture(page, 'reminders-390-dark-long.png');
  await page.locator('[data-rem-all]').focus(); await page.keyboard.press('Tab'); await expect(page.locator('[data-rem-mark]')).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(page.locator('[data-rem-all]')).toBeFocused();
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    localStorage.setItem('pointy_board_invites_v1', '[]'); localStorage.setItem('coin_quest_trip_snapshots_v1', '{}');
    localStorage.setItem('pointy_treasury_v1', JSON.stringify({ month: '2026-10', bills: [], expenses: [] }));
  });
  await page.reload(); await page.locator('[data-profile-hub="reminders"]').click();
  await expect(page.locator('.rem-empty')).toContainText('No reminders yet');
  await expect(page.locator('[data-rem-mark]')).toBeDisabled();
  await capture(page, 'reminders-390-empty.png');
  await page.locator('.rem-overlay').click({ position: { x: 1, y: 1 } });
  await expect(page.locator('.rem-overlay')).toHaveCount(0);
});
