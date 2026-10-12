import { test, expect } from '@playwright/test';

// Exercise the real production-mode frontend, replacing only Firebase transport.
// No production account or bypass mode is involved in these fault-injection tests.
async function installCloud(page, { existing = false, delayed = false, signedOut = false, ownedBoard = false } = {}) {
  await page.route('https://www.gstatic.com/firebasejs/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.route('**/shared/firebase-client.js', route => route.fulfill({ contentType: 'application/javascript', body: `(${cloudFixture.toString()})(${JSON.stringify({ existing, delayed, signedOut, ownedBoard })})` }));
}
function cloudFixture({ existing, delayed, signedOut, ownedBoard }) {
  const user = { uid: 'qa-persistence', email: 'qa.persistence@coinquest.local' };
  const hero = { id: '8899', name: 'Existing TEST Hero', class: 'warrior', gender: 'male', ownerUid: user.uid, xp: 321 };
  const initial = { uid: user.uid, username: 'qa.persistence', userId: '8899', name: 'TEST Account', status: 'active', ...(existing ? { character: hero, characterId: hero.id } : {}) };
  const records = JSON.parse(sessionStorage.getItem('qa-cloud-records') || 'null') || { ['users/' + user.uid]: initial, ...(existing ? { 'characters/8899': hero } : {}) };
  let release; const ready = delayed ? new Promise(r => { release = r; }) : Promise.resolve();
  window.qaReleaseAccount = () => release?.();
  window.qaRecords = records; window.qaCharacterWrites = 0;
  const snapshot = path => ({ exists: !!records[path], id: path.split('/').pop(), data: () => structuredClone(records[path]) });
  function collection(path) {
    const docs = ownedBoard && path === 'trips' ? [{ id: '4466', data: () => ({ tripName: 'TEST UID-owned board', participants: [], expenses: [], access: { ownerUids: [user.uid] }, admin: { adminName: 'Old nickname' } }) }] : [];
    const query = { get: async () => ({ docs, empty: !docs.length, forEach(fn) { docs.forEach(fn); } }), where: () => query, orderBy: () => query, limit: () => query,
      doc: id => ({ path: path + '/' + id, collection: name => collection(path + '/' + id + '/' + name), get: async () => { if (path === 'users') await ready; return snapshot(path + '/' + id); } }) };
    return query;
  }
  const db = { collection, runTransaction: async callback => {
    const writes = [];
    const result = await callback({ get: async ref => snapshot(ref.path), set: (ref, value, opts) => writes.push([ref.path, value, !!opts?.merge]), update: (ref, value) => writes.push([ref.path, value, true]) });
    if (writes.some(([path]) => path.startsWith('characters/')) && ++window.qaCharacterWrites === 1) throw Object.assign(new Error('simulated network failure'), { code: 'unavailable' });
    writes.forEach(([path, value, merge]) => { records[path] = merge ? { ...records[path], ...value } : value; });
    sessionStorage.setItem('qa-cloud-records', JSON.stringify(records)); return result;
  } };
  window.qaAuthCalls = 0;
  const failAuth = async () => { window.qaAuthCalls++; throw new Error('Unexpected auth request'); };
  const auth = { currentUser: signedOut ? null : user, onAuthStateChanged: callback => { setTimeout(() => callback(auth.currentUser), 0); return () => {}; }, signOut: async () => { auth.currentUser = null; }, signInWithEmailAndPassword: failAuth, createUserWithEmailAndPassword: failAuth };
  window.firebase = { firestore: Object.assign(() => db, { FieldValue: { serverTimestamp: () => Date.now(), delete: () => null } }) };
  window.PointyFirebase = { init: () => window.firebase, auth: () => auth, firestore: () => db, serverTimestamp: () => Date.now(), freshGet: ref => ref.get() };
}

test('profile lists a Firebase-owned board even without legacy character/name ownership', async ({ page }) => {
  await installCloud(page, { existing: true, ownedBoard: true }); await page.goto('/');
  await expect(page.locator('.login-gate')).toHaveCount(0);
  const profile = page.locator('[data-profile-hub="profile"]');
  if (await profile.isVisible()) await profile.click();
  else { await page.getByRole('button', { name: 'Menu', exact: true }).click(); await page.locator('[data-mm-action="profile"]').click(); }
  await expect(page.locator('.pd-boards')).toContainText('TEST UID-owned board');
  await expect(page.locator('.pd-boards a')).toHaveAttribute('href', '/trip/?id=4466');
});

test('character write failure keeps the gate and draft; retry commits once and reload restores the same identity', async ({ page }) => {
  await installCloud(page); await page.goto('/');
  await expect(page.locator('[data-char-name]')).toBeVisible();
  await page.locator('[data-char-name]').fill('TEST Persistent Hero');
  await page.locator('[data-char-open-picker]').click(); await page.locator('[data-char-class="warrior"][data-char-gender="male"]').click();
  await expect(page.locator('[data-char-name]')).toHaveValue('TEST Persistent Hero');
  await page.locator('[data-char-name]').fill(''); await page.locator('[data-char-form] .login-btn').click();
  await expect(page.locator('[data-char-error]')).toContainText('ชื่อตัวละคร');
  expect(await page.evaluate(() => window.qaCharacterWrites)).toBe(0);
  await page.locator('[data-char-name]').fill('TEST Persistent Hero');
  await page.locator('[data-char-form] .login-btn').click();
  await expect(page.locator('[data-char-error]')).toContainText('เชื่อมต่อไม่สำเร็จ');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pointy_auth_v1')).character)).toBeNull();
  expect(await page.evaluate(() => window.qaRecords['characters/8899'])).toBeUndefined();
  await expect(page.locator('[data-char-name]')).toHaveValue('TEST Persistent Hero');
  await page.locator('[data-char-form] .login-btn').click(); await expect(page.locator('.login-gate')).toHaveCount(0);
  expect(await page.evaluate(() => window.qaRecords['characters/8899'].name)).toBe('TEST Persistent Hero');
  await page.reload(); await expect(page.locator('.login-gate')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pointy_auth_v1')).character.id)).toBe('8899');
});

test('slow account hydration never displays stale character creation before the existing hero arrives', async ({ page }) => {
  await installCloud(page, { existing: true, delayed: true });
  await page.addInitScript(() => localStorage.setItem('pointy_auth_v1', JSON.stringify({ provider: 'firebase', uid: 'qa-persistence', username: 'qa.persistence', email: 'qa.persistence@coinquest.local', userId: '8899', name: 'Old mirror', character: null })));
  await page.goto('/'); await expect(page.locator('.login-gate [role=status]')).toBeVisible();
  await expect(page.locator('[data-char-form]')).toHaveCount(0);
  await page.evaluate(() => window.qaReleaseAccount());
  await expect(page.locator('.login-gate')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pointy_auth_v1')).character.name)).toBe('Existing TEST Hero');
  expect(await page.evaluate(() => window.qaCharacterWrites)).toBe(0);
});

test('login, signup and recovery reject invalid fields before sending credentials or reset requests', async ({ page }) => {
  await installCloud(page, { signedOut: true }); let resets = 0;
  await page.route('**/api/recover-account', route => { resets++; return route.fulfill({ status: 400, body: '{}' }); });
  await page.goto('/'); await page.locator('[data-login-email]').fill('bad/name'); await page.locator('[data-login-password]').fill('TEST-password');
  await page.locator('[data-login-form] .login-btn').click(); await expect(page.locator('[data-login-error]')).toContainText('ชื่อผู้ใช้ใช้');
  await page.locator('[data-login-tab="up"]').click(); await page.locator('[data-login-email]').fill('test.validation');
  await page.locator('[data-login-password]').fill('short'); await page.locator('[data-login-password2]').fill('short');
  await page.locator('[data-login-form] .login-btn').click(); await expect(page.locator('[data-login-error]')).toBeVisible();
  await page.locator('[data-login-name]').fill('TEST name'); await page.locator('[data-login-form] .login-btn').click(); await expect(page.locator('[data-login-error]')).toContainText('6');
  await page.locator('[data-login-password]').fill('TEST-password'); await page.locator('[data-login-form] .login-btn').click(); await expect(page.locator('[data-login-error]')).toContainText('ตรงกัน');
  expect(await page.evaluate(() => window.qaAuthCalls)).toBe(0);
  await page.locator('[data-login-tab="in"]').click(); await page.locator('[data-forgot-password]').click();
  await page.locator('[data-recovery-username]').fill('test.validation'); await page.locator('[data-recovery-code]').fill('bad');
  await page.locator('[data-recovery-password]').fill('TEST-password'); await page.locator('[data-recovery-confirm]').fill('TEST-password');
  await page.locator('[data-recovery-form] .login-btn').click(); await expect(page.locator('[data-recovery-error]')).toContainText('12');
  await page.locator('[data-recovery-code]').fill('ABCD-EFGH-JKLM'); await page.locator('[data-recovery-confirm]').fill('mismatch');
  await page.locator('[data-recovery-form] .login-btn').click(); await expect(page.locator('[data-recovery-error]')).toContainText('ตรงกัน');
  expect(resets).toBe(0);
});
