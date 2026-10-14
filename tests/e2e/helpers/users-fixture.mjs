import { openAdminFixture } from './admin-fixture.mjs';

export async function openUsersFixture(page, { empty = false } = {}) {
  if (!empty) await page.addInitScript(() => {
    if (sessionStorage.getItem('users-design-fixture')) return;
    sessionStorage.setItem('users-design-fixture', '1');
    const ids = ['1112', '2000', '2028', '2150', '4717', '6616', '6675', '6880', '8340'];
    const names = ['TEST PP', 'TEST PPP', 'TEST Postfix Signup', 'TEST Simulator QA', 'TEST Pointy', 'TEST purich', 'TEST Codex QA', 'TEST Mali', 'TEST Regression'];
    const groups = [[0], [1], [2], [3], [4, 7], [4], [6], [8]];
    groups.forEach((indices, i) => {
      const participants = indices.map(n => names[n]);
      const owner = [3, 6].includes(indices[0]) ? indices[0] : null;
      sessionStorage.setItem(`pointy_test_trip_${9001 + i}`, JSON.stringify({
        tripName: `TEST Journey ${i + 1}`, participants,
        characterIds: Object.fromEntries(indices.map(n => [names[n], ids[n]])),
        characterXp: { '2150': 120, '8340': 120 }, expenses: [],
        admin: owner === null ? {} : { adminId: ids[owner], adminName: names[owner], characterId: ids[owner] },
        updatedAt: 1791921600000
      }));
    });
    sessionStorage.setItem('pointy_test_trip_9010', JSON.stringify({
      tripName: 'TEST Guest journey', participants: ['TEST Guest 1', 'TEST Guest 2', 'TEST Chanida'],
      characterIds: {}, expenses: [], admin: {}, updatedAt: 1791921600000
    }));
  });
  await openAdminFixture(page, { tab: 'users', empty: true, edits: false });
  if (!empty) await page.evaluate(() => {
    const ids = ['1112', '2000', '2028', '2150', '4717', '6616', '6675', '6880', '8340', '9000'];
    const names = ['TEST PP', 'TEST PPP', 'TEST Postfix Signup', 'TEST Simulator QA', 'TEST Pointy', 'TEST purich', 'TEST Codex QA', 'TEST Mali', 'TEST Regression', 'TEST New account'];
    cloudUsers = ids.map((id, i) => normalizeCloudUser(`fixture-${id}`, {
      userId: id, name: names[i], username: i === 5 ? 'test.purich' : '',
      character: i === 9 ? {} : { id, name: i === 3 ? 'นักล่า QA Mobile' : i === 2 ? 'TEST Hero 2028' : names[i], class: 'ranger', xp: i === 3 || i === 8 ? 120 : 0 }
    }));
    render();
  });
}
