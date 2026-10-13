import { expect } from '@playwright/test';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const FIREBASE_WEB_API_KEY = 'AIzaSyBDDC1sJnITQOqyp1qiPGvB1KLuUH1B28o';

export const REAL_FIREBASE_E2E = process.env.POINTY_REAL_FIREBASE_E2E === '1';

export function uniqueTripId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function gotoFreshTrip(page, prefix = 'e2e') {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  const id = uniqueTripId(prefix);
  await page.goto(`/trip/?id=${id}&test=1`);
  await expect(page.getByText('รวมปาร์ตี้!')).toBeVisible();
  return id;
}

export async function startAddHero(page) {
  const onboardingStart = page.getByRole('button', { name: /สร้างฮีโร่คนแรก/ });
  if (await onboardingStart.isVisible().catch(() => false)) {
    await onboardingStart.click();
  } else {
    await page.getByRole('button', { name: '＋ เพิ่มฮีโร่' }).click();
  }
}

export async function expandBoardSection(page, section) {
  const toggle = page.locator(`.board-disclosure[data-board-collapse="board-${section}-content"]`);
  if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
}

export async function chooseWarriorMale(page) {
  await page.getByRole('button', { name: '⚔️ เลือกฮีโร่ของคุณ' }).click();
  await page.locator('.picker-cell[data-class="warrior"][data-gender="male"]').click();
}

export async function addWarrior(page, name) {
  await startAddHero(page);
  await page.getByPlaceholder('ตั้งชื่อฮีโร่ใหม่').fill(name);
  await chooseWarriorMale(page);
  await page.getByRole('button', { name: 'ยืนยันตัวละคร' }).click();
  await expect(page.getByRole('dialog', { name: /ยืนยันฮีโร่/ })).toBeVisible();
  await page.getByRole('button', { name: 'ยืนยันถาวร' }).click();
  await expect(page.locator('#party-grid')).toContainText(name);
}

export function serviceAccountFromEnv() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return null;
  return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
}

export function adminTestApp() {
  const existing = getApps().find(app => app.name === 'pointy-real-e2e');
  if (existing) return existing;
  const account = serviceAccountFromEnv();
  if (!account) return null;
  return initializeApp({ credential: cert(account) }, 'pointy-real-e2e');
}

export async function superAdminIdToken() {
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

export async function requestPermanentDelete(account, reason) {
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

export async function cleanupRealAccount(username, account = {}) {
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

export async function enableRealAuth(page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function signUpRealAccount(page, username, password, displayName, heroName) {
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
