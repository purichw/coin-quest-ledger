import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

// Explicit local-only visual fixture. No production Auth or Firestore writes.
test('admin redesign preserves all navigation surfaces', async ({ page }, info) => {
  test.skip(!process.env.CQ_DESIGN_CAPTURE, 'Opt-in visual review fixture');
  await page.addInitScript(() => {
    sessionStorage.setItem('pointy_super_admin_unlocked_v2', '1');
    sessionStorage.setItem('pointy_test_trip_9001', JSON.stringify({
      tripName: 'เชียงใหม่ · ปาร์ตี้นักผจญภัย', participants: ['Mali', 'Niran'],
      characterIds: { Mali: '1111', Niran: '2222' }, expenses: [],
      admin: { ownerHash: 'visual-fixture', adminId: 'ADM-QA', adminName: 'Design QA', passwordHash: 'test-only', urlLocked: true }, updatedAt: 1791748800000,
    }));
  });
  const dir = path.resolve('docs/redesign-2026-10-12'); await fs.mkdir(dir, { recursive: true });
  for (const route of ['dashboard', 'boards', 'users', 'admins', 'map', 'audit', 'revisions', 'tombstones', 'support']) {
    await page.goto(`/admin/?test=1&tab=${route}`);
    await expect(page.locator('.main')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.nav-item.active')).toHaveCount(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    expect(overflow).toBe(false);
    await page.screenshot({ path: `${dir}/admin-${route}-${info.project.name}-${process.env.CQ_DESIGN_CAPTURE}.png`, fullPage: true });
  }
});
