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
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 32_000) {
        reject(new Error('Request body too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
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

export async function verifySuperAdminToken(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    const error = new Error('Missing Firebase ID token.');
    error.status = 401;
    throw error;
  }
  let decoded;
  try {
    decoded = await (await adminAuth()).verifyIdToken(token);
  } catch (_) {
    const error = new Error('Invalid Firebase ID token.');
    error.status = 401;
    throw error;
  }
  if (String(decoded.email || '').toLowerCase() !== SUPER_ADMIN_EMAIL || decoded.email_verified === false) {
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
  if (deleteField !== undefined) usernameRecord.recoveryHash = deleteField;
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

async function nextAvailableUserId(db, uid, preferred = '') {
  const ids = [
    String(preferred || '').replace(/\D/g, '').slice(0, 4),
    publicUserIdFromUid(uid)
  ].filter(id => /^\d{4}$/.test(id));
  for (let i = 0; i < 16; i += 1) {
    ids.push(String(Math.floor(1000 + Math.random() * 9000)));
  }
  for (const id of [...new Set(ids)]) {
    const snap = await db.collection('userIds').doc(id).get().catch(() => null);
    const data = snapData(snap);
    if (!data || !data.uid || data.uid === uid || data.deleteReusable === true) return id;
  }
  return publicUserIdFromUid(uid);
}

async function upsertAuthUser(auth, { uid, username, authEmail, password, createSuffix }) {
  if (uid) {
    try {
      const user = await auth.updateUser(uid, {
        password,
        displayName: username,
        disabled: false
      });
      return { uid: user.uid, authEmail: user.email || authEmail, authAction: 'updated' };
    } catch (error) {
      if (error?.code !== 'auth/user-not-found') throw error;
    }
  }
  const email = authEmail || authEmailForUsername(username, createSuffix || `r${Date.now().toString(36)}`);
  const user = await auth.createUser({
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
  createSuffix = ''
}) {
  const clean = normalizeLookupUsername(username);
  if (!clean || String(password || '').length < 6) {
    const error = new Error('Username and a 6+ character password are required.');
    error.status = 400;
    throw error;
  }
  const usernameRef = db.collection('usernames').doc(clean);
  const usernameSnap = await usernameRef.get();
  const oldMapping = snapData(usernameSnap) || {};
  const oldUid = String(oldMapping.uid || '').trim();
  const oldUserSnap = oldUid ? await db.collection('users').doc(oldUid).get() : null;
  const oldUser = snapData(oldUserSnap) || {};
  const currentEmail = String(oldMapping.authEmail || oldUser.email || authEmailForUsername(clean));
  const authResult = await upsertAuthUser(auth, {
    uid: oldUid,
    username: clean,
    authEmail: currentEmail,
    password,
    createSuffix
  });
  const issuedAt = Date.now();
  const recoveryCode = generateRecoveryCode();
  const recoveryHash = recoveryHashFor(clean, recoveryCode);
  const { FieldValue } = await adminFirestoreModule();
  const timestamp = FieldValue.serverTimestamp();
  const userId = String(oldUser.userId || oldMapping.userId || keepUserId || await nextAvailableUserId(db, authResult.uid)).replace(/\D/g, '').slice(0, 4)
    || publicUserIdFromUid(authResult.uid);
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

  const batch = db.batch();
  batch.set(db.collection('users').doc(authResult.uid), records.userRecord, { merge: true });
  if (oldUid && oldUid !== authResult.uid) {
    batch.delete(db.collection('users').doc(oldUid));
  }
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
  await batch.commit();
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
}
