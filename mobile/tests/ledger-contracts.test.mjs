import test from 'node:test';
import assert from 'node:assert/strict';
import { canon } from '../src/domain/canon.ts';
import { acceptInvite, addGuest, addHero, editGuest, freshBoard, memberName, ownsBoard, parseBoardReference, readBoard, removeMember, restoreMember, switchCampaign, syncCampaign, validateExpense, withoutUndefined } from '../src/ledger/contracts.ts';
import { previewImport, applyImport, textExpenses, spreadsheetExpense } from '../src/ledger/imports.ts';

const account = { uid: 'owner-a', username: 'qa', userId: '1234', name: 'Owner', characterId: '1234', status: 'active' };
const hero = { id: '1234', name: 'Hero', classId: 'ranger', gender: 'female', skin: '', xp: 0 };
const fresh = () => freshBoard(account, hero, 'Trip', 1000);
const expense = (patch = {}) => ({ id: 'e1', desc: 'Dinner', icon: 'coin', amount: 100, paidBy: 'Hero', sharedBy: ['Hero', 'Guest'], split: { mode: 'equal' }, ...patch });
const pair = () => addGuest(fresh(), 'Guest', 'warrior', 'male');

test('web board links resolve only approved board URLs', () => {
  assert.equal(parseBoardReference('https://coinquestledger.vercel.app/trip/?id=3512'), '3512');
  assert.equal(parseBoardReference('3512'), '3512');
  assert.throws(() => parseBoardReference('https://other.example/trip/?id=3512'));
});
test('member removal protects money references and self; unused Guest can be restored', () => {
  const board = pair(); const removed = removeMember(board, 'Guest', hero.id); assert.equal(removed.participants.includes('Guest'), false);
  assert.equal(restoreMember(removed, 'Guest').guestHeroes.Guest, true);
  assert.throws(() => removeMember(board, 'Hero', hero.id));
  assert.throws(() => removeMember({ ...board, expenses: [expense()] }, 'Guest', hero.id));
});

test('web Excel multi-payer and exact shares import without treating names with amounts as new guests', () => {
  const row = spreadsheetExpense('Dinner', '100', 'Hero: 70.00; Guest: 30.00', 'Hero: 20.00; Guest: 80.00');
  const result = previewImport([row], pair(), () => 'id');
  assert.deepEqual(result.guests, []); assert.deepEqual(canon.splitShares(result.expenses[0], ['Hero', 'Guest']), { Hero: 20, Guest: 80 });
  assert.equal(spreadsheetExpense('Total', '100', '', ''), null);
});
test('Guest rename preserves financial references and does not mutate other campaigns or identities', () => {
  const b = pair(); b.expenses = [expense({ payers: { Hero: 70, Guest: 30 }, split: { mode: 'exact', weights: { Hero: 20, Guest: 80 } } })]; b.expenseTrash = [expense()];
  const out = editGuest(b, 'Guest', 'Friend', 'wizard', 'female');
  assert.deepEqual(canon.payerMap(out.expenses[0]), { Hero: 70, Friend: 30 }); assert.equal(canon.splitShares(out.expenses[0], out.participants).Friend, 80);
  assert.deepEqual(out.expenseTrash[0].sharedBy, ['Hero', 'Friend']); assert.equal(out.characterIds.Friend, undefined); assert.equal(b.participants[1], 'Guest');
  assert.throws(() => editGuest(b, 'Guest', 'Hero', 'wizard', 'female'));
});

test('imports are previewed, preserve split data and create only board-local Guests', () => {
  const board = fresh(); const preview = previewImport([expense({ split: { mode: 'exact', weights: { Hero: 20, Guest: 80 } }, characterIds: { Guest: '9999' } })], board, () => 'imported');
  assert.deepEqual(preview.guests, ['Guest']); assert.equal(board.participants.length, 1);
  const imported = applyImport(board, preview); assert.equal(imported.characterIds.Guest, undefined); assert.equal(imported.guestHeroes.Guest, true);
  assert.equal(imported.expenses[0].split.weights.Guest, 80); assert.equal(applyImport(imported, preview).expenses.length, 1);
});
test('imports reject malformed lines and negative or incomplete amounts as a whole', () => {
  assert.throws(() => textExpenses('good,20\nbad,-2', 'Hero', ['Hero']));
  assert.throws(() => previewImport([expense({ payers: { Hero: 100, Guest: -1 } })], pair(), () => 'id'));
  assert.throws(() => previewImport([expense({ date: '2026-02-31' })], pair(), () => 'id'));
});
test('edit comparison ignores Firestore map order, but catches changed financial values', () => {
  const a = expense({ payers: { Hero: 80, Guest: 20 } }); const b = { ...a, payers: { Guest: 20, Hero: 80 } };
  assert.equal(canon.tripContentKey(a), canon.tripContentKey(b));
  assert.notEqual(canon.tripContentKey(a), canon.tripContentKey({ ...b, amount: 200 }));
});

test('native uses the exact loaded web calculation object', () => assert.equal(canon, globalThis.PointyLogic));
test('new board links owner and own character without creating another ID', () => {
  const b = fresh(); assert.equal(ownsBoard(b, account), true); assert.equal(memberName(b, '1234'), 'Hero');
  assert.deepEqual(b.access.ownerUids, ['owner-a']); assert.deepEqual(b.access.memberUids, ['owner-a']); assert.equal(b.campaigns.length, 1);
});
test('repeat join is idempotent; duplicate display names remain legal', () => {
  const b = fresh(); assert.equal(addHero(b, hero, account.uid), b);
  const joined = addHero(b, { ...hero, id: '2222' }, 'owner-b');
  assert.deepEqual(joined.participants, ['Hero', 'Hero (2)']); assert.equal(joined.characterIds['Hero (2)'], '2222');
});
test('Guest never acquires a registry identity and duplicate names get local suffixes', () => {
  const b = addGuest(fresh(), 'Hero', 'wizard', 'female');
  assert.equal(b.guestHeroes['Hero (2)'], true); assert.equal(b.characterIds['Hero (2)'], undefined);
  assert.deepEqual(b.access.memberCharacterIds, ['1234']);
});
test('read/roundtrip preserves unknown board, admin and expense metadata', () => {
  const b = pair(); b.customVersion = { keep: true }; b.admin.external = 'keep'; b.expenses = [expense({ metadata: { keep: true } })];
  const out = withoutUndefined(readBoard(b)); assert.deepEqual(out.customVersion, { keep: true }); assert.equal(out.admin.external, 'keep'); assert.deepEqual(out.expenses[0].metadata, { keep: true });
});
test('invalid existing entries fail visibly instead of being dropped on save', () => {
  assert.throws(() => readBoard({ ...pair(), expenses: [expense({ amount: -1 })] }));
  const b = pair(); b.campaigns[0].expenses = [expense({ amount: -1 })];
  assert.throws(() => readBoard(b));
});
test('all five split modes conserve the entry amount', () => {
  const b = pair(); const cases = [
    [expense(), [50, 50]],
    [expense({ split: { mode: 'shares', weights: { Hero: 1, Guest: 3 } } }), [25, 75]],
    [expense({ split: { mode: 'exact', weights: { Hero: 20, Guest: 80 } } }), [20, 80]],
    [expense({ split: { mode: 'percent', weights: { Hero: 40, Guest: 60 } } }), [40, 60]],
    [expense({ split: { mode: 'items', items: [{ name: 'A', amount: 30, claimedBy: ['Hero'] }, { name: 'B', amount: 70, claimedBy: [] }] } }), [65, 35]],
  ];
  cases.forEach(([e, expected]) => { assert.doesNotThrow(() => validateExpense(e, b)); const split = canon.splitShares(e, b.participants); assert.deepEqual([split.Hero, split.Guest], expected); });
});
test('invalid exact/percent/multi-payer totals are rejected before writes', () => {
  const b = pair();
  for (const e of [expense({ payers: { Hero: 40, Guest: 20 } }), expense({ sharedBy: [] }), expense({ amount: NaN }), expense({ split: { mode: 'exact', weights: { Hero: 99 } } }), expense({ split: { mode: 'percent', weights: { Hero: 110 } } }), expense({ split: { mode: 'shares', weights: {} } })]) assert.throws(() => validateExpense(e, b));
});
test('multi-payer and exclusions use web obligations', () => {
  const b = pair(); const e = expense({ payers: { Hero: 80, Guest: 20 }, sharedBy: ['Guest'] }); validateExpense(e, b); b.expenses = [e];
  assert.deepEqual(canon.settleUp(canon.computeParty(b), b), [{ from: 'Guest', to: 'Hero', amount: 80 }]);
});
test('locked Pointy/PP/PPP regression keeps pairwise obligations', () => {
  const b = readBoard({ participants: ['Pointy', 'PP', 'PPP'], expenses: [
    { ...expense(), id: 1, amount: 1000, paidBy: 'PP', sharedBy: ['Pointy', 'PP', 'PPP'] },
    { ...expense(), id: 2, amount: 2000, paidBy: 'Pointy', sharedBy: ['Pointy', 'PP', 'PPP'] },
    { ...expense(), id: 3, amount: 1000, paidBy: 'Pointy', sharedBy: ['Pointy', 'PP', 'PPP'] },
  ] });
  assert.deepEqual(canon.settleUp(canon.computeParty(b), b), [{ from: 'PPP', to: 'Pointy', amount: 1000 }, { from: 'PPP', to: 'PP', amount: 333.33 }, { from: 'PP', to: 'Pointy', amount: 666.67 }]);
});
test('campaign snapshot keeps guest maps and original creation/completion timestamps', () => {
  const b = pair(); b.campaigns[0].completedAt = 1500; b.expenses = [expense()];
  const updated = syncCampaign(b, 2000); assert.equal(updated.campaigns[0].createdAt, 1000); assert.equal(updated.campaigns[0].completedAt, 1500); assert.equal(updated.campaigns[0].guestHeroes.Guest, true);
});
test('campaign switches isolate trash and payments, including older snapshots without those fields', () => {
  const b = pair(); b.expenseTrash = [expense()]; b.removedMembers = ['Earlier Guest'];
  b.settlementRecords = [{ from: 'Guest', to: 'Hero', amount: 50, revision: 'r', at: 1000 }];
  b.campaigns.push({ ...b.campaigns[0], id: 'legacy', tripName: 'Legacy' });
  const next = switchCampaign(b, 'legacy', 2000);
  assert.deepEqual(next.expenseTrash, []); assert.deepEqual(next.settlementRecords, []); assert.deepEqual(next.removedMembers, []);
  const restored = switchCampaign(next, b.activeCampaignId, 3000);
  assert.deepEqual(restored.expenseTrash, b.expenseTrash); assert.deepEqual(restored.settlementRecords, b.settlementRecords); assert.deepEqual(restored.removedMembers, b.removedMembers);
});
test('accept invite validates identity, status and expiry before joining', () => {
  const invite = { targetOwnerUid: 'owner-a', targetCharacterId: '1234', status: 'pending', expiresAt: 3000 };
  assert.doesNotThrow(() => acceptInvite(fresh(), invite, account, hero, 2000));
  for (const patch of [{ targetOwnerUid: 'other' }, { targetCharacterId: '9999' }, { status: 'declined' }, { expiresAt: 1000 }]) assert.throws(() => acceptInvite(fresh(), { ...invite, ...patch }, account, hero, 2000));
});
test('Firestore serialization omits undefined but preserves timestamp instances', () => {
  class Timestamp { constructor() { this.seconds = 1; } }
  const ts = new Timestamp(); const out = withoutUndefined({ value: undefined, timestamp: ts, nested: [{ key: undefined, ok: 0 }] });
  assert.equal(out.timestamp, ts); assert.deepEqual(out.nested, [{ ok: 0 }]); assert.equal(Object.hasOwn(out, 'value'), false);
});
