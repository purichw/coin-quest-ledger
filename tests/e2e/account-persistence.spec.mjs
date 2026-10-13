import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

async function capturePlayer(page, path) {
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path });
}

// Exercise the real production-mode frontend, replacing only Firebase transport.
// No production account or bypass mode is involved in these fault-injection tests.
async function installCloud(page, { existing = false, delayed = false, signedOut = false, ownedBoard = false, moduleError = false, authError = '', authDelay = false, newAccount = false, characterDelay = false } = {}) {
  await page.route('https://www.gstatic.com/firebasejs/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.route('**/shared/firebase-client.js', route => route.fulfill({ contentType: 'application/javascript', body: `(${cloudFixture.toString()})(${JSON.stringify({ existing, delayed, signedOut, ownedBoard, moduleError, authError, authDelay, newAccount, characterDelay })})` }));
}

test('shared loading scene releases the real login gate without losing focus', async ({ page }, testInfo) => {
  await installCloud(page, { signedOut: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  let held;
  await page.route('**/assets/home-reference/crest.webp', route => new Promise(resolve => { held = { route, resolve }; }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.auth-entry')).toBeVisible();
  await expect(page.locator('[data-first-load]')).toBeVisible();
  await expect(page.locator('[data-first-load]')).toBeFocused();
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.locator('.first-load-scene').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  const output = testInfo.outputPath('loading-home-auth-1440.png');
  await page.screenshot({ path: output, animations: 'disabled' });
  const qa = path.resolve('docs/loading-redesign-2026-10-13/qa');
  await fs.mkdir(qa, { recursive: true });
  await fs.copyFile(output, path.join(qa, 'loading-home-auth-1440.png'));
  await expect.poll(() => Boolean(held)).toBe(true);
  await held.route.continue(); held.resolve();
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await expect(page.locator('#auth-title')).toBeFocused();
  await page.getByRole('tab', { name: 'สมัครใหม่', exact: true }).click();
  await expect(page.locator('[data-login-name]')).toBeVisible();
  await expect(page.locator('html')).not.toHaveClass(/first-load-(boot|open)/);
});
function cloudFixture({ existing, delayed, signedOut, ownedBoard, moduleError, authError, authDelay, newAccount, characterDelay }) {
  const user = { uid: 'qa-persistence', email: 'qa.persistence@coinquest.local' };
  const hero = { id: '8899', name: 'Existing TEST Hero', class: 'warrior', gender: 'male', ownerUid: user.uid, xp: 321 };
  const initial = { uid: user.uid, username: 'qa.persistence', userId: '8899', name: 'TEST Account', status: 'active', ...(existing ? { character: hero, characterId: hero.id } : {}) };
  const records = JSON.parse(sessionStorage.getItem('qa-cloud-records') || 'null') || (newAccount ? {} : { ['users/' + user.uid]: initial, ...(existing ? { 'characters/8899': hero } : {}), ...(ownedBoard ? { 'trips/4466': { tripName: 'TEST UID-owned board', participants: [], expenses: [], access: { ownerUids: [user.uid] }, admin: { adminName: 'Old nickname' } } } : {}) });
  let release; const ready = delayed ? new Promise(r => { release = r; }) : Promise.resolve();
  window.qaReleaseAccount = () => release?.();
  window.qaRecords = records; window.qaCharacterWrites = 0;
  const snapshot = path => ({ exists: !!records[path], id: path.split('/').pop(), data: () => structuredClone(records[path]) });
  function collection(path) {
    const query = { get: async () => { if (path === 'trips' && window.qaFailBoardRead) throw new Error('TEST read unavailable'); const docs = Object.keys(records).filter(key => key.startsWith(path + '/') && !key.slice(path.length + 1).includes('/')).map(key => snapshot(key)); return { docs, empty: !docs.length, forEach(fn) { docs.forEach(fn); } }; }, where: () => query, orderBy: () => query, limit: () => query,
      doc: id => ({ path: path + '/' + id, collection: name => collection(path + '/' + id + '/' + name), get: async () => {
        if (path === 'users') {
          await ready;
          if (window.qaFailAccountRead) throw Object.assign(new Error('TEST account unavailable'), { code: 'unavailable' });
        }
        return snapshot(path + '/' + id);
      } }) };
    return query;
  }
  const db = { collection, runTransaction: async callback => {
    const writes = [];
    const result = await callback({ get: async ref => snapshot(ref.path), set: (ref, value, opts) => writes.push([ref.path, value, !!opts?.merge]), update: (ref, value) => writes.push([ref.path, value, true]) });
    if (writes.some(([path]) => path.startsWith('characters/'))) {
      window.qaCharacterWrites++;
      if (characterDelay) await new Promise(resolve => { window.qaReleaseCharacter = resolve; });
      if (window.qaCharacterWrites === 1 && !newAccount) throw Object.assign(new Error('simulated network failure'), { code: 'unavailable' });
    }
    if (writes.some(([path]) => path.startsWith('trips/')) && window.qaFailBoardWrite) { window.qaFailBoardWrite = false; throw new Error('TEST board write unavailable'); }
    writes.forEach(([path, value, merge]) => { records[path] = merge ? { ...records[path], ...value } : value; });
    sessionStorage.setItem('qa-cloud-records', JSON.stringify(records)); return result;
  } };
  window.qaAuthCalls = 0;
  const failAuth = async () => { window.qaAuthCalls++; if (authDelay) await new Promise(resolve => { window.qaReleaseSignIn = resolve; }); throw Object.assign(new Error('Unexpected auth request'), { code: authError }); };
  const acceptAuth = async email => { window.qaAuthCalls++; user.email = email; auth.currentUser = user; sessionStorage.setItem('qa-signed-in', JSON.stringify(user)); return { user }; };
  const auth = { currentUser: JSON.parse(sessionStorage.getItem('qa-signed-in') || 'null') || (signedOut ? null : user), onAuthStateChanged: callback => { setTimeout(() => callback(auth.currentUser), 0); return () => {}; }, signOut: async () => { auth.currentUser = null; sessionStorage.removeItem('qa-signed-in'); }, signInWithEmailAndPassword: newAccount ? acceptAuth : failAuth, createUserWithEmailAndPassword: newAccount ? acceptAuth : failAuth };
  window.firebase = { apps: [{}], auth: () => auth, firestore: Object.assign(() => db, { FieldValue: { serverTimestamp: () => Date.now(), delete: () => null } }) };
  window.qaModuleError = moduleError;
  window.PointyFirebase = { init: () => window.firebase, auth: () => auth, firestore: () => db, serverTimestamp: () => Date.now(), freshGet: ref => {
    if (ref.path?.startsWith('playerModules/') && window.qaModuleError) return Promise.reject(new Error('FirebaseError: internal database project path'));
    return ref.get();
  } };
}

for (const route of ['/', '/debt/', '/treasury/']) {
  test(`routine account sync leaves no player banner on ${route}`, async ({ page }, testInfo) => {
    await installCloud(page, { existing: true }); await page.goto(route);
    await expect(page.locator('.login-gate')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => Object.keys(window.PointyScope.getJSON('pointy_module_sync_v1', {}, { account: window.PointyScope.readAuth() })).length)).toBeGreaterThan(0);
    await expect(page.locator('.module-sync-banner')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'ตรวจข้อมูลล่าสุด' })).toHaveCount(0);
    await expect(page.locator('.account-hero-note')).toHaveCount(0);
    await capturePlayer(page, testInfo.outputPath('quiet-player.png'));
  });
}

test('Split entry uses account boards and preserves Firebase creation through failure and reload', async ({ page }) => {
  await installCloud(page, { existing: true, ownedBoard: true }); await page.goto('/trip/');
  await expect(page.locator('.login-gate')).toHaveCount(0);
  await expect(page.locator('.be-board')).toHaveCount(1);
  await expect(page.locator('.be-board')).toContainText('TEST UID-owned board');
  await page.evaluate(() => { window.qaFailBoardWrite = true; });
  await page.locator('#bc-board-name').fill('TEST Firebase Entry'); await page.locator('.be-create-button').click();
  await expect(page.locator('#be-create-error')).toContainText('ลองอีกครั้ง');
  await expect(page.locator('#bc-board-name')).toHaveValue('TEST Firebase Entry');
  expect(await page.evaluate(() => Object.keys(window.qaRecords).filter(key => key.startsWith('trips/')).length)).toBe(1);
  await page.locator('.be-create-button').click(); await expect(page).toHaveURL(/id=\d{4}/);
  await expect(page.locator('#trip-name-display')).toHaveText('TEST Firebase Entry');
  const code = new URL(page.url()).searchParams.get('id');
  const board = await page.evaluate(code => window.qaRecords['trips/' + code], code);
  expect(board.access.ownerUids).toContain('qa-persistence');
  expect(board.characterIds['Existing TEST Hero']).toBe('8899');
  await page.reload(); await expect(page.locator('#trip-name-display')).toHaveText('TEST Firebase Entry');
  await page.goto('/trip/');
  if (page.viewportSize().width <= 600) await page.locator('[data-entry-all]').click();
  await expect(page.locator('.be-board')).toHaveCount(2);
  await expect(page.locator('.be-board').first()).toContainText('TEST Firebase Entry');
});

test('Split entry offers retry after a board-list connection failure without clearing the draft', async ({ page }) => {
  await installCloud(page, { existing: true, ownedBoard: true });
  await page.addInitScript(() => { window.qaFailBoardRead = true; }); await page.goto('/trip/');
  await expect(page.locator('.login-gate')).toHaveCount(0);
  await expect(page.locator('[data-entry-retry]')).toBeVisible();
  await page.locator('#bc-board-name').fill('TEST Draft while offline');
  await page.evaluate(() => { window.qaFailBoardRead = false; });
  await page.locator('[data-entry-retry]').click(); await expect(page.locator('.be-board')).toHaveCount(1);
  await expect(page.locator('#bc-board-name')).toHaveValue('TEST Draft while offline');
});

test('player connection failure stays actionable and disappears after retry', async ({ page }, testInfo) => {
  await installCloud(page, { existing: true, moduleError: true }); await page.goto('/debt/');
  const notice = page.getByRole('complementary', { name: 'ข้อมูลที่ต้องตรวจสอบ' });
  await expect(notice).toContainText('เชื่อมต่อไม่สำเร็จ');
  await expect(notice).not.toContainText(/Firebase|database|project/);
  await capturePlayer(page, testInfo.outputPath('actionable-error.png'));
  await page.evaluate(() => { window.qaModuleError = false; });
  await notice.getByRole('button', { name: 'ลองอีกครั้ง', exact: true }).click();
  await expect(notice).toHaveCount(0);
});

test('login and signup omit backend copy and configuration errors use player language', async ({ page }, testInfo) => {
  await installCloud(page, { signedOut: true, authError: 'auth/configuration-not-found' }); await page.goto('/');
  await expect(page.locator('[data-login-form]')).toBeVisible();
  await expect(page.locator('.login-note')).toHaveCount(0);
  await page.locator('[data-login-tab="up"]').click(); await expect(page.locator('.login-note')).toHaveCount(0);
  await page.locator('[data-login-tab="in"]').click();
  await page.locator('[data-login-email]').fill('test.copy'); await page.locator('[data-login-password]').fill('TEST-fixture-password');
  await page.locator('[data-login-form] .login-btn').click();
  await expect(page.locator('[data-login-error]')).toContainText('ยังเข้าสู่ระบบไม่ได้ในขณะนี้');
  await expect(page.locator('.login-card')).not.toContainText(/Firebase|Console/);
  await capturePlayer(page, testInfo.outputPath('player-login.png'));
});

test('profile lists a Firebase-owned board even without legacy character/name ownership', async ({ page }) => {
  await installCloud(page, { existing: true, ownedBoard: true }); await page.goto('/');
  await expect(page.locator('.login-gate')).toHaveCount(0);
  const profile = page.locator('[data-profile-hub="profile"]');
  if (await profile.isVisible()) await profile.click();
  else { await page.getByRole('button', { name: 'Menu', exact: true }).click(); await page.locator('[data-mm-action="profile"]').click(); }
  await expect(page.locator('.pd-boards')).toContainText('TEST UID-owned board');
  await expect(page.locator('.pd-boards a')).toHaveAttribute('href', '/trip/?id=4466');
});

async function captureCreation(page, testInfo, name) {
  await page.evaluate(() => document.fonts.ready);
  const output = testInfo.outputPath(name);
  await page.screenshot({ path: output, animations: 'disabled' });
  const qa = path.resolve('docs/character-creation-redesign-2026-10-13/qa');
  await fs.mkdir(qa, { recursive: true });
  await fs.copyFile(output, path.join(qa, name));
}

for (const width of [1440, 768, 390]) test(`Character creation and hero picker at ${width}px`, async ({ page }, testInfo) => {
  await installCloud(page);
  await page.setViewportSize({ width, height: width === 768 ? 1024 : width === 390 ? 844 : 900 });
  await page.goto('/');
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await page.locator('[data-char-name]').fill('Mali');
  await expect(page.locator('[data-char-form] .login-btn')).toBeDisabled();
  await captureCreation(page, testInfo, `creation-${width}-empty.png`);
  await page.locator('[data-char-open-picker]').click();
  await expect(page.locator('[data-char-class]')).toHaveCount(36);
  await page.locator('.picker-cell img').evaluateAll(images => Promise.all(images.map(img => img.decode().catch(() => {}))));
  expect(await page.locator('.picker-cell img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0))).toBe(true);
  expect(await page.locator('.picker-cell').first().evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(180);
  expect(await page.locator('.picker-grid').evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
  expect(await page.locator('.creation-picker').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await captureCreation(page, testInfo, `creation-${width}-picker.png`);
  await page.locator('[data-picker-gender="female"]').click();
  await expect(page.locator('[data-char-class]')).toHaveCount(18);
  await page.locator('[data-char-class="ranger"][data-char-gender="female"]').click();
  await expect(page.locator('[data-char-name]')).toHaveValue('Mali');
  await expect(page.locator('[data-char-form] .login-btn')).toBeEnabled();
  await captureCreation(page, testInfo, `creation-${width}-selected.png`);
});

test('Character creation preserves choices through preferences and traps focus in the scrollable picker', async ({ page }, testInfo) => {
  await installCloud(page); await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await page.locator('[data-char-name]').fill('Mali นักผจญภัย');
  await page.locator('[data-char-open-picker]').click();
  await expect(page.locator('#cc-picker-title')).toBeFocused();
  await expect(page.locator('.auth-entry')).toHaveJSProperty('inert', true);
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('[data-char-class]').last()).toBeFocused();
  await expect(page.locator('[data-char-class]').last()).toBeInViewport();
  await page.keyboard.press('Tab'); await expect(page.locator('.picker-close')).toBeFocused();
  await page.locator('[data-picker-gender="male"]').click();
  await expect(page.locator('[data-char-class]')).toHaveCount(18);
  await page.locator('[data-picker-gender="all"]').click();
  await expect(page.locator('[data-char-class]')).toHaveCount(36);
  await page.keyboard.press('Escape');
  await expect(page.locator('.creation-picker')).toHaveCount(0);
  await expect(page.locator('[data-char-open-picker]')).toBeFocused();
  await expect(page.locator('.auth-entry')).toHaveJSProperty('inert', false);
  await page.locator('[data-char-open-picker]').click();
  await page.locator('[data-char-class="ranger"][data-char-gender="female"]').click();
  await page.locator('[data-login-lang="en"]').click();
  await expect(page.locator('[data-char-name]')).toHaveValue('Mali นักผจญภัย');
  await expect(page.locator('.cc-cls')).toHaveText('Ranger');
  await page.locator('[data-login-theme]').click();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dungeon');
  await expect(page.locator('[data-char-name]')).toHaveValue('Mali นักผจญภัย');
  await expect(page.locator('[data-char-form] .login-btn')).toBeEnabled();
  await captureCreation(page, testInfo, 'creation-390-en-dark.png');
  await page.locator('[data-char-open-picker]').click();
  await expect(page.locator('[data-char-class="ranger"][data-char-gender="female"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.picker-close').click();
  await expect(page.locator('[data-char-open-picker]')).toBeFocused();
  await page.setViewportSize({ width: 320, height: 480 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.auth-entry').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.locator('[data-char-open-picker]').click();
  await expect(page.locator('[data-char-class]').last()).toBeAttached();
  await page.locator('[data-char-class]').last().focus();
  await expect(page.locator('[data-char-class]').last()).toBeInViewport();
  await page.keyboard.press('Escape');
  await page.locator('[data-char-back]').click();
  await expect(page.locator('[data-login-form]')).toBeVisible();
  expect(await page.evaluate(() => window.qaCharacterWrites)).toBe(0);
});

test('Character creation validates names, prevents duplicate saves and keeps the draft after a slow failed save', async ({ page }, testInfo) => {
  await installCloud(page, { characterDelay: true });
  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto('/');
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await page.locator('[data-char-open-picker]').click();
  await page.locator('[data-char-class="ranger"][data-char-gender="female"]').click();
  const name = page.locator('[data-char-name]'), submit = page.locator('[data-char-form] .login-btn');
  await name.fill('   '); await submit.click();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('[data-char-error]')).toBeFocused();
  expect(await page.evaluate(() => window.qaCharacterWrites)).toBe(0);
  await name.fill('A'.repeat(31));
  await expect(name).toHaveValue('A'.repeat(30));
  await name.fill('TEST Slow Hero'); await submit.click();
  await expect(page.locator('[data-char-form]')).toHaveAttribute('aria-busy', 'true');
  await expect(name).toBeDisabled();
  await expect(page.locator('[data-char-open-picker]')).toBeDisabled();
  await expect(page.locator('[data-login-lang="en"]')).toBeDisabled();
  await expect(page.locator('[data-char-back]')).toBeDisabled();
  await expect(submit).toContainText('กำลังบันทึกตัวละคร');
  await expect.poll(() => page.evaluate(() => window.qaCharacterWrites)).toBe(1);
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.qaCharacterWrites)).toBe(1);
  await captureCreation(page, testInfo, 'creation-1440-saving.png');
  await page.evaluate(() => window.qaReleaseCharacter());
  await expect(page.locator('[data-char-error]')).toContainText('เชื่อมต่อไม่สำเร็จ');
  await expect(name).toHaveValue('TEST Slow Hero');
  await expect(submit).toBeEnabled();
  await captureCreation(page, testInfo, 'creation-1440-error.png');
  await submit.click();
  await expect.poll(() => page.evaluate(() => window.qaCharacterWrites)).toBe(2);
  await page.evaluate(() => window.qaReleaseCharacter());
  await expect(page.locator('.login-gate')).toHaveCount(0);
  expect(await page.evaluate(() => window.qaRecords['characters/8899'].name)).toBe('TEST Slow Hero');
});

test('character write failure keeps the gate and draft; retry commits once and reload restores the same identity', async ({ page }) => {
  await installCloud(page); await page.goto('/');
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await expect(page.locator('[data-char-name]')).toBeVisible();
  await page.locator('[data-char-name]').fill('TEST Persistent Hero');
  await expect(page.locator('[data-char-name]')).toHaveValue('TEST Persistent Hero');
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

test('slow account hydration keeps the centered loading scene until the existing hero arrives', async ({ page }, testInfo) => {
  const viewport = { chromium: { width: 1440, height: 900 }, tablet: { width: 768, height: 1024 }, mobile: { width: 390, height: 844 } }[testInfo.project.name];
  await page.setViewportSize(viewport);
  await installCloud(page, { existing: true, delayed: true });
  await page.addInitScript(() => localStorage.setItem('pointy_auth_v1', JSON.stringify({ provider: 'firebase', uid: 'qa-persistence', username: 'qa.persistence', email: 'qa.persistence@coinquest.local', userId: '8899', name: 'Old mirror', character: null })));
  await page.goto('/'); await expect(page.locator('.login-gate [role=status]')).toBeVisible();
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  const pending = page.locator('.account-loading');
  await expect(pending).toBeVisible();
  await expect(pending.getByRole('heading')).toHaveText('COIN QUEST');
  await expect(pending.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  await expect(pending.getByRole('status')).toContainText('กำลังเตรียมการผจญภัย');
  await page.evaluate(() => document.fonts.ready);
  await pending.locator('img').evaluate(img => img.decode());
  const bounds = await pending.boundingBox();
  expect(bounds).toEqual({ x: 0, y: 0, ...viewport });
  const content = await pending.locator('.first-load-box').boundingBox();
  expect(Math.abs(content.x + content.width / 2 - viewport.width / 2)).toBeLessThan(1);
  expect(Math.abs(content.y + content.height / 2 - viewport.height / 2)).toBeLessThan(viewport.height * .05);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await pending.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Tab');
  await expect(pending).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath(`account-loading-${viewport.width}.png`), animations: 'disabled' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await pending.locator('.first-load-fill').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await expect(page.locator('[data-char-form]')).toHaveCount(0);
  await page.evaluate(() => window.qaReleaseAccount());
  await expect(page.locator('.login-gate')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pointy_auth_v1')).character.name)).toBe('Existing TEST Hero');
  expect(await page.evaluate(() => window.qaCharacterWrites)).toBe(0);
});

test('account loading hands off to character creation after the account is ready', async ({ page }) => {
  await installCloud(page, { delayed: true });
  await page.goto('/');
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await expect(page.locator('.account-loading')).toBeVisible();
  await expect(page.locator('[data-char-form]')).toHaveCount(0);
  await page.evaluate(() => window.qaReleaseAccount());
  await expect(page.locator('.account-loading')).toHaveCount(0);
  await expect(page.locator('[data-char-form]')).toBeVisible();
  await expect(page.locator('#auth-title')).toBeFocused();
});

test('account loading stays usable in a short viewport and gives way to login on read failure', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 450 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('lang', 'en'));
  await installCloud(page, { existing: true, delayed: true });
  await page.goto('/');
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  const pending = page.locator('.account-loading');
  await expect(pending.getByRole('status')).toHaveText('Preparing your adventure…');
  await expect(pending.locator('.first-load-box')).toBeInViewport({ ratio: 1 });
  await expect(pending.locator('.first-load-quote')).toBeInViewport({ ratio: 1 });
  expect(await pending.locator('.first-load-fill').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.evaluate(() => { window.qaFailAccountRead = true; window.qaReleaseAccount(); });
  await expect(pending).toHaveCount(0);
  await expect(page.locator('[data-login-form]')).toBeVisible();
  await expect(page.locator('[data-login-error]')).toBeVisible();
  await expect(page.locator('#auth-title')).toBeFocused();
  await expect(page.locator('[data-login-form] .login-btn')).toBeEnabled();
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

async function captureAuth(page, testInfo, name) {
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.auth-entry img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
  const output = testInfo.outputPath(name);
  await page.screenshot({ path: output, animations: 'disabled' });
  const qa = path.resolve('docs/auth-redesign-2026-10-13/qa');
  await fs.mkdir(qa, { recursive: true });
  await fs.copyFile(output, path.join(qa, name));
}
for (const width of [1440, 768, 390]) {
  test(`Tavern auth Login and Sign Up composition at ${width}px`, async ({ page }, testInfo) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await installCloud(page, { signedOut: true });
    await page.setViewportSize({ width, height: width === 768 ? 1024 : width === 390 ? 844 : 900 });
    await page.goto('/');
    await expect(page.locator('[data-login-form]')).toBeVisible();
    for (const mode of ['in', 'up']) {
      await page.locator(`[data-login-tab="${mode}"]`).click();
      await page.locator('.login-gate').evaluate(el => { el.scrollTop = 0; });
      await expect(page.locator(`[data-login-tab="${mode}"]`)).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('[data-login-form] input')).toHaveCount(mode === 'up' ? 4 : 2);
      expect(await page.locator('.auth-entry').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      await captureAuth(page, testInfo, `auth-${width}-${mode}-top.png`);
      if (await page.locator('.login-gate').evaluate(el => el.scrollHeight > el.clientHeight + 1)) {
        await page.locator('.login-gate').evaluate(el => { el.scrollTop = el.scrollHeight; });
        await expect(page.locator('.login-btn')).toBeInViewport();
        await captureAuth(page, testInfo, `auth-${width}-${mode}-bottom.png`);
      }
    }
    await expect(page.locator('.auth-entry')).not.toContainText(/Firebase|regression|production auth/);
    expect(errors).toEqual([]);
  });
}

test('Tavern auth keeps drafts through language and theme changes; password reveal and keyboard tabs work', async ({ page }, testInfo) => {
  await installCloud(page, { signedOut: true }); await page.goto('/');
  await page.locator('[data-login-email]').fill('test.draft');
  await page.locator('[data-login-password]').fill('TEST-draft-only');
  await page.locator('[data-auth-reveal="auth-login-password"]').click();
  await expect(page.locator('[data-login-password]')).toHaveAttribute('type', 'text');
  await expect(page.getByRole('button', { name: 'ซ่อนรหัสผ่าน', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-login-lang="en"]').click();
  await expect(page.locator('[data-login-email]')).toHaveValue('test.draft');
  await expect(page.locator('[data-login-password]')).toHaveValue('TEST-draft-only');
  await expect(page.locator('[data-login-password]')).toHaveAttribute('type', 'password');
  await page.locator('[data-login-theme]').click();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dungeon');
  await expect(page.locator('[data-login-password]')).toHaveValue('TEST-draft-only');
  await page.locator('[data-login-tab="in"]').press('ArrowRight');
  await expect(page.locator('[data-login-tab="up"]')).toBeFocused();
  await expect(page.locator('[data-login-email]')).toHaveValue('test.draft');
  await expect(page.locator('[data-login-password]')).toBeEmpty();
  await page.locator('[data-login-name]').fill('TEST Adventurer');
  await page.locator('[data-login-password]').fill('TEST-private');
  await page.locator('[data-login-password2]').fill('TEST-private');
  await page.locator('[data-login-lang="th"]').click();
  for (const [field, value] of [['name', 'TEST Adventurer'], ['email', 'test.draft'], ['password', 'TEST-private'], ['password2', 'TEST-private']]) await expect(page.locator(`[data-login-${field}]`)).toHaveValue(value);
  await page.locator('[data-login-lang="en"]').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.login-gate').evaluate(el => { el.scrollTop = 0; });
  await captureAuth(page, testInfo, 'auth-390-signup-english-dark-top.png');
  await page.locator('.login-gate').evaluate(el => { el.scrollTop = el.scrollHeight; });
  await captureAuth(page, testInfo, 'auth-390-signup-english-dark-bottom.png');
  // Passwords remain only in the form, not in local/session storage for draft persistence.
  expect(await page.evaluate(() => JSON.stringify([Object.values(localStorage), Object.values(sessionStorage)]))).not.toContain('TEST-private');
  await page.locator('.login-btn').focus(); await page.keyboard.press('Tab'); await expect(page.locator('[data-login-theme]')).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(page.locator('.login-btn')).toBeFocused();
  await page.locator('[data-login-tab="up"]').press('Home'); await expect(page.locator('[data-login-tab="in"]')).toBeFocused();
});

test('Tavern auth loading blocks duplicate requests and restores form after failure', async ({ page }) => {
  await installCloud(page, { signedOut: true, authDelay: true, authError: 'auth/invalid-credential' }); await page.goto('/');
  await page.locator('[data-login-email]').fill('qa.persistence'); await page.locator('[data-login-password]').fill('TEST-password');
  await page.locator('.login-btn').click();
  await expect(page.locator('[data-login-form]')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('.login-btn')).toContainText('กำลังเข้าสู่ระบบ');
  await expect(page.locator('[data-login-tab="up"]')).toBeDisabled(); await expect(page.locator('[data-login-theme]')).toBeDisabled();
  expect(await page.evaluate(() => window.qaAuthCalls)).toBe(1);
  await page.evaluate(() => window.qaReleaseSignIn());
  await expect(page.locator('[data-login-error]')).toBeVisible(); await expect(page.locator('.login-btn')).toBeEnabled();
  await expect(page.locator('[data-login-password]')).toHaveValue('TEST-password');
  await expect(page.locator('[data-login-form]')).toHaveAttribute('aria-busy', 'false');
});

test('Tavern auth recovery, short viewport and shared module entry remain usable', async ({ page }, testInfo) => {
  await installCloud(page, { signedOut: true }); await page.goto('/');
  await page.setViewportSize({ width: 320, height: 450 });
  await page.locator('[data-login-tab="up"]').click();
  await page.locator('[data-login-password2]').fill('TEST-short-viewport');
  await expect(page.locator('[data-login-password2]')).toBeInViewport();
  // Simulate artwork completing late and moving the form after keyboard focus.
  await page.locator('.auth-banner').evaluate(img => { img.style.height = '300px'; });
  await expect(page.locator('[data-login-password2]')).toBeInViewport();
  await page.locator('.auth-banner').evaluate(img => { img.style.height = ''; });
  expect(await page.locator('.auth-entry').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.locator('.login-btn').click(); await expect(page.locator('[data-login-error]')).toBeInViewport();
  await page.locator('[data-login-tab="in"]').click(); await page.locator('[data-forgot-password]').click();
  await page.locator('[data-recovery-username]').fill('test.recovery');
  await page.locator('[data-login-lang="en"]').click();
  await expect(page.locator('[data-recovery-username]')).toHaveValue('test.recovery');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.login-gate').evaluate(el => { el.scrollTop = el.scrollHeight; });
  await captureAuth(page, testInfo, 'auth-390-recovery-bottom.png');
  await page.locator('[data-back-login]').click(); await expect(page.locator('[data-login-email]')).toBeFocused();
  for (const route of ['/trip/', '/debt/', '/treasury/']) {
    await page.goto(route); await expect(page.locator('.auth-signin')).toBeVisible();
    await expect(page.locator('[data-forgot-password]')).toBeVisible();
    expect(await page.locator('.auth-entry').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  }
});

test('Tavern auth signup creates one identity, keeps Recovery ID and restores the hero after sign-in and reload', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await installCloud(page, { signedOut: true, newAccount: true }); await page.goto('/');
  await page.locator('[data-login-tab="up"]').click();
  await page.locator('[data-login-name]').fill('TEST Tavern');
  await page.locator('[data-login-email]').fill('test.tavern');
  await page.locator('[data-login-password]').fill('TEST-password-only');
  await page.locator('[data-login-password2]').fill('TEST-password-only');
  await page.locator('.login-btn').click();
  await expect(page.locator('[data-char-form]')).toBeVisible();
  expect(await page.evaluate(() => !!sessionStorage.getItem('pointy_pending_recovery_code_v1'))).toBe(true);
  expect(await page.evaluate(() => window.qaAuthCalls)).toBe(1);
  await page.locator('[data-char-name]').fill('TEST Tavern Hero');
  await page.locator('[data-char-open-picker]').click();
  await page.locator('[data-char-class="ranger"][data-char-gender="female"]').click();
  await page.locator('[data-char-form] .login-btn').click();
  await expect(page.locator('.login-gate')).toHaveCount(0);
  expect(errors).toEqual([]);
  await expect(page.locator('.recovery-panel')).toBeVisible();
  await expect(page.locator('.recovery-code')).toHaveText(/[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/);
  const identity = await page.evaluate(() => JSON.parse(localStorage.getItem('pointy_auth_v1')).character.id);
  expect(await page.evaluate(() => Object.keys(window.qaRecords).filter(key => key.startsWith('users/')).length)).toBe(1);
  await page.evaluate(() => window.PointyProfileHub.showTour());
  await expect(page.locator('.recovery-panel')).toBeVisible();
  await expect(page.locator('.tour-overlay')).toHaveCount(0);
  await page.getByRole('button', { name: 'ฉันเก็บไว้แล้ว', exact: true }).click();
  await expect(page.locator('.tour-overlay')).toBeVisible(); await page.locator('.tour-skip').click();
  await page.reload(); await expect(page.locator('.login-gate')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pointy_auth_v1')).character.id)).toBe(identity);
  await page.locator('[data-profile-hub="profile"]').click(); await page.locator('[data-sign-out]').click();
  await expect(page.locator('[data-login-form]')).toBeVisible();
  await page.locator('[data-login-email]').fill('test.tavern'); await page.locator('[data-login-password]').fill('TEST-password-only');
  await page.locator('.login-btn').click(); await expect(page.locator('.login-gate')).toHaveCount(0);
  await page.reload(); await expect(page.locator('[data-char-form]')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pointy_auth_v1')).character.id)).toBe(identity);
});
