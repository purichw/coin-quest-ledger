(function () {
  const STATUS_WEIGHTS = {
    active: 0,
    archived: 1,
    deactivated: 2,
    delete_requested: 3,
    deleted: 4
  };

  function hashOf(value) {
    return window.PointyLogic.hashOf(value);
  }

  function adminHash(pass) {
    return String(hashOf(`pointy:${pass || ''}:admin`));
  }

  function h(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function q(value) {
    return JSON.stringify(String(value ?? '')).replace(/"/g, '&quot;');
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function characterLevelFromXp(xp) {
    return window.PointyLogic.levelFromXp(xp);
  }

  function profileLevelFromReputation(reputation) {
    return window.PointyLogic.levelFromReputation
      ? window.PointyLogic.levelFromReputation(reputation)
      : window.PointyLogic.levelFromRenown(reputation);
  }

  function normalizeUserStatus(value) {
    const key = String(value || 'active').toLowerCase();
    return Object.prototype.hasOwnProperty.call(STATUS_WEIGHTS, key) ? key : 'active';
  }

  function statusWeight(value) {
    return STATUS_WEIGHTS[normalizeUserStatus(value)] || 0;
  }

  function mergeUserStatus(a, b) {
    return statusWeight(b) > statusWeight(a) ? normalizeUserStatus(b) : normalizeUserStatus(a);
  }

  function userLifecycleLabel(status) {
    return {
      active: 'active',
      archived: 'archived',
      deactivated: 'deactivated',
      delete_requested: 'delete requested',
      deleted: 'deleted'
    }[normalizeUserStatus(status)] || 'active';
  }

  function normalizeUsername(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 32);
  }

  function tempPassword() {
    return 'CQ-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function redactExportSecrets(value) {
    if (Array.isArray(value)) return value.map(redactExportSecrets);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !/password|recovery|token|secret|credential|ownerHash|authEmail|baseContentKey|baseDraftKey/i.test(key))
      .map(([key, item]) => [key, redactExportSecrets(item)]));
  }

  function recoveryCodeValue() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => alphabet[b % alphabet.length]).join('').replace(/(.{4})/g, '$1-').replace(/-$/, '');
  }

  async function publishBoards({ db, operations, revisionId, revision }) {
    if (operations.length > 200) throw new Error('Publish ได้ครั้งละไม่เกิน 200 บอร์ด');
    await db.runTransaction(async tx => {
      const paths = [...new Set(operations.flatMap(op => [op.from, op.to]).filter(Boolean))];
      const snapshots = new Map();
      for (const id of paths) snapshots.set(id, await tx.get(db.collection('trips').doc(id)));
      for (const op of operations) {
        const source = snapshots.get(op.from);
        if (!op.created && (!source?.exists || window.PointyLogic.tripContentKey(source.data()) !== op.baseline)) throw new Error(`บอร์ด ${op.from} เปลี่ยนจากอีกเครื่อง ข้อมูล draft ยังอยู่ กรุณาตรวจข้อมูลล่าสุดก่อน Publish`);
        if (!op.deleted && (op.created || op.to !== op.from) && snapshots.get(op.to)?.exists) throw new Error(`รหัสบอร์ด ${op.to} มีอยู่แล้ว`);
      }
      for (const op of operations) {
        if (!op.created && (op.deleted || op.from !== op.to)) tx.delete(db.collection('trips').doc(op.from));
        if (!op.deleted) tx.set(db.collection('trips').doc(op.to), op.data);
      }
      tx.set(db.collection('adminRevisions').doc(revisionId), revision);
    });
  }

  async function setAccountLifecycle({ db, uid, userId, patch, timestamp }) {
    await db.runTransaction(async tx => {
      const ref = db.collection('users').doc(uid), user = await tx.get(ref);
      if (!user.exists || user.data().userId !== userId || user.data().status === 'deleted') throw new Error('ข้อมูลบัญชีเปลี่ยน กรุณาโหลดใหม่');
      if (user.data().recoveryReset?.expiresAt > Date.now()) throw new Error('บัญชีกำลังกู้คืน กรุณาลองใหม่หลังทำรายการเสร็จ');
      const usernameRef = db.collection('usernames').doc(user.data().username), idRef = db.collection('userIds').doc(userId);
      const username = await tx.get(usernameRef), id = await tx.get(idRef);
      if (username.data()?.uid !== uid || id.data()?.uid !== uid) throw new Error('ข้อมูลระบุตัวตนบัญชีไม่ตรงกัน');
      const state = { status: patch.status, lifecycleStatus: patch.status, updatedAt: timestamp };
      tx.update(ref, { ...patch, ...state });
      tx.update(usernameRef, state); tx.update(idRef, state);
    });
  }

  window.CoinQuestAdminUtils = {
    hashOf,
    adminHash,
    h,
    q,
    uid,
    clone,
    characterLevelFromXp,
    profileLevelFromReputation,
    normalizeUserStatus,
    statusWeight,
    mergeUserStatus,
    userLifecycleLabel,
    normalizeUsername,
    tempPassword,
    redactExportSecrets,
    recoveryCodeValue,
    publishBoards,
    setAccountLifecycle
  };
})();
