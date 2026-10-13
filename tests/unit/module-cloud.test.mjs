import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../../shared/module-cloud.js', import.meta.url), 'utf8');
const logic = readFileSync(new URL('../../shared/pointy-logic.js', import.meta.url), 'utf8');
const flush = async () => { for (let i = 0; i < 12; i++) await new Promise(resolve => setImmediate(resolve)); };
function harness(local, remote, meta, readError) {
  let uid = 'qa', cloud = remote, localValue = local, applied, panel, beforeRead, beforeFreshRead; const writes = [], backups = new Map(), stored = new Map(), listeners = {};
  class Element { children = []; textContent = ''; disabled = false; append(el) { this.children.push(el); } replaceChildren() { this.children = []; } setAttribute() {} remove() { if (panel === this) panel = undefined; } insertAdjacentElement(_, el) { panel = el; } }
  const account = { uid, characterId: '1234' }; const key = value => ctx.PointyLogic.tripContentKey({ value: value ?? null });
  const ctx = vm.createContext({ URLSearchParams, location: { search: '' }, setTimeout, console, confirm: () => true, CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } }, document: { createElement: () => new Element(), querySelector: () => new Element(), body: new Element() }, localStorage: { setItem: (k, v) => backups.set(k, v), getItem: k => backups.get(k) } }); ctx.window = ctx;
  ctx.addEventListener = (type, fn) => { listeners[type] = fn; }; ctx.dispatchEvent = event => listeners[event.type]?.(event);
  ctx.PointyScope = { readAuth: () => account, accountKey: a => a.uid, key: k => `qa:${k}`, getJSON: (k, fallback) => k === 'state' ? localValue : stored.get(k) ?? fallback, setJSON: (k, value) => { if (k === 'state') localValue = value; else stored.set(k, value); } };
  const db = { collection: collection => ({ doc: id => ({ collection, id }) }), runTransaction: async action => { const pending = []; await action({ get: async ref => { if (ref.collection === 'users') return { exists: true, data: () => ({ status: 'active' }) }; if (beforeRead) { const fn = beforeRead; beforeRead = null; await fn(); } return { data: () => ({ debt: cloud }) }; }, set: (ref, value) => pending.push(value) }); pending.forEach(value => { cloud = value.debt; writes.push(value); }); } };
  ctx.PointyFirebase = { auth: () => ({ currentUser: uid ? { uid } : null }), firestore: () => db, freshGet: async () => { if (readError) { const error = readError; readError = null; throw error; } const value = cloud; if (beforeFreshRead) { const fn = beforeFreshRead; beforeFreshRead = null; await fn(); } return { data: () => ({ debt: value }) }; }, serverTimestamp: () => 123 };
  vm.runInContext(logic, ctx); if (meta) stored.set('pointy_module_sync_v1', { debt: { cloud: key(remote), local: key(local) } });
  vm.runInContext(source, ctx);
  const connect = () => ctx.PointyModuleCloud.register({ key: 'state', field: 'debt', empty: () => ({ dragons: [] }), apply: value => { applied = value; } }); connect();
  return { get cloud() { return cloud; }, set cloud(value) { cloud = value; }, get local() { return localValue; }, get applied() { return applied; }, writes, backups, stored, connect, get status() { return panel?.children[0]?.textContent || ''; }, get hasNotice() { return !!panel; }, choose: title => panel.children.find(el => el.textContent === title).onclick(), edit: value => { localValue = value; listeners['pointy-scoped-data-changed']({ detail: { base: 'state', value, accountKey: 'qa' } }); }, onRead: fn => { beforeRead = fn; }, onFreshRead: fn => { beforeFreshRead = fn; }, signOut: () => { uid = ''; listeners['pointy-auth-changed']({ detail: { signedIn: false } }); } };
}
test('first connection loads existing owner cloud data without creating demo records', async () => { const h = harness(null, { dragons: [{ id: 'real' }] }); await flush(); assert.equal(h.applied.dragons[0].id, 'real'); assert.equal(h.writes.length, 0); });
test('unsynced browser data requires explicit choice and saves both sides before replacement', async () => { const h = harness({ dragons: [{ id: 'local' }] }, { dragons: [{ id: 'cloud' }] }); await flush(); assert.equal(h.applied, undefined); assert.equal(h.writes.length, 0); h.choose('ใช้ข้อมูลบัญชี'); await flush(); assert.equal(h.applied.dragons[0].id, 'cloud'); const backup = JSON.parse([...h.backups.values()][0]); assert.equal(backup.local.dragons[0].id, 'local'); assert.equal(backup.cloud.dragons[0].id, 'cloud'); });
test('legacy local data with no cloud is never erased automatically', async () => { const h = harness({ dragons: [{ id: 'local' }] }, undefined); await flush(); assert.equal(h.applied, undefined); assert.equal(h.local.dragons[0].id, 'local'); });
test('rapid browser writes are serialized and remember the final written snapshot', async () => { const h = harness(null, { n: 0 }); await flush(); h.edit({ n: 1 }); h.edit({ n: 2 }); await flush(); assert.equal(h.writes.length, 2); assert.equal(h.cloud.n, 2); assert.equal(h.local.n, 2); });
test('a native edit blocks stale browser overwrite and leaves browser draft recoverable', async () => { const h = harness(null, { n: 0 }); await flush(); h.cloud = { n: 7 }; h.edit({ n: 1 }); await flush(); assert.equal(h.cloud.n, 7); assert.equal(h.local.n, 1); assert.equal(h.writes.length, 0); assert.match(h.status, /อีกเครื่อง/); });
test('sign-out during transaction reads cannot write the old owner document', async () => { const h = harness(null, { n: 0 }); await flush(); h.onRead(() => h.signOut()); h.edit({ n: 1 }); await flush(); assert.equal(h.writes.length, 0); assert.equal(h.cloud.n, 0); });
test('editing while refresh is reading never replaces the new local draft', async () => {
  const h = harness(null, { n: 0 }); await flush();
  h.onFreshRead(() => h.edit({ n: 1 })); h.connect(); await flush();
  assert.equal(h.local.n, 1); assert.equal(h.cloud.n, 0); assert.equal(h.writes.length, 0);
  assert.match(h.status, /เลือก|เปลี่ยน/);
});
test('normal loading and saving remain silent while data still persists', async () => {
  const h = harness(null, { n: 0 }); await flush(); assert.equal(h.hasNotice, false);
  let release; const pending = new Promise(resolve => { release = resolve; });
  h.onRead(() => pending); h.edit({ n: 1 }); await flush();
  assert.equal(h.hasNotice, false); assert.equal(h.cloud.n, 0);
  release(); await flush(); assert.equal(h.cloud.n, 1); assert.equal(h.hasNotice, false);
});
test('connection errors offer retry without exposing backend details; success clears the notice', async () => {
  const h = harness(null, { n: 0 }, false, new Error('FirebaseError: internal project/database details')); await flush();
  assert.match(h.status, /เชื่อมต่อไม่สำเร็จ/); assert.doesNotMatch(h.status, /Firebase|database/);
  h.choose('ลองอีกครั้ง'); await flush(); assert.equal(h.applied.n, 0); assert.equal(h.hasNotice, false);
});
test('failed saving preserves the draft and retry still requires a choice before replacing either version', async () => {
  const h = harness(null, { n: 0 }); await flush();
  h.onRead(() => { throw new Error('Firestore: unavailable'); }); h.edit({ n: 1 }); await flush();
  assert.match(h.status, /เชื่อมต่อไม่สำเร็จ/); assert.doesNotMatch(h.status, /Firestore/); assert.equal(h.local.n, 1);
  h.choose('ลองอีกครั้ง'); await flush(); assert.match(h.status, /เลือก/); assert.equal(h.cloud.n, 0);
  h.choose('ใช้ข้อมูลเครื่องนี้'); await flush(); assert.equal(h.cloud.n, 1); assert.equal(h.hasNotice, false); assert.ok(h.backups.size);
});
