import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import '../../shared/pointy-logic.js';

function backup() {
  const store = new Map([['pointy_auth_v1', '{"uid":"qa"}'], ['pointy_admin_owner_token_v1', 'secret'], ['lang', 'th'], ['pointy_compare_v2::uid_qa', '[]'], ['pointy_compare_v2::uid_other', '[]']]);
  const window = { PointyScope: { readAuth: () => ({ uid: 'qa' }), key: key => `${key}::uid_qa` } };
  vm.runInNewContext(fs.readFileSync(new URL('../../shared/profile-backup.js', import.meta.url), 'utf8'), { window, PointyLogic: globalThis.PointyLogic, localStorage: { get length() { return store.size; }, key: n => [...store.keys()][n], getItem: k => store.get(k) } });
  return window.PointyProfileBackup;
}
test('backup export excludes credentials and all other accounts; legacy restore cannot replace identity', () => {
  const api = backup(); assert.deepEqual(Object.keys(api.collect()).sort(), ['lang', 'pointy_compare_v2::uid_qa']);
  const data = { __coin_quest_backup: 1, keys: { pointy_auth_v1: '{"uid":"qa"}', pointy_admin_owner_token_v1: 'injected', 'pointy_compare_v2::uid_qa': '[]' } };
  assert.deepEqual(Object.keys(api.validateBackup(data)), ['pointy_compare_v2::uid_qa']);
  assert.throws(() => api.validateBackup({ ...data, uid: 'other' }));
  assert.throws(() => api.validateBackup({ ...data, keys: { arbitrary: 'value' } }));
});
test('invalid imported finance cannot be partially restored', () => {
  const api = backup();
  const value = { month: '2026-10', income: 100, categories: [{ id: 'c', budget: 100 }], bills: [{ id: 'b', amount: 10, dueDay: 32, catId: 'c' }], expenses: [] };
  const data = { __coin_quest_backup: 2, uid: 'qa', keys: { lang: 'th', 'pointy_treasury_v1::uid_qa': JSON.stringify(value) } };
  assert.throws(() => api.validateBackup(data));
  value.bills[0].dueDay = 31; data.keys['pointy_treasury_v1::uid_qa'] = JSON.stringify(value);
  assert.equal(Object.keys(api.validateBackup(data)).length, 2);
});
