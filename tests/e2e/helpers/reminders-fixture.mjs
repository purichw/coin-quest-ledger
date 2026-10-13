export async function seedReminders(page, { count = 2, empty = false, language = 'th', theme = 'tavern', longName = false } = {}) {
  await page.clock.setFixedTime(new Date('2026-10-14T05:00:00Z'));
  await page.addInitScript(options => {
    if (sessionStorage.getItem('reminders-fixture')) return;
    sessionStorage.setItem('reminders-fixture', '1');
    const hero = { id: '1111', name: 'Mali', class: 'ranger', cls: 'ranger', gender: 'female' };
    const account = { uid: 'reminders-qa', username: 'reminders.qa', email: 'reminders.qa@coinquest.local', userId: hero.id, name: hero.name, character: hero };
    localStorage.setItem('pointy_auth_v1', JSON.stringify(account));
    localStorage.setItem('pointy_accounts_v1', JSON.stringify([account]));
    localStorage.setItem('lang', options.language);
    localStorage.setItem('pointy_theme', options.theme);
    localStorage.setItem('pointy_profile_v1', JSON.stringify({ streak: 7, bestStreak: 12, lastVisit: '2026-10-14', tourSeen: true, seen: [] }));
    localStorage.setItem('pointy_debt_v5', JSON.stringify({ dragons: [], history: [], settings: {} }));
    localStorage.setItem('pointy_treasury_v1', JSON.stringify({ month: '2026-10', bills: options.empty ? [] : [{ id: 'subscriptions', name: 'Netflix + Spotify', dueDay: 17, amount: 499 }], expenses: [], budgets: {} }));
    const invites = Array.from({ length: options.empty ? 0 : options.count }, (_, i) => ({
      id: `900${i}_1111`, tripId: `900${i}`, tripName: options.longName ? 'ปาร์ตี้นักผจญภัยเที่ยวเชียงใหม่และแบ่งค่าใช้จ่ายกันอย่างยุติธรรมตลอดการเดินทาง' : i ? 'เก็บเงินไปญี่ปุ่น' : 'สายกินเที่ยว',
      targetCharacterId: hero.id, targetOwnerUid: account.uid, targetName: hero.name,
      inviterUid: `inviter-${i}`, inviterName: options.longName ? 'นักผจญภัยผู้ชวนเพื่อนออกเดินทางด้วยกัน' : i ? 'Krit' : 'Mochi',
      inviterCharacterId: String(2222 + i), inviterClass: i ? 'warrior' : 'wizard', inviterGender: i ? 'male' : 'female',
      status: 'pending', createdAt: Date.now() - (i ? 5 : 2) * 3600000, expiresAt: Date.now() + 18 * 3600000
    }));
    localStorage.setItem('pointy_board_invites_v1', JSON.stringify(invites));
    invites.forEach(invite => sessionStorage.setItem('pointy_test_trip_' + invite.tripId, JSON.stringify({
      tripName: invite.tripName, participants: [invite.inviterName], characterIds: { [invite.inviterName]: invite.inviterCharacterId },
      heroClasses: { [invite.inviterName]: invite.inviterClass }, expenses: [], budgets: {}, access: { ownerUids: [invite.inviterUid] }
    })));
    const board = { tripName: 'ทริปเชียงใหม่', participants: ['Mali', 'Pointy'], characterIds: { Mali: hero.id, Pointy: '4444' },
      expenses: [{ id: 'food', desc: 'ค่าอาหาร', amount: 2400, paidBy: 'Pointy', sharedBy: ['Mali', 'Pointy'], splitMode: 'equal' }], budgets: {}, settlements: [] };
    localStorage.setItem('coin_quest_trip_snapshots_v1', JSON.stringify(options.empty ? {} : { '9010': board }));
  }, { count, empty, language, theme, longName });
}
