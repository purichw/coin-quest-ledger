import { openAdminFixture } from './admin-fixture.mjs';

export async function openBoardsFixture(page, { empty = false } = {}) {
  if (!empty) await page.addInitScript(() => {
    if (sessionStorage.getItem('boards-design-fixture')) return;
    sessionStorage.setItem('boards-design-fixture', '1');
    const ids = ['1397', '1794', '2152', '2214', '3171', '3512', '5771', '7775'];
    const names = ['ทริปใหม่', 'Chiang Mai', 'เชียงใหม่', 'E2E 2026', 'เที่ยวทะเล', 'CQ Simulator QA', 'คลังเดือนนี้', 'กำจัดมังกร'];
    ids.forEach((id, i) => {
      const participants = ['Mali', 'Krit', 'Mochi'].slice(0, i % 3 + 1);
      sessionStorage.setItem(`pointy_test_trip_${id}`, JSON.stringify({
        tripName: `TEST ${names[i]}`, boardType: i === 6 ? 'treasury' : i === 7 ? 'debt' : 'split',
        participants, characterIds: Object.fromEntries(participants.map((name, n) => [name, String(1100 + n)])),
        expenses: Array.from({ length: i % 4 }, (_, n) => ({ id: `item-${n}`, amount: 125.5, desc: 'TEST Dinner', paidBy: 'Mali', sharedBy: participants })),
        dragons: i === 7 ? [{ balance: 5000, dueDay: 1 }, { balance: 1200, dueDay: 15 }] : [],
        admin: { adminId: i === 0 ? '' : `ADM-${id}`, adminName: i < 2 ? '' : 'Mali', characterId: '1100' },
        futureField: { preserve: true }, updatedAt: 1791921600000
      }));
    });
  });
  await openAdminFixture(page, { tab: 'boards', edits: false, empty: true });
}
