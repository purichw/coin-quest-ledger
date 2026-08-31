import {
  adminAuth,
  adminDb,
  json,
  normalizeLookupUsername,
  readBody,
  resetAccountWithPassword,
  verifySuperAdminToken
} from './account-recovery-core.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    return json(res, 405, { error: 'Method not allowed.' });
  }

  let db;
  try {
    db = await adminDb();
  } catch (error) {
    console.error('Firebase Admin service account initialization failed', error);
    return json(res, 500, { error: 'Firebase Admin service account could not be initialized.' });
  }
  if (!db) return json(res, 503, { error: 'Firebase Admin service account is not configured.' });

  let decoded;
  try {
    decoded = await verifySuperAdminToken(req);
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || 'Admin authorization failed.' });
  }

  let body;
  try {
    body = await readBody(req);
  } catch (error) {
    return json(res, 400, { error: error.message || 'Invalid request body.' });
  }

  const username = normalizeLookupUsername(body.username);
  const password = String(body.password || body.temporaryPassword || '');
  const keepUserId = String(body.keepUserId || body.userId || '').replace(/\D/g, '').slice(0, 4);
  if (!username || password.length < 6) {
    return json(res, 400, { error: 'Enter a username and 6+ character temporary password.' });
  }

  try {
    const result = await resetAccountWithPassword({
      db,
      auth: await adminAuth(),
      username,
      password,
      keepUserId,
      actor: 'admin',
      actorEmail: decoded.email || '',
      actorUid: decoded.uid || '',
      createSuffix: `admin-${Date.now().toString(36)}`
    });
    return json(res, 200, {
      ok: true,
      username: result.username,
      userId: result.userId,
      characterId: result.characterId,
      authEmail: result.authEmail,
      recoveryCode: result.recoveryCode,
      recoveryIssuedAt: result.recoveryIssuedAt,
      authAction: result.authAction
    });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || 'Admin password reset failed.' });
  }
}
