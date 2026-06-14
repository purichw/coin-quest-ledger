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
    expenses: [{ name: 'Coffee', amount: '120', payer: 'A', participants: ['A'] }]
  }, { defaultTripName: 'Trip', questFallback: 'Quest', questIcons: ['x'] });

  assert.equal(state.tripName, 'Trip');
  assert.equal(state.heroClasses.A, 'wizard');
  assert.equal(state.expenses[0].desc, 'Coffee');
  assert.equal(state.expenses[0].paidBy, 'A');
  assert.deepEqual(plain(state.expenses[0].sharedBy), ['A']);
});

test('parseImportItems reads comma, semicolon, and tab separated rows', () => {
  assert.deepEqual(plain(logic.parseImportItems('Coffee, 120\nTaxi; ฿240\nSnack\t35\nBad line\nFree, 0')), [
    { desc: 'Coffee', amount: 120 },
    { desc: 'Taxi', amount: 240 },
    { desc: 'Snack', amount: 35 }
  ]);
});
