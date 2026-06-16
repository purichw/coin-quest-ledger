import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadLogic() {
  const source = fs.readFileSync(new URL('../../shared/pointy-logic.js', import.meta.url), 'utf8');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'pointy-logic.js' });
  return sandbox.PointyLogic;
}

const logic = loadLogic();

function closeTo(actual, expected, delta = 0.000001) {
  assert.ok(Math.abs(actual - expected) <= delta, `${actual} should be close to ${expected}`);
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('price ranking normalizes unit aliases and promotions', () => {
  const ranked = logic.rankOffers([
    { merchant: 'A', price: 200, qty: 850, unit: 'มล.' },
    { merchant: 'B', price: 100, qty: 300, unit: 'ml' },
    { merchant: 'C', price: 120, qty: 250, unit: 'ml', buy: 1, free: 1 }
  ], { baseUnit: 'ml' });

  assert.equal(ranked[0].merchant, 'A');
  assert.equal(ranked[0].isBest, true);
  closeTo(ranked[0].pu, 200 / 850);
  closeTo(ranked[2].pu, 100 / 300);
});

test('normalizeComparison keeps only valid offers and resolves units', () => {
  let id = 0;
  const cmp = logic.normalizeComparison({
    name: 'Milk',
    baseUnit: 'มล.',
    offers: [
      { merchant: 'A', price: '42', qty: '1', unit: 'ลิตร' },
      { merchant: '', price: 0, qty: 10, unit: 'ml' },
      { price: 20, qty: 200, unit: 'มล.' }
    ]
  }, { idFactory: () => `id-${++id}`, itemFallback: 'Item', merchantFallback: 'Shop' });

  assert.equal(cmp.id, 'id-1');
  assert.equal(cmp.baseUnit, 'ml');
  assert.equal(cmp.offers.length, 2);
  assert.equal(cmp.offers[0].unit, 'l');
  assert.equal(cmp.offers[1].merchant, 'Shop');
});

test('splitShares supports equal, exact with remainder, shares, and percent', () => {
  const names = ['Shane', 'Pointy'];

  assert.deepEqual(plain(logic.splitShares({ amount: 100, sharedBy: names }, names)), { Shane: 50, Pointy: 50 });

  const exact = logic.splitShares({ amount: 100, sharedBy: names, split: { mode: 'exact', weights: { Shane: 30, Pointy: 50 } } }, names);
  closeTo(exact.Shane, 40);
  closeTo(exact.Pointy, 60);

  const shares = logic.splitShares({ amount: 120, sharedBy: names, split: { mode: 'shares', weights: { Shane: 1, Pointy: 3 } } }, names);
  closeTo(shares.Shane, 30);
  closeTo(shares.Pointy, 90);

  const percent = logic.splitShares({ amount: 200, sharedBy: names, split: { mode: 'percent', weights: { Shane: 25, Pointy: 75 } } }, names);
  closeTo(percent.Shane, 50);
  closeTo(percent.Pointy, 150);
});

test('payerMap prefers valid multi-payer data and falls back to paidBy', () => {
  assert.deepEqual(plain(logic.payerMap({ amount: 100, paidBy: 'Fallback', payers: { Shane: 60, Pointy: 40, Empty: 0 } })), { Shane: 60, Pointy: 40 });
  assert.deepEqual(plain(logic.payerMap({ amount: 100, paidBy: 'Shane', payers: { Pointy: 0 } })), { Shane: 100 });
});

test('splitShares supports itemized loot claimers and unclaimed fallback', () => {
  const names = ['Shane', 'Pointy', 'Arm'];
  const shares = logic.splitShares({
    amount: 600,
    sharedBy: names,
    split: {
      mode: 'items',
      items: [
        { name: 'Sushi', amount: 300, claimedBy: ['Shane', 'Pointy'] },
        { name: 'Tea', amount: 150, claimedBy: ['Arm'] },
        { name: 'Snack', amount: 150, claimedBy: [] }
      ]
    }
  }, names);

  closeTo(shares.Shane, 200);
  closeTo(shares.Pointy, 200);
  closeTo(shares.Arm, 200);
});

test('computeParty calculates paid, share, balance, XP, and settlement', () => {
  const state = {
    participants: ['Shane', 'Pointy'],
    budgets: { Shane: 2500, Pointy: 2500 },
    settleXp: {},
    expenses: [{
      amount: 1000,
      sharedBy: ['Shane', 'Pointy'],
      payers: { Shane: 600, Pointy: 400 },
      split: { mode: 'exact', weights: { Shane: 300, Pointy: 700 } }
    }]
  };

  const party = logic.computeParty(state, { classOf: () => 'warrior' });
  const shane = party.find(p => p.name === 'Shane');
  const pointy = party.find(p => p.name === 'Pointy');

  assert.equal(shane.paid, 600);
  assert.equal(shane.share, 300);
  assert.equal(shane.gen, 300);
  assert.equal(shane.bal, 300);
  assert.equal(shane.xp, 300);
  assert.equal(pointy.paid, 400);
  assert.equal(pointy.share, 700);
  assert.equal(pointy.gen, 0);
  assert.equal(pointy.bal, -300);
  assert.deepEqual(plain(logic.settleUp(party)), [{ from: 'Pointy', to: 'Shane', amount: 300 }]);
});

test('computeParty can add cross-trip base XP for character progress', () => {
  const party = logic.computeParty({
    participants: ['Shane'],
    budgets: {},
    settleXp: { Shane: 50 },
    expenses: [{ amount: 100, paidBy: 'Shane', sharedBy: ['Shane'] }]
  }, { classOf: () => 'warrior', baseXp: name => name === 'Shane' ? 700 : 0 });

  assert.equal(party[0].xp, 750);
  assert.equal(party[0].level.lvl, 2);
});

test('normalizeTripState keeps legacy trip data compatible', () => {
  const state = logic.normalizeTripState({
    participants: ['A'],
    heroClasses: { A: 'mage' },
    heroSkins: { A: 'crimson-regent' },
    admin: { ownerHash: 'creator-token-hash', adminId: 'ADM-111111', adminName: 'Pointy', characterId: '1234' },
    expenses: [{ name: 'Coffee', amount: '120', payer: 'A', participants: ['A'] }]
  }, { defaultTripName: 'Trip', questFallback: 'Quest', questIcons: ['x'] });

  assert.equal(state.tripName, 'Trip');
  assert.equal(state.heroClasses.A, 'wizard');
  assert.equal(state.heroSkins.A, 'crimson-regent');
  assert.equal(state.admin.ownerHash, 'creator-token-hash');
  assert.equal(state.admin.adminId, 'ADM-111111');
  assert.equal(state.admin.adminName, 'Pointy');
  assert.equal(state.admin.characterId, '1234');
  assert.equal(state.expenses[0].desc, 'Coffee');
  assert.equal(state.expenses[0].paidBy, 'A');
  assert.deepEqual(plain(state.expenses[0].sharedBy), ['A']);
});

test('new avatar classes normalize and campaign skins survive migration', () => {
  assert.equal(logic.CLASS_ORDER.length, 18);
  assert.equal(logic.normalizeClass('archfiend'), 'archfiend');
  assert.equal(logic.CLASSES.tiderunner.glyph, '🌊');

  const state = logic.normalizeTripState({
    campaigns: [{
      id: 'c1',
      participants: ['A'],
      heroClasses: { A: 'archfiend' },
      heroSkins: { A: 'crimson-regent' }
    }]
  }, { defaultTripName: 'Trip' });

  assert.equal(state.campaigns[0].heroClasses.A, 'archfiend');
  assert.equal(state.campaigns[0].heroSkins.A, 'crimson-regent');
});

test('parseImportItems reads comma, semicolon, and tab separated rows', () => {
  assert.deepEqual(plain(logic.parseImportItems('Coffee, 120\nTaxi; ฿240\nSnack\t35\nBad line\nFree, 0')), [
    { desc: 'Coffee', amount: 120 },
    { desc: 'Taxi', amount: 240 },
    { desc: 'Snack', amount: 35 }
  ]);
});

test('buildCharacterProfile aggregates board history, money, badges, and admin ownership', () => {
  const profile = logic.buildCharacterProfile('1111', [{
    id: '9001',
    data: {
      tripName: 'Alpha Board',
      participants: ['Shane', 'Pointy'],
      characterIds: { Shane: '1111', Pointy: '2222' },
      heroClasses: { Shane: 'archfiend', Pointy: 'warrior' },
      heroGenders: { Shane: 'male' },
      heroSkins: { Shane: 'archfiend-swimmer-blackred' },
      expenses: [{ amount: 1000, paidBy: 'Shane', sharedBy: ['Shane', 'Pointy'] }],
      settleXp: { Shane: 400 },
      admin: { adminId: 'ADM-ALPHA', adminName: 'Different nickname', characterId: '1111' },
      updatedAt: 200
    }
  }], { id: '1111', name: 'Shane', class: 'archfiend', gender: 'male', xp: 900, createdAt: 100 }, { lang: 'en' });

  assert.equal(profile.displayName, 'Shane');
  assert.equal(profile.class, 'archfiend');
  assert.equal(profile.skin, 'archfiend-swimmer-blackred');
  assert.equal(profile.xp, 900);
  assert.equal(profile.level.lvl, 2);
  assert.equal(profile.totals.boards, 1);
  assert.equal(profile.totals.paid, 1000);
  assert.equal(profile.totals.share, 500);
  assert.equal(profile.totals.fronted, 500);
  assert.equal(profile.totals.balance, 500);
  assert.equal(profile.adminBoards.length, 1);
  assert.equal(profile.boards[0].updatedAt, 200);
  assert.ok(profile.badges.some(b => b.id === 'board-admin'));
});

test('Debt Dragon interest math handles compound and simple modes', () => {
  const compound = { original: 100000, balance: 60000, apr: 12, payment: 6000, interestMode: 'compound' };
  const simple = { original: 100000, balance: 60000, apr: 12, payment: 6000, interestMode: 'simple' };

  closeTo(logic.monthlyInterest(compound), 600);
  closeTo(logic.monthlyInterest(simple), 1000);
  assert.equal(logic.payoffMonths(simple), 12);
  assert.equal(logic.payoffMonths({ ...simple, payment: 1000 }), Infinity);
  assert.equal(logic.payoffMonths({ ...compound, payment: 600 }), Infinity);
});

test('Debt Dragon lair simulation excludes ad-hoc debts and rolls freed payments forward', () => {
  const dragons = [
    { id: 'a', original: 12000, balance: 12000, apr: 0, payment: 3000, payMode: 'monthly', interestMode: 'compound' },
    { id: 'b', original: 12000, balance: 12000, apr: 0, payment: 3000, payMode: 'monthly', interestMode: 'compound' },
    { id: 'c', original: 5000, balance: 5000, apr: 999, payment: 0, payMode: 'adhoc', interestMode: 'compound' }
  ];

  const sim = logic.simulateLair(dragons, 'snowball', 0);
  assert.equal(sim.months, 4);
  assert.equal(sim.never, false);
  assert.equal(sim.interest, 0);
});

test('Debt Dragon strategy target switches between avalanche and snowball', () => {
  const dragons = [
    { id: 'small', balance: 1000, apr: 3 },
    { id: 'hot', balance: 9000, apr: 22 },
    { id: 'dead', balance: 500, apr: 99, slain: true }
  ];

  assert.equal(logic.strategyTarget(dragons, 'snowball'), 'small');
  assert.equal(logic.strategyTarget(dragons, 'avalanche'), 'hot');
});

test('Debt Dragon XP comes from logged damage and slain bonuses', () => {
  assert.equal(logic.slayerXpFrom([
    { log: [{ amount: 3000 }, { amount: 2000 }], slain: false },
    { log: [{ amount: 1000 }], slain: true }
  ]), 1100);
});
