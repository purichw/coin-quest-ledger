import { openAdminFixture } from './admin-fixture.mjs';

export async function openTombstonesFixture(page, { empty = false } = {}) {
  await openAdminFixture(page, { tab: 'tombstones', empty: true, edits: false });
  if (!empty) await page.evaluate(() => {
    const ids = ['3186', '4965', '6929', '7273', '7703', '9418'];
    const names = ['test.reuse.mqm5b123zeu86', 'test.pointisiiz', 'test.reuse.mqm5llnkqoh0j', 'test.reclaim.q13g7o7', 'test.reuse.mqm5n13nsbuzv', 'test.reuse.mqm5h5c5b9su'];
    cloudTombstones = ids.map((id, index) => normalizeUsernameTombstone(names[index], {
      userId: id, username: names[index], status: 'deleted', deleteReusable: true,
      characterId: [1, 4].includes(index) ? id : '',
      previousUid: `TEST-previous-uid-${id}-aB7xP9kL4mN8`,
      deletedAt: Date.UTC(2026, 5, 20 + index, 14, 56, 59),
      deletedReason: `TEST deletion audit ${id}`
    }));
    render();
  });
}
