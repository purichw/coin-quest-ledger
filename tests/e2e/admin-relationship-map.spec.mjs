import { test, expect } from '@playwright/test';
import { openRelationshipFixture } from './helpers/relationship-fixture.mjs';
import { adminNav } from './helpers/admin-fixture.mjs';

test.beforeEach(async ({ page }, info) => {
  await page.setViewportSize({ width: { chromium: 1440, tablet: 768, mobile: 390 }[info.project.name], height: 900 });
});

test('relationship map separates actual entities and preserves detail navigation without editing drafts', async ({ page }) => {
  await openRelationshipFixture(page);
  const source = await page.evaluate(() => JSON.stringify(draft));
  const groups = page.locator('.relmap > .rel-col');
  await expect(groups).toHaveCount(4);
  await expect(page.locator('.rel-node-label')).toHaveText(['Global User ID', 'Character', 'Admin IDs', 'Boards']);
  await expect(groups.nth(0)).toContainText('1 active character');
  await expect(groups.nth(1)).toContainText('120 XP');
  await expect(groups.nth(2)).toContainText('Simulator QA');
  await expect(groups.nth(3)).toContainText('TEST CQ Simulator QA 20261012');
  await expect(groups.nth(1).locator('.k-char')).toHaveJSProperty('tagName', 'SPAN');

  const boxes = await groups.evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect(); return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }));
  for (let i = 1; i < boxes.length; i++) {
    if (page.viewportSize().width >= 768) {
      expect(boxes[i].y).toBe(boxes[0].y);
      expect(boxes[i].x).toBeGreaterThan(boxes[i - 1].x + boxes[i - 1].width);
      expect(boxes[i].height).toBeCloseTo(boxes[0].height, 0);
    } else {
      expect(boxes[i].x).toBe(boxes[0].x);
      expect(boxes[i].y).toBeGreaterThan(boxes[i - 1].y + boxes[i - 1].height);
    }
  }
  for (const [entity, chip, kind, id] of [['user', 'user', 'user', '2150'], ['admin', 'admin', 'admin', '2150'], ['board', 'board', 'board', '3512'], ['char', 'board', 'board', '3512']]) {
    await page.locator(`.rel-col[data-entity="${entity}"] button.k-${chip}`).first().click();
    expect(await page.evaluate(() => detail)).toMatchObject({ kind, id });
    await expect(page.locator('.admin-page')).toContainText(id);
    await adminNav(page, 'Relationship Map');
  }
  expect(await page.evaluate(() => JSON.stringify(draft))).toBe(source);
});

test('mobile help is keyboard operable and rules remain visible at larger widths', async ({ page }) => {
  await openRelationshipFixture(page);
  await page.setViewportSize({ width: 390, height: 900 });
  const toggle = page.getByRole('button', { name: 'คำอธิบายและกฎการทำงาน' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.model-rules')).toBeHidden();
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.rel-legend-item')).toHaveCount(4);
  await expect(page.locator('.model-rules')).toContainText('Character details are managed in the account profile');
  await page.keyboard.press('Space');
  await expect(page.locator('.model-rules')).toBeHidden();
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(toggle).toBeHidden();
  await expect(page.locator('.model-rules')).toBeVisible();
});

test('multiple admin roles and long board names remain complete without duplicate boards or overflow', async ({ page }) => {
  await openRelationshipFixture(page);
  await page.evaluate(() => {
    const original = draft.boards[0];
    for (const id of ['3513', '3514']) {
      const copy = structuredClone(original);
      copy.originalId = copy.urlId = id;
      copy.tripName = `TEST ${'ชื่อบอร์ดยาวสำหรับทดสอบ'.repeat(6)} ${id}`;
      if (id === '3514') copy.adminId = '2390';
      draft.boards.push(copy);
    }
    render();
  });
  await expect(page.locator('.rel-node.admin')).toHaveCount(2);
  await expect(page.locator('.rel-node.board')).toHaveCount(3);
  await expect(page.locator('.rel-node.char .k-board')).toHaveCount(3);
  await expect(page.locator('.rel-node.user')).toContainText('2 admin roles');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  await page.locator('.rel-node.board').last().getByRole('button', { name: 'Board 3514' }).click();
  expect(await page.evaluate(() => detail)).toMatchObject({ kind: 'board', id: '3514' });
});

test('empty map and users without related entities do not invent records or actions', async ({ page }) => {
  await openRelationshipFixture(page, { empty: true });
  await expect(page.getByText('ยังไม่มีผู้ใช้งาน', { exact: true })).toBeVisible();
  await expect(page.locator('.rel-node')).toHaveCount(0);
  await page.evaluate(() => {
    cloudUsers = [{ userId: '2150', name: 'TEST New account', chars: [], boards: [], adminGroups: [] }];
    render();
  });
  await expect(page.locator('.rel-node.char')).toContainText('No character yet');
  await expect(page.locator('.rel-node.admin')).toContainText('Not an admin');
  await expect(page.locator('.rel-node.board')).toContainText('No boards yet');
  await expect(page.locator('.relmap button')).toHaveCount(1);
});
