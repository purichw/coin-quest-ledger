const SUPER_ADMIN_EMAIL = 'purich.wc@gmail.com';
const USERNAME_DOMAIN = 'coinquest.local';
let adminAppModulePromise;
let adminAuthModulePromise;
let adminFirestoreModulePromise;

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

async function adminAppModule() {
  adminAppModulePromise ||= import('firebase-admin/app');
  return adminAppModulePromise;
}

async function adminAuth() {
  adminAuthModulePromise ||= import('firebase-admin/auth');
  const { getAuth } = await adminAuthModulePromise;
  return getAuth();
}

async function adminFirestoreModule() {
  adminFirestoreModulePromise ||= import('firebase-admin/firestore');
  return adminFirestoreModulePromise;
}

async function serverTimestamp() {
  const { FieldValue } = await adminFirestoreModule();
  return FieldValue.serverTimestamp();
}

async function adminDb() {
  const account = serviceAccount();
  if (!account) return null;
  const { cert, getApps, initializeApp } = await adminAppModule();
  const { getFirestore } = await adminFirestoreModule();
  if (!getApps().length) initializeApp({ credential: cert(account) });
  return getFirestore();
}

function normalizeLookupUsername(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 32);
}

function uniq(values) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
}

function lowerSet(values) {
  return new Set(uniq(values).map(value => value.toLowerCase()));
}

function snapData(snap) {
  return snap?.exists ? snap.data() || {} : null;
}

function candidateIds(candidate) {
  const data = candidate?.data || {};
  const usernameRecord = candidate?.usernameRecord || {};
  const characterRecord = candidate?.characterRecord || {};
  return uniq([
    data.userId,
    data.characterId,
    data.character?.id,
    usernameRecord.userId,
    usernameRecord.characterId,
    ...(Array.isArray(usernameRecord.characterIds) ? usernameRecord.characterIds : []),
    characterRecord.userId,
    characterRecord.id,
    candidate?.characterId,
    ...(candidate?.characterIds || [])
  ]);
}

function matchesRequestedUser(candidate, requestedUserId) {
  if (!requestedUserId) return true;
  const ids = candidateIds(candidate);
  if (candidate?.source === 'users.userId') return true;
  return ids.includes(requestedUserId);
}

function mergeResolvedData(candidate) {
  const data = candidate.data || {};
  const usernameRecord = candidate.usernameRecord || {};
  const characterRecord = candidate.characterRecord || {};
  const username = normalizeLookupUsername(
    data.username || usernameRecord.username || characterRecord.username || candidate.username
  );
  const characterIds = uniq([
    ...(candidate.characterIds || []),
    data.characterId,
    data.character?.id,
    usernameRecord.characterId,
    ...(Array.isArray(usernameRecord.characterIds) ? usernameRecord.characterIds : []),
    characterRecord.id,
    characterRecord.userId
  ]);
  return {
    ...candidate,
    data: {
      ...usernameRecord,
      ...characterRecord,
      ...data,
      username: data.username || username,
      characterId: data.characterId || data.character?.id || usernameRecord.characterId || characterRecord.id || characterRecord.userId || ''
    },
    username,
    characterIds
  };
}

async function getUserDoc(db, uid) {
  if (!uid) return null;
  const snap = await db.collection('users').doc(uid).get();
  return snapData(snap);
}

export async function resolveUser(db, body) {
  const uid = String(body.uid || '').trim();
  const userId = String(body.userId || '').trim();
  const rawUsername = normalizeLookupUsername(body.username);
  const displayUsername = normalizeLookupUsername(body.displayName || body.name);
  const emailUsername = normalizeLookupUsername(String(body.email || '').split('@')[0] || '');
  const characterIds = uniq([
    userId,
    ...(Array.isArray(body.characterIds) ? body.characterIds : [])
  ]);
  const usernameLookups = uniq([rawUsername, displayUsername, emailUsername]);
  const candidates = [];

  function add(candidate) {
    if (!candidate) return;
    const merged = mergeResolvedData(candidate);
    if (matchesRequestedUser(merged, userId)) candidates.push(merged);
  }

  if (uid) {
    add({ uid, data: await getUserDoc(db, uid) || {}, source: 'uid' });
  }

  if (userId) {
    const userIdSnap = await db.collection('users').where('userId', '==', userId).limit(1).get();
    if (!userIdSnap.empty) {
      add({ uid: userIdSnap.docs[0].id, data: userIdSnap.docs[0].data() || {}, source: 'users.userId' });
    }

    const characterIdSnap = await db.collection('users').where('characterId', '==', userId).limit(1).get();
    if (!characterIdSnap.empty) {
      add({ uid: characterIdSnap.docs[0].id, data: characterIdSnap.docs[0].data() || {}, source: 'users.characterId' });
    }
  }

  for (const username of usernameLookups) {
    const snap = await db.collection('usernames').doc(username).get();
    const usernameRecord = snapData(snap);
    if (!usernameRecord) continue;
    const usernameUid = String(usernameRecord.uid || '').trim();
    add({
      uid: usernameUid,
      data: usernameUid ? await getUserDoc(db, usernameUid) || {} : {},
      username,
      usernameRecord,
      source: rawUsername === username ? 'usernames.username' : 'usernames.fallbackName'
    });
  }

  for (const characterId of characterIds) {
    const snap = await db.collection('characters').doc(characterId).get();
    const characterRecord = snapData(snap);
    if (!characterRecord) continue;
    const ownerUid = String(characterRecord.ownerUid || characterRecord.uid || '').trim();
    add({
      uid: ownerUid,
      data: ownerUid ? await getUserDoc(db, ownerUid) || {} : {},
      characterId,
      characterIds: [characterId],
      characterRecord: { ...characterRecord, id: characterId },
      source: 'characters.ownerUid'
    });
  }

  const byUid = new Map();
  for (const candidate of candidates) {
    if (!candidate.uid) continue;
    const existing = byUid.get(candidate.uid);
    if (!existing) {
      byUid.set(candidate.uid, candidate);
      continue;
    }
    byUid.set(candidate.uid, mergeResolvedData({
      ...existing,
      source: existing.source || candidate.source,
      data: { ...(candidate.data || {}), ...(existing.data || {}) },
      username: existing.username || candidate.username,
      usernameRecord: { ...(candidate.usernameRecord || {}), ...(existing.usernameRecord || {}) },
      characterRecord: { ...(candidate.characterRecord || {}), ...(existing.characterRecord || {}) },
      characterIds: uniq([...(existing.characterIds || []), ...(candidate.characterIds || [])])
    }));
  }

  const mergedCandidates = [...byUid.values(), ...candidates.filter(candidate => !candidate.uid)];
  const resolved = mergedCandidates.find(candidate => candidate.uid)
    || mergedCandidates.find(candidate => candidate.data?.uid);
  return resolved?.uid ? resolved : null;
}

function removeKeys(record, keys) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return record;
  const next = { ...record };
  keys.forEach(key => delete next[key]);
  return next;
}

function removeIds(record, ids) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return record;
  const idSet = new Set(ids);
  const next = { ...record };
  ids.forEach(id => delete next[id]);
  Object.entries(next).forEach(([key, value]) => {
    if (idSet.has(String(value || ''))) delete next[key];
  });
  return next;
}

function sameJson(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function cleanExpense(expense, removedNames) {
  if (!expense || typeof expense !== 'object') return { changed: false, data: expense, remove: false };
  const removedSet = new Set(removedNames);
  const next = { ...expense };
  let changed = false;
  let paidByRemoved = false;

  ['paidBy', 'payer'].forEach(field => {
    if (removedSet.has(next[field])) {
      delete next[field];
      paidByRemoved = true;
      changed = true;
    }
  });

  ['sharedBy', 'participants'].forEach(field => {
    if (!Array.isArray(next[field])) return;
    const filtered = next[field].filter(name => !removedSet.has(name));
    if (filtered.length !== next[field].length) {
      next[field] = filtered;
      changed = true;
    }
  });

  if (next.payers && typeof next.payers === 'object' && !Array.isArray(next.payers)) {
    const cleaned = removeKeys(next.payers, removedSet);
    if (!sameJson(cleaned, next.payers)) {
      next.payers = cleaned;
      changed = true;
    }
  }

  if (next.split?.weights && typeof next.split.weights === 'object') {
    const cleanedWeights = removeKeys(next.split.weights, removedSet);
    if (!sameJson(cleanedWeights, next.split.weights)) {
      next.split = { ...next.split, weights: cleanedWeights };
      changed = true;
    }
  }

  const hasPayer = next.paidBy || next.payer || (next.payers && Object.keys(next.payers).length);
  const hasSharedParty = !Array.isArray(next.sharedBy) || next.sharedBy.length > 0;
  return { changed, data: next, remove: paidByRemoved && !hasPayer || !hasSharedParty };
}

function cleanScope(data, target) {
  const targetIds = new Set(uniq(target?.targetIds || []));
  const targetNames = lowerSet(target?.targetNames || []);
  const characterIds = data?.characterIds && typeof data.characterIds === 'object' ? data.characterIds : {};
  const removedNames = new Set();

  Object.entries(characterIds).forEach(([name, id]) => {
    if (targetIds.has(String(id || ''))) removedNames.add(name);
  });

  (Array.isArray(data?.participants) ? data.participants : []).forEach(name => {
    const normalizedName = String(name || '').trim().toLowerCase();
    const mappedId = String(characterIds?.[name] || '').trim();
    if (targetNames.has(normalizedName) && (!mappedId || targetIds.has(mappedId))) removedNames.add(name);
  });

  const removed = [...removedNames];
  const next = { ...data };
  let changed = false;

  if (Array.isArray(data?.participants)) {
    const participants = data.participants.filter(name => !removedNames.has(name));
    if (participants.length !== data.participants.length) {
      next.participants = participants;
      changed = true;
    }
  }

  const mapFields = ['characterIds', 'heroClasses', 'heroGenders', 'heroSkins', 'settleXp', 'budgets'];
  mapFields.forEach(field => {
    const current = data?.[field];
    if (!current || typeof current !== 'object' || Array.isArray(current)) return;
    const cleaned = removeKeys(current, removedNames);
    if (JSON.stringify(cleaned) !== JSON.stringify(current)) {
      next[field] = cleaned;
      changed = true;
    }
  });

  ['characterXp', 'renownByCharacter'].forEach(field => {
    const current = data?.[field];
    if (!current || typeof current !== 'object' || Array.isArray(current)) return;
    const cleaned = removeIds(current, targetIds);
    if (!sameJson(cleaned, current)) {
      next[field] = cleaned;
      changed = true;
    }
  });

  if (Array.isArray(data?.expenses)) {
    const expenses = [];
    let expenseChanged = false;
    data.expenses.forEach(expense => {
      const cleaned = cleanExpense(expense, removedNames);
      if (cleaned.changed || cleaned.remove) expenseChanged = true;
      if (!cleaned.remove) expenses.push(cleaned.data);
    });
    if (expenseChanged) {
      next.expenses = expenses;
      changed = true;
    }
  }

  if (data?.admin && typeof data.admin === 'object' && !Array.isArray(data.admin)) {
    const admin = { ...data.admin };
    let adminChanged = false;
    if (targetIds.has(String(admin.characterId || ''))) {
      delete admin.characterId;
      adminChanged = true;
    }
    if (removedNames.has(admin.adminName)) {
      delete admin.adminName;
      adminChanged = true;
    }
    if (adminChanged) {
      next.admin = admin;
      changed = true;
    }
  }

  return { changed, data: next, removedNames: removed };
}

function isEmptyLegacyScope(data) {
  const participants = Array.isArray(data?.participants) ? data.participants : [];
  const characterIds = data?.characterIds && typeof data.characterIds === 'object' ? Object.keys(data.characterIds) : [];
  const expenses = Array.isArray(data?.expenses) ? data.expenses : [];
  const dragons = Array.isArray(data?.dragons) ? data.dragons : [];
  const admin = data?.admin || {};
  const hasAdminLink = !!(admin.ownerUid || admin.uid || admin.adminId || admin.ownerHash || admin.passwordHash);
  return !participants.length && !characterIds.length && !expenses.length && !dragons.length && !hasAdminLink;
}

export function cleanLegacyTripData(data, target) {
  const root = cleanScope(data || {}, target);
  const next = { ...root.data };
  let changed = root.changed;
  let removedNames = [...root.removedNames];

  if (Array.isArray(data?.campaigns)) {
    const campaigns = [];
    let campaignChanged = false;
    data.campaigns.forEach(campaign => {
      const cleaned = cleanScope(campaign || {}, target);
      if (cleaned.changed) campaignChanged = true;
      removedNames = [...new Set([...removedNames, ...cleaned.removedNames])];
      if (!isEmptyLegacyScope(cleaned.data)) campaigns.push(cleaned.data);
      else campaignChanged = true;
    });
    if (campaignChanged) {
      next.campaigns = campaigns;
      changed = true;
    }
  }

  return { changed, data: next, removedNames };
}

async function commitOps(db, ops) {
  let committed = 0;
  for (let i = 0; i < ops.length; i += 450) {
    const batch = db.batch();
    ops.slice(i, i + 450).forEach(op => {
      if (op.type === 'delete') batch.delete(op.ref);
      if (op.type === 'set') batch.set(op.ref, op.data, op.options);
      if (op.type === 'update') batch.update(op.ref, op.data);
    });
    await batch.commit();
    committed += Math.min(450, ops.length - i);
  }
  return committed;
}

async function cleanTripReferences(db, target, context = {}) {
  const targetIds = uniq(target?.targetIds || []);
  const targetNames = uniq(target?.targetNames || []);
  const ops = [];
  const trips = [];
  if (!targetIds.length && !targetNames.length) return { ops, trips };

  const tripsSnap = await db.collection('trips').get();
  for (const doc of tripsSnap.docs) {
    const cleaned = cleanLegacyTripData(doc.data() || {}, { targetIds, targetNames });
    if (!cleaned.changed) continue;
    if (isEmptyLegacyScope(cleaned.data)) {
      ops.push({ type: 'delete', ref: doc.ref });
      trips.push({ id: doc.id, removedNames: cleaned.removedNames, status: 'deleted_empty_legacy_board' });
      continue;
    }
    ops.push({
      type: 'set',
      ref: doc.ref,
      data: {
        ...cleaned.data,
        updatedAt: await serverTimestamp()
      },
      options: { merge: false }
    });
    trips.push({ id: doc.id, removedNames: cleaned.removedNames, status: context.status || 'cleaned' });
  }
  return { ops, trips };
}

async function deleteLegacyOrphan(db, body, context) {
  const requestedUsername = normalizeLookupUsername(body.username);
  const fallbackUsername = normalizeLookupUsername(body.displayName || body.name);
  const emailUsername = normalizeLookupUsername(String(body.email || '').split('@')[0] || '');
  const targetIds = uniq([
    context.userId,
    ...(Array.isArray(context.characterIds) ? context.characterIds : [])
  ]);
  const targetNames = uniq([body.displayName, body.name, requestedUsername, fallbackUsername]);
  if (!targetIds.length) return null;

  const ops = [];
  const results = { auth: 'not_applicable', userDoc: 'not_found', usernameDoc: 'skipped', characters: [], trips: [] };
  const usernameLookups = uniq([requestedUsername, fallbackUsername, emailUsername]);

  for (const characterId of targetIds) {
    ops.push({ type: 'delete', ref: db.collection('characters').doc(characterId) });
    results.characters.push({ id: characterId, status: 'deleted' });
  }

  for (const username of usernameLookups) {
    const ref = db.collection('usernames').doc(username);
    const snap = await ref.get();
    const rec = snapData(snap);
    if (!rec && username !== requestedUsername) continue;
    const recIds = uniq([rec?.userId, rec?.characterId, ...(Array.isArray(rec?.characterIds) ? rec.characterIds : [])]);
    const pointsToTarget = !rec || !rec.uid || recIds.some(id => targetIds.includes(id));
    if (!pointsToTarget) continue;
    ops.push({
      type: 'set',
      ref,
      data: {
        username,
        uid: '',
        previousUid: rec?.uid || '',
        authEmail: rec?.authEmail || `${username}@${USERNAME_DOMAIN}`,
        userId: context.userId || rec?.userId || '',
        characterId: targetIds[0] || rec?.characterId || '',
        characterIds: targetIds,
        status: 'deleted',
        lifecycleStatus: 'deleted',
        deleteReusable: true,
        deletedBy: context.deletedBy,
        deletedReason: context.reason,
        deletedAt: await serverTimestamp(),
        updatedAt: await serverTimestamp()
      },
      options: { merge: true }
    });
    results.usernameDoc = 'tombstoned';
  }

  if (context.userId) {
    ops.push({
      type: 'set',
      ref: db.collection('userIds').doc(context.userId),
      data: {
        userId: context.userId,
        uid: '',
        previousUid: '',
        characterId: targetIds[0] || '',
        characterIds: targetIds,
        status: 'deleted',
        lifecycleStatus: 'deleted',
        deleteReusable: true,
        deletedBy: context.deletedBy,
        deletedReason: context.reason,
        deletedAt: await serverTimestamp(),
        updatedAt: await serverTimestamp()
      },
      options: { merge: true }
    });
  }

  const tripCleanup = await cleanTripReferences(db, { targetIds, targetNames }, { status: 'legacy_cleaned' });
  ops.push(...tripCleanup.ops);
  results.trips.push(...tripCleanup.trips);

  if (!results.trips.length && !results.characters.length && results.usernameDoc === 'skipped') return null;
  await commitOps(db, ops);
  return results;
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
    db = await adminDb();
  } catch (error) {
    console.error('Firebase Admin service account initialization failed', error);
    return json(res, 500, { error: 'Firebase Admin service account could not be initialized.' });
  }
  if (!db) return json(res, 503, { error: 'Firebase Admin service account is not configured.' });

  let decoded;
  try {
    decoded = await (await adminAuth()).verifyIdToken(token);
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
  if (!resolved?.uid) {
    const auditRef = db.collection('adminDeleteRequests').doc();
    await auditRef.set({
      uid: '',
      userId,
      username,
      characterIds,
      reason,
      requestedBy: decoded.email,
      requestedByUid: decoded.uid,
      status: 'running',
      legacy: true,
      createdAt: await serverTimestamp()
    });
    const results = await deleteLegacyOrphan(db, body, {
      userId,
      characterIds,
      reason,
      deletedBy: decoded.email
    });
    if (!results) {
      await auditRef.set({
        status: 'not_found',
        failedAt: await serverTimestamp(),
        error: 'No Firebase Auth UID or legacy no-auth references were found.'
      }, { merge: true });
      return json(res, 404, {
        error: 'User not found. No Firebase Auth UID or legacy no-auth references were found for this User ID.'
      });
    }
    await auditRef.set({
      status: 'deleted',
      legacy: true,
      deletedAt: await serverTimestamp(),
      results
    }, { merge: true });
    return json(res, 200, {
      ok: true,
      deleted: true,
      legacy: true,
      uid: '',
      userId,
      username,
      results
    });
  }

  const uid = resolved.uid;
  const data = resolved.data || {};
  const finalUsername = username || normalizeLookupUsername(resolved.username || data.username);
  const finalCharacterIds = [...new Set([
    ...characterIds,
    ...(resolved.characterIds || []),
    String(data.characterId || data.character?.id || '').trim()
  ].filter(Boolean))];
  const finalUserId = userId || data.userId || '';
  const targetNames = uniq([
    body.displayName,
    body.name,
    data.name,
    data.character?.name,
    finalUsername
  ]);

  const auditRef = db.collection('adminDeleteRequests').doc();
  await auditRef.set({
    uid,
    userId: userId || data.userId || '',
    username: finalUsername,
    characterIds: finalCharacterIds,
    resolveSource: resolved.source || '',
    reason,
    requestedBy: decoded.email,
    requestedByUid: decoded.uid,
    status: 'running',
    createdAt: await serverTimestamp()
  });

  try {
    const results = { auth: 'skipped', userDoc: 'skipped', usernameDoc: 'skipped', characters: [] };
    try {
      await (await adminAuth()).deleteUser(uid);
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
        userId: finalUserId,
        characterId: finalCharacterIds[0] || data.characterId || data.character?.id || '',
        characterIds: finalCharacterIds,
        status: 'deleted',
        lifecycleStatus: 'deleted',
        deleteReusable: true,
        deletedBy: decoded.email,
        deletedReason: reason,
        deletedAt: await serverTimestamp(),
        updatedAt: await serverTimestamp()
      });
      results.usernameDoc = 'tombstoned';
    }
    if (finalUserId) {
      batch.set(db.collection('userIds').doc(finalUserId), {
        userId: finalUserId,
        uid: '',
        previousUid: uid,
        characterId: finalCharacterIds[0] || data.characterId || data.character?.id || '',
        characterIds: finalCharacterIds,
        status: 'deleted',
        lifecycleStatus: 'deleted',
        deleteReusable: true,
        deletedBy: decoded.email,
        deletedReason: reason,
        deletedAt: await serverTimestamp(),
        updatedAt: await serverTimestamp()
      });
      results.userIdDoc = 'tombstoned';
    }
    finalCharacterIds.forEach(id => {
      batch.delete(db.collection('characters').doc(id));
      results.characters.push({ id, status: 'deleted' });
    });
    batch.set(auditRef, {
      status: 'deleted',
      deletedAt: await serverTimestamp(),
      results
    }, { merge: true });
    await batch.commit();

    const tripCleanup = await cleanTripReferences(db, {
      targetIds: finalCharacterIds,
      targetNames
    }, { status: 'account_deleted_cleaned' });
    if (tripCleanup.ops.length) {
      await commitOps(db, tripCleanup.ops);
      results.trips = tripCleanup.trips;
      await auditRef.set({ results }, { merge: true });
    }

    return json(res, 200, { ok: true, deleted: true, uid, userId: finalUserId, username: finalUsername, results });
  } catch (error) {
    await auditRef.set({
      status: 'failed',
      failedAt: await serverTimestamp(),
      error: error?.message || String(error)
    }, { merge: true });
    return json(res, 500, { error: error?.message || 'Permanent delete failed.' });
  }
}
