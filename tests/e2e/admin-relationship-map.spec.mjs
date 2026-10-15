import { test, expect } from '@playwright/test';
import { openRelationshipFixture } from './helpers/relationship-fixture.mjs';
import { adminNav } from './helpers/admin-fixture.mjs';

test.beforeEach(async ({ page }, info) => {
  await page.setViewportSize({ width: { chromium: 1440, tablet: 768, mobile: 390 }[info.project.name], height: 900 });
});

test('relationship map separates actual entities and preserves detail navigation without editing drafts', async ({ page }) => {
  await openRelationshipFixture(page);
  const source = await page.evaluate(() => JSON.stringify(draft));
  await expect(page.locator('.rel-node-label')).toHaveText(['ผู้ใช้ที่กำลังดู', 'ตัวละครที่ใช้เล่น', 'สิทธิ์ดูแลบอร์ด']);
  await expect(page.locator('.rel-account')).toContainText('เป็นสมาชิก 1 บอร์ด');
  await expect(page.locator('[data-entity="char"]')).toContainText('120 XP');
  await expect(page.locator('[data-entity="admin"]')).toContainText('Simulator QA');
  await expect(page.locator('.relationship-boards')).toContainText('TEST CQ Simulator QA 20261012');
  await expect(page.locator('.rel-node.char .k-char')).toHaveJSProperty('tagName', 'SPAN');
  await expect(page.locator('[data-entity="char"] .rel-edge')).toHaveText('↓เข้าร่วม 1 บอร์ด');
  await expect(page.locator('[data-entity="admin"] .rel-edge')).toHaveText('↓ดูแล 1 บอร์ด');

  const boxes = await page.locator('.rel-branch').evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect(); return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }));
  for (let i = 1; i < boxes.length; i++) {
    if (page.viewportSize().width >= 768) {
      expect(boxes[i].y).toBe(boxes[0].y);
      expect(boxes[i].x).toBeGreaterThan(boxes[i - 1].x + boxes[i - 1].width);
    } else {
      expect(boxes[i].x).toBe(boxes[0].x);
      expect(boxes[i].y).toBeGreaterThan(boxes[i - 1].y + boxes[i - 1].height);
    }
  }
  for (const [scope, chip, kind, id] of [['[data-entity="user"]', 'user', 'user', '2150'], ['[data-entity="admin"]', 'admin', 'admin', '2150'], ['.relationship-boards', 'board', 'board', '3512'], ['[data-entity="char"]', 'board', 'board', '3512']]) {
    await page.locator(`${scope} button.k-${chip}`).first().click();
    expect(await page.evaluate(() => detail)).toMatchObject({ kind, id });
    await expect(page.locator('.admin-page')).toContainText(id);
    await adminNav(page, 'Relationship Map');
  }
  expect(await page.evaluate(() => JSON.stringify(draft))).toBe(source);
});

test('plain-language definitions remain visible and FAQ is keyboard operable', async ({ page }) => {
  await openRelationshipFixture(page);
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(page.locator('.rel-definition')).toHaveCount(4);
  await expect(page.locator('.rel-definition').first()).toBeVisible();
  const faq = page.locator('.rel-faq details').nth(1);
  const toggle = faq.locator('summary');
  await expect(faq.locator('p')).toBeHidden();
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(faq.locator('p')).toBeVisible();
  await expect(faq).toContainText('การมี Admin ID ไม่ได้ทำให้เป็น Super Admin');
  await page.keyboard.press('Space');
  await expect(faq.locator('p')).toBeHidden();
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(toggle).toBeVisible();
  await expect(page.locator('.rel-definition').last()).toBeVisible();
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
  await expect(page.locator('.rel-board-row')).toHaveCount(3);
  await expect(page.locator('[data-entity="char"] .rel-board-leaf')).toHaveCount(3);
  await expect(page.locator('[data-entity="admin"] .rel-entity-tree').nth(0).locator('.rel-board-leaf')).toHaveCount(2);
  expect(await page.locator('[data-entity="admin"] .rel-entity-tree').nth(0).locator('.rel-board-leaf').evaluateAll(nodes => nodes.map(node => node.dataset.linkedBoard))).toEqual(['3512', '3513']);
  await expect(page.locator('[data-entity="admin"] .rel-entity-tree').nth(1).locator('.rel-board-leaf')).toHaveAttribute('data-linked-board', '3514');
  await expect(page.locator('#rel-admin-heading')).toContainText('2 รหัส');
  await expect(page.locator('.rel-node.user')).toContainText('เป็นผู้ดูแล 3 บอร์ด');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  await page.locator('.rel-board-row').last().getByRole('button', { name: 'Board 3514' }).click();
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
  await expect(page.locator('.rel-node.char')).toContainText('ยังไม่มีตัวละครที่เชื่อมกับผู้ใช้นี้');
  await expect(page.locator('.rel-node.admin')).toContainText('ยังไม่มีสิทธิ์ดูแลบอร์ดที่เชื่อมกับผู้ใช้นี้');
  await expect(page.locator('.relationship-boards')).toContainText('ยังไม่มีบอร์ดที่เชื่อมกับผู้ใช้นี้');
  await expect(page.locator('.relmap button')).toHaveCount(1);
});

test('selecting another user keeps membership separate from board administration and preserves selection on return', async ({ page }) => {
  await openRelationshipFixture(page);
  await page.evaluate(() => {
    const board = draft.boards[0];
    board.participants.push('TEST Member');
    board.characterIds['TEST Member'] = '2200';
    render();
  });
  const source = await page.evaluate(() => JSON.stringify({ draft, cloudUsers }));
  await page.getByLabel('เลือกผู้ใช้ที่ต้องการดู').selectOption('2200');
  await expect(page.getByLabel('เลือกผู้ใช้ที่ต้องการดู')).toBeFocused();
  await expect(page.locator('.rel-account')).toContainText('TEST Member');
  await expect(page.locator('.rel-account')).toContainText('เป็นผู้ดูแล 0 บอร์ด');
  await expect(page.locator('[data-entity="admin"] .rel-board-leaf')).toHaveCount(0);
  await expect(page.locator('.rel-board-facts strong')).toHaveText('เป็นสมาชิก');
  await page.locator('.rel-board-row button.k-board').click();
  await adminNav(page, 'Relationship Map');
  await expect(page.getByLabel('เลือกผู้ใช้ที่ต้องการดู')).toHaveValue('2200');
  expect(await page.evaluate(() => JSON.stringify({ draft, cloudUsers }))).toBe(source);
});

test('admin-only boards and Guest records do not invent membership, character IDs or account links', async ({ page }) => {
  await openRelationshipFixture(page);
  await page.evaluate(() => {
    cloudUsers = [{ userId: '2150', name: 'TEST Owner', cloud: true, chars: [{ id:'2150', name:'TEST Hero', className:'ranger', xp:0, boards:[] }], boards:[], adminGroups:[] }];
    draft.boards[0].participants = ['TEST Guest'];
    draft.boards[0].characterIds = {};
    render();
  });
  await expect(page.locator('.rel-account')).toContainText('เป็นสมาชิก 0 บอร์ด');
  await expect(page.locator('[data-entity="char"] .rel-board-leaf')).toHaveCount(0);
  await expect(page.locator('[data-entity="admin"] .rel-board-leaf')).toHaveCount(1);
  await expect(page.locator('.rel-board-facts strong')).toHaveText('เป็นผู้ดูแล');
  await page.getByLabel('เลือกผู้ใช้ที่ต้องการดู').selectOption({ label: await page.locator('#relationship-user option').filter({ hasText:'TEST Guest' }).textContent() });
  await expect(page.locator('.rel-account')).toContainText('ยังไม่พบบัญชีผู้ใช้ที่เชื่อมไว้');
  await expect(page.locator('.rel-node.char')).toContainText('ยังไม่มีรหัสตัวละคร');
  await expect(page.locator('.rel-node.char .k-char')).toHaveCount(0);
  await expect(page.locator('[data-entity="admin"] .rel-board-leaf')).toHaveCount(0);
  await expect(page.locator('.rel-board-facts strong')).toHaveText('เป็นสมาชิก');
});
