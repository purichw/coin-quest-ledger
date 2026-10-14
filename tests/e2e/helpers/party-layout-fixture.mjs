// Isolated Party Ledger data: no production account or board writes.
export async function partyLayoutFixture(page, { count = 3, longNames = false, stats = true } = {}) {
  await page.addInitScript(({ count, longNames, stats }) => {
    if (sessionStorage.getItem('party-layout-fixture')) return;
    sessionStorage.setItem('party-layout-fixture', '1');
    const hero = { id: '7777', name: 'Pointy', class: 'engineer', cls: 'engineer', gender: 'male' };
    localStorage.setItem('pointy_auth_v1', JSON.stringify({ uid: 'party-layout-qa', username: 'party.layout.qa', userId: hero.id, name: hero.name, character: hero }));
    localStorage.setItem('pointy_character_registry_v1', JSON.stringify({ '7777': hero }));
    localStorage.setItem('lang', 'th');
    localStorage.setItem('pointy_theme', 'tavern');
    localStorage.setItem('pointy_profile_v1', JSON.stringify({ tourSeen: true, lastVisit: new Date().toISOString().slice(0, 10) }));
    const participants = Array.from({ length: count }, (_, i) => i ? (longNames ? `นักผจญภัยชื่อยาวทดสอบ ${i}` : `Guest ${i}`) : hero.name);
    const classes = ['engineer', 'warrior', 'tiderunner', 'archfiend', 'wizard', 'ranger', 'seraph'];
    sessionStorage.setItem('pointy_test_trip_4821', JSON.stringify({
      tripName: 'ทริปพะวัน', participants,
      heroClasses: Object.fromEntries(participants.map((name, i) => [name, classes[i % classes.length]])),
      heroGenders: Object.fromEntries(participants.map((name, i) => [name, i % 3 === 2 ? 'female' : 'male'])),
      characterIds: { Pointy: '7777' }, guestHeroes: Object.fromEntries(participants.slice(1).map(name => [name, true])),
      expenses: [], settings: { animations: false, sound: false, entry: 'form', stats },
      admin: { createdAt: 1791540000000 }, access: { ownerUids: ['party-layout-qa'], memberUids: ['party-layout-qa'] },
    }));
  }, { count, longNames, stats });
}
