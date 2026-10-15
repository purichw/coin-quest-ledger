import { test, expect } from '@playwright/test';
import { openAdminFixture, adminNav, adminTools } from './helpers/admin-fixture.mjs';

const pages = ['Dashboard', 'Relationship Map', 'Boards', 'Users', 'Board Admins', 'Deleted IDs', 'Audit Log', 'Version Control', 'Support Tools'];
test.beforeEach(async ({ page }, info) => {
  await page.setViewportSize({ width: { chromium: 1440, tablet: 768, mobile: 390 }[info.project.name], height: 900 });
});

test('all Admin destinations share the same header, parchment, footer and navigation', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openAdminFixture(page);
  const source = await page.evaluate(() => JSON.stringify(draft));
  let baseline;
  for (const name of pages) {
    await adminNav(page, name);
    await expect(page.locator('.page-title')).toBeVisible();
    await expect(page.locator('.nav-item[aria-current="page"]')).toHaveAttribute('aria-label', name);
    await expect(page.locator('.topbar')).toHaveCount(1);
    await expect(page.locator('.admin-footer')).toHaveCount(1);
    const geometry = await page.evaluate(() => {
      const main = document.querySelector('.main'), title = document.querySelector('.page-title');
      const frame = main.getBoundingClientRect(), heading = title.getBoundingClientRect();
      const style = getComputedStyle(main);
      return { header: document.querySelector('.topbar').getBoundingClientRect().height, x: frame.x, width: frame.width,
        titleInset: heading.left - frame.left, titleRight: heading.right <= frame.right - 8,
        paper: style.borderImageSource, paperColor: style.backgroundColor,
        cards: [...document.querySelectorAll('.admin-page .card')].map(card => getComputedStyle(card).backgroundColor),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
    });
    baseline ||= geometry;
    expect(geometry.header).toBe(baseline.header);
    expect(geometry.x).toBe(baseline.x);
    expect(geometry.width).toBe(baseline.width);
    expect(geometry.titleInset).toBeGreaterThanOrEqual(12);
    expect(geometry.titleRight).toBe(true);
    expect(geometry.paper).toContain('parchment.webp');
    expect(geometry.paperColor, name).toBe(baseline.paperColor);
    // Relationship Map's mobile overview/rules are transparent over shared paper.
    for (const color of geometry.cards.filter(color => color !== 'rgba(0, 0, 0, 0)')) {
      expect(color, `${name} card surface`).toBe(baseline.cards[0]);
    }
    expect(geometry.overflow, name).toBe(false);
  }
  await page.getByRole('link', { name: 'Super Admin Portal — Dashboard' }).click();
  await expect(page.locator('.page-title')).toHaveText('Dashboard');
  expect(await page.evaluate(() => JSON.stringify(draft))).toBe(source);
  expect(errors).toEqual([]);
});

test('Admin menu and header actions remain accessible across compact and desktop layouts', async ({ page }) => {
  await openAdminFixture(page);
  const nav = page.getByRole('button', { name: 'Open navigation', exact: true });
  if (await nav.isVisible()) {
    await expect(page.locator('.sidebar')).toHaveAttribute('inert', '');
    await nav.click();
    const close = page.getByRole('button', { name: 'Close navigation', exact: true });
    await expect(close).toBeFocused();
    await expect(page.locator('.main')).toHaveAttribute('inert', '');
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('.sidebar').getByRole('button', { name: 'Support Tools', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(nav).toBeFocused();
    await expect(page.locator('.main')).not.toHaveAttribute('inert', '');
    await nav.click();
    await page.locator('.nav-backdrop').click({ position: { x: (await page.viewportSize()).width - 10, y: 100 } });
    await expect(nav).toHaveAttribute('aria-expanded', 'false');
  }
  await adminTools(page);
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore', exact: true })).toBeVisible();
  await expect(page.locator('#publish-btn')).toBeVisible();
  if (await nav.isVisible()) {
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open admin actions', exact: true })).toBeFocused();
    await nav.click();
    await page.setViewportSize({ width: 1440, height: 700 });
    await expect(page.locator('body')).not.toHaveClass(/admin-nav-open/);
    await expect(page.locator('.sidebar')).not.toHaveAttribute('inert', '');
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 480 });
  await adminNav(page, 'Support Tools');
  await expect(page.locator('.page-title')).toHaveText('Support Tools');
  await adminTools(page);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.locator('.gate')).toBeVisible();
  await expect(page.locator('body')).not.toHaveClass(/admin-(nav|actions)-open/);
});

test('Dashboard shows real totals and its actions reach the existing workflows', async ({ page }) => {
  await openAdminFixture(page);
  await expect(page.locator('.dashboard-stat .s-val')).toHaveText(['12', '13', '0', '5']);
  await page.getByRole('button', { name: 'Activity', exact: true }).click();
  await expect(page.locator('.dashboard-content > :first-child')).toHaveClass('dashboard-panels');
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await expect(page.locator('.dashboard-content > :first-child')).toHaveClass('dashboard-kpis');
  await page.locator('.dashboard-stat').nth(2).click();
  await expect(page.locator('.page-title')).toHaveText('Boards');
  expect(await page.evaluate(() => boardFilter)).toBe('debt');
  await adminNav(page, 'Dashboard');
  await page.locator('.dashboard-attention').getByRole('button', { name: 'Open', exact: true }).first().click();
  await expect(page.locator('.admin-page')).toContainText('1397');
  await expect(page.getByRole('button', { name: 'Archive board', exact: true })).toBeVisible();
  await adminNav(page, 'Dashboard');
  await page.locator('.dashboard-quick').getByRole('button', { name: /View users/ }).click();
  await expect(page.locator('.page-title')).toHaveText('Users');
  await page.getByRole('button', { name: /^Details 1100/ }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  await adminNav(page, 'Dashboard');
  await page.locator('.dashboard-quick').getByRole('button', { name: /Version control/ }).click();
  await expect(page.locator('.page-title')).toHaveText('Versions & Publishing');
  await adminNav(page, 'Dashboard');
  await page.locator('.dashboard-quick').getByRole('button', { name: /Reset password/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Reset password');
  await page.keyboard.press('Escape');
  await expect(page.locator('.dashboard-quick').getByRole('button', { name: /Reset password/ })).toBeFocused();
  await page.locator('.dashboard-quick').getByRole('button', { name: /New board/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'ยืนยัน', exact: true }).click();
  expect(await page.evaluate(() => draft.boards.length)).toBe(13);
  expect(await page.evaluate(() => published.boards.length)).toBe(12);
});

test('empty Dashboard does not invent activity, counts or alerts', async ({ page }) => {
  await openAdminFixture(page, { empty: true, edits: false });
  await expect(page.locator('.dashboard-stat .s-val')).toHaveText(['0', '0', '0', '0']);
  await expect(page.getByText('No unpublished changes')).toBeVisible();
  await expect(page.getByText('No boards need attention')).toBeVisible();
});
