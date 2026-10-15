import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import { canon } from '../src/domain/canon.ts';
import { buildPublicProfile, profileTarget, publicCharacterId } from '../src/character/public-profile-contracts.ts';

const record = { id: '8602', name: 'มิตรสหาย QA', class: 'ranger', gender: 'female', skin: '', xp: 39, trips: { party: 39 }, debtXp: 0,
  ownerUid: 'other-owner', username: 'private-name', email: 'private@example.com', recoveryHash: 'not-for-profile', accountName: 'private-account' };
const board = { id: 'party', data: canon.normalizeTripState({ tripName: 'QA party', participants: [record.name, 'Guest'], characterIds: { [record.name]: record.id },
  expenses: [{ id: 'web', desc: 'Web QA', amount: 1560, paidBy: record.name, sharedBy: [record.name, 'Guest'] }] }) };

test('public profile routing accepts exactly four digits and preserves the owner route', () => {
  assert.deepEqual(profileTarget(undefined, '8601'), { kind: 'own' });
  assert.deepEqual(profileTarget('8601', '8601'), { kind: 'own' });
  assert.deepEqual(profileTarget('8602', '8601'), { kind: 'public', id: '8602' });
  for (const value of ['', '123', '12345', '8602\n', ' 8602', 'abcd', ['8602'], '../../users']) {
    assert.equal(profileTarget(value, '8601').kind, 'invalid');
    assert.throws(() => publicCharacterId(value));
  }
});

test('public profile matches shared web XP and ledger totals without retaining private metadata', () => {
  const result = buildPublicProfile(record.id, record, [board]);
  const web = canon.buildCharacterProfile(record.id, [board], record);
  assert.equal(result.hero.xp, web.xp);
  assert.deepEqual(result.profile.totals, web.totals);
  assert.equal(result.profile.totals.fronted, 780);
  assert.equal(result.profile.totals.frontedXp, 39);
  const serialized = JSON.stringify(result);
  for (const value of ['other-owner', 'private-name', 'private@example.com', 'not-for-profile', 'private-account']) assert.equal(serialized.includes(value), false);
  assert.throws(() => buildPublicProfile(record.id, undefined, [board]), /ไม่พบตัวละคร/);
  assert.throws(() => buildPublicProfile(record.id, { ...record, id: '1111' }, [board]), /ไม่พบตัวละคร/);
});

function serviceRuntime({ uid = 'viewer', duringCharacterRead } = {}) {
  const calls = [], auth = { currentUser: uid ? { uid } : null };
  const firestore = {
    doc: (_db, collection, id) => `${collection}/${id}`, collection: (_db, name) => name,
    getDocFromServer: async path => { calls.push(['get', path]); duringCharacterRead?.(auth); return { exists: () => true, data: () => record }; },
    getDocsFromServer: async path => { calls.push(['list', path]); return { docs: [{ id: board.id, data: () => board.data }] }; },
  };
  const dependencies = { 'firebase/firestore': firestore, '../auth/firebase': { auth, db: {} }, '../domain/canon': { canon }, './public-profile-contracts': { buildPublicProfile, publicCharacterId } };
  const source = readFileSync(new URL('../src/character/public-profile-service.ts', import.meta.url), 'utf8');
  const script = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function('require', 'exports', script)(name => { assert.ok(name in dependencies, `Unexpected service dependency ${name}`); return dependencies[name]; }, exports);
  return { calls, load: exports.loadPublicProfile };
}

test('public service reads only the character and shared boards, with no private reads or XP writes', async () => {
  const runtime = serviceRuntime();
  assert.equal((await runtime.load('8602', 'viewer')).hero.id, '8602');
  assert.deepEqual(runtime.calls, [['get', 'characters/8602'], ['list', 'trips']]);
});

test('signed-out, malformed and switched-session requests fail before exposing another profile', async () => {
  const signedOut = serviceRuntime({ uid: null });
  await assert.rejects(signedOut.load('8602', 'viewer'), /เข้าสู่ระบบ/); assert.deepEqual(signedOut.calls, []);
  const malformed = serviceRuntime();
  await assert.rejects(malformed.load('8602\n', 'viewer'), /4 หลัก/); assert.deepEqual(malformed.calls, []);
  const switched = serviceRuntime({ duringCharacterRead: auth => { auth.currentUser = { uid: 'different-viewer' }; } });
  await assert.rejects(switched.load('8602', 'viewer'), /เข้าสู่ระบบ/); assert.deepEqual(switched.calls, [['get', 'characters/8602']]);
});
