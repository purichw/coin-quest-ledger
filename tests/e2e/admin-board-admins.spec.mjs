import { test, expect } from '@playwright/test';
import { openBoardAdminsFixture } from './helpers/board-admins-fixture.mjs';
import { adminTools, adminNav } from './helpers/admin-fixture.mjs';

test.beforeEach(async ({ page }, info) => {
  await page.setViewportSize({ width: { chromium:1440, tablet:768, mobile:390 }[info.project.name], height:900 });
});
const row = (page, id) => page.locator(`.board-admin-row[data-admin-anchor="${id}"]`);
const search = page => page.getByPlaceholder('ค้นหา admin (ID, ชื่อเล่น หรือ username)');
const back = page => page.locator('.crumbs').getByRole('button', { name:'Board Admins', exact:true }).click();
async function contained(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(await page.locator('.board-admin-row').evaluateAll(rows => rows.every(row => {
    const table = row.closest('.tbl-wrap').getBoundingClientRect(), box = row.getBoundingClientRect();
    return box.left >= table.left - 1 && box.right <= table.right + 1;
  }))).toBe(true);
}

test('Board Admins keeps real groups and all actions inside the parchment at each breakpoint', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await openBoardAdminsFixture(page);
  await expect(page.locator('.board-admin-row')).toHaveCount(8);
  await expect(page.locator('.board-admin-footer [role="status"]')).toHaveText('8 admin identities');
  await expect(row(page, '3512').getByRole('button', { name:'User 2150', exact:true })).toBeVisible();
  await expect(row(page, 'deleted-owner-board').locator('.board-admin-user')).toHaveText('orphaned');
  await expect(row(page, 'deleted-owner-board').locator('.board-admin-hash')).toContainText('—');
  expect(await page.locator('.board-admin-table th:visible').count()).toBe(page.viewportSize().width >= 1200 ? 6 : page.viewportSize().width >= 768 ? 4 : 0);
  for (const detail of await page.locator('.board-admin-actions button').all()) {
    await detail.scrollIntoViewIfNeeded();
    const box = await detail.boundingBox();
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
    await detail.click({ trial:true });
  }
  await contained(page);
  expect(errors).toEqual([]);
});

test('Board Admins search retains typing, matches owner username and recovers from no results', async ({ page }) => {
  await openBoardAdminsFixture(page);
  const input = await search(page).elementHandle();
  await search(page).pressSequentially('test.simulator');
  await expect(search(page)).toBeFocused();
  expect(await input.evaluate(el=>el.isConnected)).toBe(true);
  await expect(page.locator('.board-admin-row')).toHaveCount(1);
  await expect(row(page, '3512')).toBeVisible();
  await search(page).fill('1476442380');
  await expect(row(page, '3171')).toBeVisible();
  await search(page).fill('  TEST CODEX  ');
  await expect(row(page, 'long-board-reference-6675')).toBeVisible();
  await search(page).fill('no matching owner');
  await expect(page.getByText('ไม่พบผู้ดูแลที่ตรงกัน', {exact:true})).toBeVisible();
  await page.getByRole('button', {name:'ล้างการค้นหา', exact:true}).click();
  await expect(search(page)).toBeFocused();
  await expect(page.locator('.board-admin-row')).toHaveCount(8);
});

test('Board Admins shortcuts, board disclosure, owner and Detail links reach real destinations', async ({ page }) => {
  await openBoardAdminsFixture(page);
  const baseline = await page.evaluate(()=>JSON.stringify(draft));
  if (page.viewportSize().width < 768) {
    const more = page.getByRole('button', {name:'Show all admin shortcuts',exact:true});
    await expect(page.getByRole('button', {name:'Detail 6675',exact:true})).toBeHidden();
    await more.focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('button',{name:'Show fewer admin shortcuts',exact:true})).toHaveAttribute('aria-expanded','true');
  }
  await page.getByRole('button', {name:'Detail 6675',exact:true}).click();
  await expect(page.getByRole('heading', {level:1})).toHaveText('Admin Detail');
  await expect(page.getByLabel('Admin ID',{exact:true})).toHaveValue('6675');
  await back(page);
  const boards = row(page,'3171');
  if (page.viewportSize().width < 1200) {
    const more = boards.getByRole('button',{name:'More boards for ADM-380729',exact:true});
    await more.focus(); await page.keyboard.press('Enter');
    await expect(more).toHaveAttribute('aria-expanded','true');
  }
  await boards.getByRole('button',{name:'Board 9545',exact:true}).click();
  await expect(page.getByRole('heading',{level:1})).toHaveText('TEST Journey 9545');
  await adminNav(page,'Board Admins');
  await row(page,'3512').getByRole('button',{name:'User 2150',exact:true}).click();
  await expect(page.getByRole('heading',{level:1})).toHaveText('TEST Simulator QA');
  expect(await page.evaluate(()=>JSON.stringify(draft))).toBe(baseline);
});

test('Board Admin ID edits without an owner hash survive every keystroke, Save, reopen and test Publish', async ({ page }) => {
  await openBoardAdminsFixture(page);
  const baseline = await page.evaluate(()=>draft.boards.map(b=>[b.originalId,materializeBoard(b)]));
  if (page.viewportSize().width >= 1200) {
    const id = row(page,'deleted-owner-board').getByLabel('Admin ID for 4965',{exact:true});
    await id.fill(''); await id.pressSequentially('ADM-REPAIRED');
    await row(page,'deleted-owner-board').getByLabel('Nickname for 4965',{exact:true}).fill('TEST Renamed Admin');
    await row(page,'deleted-owner-board').getByRole('button',{name:'Detail',exact:true}).click();
  } else {
    await row(page,'deleted-owner-board').getByRole('button',{name:'Detail',exact:true}).click();
    const id = page.getByLabel('Admin ID',{exact:true});
    await id.fill(''); await id.pressSequentially('ADM-REPAIRED');
    await page.getByLabel('Nickname',{exact:true}).fill('TEST Renamed Admin');
  }
  await expect(page.getByLabel('Admin ID',{exact:true})).toHaveValue('ADM-REPAIRED');
  expect(await page.evaluate(()=>boardById('deleted-owner-board').adminId)).toBe('ADM-REPAIRED');
  await adminTools(page);
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Saved');
  await page.getByRole('dialog').getByRole('button',{name:'ปิด',exact:true}).click();
  await expect(page.getByRole('heading',{level:1})).toHaveText('Admin Detail');
  await page.reload();
  await row(page,'deleted-owner-board').getByRole('button',{name:'Detail',exact:true}).click();
  await expect(page.getByLabel('Admin ID',{exact:true})).toHaveValue('ADM-REPAIRED');
  await expect(page.getByLabel('Nickname',{exact:true})).toHaveValue('TEST Renamed Admin');
  await adminTools(page); await page.locator('#publish-btn').click();
  await page.getByRole('dialog').getByRole('button',{name:'ยืนยัน',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#draft-badge')).toHaveText('Published version');
  const published = await page.evaluate(()=>draft.boards.map(b=>[b.originalId,JSON.parse(sessionStorage.getItem(`pointy_test_trip_${b.urlId}`))]));
  for (const [id, data] of published) {
    const prior = baseline.find(([key])=>key===id)[1];
    for (const key of ['participants','characterIds','expenses','futureField']) expect(data[key]).toEqual(prior[key]);
    expect(data.admin.passwordHash).toBe('TEST-preserve-hash');
    expect(data.admin.adminId).toBe(id==='deleted-owner-board' ? 'ADM-REPAIRED' : prior.admin.adminId);
    expect(data.admin.ownerHash).toBe(prior.admin.ownerHash);
  }
});

test('Board Admins handles long content and keeps equal IDs with separate owner hashes independent', async ({ page }) => {
  await openBoardAdminsFixture(page);
  await page.evaluate(()=>{
    const first=boardById('3512'), other=boardById('long-board-reference-6675');
    first.adminName='TEST ชื่อผู้ดูแลบอร์ดที่ยาวมากเพื่อทดสอบการตัดบรรทัดอย่างเหมาะสม'.repeat(2);
    other.adminId=first.adminId;
    other.adminOwnerHash='TEST-distinct-owner-'.repeat(8);
    render();
  });
  await expect(page.locator('.board-admin-row')).toHaveCount(8);
  await contained(page);
  await row(page,'3512').getByRole('button',{name:'Detail',exact:true}).click();
  await page.getByLabel('Nickname',{exact:true}).fill('TEST Separate');
  expect(await page.evaluate(()=>boardById('long-board-reference-6675').adminName)).toBe('TEST Codex QA');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await back(page); await contained(page);
});

test('Board Admins empty state has no invented admins or shortcuts', async ({ page }) => {
  await openBoardAdminsFixture(page,{empty:true});
  await expect(page.getByText('ยังไม่มีผู้ดูแลบอร์ด',{exact:true})).toBeVisible();
  await expect(page.locator('.board-admin-row')).toHaveCount(0);
  await expect(page.locator('.board-admin-shortcuts button')).toHaveCount(0);
  await contained(page);
});
