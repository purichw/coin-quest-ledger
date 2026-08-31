import {
  adminAuth,
  adminDb,
  json,
  normalizeLookupUsername,
  readBody,
  recoveryHashFor,
  resetAccountWithPassword,
  safeHashEqual,
  snapData
} from './account-recovery-core.js';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map();

function requestKey(req, username) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || req.socket?.remoteAddress || 'unknown';
  return `${ip}:${username}`;
}

function attemptState(key, now = Date.now()) {
  const state = attempts.get(key);
  if (!state || now - state.firstAt > WINDOW_MS) return { count: 0, firstAt: now };
  return state;
}

function blocked(key) {
  return attemptState(key).count >= MAX_ATTEMPTS;
}

function noteFailure(key) {
  const state = attemptState(key);
  attempts.set(key, { firstAt: state.firstAt, count: state.count + 1 });
}

function clearFailures(key) {
  attempts.delete(key);
}

async function recoveryHashForUsername(db, username) {
  const usernameSnap = await db.collection('usernames').doc(username).get();
  const usernameRecord = snapData(usernameSnap);
  if (!usernameRecord) return { usernameRecord: null, userRecord: null, recoveryHash: '' };
  const uid = String(usernameRecord.uid || '').trim();
  const userSnap = uid ? await db.collection('users').doc(uid).get() : null;
  const userRecord = snapData(userSnap);
  return {
    usernameRecord,
    userRecord,
    recoveryHash: String(userRecord?.recoveryHash || usernameRecord.recoveryHash || '')
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    return json(res, 405, { error: 'Method not allowed.' });
  }

  let body;
  try {
    body = await readBody(req);
  } catch (error) {
    return json(res, 400, { error: error.message || 'Invalid request body.' });
  }

  const username = normalizeLookupUsername(body.username);
  const recoveryCode = String(body.recoveryCode || body.code || '');
  const password = String(body.password || body.newPassword || '');
  const key = requestKey(req, username);
  if (!username || !recoveryCode || password.length < 6) {
    noteFailure(key);
    return json(res, 400, { error: 'bad-recovery-code' });
  }
  if (blocked(key)) {
    return json(res, 429, { error: 'too-many-recovery-attempts' });
  }

  let db;
  try {
    db = await adminDb();
  } catch (error) {
    console.error('Firebase Admin service account initialization failed', error);
    return json(res, 500, { error: 'Firebase Admin service account could not be initialized.' });
  }
  if (!db) return json(res, 503, { error: 'Firebase Admin service account is not configured.' });

  try {
    const { usernameRecord, recoveryHash } = await recoveryHashForUsername(db, username);
    const submittedHash = recoveryHashFor(username, recoveryCode);
    if (!usernameRecord || !recoveryHash || !safeHashEqual(submittedHash, recoveryHash)) {
      noteFailure(key);
      return json(res, 400, { error: 'bad-recovery-code' });
    }
    const result = await resetAccountWithPassword({
      db,
      auth: await adminAuth(),
      username,
      password,
      actor: 'player',
      createSuffix: `r${Date.now().toString(36)}`
    });
    clearFailures(key);
    return json(res, 200, {
      ok: true,
      username: result.username,
      userId: result.userId,
      characterId: result.characterId,
      authEmail: result.authEmail,
      recoveryCode: result.recoveryCode,
      recoveryIssuedAt: result.recoveryIssuedAt
    });
  } catch (error) {
    noteFailure(key);
    return json(res, error.status || 500, { error: error.message || 'Recovery reset failed.' });
  }
}
