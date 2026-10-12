import test from 'node:test';
import assert from 'node:assert/strict';
import '../../shared/pointy-logic.js';
const v = globalThis.PointyLogic;

test('numeric typing never silently changes invalid financial input', () => {
  for (const raw of ['-1', '1e3', '1.2.3', '1,2', 'NaN', 'Infinity', '0x10']) {
    assert.equal(v.formatNumberInput(raw), raw);
    assert.throws(() => v.validateNumber(raw));
  }
  for (const raw of ['', ' ', '1.001', '99999999999999999']) assert.throws(() => v.validateNumber(raw));
  assert.equal(v.validateNumber('1,000.01'), 1000.01);
  assert.equal(v.validateNumber('0'), 0);
  assert.throws(() => v.validateNumber('0', { min: .01 }));
  assert.equal(v.validateNumber(.1 + .2), .1 + .2);
  assert.equal(v.validateNumber('0.000001', { decimals: 6 }), .000001);
  assert.equal(v.validateNumber('.5'), .5);
  const input = { value: '1234' }; v.formatNumberInputElement(input);
  assert.equal(input.value, '1,234'); input.value += '5'; v.formatNumberInputElement(input);
  assert.equal(input.value, '12,345'); input.value = '1,2'; v.formatNumberInputElement(input);
  assert.equal(input.value, '1,2'); assert.throws(() => v.validateNumber(input.value));
});
test('calendar days, due days and text limits reject impossible values', () => {
  for (const value of ['0', '-1', '32', '1.5', '1e1']) assert.throws(() => v.validateNumber(value, { min: 1, max: 31, decimals: 0 }));
  for (const date of ['', '2026-02-30', '2026-13-01', '2026-10-12T25:00', '2026-10-12garbage']) assert.throws(() => v.validateDate(date));
  assert.equal(v.validateDate('2024-02-29'), '2024-02-29');
  assert.throws(() => v.validateDate('2026-09-30', { month: '2026-10' }));
  assert.throws(() => v.validateText(' '.repeat(5)));
  assert.throws(() => v.validateText('ก'.repeat(31), { max: 30 }));
  assert.equal(v.validateText('  ฮีโร่  ', { max: 30 }), 'ฮีโร่');
});
test('offers reject partial rows, fractional packs and promotions but allow fractional measured quantities', () => {
  const offer = { merchant: '', price: '10.01', qty: '0.5', unit: 'l', perPack: '', buy: '2', free: '1' };
  const cmp = { baseUnit: 'ml' };
  assert.equal(v.validateOfferInput(offer, cmp).qty, .5);
  for (const patch of [{ price: '-1' }, { price: '1.001' }, { qty: '' }, { buy: '1.5' }, { free: '-1' }, { buy: '1e2' }, { unit: 'kg' }]) assert.throws(() => v.validateOfferInput({ ...offer, ...patch }, cmp));
  for (const patch of [{ qty: '1.5' }, { perPack: '2.5' }]) assert.throws(() => v.validateOfferInput({ ...offer, qty: '1', perPack: '6', unit: 'แพ็ค/กล่อง', ...patch }, { baseUnit: 'ชิ้น' }));
});
test('ledger boundary rejects malformed split totals and excessive precision in every monetary branch', () => {
  const e = { desc: 'อาหาร', amount: 100, paidBy: 'A', sharedBy: ['A', 'B'] };
  assert.doesNotThrow(() => v.validateLedgerExpense(e, ['A', 'B']));
  for (const patch of [{ amount: .001 }, { payers: { A: 99.999, B: .001 } }, { split: { mode: 'percent', weights: { A: 30, B: 30 } } }, { split: { mode: 'exact', weights: { A: 40, B: 40 } } }, { date: '2026-02-31' }]) assert.throws(() => v.validateLedgerExpense({ ...e, ...patch }, ['A', 'B']));
});
