import { test, expect } from '@playwright/test';
import { partyLayoutFixture } from './helpers/party-layout-fixture.mjs';

for (const width of [1440, 768, 390]) test(`Expanded party and Hero chooser at ${width}px`, async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await partyLayoutFixture(page, { count: 7, longNames: true });
  await page.goto('/trip/?id=4821&test=1');
  await expect(page.locator('#party-count')).toHaveText('7');
  await expect(page.locator('.board-breadcrumb')).toContainText('ทริปพะวัน');
  await expect(page.locator('[data-board-details]')).toHaveCount(0);
  const expectedColumns = width > 1000 ? 3 : width > 600 ? 2 : 1;
  const rects = await page.locator('#party-grid > .hero-card').evaluateAll(cards => cards.map(card => {
    const r = card.getBoundingClientRect();
    return { x: r.x, y: r.y, right: r.right };
  }));
  expect(new Set(rects.map(r => Math.round(r.x))).size).toBe(expectedColumns);
  expect(rects[expectedColumns].y).toBeGreaterThan(rects[0].y);
  const classBackgrounds = await page.locator('#party-grid .portrait').evaluateAll(els => els.map(el => getComputedStyle(el).backgroundImage));
  expect(new Set(classBackgrounds).size).toBe(7);
  for (const card of await page.locator('#party-grid > .hero-card').all()) {
    await expect(card.locator('.hero-class-row')).toBeVisible();
    await expect(card.locator('.bars')).toBeVisible();
    await expect(card.locator('.hero-foot')).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  const log = await page.locator('#board-log-panel').boundingBox();
  const banner = await page.locator('.board-banner').boundingBox();
  const members = await page.locator('.board-members').boundingBox();
  expect(Math.abs(log.width - (width > 1000 ? members.width : banner.width))).toBeLessThan(2);
  if (width > 1000) expect(log.y - (members.y + members.height)).toBeLessThanOrEqual(15);
  const shortcut = await page.locator('.board-sticky').boundingBox();
  expect(shortcut.width).toBeLessThan(210);
  expect(shortcut.height).toBeLessThan(55);
  expect(shortcut.x).toBeGreaterThan(width / 2);

  await page.locator('.add-hero').click();
  await page.getByRole('button', { name: 'เพิ่ม Guest', exact: true }).click();
  await page.locator('#new-hero-name').fill('TEST Guest');
  await expect(page.locator('#confirm-hero-btn')).toBeDisabled();
  const choose = page.locator('.choose-hero-btn');
  await choose.click();
  const picker = page.locator('#party-hero-picker');
  await expect(picker).toBeVisible();
  await expect(picker.locator('.picker-cell')).toHaveCount(36);
  const pickerBackgrounds = await picker.locator('.pc-art').evaluateAll(els => els.map(el => getComputedStyle(el).backgroundImage));
  expect(new Set(pickerBackgrounds).size).toBe(18);
  await expect(picker.locator('.picker-close')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(picker.locator('.picker-cell').last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(picker.locator('.picker-close')).toBeFocused();
  const cell = picker.locator('.picker-cell').first();
  expect(await cell.evaluate(el => el.clientHeight >= el.querySelector('.pc-art').clientHeight + el.querySelector('.pc-name').clientHeight)).toBeTruthy();
  await page.keyboard.press('Escape');
  await expect(picker).toHaveCount(0);
  await expect(choose).toBeFocused();
  await expect(page.locator('#new-hero-name')).toHaveValue('TEST Guest');
  await choose.click();
  await picker.getByRole('button', { name: '♀ หญิง', exact: true }).click();
  await expect(picker.locator('.picker-cell')).toHaveCount(18);
  await picker.locator('[data-class="archfiend"][data-gender="female"]').click();
  await expect(choose).toBeFocused();
  await expect(choose).toContainText('จอมอสูร');
  await page.locator('#confirm-hero-btn').click();
  await page.getByRole('button', { name: 'ยืนยันถาวร', exact: true }).click();
  await expect(page.locator('#party-count')).toHaveText('8');
  const card = page.locator('#party-grid > .hero-card').filter({ has: page.locator('.hero-name', { hasText: 'TEST Guest' }) });
  await expect(card.locator('.bars')).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('pointy_test_trip_4821')).guestHeroes['TEST Guest'])).toBe(true);
  await page.reload();
  await expect(page.locator('#party-count')).toHaveText('8');
  await expect(card.locator('.hero-class')).toHaveText('จอมอสูร');
  const saved = await page.evaluate(() => JSON.parse(sessionStorage.getItem('pointy_test_trip_4821')));
  expect(saved.characterIds['TEST Guest']).toBeUndefined();
  expect(saved.heroGenders['TEST Guest']).toBe('female');
  await page.locator('[data-board-add]').click();
  await expect(page.locator('#exp-desc')).toBeFocused();
  expect(errors).toEqual([]);
});

test('Party log fills the desktop gap and keeps input/focus when the layout stacks', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await partyLayoutFixture(page);
  await page.goto('/trip/?id=4821&test=1');
  await expect(page.locator('#party-count')).toHaveText('3');
  const members = await page.locator('.board-members').boundingBox();
  const log = await page.locator('#board-log-panel').boundingBox();
  expect(log.y - members.y - members.height).toBeCloseTo(14, 0);
  await page.locator('#exp-desc').fill('Unfinished expense');
  const search = page.locator('#board-log-search');
  await search.fill('Keep this filter');
  for (const width of [768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.locator(width > 1000 ? '.board-left > #board-log-panel' : '.board-columns > #board-log-panel')).toHaveCount(1);
    await expect(search).toHaveValue('Keep this filter');
    await expect(search).toBeFocused();
    await expect(page.locator('#exp-desc')).toHaveValue('Unfinished expense');
  }
});

test('Expanded party preserves budget editing and honours hidden game stats', async ({ page }) => {
  await partyLayoutFixture(page);
  await page.goto('/trip/?id=4821&test=1');
  const first = page.locator('#party-grid > .hero-card').first();
  await first.locator('.budget-btn').click();
  await first.locator('.budget-edit').fill('5000');
  await first.locator('.budget-edit').press('Enter');
  await expect(first.locator('.budget-btn')).toHaveText('฿5,000');
  expect(await first.locator('.bar-fill').first().evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThan(20);
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('pointy_test_trip_4821')).budgets?.Pointy)).toBe(5000);
  // Use persisted settings as the fixture boundary for the intentional
  // stats-off rendering state; financial details must remain visible.
  await page.evaluate(() => {
    const key = 'pointy_test_trip_4821', board = JSON.parse(sessionStorage.getItem(key));
    board.settings.stats = false;
    sessionStorage.setItem(key, JSON.stringify(board));
  });
  await page.reload();
  await expect(first.locator('.bars')).toHaveCount(0);
  await expect(first.locator('.hero-class-row')).toBeVisible();
  await expect(first.locator('.hero-foot')).toBeVisible();
  await expect(page.locator('[data-board-details]')).toHaveCount(0);
});
