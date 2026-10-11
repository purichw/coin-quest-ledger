import test from 'node:test';
import assert from 'node:assert/strict';
import '../../shared/pointy-logic.js';
const logic = globalThis.PointyLogic;
const start = logic.dateOnlyMs('2026-01-01');
const fresh = () => ({ balance: 1000, original: 1000, apr: 36.5, interestMode: 'compound', createdAt: start, interestAccruedAt: start, log: [], slain: false });
function pay(d, id, amount, date) {
  const r = logic.applyDebtPayment(d, amount, date);
  return { ...r.debt, log: [...d.log, { id, amount, date, ts: logic.dateOnlyMs(date), balanceBefore: r.balanceBefore, balanceAfter: r.balanceAfter, interest: r.interestPaid, principal: r.principalPaid, accruedInterest: r.interest, days: r.days }] };
}
test('changing an early debt payment recalculates later compound interest and payment allocations', () => {
  const old = pay(pay(fresh(), 'first', 100, '2026-01-11'), 'second', 200, '2026-01-21');
  const revised = logic.reviseDebtLog(old, { id: 'first', amount: 150, date: '2026-01-11' });
  const expected = pay(pay(fresh(), 'first', 150, '2026-01-11'), 'second', 200, '2026-01-21');
  assert.ok(Math.abs(revised.balance - expected.balance) < 1e-8);
  assert.ok(Math.abs(revised.log[1].interest - expected.log[1].interest) < 1e-8);
  assert.notEqual(revised.balance, old.balance - 50);
});
test('removing and restoring a payment keeps the accrued cutoff and reverses exactly', () => {
  const old = logic.accrueDebtToDate(pay(pay(fresh(), 'first', 100, '2026-01-11'), 'second', 200, '2026-01-21'), '2026-02-01').debt;
  const removed = logic.reviseDebtLog(old, { id: 'first', remove: true });
  const restored = logic.reviseDebtLog(removed, { id: 'first', restore: true });
  assert.ok(Math.abs(restored.balance - old.balance) < 1e-8);
  assert.equal(restored.interestAccruedAt, old.interestAccruedAt);
  assert.equal(restored.logTrash.length, 0);
});
test('moving a payment later calculates additional interest, invalid dates and overpayment fail', () => {
  const old = pay(fresh(), 'first', 100, '2026-01-11');
  const changed = logic.reviseDebtLog(old, { id: 'first', amount: 100, date: '2026-01-21' });
  assert.ok(changed.balance > old.balance);
  assert.throws(() => logic.reviseDebtLog(old, { id: 'first', amount: 5000, date: '2026-01-11' }), /เกิน/);
  assert.throws(() => logic.reviseDebtLog(old, { id: 'first', amount: -1, date: '2026-01-11' }), /มากกว่า 0/);
  assert.throws(() => logic.reviseDebtLog(old, { id: 'first', amount: 100, date: '2026-02-30' }), /วันที่/);
});
test('changed debt terms and incomplete legacy interest history cannot silently corrupt balances', () => {
  const old = pay(fresh(), 'first', 100, '2026-01-11');
  assert.throws(() => logic.reviseDebtLog({ ...old, apr: 10 }, { id: 'first', remove: true }), /เงื่อนไข/);
  assert.throws(() => logic.reviseDebtLog({ ...fresh(), balance: 900, log: [{ id: 'first', amount: 100, ts: start }] }, { id: 'first', remove: true }), /ประวัติ/);
});
test('a remaining thirty satang is still outstanding', () => {
  const r = logic.applyDebtPayment({ ...fresh(), apr: 0 }, 999.7, '2026-01-01');
  assert.equal(r.debt.slain, false);
  assert.equal(logic.normalizeDebtState({ dragons: [{ ...r.debt, slain: true }] }).dragons[0].slain, false);
});

test('calendar dates stay local in western time zones', () => {
  const previous = process.env.TZ;
  try { process.env.TZ = 'America/Los_Angeles'; const day = new Date(logic.dateOnlyMs('2026-06-14')); assert.equal(day.getDate(), 14); assert.equal(day.getHours(), 0); }
  finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});
