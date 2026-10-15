const ADMIN_PARAMS = new URLSearchParams(location.search);
const TEST_MODE = ADMIN_PARAMS.get('test') === '1';
const DRAFT_KEY = 'pointy_super_admin_draft_v2';
const GATE_KEY = 'pointy_super_admin_gate_hash_v2';
const GATE_UNLOCK_KEY = 'pointy_super_admin_unlocked_v2';
const LOCAL_REVISIONS_KEY = 'pointy_super_admin_revisions_v2';
const LOCAL_USER_LIFECYCLE_KEY = 'pointy_admin_user_lifecycle_v1';
const VALID_TABS = new Set(['dashboard', 'map', 'boards', 'users', 'admins', 'tombstones', 'audit', 'revisions', 'support']);
const SUPER_ADMIN_EMAIL = 'purich.wc@gmail.com';
const {
  hashOf,
  adminHash,
  h,
  q,
  uid,
  clone,
  characterLevelFromXp,
  profileLevelFromReputation,
  normalizeUserStatus,
  mergeUserStatus,
  userLifecycleLabel,
  normalizeUsername,
  tempPassword,
  recoveryCodeValue
} = window.CoinQuestAdminUtils;

let published = { boards: [], revisions: [] };
let draft = { boards: [] };
let tab = VALID_TABS.has(ADMIN_PARAMS.get('tab')) ? ADMIN_PARAMS.get('tab') : 'boards';
let query = '';
let detail = null;
let boardFilter = 'all';
let auditFilter = 'all';
let dashMode = 'a';
let dirty = false;
const boardSectionStates = new Map();
let cloudUsers = [];
let cloudTombstones = [];
const collapsedTombstones = new Set();
let adminUser = null;
let adminAuthReady = TEST_MODE;
let adminAuthStarted = false;
let adminAuthSettling = false;
let adminGateError = '';
let adminLoadError = '';
let draftWarning = '';
let adminBackendStatus = TEST_MODE
  ? { checked: true, adminDeleteConfigured: true, mode: 'test' }
  : { checked: false, adminDeleteConfigured: false, mode: 'unknown' };

function initFirebase() {
  if (TEST_MODE || firebase.apps.length) return;
  firebase.initializeApp({
    apiKey: "AIzaSyBDDC1sJnITQOqyp1qiPGvB1KLuUH1B28o",
    authDomain: "pointy-personal-toolkit.firebaseapp.com",
    projectId: "pointy-personal-toolkit",
    storageBucket: "pointy-personal-toolkit.firebasestorage.app",
    messagingSenderId: "901775387853",
    appId: "1:901775387853:web:030f47acc78c71a5548d84"
  });
}
function localUserLifecycle() {
  try { return JSON.parse(localStorage.getItem(LOCAL_USER_LIFECYCLE_KEY) || '{}') || {}; } catch (_) { return {}; }
}
function saveLocalUserLifecycle(data) {
  localStorage.setItem(LOCAL_USER_LIFECYCLE_KEY, JSON.stringify(data || {}));
}

function isUnlocked() {
  return TEST_MODE ? sessionStorage.getItem(GATE_UNLOCK_KEY) === '1' : !!adminUser && adminUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL;
}
function gateConfigured() {
  return !!localStorage.getItem(GATE_KEY);
}
function adminAuth() {
  if (TEST_MODE) return null;
  return window.PointyFirebase?.auth?.() || (firebase.apps.length ? firebase.auth() : null);
}
function freshFirestoreGet(refOrQuery) {
  if (TEST_MODE) return refOrQuery.get();
  return window.PointyFirebase?.freshGet
    ? window.PointyFirebase.freshGet(refOrQuery)
    : refOrQuery.get({ source: 'server' });
}
function isAllowedAdmin(user) {
  return String(user?.email || '').toLowerCase() === SUPER_ADMIN_EMAIL;
}
function adminAuthErrorMessage(error) {
  const code = String(error?.code || '');
  const raw = String(error?.message || '');
  if (code.includes('operation-not-allowed') || raw.includes('operation-not-allowed')) {
    return 'Google sign-in provider ยังไม่ได้เปิดใน Firebase Auth. เปิด Sign-in method: Google สำหรับ project pointy-personal-toolkit แล้วลองใหม่';
  }
  if (code.includes('unauthorized-domain') || raw.includes('unauthorized-domain')) {
    return 'Domain นี้ยังไม่อยู่ใน Firebase Auth authorized domains. เพิ่ม coinquestledger.vercel.app แล้วลองใหม่';
  }
  if (code.includes('popup-blocked') || raw.includes('popup-blocked')) {
    return 'Browser บล็อก Google sign-in popup. อนุญาต popup สำหรับเว็บนี้แล้วกด Sign in with Google อีกครั้ง';
  }
  if (code.includes('popup-closed-by-user') || raw.includes('popup-closed-by-user')) {
    return 'ปิดหน้าต่าง Google sign-in ก่อนเข้าสู่ระบบสำเร็จ';
  }
  return raw || 'Google sign-in failed.';
}
async function refreshAdminBackendStatus() {
  if (TEST_MODE) {
    adminBackendStatus = { checked: true, adminDeleteConfigured: true, mode: 'test' };
    return adminBackendStatus;
  }
  try {
    const res = await fetch('/api/admin-delete-status', { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    adminBackendStatus = {
      checked: true,
      adminDeleteConfigured: !!data.adminDeleteConfigured,
      mode: data.mode || 'unknown',
      message: data.adminDeleteConfigured
        ? 'Privileged delete backend is configured.'
        : 'Privileged delete backend is missing Firebase Admin service account env vars.'
    };
  } catch (error) {
    adminBackendStatus = {
      checked: true,
      adminDeleteConfigured: false,
      mode: 'unreachable',
      message: error?.message || 'Could not reach privileged delete status endpoint.'
    };
  }
  return adminBackendStatus;
}
function adminDeleteBackendNote() {
  if (TEST_MODE) return 'Test mode simulates permanent delete requests locally.';
  if (!adminBackendStatus.checked) return 'Permanent account deletion is unavailable until verification completes.';
  if (adminBackendStatus.adminDeleteConfigured) return 'Permanent account deletion is available.';
  return 'Permanent account deletion is unavailable. Contact the system administrator to configure this service.';
}
function startAdminAuth() {
  if (TEST_MODE || adminAuthStarted) return;
  const releaseEntry = window.CoinQuestLoading?.begin();
  adminAuthSettling = true;
  initFirebase();
  const auth = adminAuth();
  if (!auth?.onAuthStateChanged) {
    adminAuthReady = true;
    adminAuthSettling = false;
    adminGateError = 'Firebase Auth is not available on this page.';
    renderGate();
    releaseEntry?.();
    return;
  }
  adminAuthStarted = true;
  auth.onAuthStateChanged(async user => {
    try {
      adminAuthReady = true;
      adminAuthSettling = false;
      if (user && isAllowedAdmin(user)) {
        adminUser = user;
        adminGateError = '';
        await refreshAdminData();
        return;
      }
      adminUser = null;
      if (user) {
        adminGateError = `บัญชี ${user.email || 'unknown'} ไม่มีสิทธิ์ Super Admin`;
        await auth.signOut().catch(() => {});
      }
      renderGate();
    } finally { releaseEntry?.(); }
  });
}
async function unlockGate() {
  if (!TEST_MODE) {
    adminGateError = '';
    try {
      initFirebase();
      const auth = adminAuth();
      if (!auth) throw new Error('Firebase Auth is not available.');
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ login_hint: SUPER_ADMIN_EMAIL });
      const cred = await auth.signInWithPopup(provider);
      if (!isAllowedAdmin(cred.user)) {
        adminGateError = `บัญชี ${cred.user?.email || 'unknown'} ไม่มีสิทธิ์ Super Admin`;
        await auth.signOut().catch(() => {});
        renderGate();
      }
    } catch (error) {
      adminGateError = adminAuthErrorMessage(error);
      renderGate();
    }
    return;
  }
  const pass = document.getElementById('gate-pass')?.value || '';
  if (!pass.trim()) return;
  if (!gateConfigured()) {
    localStorage.setItem(GATE_KEY, String(hashOf(`super:${pass}`)));
    sessionStorage.setItem(GATE_UNLOCK_KEY, '1');
    boot();
    return;
  }
  if (String(hashOf(`super:${pass}`)) !== localStorage.getItem(GATE_KEY)) {
    showModal('รหัสไม่ถูกต้อง', 'Test mode gate นี้ใช้สำหรับ automated regression เท่านั้น ไม่ใช่ production security', [{ label: 'ปิด' }]);
    return;
  }
  sessionStorage.setItem(GATE_UNLOCK_KEY, '1');
  boot();
}
async function lockGate() {
  if (!TEST_MODE) {
    adminUser = null;
    await adminAuth()?.signOut?.().catch(() => {});
    renderGate();
    return;
  }
  sessionStorage.removeItem(GATE_UNLOCK_KEY);
  renderGate();
}

function normalizeBoard(id, data = {}) {
  const admin = data.admin || {};
  const board = {
    id,
    originalId: id,
    type: data.boardType || data.type || (data.dragons ? 'debt' : 'split'),
    tripName: data.tripName || 'ทริปใหม่',
    urlId: id,
    adminOwnerHash: admin.ownerHash || '',
    adminId: admin.adminId || '',
    adminName: admin.adminName || '',
    passwordHash: admin.passwordHash || '',
    newPassword: '',
    participants: Array.isArray(data.participants) ? data.participants.slice() : [],
    characterIds: data.characterIds && typeof data.characterIds === 'object' ? { ...data.characterIds } : {},
    data,
    deleted: false,
    created: false
  };
  board.baseContentKey = PointyLogic.tripContentKey(data);
  board.baseDraftKey = PointyLogic.tripContentKey(materializeBoard(board));
  return board;
}
async function loadPublished({ discardDraft = false } = {}) {
  initFirebase();
  let boards = [];
  let revisions = [];
  let nextUsers = [], nextTombstones = [];
  if (TEST_MODE) {
    boards = Object.keys(sessionStorage)
      .filter(k => k.startsWith('pointy_test_trip_'))
      .map(k => normalizeBoard(k.replace('pointy_test_trip_', ''), JSON.parse(sessionStorage.getItem(k) || '{}')));
    revisions = JSON.parse(localStorage.getItem(LOCAL_REVISIONS_KEY) || '[]');
  } else {
    const db = firebase.firestore();
    const [snap, revSnap, usersSnap, tombSnap] = await Promise.all([
      freshFirestoreGet(db.collection('trips')),
      freshFirestoreGet(db.collection('adminRevisions').orderBy('createdAt', 'desc').limit(20)),
      freshFirestoreGet(db.collection('users')),
      freshFirestoreGet(db.collection('usernames').where('deleteReusable', '==', true).limit(100))
    ]);
    boards = snap.docs.map(doc => normalizeBoard(doc.id, doc.data() || {}));
    revisions = revSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    nextUsers = usersSnap.docs.map(doc => normalizeCloudUser(doc.id, doc.data() || {})).filter(Boolean);
    nextTombstones = tombSnap.docs.map(doc => normalizeUsernameTombstone(doc.id, doc.data() || {})).filter(Boolean);
  }
  boards.sort((a, b) => a.id.localeCompare(b.id));
  published = { boards, revisions };
  cloudUsers = nextUsers;
  cloudTombstones = nextTombstones;
  if (discardDraft) localStorage.removeItem(DRAFT_KEY);
  const saved = localStorage.getItem(DRAFT_KEY);
  draftWarning = '';
  draft = { boards: clone(boards) };
  dirty = false;
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed.boards) || !parsed.boards.every(b => b && typeof b.originalId === 'string' && typeof b.urlId === 'string' && typeof b.tripName === 'string' && Array.isArray(b.participants) && b.characterIds && b.data)) throw new Error('invalid-draft');
      draft = parsed;
      dirty = true;
    } catch (_) { draftWarning = 'อ่าน draft ที่บันทึกไว้ไม่ได้ กำลังแสดงข้อมูลที่ publish แล้ว ข้อมูล draft เดิมยังเก็บไว้จนกว่าจะ Save หรือ Restore'; }
  }
  adminLoadError = '';
}
async function refreshAdminData() {
  document.getElementById('app').innerHTML = `<main class="gate"><section class="gate-card card card-pad" aria-label="Admin Portal">${window.CoinQuestLoading.skeleton()}</section></main>`;
  try { await Promise.all([loadPublished(), refreshAdminBackendStatus()]); }
  catch (_) { adminLoadError = 'โหลดข้อมูล Admin ไม่ครบ กรุณาลองใหม่ก่อนแก้ไขหรือ Publish'; }
  render();
}

function boardById(id) { return draft.boards.find(b => b.originalId === id || b.urlId === id); }
function markDirty() {
  dirty = true;
  const badge = document.getElementById('draft-badge');
  if (badge) badge.textContent = 'Draft changed locally';
  const publish = document.getElementById('publish-btn');
  if (publish) {
    const changes = diffBoards().length;
    publish.textContent = `Publish${changes ? ` (${changes})` : ''}`;
  }
}
function updateBoard(originalId, patch) {
  const board = boardById(originalId);
  if (!board) return;
  Object.assign(board, patch);
  markDirty();
}
function adminGroups() {
  const map = new Map();
  draft.boards.filter(b => !b.deleted).forEach(b => {
    const key = b.adminOwnerHash || b.adminId || 'unknown';
    if (!map.has(key)) map.set(key, { key, adminId: b.adminId, adminName: b.adminName, ownerUserId: '', boards: [] });
    const g = map.get(key);
    g.adminId = g.adminId || b.adminId;
    g.adminName = g.adminName || b.adminName;
    g.ownerUserId = g.ownerUserId || adminOwnerUserId(b);
    g.boards.push(b);
  });
  return [...map.values()].sort((a, b) => String(a.adminId || a.key).localeCompare(String(b.adminId || b.key)));
}
function updateAdminGroup(boardIds, patch) {
  // Bind the edit to its original boards: a fallback group key may itself be edited.
  const boards = draft.boards.filter(b => !b.deleted && boardIds.includes(b.originalId));
  if (!boards.length) return;
  boards.forEach(b => Object.assign(b, patch));
  const first = boards[0];
  if (detail?.kind === 'admin') detail.id = first.adminOwnerHash || first.adminId || 'unknown';
  document.querySelectorAll('[data-admin-anchor]').forEach(el => {
    if (el.dataset.adminAnchor !== first.originalId) return;
    el.querySelectorAll('[data-admin-value]').forEach(value => {
      const field = value.dataset.adminValue;
      value.textContent = first[field] || '—';
    });
  });
  markDirty();
}
function users() {
  return draft.boards.filter(b => !b.deleted).flatMap(b => b.participants.map(name => ({
    board: b,
    name,
    id: b.characterIds[name] || ''
  })));
}
function adminReturnUrl(nextTab = tab || 'boards') {
  const params = new URLSearchParams();
  if (TEST_MODE) params.set('test', '1');
  params.set('tab', VALID_TABS.has(nextTab) ? nextTab : 'boards');
  return `/admin/?${params.toString()}`;
}
function characterProfileLink(id, returnTab = 'users') {
  const params = new URLSearchParams({
    id: String(id || ''),
    from: 'admin',
    return: adminReturnUrl(returnTab)
  });
  if (TEST_MODE) params.set('test', '1');
  return `/character/?${params.toString()}`;
}
function activeBoards() { return draft.boards.filter(b => !b.deleted); }
function boardTypeLabel(b) {
  const type = b.type || 'split';
  if (type === 'debt') return 'Debt Dragon';
  if (type === 'treasury') return 'Treasury';
  return 'Split Expenses';
}
function boardTypeIcon(b) {
  const type = b.type || 'split';
  if (type === 'debt') return '🐉';
  if (type === 'treasury') return '🏦';
  return '📜';
}
function userKey(name, id) { return id || ('U-' + String(hashOf(String(name || 'user'))).slice(-4)); }
function participantUserId(name, id) { return userKey(name, id); }
function adminOwnerUserId(b) {
  const adminChar = b.data?.admin?.characterId || b.characterIds?.[b.adminName] || '';
  if (adminChar) {
    const participant = b.participants.find(name => String(b.characterIds?.[name] || '') === String(adminChar));
    if (participant) return participantUserId(participant, adminChar);
    const cloud = cloudUsers.find(u => (u.chars || []).some(c => String(c.id || '') === String(adminChar)) || String(u.userId || '') === String(adminChar));
    if (cloud) return cloud.userId;
  }
  if (b.adminName && b.characterIds?.[b.adminName]) return participantUserId(b.adminName, b.characterIds[b.adminName]);
  return '';
}
function normalizeCloudUser(uid, data = {}) {
  const character = data.character || {};
  const userId = String(data.userId || data.characterId || character.id || '').trim() || userKey(data.username || data.name || uid, '');
  const name = data.name || data.username || String(data.email || '').split('@')[0] || 'User';
  const charId = String(data.characterId || character.id || '').replace(/\D/g, '').slice(0, 4);
  const chars = charId ? [{
    id: charId,
    name: character.name || name,
    className: character.class || character.cls || 'hero',
    xp: Number(data.characterXp || character.xp || 0),
    boards: [],
    boardId: ''
  }] : [];
  return {
    uid,
    userId,
    name,
    username: data.username || '',
    email: data.email || '',
    status: normalizeUserStatus(data.status || data.lifecycleStatus || (data.deactivated ? 'deactivated' : data.archived ? 'archived' : 'active')),
    archivedAt: data.archivedAt || 0,
    deactivatedAt: data.deactivatedAt || 0,
    deleteRequestedAt: data.deleteRequestedAt || 0,
    deletedAt: data.deletedAt || 0,
    lifecycleReason: data.lifecycleReason || data.reason || '',
    chars,
    boards: [],
    adminGroups: [],
    cloud: true
  };
}
function normalizeUsernameTombstone(username, data = {}) {
  const status = normalizeUserStatus(data.status || data.lifecycleStatus || '');
  if (status !== 'deleted' && data.deleteReusable !== true) return null;
  return {
    username: data.username || username || '',
    userId: String(data.userId || data.characterId || '').trim(),
    characterIds: [...new Set([
      data.characterId,
      ...(Array.isArray(data.characterIds) ? data.characterIds : [])
    ].map(id => String(id || '').trim()).filter(Boolean))],
    previousUid: data.previousUid || '',
    deletedAt: data.deletedAt || 0,
    reason: data.deletedReason || '',
    source: 'username'
  };
}
function mergeUserRecord(map, rec) {
  if (!rec?.userId) return rec;
  const existing = map.get(rec.userId);
  if (!existing) {
    map.set(rec.userId, { ...rec, chars: rec.chars || [], boards: rec.boards || [], adminGroups: rec.adminGroups || [] });
    return map.get(rec.userId);
  }
  existing.uid = existing.uid || rec.uid || '';
  existing.username = existing.username || rec.username || '';
  existing.email = existing.email || rec.email || '';
  existing.name = existing.name || rec.name || existing.username || 'User';
  existing.cloud = existing.cloud || rec.cloud;
  existing.status = mergeUserStatus(existing.status, rec.status);
  existing.archivedAt = existing.archivedAt || rec.archivedAt || 0;
  existing.deactivatedAt = existing.deactivatedAt || rec.deactivatedAt || 0;
  existing.deleteRequestedAt = existing.deleteRequestedAt || rec.deleteRequestedAt || 0;
  existing.deletedAt = existing.deletedAt || rec.deletedAt || 0;
  existing.lifecycleReason = existing.lifecycleReason || rec.lifecycleReason || '';
  (rec.boards || []).forEach(b => {
    if (!existing.boards.some(x => x.originalId === b.originalId)) existing.boards.push(b);
  });
  (rec.adminGroups || []).forEach(g => {
    if (!existing.adminGroups.some(x => x.key === g.key)) existing.adminGroups.push(g);
  });
  (rec.chars || []).forEach(ch => {
    const current = existing.chars.find(x => String(x.id || '') === String(ch.id || ''));
    if (current) {
      current.name = current.name || ch.name;
      current.className = current.className || ch.className;
      current.xp = Math.max(Number(current.xp || 0), Number(ch.xp || 0));
      (ch.boards || []).forEach(bid => { if (!current.boards.includes(bid)) current.boards.push(bid); });
      current.boardId = current.boardId || ch.boardId || '';
    } else {
      existing.chars.push(ch);
    }
  });
  return existing;
}
function userRecords() {
  const map = new Map();
  const lifecycle = localUserLifecycle();
  cloudUsers.forEach(u => mergeUserRecord(map, u));
  activeBoards().forEach(b => {
    b.participants.forEach(name => {
      const charId = b.characterIds[name] || '';
      const key = participantUserId(name, charId);
      const u = mergeUserRecord(map, { userId: key, name, chars: [], boards: [], adminGroups: [] });
      if (!u.boards.some(x => x.originalId === b.originalId)) u.boards.push(b);
      let ch = u.chars.find(c => c.id === charId);
      if (!ch) {
        ch = {
          id: charId,
          name,
          className: b.data?.heroClasses?.[name] || 'hero',
          xp: Number(b.data?.characterXp?.[charId] || b.data?.settleXp?.[name] || 0),
          boards: [],
          boardId: b.originalId
        };
        u.chars.push(ch);
      }
      if (!ch.boards.includes(b.originalId)) ch.boards.push(b.originalId);
      ch.xp = Math.max(ch.xp, Number(b.data?.characterXp?.[charId] || b.data?.settleXp?.[name] || 0));
    });
  });
  adminGroups().forEach(g => {
    const key = g.ownerUserId || '';
    if (!key) return;
    const u = mergeUserRecord(map, { userId: key, name: g.adminName || g.adminId || 'Admin', chars: [], boards: [], adminGroups: [] });
    if (!u.adminGroups.some(x => x.key === g.key)) u.adminGroups.push(g);
  });
  return [...map.values()].map(u => {
    const hasLiveCloudRecord = !TEST_MODE && (u.cloud || u.uid);
    const local = hasLiveCloudRecord ? {} : (lifecycle[u.userId] || lifecycle[u.uid] || {});
    return {
      ...u,
      status: mergeUserStatus(u.status, local.status),
      archivedAt: u.archivedAt || local.archivedAt || 0,
      deactivatedAt: u.deactivatedAt || local.deactivatedAt || 0,
      deleteRequestedAt: u.deleteRequestedAt || local.deleteRequestedAt || 0,
      deletedAt: u.deletedAt || local.deletedAt || 0,
      lifecycleReason: u.lifecycleReason || local.reason || ''
    };
  }).sort((a, b) => a.userId.localeCompare(b.userId));
}
function visibleUserRecords() {
  return userRecords().filter(u => normalizeUserStatus(u.status) !== 'deleted');
}
function tombstoneRecords() {
  const map = new Map();
  const add = rec => {
    if (!rec?.userId && !rec?.username) return;
    const key = rec.userId || rec.username;
    const existing = map.get(key) || { userId: rec.userId || '', username: rec.username || '', characterIds: [], previousUid: '', deletedAt: 0, reason: '', source: '' };
    existing.username = existing.username || rec.username || '';
    existing.userId = existing.userId || rec.userId || '';
    existing.previousUid = existing.previousUid || rec.previousUid || '';
    existing.deletedAt = existing.deletedAt || rec.deletedAt || 0;
    existing.reason = existing.reason || rec.reason || '';
    existing.source = existing.source ? `${existing.source}, ${rec.source}` : rec.source || '';
    (rec.characterIds || []).forEach(id => { if (!existing.characterIds.includes(id)) existing.characterIds.push(id); });
    map.set(key, existing);
  };
  cloudTombstones.forEach(add);
  const lifecycle = localUserLifecycle();
  Object.entries(lifecycle).forEach(([userId, rec]) => {
    if (normalizeUserStatus(rec?.status) === 'deleted') {
      add({ userId, characterIds: [userId], deletedAt: rec.deletedAt || 0, reason: rec.reason || '', source: 'local lifecycle' });
    }
  });
  const activeIds = new Set(visibleUserRecords().map(u => u.userId));
  return [...map.values()]
    .filter(rec => !activeIds.has(rec.userId))
    .sort((a, b) => String(a.userId || a.username).localeCompare(String(b.userId || b.username)));
}
function userById(id) { return userRecords().find(u => u.userId === id); }
function patchCloudUserLifecycle(user, patch, reason = '') {
  if (!user?.uid && !user?.userId) return;
  cloudUsers = cloudUsers.map(item => {
    if (item.uid !== user.uid && item.userId !== user.userId) return item;
    return {
      ...item,
      ...patch,
      status: normalizeUserStatus(patch.status),
      lifecycleReason: reason || patch.lifecycleReason || item.lifecycleReason || ''
    };
  });
}
function adminGroupByKey(key) { return adminGroups().find(g => g.key === key); }
function charById(id) {
  return userRecords().flatMap(u => u.chars.map(c => ({ ...c, userId: u.userId, userName: u.name }))).find(c => c.id === id);
}
function boardStats(b) {
  const expenses = Array.isArray(b.data?.expenses) ? b.data.expenses : [];
  const dragons = Array.isArray(b.data?.dragons) ? b.data.dragons : [];
  const spend = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const balance = dragons.reduce((sum, d) => sum + Number(d.balance || d.remaining || 0), 0);
  const overdue = dragons.filter(d => Number(d.dueDay || 0) > 0).length;
  return { expenses: expenses.length, spend, dragons: dragons.length, balance, overdue };
}
function fmtMoney(v) { return '฿' + Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function userReputation(u) { return u.chars.reduce((sum, c) => sum + Number(c.xp || 0), 0) + u.adminGroups.length * 800; }
function userLevel(u) { return profileLevelFromReputation(userReputation(u)).lvl; }
function idChip(kind, label, id = label, extra = '') {
  if (kind === 'char') return staticIdChip(kind, label, extra);
  const safeKind = kind === 'debt' ? 'debt' : kind;
  const on = kind === 'char' ? '' : ` onclick="openDetail(${q(kind)},${q(id)})"`;
  const tag = kind === 'board' ? 'Board' : kind === 'admin' ? 'Admin' : kind === 'user' ? 'User' : 'Char';
  const protoKind = kind === 'board' ? 'k-board' : kind === 'admin' ? 'k-admin' : kind === 'user' ? 'k-user' : kind === 'char' ? 'k-char' : safeKind;
  return `<button type="button" class="id-chip idchip ${safeKind} ${protoKind}"${on}><span class="ic-ico">${tag}</span><span>${h(label || '-')}</span>${extra}</button>`;
}
function staticIdChip(kind, label, extra = '') {
  const safeKind = kind === 'debt' ? 'debt' : kind;
  const tag = kind === 'board' ? 'Board' : kind === 'admin' ? 'Admin' : kind === 'user' ? 'User' : 'Char';
  const protoKind = kind === 'board' ? 'k-board' : kind === 'admin' ? 'k-admin' : kind === 'user' ? 'k-user' : kind === 'char' ? 'k-char' : safeKind;
  return `<span class="id-chip idchip ${safeKind} ${protoKind}"><span class="ic-ico">${tag}</span><span>${h(label || '-')}</span>${extra}</span>`;
}
function openDetail(kind, id) {
  window.CoinQuestAdminShell.close();
  detail = { kind, id };
  if (kind === 'board') tab = 'boards';
  if (kind === 'admin') tab = 'admins';
  if (kind === 'user') tab = 'users';
  render();
}
function closeDetail(nextTab) {
  detail = null;
  if (nextTab) tab = nextTab;
  render();
}
function selectTab(next) {
  window.CoinQuestAdminShell.close();
  tab = next;
  detail = null;
  query = '';
  render();
  document.querySelector('.page-title')?.setAttribute('tabindex', '-1');
  document.querySelector('.page-title')?.focus({ preventScroll: true });
}
function restoreBoard(id) {
  const old = published.boards.find(b => b.originalId === id);
  if (!old) return;
  confirmAction('Restore Board?', `Restore ${old.urlId} จาก published version ล่าสุด`, () => {
    const index = draft.boards.findIndex(b => b.originalId === id);
    if (index >= 0) draft.boards[index] = clone(old);
    markDirty();
    render();
  });
}
function addBoard() {
  confirmAction('เพิ่ม Board ใหม่?', 'จะเพิ่ม draft board ใหม่ ยังไม่ publish จนกด Publish', () => {
    const used = new Set(draft.boards.map(b => b.urlId));
    const available = Array.from({ length: 9000 }, (_, i) => String(i + 1000)).filter(id => !used.has(id));
    if (!available.length) throw new Error('ไม่มีรหัสบอร์ดว่าง');
    const id = available[Math.floor(Math.random() * available.length)];
    const type = ['split', 'debt', 'treasury'].includes(boardFilter) ? boardFilter : 'split';
    draft.boards.push(normalizeBoard(id, { boardType: type, tripName: 'New Board', participants: [], characterIds: {}, admin: { adminId: 'ADM-' + uid().slice(-6), adminName: '' } }));
    draft.boards[draft.boards.length - 1].created = true;
    dirty = true;
    if (tab === 'boards') query = '';
    render();
  });
}
function setBoardArchived(boardId, archived) {
  const b = boardById(boardId);
  if (!b) return;
  confirmAction(archived ? 'Archive board?' : 'Reopen board?', `${b.urlId}: เก็บสมาชิกและรายการเงินทั้งหมดไว้ การเปลี่ยนแปลงมีผลเมื่อ Publish`, () => {
    b.data.archived = archived;
    b.data.archivedAt = archived ? Date.now() : null;
    b.data.status = archived ? 'archived' : 'active';
    markDirty();
    render();
  });
}
function deleteBoard(id) {
  const b = boardById(id);
  if (!b) return;
  confirmAction('ลบ Board?', `ลบ ${b.urlId} หลัง Publish`, () => {
    b.deleted = true;
    dirty = true;
    render();
  });
}

function diffBoards(boardId = null) {
  const changes = [];
  const pub = new Map(published.boards.map(b => [b.originalId, b]));
  draft.boards.filter(b => boardId === null || b.originalId === boardId).forEach(b => {
    if (b.deleted && !b.created) changes.push({ area: 'Boards', action: 'Deleted', detail: `${b.originalId} (${b.tripName})` });
    if (b.created && !b.deleted) changes.push({ area: 'Boards', action: 'Added', detail: `${b.urlId} (${b.tripName})` });
    const old = pub.get(b.originalId);
    if (!old || b.deleted) return;
    if (old.urlId !== b.urlId) changes.push({ area: 'Boards', action: 'Updated', detail: `URL ${old.urlId} → ${b.urlId}` });
    if (old.tripName !== b.tripName) changes.push({ area: 'Boards', action: 'Updated', detail: `${b.urlId} name "${old.tripName}" → "${b.tripName}"` });
    if ((old.adminId || '') !== (b.adminId || '')) changes.push({ area: 'Admins', action: 'Updated', detail: `${b.urlId} admin ID ${old.adminId || '-'} → ${b.adminId || '-'}` });
    if ((old.adminName || '') !== (b.adminName || '')) changes.push({ area: 'Admins', action: 'Updated', detail: `${b.urlId} admin name ${old.adminName || '-'} → ${b.adminName || '-'}` });
    if (b.newPassword) changes.push({ area: 'Admins', action: 'Updated', detail: `${b.urlId} admin password reset` });
    b.participants.forEach(name => {
      if (!old.participants.includes(name)) changes.push({ area: 'Users', action: 'Added', detail: `${name} in ${b.urlId}` });
      if ((old.characterIds[name] || '') !== (b.characterIds[name] || '')) changes.push({ area: 'Users', action: 'Updated', detail: `${name} ID ${old.characterIds[name] || '-'} → ${b.characterIds[name] || '-'}` });
    });
    old.participants.forEach(name => {
      if (!b.participants.includes(name)) changes.push({ area: 'Users', action: 'Deleted', detail: `${name} from ${b.urlId}` });
    });
    if (PointyLogic.tripContentKey(old.data) !== PointyLogic.tripContentKey(b.data)) changes.push({ area: 'Boards', action: 'Updated', detail: `${b.urlId} board data updated${b.data.archived ? ' (archived)' : ''}` });
  });
  return changes;
}
function validateDraft() {
  const ids = new Set();
  for (const b of draft.boards.filter(x => !x.deleted)) {
    if (!b.urlId) return 'Board URL ห้ามว่าง';
    if ((b.created || b.urlId !== b.originalId) && !/^\d{4}$/.test(b.urlId)) return 'รหัสบอร์ดใหม่ต้องเป็นตัวเลข 4 หลัก';
    if (!b.tripName.trim() || b.tripName.trim().length > 100) return 'ชื่อบอร์ดต้องมี 1–100 ตัวอักษร';
    if (ids.has(b.urlId)) return `Board URL ซ้ำ: ${b.urlId}`;
    ids.add(b.urlId);
  }
  return '';
}
function saveDraft() {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); }
  catch (_) { showModal('บันทึกไม่สำเร็จ', 'พื้นที่จัดเก็บไม่พร้อม ข้อมูลที่แก้ยังอยู่บนหน้านี้ กรุณาลองใหม่', [{ label: 'ปิด' }]); return; }
  dirty = true;
  draftWarning = '';
  showModal('Saved', 'บันทึก draft ลง localStorage แล้ว', [{ label: 'ปิด' }]);
  render();
}
function restoreDraft() {
  confirmAction('Restore?', 'ทิ้ง draft และโหลดข้อมูลที่ publish จากเซิร์ฟเวอร์อีกครั้ง', async () => {
    await loadPublished({ discardDraft: true });
    render();
  });
}
async function publishDraft() {
  if (adminLoadError || draftWarning) { showModal('Publish ไม่ได้', adminLoadError || draftWarning, [{ label: 'ปิด' }]); return; }
  const err = validateDraft();
  if (err) { showModal('Publish ไม่ได้', err, [{ label: 'ปิด' }]); return; }
  const changes = diffBoards();
  if (!changes.length) { showModal('ไม่มีการเปลี่ยนแปลง', 'Draft เหมือน published version แล้ว', [{ label: 'ปิด' }]); return; }
  confirmAction('Publish changes?', `${changes.length} changes จะถูกเขียนขึ้นฐานข้อมูล`, async () => {
    if (TEST_MODE) {
      draft.boards.forEach(b => {
        if (b.deleted) {
          sessionStorage.removeItem('pointy_test_trip_' + b.originalId);
          return;
        }
        const data = materializeBoard(b);
        if (b.originalId !== b.urlId) sessionStorage.removeItem('pointy_test_trip_' + b.originalId);
        sessionStorage.setItem('pointy_test_trip_' + b.urlId, JSON.stringify(data));
      });
      const revs = JSON.parse(localStorage.getItem(LOCAL_REVISIONS_KEY) || '[]');
      revs.unshift(revisionDoc(changes));
      localStorage.setItem(LOCAL_REVISIONS_KEY, JSON.stringify(revs.slice(0, 20)));
    } else {
      const db = firebase.firestore();
      const operations = draft.boards.filter(b => !(b.created && b.deleted))
        .filter(b => b.created || b.deleted || b.urlId !== b.originalId || !b.baseDraftKey || b.baseDraftKey !== PointyLogic.tripContentKey(materializeBoard(b)))
        .map(b => ({ from: b.originalId, to: b.urlId, created: b.created, deleted: b.deleted, baseline: b.baseContentKey || PointyLogic.tripContentKey(b.data), data: materializeBoard(b) }));
      await window.CoinQuestAdminUtils.publishBoards({ db, operations, revisionId: uid(), revision: revisionDoc(changes) });
    }
    localStorage.removeItem(DRAFT_KEY);
    await loadPublished();
    render();
  });
}
function materializeBoard(b) {
  const data = clone(b.data || {});
  data.boardType = b.type || 'split';
  data.tripName = b.tripName;
  data.participants = b.participants.slice();
  data.characterIds = { ...b.characterIds };
  data.admin = { ...(data.admin || {}), adminId: b.adminId, adminName: b.adminName, ownerHash: b.adminOwnerHash, urlLocked: true };
  const adminCharacterName = b.participants.find(name => name === b.adminName);
  if (adminCharacterName) data.admin.characterId = b.characterIds[adminCharacterName] || '';
  if (b.newPassword) data.admin.passwordHash = adminHash(b.newPassword);
  data.updatedAt = Date.now();
  return data;
}
function revisionDoc(changes) {
  return { id: uid(), createdAt: Date.now(), author: TEST_MODE ? 'Test Admin' : adminUser?.email || SUPER_ADMIN_EMAIL, changes };
}

function filtered(list, keys) {
  const s = query.trim().toLowerCase();
  if (!s) return list;
  return list.filter(item => keys.some(key => String(item[key] || '').toLowerCase().includes(s)));
}
function pageHead(title, desc, actions = '') {
  return `<div class="page-head"><div><h1 class="page-title">${h(title)}</h1>${desc ? `<div class="page-desc">${desc}</div>` : ''}</div>${actions ? `<div class="page-head-actions">${actions}</div>` : ''}</div>`;
}
function card(title, body, actions = '', extra = '') {
  return `<section class="panel card ${extra}"><div class="card-head"><h3>${title}</h3>${actions ? `<div class="ch-act">${actions}</div>` : ''}</div><div class="card-pad">${body}</div></section>`;
}
function flatCard(body, extra = '') {
  return `<section class="card card-pad ${extra}">${body}</section>`;
}
function searchBox(placeholder) {
  return `<div class="search"><span class="s-ico">⌕</span><input id="admin-search" aria-label="${h(placeholder)}" placeholder="${h(placeholder)}" value="${h(query)}" oninput="filterAdmin(this)"></div>`;
}
function filterAdmin(input) {
  query = input.value;
  const page = document.querySelector('.admin-page');
  const toolbar = page?.querySelector(':scope > .toolbar');
  if (!toolbar) return;
  const next = document.createElement('div');
  next.innerHTML = renderPageBody();
  // Keep the live input mounted: replacing it interrupts typing and IME composition.
  for (const child of [...page.children]) if (child !== toolbar) child.remove();
  let afterToolbar = false;
  for (const child of [...next.children]) {
    if (child.classList.contains('toolbar')) { afterToolbar = true; continue; }
    if (afterToolbar) page.append(child); else page.insertBefore(child, toolbar);
  }
}
function seg(name, value, items) {
  return `<div class="seg">${items.map(([key, label]) => `<button type="button" class="${value === key ? 'on' : ''}" onclick="${name}='${key}';render()">${h(label)}</button>`).join('')}</div>`;
}
function formField(label, control, hint = '') {
  return `<div class="field"><label>${h(label)}</label>${control}${hint ? `<div class="hint">${h(hint)}</div>` : ''}</div>`;
}
function table(headers, rows, cls = '') {
  return `<div class="tbl-wrap"><table class="tbl ${cls}"><thead><tr>${headers.map(x => `<th>${h(x)}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}" class="muted">No records</td></tr>`}</tbody></table></div>`;
}
function modBadge(type) {
  const t = type || 'split';
  return `<span class="badge mod-${t}">${boardTypeIcon({ type:t })} ${boardTypeLabel({ type:t })}</span>`;
}
function statusBadge(label, cls = 'active') {
  return `<span class="badge st-${cls}">${h(label)}</span>`;
}
function statusForBoard(b) { return b.deleted ? 'deleted' : b.data?.archived ? 'archived' : b.data?.status || 'active'; }
function statusBadgeFor(value) {
  const key = String(value || 'active').toLowerCase();
  const cls = key === 'flagged' || key === 'deactivated' || key === 'delete_requested' || key === 'deleted'
    ? 'flagged'
    : key === 'archived'
    ? 'archived'
    : key === 'locked'
    ? 'locked'
    : 'active';
  return `<span class="badge st-${cls}">${h(userLifecycleLabel(value || 'active'))}</span>`;
}
function adminDateLabel(value) {
  if (!value) return '-';
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString();
  if (typeof value === 'number') return new Date(value).toLocaleString();
  return String(value);
}
function levelBadge(level) {
  return `<span class="lvl-badge">LV ${h(level || 1)}</span>`;
}
function boardVersions(b) {
  const revisionRows = (published.revisions || [])
    .map((rev, i) => ({ ...rev, versionLabel: `v${published.revisions.length - i}` }))
    .filter(rev => (rev.changes || []).some(c => String(c.detail || '').includes(b.originalId) || String(c.detail || '').includes(b.urlId)))
    .slice(0, 3)
    .map(rev => ({
      v: rev.versionLabel,
      at: rev.createdAt,
      by: rev.author || '',
      current: false,
      note: `${(rev.changes || []).length} changes`
    }));
  return [
    { v: 'current', at: b.data?.updatedAt, by: '', current: true, note: 'Current state' },
    ...revisionRows
  ];
}
function auditEntries() {
  const drafts = diffBoards().map((c, i) => ({
    id: `draft-${i}`,
    ts: Date.now(),
    actor: 'Local Draft',
    scope: String(c.area || '').toLowerCase().startsWith('admin') ? 'admin' : String(c.area || '').toLowerCase().startsWith('user') ? 'user' : 'board',
    action: c.detail,
    target: c.detail.match(/\b\d{4}\b/)?.[0] || 'draft'
  }));
  const publishedRows = (published.revisions || []).flatMap(rev => (rev.changes || []).map((c, i) => ({
    id: `${rev.id || rev.createdAt}-${i}`,
    ts: rev.createdAt || Date.now(),
    actor: rev.author || 'Super Admin',
    scope: String(c.area || '').toLowerCase().startsWith('admin') ? 'admin' : String(c.area || '').toLowerCase().startsWith('user') ? 'user' : 'board',
    action: c.detail,
    target: c.detail.match(/\b\d{4}\b/)?.[0] || 'revision'
  })));
  return [...drafts, ...publishedRows].sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0));
}
function renderDashboard() {
  const boards = activeBoards();
  const split = boards.filter(b => (b.type || 'split') === 'split').length;
  const debt = boards.filter(b => (b.type || 'split') === 'debt').length;
  const treasury = boards.filter(b => (b.type || 'split') === 'treasury').length;
  const records = visibleUserRecords();
  const totals = boards.reduce((acc, b) => {
    const st = boardStats(b);
    acc.spend += st.spend;
    acc.balance += st.balance;
    acc.overdue += st.overdue;
    return acc;
  }, { spend: 0, balance: 0, overdue: 0 });
  const attention = boards.filter(b => !b.adminId || !b.adminName || !b.urlId).slice(0, 5);
  const recent = diffBoards().slice(0, 6);
  const icon = window.CoinQuestIcons;
  const metric = (label, value, caption, art, action) => `<button class="dashboard-stat" onclick="${action}"><span class="admin-medallion medallion-${art}" aria-hidden="true"></span><span class="s-label">${h(label)}</span><strong class="s-val">${value}</strong><span class="s-delta">${h(caption)}</span><span class="stat-arrow" aria-hidden="true">›</span></button>`;
  const kpis = `<div class="dashboard-kpis">
    ${metric('Boards', boards.length, `${split} Split · ${debt} Debt · ${treasury} Treasury`, 'boards', "boardFilter='all';selectTab('boards')")}
    ${metric('Users / Characters', records.length, `${users().length} board links`, 'users', "selectTab('users')")}
    ${metric('Debt Watch', totals.overdue, `${fmtMoney(totals.balance)} balance tracked`, 'debt', "boardFilter='debt';selectTab('boards')")}
    ${metric('Unpublished Changes', diffBoards().length, dirty ? 'Unpublished board changes' : 'All changes published', 'drafts', "selectTab('revisions')")}
  </div>`;
  const quick = `<div class="dashboard-quick">
    <button onclick="addBoard()">${icon('category')}<span>New board</span><small>Create a board draft</small></button>
    <button onclick="selectTab('users')">${icon('profile')}<span>View users</span><small>Accounts & characters</small></button>
    <button onclick="selectTab('revisions')">${icon('backup')}<span>Version control</span><small>${diffBoards().length} local changes</small></button>
    <button onclick="showResetPwModal()">${icon('lock')}<span>Reset password</span><small>Account support</small></button>
  </div>`;
  const feed = recent.length ? `<div class="log-list">${recent.map(c => {
    const boardId = c.detail.match(/\b\d{4}\b/)?.[0];
    return `<div class="log-item"><span class="admin-medallion medallion-boards" aria-hidden="true"></span><div class="log-body"><div class="log-text">${boardId ? `Board ${h(boardId)}` : h(c.area)}</div><div class="log-meta" title="${h(c.detail)}">${h(c.detail)}</div></div><button class="btn btn-ghost tiny" onclick="selectTab('revisions')">Draft <span aria-hidden="true">›</span></button></div>`;
  }).join('')}</div>` : `<div class="empty">${icon('scroll')}<div class="e-t">No unpublished changes</div><div class="e-d">Edits appear here before publishing.</div></div>`;
  const needs = attention.length ? `<div class="log-list">${attention.map(b => `<div class="log-item"><div class="log-ico fire">${icon('warning')}</div><div class="log-body"><div class="log-text">Board ${h(b.urlId || b.originalId)}</div><div class="log-meta">${!b.adminId ? 'Missing admin ID' : !b.adminName ? 'Missing admin display name' : 'Missing board ID'}</div></div><button class="btn btn-ghost tiny" onclick="openDetail('board',${q(b.originalId)})">Open</button></div>`).join('')}</div>` : `<div class="empty">${icon('check-circle')}<div class="e-t">No boards need attention</div><div class="e-d">All boards have the required administrator details.</div></div>`;
  const viewAll = action => `<button class="dashboard-view-all" onclick="${action}">View all <span aria-hidden="true">→</span></button>`;
  const panels = `<div class="dashboard-panels">
    ${card(`${icon('scroll')}Recent Activity <span class="heading-note">(Draft Changes)</span>`, feed, viewAll("selectTab('revisions')"), 'dashboard-recent')}
    ${card(`${icon('bell')}Needs Attention`, needs, viewAll("boardFilter='all';selectTab('boards')"), 'dashboard-attention')}
    ${card(`${icon('swords')}Quick Actions`, quick, '', 'dashboard-actions')}
  </div>`;
  return `${pageHead('Dashboard', 'System overview & quick actions', seg('dashMode', dashMode, [['a','Overview'], ['b','Activity']]))}<div class="dashboard-content ${dashMode === 'b' ? 'command-mode' : ''}">${dashMode === 'b' ? panels + kpis : kpis + panels}</div>`;
}
function renderRelationshipMap() {
  const u = visibleUserRecords().find(x => x.adminGroups.length) || visibleUserRecords()[0];
  const icon = window.CoinQuestIcons;
  const types = [
    ['user', 'Global User ID', 'profile', 'ผู้ใช้หลักของระบบ'],
    ['char', 'Character', 'swords', 'ตัวละครที่เล่นอยู่'],
    ['admin', 'Admin IDs', 'shield', 'สิทธิ์ผู้ดูแล'],
    ['board', 'Boards', 'scroll', 'บอร์ดที่เกี่ยวข้อง']
  ];
  const node = (kind, body, glyphOverride) => {
    const [, label, glyph] = types.find(type => type[0] === kind);
    return `<article class="rel-node ${kind}"><h4 class="rel-node-label">${label}</h4><span class="rel-node-icon" aria-hidden="true">${icon(glyphOverride || glyph)}</span><div class="rel-node-body">${body}</div></article>`;
  };
  let map = `<div class="empty">${icon('profile')}<div class="e-t">ยังไม่มีผู้ใช้งาน</div><div class="e-d">ความสัมพันธ์จะแสดงเมื่อมีข้อมูลผู้ใช้ในระบบ</div></div>`;
  if (u) {
    const user = node('user', `<h5 class="rn-name">${h(u.name)}</h5>${idChip('user', u.userId, u.userId)}<p class="rn-sub rn-counts"><span>${u.chars.length} active character${u.chars.length === 1 ? '' : 's'}</span><span>${u.adminGroups.length} admin role${u.adminGroups.length === 1 ? '' : 's'}</span></p>`);
    const chars = u.chars.map(c => node('char', `<h5 class="rn-name">${h(c.name)}</h5>${staticIdChip('char', c.id || '—')}
      <p class="rn-sub">${h(c.className)} · ${levelBadge(characterLevelFromXp(c.xp).lvl)} · ${Number(c.xp || 0).toLocaleString()} XP</p>
      <div class="rn-links"><span>plays in:</span> ${c.boards.map(bid => {
        const b = boardById(bid);
        return b ? idChip('board', b.urlId, b.originalId) : '';
      }).join(' ') || '<span>—</span>'}</div>`)).join('') || node('char', '<p class="rn-sub">No character yet</p>');
    const admins = u.adminGroups.map(g => node('admin', `${idChip('admin', g.adminId || '—', g.key)}<p class="rn-sub">${h(g.adminName || 'No admin display name')}</p>`)).join('') || node('admin', '<p class="rn-sub">Not an admin</p>');
    const linkedBoards = [...new Map([...u.boards, ...u.adminGroups.flatMap(g => g.boards)].map(b => [b.originalId, b])).values()];
    const boards = linkedBoards.map(b => node('board', `<h5 class="rn-name">${h(b.tripName)}</h5>${idChip('board', b.urlId, b.originalId)}<div class="rn-links"><span>managed by:</span> ${b.adminId || b.adminOwnerHash ? idChip('admin', b.adminId || '—', b.adminOwnerHash || b.adminId) : '<span>No admin assigned</span>'}</div>`, b.type === 'debt' ? 'debt' : b.type === 'treasury' ? 'treasury' : 'scroll')).join('') || node('board', '<p class="rn-sub">No boards yet</p>');
    map = `<ol class="relmap" aria-label="Account relationships">${[user, chars, admins, boards].map((nodes, i) => `<li class="rel-col" data-entity="${types[i][0]}">${nodes}</li>`).join('')}</ol>`;
  }
  const legend = `<div class="rel-legend" aria-label="Entity types">${types.map(([kind, label, , description]) => `<div class="rel-legend-item ${kind}"><span class="rel-dot" aria-hidden="true"></span><span><strong>${label}</strong> <span>(${description})</span></span></div>`).join('')}</div>`;
  const rules = `<ul class="model-rules">
    <li>One User ID works across Split Expenses, Debt Dragon, Treasury, and Character Profile.</li>
    <li>Each user account has one active character. Character details are managed in the account profile and shared across boards.</li>
    <li>Character level is based on Character XP. Profile level is based on Reputation; these progress separately.</li>
    <li>A user can be a board admin through one or more Admin IDs, and one Admin ID can own multiple boards.</li>
    <li>Compare Prices is a tool, not a Board.</li>
  </ul>`;
  const help = `<section class="relationship-help">
    <button class="relationship-help-toggle" type="button" aria-expanded="false" aria-controls="relationship-help-content" onclick="const open=this.getAttribute('aria-expanded')!=='true';this.setAttribute('aria-expanded',String(open));this.parentElement.classList.toggle('is-open',open)">${icon('scroll')}<span>คำอธิบายและกฎการทำงาน</span><span class="rel-help-chevron" aria-hidden="true">⌄</span></button>
    <div id="relationship-help-content" class="relationship-help-content">${legend}${card(`${icon('scroll')}กฎการเชื่อมโยงบัญชี (Account Rules)`, rules, '', 'relationship-rules')}</div>
  </section>`;
  return `${pageHead('Relationship Map', 'User → Character / Admin ID → Board links')}<div class="relationship-content">${card(`${icon('split')}ความสัมพันธ์ของข้อมูลในระบบ`, map, '', 'relationship-overview')}${help}</div>`;
}
function updateBoardListField(id, key, input) {
  const value = key === 'urlId' ? input.value.trim() : input.value;
  updateBoard(id, { [key]: value });
  // Keep the mobile reading view current when an operator resizes after editing.
  const mirror = input.closest('td')?.querySelector('[data-board-value]');
  if (mirror) mirror.textContent = value || '—';
  if (key === 'urlId') {
    input.closest('tr')?.querySelector('.btn-danger')?.setAttribute('aria-label', `ลบ Board ${value}`);
    document.querySelectorAll('.boards-shortcuts [data-board-id]').forEach(button => {
      if (button.dataset.boardId === id) button.querySelector('span').textContent = value;
    });
  }
}
function openBoardSection(id, section = 'overview') {
  openDetail('board', id);
  const target = section !== 'overview' && document.getElementById(`board-${section}`);
  if (target) {
    boardSectionStates.set(JSON.stringify([id, section]), true);
    syncBoardSections();
    target.scrollIntoView({ block: 'start' });
    const focusTarget = window.innerWidth < 1200 ? target.querySelector('.board-section-toggle') : target.querySelector('.board-section-heading');
    if (window.innerWidth >= 1200) focusTarget?.setAttribute('tabindex', '-1');
    focusTarget?.focus({ preventScroll: true });
    return;
  }
  const heading = document.querySelector('.page-title');
  heading?.setAttribute('tabindex', '-1');
  heading?.focus();
}
function setBoardFilter(value) {
  boardFilter = value;
  render();
  document.querySelector(`.boards-filter [data-filter="${value}"]`)?.focus({ preventScroll: true });
}
function clearBoardFilters() {
  boardFilter = 'all';
  query = '';
  render();
  document.querySelector('#admin-search')?.focus();
}
function boardRows(boards) {
  const field = (b, key, label, password = false) => `<div class="field inline-field"><input class="edit-control" aria-label="${label}" type="${password ? 'password' : 'text'}" value="${h(b[key] || '')}" ${password ? 'placeholder="ตั้งรหัสใหม่" autocomplete="new-password"' : ''} oninput="updateBoardListField(${q(b.originalId)},'${key}',this)"></div>`;
  return boards.map(b => {
    const st = boardStats(b), type = b.type || 'split';
    const badge = `<span class="badge mod-${h(type)}">${window.CoinQuestIcons(type === 'debt' ? 'debt' : type === 'treasury' ? 'treasury' : 'scroll')} ${h(boardTypeLabel({ type }))}</span>`;
    return `<tr class="board-row" data-board-id="${h(b.originalId)}" role="row">
      <td class="board-url" role="cell">${field(b, 'urlId', 'Board URL')}<strong class="board-mobile-value" data-board-value>${h(b.urlId)}</strong></td>
      <td class="board-type" role="cell">${badge}</td>
      <td class="board-name" role="cell">${field(b, 'tripName', 'Board name')}<strong class="board-mobile-value" data-board-value>${h(b.tripName)}</strong></td>
      <td class="board-admin-id" role="cell">${field(b, 'adminId', 'Admin ID')}<span class="board-mobile-value">Admin: <span data-board-value>${h(b.adminId || '—')}</span></span></td>
      <td class="board-admin-name" role="cell">${field(b, 'adminName', 'Admin nickname')}</td>
      <td class="board-password" role="cell">${field(b, 'newPassword', 'Reset password', true)}</td>
      <td class="board-members" role="cell"><span class="board-member-count" aria-label="${b.participants.length} members">${window.CoinQuestIcons('split')}<span>${b.participants.length}</span></span><span class="board-entry-count">${b.type === 'debt' ? `${st.dragons} dragons` : `${st.expenses} quests`}</span></td>
      <td class="board-actions" role="cell"><div><button class="btn btn-ghost sm" onclick="openBoardSection(${q(b.originalId)})">Details</button><button class="btn btn-ghost sm" onclick="openBoardSection(${q(b.originalId)},'members')">Members</button><button class="btn btn-danger sm" aria-label="ลบ Board ${h(b.urlId)}" onclick="deleteBoard(${q(b.originalId)})">ลบ</button></div></td>
    </tr>`;
  }).join('');
}
function renderBoards() {
  if (detail?.kind === 'board') return renderBoardDetail(detail.id);
  const filters = `<div class="seg boards-filter" role="group" aria-label="Board type">${['all', 'split', 'debt', 'treasury'].map(type => `<button type="button" data-filter="${type}" class="${boardFilter === type ? 'on' : ''}" aria-pressed="${boardFilter === type}" onclick="setBoardFilter('${type}')">${type === 'all' ? 'All Boards' : boardTypeLabel({ type })}</button>`).join('')}</div>`;
  const toolbar = `<div class="toolbar boards-toolbar">${searchBox('Search boards or administrators')}${filters}<button class="btn btn-primary boards-add" onclick="addBoard()">+ Add Board</button></div>`;
  const visibleBoards = filtered(activeBoards().filter(b => boardFilter === 'all' || (b.type || 'split') === boardFilter), ['urlId', 'tripName', 'adminId', 'adminName']);
  const shortcuts = visibleBoards.length ? `<div class="quick-open wrap-chips boards-shortcuts" aria-label="Board shortcuts">${visibleBoards.slice(0, 4).map(b => `<button class="btn btn-ghost sm" data-board-id="${h(b.originalId)}" onclick="openBoardSection(${q(b.originalId)})">Details <span>${h(b.urlId)}</span></button>`).join('')}</div>` : '';
  const columns = [['url','Board ID'],['type','Type'],['name','Board name'],['admin-id','Admin ID'],['admin-name','Admin display name'],['password','Reset Password'],['members','Members'],['actions','Actions']];
  const content = visibleBoards.length ? `<div class="tbl-wrap"><table class="tbl boards-table" role="table" aria-label="Boards"><thead role="rowgroup"><tr role="row">${columns.map(([key, label]) => `<th class="board-${key}" scope="col" role="columnheader">${label}</th>`).join('')}</tr></thead><tbody role="rowgroup">${boardRows(visibleBoards)}</tbody></table></div>` : `<div class="empty boards-empty">${window.CoinQuestIcons('scroll')}<div class="e-t">${activeBoards().length ? 'ไม่พบบอร์ดที่ตรงกัน' : 'ยังไม่มีบอร์ด'}</div><p class="e-d">${activeBoards().length ? 'ลองค้นหาด้วยชื่อบอร์ด รหัสบอร์ด หรือผู้ดูแล' : 'สร้างบอร์ดแรกเพื่อเริ่มจัดการปาร์ตี้ของคุณ'}</p>${activeBoards().length ? '<button class="btn btn-ghost" onclick="clearBoardFilters()">ล้างการค้นหาและตัวกรอง</button>' : ''}</div>`;
  return `${pageHead('Boards', 'Manage Split Expenses, Debt Dragon and Treasury boards')}${toolbar}${shortcuts}${card('Boards', content, `<span class="count-note" role="status">${visibleBoards.length} boards</span>`, 'boards-list')}`;
}
function boardDateLabel(value) {
  if (value == null || value === '') return '—';
  try {
    const seconds = value?.seconds ?? value?._seconds;
    const date = typeof value?.toDate === 'function' ? value.toDate()
      : new Date(typeof seconds === 'number' ? seconds * 1000 : value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString() : '—';
  } catch (_) { return '—'; }
}
function boardSectionOpen(boardId, section) {
  if (window.innerWidth >= 1200) return true;
  const saved = boardSectionStates.get(JSON.stringify([boardId, section]));
  return saved ?? (section === 'info' || (section === 'members' && window.innerWidth >= 768));
}
function syncBoardSections() {
  const root = document.querySelector('.board-info-page');
  if (!root) return;
  root.querySelectorAll('[data-board-section]').forEach(section => {
    const open = boardSectionOpen(root.dataset.boardId, section.dataset.boardSection);
    section.querySelector('.board-section-toggle').setAttribute('aria-expanded', String(open));
    section.querySelector('.board-section-body').hidden = !open;
  });
}
function toggleBoardSection(section) {
  const root = document.querySelector('.board-info-page');
  if (!root) return;
  const id = root.dataset.boardId;
  boardSectionStates.set(JSON.stringify([id, section]), !boardSectionOpen(id, section));
  syncBoardSections();
}
for (const breakpoint of [768, 1200]) window.matchMedia(`(min-width: ${breakpoint}px)`).addEventListener('change', syncBoardSections);
function adminTavernIcon(name) {
  const asset = name === 'lock' ? 'key' : name;
  return ['shield','swords','scroll','coins','split','key','star','box'].includes(asset)
    ? `<img class="board-tavern-icon" src="/assets/admin-board-info/${asset}.webp" alt="" aria-hidden="true" width="32" height="32">`
    : window.CoinQuestIcons(name);
}
function boardInfoSection(b, key, title, icon, body) {
  const open = boardSectionOpen(b.originalId, key);
  const label = `${adminTavernIcon(icon)}<span>${h(title)}</span>`;
  return `<section class="card board-info-section" id="board-${key}" data-board-section="${key}"><h2 class="board-section-heading"><span class="board-section-label">${label}</span><button class="board-section-toggle" aria-expanded="${open}" aria-controls="board-${key}-body" onclick="toggleBoardSection(${q(key)})">${label}${window.CoinQuestIcons('chevron','section-chevron')}</button></h2><div class="card-pad board-section-body" id="board-${key}-body" ${open ? '' : 'hidden'}>${body}</div></section>`;
}
function boardStatCard(label, value, caption, icon) {
  return `<div class="board-stat">${adminTavernIcon(icon)}<span>${h(label)}</span><strong>${h(value)}</strong><small>${h(caption)}</small></div>`;
}
function boardChangeLog(b) {
  const changes = diffBoards(b.originalId);
  if (!changes.length) return '<div class="empty"><div class="e-t">No draft changes for this board</div><p class="e-d">All changes will appear here after you make edits.</p></div>';
  return `<div class="log-list">${changes.map(c=>`<div class="log-item">${window.CoinQuestIcons('document')}<div class="log-body"><div class="log-text"><b>${h(c.area)}</b> ${statusBadge(c.action,'active')}</div><div class="log-meta">${h(c.detail)}</div></div></div>`).join('')}</div><button class="btn btn-ghost sm" onclick="restoreBoard(${q(b.originalId)})">Revert board changes</button>`;
}
function updateBoardInfoField(id, key, input) {
  const value = key === 'urlId' ? input.trim() : input;
  updateBoard(id, { [key]: value });
  const b = boardById(id);
  document.querySelectorAll('[data-board-info-value]').forEach(el => {
    if (el.dataset.boardInfoValue === key) el.textContent = value || '—';
  });
  const link = document.querySelector('[data-board-ledger]');
  if (link) link.href = `/trip/?id=${encodeURIComponent(b.urlId)}${TEST_MODE ? '&test=1' : ''}`;
  const owner = document.querySelector('.board-owner-account');
  const ownerId = adminOwnerUserId(b);
  if (owner) owner.innerHTML = ownerId ? idChip('user',ownerId,ownerId) : '<span class="badge st-archived">No linked user account</span>';
  const log = document.getElementById('board-log-body');
  if (log) log.innerHTML = boardChangeLog(b);
}
function renderBoardDetail(id) {
  const b = boardById(id);
  if (!b) return card('Board not found', '<button class="btn btn-ghost" onclick="closeDetail()">Back</button>');
  const st = boardStats(b);
  const ownerUser = adminOwnerUserId(b);
  const versions = boardVersions(b);
  const icon = adminTavernIcon;
  const crumbs = `<div class="crumbs"><button onclick="closeDetail('boards')">Boards</button><span class="sep">/</span><span class="cur" data-board-info-value="urlId">${h(b.urlId)}</span></div>`;
  if (b.deleted && b.created) return `${crumbs}${pageHead(b.tripName, 'New board discarded')}${card('Draft board discarded', '<p>This board was never published. No server data was deleted.</p><button class="btn btn-ghost" onclick="closeDetail(\'boards\')">Back to Boards</button>')}`;
  if (b.deleted) return `${crumbs}${pageHead(b.tripName, 'Marked for deletion · pending Publish')}${card('Board deletion pending', `<p>บอร์ดนี้จะถูกลบเมื่อ Publish ข้อมูลบนเซิร์ฟเวอร์ยังไม่ถูกลบ</p><button class="btn btn-ghost" onclick="restoreBoard(${q(b.originalId)})">Restore board</button>`)}`;
  const field = (label, key, options = '') => formField(label, `<input aria-label="${label}" value="${h(b[key] || '')}" ${options} oninput="updateBoardInfoField(${q(b.originalId)},${q(key)},this.value)">`);
  const adminForm = `<div class="board-owner-form">${field('URL','urlId')}${field('Name','tripName')}${field('Admin ID','adminId')}${field('Nickname','adminName')}${field('Password reset','newPassword','type="password" autocomplete="new-password" placeholder="ตั้งรหัสใหม่"')}</div>`;
  const overview = `<div class="board-overview">
    ${boardInfoSection(b, 'info', 'Board Info', 'shield', `<div class="kv">
      <div class="kv-row"><span class="k">Board ID</span><span class="v mono" data-board-info-value="urlId">${h(b.urlId)}</span></div>
      <div class="kv-row"><span class="k">Type</span><span class="v">${modBadge(b.type)}</span></div>
      <div class="kv-row"><span class="k">Status</span><span class="v">${statusBadgeFor(statusForBoard(b))}</span></div>
      <div class="kv-row"><span class="k">Owner admin</span><span class="v"><button class="idchip k-admin" onclick="openAdminGroup(${q(b.originalId)})"><span class="ic-ico">Admin</span><span data-board-info-value="adminId">${h(b.adminId || '—')}</span></button></span></div>
      <div class="kv-row"><span class="k">Owner account</span><span class="v board-owner-account">${ownerUser ? idChip('user', ownerUser, ownerUser) : '<span class="badge st-archived">No linked user account</span>'}</span></div>
      <div class="kv-row"><span class="k">Last active</span><span class="v">${h(boardDateLabel(b.data?.updatedAt))}</span></div>
    </div>`)}
    ${card(`${icon('swords')}Stats`, `<div class="board-stats-grid">
      ${b.type === 'debt'
        ? `${boardStatCard('Dragons', st.dragons, 'tracked debts', 'debt')}${boardStatCard('Balance', fmtMoney(st.balance), 'outstanding', 'coins')}${boardStatCard('Overdue', st.overdue, 'needs attention', 'flame')}${boardStatCard('Party size', b.participants.length, 'slayers', 'split')}`
        : b.type === 'treasury'
        ? `${boardStatCard('Monthly income', fmtMoney(b.data?.treasury?.income || 0), 'treasury', 'coins')}${boardStatCard('Spent', fmtMoney(st.spend), 'logged', 'swords')}${boardStatCard('Party size', b.participants.length, 'owner party', 'split')}${boardStatCard('Quests', st.expenses, 'entries', 'scroll')}`
        : `${boardStatCard('Quests', st.expenses, 'ledger rows', 'scroll')}${boardStatCard('Total spend', fmtMoney(st.spend), 'party spend', 'coins')}${boardStatCard('Party size', b.participants.length, 'heroes', 'split')}`}
    </div>`, '', 'board-stats')}
  </div>`;
  const members = b.participants.map(name => {
    const charId = b.characterIds[name] || '';
    const c = charById(charId) || { className: b.data?.heroClasses?.[name] || 'hero', xp: 0 };
    const uId = userKey(name, charId);
    const role = name === b.adminName || charId === b.data?.admin?.characterId ? 'Owner' : b.type === 'debt' ? 'Slayer' : 'Hero';
    return `<tr role="row"><td class="member-character" role="cell"><div>${icon('swords')}<span class="cell-strong">${h(name)}</span>${idChip('char', charId || '—', charId)}</div></td><td class="member-user" role="cell">${idChip('user', uId, uId)}</td><td class="member-class" role="cell"><span class="member-mobile-label">Class</span>${h(c.className)}</td><td class="member-level" role="cell">${levelBadge(characterLevelFromXp(c.xp).lvl)}</td><td class="member-role" role="cell"><span class="badge ${role === 'Owner' ? 'role' : 'outline'}">${role === 'Owner' ? '👑 ' : ''}${role}</span></td></tr>`;
  }).join('');
  const membersTable = members ? `<div class="tbl-wrap"><table class="tbl board-members-table" role="table" aria-label="Board members"><thead><tr>${['Character','User ID','Class','Level','Role'].map(label=>`<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${members}</tbody></table></div>` : '<div class="empty"><div class="e-t">No members yet</div></div>';
  const membersPanel = boardInfoSection(b, 'members', 'Members', 'split', `${membersTable}<div class="board-members-footer"><p class="hint">สมาชิกจริงเข้าร่วมผ่านคำเชิญ Character ID; จัดการสมาชิกและ Guest ภายใน Party Ledger</p><a class="btn btn-ghost" data-board-ledger href="/trip/?id=${encodeURIComponent(b.urlId)}${TEST_MODE ? '&test=1' : ''}">Open Party Ledger</a></div>`);
  const versionRows = versions.map(v => `<div class="log-item">${icon(v.current ? 'star' : 'scroll')}<div class="log-body"><div class="log-text"><b>${h(v.v)}</b>${v.current ? ' <span class="badge st-active">Current</span>' : ''} · ${h(v.note)}</div><div class="log-meta"><span>${h(boardDateLabel(v.at))}</span>${v.by ? `<span>by ${h(v.by)}</span>` : ''}</div></div></div>`).join('');
  const dangerPanel = `<section class="board-danger" aria-label="Board management"><div class="board-lifecycle-action"><span class="board-action-icon">${icon('box')}</span><div><h2>${b.data.archived ? 'Reopen board' : 'Archive board'}</h2><p>${b.data.archived ? 'Return this board to active use with its existing data.' : 'Hide from use while keeping data recoverable.'}</p></div><button class="btn btn-gold" onclick="setBoardArchived(${q(b.originalId)},${!b.data.archived})">${b.data.archived ? 'Reopen board' : 'Archive board'}</button></div><div class="board-lifecycle-action is-danger"><span class="board-action-icon">${icon('trash')}</span><div><h2>Delete board</h2><p>Delete the board and all data after Publish.</p></div><button class="btn btn-danger" onclick="deleteBoard(${q(b.originalId)})">Delete board</button></div><p class="board-danger-note">${icon('lock')}Super Admin only · Changes take effect after Publish</p></section>`;
  return `${crumbs}<div class="board-info-page" data-board-id="${h(b.originalId)}">${adminDetailHeading(b.tripName, `<span class="idchip k-board"><span class="ic-ico">Board</span><span data-board-info-value="urlId">${h(b.urlId)}</span></span>${modBadge(b.type)}${statusBadgeFor(statusForBoard(b))}`, `<button class="btn btn-gold" onclick="showExportModal(${q(b.originalId)})">${icon('download')}Export data</button>`, 'data-board-info-value="tripName"')}${adminTavernBanner()}<div class="board-info-flow">${overview}${boardInfoSection(b,'owner','Owner / Admin','lock',adminForm)}${membersPanel}${boardInfoSection(b,'log','Change Log','scroll',boardChangeLog(b))}${boardInfoSection(b,'versions','Versions','star',`<div class="log-list">${versionRows}</div>`)}${dangerPanel}</div></div>`;
}
function openAdminGroup(boardId) {
  const g = adminGroups().find(group => group.boards.some(b => b.originalId === boardId));
  if (g) openDetail('admin', g.key);
}
function toggleAdminShortcuts(button) {
  const expanded = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(expanded));
  button.setAttribute('aria-label', expanded ? 'Show fewer admin shortcuts' : 'Show all admin shortcuts');
  button.closest('.board-admin-shortcuts').classList.toggle('is-expanded', expanded);
}
function toggleAdminBoards(button) {
  const expanded = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(expanded));
  button.textContent = expanded ? 'Less' : `+${button.dataset.count}`;
  button.closest('.board-admin-board-links').classList.toggle('is-expanded', expanded);
}
function renderAdmins() {
  if (detail?.kind === 'admin') return renderAdminDetail(detail.id);
  const all = adminGroups();
  const needle = query.trim().toLowerCase();
  const groups = all.filter(g => {
    const owner = g.ownerUserId ? userById(g.ownerUserId) : null;
    return !needle || [g.adminId, g.adminName, g.key, g.ownerUserId, owner?.name, owner?.username].join(' ').toLowerCase().includes(needle);
  });
  const icon = window.CoinQuestIcons;
  const shortcuts = groups.slice(0, 4).map((g, i) => `<button class="btn btn-ghost sm ${i > 1 ? 'admin-extra-shortcut' : ''}" data-admin-anchor="${h(g.boards[0].originalId)}" onclick="openAdminGroup(${q(g.boards[0].originalId)})">Details <span data-admin-value="adminId">${h(g.adminId || '—')}</span></button>`).join('');
  const rows = groups.map((g, index) => {
    const anchor = g.boards[0].originalId;
    const targets = h(JSON.stringify(g.boards.map(b => b.originalId)));
    const boardLinks = g.boards.map((b, i) => `<span class="${i ? 'admin-extra-board' : ''}">${idChip('board', b.urlId, b.originalId)}</span>`).join('');
    return `<tr class="board-admin-row" data-admin-anchor="${h(anchor)}" role="row">
      <td class="board-admin-id" role="cell"><span class="admin-compact-value"><span class="admin-mobile-label">ID </span><span data-admin-value="adminId">${h(g.adminId || '—')}</span></span><input class="inline-field" aria-label="Admin ID for ${h(g.adminId || 'unnamed admin')}" value="${h(g.adminId)}" oninput="updateAdminGroup(${targets},{adminId:this.value})"></td>
      <td class="board-admin-name" role="cell"><span class="admin-compact-value" data-admin-value="adminName">${h(g.adminName || '—')}</span><input class="inline-field" aria-label="Nickname for ${h(g.adminId || 'unnamed admin')}" value="${h(g.adminName)}" placeholder="—" oninput="updateAdminGroup(${targets},{adminName:this.value})"></td>
      <td class="board-admin-user" role="cell"><span class="admin-mobile-label" aria-hidden="true">${icon('profile')}</span>${g.ownerUserId ? idChip('user', g.ownerUserId, g.ownerUserId) : '<span class="badge st-archived">No linked user</span>'}</td>
      <td class="board-admin-hash" role="cell"><span class="admin-mobile-label">${icon('shield')}Owner Hash:</span><span class="mono">${h(g.boards[0].adminOwnerHash || '—')}</span></td>
      <td class="board-admin-boards" role="cell"><span class="admin-mobile-label">${icon('scroll')}Boards:</span><div class="board-admin-board-links"><div class="admin-board-items" id="admin-board-links-${index}">${boardLinks}</div>${g.boards.length > 1 ? `<button class="btn btn-ghost tiny admin-board-toggle" aria-label="More boards for ${h(g.adminId || 'unnamed admin')}" aria-expanded="false" aria-controls="admin-board-links-${index}" data-count="${g.boards.length - 1}" onclick="toggleAdminBoards(this)">+${g.boards.length - 1}</button>` : ''}</div></td>
      <td class="board-admin-actions" role="cell"><button class="btn btn-ghost sm" onclick="openAdminGroup(${q(anchor)})">Details</button></td>
    </tr>`;
  }).join('');
  const columns = [['id','ID','ID / ชื่อเล่น'],['name','ชื่อเล่น / ชื่อที่แสดง',''],['user','User','User / Owner Hash'],['hash','Owner Hash',''],['boards','Boards','Boards'],['actions','จัดการ','จัดการ']];
  const listing = rows ? `<div class="tbl-wrap"><table class="tbl board-admin-table" role="table" aria-label="Board Admins"><thead><tr role="row">${columns.map(([key, label, compact]) => `<th class="board-admin-col-${key}" scope="col" role="columnheader"><span class="admin-wide-heading">${label}</span><span class="admin-compact-heading">${compact}</span></th>`).join('')}</tr></thead><tbody role="rowgroup">${rows}</tbody></table></div>` : `<div class="empty">${icon('shield')}<div class="e-t">${needle ? 'ไม่พบผู้ดูแลที่ตรงกัน' : 'ยังไม่มีผู้ดูแลบอร์ด'}</div><p>${needle ? 'ลองค้นหาด้วยรหัส ชื่อที่แสดง หรือชื่อผู้ใช้อื่น' : 'ผู้ดูแลจะแสดงที่นี่เมื่อมีบอร์ดในระบบ'}</p>${needle ? '<button class="btn btn-ghost" onclick="clearAdminSearch()">ล้างการค้นหา</button>' : ''}</div>`;
  return `${pageHead('Board Admins', 'Board Admin IDs may own multiple boards')}<div class="toolbar board-admin-toolbar">${searchBox('Search by admin ID, display name or username')}</div><div class="board-admin-shortcuts" aria-label="Admin detail shortcuts">${shortcuts}${groups.length > 2 ? `<button class="btn btn-ghost sm admin-shortcut-toggle" aria-label="Show all admin shortcuts" aria-expanded="false" onclick="toggleAdminShortcuts(this)">${icon('more')}</button>` : ''}</div><section class="card board-admin-list"><div class="card-head"><h3>Board Admins</h3></div><div class="card-pad">${listing}<div class="board-admin-footer"><span role="status">${needle ? `${groups.length} of ${all.length}` : groups.length} board administrators</span><span>Board Admin IDs may own multiple boards</span></div></div></section>`;
}
function renderAdminDetail(key) {
  const g = adminGroupByKey(key);
  if (!g) return card('Admin not found', '<button class="btn btn-ghost" onclick="closeDetail()">Back</button>');
  const userId = g.ownerUserId || '';
  const targets = h(JSON.stringify(g.boards.map(b => b.originalId)));
  const ownerChip = userId ? idChip('user', userId, userId) : '<span class="badge st-archived">No linked user account</span>';
  const identity = `${flatCard(`<div class="profile-card" data-admin-anchor="${h(g.boards[0].originalId)}"><div class="profile-ava">🛡️</div><div class="profile-name" data-admin-value="adminName">${h(g.adminName || '—')}</div><div class="profile-id"><span class="idchip k-admin"><span class="ic-ico">Admin</span><span data-admin-value="adminId">${h(g.adminId || '—')}</span></span></div><div class="mt12">${ownerChip}</div></div>`)}
    ${card('Identity', `${formField('Admin ID', `<input aria-label="Admin ID" value="${h(g.adminId)}" oninput="updateAdminGroup(${targets},{adminId:this.value})">`)}${formField('Nickname', `<input aria-label="Nickname" value="${h(g.adminName)}" oninput="updateAdminGroup(${targets},{adminName:this.value})">`)}<div class="kv"><div class="kv-row"><span class="k">Owner hash</span><span class="v mono">${h(g.boards[0].adminOwnerHash || '—')}</span></div></div>`)}`;
  const owned = g.boards.map(b => `<tr><td>${idChip('board', b.urlId, b.originalId)}</td><td class="cell-strong">${h(b.tripName)}</td><td>${modBadge(b.type)}</td><td class="td-actions"><button class="btn btn-ghost sm" onclick="openDetail('board',${q(b.originalId)})">Open</button></td></tr>`).join('');
  return `<div class="crumbs"><button onclick="closeDetail('admins')">Board Admins</button><span class="sep">/</span><span class="cur">${h(g.adminId || key)}</span></div>${pageHead('Admin Detail', 'Admin identity and board ownership')}<div class="detail-grid board-admin-detail"><div>${identity}</div><div>${card('Owned Boards', table(['Board','Name','Type',''], owned))}</div></div>`;
}
function focusUserSection(section) {
  const target = document.getElementById(`user-${section}`);
  const heading = target?.querySelector('h2') || document.querySelector('.page-title');
  (target || heading)?.scrollIntoView({ block: 'start' });
  heading?.setAttribute('tabindex', '-1');
  heading?.focus({ preventScroll: true });
}
function openUserSection(id, section = 'profile') {
  closePortalModal();
  openDetail('user', id);
  focusUserSection(section === 'profile' ? 'heading' : section);
}
function characterProfileAction(id) {
  return id ? `<a class="btn btn-ghost sm" href="${h(characterProfileLink(id))}">Profile</a>` : '<button class="btn btn-ghost sm" disabled title="No Character ID" aria-label="Profile unavailable: no Character ID">Profile</button>';
}
function showUserActions(id) {
  const u = userById(id);
  if (!u) return;
  const icon = window.CoinQuestIcons;
  portalModal(`Actions · ${h(u.name)}`, `<div class="user-actions-menu">
    <button class="btn btn-ghost" onclick="openUserSection(${q(u.userId)},'boards')">${icon('scroll')}Boards <span>${u.boards.length}</span></button>
    <button class="btn btn-ghost" onclick="openUserSection(${q(u.userId)},'admin')">${icon('shield')}Admin roles <span>${u.adminGroups.length}</span></button>
    <button class="btn btn-ghost" onclick="openUserSection(${q(u.userId)},'lifecycle')">${icon('settings')}Account lifecycle</button>
    <button class="btn btn-ghost" onclick="showExportModal(${q(u.userId)})">${icon('download')}Export data</button>
  </div>`, '<button class="btn btn-ghost" onclick="closePortalModal()">Close</button>');
}
function clearAdminSearch() {
  query = '';
  render();
  document.querySelector('#admin-search')?.focus();
}
function renderUsers() {
  if (detail?.kind === 'user') return renderUserDetail(detail.id);
  const all = visibleUserRecords();
  const needle = query.trim().toLowerCase();
  const records = all.filter(u => !needle || [u.name, u.username, u.userId, ...u.chars.flatMap(c => [c.id, c.name])].join(' ').toLowerCase().includes(needle));
  const icon = window.CoinQuestIcons;
  const rows = records.map(u => {
    const profileId = u.chars.find(c => c.id)?.id;
    const chars = u.chars.map(c => staticIdChip('char', c.id || '—', `<span>${h(c.name)}</span>`)).join('');
    return `<tr class="user-row" data-user-id="${h(u.userId)}" role="row">
      <td class="user-id" role="cell"><button class="idchip k-user" onclick="openUserSection(${q(u.userId)})"><span class="ic-ico">User</span><span>${h(u.userId)}</span></button></td>
      <td class="user-name" role="cell"><div class="cell-strong">${h(u.name)}</div>${u.username ? `<div class="cell-sub">@${h(u.username)}</div>` : ''}</td>
      <td class="user-character" role="cell"><div class="wrap-chips">${chars || '<span class="cell-sub">No character yet</span>'}</div>${u.chars.length && !profileId ? '<div class="cell-sub">No Character ID</div>' : ''}</td>
      <td class="user-boards" role="cell">${icon('scroll')}<span>${u.boards.length}</span><span class="user-compact-label">${u.boards.length === 1 ? 'board' : 'boards'}</span></td>
      <td class="user-reputation" role="cell"><div aria-label="Profile reputation: ${userReputation(u)}">${levelBadge(userLevel(u))}<span class="cell-sub mono">${userReputation(u).toLocaleString()}</span></div></td>
      <td class="user-role ${u.adminGroups.length ? '' : 'is-empty'}" role="cell">${u.adminGroups.length ? `<span class="badge role">${icon('shield')}${u.adminGroups.length} Admin ${u.adminGroups.length === 1 ? 'role' : 'roles'}</span>` : '<span class="cell-sub">—</span>'}</td>
      <td class="user-status" role="cell">${statusBadgeFor(u.status)}</td>
      <td class="user-actions" role="cell"><div class="user-primary-actions">${characterProfileAction(profileId)}<button class="btn btn-ghost sm" onclick="openUserSection(${q(u.userId)})">Details</button></div><button class="user-more" aria-label="More actions for ${h(u.name)}" aria-haspopup="dialog" onclick="showUserActions(${q(u.userId)})">${icon('more')}</button></td>
    </tr>`;
  }).join('');
  const columns = [['id','User ID'],['name','Display name'],['character','Character'],['boards','Boards'],['reputation','Profile reputation'],['role','Admin role'],['status','Status'],['actions','Actions']];
  const content = records.length ? `<div class="tbl-wrap"><table class="tbl users-table" role="table" aria-label="Users"><thead role="rowgroup"><tr role="row">${columns.map(([key, label]) => `<th class="user-${key}" scope="col" role="columnheader">${label}</th>`).join('')}</tr></thead><tbody role="rowgroup">${rows}</tbody></table></div>` : `<div class="empty users-empty">${icon('profile')}<div class="e-t">${all.length ? 'ไม่พบผู้ใช้ที่ตรงกัน' : 'ยังไม่มีผู้ใช้'}</div><p class="e-d">${all.length ? 'ลองค้นหาด้วยชื่อผู้ใช้ ชื่อตัวละคร หรือ ID' : 'บัญชีที่สมัครและสมาชิกบอร์ดจะแสดงที่นี่'}</p>${all.length ? '<button class="btn btn-ghost" onclick="clearAdminSearch()">ล้างการค้นหา</button>' : ''}</div>`;
  const shortcuts = records.length ? `<div class="quick-open wrap-chips users-shortcuts" aria-label="User shortcuts">${records.slice(0, 4).map(u => `<button class="btn btn-ghost sm" onclick="openUserSection(${q(u.userId)})">Details <span>${h(u.userId)}</span></button>`).join('')}</div>` : '';
  return `${pageHead('Users', `${all.length} global users · one active character per User ID`)}<div class="toolbar users-toolbar">${searchBox('Search users or characters')}</div>${shortcuts}${card('Users', content, `<span class="count-note" role="status">${needle ? `${records.length} of ${all.length}` : all.length} users</span>`, 'users-list')}`;
}
function tombstoneKey(record) { return record.userId || record.username; }
function toggleTombstone(button, key) {
  const collapsed = !collapsedTombstones.has(key);
  if (collapsed) collapsedTombstones.add(key); else collapsedTombstones.delete(key);
  button.closest('.tombstone-row').dataset.collapsed = String(collapsed);
  button.setAttribute('aria-expanded', String(!collapsed));
  button.setAttribute('aria-label', `${collapsed ? 'Expand' : 'Collapse'} deleted ID ${key}`);
}
function showTombstoneDetail(key) {
  const record = tombstoneRecords().find(u => tombstoneKey(u) === key);
  if (!record) return;
  const fields = [
    ['User ID', record.userId ? staticIdChip('user', record.userId) : '—'],
    ['Username', record.username ? `@${h(record.username)}` : '—'],
    ['Character IDs', record.characterIds.map(id => staticIdChip('char', id)).join(' ') || '—'],
    ['Previous UID', h(record.previousUid || '—')],
    ['Status', statusBadgeFor('deleted')],
    ['Deleted at', h(adminDateLabel(record.deletedAt))],
    ['Source', h(record.source || '—')],
    ['Reason', h(record.reason || 'Not recorded')]
  ];
  portalModal('Deleted ID detail', `<p class="tombstone-detail-note">Historical record · not an active account</p><dl class="tombstone-detail">${fields.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`, '<button class="btn btn-ghost" onclick="closePortalModal()">Close</button>');
}
function renderTombstones() {
  const all = tombstoneRecords();
  const needle = query.trim().toLowerCase();
  const records = all.filter(u => !needle || [u.username, u.userId, ...u.characterIds].join(' ').toLowerCase().includes(needle));
  const icon = window.CoinQuestIcons;
  const columns = [['id','User ID'],['username','Username'],['characters','Character IDs'],['uid','Previous UID'],['status','Status'],['date','Deleted at'],['source','Source'],['actions','Details']];
  const rows = records.map((u, index) => {
    const key = tombstoneKey(u);
    const collapsed = collapsedTombstones.has(key);
    const meta = (name, label, value) => `<td id="tombstone-${index}-${name}" class="ts-${name} tombstone-meta" role="cell"><span class="ts-label">${label}</span><div class="ts-value">${value}</div></td>`;
    return `<tr class="tombstone-row" data-key="${h(key)}" data-collapsed="${collapsed}" role="row">
      <td class="ts-id" role="cell">${u.userId ? staticIdChip('user', u.userId) : '<span class="cell-sub">No User ID</span>'}</td>
      <td class="ts-username" role="cell">${u.username ? `<span class="mono">@${h(u.username)}</span>` : '<span class="cell-sub">No username</span>'}</td>
      ${meta('characters', 'Character IDs', u.characterIds.map(id => staticIdChip('char', id)).join(' ') || '—')}
      ${meta('uid', 'Previous UID', `<span class="mono" title="${h(u.previousUid || '')}">${h(u.previousUid || '—')}</span>`)}
      <td class="ts-status" role="cell">${statusBadgeFor('deleted')}<button class="tombstone-toggle" aria-expanded="${!collapsed}" aria-controls="${['characters','uid','date','source','actions'].map(name => `tombstone-${index}-${name}`).join(' ')}" aria-label="${collapsed ? 'Expand' : 'Collapse'} deleted ID ${h(key)}" onclick="toggleTombstone(this,${q(key)})">${icon('chevron')}</button></td>
      ${meta('date', 'Deleted at', h(adminDateLabel(u.deletedAt)))}
      ${meta('source', 'Source', h(u.source || '—'))}
      <td id="tombstone-${index}-actions" class="ts-actions tombstone-meta" role="cell"><button class="btn btn-ghost sm" onclick="showTombstoneDetail(${q(key)})">Details</button></td>
    </tr>`;
  }).join('');
  const content = records.length ? `<div class="tbl-wrap"><table class="tbl tombstones-table" role="table" aria-label="Deleted IDs"><thead role="rowgroup"><tr role="row">${columns.map(([key,label]) => `<th class="ts-${key}" scope="col" role="columnheader">${label}</th>`).join('')}</tr></thead><tbody role="rowgroup">${rows}</tbody></table></div>` : `<div class="empty">${icon('document')}<div class="e-t">${all.length ? 'No matching deleted IDs' : 'No deleted IDs yet'}</div><p class="e-d">${all.length ? 'Try a User ID, username or Character ID.' : 'Deleted identity records will appear here for audit.'}</p>${all.length ? '<button class="btn btn-ghost" onclick="clearAdminSearch()">Clear search</button>' : ''}</div>`;
  const note = `<div class="phase-note tombstones-note">${icon('document')}<span>หน้านี้แสดงประวัติรหัสบัญชีที่ถูกลบเพื่อใช้ตรวจสอบย้อนหลัง รหัสอาจนำกลับมาใช้ได้ตามเงื่อนไขของระบบ รายการเหล่านี้แยกจากบัญชีผู้ใช้และผู้ดูแลบอร์ดที่ยังใช้งานอยู่</span></div>`;
  return `${pageHead('Deleted IDs', `${all.length} deleted account records · retained for review`)}${note}<div class="toolbar tombstones-toolbar">${searchBox('Search deleted IDs or usernames')}</div>${card('Deleted IDs', content, `<span class="count-note" role="status">${needle ? `${records.length} of ${all.length}` : all.length} records</span>`, `tombstones-list ${needle ? 'is-filtered' : ''}`)}`;
}
function adminDetailHeading(title, badges, actions, titleAttribute = '', centered = false) {
  return `<header class="admin-detail-heading${centered ? ' admin-detail-heading--centered admin-paper-card' : ''}"><div><h1 class="page-title" ${titleAttribute}>${h(title)}</h1><div class="admin-detail-badges">${badges}</div></div><div class="admin-detail-actions">${actions}</div></header>`;
}
function adminTavernBanner(quiet = false) {
  return quiet ? '<div class="admin-tavern-banner admin-tavern-banner--quiet" aria-hidden="true"></div>' : '<div class="admin-tavern-banner"><p>“Every quest<br>leaves a trace.”</p></div>';
}
function userDetailSection(key, title, icon, body, count = null) {
  return `<section id="user-${key}" class="card admin-paper-card user-detail-section" aria-labelledby="user-${key}-title"><h2 id="user-${key}-title" class="admin-section-heading"><span class="admin-section-label">${adminTavernIcon(icon)}<span>${h(title)}</span>${count !== null ? `<span class="badge outline user-section-count">${count}</span>` : ''}</span></h2><div class="card-pad">${body}</div></section>`;
}
function renderUserDetail(id) {
  const u = userById(id);
  if (!u) return card('User not found', '<button class="btn btn-ghost" onclick="closeDetail()">Back</button>');
  const icon = adminTavernIcon;
  const reputation = userReputation(u);
  const empty = (title, description = '') => `<div class="empty"><div class="e-t">${title}</div>${description ? `<p class="e-d">${description}</p>` : ''}</div>`;
  const summaryCounts = [['swords','Character',u.chars.length],['scroll','Boards',u.boards.length],['shield','Admin roles',u.adminGroups.length]].map(([art,label,count]) => `<div>${icon(art)}<strong>${count}</strong><span>${label}</span></div>`).join('');
  const profile = userDetailSection('profile','Profile Summary','shield',`<div class="user-summary"><span class="admin-medallion medallion-users" aria-hidden="true"></span><div class="profile-name">${h(u.name)}</div>${u.username ? `<p class="user-summary-meta">@${h(u.username)}</p>` : ''}<p class="user-summary-meta">User ID · <span class="mono">${h(u.userId)}</span></p><div class="admin-detail-badges">${statusBadgeFor(u.status)}${u.adminGroups.length ? `<span class="badge role">${u.adminGroups.length} Admin ${u.adminGroups.length === 1 ? 'role' : 'roles'}</span>` : ''}</div><div class="user-reputation-summary"><span>Profile Reputation</span><strong>LV ${userLevel(u)} <span>${reputation.toLocaleString()}</span></strong><small>Separate from Character XP</small></div><div class="user-summary-counts">${summaryCounts}</div></div>`);
  const chars = u.chars.map(c => {
    const level = characterLevelFromXp(c.xp);
    return `<article class="user-character-entry"><div class="user-entry-top"><div class="user-entry-identity"><span class="user-character-emblem">${icon('swords')}</span><div><h3>${h(c.name)}</h3><div class="user-character-meta">${staticIdChip('char',c.id || '—')}<span>${h(c.className)}</span>${levelBadge(level.lvl)}</div><p class="user-character-xp">Character XP <strong>${Number(c.xp || 0).toLocaleString()} XP</strong>${c.id ? '' : ' · No Character ID'}</p></div></div>${characterProfileAction(c.id)}</div><div class="xpbar" role="progressbar" aria-label="Character level progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.max(0,Math.min(100,level.pct || 0))}"><span style="width:${Math.max(0,Math.min(100,level.pct || 0))}%"></span></div><div class="user-linked-boards"><p class="section-label">Appears in</p><div class="wrap-chips">${c.boards.map(bid => { const b=boardById(bid); return b ? `<button class="idchip k-board" onclick="openBoardSection(${q(b.originalId)})"><span>Board ${h(b.urlId)}</span><span>${h(b.tripName)}</span></button>` : ''; }).join('') || '<span class="cell-sub">No boards</span>'}</div></div></article>`;
  }).join('') || empty('No character yet','This account has no active character.');
  const boards = u.boards.map(b => {
    const character = u.chars.find(c => c.boards.includes(b.originalId));
    return `<tr role="row" data-board-id="${h(b.originalId)}"><td class="user-board-id" role="cell">${idChip('board',b.urlId,b.originalId)}</td><td class="user-board-name cell-strong" role="cell">${h(b.tripName)}</td><td class="user-board-type" role="cell"><span class="user-detail-cell-label">Type</span>${modBadge(b.type)}</td><td class="user-board-character" role="cell"><span class="user-detail-cell-label">As character</span>${character?.id ? staticIdChip('char',character.id) : '<span class="cell-sub">No Character ID</span>'}</td><td class="user-board-action" role="cell"><button class="btn btn-primary sm" onclick="openBoardSection(${q(b.originalId)})">Open Board →</button></td></tr>`;
  }).join('');
  const boardTable = boards ? `<div class="tbl-wrap"><table class="tbl user-detail-boards" role="table" aria-label="User boards"><thead><tr>${['Board ID','Name','Type','As character','Action'].map(label=>`<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${boards}</tbody></table></div>` : empty('No boards','This user has no linked boards.');
  const admins = u.adminGroups.map(g => `<article class="user-admin-entry"><div class="user-entry-top"><div class="user-entry-identity">${icon('shield')}<div><h3>${h(g.adminName || g.adminId || 'Admin')}</h3><div class="user-admin-meta">${staticIdChip('admin',g.adminId || '—')}<span>Owner hash: <span class="mono">${h(g.boards[0]?.adminOwnerHash || '—')}</span></span></div></div></div><button class="btn btn-primary sm" onclick="openAdminGroup(${q(g.boards[0].originalId)})">Open Admin →</button></div><div class="user-linked-boards"><p class="section-label">Boards owned</p><div class="wrap-chips">${g.boards.map(b=>idChip('board',b.urlId,b.originalId)).join('')}</div></div></article>`).join('') || empty('Not an admin','This user does not administer any board.');
  const activity = auditEntries().filter(a => a.actor === u.name || u.boards.some(b => a.target === b.urlId || a.target === b.originalId));
  const activityRows = activity.map(a => {
    const board = u.boards.find(b => a.target === b.urlId || a.target === b.originalId);
    return `<div class="log-item">${icon('scroll')}<div class="log-body"><div class="log-text">${h(a.action)}</div><div class="log-meta"><span>${a.id.startsWith('draft-') ? 'Local draft' : h(boardDateLabel(a.ts))}</span><span>${h(a.actor)}</span><span class="mono">${h(a.target)}</span></div></div>${board ? `<button class="btn btn-ghost sm" onclick="openBoardSection(${q(board.originalId)})">Open Board →</button>` : ''}</div>`;
  }).join('') || empty('No activity yet','No related board changes are recorded.');
  const deleteReady = TEST_MODE || adminBackendStatus.adminDeleteConfigured;
  const action = (art,title,description,label,handler,kind='gold') => `<div class="user-lifecycle-action ${kind === 'danger' ? 'is-danger' : ''}">${icon(art)}<div><h3>${title}</h3><p>${description}</p></div><button class="btn btn-${kind}" onclick="${handler}">${label}</button></div>`;
  const lifecycle = `<div class="phase-note user-lifecycle-note">${icon('shield')}<span>Account changes take effect after confirmation; they do not wait for Board Publish. Archive and deactivate keep data recoverable.</span></div><div class="kv user-account-facts"><div class="kv-row"><span class="k">Current status</span><span class="v">${statusBadgeFor(u.status)}</span></div><div class="kv-row"><span class="k">Firebase UID</span><span class="v mono">${h(u.uid || 'not linked')}</span></div><div class="kv-row"><span class="k">Username</span><span class="v">${u.username ? '@'+h(u.username) : '—'}</span></div></div><p class="user-backend-note">${h(adminDeleteBackendNote())}</p><div class="user-lifecycle-actions">${action('box','Archive user','Keep account data and remove the user from active circulation.','Archive',`showUserLifecycleModal(${q(u.userId)},'archived')`)}${action('key','Deactivate login','Block player login while keeping account data recoverable.','Deactivate',`showUserLifecycleModal(${q(u.userId)},'deactivated')`,'danger')}${normalizeUserStatus(u.status) !== 'active' ? action('shield','Reactivate user','Return this account to active status.','Reactivate',`showUserLifecycleModal(${q(u.userId)},'active')`,'primary') : ''}<div class="user-lifecycle-action is-danger">${icon('trash')}<div><h3>Permanent delete request</h3><p>${deleteReady ? 'Permanently remove account data. A reason and exact confirmation are required.' : h(adminDeleteBackendNote())}</p></div><button class="btn btn-danger" onclick="showPermanentDeleteModal(${q(u.userId)})" ${deleteReady ? '' : 'disabled'}>Request delete</button></div></div>`;
  const actions = `<button class="btn btn-ghost" onclick="showResetPwModal(${q(u.userId)})">${icon('key')}Reset password</button><button class="btn btn-gold" onclick="showExportModal(${q(u.userId)})">${icon('download')}Export data</button><button class="btn btn-ghost" onclick="focusUserSection('lifecycle')">${icon('shield')}Lifecycle</button>`;
  return `<div class="crumbs"><button onclick="closeDetail('users')">Users</button><span class="sep">/</span><span class="cur">${h(u.name)}</span></div><div class="user-info-page">${adminDetailHeading(u.name,`${staticIdChip('user',u.userId)}${u.username ? `<span class="user-heading-username">@${h(u.username)}</span>` : ''}${statusBadgeFor(u.status)}`,actions,'',true)}${adminTavernBanner(true)}<div class="user-info-grid"><aside class="user-profile-aside">${profile}<div class="user-identity-note">${icon('shield')}<p>One account · one active character</p><small>User, Character and Admin IDs keep their separate roles.</small></div></aside><div class="user-info-sections">${userDetailSection('chars','Character','swords',chars,u.chars.length)}${userDetailSection('boards','Boards','scroll',boardTable,u.boards.length)}${userDetailSection('admin','Admin roles','shield',admins,u.adminGroups.length)}${userDetailSection('activity','Activity','scroll',`<div class="log-list">${activityRows}</div>`,activity.length)}${userDetailSection('lifecycle','Account lifecycle','key',lifecycle)}</div></div></div>`;
}
function renderAuditLog() {
  const scopeIco = { board:'🗂️', user:'👤', admin:'🛡️', system:'⚙️' };
  const rows = auditEntries()
    .filter(a => auditFilter === 'all' || a.scope === auditFilter)
    .filter(a => !query || `${a.actor} ${a.action} ${a.target}`.toLowerCase().includes(query.toLowerCase()));
  const body = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>When</th><th>Actor</th><th>Scope</th><th>Action</th><th>Target</th></tr></thead><tbody>${rows.map(a => `<tr><td class="cell-sub mono nowrap">${h(new Date(a.ts).toLocaleString())}</td><td class="cell-strong">${h(a.actor)}</td><td><span class="badge outline">${scopeIco[a.scope] || '•'} ${h(a.scope)}</span></td><td>${h(a.action)}</td><td>${a.scope === 'board' && a.target !== 'draft' ? idChip('board', a.target, a.target) : a.scope === 'user' ? idChip('user', a.target, a.target) : `<span class="mono cell-sub">${h(a.target)}</span>`}</td></tr>`).join('')}</tbody></table></div>`;
  const filter = `${searchBox('Search audit')} ${seg('auditFilter', auditFilter, [['all','All types'],['board','Board'],['user','User'],['admin','Admin'],['system','System']])}`;
  return `${pageHead('Audit Log', 'Published board changes and local draft changes, with actor and target')}${`<div class="toolbar">${filter}</div>`}${card('Audit Log', rows.length ? body : '<div class="empty"><div class="e-t">No audit entries yet</div></div>')}`;
}
function renderRevisions() {
  const revs = published.revisions || [];
  const current = diffBoards();
  const versionRows = [
    { v:'current', at:Date.now(), by:'Local Draft', current:true, note: current.length ? `${current.length} unpublished changes` : 'Published version' },
    ...revs.map((rev, i) => ({ v:`v${revs.length - i}`, at:rev.createdAt, by:rev.author || 'Super Admin', current:false, note:`${(rev.changes || []).length} changes`, rev }))
  ];
  const body = `<div class="log-list">${versionRows.map(v => `<div class="log-item"><div class="log-ico edit">${v.current ? '⭐' : '🕰️'}</div><div class="log-body"><div class="log-text"><b class="mono">${h(v.v)}</b>${v.current ? ` <span class="badge st-active">${current.length ? 'Draft' : 'Published'}</span>` : ''} · ${h(v.note)}</div><div class="log-meta"><span>${h(v.at ? new Date(v.at).toLocaleString() : '—')}</span><span class="dot-sep">·</span><span>by ${h(v.by)}</span></div></div></div>`).join('')}</div>`;
  const revDetails = revs.map(rev => `<details class="rev"><summary><span>${new Date(rev.createdAt).toLocaleString()} · ${(rev.changes || []).length} changes</span><span>${h(rev.author || '')}</span></summary><div class="rev-list">${(rev.changes || []).map(c => `<div class="log-item"><div class="log-ico edit">✎</div><div class="log-body"><div class="log-text"><b>${h(c.area)}</b> ${statusBadge(c.action, 'active')}</div><div class="log-meta">${h(c.detail)}</div></div></div>`).join('')}</div></details>`).join('');
  const actions = `<button class="btn btn-ghost" onclick="saveDraft()">💾 Save draft</button><button class="btn btn-primary" onclick="publishDraft()">🚀 Publish now${current.length ? ` (${current.length})` : ''}</button>`;
  return `${pageHead('Versions & Publishing', 'Board draft publishing history; expand a revision below to view its changes', actions)}<div class="phase-note"><span class="pn-ico">🛡️</span><span>${h(TEST_MODE ? 'Test mode writes the draft to session/local storage for regression.' : 'Only authorized administrators can publish. Publishing applies the current board changes to the live system.')}</span></div>${card('🕰️ System version history', body)}${revDetails ? `<div class="mt16">${card('Published revision details', revDetails)}</div>` : ''}`;
}
function renderSupportTools() {
  return `${pageHead('Support Tools', 'Account support and data exports')}
    <div class="grid g-2">
      ${card('🔑 Reset password', '<p>Set a new password for an existing account after verifying the account holder.</p><button class="btn btn-ghost" onclick="showResetPwModal()">Reset password</button>')}
      ${card('📤 Export data', '<p>Download the currently loaded board or user data as JSON, excluding authentication secrets.</p><button class="btn btn-gold" onclick="showExportModal()">Export JSON</button>')}
      ${card('👤 Users', '<p>Inspect account profiles, board links and account lifecycle.</p><button class="btn btn-ghost" onclick="selectTab(\'users\')">View users</button>')}
      ${card('🗂️ Boards', '<p>Review boards and publish verified draft changes.</p><button class="btn btn-ghost" onclick="selectTab(\'boards\')">View boards</button>')}
    </div>`;
}
function renderPageBody() {
  return tab === 'dashboard' ? renderDashboard() : tab === 'map' ? renderRelationshipMap() : tab === 'admins' ? renderAdmins() : tab === 'users' ? renderUsers() : tab === 'tombstones' ? renderTombstones() : tab === 'audit' ? renderAuditLog() : tab === 'revisions' ? renderRevisions() : tab === 'support' ? renderSupportTools() : renderBoards();
}
function renderMain() {
  const body = adminLoadError
    ? `${pageHead('โหลดข้อมูลไม่สำเร็จ')}<section class="card card-pad"><p role="alert">${h(adminLoadError)}</p><button class="btn btn-primary" onclick="refreshAdminData()">ลองใหม่</button></section>`
    : renderPageBody();
  const changes = diffBoards().length;
  const frame = window.CoinQuestAdminShell;
  document.getElementById('app').innerHTML = `<div class="app">
    ${frame.header({ test: TEST_MODE, dirty, changes, email: TEST_MODE ? 'Test Admin' : (adminUser?.email || SUPER_ADMIN_EMAIL), unavailable: !!adminLoadError })}
    <div class="shell">
      ${frame.sidebar({ tab, changes, boards: activeBoards().length, admins: adminGroups().length, users: visibleUserRecords().length, links: users().length })}
      <main class="main">
        ${draftWarning ? `<div class="phase-note" role="alert">${h(draftWarning)}</div>` : ''}
        <div class="phase-note"><span class="pn-ico">${window.CoinQuestIcons('shield')}</span><span>${h(TEST_MODE ? 'Test mode uses a local gate for automated regression.' : `Super Admin is protected by Google sign-in and allowlisted to ${SUPER_ADMIN_EMAIL}. ${adminDeleteBackendNote()}`)}</span></div>
        <div class="admin-page">${body}</div>
        ${frame.footer()}
      </main>
    </div>
  </div>`;
  frame.mount();
}
function renderGate() {
  window.CoinQuestAdminShell.close();
  const error = adminGateError ? `<div class="login-err" style="display:block;margin-top:12px">${h(adminGateError)}</div>` : '';
  if (!TEST_MODE) {
    if (adminAuthSettling || !adminAuthReady) {
      document.getElementById('app').innerHTML = `<div class="gate"><div class="gate-card card card-pad"><div class="gate-title">Super Admin Portal</div>${window.CoinQuestLoading.skeleton()}</div></div>`;
      return;
    }
    document.getElementById('app').innerHTML = `<div class="gate"><div class="gate-card card card-pad"><div class="gate-crest">⚔️</div><div class="gate-title">Super Admin Portal</div><div class="gate-sub">Google sign-in required</div><div class="phase-note"><span class="pn-ico">🛡️</span><span>เข้าได้เฉพาะ Gmail <b>${h(SUPER_ADMIN_EMAIL)}</b> เท่านั้น</span></div><button class="btn btn-primary" onclick="unlockGate()" ${adminAuthReady ? '' : 'disabled'}>Sign in with Google</button>${error}</div></div>`;
    return;
  }
  document.getElementById('app').innerHTML = `<div class="gate"><div class="gate-card card card-pad"><div class="gate-crest">⚔️</div><div class="gate-title">Super Admin Portal</div><div class="gate-sub">Coin Quest Ledger admin command center</div><div class="phase-note"><span class="pn-ico">⚠️</span><span>Test mode local gate for automated regression only</span></div>${formField('', `<input id="gate-pass" class="pin-input" type="password" placeholder="${gateConfigured() ? 'Super Admin test pass' : 'ตั้ง test pass ครั้งแรก'}" onkeydown="if(event.key==='Enter')unlockGate()">`)}<button class="btn btn-primary" onclick="unlockGate()">${gateConfigured() ? 'Unlock' : 'Set & Unlock'}</button>${error}</div></div>`;
}
function render() { isUnlocked() ? renderMain() : renderGate(); }
function userOptions(selected = '') {
  return visibleUserRecords().map(u => `<option value="${h(u.userId)}" ${u.userId === selected ? 'selected' : ''}>${h(u.name)} · ${h(u.userId)}</option>`).join('');
}
let modalReturnFocus = null;
function activatePortalModal() {
  const root = document.getElementById('modal-root');
  if (!root.classList.contains('show')) modalReturnFocus = document.activeElement;
  root.classList.add('show');
  const dialog = root.querySelector('.modal');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'admin-modal-title');
  dialog.querySelector('h3').id = 'admin-modal-title';
  dialog.querySelector('.x-btn')?.setAttribute('aria-label', 'Close');
  const focusable = () => [...dialog.querySelectorAll('button:not(:disabled),input:not([type="hidden"]):not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')].filter(el => el.getClientRects().length);
  root.onkeydown = event => {
    if (event.key === 'Escape') { event.preventDefault(); closePortalModal(); }
    if (event.key === 'Tab') {
      const elements = focusable(), first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  };
  focusable()[0]?.focus();
}
function closePortalModal() {
  const root = document.getElementById('modal-root');
  root.classList.remove('show');
  root.innerHTML = '';
  root.onkeydown = null;
  if (modalReturnFocus?.isConnected) modalReturnFocus.focus();
}
function portalModal(title, body, footer = '') {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal floating-modal"><div class="modal-head"><h3>${title}</h3><button class="x-btn" onclick="closePortalModal()">×</button></div><div class="modal-body">${body}</div>${footer ? `<div class="modal-foot">${footer}</div>` : ''}</div>`;
  activatePortalModal();
}
function showExportModal(target = '') {
  const body = `<div class="field"><label for="export-target">Select board / user</label><select id="export-target"><option value="">All</option><optgroup label="Boards">${activeBoards().map(b => `<option value="b:${h(b.originalId)}" ${b.originalId === target || b.urlId === target ? 'selected' : ''}>🗂️ ${h(b.tripName)} · ${h(b.urlId)}</option>`).join('')}</optgroup><optgroup label="Users">${visibleUserRecords().map(u => `<option value="u:${h(u.userId)}" ${u.userId === target ? 'selected' : ''}>👤 ${h(u.name)} · ${h(u.userId)}</option>`).join('')}</optgroup></select></div><p class="hint">JSON snapshot of the data currently loaded, including local draft changes. Authentication and recovery secrets are excluded.</p>`;
  portalModal('📤 Export data', body, `<button class="btn btn-ghost" onclick="closePortalModal()">Cancel</button><button class="btn btn-gold" onclick="exportAdminData()">Export JSON</button>`);
}
function exportAdminData() {
  const target = document.getElementById('export-target').value;
  const boards = activeBoards().filter(b => !target || target === `b:${b.originalId}`).map(b => ({ id: b.urlId, data: materializeBoard(b) }));
  const accounts = visibleUserRecords().filter(u => !target || target === `u:${u.userId}`).map(u => ({ userId: u.userId, name: u.name, username: u.username || '', status: u.status, characters: u.chars.map(c => ({ id: c.id, name: c.name, class: c.className, xp: c.xp })), boardIds: u.boards.map(b => b.urlId) }));
  const data = window.CoinQuestAdminUtils.redactExportSecrets({ schema: 'coin-quest-admin-export-v1', exportedAt: new Date().toISOString(), source: dirty ? 'local-draft' : 'loaded-published', boards, users: accounts });
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = 'coin-quest-admin-export.json';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  closePortalModal();
}
function showResetPwModal(id = '') {
  const temp = tempPassword();
  portalModal('🔑 Reset password', `<div class="field"><label>Real account username</label><input id="reset-username" class="mono" placeholder="username"><div class="hint">Enter the account’s username. Administrator access is verified before the password is reset.</div></div><div class="field"><label>Temporary password</label><input id="reset-temp-password" class="mono" value="${h(temp)}"><div class="hint">Give this password to the user. A new recovery key is generated for secure handoff to the account holder.</div></div><div class="field"><label>Optional User ID to preserve</label><select id="reset-user-id"><option value="">From existing account mapping</option>${userOptions(id)}</select></div><div class="phase-note" style="margin:0"><span class="pn-ico">🔐</span><span>This resets the selected account’s password without changing your administrator session.</span></div><div class="login-err" id="reset-error" hidden></div>`, `<button class="btn btn-ghost" onclick="closePortalModal()">Cancel</button><button class="btn btn-primary" onclick="performAdminPasswordReset()">Confirm reset</button>`);
}
async function performAdminPasswordReset() {
  const username = normalizeUsername(document.getElementById('reset-username')?.value || '');
  const password = String(document.getElementById('reset-temp-password')?.value || '');
  const keepUserId = String(document.getElementById('reset-user-id')?.value || '');
  const err = document.getElementById('reset-error');
  const setError = text => {
    if (!err) return;
    err.hidden = !text;
    err.textContent = text ? `⚠️ ${text}` : '';
  };
  if (!username || password.length < 6) {
    setError('Enter a username and a temporary password containing at least 6 characters.');
    return;
  }
  if (TEST_MODE) {
    const recoveryCode = recoveryCodeValue();
    portalModal('✅ Password reset ready', `<div class="field"><label>Username</label><input class="mono" value="${h(username)}" readonly></div><div class="field"><label>Temporary password</label><input class="mono" value="${h(password)}" readonly></div><div class="field"><label>New recovery key</label><input class="mono" value="${h(recoveryCode)}" readonly><div class="hint">Test mode simulates the backend handoff without touching Firebase Auth.</div></div>`, `<button class="btn btn-primary" onclick="closePortalModal()">Done</button>`);
    return;
  }
  try {
    const auth = window.PointyFirebase?.auth?.();
    if (!auth?.currentUser) throw new Error('Google admin session is missing. Sign in again.');
    if (!adminBackendStatus.adminDeleteConfigured) throw new Error(adminDeleteBackendNote());
    const token = await auth.currentUser.getIdToken();
    const res = await fetch('/api/admin-reset-user', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ username, password, keepUserId })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || `Backend returned ${res.status}`);
    portalModal('✅ Password reset ready', `<div class="field"><label>Username</label><input class="mono" value="${h(data.username || username)}" readonly></div><div class="field"><label>Temporary password</label><input class="mono" value="${h(password)}" readonly></div><div class="field"><label>New recovery key</label><input class="mono" value="${h(data.recoveryCode || '')}" readonly><div class="hint">Give this to the user once. It replaces their previous recovery code.</div></div><div class="field"><label>User ID</label><input class="mono" value="${h(data.userId || '')}" readonly></div>`, `<button class="btn btn-primary" onclick="closePortalModal()">Done</button>`);
    await loadPublished();
    render();
  } catch (error) {
    setError(error?.message || 'Reset failed.');
  }
}
function showUserLifecycleModal(userId, nextStatus) {
  const u = userById(userId);
  if (!u) return;
  const status = normalizeUserStatus(nextStatus);
  const title = status === 'active' ? '✅ Reactivate user' : status === 'archived' ? '📦 Archive user' : '⛔ Deactivate user';
  const note = status === 'active'
    ? 'This returns the account to active status.'
    : status === 'archived'
    ? 'This is a recoverable soft archive. Data remains attached to the User ID.'
    : 'This is a recoverable deactivation. Player login is blocked while this status is active.';
  portalModal(title, `<div class="field"><label>User</label><input class="mono" value="${h(u.name)} · ${h(u.userId)}" readonly></div><div class="field"><label>Reason</label><textarea id="lifecycle-reason" rows="3" placeholder="Why is this lifecycle change needed?"></textarea><div class="hint">${h(note)}</div></div><div class="login-err" id="lifecycle-error" hidden></div>`, `<button class="btn btn-ghost" onclick="closePortalModal()">Cancel</button><button class="btn ${status === 'active' ? 'btn-primary' : status === 'archived' ? 'btn-gold' : 'btn-danger'}" onclick="performUserLifecycle(${q(userId)},${q(status)})">Confirm</button>`);
}
async function performUserLifecycle(userId, status) {
  const u = userById(userId);
  const err = document.getElementById('lifecycle-error');
  const reason = String(document.getElementById('lifecycle-reason')?.value || '').trim();
  const setError = text => {
    if (!err) return;
    err.hidden = !text;
    err.textContent = text ? `⚠️ ${text}` : '';
  };
  if (!u) return setError('User not found.');
  if (!TEST_MODE && !u.uid) return setError('This is a board-local identity, not an Auth account. Manage its membership in Party Ledger.');
  if (!reason) return setError('Audit reason is required.');
  const nextStatus = normalizeUserStatus(status);
  const now = Date.now();
  const patch = {
    status: nextStatus,
    lifecycleReason: reason,
    lifecycleUpdatedAt: now,
    archivedAt: nextStatus === 'archived' ? now : 0,
    deactivatedAt: nextStatus === 'deactivated' ? now : 0,
    deleteRequestedAt: u.deleteRequestedAt || 0,
    deletedAt: 0
  };
  try {
    if (TEST_MODE || !u.uid) {
      const local = localUserLifecycle();
      local[u.userId] = { ...(local[u.userId] || {}), ...patch, reason };
      saveLocalUserLifecycle(local);
    }
    if (!TEST_MODE && u.uid) {
      const db = window.PointyFirebase?.firestore?.();
      if (!db) throw new Error('Firebase Firestore is not available.');
      await window.CoinQuestAdminUtils.setAccountLifecycle({ db, uid: u.uid, userId: u.userId, patch, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
      patchCloudUserLifecycle(u, patch, reason);
    }
    closePortalModal();
    render();
  } catch (error) {
    setError(error?.message || 'Lifecycle update failed.');
  }
}
function showPermanentDeleteModal(userId) {
  const u = userById(userId);
  if (!u) return;
  if (!TEST_MODE && !adminBackendStatus.adminDeleteConfigured) {
    portalModal('🗑️ Permanent delete unavailable', `<div class="phase-note" style="margin-top:0"><span class="pn-ico">⚠️</span><span>${h(adminDeleteBackendNote())}</span></div><div class="field"><label>Required Vercel env</label><input class="mono" value="FIREBASE_SERVICE_ACCOUNT_JSON" readonly><div class="hint">Or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in Vercel Production.</div></div><div class="field"><label>Allowed Gmail</label><input class="mono" value="${h(SUPER_ADMIN_EMAIL)}" readonly></div>`, `<button class="btn btn-primary" onclick="closePortalModal()">Got it</button>`);
    return;
  }
  const confirmText = `DELETE ${u.userId}`;
  portalModal('🗑️ Permanent delete request', `<div class="phase-note" style="margin-top:0"><span class="pn-ico">⚠️</span><span>Only the authorized Super Admin can permanently delete an account. This takes effect immediately after confirmation and cannot be undone.</span></div><div class="field"><label>User</label><input class="mono" value="${h(u.name)} · ${h(u.userId)}${u.username ? ' · @' + h(u.username) : ''}" readonly></div><div class="field"><label>Reason</label><textarea id="delete-reason" rows="3" placeholder="Required audit reason"></textarea></div><div class="field"><label>Type to confirm</label><input id="delete-confirm" class="mono" placeholder="${h(confirmText)}"><div class="hint">This permanently removes account and character data and clears their links from boards. Legacy records without a sign-in account are also cleaned up.</div></div><div class="login-err" id="delete-error" hidden></div>`, `<button class="btn btn-ghost" onclick="closePortalModal()">Cancel</button><button class="btn btn-danger" onclick="performPermanentDeleteRequest(${q(userId)})">Request permanent delete</button>`);
}
async function performPermanentDeleteRequest(userId) {
  const u = userById(userId);
  const err = document.getElementById('delete-error');
  const reason = String(document.getElementById('delete-reason')?.value || '').trim();
  const typed = String(document.getElementById('delete-confirm')?.value || '').trim();
  const setError = text => {
    if (!err) return;
    err.hidden = !text;
    err.textContent = text ? `⚠️ ${text}` : '';
  };
  if (!u) return setError('User not found.');
  if (!reason) return setError('Audit reason is required.');
  if (typed !== `DELETE ${u.userId}`) return setError(`Type DELETE ${u.userId} to confirm.`);
  const body = {
    userId: u.userId,
    uid: u.uid || '',
    username: u.username || '',
    displayName: u.name || '',
    email: u.email || '',
    characterIds: u.chars.map(c => c.id).filter(Boolean),
    reason
  };
  if (TEST_MODE) {
    const local = localUserLifecycle();
    local[u.userId] = { ...(local[u.userId] || {}), status: 'delete_requested', deleteRequestedAt: Date.now(), reason };
    saveLocalUserLifecycle(local);
    closePortalModal();
    render();
    return;
  }
  if (!adminBackendStatus.adminDeleteConfigured) return setError(adminDeleteBackendNote());
  try {
    const token = await adminAuth()?.currentUser?.getIdToken?.();
    if (!token) throw new Error('Google admin session is missing. Sign in again.');
    const res = await fetch('/api/admin-delete-user', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || `Backend returned ${res.status}`);
    const local = localUserLifecycle();
    local[u.userId] = { ...(local[u.userId] || {}), status: data.deleted ? 'deleted' : 'delete_requested', deleteRequestedAt: Date.now(), deletedAt: data.deleted ? Date.now() : 0, reason };
    saveLocalUserLifecycle(local);
    closePortalModal();
    await loadPublished();
    render();
  } catch (error) {
    setError(error?.message || 'Permanent delete request failed.');
  }
}
function showModal(title, body, actions = []) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal floating-modal"><div class="modal-head"><h3>${h(title)}</h3><button class="x-btn">×</button></div><div class="modal-body">${h(body)}</div><div class="modal-foot">${actions.map((a, i) => `<button class="btn ${a.primary ? 'btn-primary' : 'btn-ghost'} ${a.danger ? 'btn-danger' : ''}" data-i="${i}">${h(a.label || 'ตกลง')}</button>`).join('')}</div></div>`;
  activatePortalModal();
  [...root.querySelectorAll('button')].forEach(btn => btn.onclick = async () => {
    const fn = btn.hasAttribute('data-i') ? actions[Number(btn.dataset.i)]?.onClick : null;
    closePortalModal();
    if (fn) {
      try { await fn(); }
      catch (error) { showModal('บันทึกไม่สำเร็จ', error?.message || 'ลองใหม่อีกครั้ง ข้อมูล draft ยังอยู่', [{ label: 'ปิด' }]); }
    }
  });
}
function confirmAction(title, body, onConfirm) {
  showModal(title, body, [{ label: 'ยกเลิก' }, { label: 'ยืนยัน', primary: true, danger: /ลบ|Delete/.test(title), onClick: onConfirm }]);
}
async function boot() {
  if (!TEST_MODE) {
    startAdminAuth();
    if (adminAuthSettling || !adminAuthReady || !isUnlocked()) { renderGate(); return; }
  }
  if (!isUnlocked()) { renderGate(); return; }
  await refreshAdminData();
}
boot();
