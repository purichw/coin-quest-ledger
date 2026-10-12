import test, { beforeEach } from 'node:test';
import { parseBackup } from '../src/modules/backup-contracts.ts';
import assert from 'node:assert/strict';
import { canon } from '../src/domain/canon.ts';
import { financialReminders } from '../src/player/reminder-contracts.ts';
import { archiveTreasuryCategory, normalizeModule, payDragon, editDebtLog, validateDragon, saveTreasuryExpense, removeTreasuryExpense, restoreDebtLog, validateOffer } from '../src/modules/contracts.ts';
const day = '2026-10-12'; const now = canon.dateOnlyMs(day);
// Fixtures describe this calendar day. Validation must not depend on the CI
// runner's wall clock (UTC can still be yesterday while Bangkok is already today).
beforeEach(context => context.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 9, 12, 12) }));
const dragon = () => ({ id: 'd', name: { th: 'QA' }, type: 'card', original: 1000, balance: 1000, apr: 12, payment: 100, payMode: 'monthly', interestMode: 'compound', dueDay: 15, log: [], createdAt: now, interestAccruedAt: now, slain: false, slainAt: null });
test('backup import rejects another account, incomplete modules, duplicate IDs and invalid money', () => {
  const value = { format: 'coin-quest-player-v1', uid: 'qa', savedAt: new Date(now).toISOString(), modules: { debt: { dragons: [dragon()] }, treasury: normalizeModule('treasury'), comparisons: [] } };
  assert.equal(parseBackup(JSON.stringify(value), 'qa').modules.debt.dragons[0].balance, 1000);
  const legacy = structuredClone(value); legacy.modules.debt.dragons[0].log = [{ id: 'web', date: '12 ต.ค.', ts: now, amount: 100 }];
  assert.equal(parseBackup(JSON.stringify(legacy), 'qa').modules.debt.dragons[0].log[0].date, '12 ต.ค.');
  assert.throws(() => parseBackup(JSON.stringify(value), 'other'));
  assert.throws(() => parseBackup(JSON.stringify({ ...value, modules: { debt: {} } }), 'qa'));
  assert.throws(() => parseBackup(JSON.stringify({ ...value, modules: { ...value.modules, debt: { dragons: [dragon(), dragon()] } } }), 'qa'));
  assert.throws(() => parseBackup(JSON.stringify({ ...value, modules: { ...value.modules, treasury: { ...value.modules.treasury, income: -1 } } }), 'qa'));
  assert.throws(() => parseBackup(JSON.stringify({ ...value, modules: { ...value.modules, debt: { dragons: [{ ...dragon(), balance: -1 }] } } }), 'qa'));
  const invalidOffer = { id: 'c', name: 'Water', baseUnit: 'ml', offers: [{ id: 'o', merchant: 'Shop', price: -1, qty: 500, unit: 'ml', perPack: 0, buy: 1, free: 0 }] };
  assert.throws(() => parseBackup(JSON.stringify({ ...value, modules: { ...value.modules, comparisons: [invalidOffer] } }), 'qa'));
});
test('absent module state has no fabricated debts, income, bills, history or offers', () => {
  assert.equal(normalizeModule('debt', {}).dragons.length, 0);
  const treasury = normalizeModule('treasury', undefined); assert.equal(treasury.income, 0); assert.deepEqual(treasury.bills, []); assert.deepEqual(treasury.history, []);
  assert.deepEqual(normalizeModule('comparisons', undefined), []);
  assert.throws(() => normalizeModule('comparisons', [{ id: 'c', offers: [{ id: 'bad', price: -1, qty: 1 }] }]));
});
test('legacy module data and unknown metadata survive normalization', () => {
  const debt = normalizeModule('debt', { dragons: [{ ...dragon(), custom: true }], custom: { keep: true }, strategy: 'snowball' });
  assert.equal(debt.strategy, 'snowball'); assert.equal(debt.dragons[0].custom, true); assert.equal(debt.custom.keep, true);
  const tr = normalizeModule('treasury', { expenses: [{ id: 'e', name: 'food', category: 'meal', amount: 50 }], income: 100 });
  assert.equal(tr.expenses[0].note, 'food'); assert.equal(tr.expenses[0].catId, 'meal');
});
test('dated payment conserves balance, records provenance, and is idempotent', () => {
  const paid = payDragon(dragon(), 100, day, 'p1', now);
  assert.equal(paid.debt.balance, 900); assert.equal(paid.debt.log[0].balanceBefore, 1000); assert.equal(paid.debt.log[0].balanceAfter, 900);
  assert.equal(payDragon(paid.debt, 100, day, 'p1', now).debt.log.length, 1);
});
test('same-day legacy timestamps permit payment and a retried final payment stays idempotent', () => {
  const d = { ...dragon(), createdAt: now + 3600000, interestAccruedAt: now + 3600000 };
  const paid = payDragon(d, 1000, day, 'final', now + 7200000);
  assert.equal(paid.debt.slain, true);
  assert.equal(payDragon(paid.debt, 1000, day, 'final', now + 7200000).debt.log.length, 1);
});
test('payments reject overpayment, invalid dates, backdating, future dates, and negative amounts', () => {
  for (const [amount, date] of [[1001, day], [-10, day], [0, day], [.001, day], [Infinity, day], [10, '2026-02-31'], [10, '2026-10-11'], [10, '2026-10-13']]) assert.throws(() => payDragon(dragon(), amount, date, 'p', now));
});
test('daily interest and repeated accrual use exactly the shared website implementation', () => {
  const d = { ...dragon(), createdAt: now - 86400000, interestAccruedAt: now - 86400000 };
  const paid = payDragon(d, 100, day, 'p', now); const expected = canon.applyDebtPayment(d, 100, day);
  assert.equal(paid.debt.balance, expected.balanceAfter); assert.equal(paid.interest, expected.interest);
  assert.equal(canon.accrueDebtToDate(paid.debt, day).interest, 0);
});
test('history removal returns the payment to balance and keeps a recoverable copy', () => {
  const paid = payDragon(dragon(), 100, day, 'p', now).debt;
  const removed = editDebtLog(paid, 'p', 0, day, true); assert.equal(removed.balance, 1000); assert.equal(removed.log.length, 0); assert.equal(removed.logTrash[0].amount, 100);
});
test('monthly plan requires valid due day and a positive payment', () => {
  assert.doesNotThrow(() => validateDragon(dragon()));
  assert.throws(() => validateDragon({ ...dragon(), dueDay: 32 })); assert.throws(() => validateDragon({ ...dragon(), payment: 0 }));
});
test('editing an accrued debt preserves its principal and precise balance; new input remains bounded', () => {
  const previous = canon.accrueDebtToDate({ ...dragon(), interestMode: 'simple' }, '2026-10-13').debt;
  assert.ok(previous.balance > previous.original);
  const restored = normalizeModule('debt', { dragons: [previous] }).dragons[0];
  assert.equal(restored.original, 1000); assert.equal(restored.balance, previous.balance);
  assert.doesNotThrow(() => validateDragon({ ...restored, name: { th: 'Renamed' } }, restored));
  assert.throws(() => validateDragon({ ...restored, balance: 1100.001 }, restored));
  assert.doesNotThrow(() => validateDragon({ ...dragon(), balance: 1100 }));
  const finalPayment = payDragon(previous, Math.round(previous.balance * 100) / 100, '2026-10-13', 'final', now + 86400000).debt;
  const backup = { format: 'coin-quest-player-v1', uid: 'qa', savedAt: new Date(now).toISOString(), modules: { debt: { dragons: [finalPayment] }, treasury: normalizeModule('treasury'), comparisons: [] } };
  assert.equal(parseBackup(JSON.stringify(backup), 'qa').modules.debt.dragons[0].log[0].amount, finalPayment.log[0].amount);
});
test('debt history restoration reverses removal without duplicate payment or loss', () => {
  const paid = payDragon(dragon(), 100, day, 'p', now).debt; const restored = restoreDebtLog(editDebtLog(paid, 'p', 0, day, true), 'p');
  assert.equal(restored.balance, 900); assert.equal(restored.log.length, 1); assert.deepEqual(restored.logTrash, []);
});
function treasury() { return { ...normalizeModule('treasury', {}), month: '2026-10', income: 5000, categories: [{ id: 'food', budget: 1000, name: 'food', glyph: '🍜' }], bills: [{ id: 'b', name: 'QA', amount: 300, catId: 'food', dueDay: 15 }] }; }
test('category archiving preserves recoverable data and rejects financial references', () => {
  assert.throws(() => archiveTreasuryCategory(treasury(), 'food'));
  const available = { ...treasury(), bills: [] };
  const archived = archiveTreasuryCategory(available, 'food');
  assert.deepEqual(archived.categories, []); assert.deepEqual(archived.categoryTrash, available.categories);
  assert.throws(() => archiveTreasuryCategory({ ...available, expenseTrash: [{ id: 'e', catId: 'food', amount: 100 }] }, 'food'));
});
test('treasury entries are validated and bill payments cannot be duplicated', () => {
  const entry = { id: 'e', catId: 'food', amount: 300, note: 'QA', date: day, billId: 'b', onTime: true }; const state = saveTreasuryExpense(treasury(), entry);
  assert.equal(canon.treasurySpent(state), 300); assert.equal(state.stats.onTime, 1); assert.equal(saveTreasuryExpense(state, entry).stats.logged, 1);
  assert.throws(() => saveTreasuryExpense(state, { ...entry, id: 'other' }));
  for (const changes of [{ amount: -1 }, { amount: 1.001 }, { amount: Infinity }, { date: '2026-09-01' }, { date: '2026-02-31' }, { catId: 'missing' }]) assert.throws(() => saveTreasuryExpense(treasury(), { ...entry, ...changes }));
  const removed = removeTreasuryExpense(state, 'e'); assert.equal(removed.expenseTrash.length, 1); assert.equal(removed.stats.onTime, 0);
});
test('treasury projection includes unpaid bills once; same-month close preserves detail and rollover archives it', () => {
  const state = saveTreasuryExpense(treasury(), { id: 'e', catId: 'food', amount: 120, note: 'meal', date: day });
  const projection = canon.treasuryProjection(state, new Date(2026, 9, 12)); assert.equal(projection.projected, 610); assert.equal(projection.unpaidBills, 300);
  const closed = canon.treasuryClose(state); assert.equal(closed.expenses.length, 1); assert.equal(closed.history[0].spent, 120); assert.equal(canon.treasuryClose(closed).history.length, 1);
  const next = canon.treasuryClose(closed, '2026-11'); assert.equal(next.expenses.length, 0); assert.equal(next.history[0].expenses[0].amount, 120); assert.equal(next.bills.length, 1);
});
test('prices compare common units and buy/free promotions using the website canonical math', () => {
  const c = { id: 'c', name: 'water', baseUnit: 'ml', offers: [] };
  const a = { id: 'a', merchant: 'QA A', price: 30, qty: 1, unit: 'l', perPack: 0, buy: 1, free: 0 };
  const b = { ...a, id: 'b', merchant: 'QA B', price: 20, qty: 500, unit: 'ml', buy: 2, free: 1 };
  validateOffer(a, c); validateOffer(b, c); const ranks = canon.rankOffers([a, b], c);
  assert.equal(ranks[0].id, 'b'); assert.equal(ranks[0].norm.qty, 750); assert.equal(ranks[0].savePct, 11);
  for (const patch of [{ qty: 0 }, { price: -1 }, { free: .5 }, { buy: 0 }, { unit: 'kg' }]) assert.throws(() => validateOffer({ ...a, ...patch }, c));
});
test('shared progression and streak keep XP separate from reputation and do not duplicate daily visits', () => {
  const modules = { debt: { ...normalizeModule('debt', {}), dragons: [payDragon(dragon(), 100, day, 'p', now).debt] }, treasury: treasury(), comparisons: [] };
  const progress = canon.playerProgress([], { id: '1234', name: 'QA' }, modules, { streak: 1 });
  assert.equal(progress.debtReputation, 10); assert.equal(progress.reputation, 10); assert.equal(canon.PLAYER_ACHIEVEMENTS.find(t => t.id === 'first_strike').test(progress), true);
  const visit = canon.nextActivity({ lastVisit: '2026-10-11', streak: 2, bestStreak: 5 }, new Date(2026, 9, 12)); assert.equal(visit.streak, 3); assert.equal(visit.bestStreak, 5); assert.deepEqual(canon.nextActivity(visit, new Date(2026, 9, 12)), visit);
});
test('reminders clamp month ends and exclude archived and paid bills', () => {
  const tr = { ...treasury(), month: '2026-02', bills: [{ id: 'bill', name: 'QA', amount: 300, dueDay: 31 }] };
  const modules = { debt: normalizeModule('debt', {}), treasury: tr, comparisons: [] }; const date = new Date(2026, 1, 28);
  const reminders = financialReminders(modules, [], '1234', date); assert.equal(reminders.length, 1); assert.match(reminders[0].detail, /วันนี้/);
  assert.equal(financialReminders({ ...modules, treasury: { ...tr, bills: [{ ...tr.bills[0], archived: true }] } }, [], '1234', date).length, 0);
  assert.equal(financialReminders({ ...modules, treasury: { ...tr, expenses: [{ id: 'e', billId: 'bill', amount: 300, date: '2026-02-28' }] } }, [], '1234', date).length, 0);
});
