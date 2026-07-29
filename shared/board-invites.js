(function () {
  const KEY = 'pointy_board_invites_v1';
  const TTL_MS = 24 * 60 * 60 * 1000;

  function cleanCharacterId(value) {
    return String(value || '').replace(/\D/g, '').slice(0, 4);
  }

  function timestampValue(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Date.parse(value) || 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
    return 0;
  }

  function inviteDocId(boardId, characterId) {
    return `${String(boardId || '').replace(/[^a-zA-Z0-9_-]/g, '-')}_${cleanCharacterId(characterId)}`;
  }

  function readStore() {
    try {
      const raw = localStorage.getItem(KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  function writeStore(list) {
    try { localStorage.setItem(KEY, JSON.stringify(Array.isArray(list) ? list : [])); } catch (_) {}
  }

  function buildInvitePayload({ boardId, boardName, character, inviter, now = Date.now(), normalizeClass }) {
    const rec = character || {};
    const account = inviter || {};
    const cls = typeof normalizeClass === 'function' ? normalizeClass(rec.class || rec.cls || 'warrior') : (rec.class || rec.cls || 'warrior');
    const id = cleanCharacterId(rec.id);
    return {
      id: inviteDocId(boardId, id),
      tripId: boardId,
      tripName: boardName || '',
      targetCharacterId: id,
      targetOwnerUid: rec.ownerUid || rec.uid || '',
      targetName: rec.name || `Hero #${id}`,
      targetClass: cls,
      targetGender: rec.gender === 'female' ? 'female' : 'male',
      targetSkin: rec.skin || '',
      inviterUid: account.uid || '',
      inviterName: account.character?.name || account.name || account.username || 'Hero',
      inviterCharacterId: account.character?.id || account.userId || '',
      status: 'pending',
      createdAt: now,
      expiresAt: now + TTL_MS
    };
  }

  async function create({ invite, testMode, db }) {
    if (!testMode && !invite.targetOwnerUid) throw new Error('missing-target-owner');
    if (testMode) {
      const list = readStore().filter(item => item.id !== invite.id);
      list.unshift(invite);
      writeStore(list);
      window.dispatchEvent(new CustomEvent('pointy-board-invites-changed'));
      return invite;
    }
    await db.collection('users')
      .doc(invite.targetOwnerUid)
      .collection('boardInvites')
      .doc(invite.id)
      .set(invite, { merge: true });
    return invite;
  }

  async function loadForAccount({ account, characterId, testMode, db }) {
    const id = cleanCharacterId(characterId);
    if (testMode) {
      return readStore().filter(invite => cleanCharacterId(invite.targetCharacterId) === id);
    }
    if (!account?.uid || !db) return [];
    const query = db.collection('users').doc(account.uid).collection('boardInvites').where('status', '==', 'pending');
    const snap = await (window.PointyFirebase?.freshGet ? window.PointyFirebase.freshGet(query) : query.get({ source: 'server' }));
    return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() || {}) }));
  }

  async function updateStatus({ invite, status, account, testMode, db, now = Date.now() }) {
    if (testMode) {
      const list = readStore().map(item => item.id === invite.id ? { ...item, status, respondedAt: now } : item);
      writeStore(list);
      return;
    }
    if (!account?.uid || !db) throw new Error('missing-account');
    await db.collection('users').doc(account.uid).collection('boardInvites').doc(invite.id).set({ status, respondedAt: now }, { merge: true });
  }

  function active(list, now = Date.now()) {
    return (Array.isArray(list) ? list : [])
      .filter(invite => invite && invite.status === 'pending' && timestampValue(invite.expiresAt) > now)
      .sort((a, b) => timestampValue(a.expiresAt) - timestampValue(b.expiresAt));
  }

  window.PointyBoardInvites = {
    KEY,
    TTL_MS,
    cleanCharacterId,
    timestampValue,
    inviteDocId,
    readStore,
    writeStore,
    buildInvitePayload,
    create,
    loadForAccount,
    updateStatus,
    active
  };
})();
