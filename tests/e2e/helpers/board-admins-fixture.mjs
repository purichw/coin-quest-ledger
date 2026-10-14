import { openAdminFixture } from './admin-fixture.mjs';

export async function openBoardAdminsFixture(page, { empty = false } = {}) {
  if (!empty) await page.addInitScript(() => {
    if (sessionStorage.getItem('board-admins-design-fixture')) return;
    sessionStorage.setItem('board-admins-design-fixture', '1');
    const groups = [
      ['2150', 'TEST Simulator QA', '2150', ['3512']],
      ['4965', '', '', ['deleted-owner-board']],
      ['6675', 'TEST Codex QA', '6675', ['long-board-reference-6675']],
      ['ADM-363279', '', '1229505986', ['1794','7775']],
      ['ADM-380729', '', '1476442380', ['3171','5771','9545']],
      ['ADM-638594', '', '2017469682', ['2214']],
      ['ADM-759197', '', '1839283962', ['2152']],
      ['', '', '', ['1397','9899']]
    ];
    for (const [id, name, ownerHash, boards] of groups) for (const boardId of boards) {
      const linked = ['2150','6675'].includes(id);
      sessionStorage.setItem(`pointy_test_trip_${boardId}`, JSON.stringify({
        tripName: `TEST Journey ${boardId}`, participants: linked ? [name] : [],
        characterIds: linked ? { [name]: id } : {},
        expenses: [{ id:'test-expense', desc:'TEST meal', amount:100.25, paidBy:'TEST Guest', sharedBy:['TEST Guest'], split:{ mode:'equal' } }],
        admin: { adminId:id, adminName:name, ownerHash, ...(linked ? {characterId:id} : {}), passwordHash:'TEST-preserve-hash' },
        futureField: { preserve:true }, updatedAt:1791921600000
      }));
    }
  });
  await openAdminFixture(page, { tab:'admins', empty:true, edits:false });
  if (!empty) await page.evaluate(() => {
    cloudUsers = [normalizeCloudUser('TEST-user-2150', { userId:'2150', username:'test.simulator', name:'TEST Simulator QA', character:{ id:'2150', name:'TEST Hero', class:'ranger' } })];
    render();
  });
}
