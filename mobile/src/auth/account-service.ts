import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, type User } from 'firebase/auth';
import { doc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db, nativeQaEmulators } from './firebase';
import { isBlocked, isReusable, normalizeUsername, problem, readAccount, recoveryHashInput, validateRecovery, type Account, type SignupFields } from './contracts';
import { loadCharacter } from '../character/service';
import { acknowledgeDisplayedRecovery, verifiedRecoveryCandidate } from './recovery-display-contract';

type PendingSignup = { name: string; username: string; code: string; issuedAt: number };
const pendingKey = (uid: string) => `coinquest.signup.${uid}`;
const resetKey = (username: string) => `coinquest.recovery.${normalizeUsername(username)}`;
const savedRecoveryKey = (uid: string) => `coinquest.recovery.saved.${uid}`;
const storageOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
// A failed Keychain cleanup can leave an acknowledged temporary key behind.
// Suppress it in this session only, scoped to its owner and exact current hash.
// A rotated key still requires acknowledgement; restarting may safely show it again.
const acknowledgedRecoveryHashes = new Map<string, string>();

export async function readPendingSignup(uid: string): Promise<PendingSignup | null> {
  const value = await SecureStore.getItemAsync(pendingKey(uid), storageOptions);
  return value ? JSON.parse(value) : null;
}

export async function acknowledgeRecovery(uid: string, displayedCode: string) {
  if (auth.currentUser?.uid !== uid) throw problem('auth/user-token-expired');
  const user = await getDocFromServer(doc(db, 'users', uid));
  const account = readAccount(uid, user.data() || {});
  if (auth.currentUser?.uid !== uid) throw problem('auth/user-token-expired');
  // Preserve the acknowledged owner-held key in this device's Keychain only.
  // Never add plaintext to Firestore, public profiles, exports, or telemetry.
  const result = await acknowledgeDisplayedRecovery(account.username, account.recoveryHash, displayedCode,
    input => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input),
    code => SecureStore.setItemAsync(savedRecoveryKey(uid), JSON.stringify({ username: account.username, code }), storageOptions));
  if (auth.currentUser?.uid !== uid) throw problem('auth/user-token-expired');
  acknowledgedRecoveryHashes.set(uid, account.recoveryHash!);
  await Promise.allSettled([SecureStore.deleteItemAsync(resetKey(account.username), storageOptions), SecureStore.deleteItemAsync(pendingKey(uid), storageOptions)]);
  return result;
}

async function recoveryFromOwnerData(account: Account, data: Record<string, unknown>) {
  const stored = await Promise.all([pendingKey(account.uid), resetKey(account.username), savedRecoveryKey(account.uid)].map(key => SecureStore.getItemAsync(key, storageOptions).catch(() => null)));
  const candidates: unknown[] = stored.map(value => { try { return value ? JSON.parse(value) : null; } catch { return null; } });
  candidates.push({ username: account.username, code: data.recoveryCode });
  for (const candidate of candidates) {
    const code = await verifiedRecoveryCandidate(account.username, account.recoveryHash, candidate, input => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input));
    if (code) return code;
  }
  return null;
}

export async function readRecoveryForOwner(account: Account) {
  if (auth.currentUser?.uid !== account.uid) throw problem('auth/user-token-expired');
  const snapshot = await getDocFromServer(doc(db, 'users', account.uid));
  const current = readAccount(account.uid, snapshot.data() || {});
  if (current.username !== account.username) throw problem('account/profile-invalid');
  const code = await recoveryFromOwnerData(current, snapshot.data() || {});
  if (auth.currentUser?.uid !== account.uid) throw problem('auth/user-token-expired');
  return code;
}

async function newPendingSignup(user: User, name: string): Promise<PendingSignup> {
  const username = normalizeUsername(user.displayName || user.email?.split('@')[0] || '');
  if (!username) throw problem('account/profile-invalid');
  const bytes = await Crypto.getRandomBytesAsync(12);
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('').match(/.{4}/g)!.join('-');
  const pending = { name: name.trim(), username, code, issuedAt: Date.now() };
  await SecureStore.setItemAsync(pendingKey(user.uid), JSON.stringify(pending), storageOptions);
  return pending;
}

async function hashRecovery(pending: PendingSignup) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, recoveryHashInput(pending.username, pending.code));
}

export async function loadAccount(user: User) {
  // A remembered credential is not sufficient: validate the token and current owner profile.
  await user.getIdToken(true);
  const snapshot = await getDocFromServer(doc(db, 'users', user.uid));
  const acknowledged = !!snapshot.data()?.recoveryHash && acknowledgedRecoveryHashes.get(user.uid) === snapshot.data()?.recoveryHash;
  // Only a key already validated and acknowledged in this session may bypass
  // unavailable reveal storage. A new signup must not silently skip its key.
  let pending = await readPendingSignup(user.uid).catch(error => { if (acknowledged) return null; throw error; });
  if (!snapshot.exists()) return { account: null, pending, recoveryCode: null, character: null };
  const account = readAccount(user.uid, snapshot.data());
  const reset = await SecureStore.getItemAsync(resetKey(account.username), storageOptions).catch(error => { if (acknowledged) return null; throw error; });
  if (reset) {
    try { const candidate = JSON.parse(reset) as PendingSignup; if (await hashRecovery(candidate) === account.recoveryHash) pending = candidate; }
    catch { /* A corrupt local reveal must not block a valid server account. */ }
  }
  const character = await loadCharacter(account);
  const recoveryCode = account.recoveryHash && acknowledgedRecoveryHashes.get(user.uid) === account.recoveryHash
    ? null : pending && await hashRecovery(pending) === account.recoveryHash ? pending.code : null;
  return { account, pending, recoveryCode, character };
}

export async function login(username: string, password: string) {
  const clean = normalizeUsername(username);
  const mapping = await getDocFromServer(doc(db, 'usernames', clean));
  const data = mapping.data();
  if (data && isBlocked(data)) throw problem('account/blocked');
  const email = data?.authEmail || `${clean}@coinquest.local`;
  const credential = await signInWithEmailAndPassword(auth, email, password);
  if (data?.uid && data.uid !== credential.user.uid) {
    await signOut(auth);
    throw problem('account/profile-invalid');
  }
  return credential.user;
}

export async function signup(fields: SignupFields) {
  const username = normalizeUsername(fields.username);
  const mapping = await getDocFromServer(doc(db, 'usernames', username));
  if (mapping.exists() && !isReusable(mapping.data())) throw problem('account/username-taken');
  const { user } = await createUserWithEmailAndPassword(auth, `${username}@coinquest.local`, fields.password);
  // Save the reveal before provisioning. If interrupted, the existing Auth account
  // resumes provisioning; it never creates another account or silently skips the key.
  await newPendingSignup(user, fields.name);
  await updateProfile(user, { displayName: username });
  await completeSignup(user, fields.name);
  return user;
}

export async function completeSignup(user: User, name: string) {
  if (!name.trim()) throw problem('account/profile-invalid');
  const pending = await readPendingSignup(user.uid) || await newPendingSignup(user, name);
  const recoveryHash = await hashRecovery(pending);
  const random = await Crypto.getRandomBytesAsync(2);
  const start = (random[0] * 256 + random[1]) % 9000;
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const completed = await runTransaction(db, async transaction => {
      const profileRef = doc(db, 'users', user.uid);
      const usernameRef = doc(db, 'usernames', pending.username);
      const [profile, lookup] = await Promise.all([transaction.get(profileRef), transaction.get(usernameRef)]);
      if (profile.exists()) return readAccount(user.uid, profile.data());
      const previous = lookup.data();
      if (previous && previous.uid !== user.uid && !isReusable(previous)) throw problem('account/username-taken');
      const userId = previous?.userId || String(1000 + (start + attempt) % 9000);
      if (!/^\d{4}$/.test(userId)) throw problem('account/profile-invalid');
      const idRef = doc(db, 'userIds', userId);
      const [reservation, character] = await Promise.all([transaction.get(idRef), transaction.get(doc(db, 'characters', userId))]);
      const reserved = reservation.data();
      if ((reserved && reserved.uid !== user.uid && !isReusable(reserved)) || (character.exists() && character.data().ownerUid !== user.uid)) {
        if (previous?.userId) throw problem('account/id-unavailable');
        return null;
      }
      const now = serverTimestamp();
      const identity = { uid: user.uid, userId, characterId: '', status: 'active', updatedAt: now, createdAt: now };
      const account = { ...identity, username: pending.username, email: user.email, name: pending.name, character: null, provider: 'firebase', recoveryHash, recoveryIssuedAt: pending.issuedAt };
      transaction.set(profileRef, account);
      // Full replacement also removes any legacy public recovery hash on a tombstone.
      transaction.set(usernameRef, { ...identity, username: pending.username, authEmail: user.email, lifecycleStatus: 'active', deleteReusable: false, deletedAt: 0, previousUid: '', recoveryIssuedAt: pending.issuedAt });
      transaction.set(idRef, { ...identity, lifecycleStatus: 'active', deleteReusable: false });
      return readAccount(user.uid, account);
    });
    if (completed) return completed;
  }
  throw problem('account/id-unavailable');
}

export async function regenerateRecovery(account: Account) {
  const user = auth.currentUser;
  if (!user || user.uid !== account.uid) throw problem('auth/user-token-expired');
  const bytes = await Crypto.getRandomBytesAsync(12); const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = Array.from(bytes, b => alphabet[b % alphabet.length]).join('').match(/.{4}/g)!.join('-');
  const pending = { username: account.username, name: account.name, code, issuedAt: Date.now() };
  await SecureStore.setItemAsync(pendingKey(user.uid), JSON.stringify(pending), storageOptions);
  const hash = await hashRecovery(pending);
  await runTransaction(db, async tx => {
    if (auth.currentUser?.uid !== account.uid) throw problem('auth/user-token-expired');
    const ref = doc(db, 'users', account.uid); const snap = await tx.get(ref); const current = readAccount(account.uid, snap.data() || {});
    if (current.username !== account.username) throw problem('account/profile-invalid');
    tx.update(ref, { recoveryHash: hash, recoveryIssuedAt: pending.issuedAt, updatedAt: serverTimestamp() });
  });
}

export async function resetWithRecovery(username: string, recoveryCode: string, password: string, confirmation: string) {
  // Local Firebase QA must never send its recovery credentials to the live API.
  if (nativeQaEmulators) throw new Error('โหมดทดสอบในเครื่องไม่เชื่อมต่อบริการกู้บัญชีจริง');
  const invalid = validateRecovery(username, recoveryCode, password, confirmation); if (invalid) throw new Error(invalid);
  const clean = normalizeUsername(username);
  const response = await fetch('https://coinquestledger.vercel.app/api/recover-account', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: clean, recoveryCode, password }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 429 ? 'ลองหลายครั้งเกินไป กรุณารอ 15 นาที' : response.status >= 500 ? 'บริการกู้บัญชียังไม่พร้อม ลองใหม่ภายหลัง' : 'ชื่อผู้ใช้หรือ Recovery ID ไม่ถูกต้อง');
  if (!data.recoveryCode || !data.authEmail) throw new Error('ผลการกู้บัญชีไม่ครบ กรุณาเก็บ Recovery ID เดิมไว้และติดต่อผู้ดูแล');
  const pending = { username: clean, name: clean, code: String(data.recoveryCode), issuedAt: Number(data.recoveryIssuedAt) || Date.now() };
  let stored = true;
  try { await SecureStore.setItemAsync(resetKey(clean), JSON.stringify(pending), storageOptions); } catch { stored = false; }
  return { ...pending, stored };
}
