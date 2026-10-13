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
      inviterClass: account.character?.class || account.character?.cls || '',
      inviterGender: account.character?.gender || '',
      inviterSkin: account.character?.skin || '',
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
    // Each invitation attempt is immutable; a new attempt never overwrites a response.
    invite = { ...invite, id: `${invite.id}_${crypto.randomUUID()}` };
    await db.collection('users')
      .doc(invite.targetOwnerUid)
      .collection('boardInvites')
      .doc(invite.id)
      .set(invite);
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
    await respond({ inviteId: invite.id, status, account, db, now });
  }

  async function respond({ inviteId, status, account, db, mutateBoard, now = Date.now() }) {
    if (!account?.uid || !db || !['accepted', 'declined', 'expired'].includes(status)) throw new Error('invalid-invite-response');
    const ref = db.collection('users').doc(account.uid).collection('boardInvites').doc(inviteId);
    return db.runTransaction(async tx => {
      const user = await tx.get(db.collection('users').doc(account.uid));
      const snap = await tx.get(ref);
      const owner = user.data(), invite = snap.data();
      const blocked = ['archived', 'deactivated', 'delete_requested', 'deleted'];
      if (!user.exists || blocked.includes(owner.status) || blocked.includes(owner.lifecycleStatus)) throw new Error('account-blocked');
      const characterId = owner.characterId || owner.character?.id;
      if (!snap.exists || invite.targetOwnerUid !== account.uid || invite.targetCharacterId !== characterId || invite.status !== 'pending') throw new Error('invite-no-longer-pending');
      const expired = timestampValue(invite.expiresAt) <= now;
      if (expired !== (status === 'expired')) throw new Error('invite-expired');
      if (status === 'accepted') {
        const tripRef = db.collection('trips').doc(invite.tripId);
        const trip = await tx.get(tripRef);
        const hero = await tx.get(db.collection('characters').doc(characterId));
        if (!trip.exists || trip.data().archived) throw new Error('board-unavailable');
        if (!hero.exists || hero.data().ownerUid !== account.uid) throw new Error('character-owner-changed');
        const next = mutateBoard(trip.data(), invite, { ...owner, uid: account.uid, character: { ...hero.data(), id: characterId } });
        tx.set(tripRef, { ...next, updatedAt: window.PointyFirebase?.serverTimestamp?.() || now });
      }
      tx.update(ref, { status, respondedAt: now });
      return invite.tripId;
    });
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
    respond,
    active
  };
})();
