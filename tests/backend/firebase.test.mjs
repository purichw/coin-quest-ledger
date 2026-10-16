import assert from 'node:assert/strict';
import { before, beforeEach, after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, runTransaction, deleteField, getDocs, collection, query, where, writeBatch } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { resetAccountWithPassword, recoveryHashFor } from '../../api/account-recovery-core.js';
import { takeRecoveryAttempt } from '../../api/recovery-rate-limit.js';
import { cleanTripReferences, commitOps, lockAccountForDeletion } from '../../api/admin-delete-user.js';
import '../../shared/pointy-logic.js';

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Run npm run test:backend; production must never be used.');
const projectId = 'demo-coin-quest';
let env, app, admin, auth, count = 0;
const browser = { PointyLogic: globalThis.PointyLogic };
new Function('window', await readFile(new URL('../../shared/profile-auth.js', import.meta.url), 'utf8'))(browser);
new Function('window', await readFile(new URL('../../shared/board-invites.js', import.meta.url), 'utf8'))(browser);
new Function('window', await readFile(new URL('../../admin/admin-utils.js', import.meta.url), 'utf8'))(browser);
function compat(db, afterRead = async () => {}) {
  const wrap = path => ({ path, ref: doc(db, path), collection: name => collection(`${path}/${name}`) });
  const collection = path => ({ doc: id => wrap(`${path}/${id}`) });
  return { collection, runTransaction: action => runTransaction(db, tx => action({
    async get(ref) { const snap = await tx.get(ref.ref); await afterRead(ref.path); return { exists: snap.exists(), data: () => snap.data() }; },
    set(ref, data, options) { options ? tx.set(ref.ref, data, options) : tx.set(ref.ref, data); },
    update(ref, data) { tx.update(ref.ref, data); },
    delete(ref) { tx.delete(ref.ref); }
  })) };
}
before(async () => {
  env = await initializeTestEnvironment({ projectId, firestore: { rules: await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8') } });
  app = initializeApp({ projectId }); admin = getFirestore(app); auth = getAuth(app);
});
beforeEach(async () => { await env.clearFirestore(); });
after(async () => { await env.cleanup(); await deleteApp(app); });
const player = uid => env.authenticatedContext(uid).firestore();
async function seed(overrides = {}) {
  const uid = `hero-${++count}`, username = `hero${count}`, userId = '1234';
  const hash = recoveryHashFor(username, 'ABCD-EFGH-JK2M');
  const user = { uid, username, userId, name: 'Hero', status: 'active', lifecycleStatus: 'active', characterId: '5678', character: { id: '5678', name: 'Hero' }, recoveryHash: hash, ...overrides };
  await admin.doc(`users/${uid}`).set(user);
  await admin.doc(`usernames/${username}`).set({ uid, username, userId, characterId: '5678', authEmail: `${username}@coinquest.local`, status: 'active' });
  await admin.doc('userIds/1234').set({ uid, userId, characterId: '5678' });
  await admin.doc('characters/5678').set({ id: '5678', name: 'Hero', ownerUid: uid });
  await admin.doc(`playerModules/${uid}`).set({ uid, characterId: '5678', debt: { dragons: [], oldMap: { deleted: true } }, treasury: { balance: 42 } });
  return { uid, username, hash, user, db: player(uid) };
}
const reset = (s, extra = {}) => resetAccountWithPassword({ db: admin, auth, username: s.username, password: 'fixture-password-NEW', expectedRecoveryHash: s.hash, ...extra });

test('owner module replacement removes deleted map keys and preserves the other module', async () => {
  const s = await seed(), ref = doc(s.db, 'playerModules', s.uid);
  await assertSucceeds(runTransaction(s.db, async tx => {
    await tx.get(ref);
    tx.set(ref, { uid: s.uid, characterId: '5678', debt: { dragons: [] } }, { mergeFields: ['uid', 'characterId', 'debt'] });
  }));
  const data = (await getDoc(ref)).data();
  assert.deepEqual(data.debt, { dragons: [] }); assert.equal(data.treasury.balance, 42);
  await assertFails(getDoc(doc(player('intruder'), 'playerModules', s.uid)));
});

test('financial interest and Treasury reward ledgers survive an authorized module round trip', async () => {
  const s = await seed(), ref = doc(s.db, 'playerModules', s.uid);
  const L = globalThis.PointyLogic;
  const at = L.dateOnlyMs('2026-01-01');
  const accrued = L.accrueDebtToDate({ id: 'audit', original: 1000, balance: 1000, unpaidInterest: 0, apr: 36.5, interestMode: 'reducing', createdAt: at, interestAccruedAt: at, log: [] }, '2026-01-11').debt;
  const payment = L.applyDebtPayment(accrued, 5, '2026-01-11');
  const debt = { dragons: [payment.debt], stats: { interest: 10 } };
  const treasury = L.treasuryClose({ month: '2026-01', income: 100, expenses: [{ amount: .1, date: '2026-01-01' }, { amount: .2, date: '2026-01-01' }], history: [], stats: {} }, '2026-02');
  await assertSucceeds(updateDoc(ref, L.cleanFirestoreData({ debt, treasury })));
  const saved = (await getDoc(ref)).data();
  assert.equal(saved.debt.dragons[0].unpaidInterest, 5);
  assert.equal(L.normalizeDebtState(saved.debt).dragons[0].interestMode, 'reducing');
  assert.equal(L.dailyInterest(saved.debt.dragons[0], '2026-01-11', '2026-01-21'), 10);
  assert.equal(L.applyDebtPayment(saved.debt.dragons[0], 10, '2026-01-11').principalPaid, 5);
  assert.deepEqual(saved.treasury.stats.loggedDays, ['2026-01-01']);
  assert.equal(L.treasuryXp(saved.treasury), 510);
});

test('blocked lifecycle cannot be hidden by active status or reset by the owner', async () => {
  const s = await seed({ lifecycleStatus: 'archived' });
  await assertFails(updateDoc(doc(s.db, 'users', s.uid), { lifecycleStatus: 'active' }));
  await assertFails(setDoc(doc(s.db, 'playerModules', s.uid), { uid: s.uid, debt: {} }));
  await assertFails(setDoc(doc(s.db, 'trips', 'blocked'), { tripName: 'Forbidden' }));
});

test('player cannot change identity, claim another character, or add a reset lock', async () => {
  const s = await seed(); const ref = doc(s.db, 'users', s.uid);
  await assertFails(updateDoc(ref, { userId: '9999' }));
  await assertFails(updateDoc(ref, { username: 'another' }));
  await assertFails(updateDoc(ref, { recoveryReset: { id: 'fake', expiresAt: 0 } }));
  await admin.doc('characters/9999').set({ ownerUid: 'other' });
  await assertFails(updateDoc(ref, { characterId: '9999' }));
  await assertSucceeds(updateDoc(ref, { name: 'New name' }));
});

test('recovery lease rejects a concurrent client key rotation', async () => {
  const s = await seed({ recoveryReset: { id: 'operation', expiresAt: Date.now() + 60_000 } });
  await assertFails(updateDoc(doc(s.db, 'users', s.uid), { recoveryHash: 'c'.repeat(64) }));
});

test('invite responses cannot rewrite payload, replay, or accept an expired invitation', async () => {
  const s = await seed(); const path = `users/${s.uid}/boardInvites/one`;
  await admin.doc(path).set({ tripId: 'board', targetOwnerUid: s.uid, targetCharacterId: '5678', status: 'pending', expiresAt: Date.now() + 60_000 });
  const ref = doc(s.db, path);
  await assertFails(updateDoc(ref, { status: 'accepted', tripId: 'another' }));
  await assertSucceeds(updateDoc(ref, { status: 'accepted', respondedAt: Date.now() }));
  await assertFails(updateDoc(ref, { status: 'declined', respondedAt: Date.now() }));
  await admin.doc(path).update({ status: 'pending', expiresAt: Date.now() - 1 });
  await assertFails(updateDoc(ref, { status: 'accepted', respondedAt: Date.now() }));
});

test('recovery recreates missing Auth under the same UID, preserving modules and invites', async () => {
  const s = await seed();
  await admin.doc(`users/${s.uid}/boardInvites/preserved`).set({ status: 'pending' });
  const result = await reset(s);
  assert.equal(result.uid, s.uid); assert.equal(result.authAction, 'created');
  assert.equal((await auth.getUser(s.uid)).uid, s.uid);
  assert.equal((await admin.doc(`playerModules/${s.uid}`).get()).data().treasury.balance, 42);
  assert.equal((await admin.doc(`users/${s.uid}/boardInvites/preserved`).get()).exists, true);
  assert.equal((await admin.doc(`users/${s.uid}`).get()).data().recoveryHash, recoveryHashFor(s.username, result.recoveryCode));
  await assert.rejects(reset(s), /bad-recovery-code/);
});

test('recovery refuses missing, blocked and conflicting identity records before Auth changes', async () => {
  let calls = 0; const noAuth = { updateUser() { calls++; }, createUser() { calls++; } };
  await assert.rejects(resetAccountWithPassword({ db: admin, auth: noAuth, username: 'absent', password: 'fixture-password', actor: 'admin' }), /does not exist/);
  const s = await seed({ lifecycleStatus: 'deactivated' });
  await assert.rejects(reset(s, { auth: noAuth }), /not active/);
  await assert.rejects(reset(s, { auth: noAuth, actor: 'admin' }), /not active/);
  await admin.doc(`users/${s.uid}`).update({ lifecycleStatus: 'active' });
  await admin.doc('userIds/1234').update({ uid: 'someone-else' });
  await assert.rejects(reset(s, { auth: noAuth }), /another account/);
  assert.equal(calls, 0);
});

test('parallel recovery is serialized and failure releases the lease without consuming the code', async () => {
  const s = await seed(); let entered, release;
  const started = new Promise(resolve => { entered = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  const controlled = { async getUser() { return { disabled: false }; }, async updateUser() { entered(); await gate; throw new Error('simulated Auth outage'); } };
  const first = reset(s, { auth: controlled });
  const rejected = assert.rejects(first, /simulated Auth outage/);
  await started;
  await assert.rejects(reset(s), /already in progress/);
  release(); await rejected;
  const latest = (await admin.doc(`users/${s.uid}`).get()).data();
  assert.equal(latest.recoveryReset, undefined); assert.equal(latest.recoveryHash, s.hash);
  await reset(s);
});

test('recovery limiter counts across callers, expires, and is not writable by players', async () => {
  const s = await seed(); const now = Date.now();
  for (let i = 0; i < 8; i++) assert.equal(await takeRecoveryAttempt(admin, 'fixture-ip', s.username, now), true);
  assert.equal(await takeRecoveryAttempt(admin, 'fixture-ip', s.username, now), false);
  assert.equal(await takeRecoveryAttempt(admin, 'fixture-ip', s.username, now + 900_001), true);
  await assertFails(setDoc(doc(s.db, 'accountRecoveryLimits', 'forged'), { count: 0 }));
});

test('web signup reserves profile, username and User ID atomically; collisions leave no profile', async () => {
  const account = { uid: 'signup-web', username: 'signup.web', userId: '4321', email: 'signup.web@coinquest.local', name: 'Signup' };
  await browser.PointyAuthCore.persistAccount({ db: compat(player(account.uid)), account, extra: { recoveryHash: 'a'.repeat(64), recoveryIssuedAt: 1 }, timestamp: 1, deleteField: deleteField() });
  assert.equal((await admin.doc('userIds/4321').get()).data().uid, account.uid);
  const other = { ...account, uid: 'another', username: 'another' };
  await assert.rejects(browser.PointyAuthCore.persistAccount({ db: compat(player(other.uid)), account: other, timestamp: 2 }), /id-unavailable/);
  assert.equal((await admin.doc('users/another').get()).exists, false);
  await assertFails(setDoc(doc(player(account.uid), 'userIds', '9999'), { uid: account.uid, userId: '9999' }));
});

test('web recovery key rotation preserves character and name changed on another device', async () => {
  const s = await seed(); const account = { ...s.user, name: 'Stale name', character: null, characterId: '' };
  await browser.PointyAuthCore.persistAccount({ db: compat(s.db), account, extra: { recoveryHash: 'b'.repeat(64), recoveryIssuedAt: 2 }, timestamp: 2, deleteField: deleteField() });
  const data = (await admin.doc(`users/${s.uid}`).get()).data();
  assert.equal(data.name, 'Hero'); assert.equal(data.characterId, '5678'); assert.equal(data.recoveryHash, 'b'.repeat(64));
});

test('web invitation acceptance retries a concurrent board write without losing it', async () => {
  const s = await seed(); const path = `users/${s.uid}/boardInvites/atomic`;
  await admin.doc(path).set({ tripId: 'board', targetOwnerUid: s.uid, targetCharacterId: '5678', status: 'pending', expiresAt: Date.now() + 60_000 });
  await admin.doc('trips/board').set({ participants: [], expenses: [] });
  let changed = false;
  const db = compat(s.db, async path => { if (path === 'trips/board' && !changed) { changed = true; await admin.doc(path).update({ expenses: [{ id: 'concurrent-expense', amount: 100 }] }); } });
  await browser.PointyBoardInvites.respond({ db, account: s.user, inviteId: 'atomic', status: 'accepted', mutateBoard(data, invite, account) { return { ...data, participants: [account.character.name] }; } });
  const board = (await admin.doc('trips/board').get()).data();
  assert.equal(board.expenses[0].id, 'concurrent-expense'); assert.deepEqual(board.participants, ['Hero']);
  assert.equal((await admin.doc(path).get()).data().status, 'accepted');
  await assert.rejects(browser.PointyBoardInvites.respond({ db, account: s.user, inviteId: 'atomic', status: 'declined' }), /no-longer-pending/);
});

test('Admin publish rejects stale drafts and URL collisions; only changed boards are written', async () => {
  const db = compat(env.authenticatedContext('admin', { email: 'purich.wc@gmail.com', email_verified: true }).firestore());
  const first = { tripName: 'Original', expenses: [] }, other = { tripName: 'Untouched', expenses: [{ amount: 10 }] };
  await admin.doc('trips/first').set(first); await admin.doc('trips/other').set(other);
  const op = { from: 'first', to: 'first', baseline: browser.PointyLogic.tripContentKey(first), data: { ...first, tripName: 'Edited' } };
  await admin.doc('trips/first').update({ expenses: [{ amount: 20 }] });
  await assert.rejects(browser.CoinQuestAdminUtils.publishBoards({ db, operations: [op], revisionId: 'stale', revision: {} }), /เปลี่ยนจากอีกเครื่อง/);
  assert.equal((await admin.doc('adminRevisions/stale').get()).exists, false);
  const latest = (await admin.doc('trips/first').get()).data();
  op.baseline = browser.PointyLogic.tripContentKey(latest); op.data = { ...latest, tripName: 'Edited' };
  await assert.rejects(browser.CoinQuestAdminUtils.publishBoards({ db, operations: [{ ...op, to: 'other' }], revisionId: 'collision', revision: {} }), /มีอยู่แล้ว/);
  await browser.CoinQuestAdminUtils.publishBoards({ db, operations: [op], revisionId: 'saved', revision: { action: 'edited' } });
  assert.deepEqual((await admin.doc('trips/other').get()).data(), other);
  assert.equal((await admin.doc('trips/first').get()).data().expenses[0].amount, 20);
});

test('Admin lifecycle applies to all identity records and reactivation clears both status fields', async () => {
  const s = await seed();
  const db = compat(env.authenticatedContext('admin', { email: 'purich.wc@gmail.com', email_verified: true }).firestore());
  for (const status of ['archived', 'active']) {
    await browser.CoinQuestAdminUtils.setAccountLifecycle({ db, uid: s.uid, userId: '1234', patch: { status }, timestamp: 1 });
    for (const path of [`users/${s.uid}`, `usernames/${s.username}`, 'userIds/1234']) {
      const data = (await admin.doc(path).get()).data(); assert.equal(data.status, status); assert.equal(data.lifecycleStatus, status);
    }
  }
});

test('account deletion rejects mismatched pointers and protects a pending recovery', async () => {
  const s = await seed(); const target = { uid: s.uid, username: s.username, userId: '1234', characterIds: ['5678'] };
  await assert.rejects(lockAccountForDeletion(admin, { ...target, username: 'another' }), /identity changed/);
  await admin.doc(`users/${s.uid}`).update({ recoveryReset: { id: 'recovery', expiresAt: Date.now() + 60_000 } });
  await assert.rejects(lockAccountForDeletion(admin, target), /recovery is in progress/);
  await admin.doc(`users/${s.uid}`).update({ recoveryReset: { expiresAt: 0 } });
  await lockAccountForDeletion(admin, target);
  assert.equal((await admin.doc(`users/${s.uid}`).get()).data().lifecycleStatus, 'delete_requested');
  await assertFails(updateDoc(doc(s.db, 'playerModules', s.uid), { debt: {} }));
});

test('legacy cleanup reads again before writing so concurrent expenses survive', async () => {
  await admin.doc('trips/cleanup').set({ participants: ['Old', 'Keep'], characterIds: { Old: '1111', Keep: '2222' }, expenses: [] });
  const plan = await cleanTripReferences(admin, { targetIds: ['1111'], targetNames: ['Old'] });
  await admin.doc('trips/cleanup').update({ expenses: [{ id: 'new', amount: 12, paidBy: 'Keep', sharedBy: ['Keep'] }] });
  await commitOps(admin, plan.ops);
  const data = (await admin.doc('trips/cleanup').get()).data();
  assert.deepEqual(data.participants, ['Keep']); assert.equal(data.expenses[0].id, 'new');
});

test('deleting a real account preserves every shared expense and settlement obligation', async () => {
  const board = { participants: ['Deleted', 'Other'], characterIds: { Deleted: '1234', Other: '5678' },
    access: { ownerUids: ['deleted-uid'], memberUids: ['deleted-uid', 'other'], memberCharacterIds: ['1234', '5678'] },
    expenses: [{ id: 'meal', amount: 100, paidBy: 'Deleted', sharedBy: ['Deleted', 'Other'] }] };
  const before = browser.PointyLogic.settleUp(browser.PointyLogic.computeParty(board), board);
  await admin.doc('trips/history').set(board);
  const plan = await cleanTripReferences(admin, { uid: 'deleted-uid', targetIds: ['1234'] }, { status: 'account_deleted_cleaned' });
  await commitOps(admin, plan.ops);
  const saved = (await admin.doc('trips/history').get()).data();
  assert.deepEqual(saved.expenses, board.expenses); assert.deepEqual(saved.participants, board.participants);
  assert.equal(saved.guestHeroes.Deleted, true); assert.equal(saved.characterIds.Deleted, undefined);
  assert.deepEqual(saved.access.memberUids, ['other']);
  assert.deepEqual(browser.PointyLogic.settleUp(browser.PointyLogic.computeParty(saved), saved), before);
});

test('three-player ledger round trip preserves satang, confirmed transfers and XP under duplicate transactions', async () => {
  const L = browser.PointyLogic;
  const ids = ['ledger-a','ledger-b','ledger-c'];
  for (const [i,uid] of ids.entries()) await admin.doc(`users/${uid}`).set({ uid, userId:String(7101+i), username:uid, status:'active', characterId:String(7101+i) });
  const state = L.normalizeTripState({ tripName:'Emulator financial audit', participants:['A','B','C'],
    characterIds:{A:'7101',B:'7102',C:'7103'}, access:{ownerUids:[ids[0]],memberUids:ids,memberCharacterIds:['7101','7102','7103']},
    custom:{preserve:true}, expenses:[{id:'dinner',desc:'Dinner',amount:900,paidBy:'A',payers:{A:600,B:300},sharedBy:['A','B','C']}] });
  await admin.doc('trips/ledger-roundtrip').set(L.cleanFirestoreData(state));
  const confirm = (uid,from,to) => {
    const db=player(uid), ref=doc(db,'trips','ledger-roundtrip');
    return runTransaction(db,async tx=>{
      const current=(await tx.get(ref)).data();
      tx.set(ref,L.cleanFirestoreData(L.confirmSettlement(current,from,to,1000)));
    });
  };
  await Promise.all([confirm(ids[2],'C','A'),confirm(ids[2],'C','A')]);
  let saved=(await getDoc(doc(player(ids[1]),'trips','ledger-roundtrip'))).data();
  assert.equal(saved.settlementRecords.length,1);
  assert.deepEqual(saved.settleXp,{C:180,A:120});
  assert.deepEqual(L.pendingSettlements(saved).sort((a,b)=>a.from.localeCompare(b.from)),[{from:'B',to:'A',amount:100},{from:'C',to:'B',amount:100}]);
  await confirm(ids[1],'B','A'); await confirm(ids[2],'C','B');
  saved=(await getDoc(doc(player(ids[0]),'trips','ledger-roundtrip'))).data();
  assert.deepEqual(saved.custom,{preserve:true});
  assert.deepEqual(saved.settleXp,{A:240,B:300,C:360});
  assert.equal(L.pendingSettlements(L.normalizeTripState(saved)).length,0);
  assert.deepEqual(L.computeParty(saved).map(hero=>hero.xp),[255,300,360]);
  // Editing the original bill does not undo real money already repaid.
  const db=player(ids[0]), ref=doc(db,'trips','ledger-roundtrip');
  await runTransaction(db,async tx=>{
    const current=(await tx.get(ref)).data();
    tx.set(ref,L.cleanFirestoreData({...current,expenses:[]}));
  });
  saved=(await getDoc(ref)).data();
  assert.deepEqual(L.pendingSettlements(saved),[{from:'A',to:'C',amount:200},{from:'A',to:'B',amount:100},{from:'B',to:'C',amount:100}]);
  await Promise.all([confirm(ids[0],'A','C'),confirm(ids[0],'A','C')]);
  await confirm(ids[0],'A','B'); await confirm(ids[1],'B','C');
  saved=(await getDoc(ref)).data();
  assert.equal(saved.settlementRecords.length,6);
  assert.deepEqual(saved.settleXp,{A:240,B:300,C:360});
  assert.equal(L.pendingSettlements(saved).length,0);
});

test('character creation must link the user atomically; a second character cannot be minted', async () => {
  const s = await seed({ character: null, characterId: '' });
  await assertFails(setDoc(doc(s.db, 'characters', '4444'), { id: '4444', ownerUid: s.uid }));
  const batch = writeBatch(s.db);
  batch.set(doc(s.db, 'characters', '1234'), { id: '1234', ownerUid: s.uid });
  batch.update(doc(s.db, 'users', s.uid), { character: { id: '1234' }, characterId: '1234' });
  await assertSucceeds(batch.commit());
  const second = writeBatch(s.db);
  second.set(doc(s.db, 'characters', '5555'), { id: '5555', ownerUid: s.uid });
  second.update(doc(s.db, 'users', s.uid), { character: { id: '5555' }, characterId: '5555' });
  await assertFails(second.commit());
});

test('Admin can list username tombstones while players cannot enumerate accounts', async () => {
  const s = await seed();
  const adminDb = env.authenticatedContext('admin', { email: 'purich.wc@gmail.com', email_verified: true }).firestore();
  await assertSucceeds(getDocs(query(collection(adminDb, 'usernames'), where('deleteReusable', '==', true))));
  await assertFails(getDocs(collection(s.db, 'usernames')));
});

test('a deleted UID cannot reclaim its own tombstones with a stale ID token', async () => {
  const uid = 'deleted-uid', userId = '3333', username = 'deleted.hero';
  const tombstone = { uid: '', previousUid: uid, userId, username, status: 'deleted', lifecycleStatus: 'deleted', deleteReusable: true };
  await admin.doc(`usernames/${username}`).set(tombstone); await admin.doc(`userIds/${userId}`).set(tombstone);
  const account = { uid, userId, username, email: `${username}@coinquest.local`, name: 'Stale session' };
  await assert.rejects(browser.PointyAuthCore.persistAccount({ db: compat(player(uid)), account, timestamp: 1 }));
  await browser.PointyAuthCore.persistAccount({ db: compat(player('fresh-uid')), account: { ...account, uid: 'fresh-uid' }, timestamp: 1 });
  assert.equal((await admin.doc(`usernames/${username}`).get()).data().uid, 'fresh-uid');
});

test('recovery cannot reactivate an Auth-disabled account even when its profile says active', async () => {
  const s = await seed();
  await auth.createUser({ uid: s.uid, email: `${s.username}@coinquest.local`, password: 'fixture-password', disabled: true });
  await assert.rejects(reset(s), /not active/);
  assert.equal((await auth.getUser(s.uid)).disabled, true);
  assert.equal((await admin.doc(`users/${s.uid}`).get()).data().recoveryHash, s.hash);
});
