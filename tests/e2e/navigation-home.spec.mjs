import { test, expect } from '@playwright/test';

async function fixture(page) {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('navigation-fixture')) return;
    sessionStorage.setItem('navigation-fixture', '1');
    const hero = { id: '7777', name: 'TEST Adventurer', class: 'seraph', cls: 'seraph', gender: 'male' };
    localStorage.setItem('pointy_auth_v1', JSON.stringify({ uid: 'navigation-qa', username: 'navigation.qa', userId: '7777', name: hero.name, character: hero }));
    localStorage.setItem('pointy_character_registry_v1', JSON.stringify({ '7777': hero }));
    localStorage.setItem('lang', 'th');
    localStorage.setItem('pointy_theme', 'tavern');
    localStorage.setItem('pointy_profile_v1', JSON.stringify({ streak: 2, bestStreak: 2, lastVisit: new Date().toISOString().slice(0, 10), tourSeen: true }));
    localStorage.setItem('pointy_debt_v5', JSON.stringify({ dragons: [], slayer: hero }));
    localStorage.setItem('pointy_compare_v2', '[]');
    localStorage.setItem('pointy_treasury_v1', JSON.stringify({ income: 0, categories: [], expenses: [], bills: [] }));
    localStorage.setItem('coin_quest_recent_route_v1', JSON.stringify({ href: '/trip/?id=9901&test=1' }));
    sessionStorage.setItem('pointy_test_trip_9901', JSON.stringify({ tripName: 'TEST Navigation Party', participants: [hero.name], characterIds: { [hero.name]: hero.id }, heroClasses: { [hero.name]: hero.class }, expenses: [], updatedAt: 100 }));
  });
}
async function ready(page) {
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await expect(page.locator('.login-gate')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.cq-nav a')).toHaveCount(5);
}
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
}
for (const width of [1440, 768, 390]) {
  test(`Home and navigation at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await fixture(page); await page.goto('/?test=1'); await ready(page);
    await expect(page.locator('.game-card')).toHaveCount(4);
    expect(await page.locator('.game-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(width === 390 ? 1 : 2);
    expect(await page.locator('.home img').evaluateAll(els => els.every(img => img.complete && img.naturalWidth > 0))).toBeTruthy();
    await noOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`home-${width}.png`), fullPage: true });
    const nav = width === 390 ? '.mtabbar' : '.cq-nav';
    await expect(page.locator(`${nav} [aria-current="page"]`)).toHaveAttribute('data-mtab', 'home');
    await page.locator('[data-home-card="compare"]').click();
    await expect(page.locator('#compare-view')).toBeVisible();
    await expect(page.locator(`${nav} [aria-current="page"]`)).toHaveAttribute('data-mtab', 'compare');
    await page.goBack();
    await expect(page.locator('#home-view')).toBeVisible();
    await expect(page.locator(`${nav} [aria-current="page"]`)).toHaveAttribute('data-mtab', 'home');
    await page.locator('[data-profile-hub="theme"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dungeon');
    await page.screenshot({ path: testInfo.outputPath(`home-dark-${width}.png`), fullPage: true });
    await page.locator('[data-profile-hub="theme"]').click();
    await page.locator(width === 390 ? '.cq-lang-compact' : '.lang-btn[data-lang="en"]').click();
    await expect(page.locator('[data-home-card="split"] h2')).toHaveText('Split Expenses');
    await noOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`home-en-${width}.png`), fullPage: true });
    if (width === 390) {
      await page.locator('.tb-burger').click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.locator('[data-mm-close]')).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(page.locator('[data-mm-action="logout"]')).toBeFocused();
      await page.locator('[data-mm-theme="dungeon"]').click();
      await expect(page.locator('[data-mm-theme="dungeon"]')).toBeFocused();
      await page.locator('[data-mm-lang="th"]').click();
      await expect(page.locator('[data-mm-lang="th"]')).toBeFocused();
      await page.locator('[data-mm-theme="tavern"]').click();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.locator('.tb-burger')).toBeFocused();
      await expect(page.locator('body')).not.toHaveClass(/cq-menu-open/);
      await page.locator('.home-hi').click();
      await page.setViewportSize({ width: 390, height: 1120 });
      await page.screenshot({ path: testInfo.outputPath('home-mobile-composition.png'), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
    }
    await page.locator('[data-home-action="reminders"]').click();
    await expect(page.locator('.rem-panel')).toBeVisible();
    await page.locator('.rem-panel [data-close]').click();
    await page.locator('[data-profile-hub="profile"]').click();
    await expect(page.locator('.profile-drawer')).toBeVisible();
    await page.locator('.profile-drawer [data-close]').click();
    await page.locator('[data-home-action="party"]').click();
    await expect(page.locator('#bc-board-name')).toBeVisible();
    await noOverflow(page);
    expect(errors).toEqual([]);
  });
}

for (const width of [1440, 768, 390]) test(`shared navigation works on all four modules at ${width}px`, async ({ page }) => {
  await fixture(page); await page.setViewportSize({ width, height: 844 });
  const nav = width === 390 ? '.mtabbar' : '.cq-nav';
  await page.goto('/?test=1'); await ready(page);
  for (const id of ['split', 'debt', 'treasury', 'compare', 'home']) {
    await page.locator(`${nav} [data-mtab="${id}"]`).click(); await ready(page);
    await expect(page.locator(`${nav} [aria-current="page"]`)).toHaveAttribute('data-mtab', id);
    await noOverflow(page);
  }
  await page.reload(); await ready(page);
  await expect(page.locator('[data-home-action="resume"]')).toHaveAttribute('href', '/?view=compare&test=1');
});
