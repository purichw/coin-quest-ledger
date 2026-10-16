import test from 'node:test';
import assert from 'node:assert/strict';
import '../../shared/pointy-logic.js';
const L = globalThis.PointyLogic;
const start = L.dateOnlyMs('2026-01-01');
const fresh = (overrides = {}) => ({ id: 'a', balance: 1000, original: 1000, unpaidInterest: 0, apr: 36.5,
  interestMode: 'reducing', payment: 100, payMode: 'monthly', createdAt: start, interestAccruedAt: start, log: [], ...overrides });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
function pay(d, id, amount, date) {
  const r = L.applyDebtPayment(d, amount, date);
  return { ...r.debt, log: [...d.log, { id, amount: r.applied, date, ts: L.dateOnlyMs(date), interest: r.interestPaid,
    principal: r.principalPaid, accruedInterest: r.interest, balanceBefore: r.balanceBefore, balanceAfter: r.balanceAfter, days: r.days }] };
}

test('reducing interest is daily simple interest on remaining principal, not original principal or compounded interest', () => {
  const d = fresh({ balance: 1200, unpaidInterest: 200, original: 2000 });
  near(L.dailyInterest(d, '2026-01-01', '2026-01-11'), 10);
  near(L.dailyInterest({ ...d, interestMode: 'simple' }, '2026-01-01', '2026-01-11'), 20);
  near(L.dailyInterest({ ...d, interestMode: 'compound' }, '2026-01-01', '2026-01-11'), 1200 * (1.001 ** 10 - 1));
});

test('accruing reducing interest more often does not compound unpaid interest', () => {
  const once = L.accrueDebtToDate(fresh(), '2026-01-21').debt;
  const twice = L.accrueDebtToDate(L.accrueDebtToDate(fresh(), '2026-01-11').debt, '2026-01-21').debt;
  near(once.balance, 1020); near(twice.balance, 1020); near(twice.unpaidInterest, 20);
});

test('partial interest payments leave principal unchanged until all accrued interest is paid', () => {
  const first = pay(fresh(), 'one', 5, '2026-01-11');
  near(first.balance, 1005); near(first.unpaidInterest, 5); near(first.log[0].principal, 0);
  const second = pay(first, 'two', 100, '2026-01-21');
  near(second.log[1].interest, 15); near(second.log[1].principal, 85); near(second.balance, 915); near(second.unpaidInterest, 0);
});

test('paying principal earlier reduces later interest and final payoff clears the interest bucket', () => {
  const first = pay(fresh(), 'one', 110, '2026-01-11');
  near(first.balance, 900);
  const second = pay(first, 'two', 909, '2026-01-21');
  near(second.log[1].interest, 9); near(second.log[1].principal, 900);
  assert.equal(second.slain, true); near(second.balance, 0); near(second.unpaidInterest, 0);
});

test('normalization preserves explicit reducing mode and does not migrate legacy debt modes', () => {
  const modes = L.normalizeDebtState({ dragons: [fresh(), fresh({ interestMode: 'simple' }), fresh({ interestMode: 'compound' }), fresh({ interestMode: undefined })] }).dragons;
  assert.deepEqual(modes.map(d => d.interestMode), ['reducing', 'simple', 'compound', 'compound']);
  assert.equal(modes[0].unpaidInterest, 0);
});

test('editing, removing and restoring reducing payment history recalculates principal and interest', () => {
  const before = pay(pay(fresh(), 'one', 100, '2026-01-11'), 'two', 100, '2026-01-21');
  near(before.balance, 819.1);
  const edited = L.reviseDebtLog(before, { id: 'one', amount: 150, date: '2026-01-11' });
  near(edited.balance, 768.6); near(edited.log[1].interest, 8.6);
  const removed = L.reviseDebtLog(edited, { id: 'one', remove: true });
  near(removed.balance, 920); near(removed.log[0].interest, 20);
  const restored = L.reviseDebtLog(removed, { id: 'one', restore: true });
  near(restored.balance, 768.6); near(restored.log[1].interest, 8.6);
});

test('monthly forecast excludes unpaid interest from reducing charges and allocates payments interest-first', () => {
  const d = fresh({ balance: 1200, unpaidInterest: 200, apr: 12, payment: 100 });
  near(L.monthlyInterest(d), 10);
  // Separate reference ledger: 1000 principal, 200 already-accrued interest.
  let principal = 1000, interestDue = 200, futureInterest = 0, months = 0;
  while (principal + interestDue > .005) {
    const charge = principal * .01; futureInterest += charge; interestDue += charge;
    const interestPayment = Math.min(100, interestDue); interestDue -= interestPayment;
    principal = Math.max(0, principal - (100 - interestPayment)); months++;
  }
  const snapshot = JSON.stringify(d);
  const result = L.simulateLair([d]);
  assert.equal(result.months, months); assert.equal(result.interest, Math.round(futureInterest * 100) / 100);
  assert.equal(L.payoffMonths(d), months); assert.equal(JSON.stringify(d), snapshot);
});

test('insufficient reducing payments accumulate interest without charging interest on it', () => {
  const d = fresh({ apr: 12, payment: 5 });
  const result = L.simulateLair([d]);
  assert.equal(result.never, true); assert.equal(result.months, Infinity); assert.equal(result.interest, 12000);
});

test('an explicit zero installment survives load and cannot become an invented payment plan', () => {
  const d = L.normalizeDebtState({ dragons: [fresh({ type:'card', payment:0 })] }).dragons[0];
  assert.equal(d.payment,0);
  assert.equal(L.simulateLair([d]).never,true);
  assert.equal(L.payoffMonths(d),Infinity);
});

test('a reducing balance consisting entirely of interest generates no additional interest', () => {
  const d = fresh({ balance: 100, unpaidInterest: 100, payment: 20 });
  near(L.dailyInterest(d, '2026-01-01', '2026-02-01'), 0);
  assert.equal(L.simulateLair([d]).months, 5); assert.equal(L.simulateLair([d]).interest, 0);
});

test('reducing scheduled cash left over from a final installment pays the next debt in the same month', () => {
  const result = L.simulateLair([fresh({ id: 'a', balance: 50, apr: 0 }), fresh({ id: 'b', balance: 150, apr: 0 })]);
  assert.equal(result.months, 1); assert.equal(result.interest, 0);
});
