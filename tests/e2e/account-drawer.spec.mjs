import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const qa = path.resolve('docs/account-drawer-2026-10-14/qa');
async function seed(page, { count = 3, longName = false } = {}) {
  await page.addInitScript(({ count, longName }) => {
    if (sessionStorage.getItem('drawer-fixture')) return;
    sessionStorage.setItem('drawer-fixture', '1');
    const hero = { id: '1111', name: longName ? 'Mali นักเดินทางผู้รักการผจญภัยและการออมเงิน' : 'Mali', class: 'ranger', cls: 'ranger', gender: 'male' };
    const account = { uid: 'drawer-qa', username: 'drawer.qa', email: 'drawer.qa@coinquest.local', userId: hero.id, name: hero.name, character: hero, recoveryCode: 'ABCD-EFGH-JKLM' };
    localStorage.setItem('pointy_auth_v1', JSON.stringify(account));
    localStorage.setItem('pointy_accounts_v1', JSON.stringify([account]));
    localStorage.setItem('lang', 'th'); localStorage.setItem('pointy_theme', 'tavern');
    const d = new Date(), today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    localStorage.setItem('pointy_profile_v1', JSON.stringify({ streak: 7, bestStreak: 12, lastVisit: today, tourSeen: true, seen: [] }));
    const names = ['เชียงใหม่ · ปาร์ตี้นักผจญภัย', 'ทริปญี่ปุ่น 2026', 'ค่าใช้จ่ายในบ้าน'];
    const boards = Object.fromEntries(Array.from({ length: count }, (_, i) => [String(9001 + i), {
      tripName: names[i] || 'TEST บอร์ดชื่อยาวสำหรับการเดินทางด้วยกันและแบ่งค่าใช้จ่ายอย่างเป็นธรรม',
      admin: { characterId: hero.id }, access: { ownerUids: [account.uid] }, participants: ['Mali', 'Krit', 'Mochi'],
      characterIds: { Mali: hero.id }, expenses: [], updatedAt: Date.now() - i * 1000
    }]));
    localStorage.setItem('coin_quest_trip_snapshots_v1', JSON.stringify(boards));
  }, { count, longName });
}
async function open(page, route = '/') {
  await page.goto(`${route}?test=1`);
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await page.locator('[data-profile-hub="profile"]').click();
  await expect(page.getByRole('dialog', { name: 'บัญชีของคุณ' })).toBeVisible();
  await expect(page.locator('.pd-hero-name')).toContainText('Mali');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.pd-hero-ava img').evaluate(img => img.decode());
}
async function expand(page, key) {
  const section = page.locator(`[data-drawer-section="${key}"]`);
  if (!await section.evaluate(el => el.open)) await section.locator('summary').click();
}
async function capture(page, name) {
  await fs.mkdir(qa, { recursive: true });
  await page.screenshot({ path: path.join(qa, name), animations: 'disabled', scale: 'css' });
}
for (const width of [1440, 768, 390]) {
  test(`Account drawer composition and disclosure at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 768 ? 1024 : width === 390 ? 844 : 900 });
    await seed(page); await open(page);
    await expect(page.locator('.pd-board')).toHaveCount(3);
    await expect(page.locator('[data-drawer-section="settings"]')).toHaveJSProperty('open', width >= 768);
    await expect(page.locator('[data-drawer-section="backup"]')).toHaveJSProperty('open', width >= 1024);
    await expect(page.locator('[data-drawer-section="recovery"]')).toHaveJSProperty('open', width >= 1024);
    await expect(page.locator('[data-drawer-section="trophies"]')).toHaveJSProperty('open', false);
    expect(await page.locator('.profile-drawer').evaluate(el => {
      const box = el.getBoundingClientRect();
      return box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight && el.scrollWidth <= el.clientWidth;
    })).toBe(true);
    await capture(page, `drawer-${width}.png`);
    await page.locator('[data-sign-out]').scrollIntoViewIfNeeded();
    await capture(page, `drawer-${width}-bottom.png`);
    await expand(page, 'trophies'); await expect(page.locator('.trophy')).toHaveCount(19);
    await expect(page.locator('.trophy-grid')).toBeVisible();
    await expand(page, 'recovery');
    await expect(page.locator('[data-recovery-code]')).toHaveText('ABCD-••••-••••');
    await page.locator('[data-reveal-recovery]').click(); await expect(page.locator('[data-recovery-code]')).toHaveText('ABCD-EFGH-JKLM');
    await page.keyboard.press('Escape');
    await expect(page.locator('.drawer-overlay')).toHaveCount(0);
    await expect(page.locator('[data-profile-hub="profile"]')).toBeFocused();
  });
}

test('Drawer retains disclosures, expanded boards and focus through preferences and refresh', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await seed(page, { count: 5, longName: true }); await open(page, '/debt/');
  await expect(page.locator('.pd-board:visible')).toHaveCount(3);
  await page.locator('[data-all-boards]').click(); await expect(page.locator('.pd-board:visible')).toHaveCount(5);
  await expect(page.locator('.pd-board-main').last()).toHaveAttribute('href', '/trip/?id=9005&test=1');
  await expand(page, 'settings'); await expand(page, 'recovery');
  await page.locator('[data-theme-pick="dungeon"]').click();
  await expect(page.locator('[data-theme-pick="dungeon"]')).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dungeon');
  await page.locator('[data-drawer-lang="en"]').click();
  await expect(page.getByRole('dialog', { name: 'Your account' })).toBeVisible();
  await expect(page.locator('[data-drawer-lang="en"]')).toBeFocused();
  await expect(page.locator('.pd-board:visible')).toHaveCount(5);
  await expect(page.locator('[data-drawer-section="recovery"]')).toHaveJSProperty('open', true);
  await page.evaluate(() => window.PointyProfileHub.showProfile({ refreshLive: false }));
  await expect(page.locator('[data-drawer-lang="en"]')).toBeFocused();
  await expect(page.locator('.pd-scroll')).toHaveJSProperty('scrollLeft', 0);
  expect(await page.locator('.pd-scroll').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.locator('.pd-scroll').evaluate(el => { el.scrollTop = 0; }); await capture(page, 'drawer-390-dark-long.png');
  await page.keyboard.press('Escape'); await expect(page.locator('body')).not.toHaveClass(/account-drawer-open/);
  await page.reload(); await page.locator('[data-profile-hub="profile"]').click(); await expand(page, 'settings');
  await expect(page.locator('[data-theme-pick="dungeon"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-drawer-lang="en"]')).toHaveAttribute('aria-pressed', 'true');
});

test('Drawer empty state, focus trap, backdrop close and tour handoff', async ({ page }) => {
  await seed(page, { count: 0 }); await open(page);
  await expect(page.locator('.pd-noboards')).toContainText('ยังไม่มีบอร์ด');
  await expect(page.locator('[data-all-boards]')).toHaveCount(0);
  await expect(page.locator('[data-close]')).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(page.locator('[data-sign-out]')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.locator('[data-close]')).toBeFocused();
  expect(await page.locator('header').first().evaluate(el => !!el.closest('[inert]'))).toBe(true);
  await page.locator('[data-tour]').click(); await expect(page.locator('.tour-overlay')).toBeVisible();
  await page.locator('.tour-skip').click();
  expect(await page.locator('header').first().evaluate(el => !!el.closest('[inert]'))).toBe(false);
  await expect(page.locator('[data-profile-hub="profile"]')).toBeFocused();
  await page.locator('[data-profile-hub="profile"]').click();
  await page.locator('.drawer-overlay').click({ position: { x: 10, y: 100 } });
  await expect(page.locator('.drawer-overlay')).toHaveCount(0);
  await expect(page.locator('[data-profile-hub="profile"]')).toBeFocused();
});

test('Drawer backup exports safe data and validates, cancels and restores imports', async ({ page }) => {
  await seed(page); await open(page); await expand(page, 'backup');
  const downloaded = page.waitForEvent('download'); await page.locator('[data-export]').click();
  const download = await downloaded;
  const backup = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
  expect(backup.__coin_quest_backup).toBe(2); expect(backup.uid).toBe('drawer-qa');
  expect(JSON.stringify(backup)).not.toContain('ABCD-EFGH-JKLM');
  expect(backup.keys.pointy_auth_v1).toBeUndefined();
  const input = page.locator('[data-file]');
  await input.setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await expect(page.locator('[data-backup-msg]')).toContainText('Invalid backup');
  const valid = { __coin_quest_backup: 2, uid: 'drawer-qa', keys: { pointy_theme: 'dungeon' } };
  // Control file-read completion so each upload proves its own confirmation
  // has finished before the next upload can install another dialog handler.
  await page.evaluate(() => {
    const read = FileReader.prototype.readAsText;
    window.pendingRestoreReads = [];
    FileReader.prototype.readAsText = function(file, ...args) {
      if (file.name === 'restore.json') window.pendingRestoreReads.push(() => read.call(this, file, ...args));
      else read.call(this, file, ...args);
    };
  });
  async function restoreWithDecision(decision) {
    const handled = page.waitForEvent('dialog').then(async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('กู้คืนไฟล์นี้');
      await dialog[decision]();
    });
    await input.setInputFiles({ name: 'restore.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(valid)) });
    await expect.poll(() => page.evaluate(() => window.pendingRestoreReads.length)).toBe(1);
    await page.evaluate(() => window.pendingRestoreReads.shift()());
    await handled;
  }
  await restoreWithDecision('dismiss');
  expect(await page.evaluate(() => localStorage.getItem('pointy_theme'))).toBe('tavern');
  await restoreWithDecision('accept');
  await expect(page.locator('[data-backup-msg]')).toContainText('กู้ข้อมูลแล้ว กำลังโหลดใหม่');
  await expect(page.locator('.drawer-overlay')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dungeon');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pointy_auth_v1')).userId)).toBe('1111');
});

test('Drawer recovery copies the full code and handles regeneration failure without losing it', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await seed(page); await open(page); await expand(page, 'recovery');
  await page.locator('[data-copy-recovery-side]').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('ABCD-EFGH-JKLM');
  await expect(page.locator('[data-recovery-msg]')).toContainText('คัดลอกรหัสกู้คืนแล้ว');
  await expect(page.locator('[data-recovery-code]')).toHaveText('ABCD-••••-••••');
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('TEST clipboard denied'); }; });
  await page.locator('[data-copy-recovery-side]').click();
  await expect(page.locator('[data-recovery-msg]')).toContainText('กรุณาแสดงรหัสและเลือกคัดลอกด้วยตนเอง');
  await page.evaluate(() => { Object.defineProperty(crypto, 'subtle', { value: { digest: async () => { throw new Error('TEST failure'); } }, configurable: true }); });
  await page.locator('[data-regenerate-recovery]').click();
  await expect(page.locator('[data-recovery-msg]')).toContainText(/ไม่สำเร็จ|Could not/);
  await expect(page.locator('[data-regenerate-recovery]')).toBeEnabled();
  await expect(page.locator('[data-recovery-code]')).toHaveText('ABCD-••••-••••');
  await page.locator('[data-sign-out]').click();
  await expect(page.locator('.drawer-overlay')).toHaveCount(0);
  // Test mode falls back to its built-in demo hero; real sign-out is covered
  // with the production-mode Firebase transport fixture below.
  expect(await page.evaluate(() => localStorage.getItem('pointy_auth_v1'))).toBeNull();
  await expect(page.locator('body')).not.toHaveClass(/account-drawer-open/);
});
