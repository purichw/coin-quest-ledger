import { expect, test } from '@playwright/test';
import { cert, deleteApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function uniqueTripId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function gotoFreshTrip(page, prefix = 'e2e') {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  const id = uniqueTripId(prefix);
  await page.goto(`/trip/?id=${id}&test=1`);
  await expect(page.getByText('รวมปาร์ตี้!')).toBeVisible();
  return id;
}

async function startAddHero(page) {
  const onboardingStart = page.getByRole('button', { name: /สร้างฮีโร่คนแรก/ });
  if (await onboardingStart.isVisible().catch(() => false)) {
    await onboardingStart.click();
  } else {
    await page.getByRole('button', { name: '＋ เพิ่มฮีโร่' }).click();
  }
}

async function chooseWarriorMale(page) {
  await page.getByRole('button', { name: '⚔️ เลือกฮีโร่ของคุณ' }).click();
  await page.locator('.picker-cell[data-class="warrior"][data-gender="male"]').click();
}

async function addWarrior(page, name) {
  await startAddHero(page);
  await page.getByPlaceholder('ตั้งชื่อฮีโร่ใหม่').fill(name);
  await chooseWarriorMale(page);
  await page.getByRole('button', { name: 'ยืนยันตัวละคร' }).click();
  await expect(page.getByRole('dialog', { name: /ยืนยันฮีโร่/ })).toBeVisible();
  await page.getByRole('button', { name: 'ยืนยันถาวร' }).click();
  await expect(page.locator('#party-grid')).toContainText(name);
}

const FIREBASE_WEB_API_KEY = 'AIzaSyBDDC1sJnITQOqyp1qiPGvB1KLuUH1B28o';
const REAL_FIREBASE_E2E = process.env.POINTY_REAL_FIREBASE_E2E === '1';

function serviceAccountFromEnv() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return null;
  return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
}

function adminTestApp() {
  const existing = getApps().find(app => app.name === 'pointy-real-e2e');
  if (existing) return existing;
  const account = serviceAccountFromEnv();
  if (!account) return null;
  return initializeApp({ credential: cert(account) }, 'pointy-real-e2e');
}

async function superAdminIdToken() {
  const app = adminTestApp();
  if (!app) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is required for real Firebase E2E.');
  const customToken = await getAuth(app).createCustomToken(`super-admin-e2e-${Date.now()}`, {
    email: 'purich.wc@gmail.com',
    email_verified: true
  });
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_WEB_API_KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  });
  const data = await res.json();
  if (!res.ok || !data.idToken) throw new Error(data.error?.message || 'Could not mint Super Admin ID token.');
  return data.idToken;
}

async function requestPermanentDelete(account, reason) {
  if (!account?.userId && !account?.uid) return null;
  const token = account.adminToken || await superAdminIdToken();
  const res = await fetch('https://coin-quest-ledger.vercel.app/api/admin-delete-user', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({
      uid: account.uid || '',
      userId: account.userId || '',
      username: account.username || '',
      characterIds: [account.characterId, ...(account.characterIds || [])].filter(Boolean),
      reason
    })
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function cleanupRealAccount(username, account = {}) {
  const token = account.adminToken || await superAdminIdToken().catch(() => '');
  if (!token) return;
  if (account.secondUid || account.secondUserId) {
    await requestPermanentDelete({
      adminToken: token,
      uid: account.secondUid,
      userId: account.secondUserId || account.userId,
      username,
      characterId: account.secondCharacterId || account.userId
    }, 'Automated E2E cleanup after recreate').catch(() => {});
  } else if (account.uid || account.userId) {
    await requestPermanentDelete({
      adminToken: token,
      uid: account.uid,
      userId: account.userId,
      username,
      characterId: account.characterId || account.userId
    }, 'Automated E2E cleanup after partial run').catch(() => {});
  }
}

async function enableRealAuth(page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function signUpRealAccount(page, username, password, displayName, heroName) {
  await enableRealAuth(page);
  await page.goto('/');
  await page.locator('[data-login-tab="up"]').click();
  await page.locator('[data-login-name]').fill(displayName);
  await page.locator('[data-login-email]').fill(username);
  await page.locator('[data-login-password]').fill(password);
  await page.locator('[data-login-password2]').fill(password);
  await page.locator('.login-btn').click();
  await expect(page.getByRole('heading', { name: /สร้างตัวละครของคุณ|Create your character/ })).toBeVisible({ timeout: 15_000 });
  await page.evaluate(async name => {
    const account = JSON.parse(localStorage.getItem('pointy_auth_v1') || '{}');
    const character = { id: account.userId, name, class: 'warrior', cls: 'warrior', gender: 'male', skin: '' };
    await firebase.firestore().collection('characters').doc(character.id).set({
      ...character,
      ownerUid: account.uid,
      userId: account.userId,
      username: account.username,
      accountName: account.name,
      updatedAt: Date.now(),
      createdAt: Date.now()
    }, { merge: true });
    await firebase.firestore().collection('users').doc(account.uid).set({
      character,
      characterId: character.id,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    localStorage.setItem('pointy_auth_v1', JSON.stringify({ ...account, character }));
    document.querySelector('.login-gate')?.remove();
    document.body.classList.remove('login-locked');
  }, heroName);
  await expect(page.locator('.login-gate')).toHaveCount(0, { timeout: 15_000 });
  return page.evaluate(() => JSON.parse(localStorage.getItem('pointy_auth_v1') || '{}'));
}

test.beforeEach(async ({ page }) => {
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));
  page.consoleErrors = consoleErrors;
});

test.afterEach(async ({ page }) => {
  expect(page.consoleErrors).toEqual([]);
});

test('expense splitter requires explicit hero choice and locks the confirmed character', async ({ page }) => {
  await gotoFreshTrip(page, 'hero-lock');
  await startAddHero(page);

  const confirm = page.getByRole('button', { name: 'ยืนยันตัวละคร' });
  await expect(confirm).toBeDisabled();

  await page.getByPlaceholder('ตั้งชื่อฮีโร่ใหม่').fill('Shane');
  await expect(confirm).toBeDisabled();

  await chooseWarriorMale(page);
  await expect(page.getByText('อัปโหลดรูป')).toHaveCount(0);
  await expect(confirm).toBeEnabled();
  await confirm.click();

  await expect(page.getByRole('dialog', { name: /ยืนยันฮีโร่/ })).toContainText('เปลี่ยนไม่ได้');
  await page.getByRole('button', { name: 'ยืนยันถาวร' }).click();

  await expect(page.locator('#party-count')).toHaveText('1');
  await expect(page.locator('#party-grid')).toContainText('Shane');
  await expect(page.locator('.char-id')).toHaveAttribute('href', /\/character\/\?id=\d{4}&test=1/);
  await expect(page.getByRole('button', { name: '⚔️ เลือกฮีโร่ของคุณ' })).toHaveCount(0);
});

test('expense splitter supports admin URL setup, character IDs, admin unlock, and quick toggles', async ({ page }) => {
  const originalId = await gotoFreshTrip(page, 'admin-setup');
  const takenSlug = `party-taken-${Math.random().toString(36).slice(2, 8)}`;
  const slug = `party-${Math.random().toString(36).slice(2, 10)}`;

  await page.evaluate(id => {
    sessionStorage.setItem(`pointy_test_trip_${id}`, JSON.stringify({ tripName: 'Taken trip' }));
  }, takenSlug);
  await page.getByRole('button', { name: /ตั้งค่าแอดมิน/ }).click();
  await page.locator('#admin-url-id').fill(takenSlug);
  await page.locator('#admin-pass-new').fill('hero-pass');
  await page.getByRole('button', { name: 'สร้างแอดมิน' }).click();
  await expect(page.getByText(`ID/URL ${takenSlug} ถูกใช้แล้ว`)).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/trip/\\?id=${originalId}&test=1$`));

  await page.locator('#admin-url-id').fill(slug);
  await page.locator('#admin-pass-new').fill('hero-pass');
  await page.getByRole('button', { name: 'สร้างแอดมิน' }).click();
  await expect(page).toHaveURL(new RegExp(`/trip/\\?id=${slug}&test=1$`));
  await page.locator('.picker-close').click();

  await addWarrior(page, 'Shane');
  await expect(page.locator('#party-grid')).toContainText(/#\d{4}/);

  await page.locator('#quick-toggles button').nth(1).click();
  await expect(page.locator('body')).toHaveClass(/no-animations/);
  await page.locator('#quick-toggles button').first().click();
  await expect(page.locator('#quick-toggles button').first()).toHaveAttribute('aria-pressed', 'false');
  await page.waitForTimeout(900);
  await expect(page.locator('#save-status')).toContainText('บันทึกแล้ว');

  await page.evaluate(() => {
    Object.keys(sessionStorage)
      .filter(key => key.startsWith('pointy_admin_unlocked_'))
      .forEach(key => sessionStorage.removeItem(key));
    localStorage.removeItem('pointy_admin_owner_token_v1');
  });
  await expect(page.locator('#party-grid')).toContainText('Shane');
  await expect(page.locator('#party-grid')).toContainText(/#\d{4}/);

  await page.getByLabel('Settings').click();
  await expect(page.getByText('ปลดล็อกเพื่อดูและแก้ไขข้อมูลแอดมิน')).toBeVisible();
  await page.locator('#admin-pass').fill('hero-pass');
  await page.getByRole('button', { name: 'ปลดล็อก' }).click();
  await expect(page.locator('.admin-table')).toContainText('Shane');
});

test('expense splitter starts new trips with a 4 digit URL and creator admin', async ({ page }) => {
  await gotoFreshTrip(page, 'new-url');
  await addWarrior(page, 'Shane');

  await page.getByRole('button', { name: /ออกเดินทางใหม่/ }).click();
  await expect(page.getByText('กำหนด URL เกมเป็นเลข 4 หลัก')).toBeVisible();
  await expect(page.locator('#new-trip-code')).toHaveValue(/\d{4}/);
  await expect(page.locator('#new-trip-admin-pass')).toHaveValue(/\d{6}/);

  await page.evaluate(() => {
    sessionStorage.setItem('pointy_test_trip_2468', JSON.stringify({ tripName: 'Existing trip' }));
  });
  await page.locator('#new-trip-code').fill('2468');
  await page.locator('#new-trip-admin-pass').fill('captain-2468');
  await page.getByRole('button', { name: /เริ่มทริปใหม่/ }).click();
  await expect(page.getByText('ID/URL 2468 ถูกใช้แล้ว')).toBeVisible();
  await expect(page).not.toHaveURL(/\/trip\/\?id=2468&test=1$/);

  await page.locator('#new-trip-code').fill('2469');
  await page.getByRole('button', { name: /เริ่มทริปใหม่/ }).click();

  await expect(page).toHaveURL(/\/trip\/\?id=2469&test=1$/);
  await expect(page.getByText('รวมปาร์ตี้!')).toBeVisible();

  const admin = await page.evaluate(() => {
    const raw = sessionStorage.getItem('pointy_test_trip_2469');
    return raw ? JSON.parse(raw).admin : null;
  });
  expect(admin?.passwordHash).toBeTruthy();
  expect(admin?.ownerHash).toBeTruthy();
  expect(admin?.urlLocked).toBe(true);

  await page.getByRole('button', { name: /ตั้งค่าแอดมิน/ }).click();
  await expect(page.locator('.admin-table')).toBeVisible();
  await page.getByRole('button', { name: 'ล็อกแอดมิน' }).click();
  await expect(page.getByText('ปลดล็อกเพื่อดูและแก้ไขข้อมูลแอดมิน')).toBeVisible();
  await page.locator('#admin-pass').fill('captain-2468');
  await page.getByRole('button', { name: 'ปลดล็อก' }).click();
  await expect(page.locator('.admin-table')).toBeVisible();

  await page.locator('.picker-close').click();
  await page.getByRole('button', { name: /ออกเดินทางใหม่/ }).click();
  await page.locator('#new-trip-code').fill('2470');
  await page.locator('#new-trip-admin-pass').fill('captain-2470');
  await page.getByRole('button', { name: /เริ่มทริปใหม่/ }).click();
  await expect(page).toHaveURL(/\/trip\/\?id=2470&test=1$/);

  const secondAdmin = await page.evaluate(() => {
    const raw = sessionStorage.getItem('pointy_test_trip_2470');
    return raw ? JSON.parse(raw).admin : null;
  });
  expect(secondAdmin?.ownerHash).toBe(admin.ownerHash);

  await page.getByRole('button', { name: /ตั้งค่าแอดมิน/ }).click();
  await expect(page.locator('.admin-table')).toBeVisible();
  await expect(page.locator('.owned-board-list')).toContainText('2469');
  await expect(page.locator('.owned-board-list')).toContainText('2470');
  await expect(page.locator('.owned-board-list')).toContainText('บอร์ดปัจจุบัน');

  await page.evaluate(() => {
    Object.keys(sessionStorage)
      .filter(key => key.startsWith('pointy_admin_'))
      .forEach(key => sessionStorage.removeItem(key));
    localStorage.removeItem('pointy_admin_owner_token_v1');
  });
  await page.getByRole('button', { name: 'ล็อกแอดมิน' }).click();
  await expect(page.getByText('ปลดล็อกเพื่อดูและแก้ไขข้อมูลแอดมิน')).toBeVisible();
  await page.locator('#admin-pass').fill('captain-2470');
  await page.getByRole('button', { name: 'ปลดล็อก' }).click();
  await expect(page.locator('.admin-table')).toBeVisible();
});

test('expense splitter exposes 18 avatar classes and persists archfiend skins', async ({ page }) => {
  const tripId = await gotoFreshTrip(page, 'avatar-skins');
  await startAddHero(page);
  await page.getByPlaceholder('ตั้งชื่อฮีโร่ใหม่').fill('Regent');
  await page.getByRole('button', { name: '⚔️ เลือกฮีโร่ของคุณ' }).click();

  await expect(page.locator('.picker-cell[data-class][data-gender="male"]')).toHaveCount(18);
  await expect(page.locator('.picker-cell[data-class][data-gender="female"]')).toHaveCount(18);
  await page.locator('.picker-cell[data-class="archfiend"][data-gender="male"]').click();
  await page.getByRole('button', { name: 'ยืนยันตัวละคร' }).click();
  await page.getByRole('button', { name: 'ยืนยันถาวร' }).click();

  await expect(page.locator('.hc-skin')).toHaveCount(1);
  await page.locator('.hc-skin').click();
  await expect(page.locator('.skin-pop')).toContainText('ดั้งเดิม');
  await expect(page.locator('.skin-pop')).toContainText('ราชันเลือด');
  await expect(page.locator('.skin-pop')).toContainText('อาร์คฟีนด์นักว่ายน้ำ');
  await expect(page.locator('.skin-pop')).toContainText('อาร์คฟีนด์นักว่ายน้ำดำแดง');
  await page.locator('.skin-opt', { hasText: 'ราชันเลือด' }).click();

  await expect(page.locator('.portrait-img').first()).toHaveAttribute('src', /crimson-regent-male\.png$/);
  await expect(page.locator('.chip-avatar img').first()).toHaveAttribute('src', /crimson-regent-male\.png$/);
  const fallback = await page.evaluate(() => window.resolveAvatarFile('archfiend-male', 'bogus'));
  expect(fallback).toMatch(/archfiend-male\.png$/);

  await page.waitForTimeout(900);
  const savedSkin = await page.evaluate(id => {
    const raw = sessionStorage.getItem(`pointy_test_trip_${id}`);
    return raw ? JSON.parse(raw).heroSkins?.Regent : null;
  }, tripId);
  expect(savedSkin).toBe('crimson-regent');

  await page.locator('.hc-skin').click();
  await page.getByRole('button', { name: 'อาร์คฟีนด์นักว่ายน้ำ', exact: true }).click();
  await expect(page.locator('.portrait-img').first()).toHaveAttribute('src', /archfiend-swimmer-male\.png$/);
  await expect(page.locator('.portrait-img').first()).toHaveClass(/portrait-img/);
  await page.locator('.hc-skin').click();
  await page.getByRole('button', { name: 'อาร์คฟีนด์นักว่ายน้ำดำแดง', exact: true }).click();
  await expect(page.locator('.portrait-img').first()).toHaveAttribute('src', /archfiend-swimmer-blackred-male\.png$/);
  await expect(page.locator('.portrait-img').first()).toHaveClass(/portrait-img/);
});

test('expense splitter supports duplicate avatars, multi-payer exact split, settlement XP, and victory', async ({ page }) => {
  await gotoFreshTrip(page, 'expense-math');
  await addWarrior(page, 'Shane');

  await startAddHero(page);
  await page.getByPlaceholder('ตั้งชื่อฮีโร่ใหม่').fill('Pointy');
  await page.getByRole('button', { name: '⚔️ เลือกฮีโร่ของคุณ' }).click();
  const duplicateWarrior = page.locator('.picker-cell[data-class="warrior"][data-gender="male"]');
  await expect(duplicateWarrior).toContainText('ถูกเลือกแล้ว');
  await duplicateWarrior.click();
  await page.getByRole('button', { name: 'ยืนยันตัวละคร' }).click();
  await page.getByRole('button', { name: 'ยืนยันถาวร' }).click();

  await expect(page.locator('#party-count')).toHaveText('2');

  await page.locator('#exp-desc').fill('Dinner');
  await page.locator('.qf-top .icon-btn').click();
  await expect(page.locator('.icon-pop.labeled')).toBeVisible();
  await expect(page.locator('.icon-opt .qi')).toHaveCount(18);
  await expect(page.locator('.io-lab', { hasText: 'อาหาร' })).toBeVisible();
  await page.locator('.icon-opt', { hasText: 'กาแฟ' }).click();
  await expect(page.locator('.qf-top .icon-btn .qi')).toBeVisible();
  await page.locator('#exp-amount').fill('1000');
  await page.getByRole('button', { name: '✓ ทั้งปาร์ตี้' }).click();
  await page.getByRole('button', { name: 'ระบุเอง' }).click();
  await page.locator('.weight-value[data-name="Shane"]').fill('300');
  await page.locator('.weight-value[data-name="Pointy"]').fill('700');
  await page.getByRole('button', { name: '＋ หลายคนจ่าย' }).click();
  await page.locator('.payer-value[data-name="Shane"]').fill('600');
  await page.locator('.payer-value[data-name="Pointy"]').fill('400');
  await page.getByRole('button', { name: '⚔️ บันทึกเควส' }).click();

  await expect(page.locator('#party-total')).toHaveText('฿1,000');
  await expect(page.locator('#quest-log')).toContainText('Shane ฿300');
  await expect(page.locator('#quest-log')).toContainText('Pointy ฿700');
  await expect(page.locator('#quest-log')).toContainText('+300 XP');
  await expect(page.locator('#party-grid')).toContainText('ผู้พิทักษ์');
  await expect(page.locator('#party-grid')).toContainText('+฿300');
  await expect(page.locator('#party-grid')).toContainText('ติดหนี้');
  await expect(page.locator('#party-grid')).toContainText('−฿300');
  await expect(page.locator('#settle-body')).toContainText('฿300');

  await page.getByRole('button', { name: /ส่งบรรณาการ/ }).click();
  await expect(page.getByText('ตั้งพร้อมเพย์ของผู้รับก่อนสร้าง QR')).toBeVisible();
  await page.locator('#promptpay-input').fill('0812345678');
  await page.getByRole('button', { name: 'บันทึกพร้อมเพย์' }).click();
  await expect(page.getByText('สแกนเพื่อจ่าย')).toBeVisible();
  await expect(page.locator('.qr-svg')).toBeVisible();
  await page.getByRole('button', { name: /ยืนยันชำระแล้ว/ }).click();
  await expect(page.locator('#settle-body')).toContainText('ปาร์ตี้สมดุลแล้ว');
  await expect(page.getByText('ผ่านเควสแล้ว!')).toBeVisible();
  await expect(page.locator('#party-grid')).toContainText('500/600');
  await expect(page.locator('#party-grid')).toContainText('400/600');
});

test('expense splitter supports itemized loot split, receipt date, and quest board campaigns', async ({ page }) => {
  await gotoFreshTrip(page, 'loot-board');
  await addWarrior(page, 'Shane');
  await addWarrior(page, 'Pointy');

  await page.locator('#exp-desc').fill('Market loot');
  await page.getByRole('button', { name: 'แยกของ' }).click();
  await page.locator('.loot-name').first().fill('Sushi');
  await page.locator('.loot-amount').first().fill('300');
  await page.locator('.loot-row').first().getByRole('button', { name: /Shane/ }).click();
  await page.getByRole('button', { name: /เพิ่มของ/ }).click();
  await page.locator('.loot-name').nth(1).fill('Snacks');
  await page.locator('.loot-amount').nth(1).fill('100');
  await expect(page.locator('#exp-amount')).toHaveValue('400');
  await page.locator('#exp-date').fill('2026-06-14T18:30');
  await page.getByRole('button', { name: '⚔️ บันทึกเควส' }).click();

  await expect(page.locator('#quest-log')).toContainText('แยกของ');
  await expect(page.locator('#quest-log')).toContainText('Shane ฿350');
  await expect(page.locator('#quest-log')).toContainText('Pointy ฿50');
  await expect(page.locator('#party-total')).toHaveText('฿400');

  await page.getByRole('button', { name: /กระดานเควส/ }).click();
  await expect(page.getByText('กระดานเควส').last()).toBeVisible();
  await expect(page.locator('.board-card')).toHaveCount(1);
  await page.getByRole('button', { name: /เริ่มทริปใหม่/ }).click();
  await expect(page.getByText('กำหนด URL เกมเป็นเลข 4 หลัก')).toBeVisible();
  await expect(page.locator('#new-trip-code')).toHaveValue(/\d{4}/);
  await page.locator('#new-trip-code').fill('1357');
  await page.getByRole('button', { name: /เริ่มทริปใหม่/ }).click();
  await expect(page).toHaveURL(/\/trip\/\?id=1357&test=1$/);
  await expect(page.getByText('รวมปาร์ตี้!')).toBeVisible();
});

test('expense splitter imports text, switches settings, and avoids mobile overflow', async ({ page }) => {
  await gotoFreshTrip(page, 'import-settings');
  await addWarrior(page, 'Shane');
  await addWarrior(page, 'Pointy');

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'ดันเจียน' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dungeon');
  await page.locator('.picker-close').click();

  await page.getByRole('button', { name: 'นำเข้ารายการ' }).click();
  await page.locator('#import-text').fill('Coffee, 120\nTaxi; 240\nBad line');
  await expect(page.locator('#import-count')).toHaveText('อ่านได้ 2 รายการ');
  await page.getByRole('button', { name: '📥 นำเข้าข้อความ' }).click();
  await expect(page.locator('#expense-count')).toHaveText('2');
  await expect(page.locator('#party-total')).toHaveText('฿360');

  await page.getByRole('button', { name: '📎 แนบใบเสร็จ' }).click();
  await expect(page.getByRole('menuitem', { name: '📷 เปิดกล้อง' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: '🖼️ เลือกจากคลัง' })).toBeVisible();
  await expect(page.locator('#receipt-camera-input')).toHaveAttribute('capture', 'environment');
  await expect(page.locator('#receipt-library-input')).not.toHaveAttribute('capture');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
  const portraitFits = await page.evaluate(() => [...document.querySelectorAll('.portrait-img')].every(img => {
    const r = img.getBoundingClientRect();
    const p = img.parentElement.getBoundingClientRect();
    return r.left >= p.left - 3 && r.right <= p.right + 3 && r.bottom <= p.bottom + 14;
  }));
  expect(portraitFits).toBe(true);
});

test('Debt Dragon tracks strikes, tactics, character ID, and mobile layout', async ({ page }) => {
  await page.goto('/debt/?test=1');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'มังกรหนี้' })).toBeVisible();
  await expect(page.locator('.dragon-card')).toHaveCount(4);
  await expect(page.locator('.dragon-png').first()).toHaveAttribute('src', /assets\/debt-dragons\/card\.png$/);
  await expect(page.getByRole('button', { name: /ข้ามเดือน/ })).toBeVisible();

  await page.getByRole('button', { name: 'สร้าง ID' }).click();
  await expect(page.locator('.char-id-link')).toHaveText(/#\d{4}/);
  await page.locator('#slayer-name').fill('Pointy Slayer');

  await page.locator('.dragon-card').first().getByRole('button', { name: /จู่โจม/ }).click();
  await expect(page.locator('.dc-move')).toHaveCount(3);
  await page.locator('.dragon-card').first().locator('.dc-move', { hasText: 'สายฟ้า' }).click();
  await page.locator('.dragon-card').first().locator('input[type="number"]').first().fill('1000');
  await page.locator('.dragon-card').first().locator('input[type="date"]').fill('2026-06-14');
  await page.locator('.dragon-card').first().locator('.btn-danger').click();
  await expect(page.locator('.dragon-card').first()).toContainText('฿57,000');
  await expect(page.locator('.dragon-card').first()).toContainText('14 มิ.ย.');
  await expect(page.locator('.record-panel')).toContainText('฿1,000');

  await page.locator('.dragon-card').first().locator('.dc-log-row').click();
  await page.locator('.dragon-card').first().locator('.dc-le-amt input').fill('1200');
  await page.locator('.dragon-card').first().locator('.dc-le-save').click();
  await expect(page.locator('.dragon-card').first()).toContainText('฿56,800');

  await page.getByRole('button', { name: /โจมตอนนี้/ }).click();
  await expect(page.locator('.dragon-card').first().locator('.dc-strike-form')).toBeVisible();
  await page.locator('.dragon-card').first().locator('.btn-ghost').last().click();
  await page.getByRole('button', { name: /ล้มทีละตัว/ }).click();
  await expect(page.locator('.tactic-opt').nth(1)).toHaveClass(/on/);
  await page.getByRole('button', { name: /ถล่มดอกเบี้ย/ }).click();
  await page.locator('#power-attack').evaluate(el => {
    el.value = '1000';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('.forecast-panel')).toContainText('เร็วขึ้น');
  await expect(page.locator('.forecast-panel')).toContainText('โจม');

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pointy_test_debt_v1')));
  expect(saved.dragons[0].balance).toBe(56800);
  expect(saved.dragons[0].log[0].amount).toBe(1200);
  expect(saved.slayer.characterId).toMatch(/^\d{4}$/);

  const profileHref = await page.locator('.char-id-link').getAttribute('href');
  await page.goto(profileHref);
  await expect(page.locator('.portrait-info')).toContainText('Pointy Slayer');
  await expect(page.locator('.badges')).toContainText('นักล่ามังกร');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/debt/?test=1');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});

test('super admin portal saves drafts, publishes board edits, and records revisions', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('pointy_test_trip_9001', JSON.stringify({
      tripName: 'Alpha Board',
      participants: ['Shane'],
      characterIds: { Shane: '1111' },
      expenses: [],
      admin: { ownerHash: 'owner-a', adminId: 'ADM-ALPHA', adminName: 'Alpha Admin', passwordHash: 'old-hash', urlLocked: true },
      updatedAt: 100
    }));
  });
  await page.goto('/admin/?test=1');
  await page.locator('#gate-pass').fill('portal-pass');
  await page.getByRole('button', { name: 'Set & Unlock' }).click();

  await expect(page.locator('input[value="Alpha Board"]')).toBeVisible();
  await page.locator('input[value="Alpha Board"]').fill('Beta Board');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('button', { name: 'ปิด' }).click();
  await expect(page.evaluate(() => localStorage.getItem('pointy_super_admin_draft_v2'))).resolves.toContain('Beta Board');

  await page.getByRole('button', { name: 'Restore' }).click();
  await page.getByRole('button', { name: 'ยืนยัน' }).click();
  await expect(page.locator('input[value="Alpha Board"]')).toBeVisible();

  await page.locator('input[value="9001"]').fill('9002');
  await page.locator('input[value="Alpha Board"]').fill('Gamma Board');
  await page.getByRole('button', { name: /Publish/ }).click();
  await page.getByRole('button', { name: 'ยืนยัน' }).click();

  await expect(page.evaluate(() => sessionStorage.getItem('pointy_test_trip_9001'))).resolves.toBeNull();
  await expect(page.evaluate(() => JSON.parse(sessionStorage.getItem('pointy_test_trip_9002')).tripName)).resolves.toBe('Gamma Board');
  await page.getByRole('button', { name: 'Version Control' }).click();
  await expect(page.locator('.rev summary')).toContainText('changes');
  await page.locator('.rev summary').click();
  await expect(page.locator('.rev-list')).toContainText('URL 9001');
});

test('super admin portal renders relationship views and drill-in details', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('pointy_admin_fixture_seeded') === '1') return;
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('pointy_admin_fixture_seeded', '1');
    sessionStorage.setItem('pointy_test_trip_9001', JSON.stringify({
      tripName: 'Alpha Board',
      participants: ['Shane', 'Mira'],
      characterIds: { Shane: '1111', Mira: '2222' },
      expenses: [{ amount: 1200 }],
      admin: { ownerHash: 'owner-a', adminId: 'ADM-ALPHA', adminName: 'Shane', characterId: '1111', passwordHash: 'old-hash', urlLocked: true },
      updatedAt: 100
    }));
    sessionStorage.setItem('pointy_test_trip_9002', JSON.stringify({
      boardType: 'debt',
      tripName: 'Dragon Lair',
      participants: ['Nok'],
      characterIds: { Nok: '3333' },
      dragons: [{ balance: 5000, dueDay: 1 }],
      admin: { ownerHash: 'owner-b', adminId: 'ADM-DRAGON', adminName: 'Nok', characterId: '3333', passwordHash: 'old-hash', urlLocked: true },
      updatedAt: 200
    }));
  });
  await page.goto('/admin/?test=1');
  await page.locator('#gate-pass').fill('portal-pass');
  await page.getByRole('button', { name: 'Set & Unlock' }).click();

  await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Relationship Map' })).toBeVisible();
  await expect(page.locator('input[value="Alpha Board"]')).toBeVisible();

  await page.getByRole('button', { name: 'Relationship Map' }).click();
  await expect(page.locator('.panel')).toContainText('Global User ID');
  await expect(page.locator('.panel')).toContainText('Admin IDs');

  await page.getByRole('button', { name: 'Dashboard' }).click();
  await expect(page.locator('.stat-card').first()).toContainText('Boards');
  await page.getByRole('button', { name: 'B Command' }).click();
  await expect(page.getByText('Needs Attention')).toBeVisible();

  await page.getByRole('button', { name: 'Boards' }).click();
  await page.getByRole('button', { name: 'Detail' }).first().click();
  await expect(page.getByText('Members')).toBeVisible();
  await expect(page.getByText('Change Log')).toBeVisible();
  await expect(page.locator('.id-chip.board')).toBeVisible();

  await page.getByRole('button', { name: 'Users' }).click();
  const adminProfileLink = page.getByRole('link', { name: 'Profile' }).first();
  await expect(adminProfileLink).toHaveAttribute('href', /\/character\/\?(.+&)?from=admin/);
  await adminProfileLink.click();
  await expect(page).toHaveURL(/\/character\/\?(.+&)?from=admin/);
  await expect(page.getByRole('heading', { name: 'Shane' })).toBeVisible();
  await page.getByRole('link', { name: /กลับ|Back/ }).click();
  await expect(page).toHaveURL(/\/admin\/\?(.+&)?tab=users/);
  await expect(page.getByRole('heading', { name: 'Users', level: 1 })).toBeVisible();

  await page.getByRole('button', { name: 'Detail' }).first().click();
  await expect(page.getByText('User Profile')).toBeVisible();
  await page.getByRole('button', { name: /Lifecycle/ }).first().click();
  await expect(page.getByText('Account lifecycle')).toBeVisible();
  await page.getByRole('button', { name: 'Deactivate' }).click();
  await page.locator('#lifecycle-reason').fill('Support audit check');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('deactivated').first()).toBeVisible();
  await page.getByRole('button', { name: 'Reactivate' }).click();
  await page.locator('#lifecycle-reason').fill('Support audit check complete');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('active').first()).toBeVisible();
  await page.getByRole('button', { name: 'Request delete' }).click();
  await page.locator('#delete-reason').fill('Permanent delete request audit');
  await page.locator('#delete-confirm').fill('DELETE 1111');
  await page.getByRole('button', { name: 'Request permanent delete' }).click();
  await expect(page.getByText('delete requested').first()).toBeVisible();
  await page.getByRole('button', { name: /Admin roles/ }).click();
  await expect(page.getByRole('heading', { name: 'Admin roles' })).toBeVisible();

  await page.getByRole('button', { name: 'Board Admins' }).click();
  await page.getByRole('button', { name: 'Detail' }).first().click();
  await expect(page.getByText('Admin Detail')).toBeVisible();
  await expect(page.getByText('Owned Boards')).toBeVisible();

  await page.getByRole('button', { name: 'Audit Log' }).click();
  await expect(page.getByText('Every change across the system')).toBeVisible();
  await page.getByRole('button', { name: 'Support Tools' }).click();
  await expect(page.getByText('Impersonate')).toBeVisible();
  await expect(page.getByText('Create / invite flows')).toBeVisible();
});

test('character profile aggregates boards, shows portrait, and supports privacy mode', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('pointy_character_registry_v1', JSON.stringify({
      '1111': { id: '1111', name: 'Shane', class: 'archfiend', gender: 'male', skin: 'archfiend-swimmer-blackred', xp: 900, createdAt: 100, updatedAt: 300 }
    }));
    sessionStorage.setItem('pointy_test_trip_9001', JSON.stringify({
      tripName: 'Alpha Board',
      participants: ['Shane', 'Pointy'],
      characterIds: { Shane: '1111', Pointy: '2222' },
      heroClasses: { Shane: 'archfiend', Pointy: 'warrior' },
      heroGenders: { Shane: 'male', Pointy: 'female' },
      heroSkins: { Shane: 'archfiend-swimmer-blackred' },
      expenses: [{ id: 1, amount: 1000, paidBy: 'Shane', sharedBy: ['Shane', 'Pointy'] }],
      settleXp: { Shane: 400 },
      admin: { adminId: 'ADM-ALPHA', adminName: 'Shane' },
      updatedAt: 200
    }));
  });
  await page.goto('/character/?id=1111&test=1');

  await expect(page.getByRole('heading', { name: 'Shane' })).toBeVisible();
  await expect(page.locator('.char-id')).toHaveText('#1111');
  await expect(page.locator('.portrait-stage img')).toHaveAttribute('src', /archfiend-swimmer-blackred-male\.png/);
  await expect(page.locator('.grid > .panel').filter({ hasText: 'ประวัติบอร์ด' }).getByRole('link', { name: 'Alpha Board' })).toBeVisible();
  await expect(page.locator('.badges')).toContainText('แอดมินบอร์ด');
  await expect(page.locator('.summary')).toContainText('฿1,000');

  await page.getByRole('button', { name: 'ซ่อนยอดเงิน' }).click();
  await expect(page.locator('body')).toHaveClass(/money-hidden/);
  await expect(page.getByRole('button', { name: 'แสดงยอดเงิน' })).toBeVisible();
  await expect(page).toHaveURL(/private=1/);
  await expect(page.locator('.summary')).toContainText('••••');

  await page.getByRole('button', { name: 'EN' }).click();
  await expect(page.locator('.brand')).toContainText('Character Profile');
  await expect(page.locator('.badges')).toContainText('Board Admin');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});

test('profile hub completes character creation and links to the full character profile', async ({ page }) => {
  await page.addInitScript(() => {
    if (location.pathname !== '/') return;
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('pointy_auth_v1', JSON.stringify({
      email: 'fresh@line.me',
      userId: '4444',
      name: 'Fresh'
    }));
  });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /สร้างตัวละครของคุณ|Create your character/ })).toBeVisible();
  await expect(page.getByText(/แตะเลือกฮีโร่|Tap to choose your hero/)).toBeVisible();
  await page.locator('[data-char-open-picker]').click();
  await expect(page.getByRole('dialog', { name: /เลือกฮีโร่ของคุณ|Choose your hero/ })).toBeVisible();
  await page.locator('[data-picker-gender="female"]').click();
  await page.locator('[data-char-class="ranger"][data-char-gender="female"]').click();
  await page.locator('[data-char-name]').fill('Fresh Ranger');
  await page.getByRole('button', { name: /เริ่มผจญภัย|Begin the adventure/ }).click();

  await expect(page.locator('.login-gate')).toHaveCount(0);
  const auth = await page.evaluate(() => JSON.parse(localStorage.getItem('pointy_auth_v1') || '{}'));
  expect(auth.character).toMatchObject({ id: '4444', name: 'Fresh Ranger', class: 'ranger', gender: 'female' });
  const registry = await page.evaluate(() => JSON.parse(localStorage.getItem(window.PointyScope.key('pointy_character_registry_v1')) || '{}'));
  expect(registry['4444']).toMatchObject({ name: 'Fresh Ranger', class: 'ranger', gender: 'female' });

  const profileBadge = page.locator('[data-profile-hub="profile"]');
  if (await profileBadge.isVisible().catch(() => false)) {
    await profileBadge.click();
  } else {
    await page.locator('.tb-burger').click();
    await page.locator('[data-mm-action="profile"]').click();
  }
  await expect(page.locator('.profile-drawer')).toBeVisible();
  await expect(page.locator('.profile-drawer')).toContainText('Fresh Ranger');
  await expect(page.locator('.pd-fullprofile')).toHaveAttribute('href', /\/character\/\?id=4444/);
  await expect(page.locator('.pd-boards')).toBeVisible();

  await page.locator('.pd-fullprofile').click();
  await expect(page).toHaveURL(/\/character\/\?id=4444/);
  await expect(page.getByRole('heading', { name: 'Fresh Ranger' })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});

test('real Firebase account can be permanently deleted and recreated with the same username and ID', async ({ page, browser }, testInfo) => {
  test.setTimeout(120_000);
  test.skip(testInfo.project.name !== 'chromium', 'Real Firebase E2E runs once to avoid creating duplicate live accounts.');
  test.skip(!REAL_FIREBASE_E2E || !serviceAccountFromEnv(), 'Set POINTY_REAL_FIREBASE_E2E=1 and FIREBASE_SERVICE_ACCOUNT_JSON to run live account lifecycle E2E.');

  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const username = `e2e.reuse.${suffix}`;
  const password = `Reuse-${suffix}`;
  const seen = {};

  try {
    const first = await signUpRealAccount(page, username, password, 'E2E Reuse', 'E2E First Hero');
    seen.uid = first.uid;
    seen.userId = first.userId;
    seen.characterId = first.character?.id;
    expect(first.username).toBe(username);
    expect(first.userId).toMatch(/^\d{4}$/);
    expect(first.character).toMatchObject({ id: first.userId, name: 'E2E First Hero', class: 'warrior', gender: 'male' });

    seen.adminToken = await superAdminIdToken();
    const { res: deleteRes, data: deleted } = await requestPermanentDelete({
      adminToken: seen.adminToken,
      uid: first.uid,
      userId: first.userId,
      username,
      characterId: first.character.id
    }, 'Automated E2E recreate same username and ID');
    expect(deleteRes.ok, JSON.stringify(deleted)).toBe(true);
    expect(deleted).toMatchObject({ ok: true, deleted: true, userId: first.userId, username });
    expect(deleted.results.usernameDoc).toBe('tombstoned');

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    secondPage.consoleErrors = [];
    secondPage.on('console', msg => {
      if (msg.type() === 'error') secondPage.consoleErrors.push(msg.text());
    });
    secondPage.on('pageerror', err => secondPage.consoleErrors.push(err.message));
    const second = await signUpRealAccount(secondPage, username, password, 'E2E Reuse Again', 'E2E Second Hero');
    seen.secondUid = second.uid;
    seen.secondUserId = second.userId;
    seen.secondCharacterId = second.character?.id;
    expect(second.username).toBe(username);
    expect(second.uid).not.toBe(first.uid);
    expect(second.userId).toBe(first.userId);
    expect(second.character).toMatchObject({ id: first.userId, name: 'E2E Second Hero', class: 'warrior', gender: 'male' });
    expect(secondPage.consoleErrors).toEqual([]);
    await secondContext.close();
  } finally {
    await cleanupRealAccount(username, seen);
    const app = adminTestApp();
    if (app) await deleteApp(app).catch(() => {});
  }
});

test('profile hub scopes progress to the signed-in account instead of stale browser data', async ({ page }) => {
  await page.addInitScript(() => {
    if (location.pathname !== '/') return;
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('pointy_profile_v1', JSON.stringify({ streak: 9, bestStreak: 12 }));
    localStorage.setItem('pointy_debt_v5', JSON.stringify({ dragons: [{ id: 'old', name: 'Old Dragon', balance: 0, slain: true, log: [{ amount: 40000 }] }], stats: {} }));
    localStorage.setItem('pointy_treasury_v1', JSON.stringify({ stats: { monthsWon: 4, logged: 50, onTime: 20 }, expenses: [{ amount: 12000 }] }));
    localStorage.setItem('coin_quest_trip_snapshots_v1', JSON.stringify({
      old: { id: 'old', data: { participants: ['Pointy'], characterIds: { Pointy: '3720' }, expenses: [{ paidBy: 'Pointy', amount: 9000, sharedBy: ['Pointy'] }], completedAt: Date.now() } }
    }));
    localStorage.setItem('pointy_auth_v1', JSON.stringify({
      uid: 'fresh-scope-uid',
      username: 'freshscope',
      email: 'freshscope@coinquest.local',
      userId: '5555',
      name: 'Fresh Scope',
      character: { id: '5555', name: 'Fresh Scope', class: 'ranger', cls: 'ranger', gender: 'female' }
    }));
  });
  await page.goto('/');

  const scoped = await page.evaluate(() => window.PointyProfileHub.computeProfile());
  expect(scoped.renown).toBe(0);
  expect(scoped.level.lvl).toBe(1);
  expect(scoped.streak).toBeGreaterThanOrEqual(0);
  expect(scoped.streak).toBeLessThan(9);

  const homeText = await page.locator('#home-renown').innerText();
  expect(homeText).toContain('LV 1');
  expect(homeText).toMatch(/0\s+(Renown|ชื่อเสียง)/);
});

test('price comparison page loads and ranks normalized unit prices', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?view=compare&test=1');

  await expect(page.getByRole('button', { name: /หน้าหลัก|Home/ })).toBeVisible();
  await expect(page.locator('#cmp-grid')).toBeVisible();
  await expect(page.locator('.cmp-icon .qi').first()).toBeVisible();

  await page.locator('.add-cmp').scrollIntoViewIfNeeded();
  await page.locator('.add-cmp').click();
  await page.locator('.add-cmp-open .icon-btn').click();
  await expect(page.locator('.icon-pop.labeled')).toBeVisible();
  await expect(page.locator('.icon-opt .qi')).toHaveCount(12);
  await expect(page.locator('.io-lab').filter({ hasText: /^นม$/ })).toBeVisible();
  await page.locator('.icon-opt', { hasText: 'ผงซักฟอก' }).click();
  await expect(page.locator('.add-cmp-open .icon-btn .qi')).toBeVisible();

  const ranked = await page.evaluate(() => {
    const cmp = { baseUnit: 'มล.' };
    return rankOffers([
      { merchant: 'A', price: 200, qty: 850, unit: 'มล.' },
      { merchant: 'B', price: 100, qty: 300, unit: 'มล.' },
    ], cmp).map(offer => ({ merchant: offer.merchant, isBest: offer.isBest, pu: offer.pu }));
  });

  expect(ranked[0].merchant).toBe('A');
  expect(ranked[0].isBest).toBe(true);
  expect(ranked[0].pu).toBeLessThan(ranked[1].pu);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});

test('home view opens user modules and treasury logs expenses', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/?test=1');

  await expect(page.getByRole('heading', { name: 'Coin Quest Ledger' })).toBeVisible();
  await expect(page.locator('[data-home-card="compare"]')).toBeVisible();
  await expect(page.locator('[data-home-card="treasury"]')).toBeVisible();

  await page.locator('[data-home-card="compare"]').click();
  await expect(page).toHaveURL(/view=compare/);
  await expect(page.locator('#cmp-grid')).toBeVisible();
  await page.getByRole('button', { name: /หน้าหลัก|Home/ }).click();
  await expect(page.locator('[data-home-card="split"]')).toBeVisible();

  await page.locator('[data-home-card="treasury"]').click();
  await expect(page).toHaveURL(/\/treasury\/$/);
  await expect(page.getByRole('heading', { name: /คลังหลวง|Personal Treasury/ })).toBeVisible();
  await expect(page.getByText(/พยากรณ์สิ้นเดือน|Month forecast/)).toBeVisible();

  await page.getByRole('button', { name: /บันทึกรายจ่าย|Log an expense/ }).first().click();
  await page.locator('#expense-amount').fill('123');
  await page.locator('#expense-note').fill('E2E snack');
  await page.getByRole('button', { name: /ลงบันทึก|Log it/ }).click();
  await expect(page.locator('#toast')).toContainText(/บันทึกแล้ว|Logged/);

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pointy_treasury_v1') || '{}'));
  expect(saved.expenses.some(e => e.note === 'E2E snack' && e.amount === 123)).toBe(true);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});

test('all player modules and admin portal keep their mobile and tablet responsive shells', async ({ page }, testInfo) => {
  const isPhone = testInfo.project.name === 'mobile';
  const isTablet = testInfo.project.name === 'tablet';
  test.skip(!isPhone && !isTablet, 'Dedicated mobile/tablet responsive smoke test.');
  test.setTimeout(45_000);

  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('pointy_auth_v1', JSON.stringify({
      uid: 'mobile-smoke-uid',
      username: 'mobile.smoke',
      email: 'mobile.smoke@coinquest.local',
      userId: '7777',
      name: 'Mobile Smoke',
      character: { id: '7777', name: 'Mobile Smoke', class: 'archfiend', cls: 'archfiend', gender: 'male' }
    }));
    localStorage.setItem('pointy_character_registry_v1::acct:mobile-smoke-uid', JSON.stringify({
      '7777': { id: '7777', name: 'Mobile Smoke', class: 'archfiend', gender: 'male', xp: 0 }
    }));
    sessionStorage.setItem('pointy_test_trip_9901', JSON.stringify({
      tripName: 'Mobile Board',
      participants: ['Mobile Smoke'],
      characterIds: { 'Mobile Smoke': '7777' },
      heroClasses: { 'Mobile Smoke': 'archfiend' },
      heroGenders: { 'Mobile Smoke': 'male' },
      expenses: [],
      admin: { ownerHash: 'mobile-owner', adminId: 'ADM-MOBILE', adminName: 'Mobile Smoke', characterId: '7777', passwordHash: 'hash', urlLocked: true },
      updatedAt: 100
    }));
  });

  const assertNoOverflow = async () => {
    await page.waitForLoadState('domcontentloaded');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  };
  const assertPlayerShell = async () => {
    if (isPhone) {
      await expect(page.locator('.tb-burger')).toBeVisible();
      await expect(page.locator('.mtabbar')).toBeVisible();
    } else {
      await expect(page.locator('.tb-burger')).toBeHidden();
      await expect(page.locator('.mtabbar')).toBeHidden();
      await expect(page.locator('.topbar')).toBeVisible();
    }
    await assertNoOverflow();
  };

  await page.goto('/?test=1');
  await expect(page.getByRole('heading', { name: 'Coin Quest Ledger' })).toBeVisible();
  await assertPlayerShell();

  await page.goto('/?view=compare&test=1');
  await expect(page.locator('#cmp-grid')).toBeVisible();
  if (isTablet) {
    const cols = await page.locator('#cmp-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length);
    expect(cols).toBe(1);
  }
  await assertPlayerShell();

  await page.goto('/trip/?id=9901&test=1');
  await expect(page.getByRole('heading', { name: 'แบ่งค่าใช้จ่าย' })).toBeVisible();
  await assertPlayerShell();

  await page.goto('/debt/?test=1');
  await expect(page.getByRole('heading', { name: 'มังกรหนี้' })).toBeVisible();
  await assertPlayerShell();

  await page.goto('/treasury/?test=1');
  await expect(page.getByRole('heading', { name: /คลังหลวง|Personal Treasury/ })).toBeVisible();
  await assertPlayerShell();

  await page.goto('/character/?id=7777&test=1');
  await expect(page.getByRole('heading', { name: 'Mobile Smoke' })).toBeVisible();
  await expect(page.locator('.cnav')).toBeVisible();
  await assertNoOverflow();

  await page.goto('/admin/?test=1');
  await page.locator('#gate-pass').fill('portal-pass');
  await page.getByRole('button', { name: 'Set & Unlock' }).click();
  await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
  await expect(page.locator('.sidebar')).toHaveCSS('flex-direction', 'row');
  await expect(page.locator('.nav-item').first()).toBeVisible();
  if (isTablet) {
    const navHeight = await page.locator('.nav-item').first().evaluate(el => el.getBoundingClientRect().height);
    expect(navHeight).toBeGreaterThanOrEqual(44);
    await page.getByRole('button', { name: 'Relationship Map' }).click();
    await expect(page.locator('.relmap')).toBeVisible();
    const relCols = await page.locator('.relmap').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length);
    expect(relCols).toBe(1);
  }
  await assertNoOverflow();

  await page.getByRole('button', { name: 'Users' }).click();
  await expect(page.getByRole('heading', { name: 'Users', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: '+ Add user' }).click();
  await expect(page.locator('.modal-bg.show')).toBeVisible();
  if (isPhone) {
    await expect(page.locator('.floating-modal')).toHaveCSS('bottom', '0px');
    await expect(page.locator('.floating-modal')).toHaveCSS('border-top-left-radius', '18px');
  } else {
    const addUserHeight = await page.getByRole('button', { name: '+ Add user' }).evaluate(el => el.getBoundingClientRect().height);
    expect(addUserHeight).toBeGreaterThanOrEqual(44);
  }
  await assertNoOverflow();
});
