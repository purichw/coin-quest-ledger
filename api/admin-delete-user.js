import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const SUPER_ADMIN_EMAIL = 'purich.wc@gmail.com';
const USERNAME_DOMAIN = 'coinquest.local';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function readBody(req) {
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

function serviceAccount() {
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

function adminDb() {
  const account = serviceAccount();
  if (!account) return null;
  if (!getApps().length) initializeApp({ credential: cert(account) });
  return getFirestore();
}

async function resolveUser(db, body) {
  const uid = String(body.uid || '').trim();
  const userId = String(body.userId || '').trim();
  if (uid) {
    const snap = await db.collection('users').doc(uid).get();
    return { uid, data: snap.exists ? snap.data() || {} : {} };
  }
  if (!userId) return null;
  const snap = await db.collection('users').where('userId', '==', userId).limit(1).get();
  if (snap.empty) return null;
  return { uid: snap.docs[0].id, data: snap.docs[0].data() || {} };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    return json(res, 405, { error: 'Method not allowed.' });
  }

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return json(res, 401, { error: 'Missing Firebase ID token.' });

  let db;
  try {
    db = adminDb();
  } catch (error) {
    console.error('Firebase Admin service account initialization failed', error);
    return json(res, 500, { error: 'Firebase Admin service account could not be initialized.' });
  }
  if (!db) return json(res, 503, { error: 'Firebase Admin service account is not configured.' });

  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(token);
  } catch (_) {
    return json(res, 401, { error: 'Invalid Firebase ID token.' });
  }
  if (String(decoded.email || '').toLowerCase() !== SUPER_ADMIN_EMAIL || decoded.email_verified === false) {
    return json(res, 403, { error: 'This Gmail is not allowed to use Super Admin delete.' });
  }

  let body;
  try {
    body = await readBody(req);
  } catch (error) {
    return json(res, 400, { error: error.message || 'Invalid request body.' });
  }

  const reason = String(body.reason || '').trim();
  const userId = String(body.userId || '').trim();
  const username = String(body.username || '').trim().toLowerCase();
  const characterIds = Array.isArray(body.characterIds) ? body.characterIds.map(id => String(id || '').trim()).filter(Boolean) : [];
  if (!reason) return json(res, 400, { error: 'Audit reason is required.' });
  if (!userId && !body.uid) return json(res, 400, { error: 'uid or userId is required.' });

  const resolved = await resolveUser(db, { ...body, userId });
  if (!resolved?.uid) return json(res, 404, { error: 'User not found.' });

  const uid = resolved.uid;
  const data = resolved.data || {};
  const finalUsername = username || String(data.username || '').toLowerCase();
  const finalCharacterIds = [...new Set([
    ...characterIds,
    String(data.characterId || data.character?.id || '').trim()
  ].filter(Boolean))];

  const auditRef = db.collection('adminDeleteRequests').doc();
  await auditRef.set({
    uid,
    userId: userId || data.userId || '',
    username: finalUsername,
    characterIds: finalCharacterIds,
    reason,
    requestedBy: decoded.email,
    requestedByUid: decoded.uid,
    status: 'running',
    createdAt: FieldValue.serverTimestamp()
  });

  try {
    const results = { auth: 'skipped', userDoc: 'skipped', usernameDoc: 'skipped', characters: [] };
    try {
      await getAuth().deleteUser(uid);
      results.auth = 'deleted';
    } catch (error) {
      if (error?.code !== 'auth/user-not-found') throw error;
      results.auth = 'not_found';
    }

    const batch = db.batch();
    batch.delete(db.collection('users').doc(uid));
    results.userDoc = 'deleted';
    if (finalUsername) {
      batch.set(db.collection('usernames').doc(finalUsername), {
        username: finalUsername,
        uid: '',
        previousUid: uid,
        authEmail: `${finalUsername}@${USERNAME_DOMAIN}`,
        userId: userId || data.userId || '',
        characterId: finalCharacterIds[0] || data.characterId || data.character?.id || '',
        characterIds: finalCharacterIds,
        status: 'deleted',
        lifecycleStatus: 'deleted',
        deleteReusable: true,
        deletedBy: decoded.email,
        deletedReason: reason,
        deletedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      results.usernameDoc = 'tombstoned';
    }
    finalCharacterIds.forEach(id => {
      batch.delete(db.collection('characters').doc(id));
      results.characters.push({ id, status: 'deleted' });
    });
    batch.set(auditRef, {
      status: 'deleted',
      deletedAt: FieldValue.serverTimestamp(),
      results
    }, { merge: true });
    await batch.commit();

    return json(res, 200, { ok: true, deleted: true, uid, userId: userId || data.userId || '', username: finalUsername, results });
  } catch (error) {
    await auditRef.set({
      status: 'failed',
      failedAt: FieldValue.serverTimestamp(),
      error: error?.message || String(error)
    }, { merge: true });
    return json(res, 500, { error: error?.message || 'Permanent delete failed.' });
  }
}
