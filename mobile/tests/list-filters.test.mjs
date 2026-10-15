import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesDebtFilter, visibleDebts, visibleComparisons, categoryStatus, categorySpent, visibleCategories } from '../src/modules/list-filters.ts';
import { normalizeModule } from '../src/modules/contracts.ts';

const dragon = (id, patch = {}) => ({ id, name: id, type: 'card', original: 1000, balance: 1000, apr: 12, payment: 100, payMode: 'monthly', interestMode: 'compound', dueDay: 28, log: [], createdAt: 1, interestAccruedAt: 1, slain: false, slainAt: null, ...patch });
const ids = rows => rows.map(row => row.id);
const offer = (id, price, patch = {}) => ({ id, merchant: id, price, qty: 1, unit: 'piece', perPack: 0, buy: 1, free: 0, ...patch });
const product = (id, patch = {}) => ({ id, name: id, icon: '🛒', baseUnit: 'piece', offers: [], ...patch });

test('debt status separates archived debts from All and from paid or active lists', () => {
  const rows = [dragon('active'), dragon('paid', { balance: 0, slain: true }), dragon('archive', { archived: true }), dragon('archive-paid', { archived: true, slain: true })];
  assert.deepEqual(ids(visibleDebts(rows, 'all', '', 'added')), ['active', 'paid']);
  assert.deepEqual(ids(visibleDebts(rows, 'active', '', 'added')), ['active']);
  assert.deepEqual(ids(visibleDebts(rows, 'paid', '', 'added')), ['paid']);
  assert.deepEqual(ids(visibleDebts(rows, 'archived', '', 'added')), ['archive', 'archive-paid']);
});

test('due filter uses the inclusive seven-day window, month-end clamping and overdue debts', () => {
  const monthEnd = dragon('month-end', { dueDay: 31 });
  assert.equal(matchesDebtFilter(monthEnd, 'due', new Date(2026, 1, 20, 23)), false);
  assert.equal(matchesDebtFilter(monthEnd, 'due', new Date(2026, 1, 21, 1)), true);
  assert.equal(matchesDebtFilter(monthEnd, 'due', new Date(2026, 1, 28, 23)), true);
  assert.equal(matchesDebtFilter(dragon('overdue', { dueDay: 2 }), 'due', new Date(2026, 1, 28)), true);
  for (const patch of [{ payMode: 'adhoc' }, { slain: true }, { archived: true }]) assert.equal(matchesDebtFilter(dragon('excluded', patch), 'due', new Date(2026, 1, 28)), false);
});

test('a payment in the current local month advances the due filter to next month', () => {
  const paid = dragon('paid-month', { dueDay: 3, log: [{ id: 'payment', ts: new Date(2026, 1, 2, 12).getTime(), amount: 1 }] });
  assert.equal(matchesDebtFilter(paid, 'due', new Date(2026, 1, 15)), false);
  assert.equal(matchesDebtFilter(paid, 'due', new Date(2026, 1, 27)), true);
  assert.equal(matchesDebtFilter({ ...paid, log: [{ ...paid.log[0], ts: new Date(2026, 0, 31, 12).getTime() }] }, 'due', new Date(2026, 1, 15)), true);
});

test('debt search includes canonical type names and sorting never reorders saved records', () => {
  const rows = [dragon('low', { name: 'Visa Travel', balance: 100, apr: 30 }), dragon('high', { name: 'House', type: 'mortgage', balance: 900, apr: 5 })];
  const before = structuredClone(rows);
  assert.deepEqual(ids(visibleDebts(rows, 'all', '  VISA ', 'added')), ['low']);
  assert.deepEqual(ids(visibleDebts(rows, 'all', 'บัตรเครดิต', 'added')), ['low']);
  assert.deepEqual(ids(visibleDebts(rows, 'all', '', 'balance')), ['high', 'low']);
  assert.deepEqual(ids(visibleDebts(rows, 'all', '', 'apr')), ['low', 'high']);
  assert.deepEqual(rows, before);
});

test('price All includes archived items, query is trimmed, and Latest keeps saved order', () => {
  const rows = [product('z', { name: 'Milk Large' }), product('a', { name: 'Milk Small', archived: true }), product('m', { name: 'Rice' })];
  assert.deepEqual(ids(visibleComparisons(rows, 'all', ' MILK ', 'latest')), ['z', 'a']);
  assert.deepEqual(ids(visibleComparisons(rows, 'active', '', 'latest')), ['z', 'm']);
  assert.deepEqual(ids(visibleComparisons(rows, 'archived', '', 'latest')), ['a']);
  assert.deepEqual(ids(visibleComparisons(rows, 'all', 'missing', 'latest')), []);
});

test('price savings sort uses normalized promotion value and preserves source order', () => {
  const rows = [product('small', { name: 'B', offers: [offer('cheap', 9), offer('dear', 10)] }), product('promotion', { name: 'A', offers: [offer('free-item', 10, { buy: 1, free: 1 }), offer('normal', 10)] }), product('empty', { name: 'C' })];
  const before = structuredClone(rows);
  assert.deepEqual(ids(visibleComparisons(rows, 'all', '', 'saving')), ['promotion', 'small', 'empty']);
  assert.deepEqual(ids(visibleComparisons(rows, 'all', '', 'name')), ['promotion', 'small', 'empty']);
  assert.deepEqual(rows, before);
});

test('Treasury category status preserves 80%, 100%, zero-budget and satang boundaries', () => {
  for (const [budget, spent, expected] of [[100, 79.99, 'normal'], [100, 80, 'near'], [100, 100, 'near'], [100, 100.01, 'over'], [0, 0, 'normal'], [0, .01, 'over']]) {
    const category = { id: 'food', name: 'Food', budget, glyph: '🍜' };
    const state = { ...normalizeModule('treasury'), categories: [category], expenses: [{ id: 'e', catId: 'food', amount: spent }] };
    assert.equal(categoryStatus(state, category), expected, `${spent}/${budget}`);
  }
});

test('Treasury search and filter do not change spending totals or category records', () => {
  const food = { id: 'food', name: { th: 'อาหาร', en: 'Food' }, budget: 100, glyph: '🍜' };
  const home = { id: 'home', name: 'Home', budget: 200, glyph: '🏠' };
  const state = { ...normalizeModule('treasury'), categories: [food, home], expenses: [{ id: 'e1', catId: 'food', amount: 50 }, { id: 'e2', catId: 'food', amount: 30 }, { id: 'e3', catId: 'home', amount: 10 }] };
  const before = structuredClone(state);
  assert.equal(categorySpent(state, 'food'), 80);
  assert.deepEqual(ids(visibleCategories(state, 'near', ' อาหาร ')), ['food']);
  assert.deepEqual(ids(visibleCategories(state, 'normal', 'HOME')), ['home']);
  assert.deepEqual(ids(visibleCategories(state, 'over', '')), []);
  assert.deepEqual(state, before);
});
