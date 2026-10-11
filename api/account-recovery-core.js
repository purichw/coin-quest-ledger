import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const SUPER_ADMIN_EMAIL = 'purich.wc@gmail.com';
export const USERNAME_DOMAIN = 'coinquest.local';

let adminAppModulePromise;
let adminAuthModulePromise;
let adminFirestoreModulePromise;

export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('cache-control', 'no-store');
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export function readBody(req) {
  const parse = value => {
    const raw = typeof value === 'string' || Buffer.isBuffer(value) ? String(value) : JSON.stringify(value);
    if (Buffer.byteLength(raw || '') > 32_000) throw new Error('Request body too large.');
    const body = raw ? JSON.parse(raw) : {};
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Expected a JSON object.');
    return body;
  };
  if (req.body !== undefined) return Promise.resolve().then(() => parse(req.body));
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (Buffer.byteLength(raw) > 32_000) {
        reject(new Error('Request body too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(parse(raw));
      } catch (_) {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', reject);
  });
}

export function serviceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
  }
  return null;
}

async function adminAppModule() {
  adminAppModulePromise ||= import('firebase-admin/app');
  return adminAppModulePromise;
}

export async function adminAuth() {
  adminAuthModulePromise ||= import('firebase-admin/auth');
  const { getAuth } = await adminAuthModulePromise;
  return getAuth();
}

export async function adminFirestoreModule() {
  adminFirestoreModulePromise ||= import('firebase-admin/firestore');
  return adminFirestoreModulePromise;
}

export async function adminDb() {
  const account = serviceAccount();
  if (!account) return null;
  const { cert, getApps, initializeApp } = await adminAppModule();
  const { getFirestore } = await adminFirestoreModule();
  if (!getApps().length) initializeApp({ credential: cert(account) });
  return getFirestore();
}

export async function verifySuperAdminToken(req, auth = null) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    const error = new Error('Missing Firebase ID token.');
    error.status = 401;
    throw error;
  }
  let decoded;
  try {
    decoded = await (auth || await adminAuth()).verifyIdToken(token, true);
  } catch (_) {
    const error = new Error('Invalid Firebase ID token.');
    error.status = 401;
    throw error;
  }
  if (String(decoded.email || '').toLowerCase() !== SUPER_ADMIN_EMAIL || decoded.email_verified !== true) {
    const error = new Error('This Gmail is not allowed to use Super Admin account tools.');
    error.status = 403;
    throw error;
  }
  return decoded;
}

export function normalizeLookupUsername(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 32);
}

export function authEmailForUsername(username, suffix = '') {
  const clean = normalizeLookupUsername(username);
  const tag = suffix ? `+${String(suffix).replace(/[^a-z0-9._-]/gi, '').slice(0, 24)}` : '';
  return `${clean || 'user'}${tag}@${USERNAME_DOMAIN}`;
}

export function cleanRecoveryCode(code) {
  return String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function recoveryHashFor(username, code) {
  return createHash('sha256')
    .update(`${normalizeLookupUsername(username)}:${cleanRecoveryCode(code)}`)
    .digest('hex');
}

export function safeHashEqual(a, b) {
  if (![a, b].every(value => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value))) return false;
  const left = Buffer.from(String(a || ''), 'hex');
  const right = Buffer.from(String(b || ''), 'hex');
  return left.length > 0 && left.length === right.length && timingSafeEqual(left, right);
}

export function generateRecoveryCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(12);
  return Array.from(bytes, b => alphabet[b % alphabet.length])
    .join('')
    .replace(/(.{4})/g, '$1-')
    .replace(/-$/, '');
}

export function publicUserIdFromUid(uid) {
  const hex = createHash('sha256').update(String(uid || 'user')).digest('hex');
  return String((parseInt(hex.slice(0, 8), 16) % 9000) + 1000);
}

export function snapData(snap) {
  return snap?.exists ? snap.data() || {} : null;
}

export function buildResetRecords({
  uid,
  username,
  authEmail,
  userId,
  oldUser = {},
  oldMapping = {},
  recoveryHash,
  recoveryIssuedAt,
  timestamp,
  deleteField,
  actor = 'player',
  actorEmail = ''
}) {
  const clean = normalizeLookupUsername(username);
  const character = oldUser.character || null;
  const characterId = String(character?.id || oldUser.characterId || oldMapping.characterId || '').trim();
  const name = String(oldUser.name || oldMapping.name || clean || 'Hero').trim() || 'Hero';
  const userRecord = {
    uid,
    username: clean,
    email: authEmail,
    userId,
    name,
    status: 'active',
    lifecycleStatus: 'active',
    character,
    characterId,
    provider: 'firebase',
    recoveryHash,
    recoveryIssuedAt,
    tempPasswordRequired: actor === 'admin',
    updatedAt: timestamp
  };
  if (!oldUser.uid && !oldUser.createdAt) userRecord.createdAt = timestamp;
  const usernameRecord = {
    username: clean,
    uid,
    authEmail,
    userId,
    characterId,
    status: 'active',
    lifecycleStatus: 'active',
    deleteReusable: false,
    deletedAt: 0,
    previousUid: '',
    recoveryIssuedAt,
    updatedAt: timestamp
  };
  if (deleteField !== undefined) {
    usernameRecord.recoveryHash = deleteField;
    userRecord.recoveryCode = deleteField;
    userRecord.recoveryReset = deleteField;
  }
  if (actor === 'admin') {
    usernameRecord.adminResetAt = recoveryIssuedAt;
    userRecord.adminResetAt = recoveryIssuedAt;
    userRecord.adminResetBy = actorEmail || '';
  } else {
    usernameRecord.recoveryResetAt = recoveryIssuedAt;
    userRecord.recoveryResetAt = recoveryIssuedAt;
  }
  const userIdRecord = {
    userId,
    uid,
    characterId,
    status: 'active',
    updatedAt: timestamp
  };
  if (!oldMapping.userId) userIdRecord.createdAt = timestamp;
  const characterPatch = characterId
    ? { ownerUid: uid, userId, username: clean, accountName: name, updatedAt: recoveryIssuedAt }
    : null;
  return { userRecord, usernameRecord, userIdRecord, characterId, characterPatch };
}

async function upsertAuthUser(auth, { uid, username, authEmail, password }) {
  if (uid) {
    try {
      const current = await auth.getUser(uid);
      if (current.disabled) throw Object.assign(new Error('Account is not active.'), { status: 403 });
      const user = await auth.updateUser(uid, {
        password,
        displayName: username
      });
      return { uid: user.uid, authEmail: user.email || authEmail, authAction: 'updated' };
    } catch (error) {
      if (error?.code !== 'auth/user-not-found') throw error;
    }
  }
  const email = authEmail || authEmailForUsername(username);
  const user = await auth.createUser({
    uid,
    email,
    password,
    displayName: username,
    emailVerified: true,
    disabled: false
  });
  return { uid: user.uid, authEmail: email, authAction: 'created' };
}

export async function resetAccountWithPassword({
  db,
  auth,
  username,
  password,
  keepUserId = '',
  actor = 'player',
  actorEmail = '',
  actorUid = '',
  expectedRecoveryHash = ''
}) {
  const clean = normalizeLookupUsername(username);
  if (!clean || String(password || '').length < 6) {
    const error = new Error('Username and a 6+ character password are required.');
    error.status = 400;
    throw error;
  }
  const usernameRef = db.collection('usernames').doc(clean);
  const { FieldValue } = await adminFirestoreModule();
  const fail = (message, status = 409) => { throw Object.assign(new Error(message), { status }); };
  const blocked = record => [record.status, record.lifecycleStatus].some(value => ['archived', 'deactivated', 'delete_requested', 'deleted'].includes(String(value || '').toLowerCase()));
  const lock = { id: randomBytes(16).toString('hex'), expiresAt: Date.now() + 300_000 };
  // Auth and Firestore cannot share a transaction. A bounded lease serializes
  // resets; retaining the old hash until completion keeps failed resets retryable.
  const state = await db.runTransaction(async tx => {
    const oldMapping = snapData(await tx.get(usernameRef));
    if (!oldMapping?.uid) fail('Account does not exist.', 404);
    const uid = oldMapping.uid;
    const userRef = db.collection('users').doc(uid);
    const oldUser = snapData(await tx.get(userRef));
    if (!oldUser || blocked(oldUser) || blocked(oldMapping)) fail('Account is not active.', 403);
    if (oldUser.recoveryReset?.expiresAt > Date.now()) fail('A recovery is already in progress.');
    if (actor !== 'admin' && !safeHashEqual(expectedRecoveryHash, oldUser.recoveryHash || oldMapping.recoveryHash)) fail('bad-recovery-code', 400);
    const userId = String(oldUser.userId || oldMapping.userId || keepUserId);
    if (!/^\d{4}$/.test(userId) || (oldMapping.userId && oldMapping.userId !== userId)) fail('Account identity needs repair.');
    const reservation = snapData(await tx.get(db.collection('userIds').doc(userId)));
    if (reservation?.uid && reservation.uid !== uid) fail('User ID belongs to another account.');
    const characterId = String(oldUser.character?.id || oldUser.characterId || oldMapping.characterId || '');
    if (characterId) {
      const character = snapData(await tx.get(db.collection('characters').doc(characterId)));
      if (!character || character.ownerUid !== uid) fail('Character ownership needs repair.');
    }
    tx.update(userRef, { recoveryReset: lock });
    return { uid, userId, oldMapping, oldUser, userRef };
  });
  const { uid: oldUid, userId, oldUser, oldMapping, userRef } = state;
  try {
  const currentEmail = String(oldMapping.authEmail || oldUser.email || authEmailForUsername(clean));
  const authResult = await upsertAuthUser(auth, { uid: oldUid, username: clean, authEmail: currentEmail, password });
  await auth.revokeRefreshTokens(oldUid);
  const issuedAt = Date.now();
  const recoveryCode = generateRecoveryCode();
  const recoveryHash = recoveryHashFor(clean, recoveryCode);
  const timestamp = FieldValue.serverTimestamp();
  const records = buildResetRecords({
    uid: authResult.uid,
    username: clean,
    authEmail: authResult.authEmail,
    userId,
    oldUser,
    oldMapping,
    recoveryHash,
    recoveryIssuedAt: issuedAt,
    timestamp,
    deleteField: FieldValue.delete(),
    actor,
    actorEmail
  });

  await db.runTransaction(async batch => {
  const latest = snapData(await batch.get(userRef));
  const mapping = snapData(await batch.get(usernameRef));
  if (latest?.recoveryReset?.id !== lock.id || mapping?.uid !== oldUid || blocked(latest) || blocked(mapping)) fail('Account changed during recovery.');
  // Only credentials are changed: profile edits made during recovery survive.
  batch.update(userRef, { email: authResult.authEmail, recoveryHash, recoveryIssuedAt: issuedAt,
    recoveryCode: FieldValue.delete(), recoveryReset: FieldValue.delete(), tempPasswordRequired: actor === 'admin',
    updatedAt: timestamp, [actor === 'admin' ? 'adminResetAt' : 'recoveryResetAt']: issuedAt,
    ...(actor === 'admin' ? { adminResetBy: actorEmail } : {}) });
  batch.set(usernameRef, records.usernameRecord, { merge: true });
  batch.set(db.collection('userIds').doc(userId), records.userIdRecord, { merge: true });
  if (records.characterPatch) {
    batch.set(db.collection('characters').doc(records.characterId), records.characterPatch, { merge: true });
  }
  const auditRef = db.collection('accountRecoveryEvents').doc();
  batch.set(auditRef, {
    username: clean,
    uid: authResult.uid,
    previousUid: oldUid && oldUid !== authResult.uid ? oldUid : '',
    userId,
    characterId: records.characterId,
    actor,
    actorEmail,
    actorUid,
    authAction: authResult.authAction,
    status: 'completed',
    createdAt: timestamp
  });
  });
  return {
    ok: true,
    username: clean,
    uid: authResult.uid,
    previousUid: oldUid && oldUid !== authResult.uid ? oldUid : '',
    authEmail: authResult.authEmail,
    userId,
    characterId: records.characterId,
    recoveryCode,
    recoveryIssuedAt: issuedAt,
    authAction: authResult.authAction
  };
  } catch (error) {
    await db.runTransaction(async tx => {
      const latest = snapData(await tx.get(userRef));
      if (latest?.recoveryReset?.id === lock.id) tx.update(userRef, { recoveryReset: FieldValue.delete() });
    }).catch(() => {});
    throw error;
  }
}
