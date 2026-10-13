import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const qa = path.resolve('docs/welcome-tour-redesign-2026-10-13/qa');
async function fixture(page, { english = false, dark = false } = {}) {
  await page.addInitScript(({ english, dark }) => {
    if (sessionStorage.getItem('tour-fixture')) return;
    sessionStorage.setItem('tour-fixture', '1');
    const hero = { id: '7788', name: 'TEST Adventurer', class: 'ranger', cls: 'ranger', gender: 'female' };
    localStorage.setItem('pointy_auth_v1', JSON.stringify({ uid: 'tour-qa', username: 'tour.qa', name: hero.name, userId: hero.id, character: hero }));
    localStorage.setItem('pointy_profile_v1', JSON.stringify({ tourSeen: false, streak: 2, bestStreak: 2, lastVisit: new Date().toISOString().slice(0, 10) }));
    localStorage.setItem('lang', english ? 'en' : 'th');
    localStorage.setItem('pointy_theme', dark ? 'dungeon' : 'tavern');
  }, { english, dark });
}
async function openTour(page) {
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await expect(page.locator('.login-gate')).toHaveCount(0);
  await page.locator('[data-profile-hub="profile"]').click();
  await page.locator('[data-tour]').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function readyArt(page) {
  await expect.poll(() => page.locator('.tour-card img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0))).toBe(true);
  await page.locator('.tour-card img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
}
async function capture(page, testInfo, name) {
  const output = testInfo.outputPath(name);
  await page.screenshot({ path: output, animations: 'disabled' });
  await fs.mkdir(qa, { recursive: true });
  await fs.copyFile(output, path.join(qa, name));
}
async function seen(page) {
  return page.evaluate(() => Object.keys(localStorage).filter(k => k.includes('pointy_profile_v1')).map(k => JSON.parse(localStorage.getItem(k))).some(p => p?.tourSeen === true));
}
const ids = ['welcome', 'party', 'debt', 'treasury', 'compare'];
for (const width of [1440, 768, 390]) {
  test(`Welcome Tour five illustrated steps at ${width}px`, async ({ page }, testInfo) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await fixture(page);
    await page.setViewportSize({ width, height: width === 768 ? 1024 : width === 390 ? 844 : 900 });
    await page.goto('/?test=1'); await openTour(page);
    await expect(page.locator('.tour-back')).toBeDisabled();
    for (let index = 0; index < ids.length; index += 1) {
      await readyArt(page);
      await expect(page.locator('.tour-card')).toHaveClass(new RegExp(`tour-${ids[index]}`));
      await expect(page.locator('.tour-dot')).toHaveCount(5);
      await expect(page.locator('.tour-dot[aria-current="step"]')).toHaveAttribute('data-step', String(index));
      expect(await page.locator('.tour-card').evaluate(el => {
        const box = el.getBoundingClientRect();
        return box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight && el.scrollWidth <= el.clientWidth;
      })).toBe(true);
      if (index > 0) await expect(page.locator('.tour-points')).toBeVisible({ visible: width >= 768 });
      await capture(page, testInfo, `tour-${width}-${ids[index]}.png`);
      await page.locator('.tour-next').click();
    }
    await expect(page.locator('.tour-overlay')).toHaveCount(0);
    expect(await seen(page)).toBe(true);
    await expect(page.locator('[data-profile-hub="profile"]')).toBeFocused();
    await page.reload();
    expect(await seen(page)).toBe(true);
    await openTour(page);
    await expect(page.locator('.tour-welcome')).toBeVisible();
    await page.locator('.tour-skip').click();
    await expect(page).toHaveURL(/\/\?test=1$/);
    expect(errors).toEqual([]);
  });
}

test('Tour supports Back, direct steps, keyboard focus, Escape and replay without changing game data', async ({ page }) => {
  await fixture(page); await page.goto('/?test=1');
  const financial = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(key => /pointy_(debt|treasury|compare|auth)/.test(key)).map(key => [key, localStorage.getItem(key)])));
  const before = await financial();
  await openTour(page);
  await expect(page.locator('#tour-title')).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(page.locator('.tour-next')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.locator('.tour-skip')).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(page.locator('.tour-next')).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.locator('.tour-party')).toBeVisible();
  expect(await page.locator('.tour-card').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.locator('.tour-back').click(); await expect(page.locator('.tour-welcome')).toBeVisible();
  await page.locator('[data-step="4"]').click(); await expect(page.locator('.tour-compare')).toBeVisible();
  await expect(page.locator('.tour-next')).toContainText('เริ่มลุย');
  await page.keyboard.press('Escape'); await expect(page.locator('.tour-overlay')).toHaveCount(0);
  await expect(page.locator('[data-profile-hub="profile"]')).toBeFocused();
  await expect(page.locator('body')).not.toHaveClass(/tour-open/);
  expect(await page.locator('main').evaluateAll(elements => elements.every(el => !el.inert))).toBe(true);
  expect(await seen(page)).toBe(true);
  expect(await financial()).toEqual(before);
  await openTour(page); await page.locator('.tour-skip').click();
  await page.reload(); expect(await seen(page)).toBe(true);
});

test('Tour English copy, dark backdrop, short viewport and reduced motion', async ({ page }, testInfo) => {
  await fixture(page, { english: true, dark: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 568 });
  await page.goto('/?test=1'); await openTour(page); await readyArt(page);
  await expect(page.locator('.tour-t')).toContainText('Welcome to');
  expect(await page.locator('.tour-card').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await capture(page, testInfo, 'tour-mobile-english-dark.png');
  await page.setViewportSize({ width: 320, height: 400 });
  for (let i = 0; i < 5; i += 1) {
    await expect(page.locator('.tour-next')).toBeInViewport();
    await expect(page.locator('.tour-skip')).toBeInViewport();
    expect(await page.locator('.tour-card').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.locator('.tour-next').click();
  }
  await expect(page.locator('.tour-overlay')).toHaveCount(0);
});

test('Shared tour closes back to the active module', async ({ page }) => {
  await fixture(page);
  for (const route of ['/trip/?test=1', '/debt/?test=1', '/treasury/?test=1']) {
    await page.goto(route); await openTour(page); await readyArt(page);
    await page.locator('.tour-next').click();
    await page.locator('.tour-skip').click();
    expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(route);
    await expect(page.locator('body')).not.toHaveClass(/tour-open/);
  }
});
