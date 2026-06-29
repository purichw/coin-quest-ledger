import * as Crypto from 'expo-crypto';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebaseClient';
import { emptyPlayerModules, normalizeComparisons, normalizeDebtState, normalizeTreasuryState } from './gameLogic';
import { genId4, hashOf, normalizeClass, normalizeTripState } from './pointy';
import type { Account, CharacterRecord, DebtState, Expense, Gender, PlayerModules, PriceComparison, TreasuryState, TripState } from './types';

const USERNAME_DOMAIN = 'coinquest.local';
const BLOCKED_STATUSES = new Set(['archived', 'deactivated', 'delete_requested', 'deleted']);

export function normalizeUsername(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '')
    .slice(0, 32);
}

export function usernameEmail(username: string): string {
  const clean = normalizeUsername(username);
  return `${clean || 'user'}@${USERNAME_DOMAIN}`;
}

export function isBlocked(account?: Pick<Account, 'status'> | null): boolean {
  return BLOCKED_STATUSES.has(String(account?.status || '').toLowerCase());
}

export function authErrorMessage(error: unknown): string {
  const code = String((error as { code?: string })?.code || (error as Error)?.message || '');
  if (code.includes('email-already-in-use')) return 'ชื่อนี้มีบัญชีอยู่แล้ว';
  if (code.includes('user-not-found') || code.includes('invalid-credential') || code.includes('wrong-password')) return 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
  if (code.includes('weak-password')) return 'รหัสผ่านควรมีอย่างน้อย 6 ตัวอักษร';
  if (code.includes('permission-denied')) return 'Firestore rules ไม่อนุญาตให้เข้าถึงข้อมูลนี้';
  if (code.includes('network')) return 'เชื่อมต่อ Firebase ไม่สำเร็จ';
  return 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง';
}

function publicUserIdFromUid(uid: string): string {
  return String((hashOf(uid || 'user') % 9000) + 1000).slice(0, 4);
}

async function allocateCloudUserId(uid: string): Promise<string> {
  const stable = publicUserIdFromUid(uid);
  try {
    const taken = await getDocs(query(collection(db, 'users'), where('userId', '==', stable), limit(1)));
    if (taken.empty || taken.docs.some((snap) => snap.id === uid)) return stable;
  } catch {
    return stable;
  }
  for (let i = 0; i < 16; i += 1) {
    const id = genId4();
    try {
      const taken = await getDocs(query(collection(db, 'users'), where('userId', '==', id), limit(1)));
      if (taken.empty) return id;
    } catch {
      return stable;
    }
  }
  return stable;
}

async function allocateCharacterId(account: Account): Promise<string> {
  const preferred = account.characterId || account.userId || genId4();
  const preferredSnap = await getDoc(doc(db, 'characters', preferred));
  if (!preferredSnap.exists() || preferredSnap.data()?.ownerUid === account.uid) return preferred;
  for (let i = 0; i < 24; i += 1) {
    const id = genId4();
    const snap = await getDoc(doc(db, 'characters', id));
    if (!snap.exists() || snap.data()?.ownerUid === account.uid) return id;
  }
  return genId4();
}

function normalizeCharacter(character: unknown, account?: Account): CharacterRecord | null {
  if (!character || typeof character !== 'object') return null;
  const data = character as Record<string, unknown>;
  const id = String(data.id || account?.characterId || account?.userId || '').replace(/\D/g, '').slice(0, 4);
  if (!id) return null;
  const cls = normalizeClass(String(data.class || data.cls || 'warrior'));
  return {
    ...data,
    id,
    name: String(data.name || account?.name || 'Hero'),
    class: cls,
    cls,
    gender: data.gender === 'female' ? 'female' : 'male',
    skin: String(data.skin || ''),
    xp: Number(data.xp) || 0,
    debtXp: Number(data.debtXp) || 0,
    trips: data.trips && typeof data.trips === 'object' ? (data.trips as Record<string, number>) : {},
  };
}

function accountFromFirebaseUser(user: User, data: Record<string, unknown> = {}): Account {
  const username = normalizeUsername(String(data.username || user.displayName || String(user.email || '').split('@')[0]));
  const account: Account = {
    uid: user.uid,
    provider: 'firebase',
    username,
    email: String(user.email || data.email || usernameEmail(username)),
    userId: String(data.userId || publicUserIdFromUid(user.uid)).replace(/\D/g, '').slice(0, 4),
    name: String(data.name || username || 'Hero'),
    status: String(data.status || data.lifecycleStatus || 'active').toLowerCase(),
    recoveryCode: String(data.recoveryCode || ''),
    recoveryHash: String(data.recoveryHash || ''),
    recoveryIssuedAt: Number(data.recoveryIssuedAt || 0) || 0,
    character: null,
    characterId: String(data.characterId || ''),
  };
  account.character = normalizeCharacter(data.character, account);
  return account;
}

function reusableDeletedUsername(rec: Record<string, unknown> | null): boolean {
  const status = String(rec?.status || rec?.lifecycleStatus || '').toLowerCase();
  return !!rec && (status === 'deleted' || rec.deleteReusable === true) && !!rec.userId;
}

export function watchSignedInUser(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function loadAccount(user: User): Promise<Account> {
  const snap = await getDoc(doc(db, 'users', user.uid));
  if (snap.exists()) {
    const account = accountFromFirebaseUser(user, snap.data());
    if (isBlocked(account)) throw new Error('blocked-account');
    return account;
  }
  const username = normalizeUsername(user.displayName || String(user.email || '').split('@')[0]);
  const account = accountFromFirebaseUser(user, {
    username,
    email: user.email || usernameEmail(username),
    userId: await allocateCloudUserId(user.uid),
    name: username || 'Hero',
    status: 'active',
  });
  await saveCloudUser(account, { create: true });
  return account;
}

export async function loadCharacterForAccount(account: Account): Promise<CharacterRecord | null> {
  const id = account.character?.id || account.characterId || account.userId;
  if (!id) return account.character || null;
  const snap = await getDoc(doc(db, 'characters', id));
  if (!snap.exists()) return account.character || null;
  return normalizeCharacter({ id, ...snap.data() }, account);
}

export async function signInWithUsername(username: string, password: string): Promise<Account> {
  const clean = normalizeUsername(username);
  if (!clean || !password) throw new Error('missing-login');
  const usernameSnap = await getDoc(doc(db, 'usernames', clean));
  const usernameData = usernameSnap.exists() ? usernameSnap.data() : null;
  if (usernameData && !reusableDeletedUsername(usernameData) && BLOCKED_STATUSES.has(String(usernameData.status || usernameData.lifecycleStatus || '').toLowerCase())) {
    throw new Error('blocked-account');
  }
  const authEmail = String(usernameData?.authEmail || usernameEmail(clean));
  const cred = await signInWithEmailAndPassword(auth, authEmail, password);
  return loadAccount(cred.user);
}

export async function signUpWithUsername(username: string, password: string, displayName: string): Promise<{ account: Account; recoveryCode: string }> {
  const clean = normalizeUsername(username);
  if (!clean || !password) throw new Error('missing-signup');
  const usernameRef = doc(db, 'usernames', clean);
  const usernameSnap = await getDoc(usernameRef);
  const existing = usernameSnap.exists() ? usernameSnap.data() : null;
  if (existing && !reusableDeletedUsername(existing)) throw new Error('email-already-in-use');
  const authEmail = usernameEmail(clean);
  const cred = await createUserWithEmailAndPassword(auth, authEmail, password);
  await updateProfile(cred.user, { displayName: clean });
  const recoveryCode = generateRecoveryCode();
  const recoveryHash = await recoveryHashFor(clean, recoveryCode);
  const account: Account = {
    uid: cred.user.uid,
    provider: 'firebase',
    username: clean,
    email: authEmail,
    userId: String(existing?.userId || (await allocateCloudUserId(cred.user.uid))).replace(/\D/g, '').slice(0, 4),
    name: displayName.trim() || clean,
    status: 'active',
    recoveryCode,
    recoveryHash,
    recoveryIssuedAt: Date.now(),
    character: null,
    characterId: String(existing?.characterId || ''),
  };
  await saveCloudUser(account, { create: true, recoveryHash, recoveryCode, recoveryIssuedAt: account.recoveryIssuedAt });
  return { account, recoveryCode };
}

async function saveCloudUser(
  account: Account,
  extra: { create?: boolean; recoveryHash?: string; recoveryCode?: string; recoveryIssuedAt?: number; characterId?: string } = {},
): Promise<void> {
  const characterId = account.character?.id || extra.characterId || account.characterId || '';
  await setDoc(
    doc(db, 'users', account.uid),
    {
      uid: account.uid,
      username: account.username,
      email: account.email,
      userId: account.userId,
      name: account.name,
      status: account.status || 'active',
      lifecycleStatus: account.status || 'active',
      character: account.character || null,
      characterId,
      provider: 'firebase',
      updatedAt: serverTimestamp(),
      ...(extra.recoveryHash
        ? { recoveryHash: extra.recoveryHash, recoveryCode: extra.recoveryCode || account.recoveryCode || '', recoveryIssuedAt: extra.recoveryIssuedAt || Date.now() }
        : {}),
      ...(extra.create ? { createdAt: serverTimestamp() } : {}),
    },
    { merge: true },
  );
  await setDoc(
    doc(db, 'usernames', account.username),
    {
      username: account.username,
      uid: account.uid,
      authEmail: account.email || usernameEmail(account.username),
      userId: account.userId,
      characterId,
      status: account.status || 'active',
      lifecycleStatus: account.status || 'active',
      deleteReusable: false,
      deletedAt: 0,
      previousUid: '',
      updatedAt: serverTimestamp(),
      ...(extra.recoveryHash ? { recoveryHash: extra.recoveryHash, recoveryIssuedAt: extra.recoveryIssuedAt || Date.now() } : {}),
      ...(extra.create ? { createdAt: serverTimestamp() } : {}),
    },
    { merge: true },
  );
}

export async function createCharacter(account: Account, input: { name: string; cls: string; gender: Gender; skin?: string }): Promise<CharacterRecord> {
  const id = await allocateCharacterId(account);
  const cls = normalizeClass(input.cls);
  const rec: CharacterRecord = {
    id,
    name: input.name.trim() || account.name || 'Hero',
    class: cls,
    cls,
    gender: input.gender,
    skin: input.skin || '',
    xp: 0,
    debtXp: 0,
    trips: {},
    ownerUid: account.uid,
    userId: account.userId,
    username: account.username,
    accountName: account.name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(doc(db, 'characters', rec.id), rec, { merge: true });
  await saveCloudUser({ ...account, character: rec, characterId: rec.id }, { characterId: rec.id });
  return rec;
}

export async function regenerateRecoveryCode(account: Account): Promise<string> {
  const recoveryCode = generateRecoveryCode();
  const recoveryHash = await recoveryHashFor(account.username, recoveryCode);
  const recoveryIssuedAt = Date.now();
  await saveCloudUser(
    {
      ...account,
      recoveryCode,
      recoveryHash,
      recoveryIssuedAt,
    },
    {
      recoveryHash,
      recoveryCode,
      recoveryIssuedAt,
      characterId: account.character?.id || account.characterId || '',
    },
  );
  return recoveryCode;
}

export async function loadTripsForCharacter(characterId: string): Promise<TripState[]> {
  if (!characterId) return [];
  const snap = await getDocs(collection(db, 'trips'));
  const trips = snap.docs
    .map((item) => normalizeTripState(item.id, item.data()))
    .filter((trip) => Object.values(trip.characterIds).some((id) => String(id) === String(characterId)) || String(trip.admin.characterId || '') === String(characterId));
  trips.sort((a, b) => timestampValue(b.updatedAt) - timestampValue(a.updatedAt) || a.tripName.localeCompare(b.tripName));
  return trips;
}

export async function createBoard(account: Account, character: CharacterRecord, tripName: string): Promise<TripState> {
  const name = character.name || account.name || account.username;
  const ref = doc(collection(db, 'trips'));
  const data = {
    tripName: tripName.trim() || 'New Quest Board',
    participants: [name],
    expenses: [],
    budgets: { [name]: 3000 },
    heroClasses: { [name]: character.class || character.cls || 'warrior' },
    heroGenders: { [name]: character.gender || 'male' },
    heroSkins: { [name]: character.skin || '' },
    characterIds: { [name]: character.id },
    guestHeroes: {},
    promptpay: {},
    settleXp: {},
    activeCampaignId: '',
    campaigns: [],
    admin: {
      passwordHash: '',
      ownerHash: '',
      adminId: account.userId,
      adminName: name,
      characterId: character.id,
      createdAt: serverTimestamp(),
      urlLocked: true,
    },
    settings: { entry: 'form', settleView: 'list', theme: 'tavern', accent: '#2f8f5b', stats: true, sound: true, animations: true },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return normalizeTripState(ref.id, data);
}

export async function addExpenseToTrip(trip: TripState, expense: Omit<Expense, 'id'>): Promise<void> {
  const next: Expense = { ...expense, id: `m-${Date.now().toString(36)}` };
  await updateDoc(doc(db, 'trips', trip.id), {
    expenses: [...trip.expenses, next],
    updatedAt: serverTimestamp(),
  });
}

export async function loadPlayerModules(account: Account, character: CharacterRecord): Promise<PlayerModules> {
  const fallback = emptyPlayerModules(account.uid, character.id);
  const snap = await getDoc(doc(db, 'playerModules', account.uid));
  if (!snap.exists()) {
    await savePlayerModules(fallback);
    return fallback;
  }
  const data = snap.data();
  return {
    uid: account.uid,
    characterId: character.id,
    debt: normalizeDebtState(data.debt),
    treasury: normalizeTreasuryState(data.treasury),
    comparisons: normalizeComparisons(data.comparisons),
    updatedAt: data.updatedAt,
  };
}

export async function savePlayerModules(modules: PlayerModules): Promise<void> {
  await setDoc(
    doc(db, 'playerModules', modules.uid),
    {
      uid: modules.uid,
      characterId: modules.characterId,
      debt: modules.debt,
      treasury: modules.treasury,
      comparisons: modules.comparisons,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function saveDebtModule(modules: PlayerModules, debt: DebtState): Promise<PlayerModules> {
  const next = { ...modules, debt };
  await setDoc(doc(db, 'playerModules', modules.uid), { uid: modules.uid, characterId: modules.characterId, debt, updatedAt: serverTimestamp() }, { merge: true });
  return next;
}

export async function saveTreasuryModule(modules: PlayerModules, treasury: TreasuryState): Promise<PlayerModules> {
  const next = { ...modules, treasury };
  await setDoc(doc(db, 'playerModules', modules.uid), { uid: modules.uid, characterId: modules.characterId, treasury, updatedAt: serverTimestamp() }, { merge: true });
  return next;
}

export async function saveCompareModule(modules: PlayerModules, comparisons: PriceComparison[]): Promise<PlayerModules> {
  const next = { ...modules, comparisons };
  await setDoc(doc(db, 'playerModules', modules.uid), { uid: modules.uid, characterId: modules.characterId, comparisons, updatedAt: serverTimestamp() }, { merge: true });
  return next;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = () =>
    Array.from({ length: 4 })
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join('');
  return `${part()}-${part()}-${part()}`;
}

async function recoveryHashFor(username: string, code: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${normalizeUsername(username)}:${String(code || '').trim()}`);
}

function timestampValue(value: unknown): number {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Date.parse(value) || 0;
  if (typeof value === 'object' && value && 'toMillis' in value && typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value === 'object' && value && 'seconds' in value && typeof value.seconds === 'number') return value.seconds * 1000;
  return 0;
}
