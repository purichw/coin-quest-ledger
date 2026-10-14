import { openAdminFixture } from './admin-fixture.mjs';

export async function openRelationshipFixture(page, { empty = false } = {}) {
  if (!empty) await page.addInitScript(() => {
    if (sessionStorage.getItem('relationship-design-fixture')) return;
    sessionStorage.setItem('relationship-design-fixture', '1');
    sessionStorage.setItem('pointy_test_trip_3512', JSON.stringify({
      tripName: 'TEST CQ Simulator QA 20261012', participants: ['นักล่า QA Mobile'],
      characterIds: { 'นักล่า QA Mobile': '2150' },
      heroClasses: { 'นักล่า QA Mobile': 'ranger' }, characterXp: { '2150': 120 },
      expenses: [], updatedAt: 1791921600000,
      admin: { adminId: '2150', adminName: 'Simulator QA', characterId: '2150' }
    }));
  });
  await openAdminFixture(page, { tab: 'map', empty: true, edits: false });
}
