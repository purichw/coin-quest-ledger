import {
  adminAuth,
  adminDb,
  json,
  normalizeLookupUsername,
  readBody,
  recoveryHashFor,
  resetAccountWithPassword,
} from './account-recovery-core.js';
import { takeRecoveryAttempt } from './recovery-rate-limit.js';

function requestIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || req.socket?.remoteAddress || 'unknown';
  return ip;
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
  if (!username || !recoveryCode || password.length < 6) {
    return json(res, 400, { error: 'bad-recovery-code' });
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
    if (!await takeRecoveryAttempt(db, requestIp(req), username)) return json(res, 429, { error: 'too-many-recovery-attempts' });
    const result = await resetAccountWithPassword({
      db,
      auth: await adminAuth(),
      username,
      password,
      actor: 'player',
      expectedRecoveryHash: recoveryHashFor(username, recoveryCode)
    });
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
    const status = error.status || 500;
    return json(res, [400, 403, 404].includes(status) ? 400 : status, { error: [400, 403, 404].includes(status) ? 'bad-recovery-code' : 'Recovery reset failed. Please try again.' });
  }
}
