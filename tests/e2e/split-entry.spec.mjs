import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

async function capture(page, testInfo, name) {
  const file = testInfo.outputPath(name);
  await page.screenshot({ path: file, fullPage: true });
  if (process.env.CQ_ENTRY_SNAPSHOTS === '1') {
    const dir = path.resolve('docs/split-entry-redesign-2026-10-13/qa');
    await fs.mkdir(dir, { recursive: true }); await fs.copyFile(file, path.join(dir, name));
  }
}

async function fixture(page, populated = true) {
  await page.addInitScript(populated => {
    if (sessionStorage.getItem('split-entry-fixture')) return;
    sessionStorage.setItem('split-entry-fixture', '1');
    const hero = { id: '7777', name: 'TEST Adventurer', class: 'seraph', cls: 'seraph', gender: 'male' };
    localStorage.setItem('pointy_auth_v1', JSON.stringify({ uid: 'entry-qa', username: 'entry.qa', userId: hero.id, name: hero.name, character: hero }));
    localStorage.setItem('pointy_character_registry_v1', JSON.stringify({ '7777': hero }));
    localStorage.setItem('lang', 'th'); localStorage.setItem('pointy_theme', 'tavern');
    localStorage.setItem('pointy_profile_v1', JSON.stringify({ streak: 2, tourSeen: true, lastVisit: new Date().toISOString().slice(0, 10) }));
    if (populated) for (const [id, name, time] of [['4810', 'TEST ทริปเชียงใหม่ 2026', 200], ['7290', 'TEST เกาะล้าน ซัมเมอร์ทริป', 100], ['8350', 'TEST Weekend adventure', 50]]) {
      sessionStorage.setItem('pointy_test_trip_' + id, JSON.stringify({ tripName: name, participants: [hero.name, 'TEST Guest'], guestHeroes: { 'TEST Guest': true }, characterIds: { [hero.name]: hero.id }, heroClasses: { [hero.name]: hero.class }, expenses: [], updatedAt: time }));
    }
  }, populated);
}
async function ready(page) {
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await expect(page.locator('.login-gate')).toHaveCount(0);
  await expect(page.locator('#bc-board-name')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
}
for (const width of [1440, 768, 390]) test(`Split entry composition and create/reopen at ${width}px`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  const errors = []; page.on('pageerror', error => errors.push(error.stack));
  await fixture(page); await page.goto('/trip/?test=1'); await ready(page);
  await expect(page.locator('.be-board')).toHaveCount(width === 390 ? 1 : 2);
  await noOverflow(page);
  expect(await page.locator('.be-page img').evaluateAll(imgs => imgs.every(img => img.complete && img.naturalWidth > 0))).toBeTruthy();
  await capture(page, testInfo, `entry-${width}.png`);
  if (width === 390) {
    await page.screenshot({ path: testInfo.outputPath('entry-mobile-top.png') });
    await page.locator('.be-join-button').scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('entry-mobile-bottom.png') });
    if (process.env.CQ_ENTRY_SNAPSHOTS === '1') for (const name of ['entry-mobile-top.png', 'entry-mobile-bottom.png']) await fs.copyFile(testInfo.outputPath(name), path.resolve('docs/split-entry-redesign-2026-10-13/qa', name));
  }
  await page.locator('[data-entry-all]').click(); await expect(page.locator('.be-board')).toHaveCount(3);
  await page.locator('[data-entry-all]').click(); await expect(page.locator('.be-board')).toHaveCount(width === 390 ? 1 : 2);
  await page.locator('#bc-board-name').fill('   '); await page.locator('.be-create-button').click();
  await expect(page.locator('#be-create-error')).not.toBeEmpty(); await expect(page.locator('#bc-board-name')).toBeFocused();
  await page.locator('#bc-board-name').fill(`TEST Created at ${width}`);
  await page.locator('[data-board-mode="join"]').click(); await expect(page.locator('#be-join-form')).toHaveCount(1);
  await page.locator('#bc-code').fill('-1'); await expect(page.locator('#bc-code')).toHaveValue('');
  await page.locator('#bc-code').fill('48'); await page.locator('.be-join-button').click();
  await expect(page.locator('#be-join-error')).toContainText('4'); await expect(page.locator('#bc-code')).toHaveValue('48');
  await page.locator('#bc-code').fill('0000'); await page.locator('.be-join-button').click();
  await expect(page.locator('#be-join-error')).toContainText('ไม่พบบอร์ด');
  await page.locator('[data-board-mode="new"]').click(); await expect(page.locator('#bc-board-name')).toHaveValue(`TEST Created at ${width}`);
  await page.locator('.be-create-button').click(); await expect(page).toHaveURL(/id=\d{4}/);
  const url = page.url(); const code = new URL(url).searchParams.get('id');
  await expect(page.locator('#trip-name-display')).toHaveText(`TEST Created at ${width}`);
  const saved = await page.evaluate(code => JSON.parse(sessionStorage.getItem('pointy_test_trip_' + code)), code);
  expect(saved.access.ownerUids).toContain('entry-qa'); expect(saved.admin.urlLocked).toBe(true);
  await page.reload(); await expect(page.locator('#trip-name-display')).toHaveText(`TEST Created at ${width}`);
  await page.goto('/trip/?test=1'); await ready(page);
  await expect(page.locator('.be-board').first()).toContainText(`TEST Created at ${width}`);
  await page.locator('.be-board').first().click(); await expect(page).toHaveURL(url);
  expect(errors).toEqual([]);
});

test('Split entry preserves drafts through language/theme changes and supports keyboard tabs', async ({ page }, testInfo) => {
  await fixture(page); await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/trip/?test=1'); await ready(page);
  await page.locator('#bc-board-name').fill('TEST ชื่อบอร์ดยาวสำหรับการเดินทางกับเพื่อนและครอบครัว');
  await page.locator('.cq-lang-compact').click(); await expect(page.locator('#bc-board-name')).toHaveValue(/TEST/);
  await expect(page.locator('.be-hero h1')).toHaveText('Split Expenses'); await noOverflow(page);
  await capture(page, testInfo, 'entry-mobile-en.png');
  await page.locator('[data-profile-hub="theme"]').click(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dungeon');
  await capture(page, testInfo, 'entry-mobile-dark.png');
  await page.locator('[data-board-mode="new"]').press('ArrowRight');
  await expect(page.locator('[data-board-mode="join"]')).toBeFocused(); await expect(page.locator('#bc-code')).toBeVisible();
  await page.locator('#bc-code').fill('4810'); await page.locator('#bc-code').press('Enter');
  await expect(page).toHaveURL(/id=4810/); await expect(page.locator('#trip-name-display')).toContainText('TEST ทริปเชียงใหม่');
});

test('Split entry recovers failed writes, prevents duplicate submits and keeps an empty account honest', async ({ page }, testInfo) => {
  await fixture(page, false); await page.goto('/trip/?test=1'); await ready(page);
  await expect(page.locator('.be-board')).toHaveCount(0); await expect(page.locator('.be-empty')).toContainText('สร้างบอร์ดแรก');
  await page.evaluate(() => {
    const write = TripStore.write.bind(TripStore);
    window.entryWrites = 0;
    TripStore.write = async value => { window.entryWrites++; if (window.entryWrites === 1) throw new Error('TEST write unavailable'); return write(value); };
  });
  await page.locator('#bc-board-name').fill('TEST Retry preserved'); await page.locator('.be-create-button').click();
  await expect(page.locator('#be-create-error')).toContainText('ลองอีกครั้ง'); await expect(page.locator('#bc-board-name')).toHaveValue('TEST Retry preserved');
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter(k => k.startsWith('pointy_test_trip_')))).toEqual([]);
  await capture(page, testInfo, 'entry-write-error.png');
  await page.locator('.be-create-button').click(); await expect(page).toHaveURL(/id=\d{4}/);
  await expect(page.locator('#trip-name-display')).toHaveText('TEST Retry preserved');
  await page.goto('/trip/?test=1'); await ready(page);
  await page.evaluate(() => { TripStore.write = () => new Promise(resolve => { window.finishEntryWrite = resolve; }); window.entryCreateAttempts = 0; const original = tripExists; tripExists = id => { window.entryCreateAttempts++; return original(id); }; });
  await page.locator('#bc-board-name').fill('TEST Busy'); await page.locator('.be-create-button').click();
  await expect(page.locator('.be-create-button')).toBeDisabled(); await expect(page.locator('[data-board-mode="join"]')).toBeDisabled();
  await page.evaluate(() => createBoardFromChoose()); expect(await page.evaluate(() => window.entryCreateAttempts)).toBe(1);
});

test('Split entry does not overwrite a board when every generated code collides', async ({ page }) => {
  await fixture(page); await page.goto('/trip/?test=1'); await ready(page);
  await page.evaluate(() => { window.collisionAttempts = 0; tripExists = async () => { window.collisionAttempts++; return true; }; });
  await page.locator('#bc-board-name').fill('TEST Collision'); await page.locator('.be-create-button').click();
  await expect(page.locator('#be-create-error')).toContainText('ลองอีกครั้ง');
  expect(await page.evaluate(() => window.collisionAttempts)).toBe(8);
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter(k => k.startsWith('pointy_test_trip_')).length)).toBe(3);
});
