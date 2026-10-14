import { expect } from '@playwright/test';

export async function openAdminFixture(page, { tab = 'dashboard', edits = true, empty = false } = {}) {
  await page.addInitScript(({ empty }) => {
    if (sessionStorage.getItem('admin-design-fixture')) return;
    sessionStorage.setItem('admin-design-fixture', '1');
    sessionStorage.setItem('pointy_super_admin_unlocked_v2', '1');
    if (empty) return;
    const names = ['Mali', 'Krit', 'Mochi', 'Niran', 'Ploy', 'June', 'Beam', 'Mint', 'Fern', 'Win', 'May', 'Nan', 'Pat'];
    ['1397', '1794', '2152', '2214', '3171', '4290', '5301', '6412', '7523', '8634', '9745', '1086'].forEach((id, index) => {
      const participants = [names[index], names[index + 1]];
      sessionStorage.setItem(`pointy_test_trip_${id}`, JSON.stringify({
        tripName: `TEST Journey ${index + 1}`, participants,
        characterIds: { [participants[0]]: String(1100 + index), [participants[1]]: String(1101 + index) },
        heroClasses: { [participants[0]]: 'ranger', [participants[1]]: 'warrior' },
        expenses: [], updatedAt: 1791921600000,
        admin: { adminId: index === 0 ? '' : `ADM-${id}`, adminName: index === 1 || index === 2 ? '' : participants[0], characterId: String(1100 + index) }
      }));
    });
  }, { empty });
  await page.goto(`/admin/?test=1&tab=${tab}`);
  await expect(page.locator('.admin-page')).toBeVisible();
  if (edits && !empty) await page.evaluate(() => {
    // Isolated visual fixture: exercise the real draft renderer without cloud writes.
    draft.boards.slice(0, 5).forEach((board, i) => { board.tripName = `TEST Updated journey ${i + 1}`; });
    markDirty(); render();
  });
  await page.evaluate(() => document.fonts.ready);
}

export async function adminNav(page, name) {
  const toggle = page.getByRole('button', { name: 'Open navigation', exact: true });
  if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
  await page.locator('.sidebar').getByRole('button', { name, exact: true }).click();
}

export async function adminTools(page) {
  const toggle = page.getByRole('button', { name: 'Open admin actions', exact: true });
  if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
}
