const ADMIN_PARAMS = new URLSearchParams(location.search);
const TEST_MODE = ADMIN_PARAMS.get('test') === '1';
const DRAFT_KEY = 'pointy_super_admin_draft_v2';
const GATE_KEY = 'pointy_super_admin_gate_hash_v2';
const GATE_UNLOCK_KEY = 'pointy_super_admin_unlocked_v2';
const LOCAL_REVISIONS_KEY = 'pointy_super_admin_revisions_v2';
const LOCAL_USER_LIFECYCLE_KEY = 'pointy_admin_user_lifecycle_v1';
const VALID_TABS = new Set(['dashboard', 'map', 'boards', 'users', 'admins', 'audit', 'revisions', 'support']);
const SUPER_ADMIN_EMAIL = 'purich.wc@gmail.com';

let published = { boards: [], revisions: [] };
let draft = { boards: [] };
let tab = VALID_TABS.has(ADMIN_PARAMS.get('tab')) ? ADMIN_PARAMS.get('tab') : 'boards';
let query = '';
let detail = null;
let boardFilter = 'all';
let auditFilter = 'all';
let dashMode = 'a';
let dirty = false;
let userDetailTab = 'chars';
let boardDetailTab = 'overview';
let boardDetailView = 'tabbed';
let cloudUsers = [];
let adminUser = null;
let adminAuthReady = TEST_MODE;
let adminAuthStarted = false;
let adminGateError = '';
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
function hashOf(v) { return PointyLogic.hashOf(v); }
function adminHash(pass) { return String(hashOf(`pointy:${pass || ''}:admin`)); }
function h(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function q(s) { return JSON.stringify(String(s ?? '')).replace(/"/g, '&quot;'); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function clone(x) { return JSON.parse(JSON.stringify(x)); }
function characterLevelFromXp(xp) { return PointyLogic.levelFromXp(xp); }
function profileLevelFromRenown(renown) { return PointyLogic.levelFromRenown(renown); }
function localUserLifecycle() {
  try { return JSON.parse(localStorage.getItem(LOCAL_USER_LIFECYCLE_KEY) || '{}') || {}; } catch (_) { return {}; }
}
function saveLocalUserLifecycle(data) {
  localStorage.setItem(LOCAL_USER_LIFECYCLE_KEY, JSON.stringify(data || {}));
}
function normalizeUserStatus(value) {
  const key = String(value || 'active').toLowerCase();
  return ['active', 'archived', 'deactivated', 'delete_requested', 'deleted'].includes(key) ? key : 'active';
}
function statusWeight(value) {
  return { active: 0, archived: 1, deactivated: 2, delete_requested: 3, deleted: 4 }[normalizeUserStatus(value)] || 0;
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
function adminAuthEmail(username) {
  const clean = normalizeUsername(username);
  return `${clean}.admin-${Date.now().toString(36)}@coinquest.local`;
}
function tempPassword() {
  return 'CQ-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}
async function sha256(text) {
  const data = new TextEncoder().encode(String(text || ''));
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function cleanRecoveryCode(code) {
  return String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}
async function recoveryHash(username, code) {
  return sha256(`${normalizeUsername(username)}:${cleanRecoveryCode(code)}`);
}
function recoveryCodeValue() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('').replace(/(.{4})/g, '$1-').replace(/-$/, '');
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
    return 'Domain นี้ยังไม่อยู่ใน Firebase Auth authorized domains. เพิ่ม coin-quest-ledger.vercel.app แล้วลองใหม่';
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
  if (!adminBackendStatus.checked) return 'Checking privileged delete backend status...';
  if (adminBackendStatus.adminDeleteConfigured) return 'Privileged delete backend is configured for Firebase Admin SDK.';
  return 'Privileged delete is disabled until Vercel has Firebase Admin service account env vars.';
}
function startAdminAuth() {
  if (TEST_MODE || adminAuthStarted) return;
  initFirebase();
  const auth = adminAuth();
  if (!auth?.onAuthStateChanged) {
    adminAuthReady = true;
    adminGateError = 'Firebase Auth is not available on this page.';
    renderGate();
    return;
  }
  adminAuthStarted = true;
  auth.onAuthStateChanged(async user => {
    adminAuthReady = true;
    if (user && isAllowedAdmin(user)) {
      adminUser = user;
      adminGateError = '';
      await Promise.all([loadPublished(), refreshAdminBackendStatus()]);
      renderMain();
      return;
    }
    adminUser = null;
    if (user) {
      adminGateError = `บัญชี ${user.email || 'unknown'} ไม่มีสิทธิ์ Super Admin`;
      await auth.signOut().catch(() => {});
    }
    renderGate();
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
  return {
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
}
async function loadPublished() {
  initFirebase();
  let boards = [];
  let revisions = [];
  cloudUsers = [];
  if (TEST_MODE) {
    boards = Object.keys(sessionStorage)
      .filter(k => k.startsWith('pointy_test_trip_'))
      .map(k => normalizeBoard(k.replace('pointy_test_trip_', ''), JSON.parse(sessionStorage.getItem(k) || '{}')));
    revisions = JSON.parse(localStorage.getItem(LOCAL_REVISIONS_KEY) || '[]');
  } else {
    const db = firebase.firestore();
    const snap = await db.collection('trips').get();
    boards = snap.docs.map(doc => normalizeBoard(doc.id, doc.data() || {}));
    try {
      const revSnap = await db.collection('adminRevisions').orderBy('createdAt', 'desc').limit(20).get();
      revisions = revSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (_) {
      revisions = [];
    }
    try {
      const usersSnap = await db.collection('users').get();
      cloudUsers = usersSnap.docs.map(doc => normalizeCloudUser(doc.id, doc.data() || {})).filter(Boolean);
    } catch (err) {
      console.warn('Admin cloud users load failed', err);
      cloudUsers = [];
    }
  }
  boards.sort((a, b) => a.id.localeCompare(b.id));
  published = { boards, revisions };
  const saved = localStorage.getItem(DRAFT_KEY);
  draft = saved ? JSON.parse(saved) : { boards: clone(boards) };
  dirty = !!saved;
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
function updateUser(originalId, name, nextId) {
  const board = boardById(originalId);
  if (!board) return;
  board.characterIds[name] = String(nextId || '').replace(/\D/g, '').slice(0, 4);
  markDirty();
}
function adminGroups() {
  const map = new Map();
  draft.boards.filter(b => !b.deleted).forEach(b => {
    const key = b.adminOwnerHash || b.adminId || 'unknown';
    if (!map.has(key)) map.set(key, { key, adminId: b.adminId, adminName: b.adminName, boards: [] });
    const g = map.get(key);
    g.adminId = g.adminId || b.adminId;
    g.adminName = g.adminName || b.adminName;
    g.boards.push(b);
  });
  return [...map.values()].sort((a, b) => String(a.adminId || a.key).localeCompare(String(b.adminId || b.key)));
}
function updateAdminGroup(key, patch) {
  draft.boards.forEach(b => {
    const k = b.adminOwnerHash || b.adminId || 'unknown';
    if (k === key) Object.assign(b, patch);
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
  if (type === 'debt') return 'Debt';
  if (type === 'treasury') return 'Treasury';
  return 'Split';
}
function boardTypeIcon(b) {
  const type = b.type || 'split';
  if (type === 'debt') return '🐉';
  if (type === 'treasury') return '🏦';
  return '📜';
}
function userKey(name, id) { return id || ('U-' + String(hashOf(String(name || 'user'))).slice(-4)); }
function adminUserId(b) {
  const adminChar = b.data?.admin?.characterId || b.characterIds?.[b.adminName] || '';
  return adminChar ? userKey(b.adminName || b.adminId, adminChar) : userKey(b.adminName || b.adminId || b.adminOwnerHash, b.adminId);
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
    chars,
    boards: [],
    adminGroups: [],
    cloud: true
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
      const key = userKey(name, charId);
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
    const b = g.boards[0];
    const key = b ? adminUserId(b) : userKey(g.adminName, g.adminId);
    const u = mergeUserRecord(map, { userId: key, name: g.adminName || g.adminId || 'Admin', chars: [], boards: [], adminGroups: [] });
    if (!u.adminGroups.some(x => x.key === g.key)) u.adminGroups.push(g);
  });
  return [...map.values()].map(u => {
    const local = lifecycle[u.userId] || lifecycle[u.uid] || {};
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
function userById(id) { return userRecords().find(u => u.userId === id); }
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
function fmtMoney(v) { return '฿' + Math.round(Number(v || 0)).toLocaleString('th-TH'); }
function userRenown(u) { return u.chars.reduce((sum, c) => sum + Number(c.xp || 0), 0) + u.adminGroups.length * 800; }
function userLevel(u) { return profileLevelFromRenown(userRenown(u)).lvl; }
function idChip(kind, label, id = label, extra = '') {
  const safeKind = kind === 'debt' ? 'debt' : kind;
  const on = kind === 'char' ? '' : ` onclick="openDetail(${q(kind)},${q(id)})"`;
  const tag = kind === 'board' ? 'Board' : kind === 'admin' ? 'Admin' : kind === 'user' ? 'User' : 'Char';
  const protoKind = kind === 'board' ? 'k-board' : kind === 'admin' ? 'k-admin' : kind === 'user' ? 'k-user' : kind === 'char' ? 'k-char' : safeKind;
  return `<button type="button" class="id-chip idchip ${safeKind} ${protoKind}"${on}><span class="ic-ico">${tag}</span><span>${h(label || '-')}</span>${extra}</button>`;
}
function openDetail(kind, id) {
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
  tab = next;
  detail = null;
  query = '';
  render();
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
function supportAction(title, body) {
  showModal(title, `${body} · Logged to Audit Log (Phase 1 local message)`, [{ label: 'ปิด', primary: true }]);
}

function addBoard() {
  confirmAction('เพิ่ม Board ใหม่?', 'จะเพิ่ม draft board ใหม่ ยังไม่ publish จนกด Publish', () => {
    const id = 'new-' + uid().slice(-4);
    const type = ['split', 'debt', 'treasury'].includes(boardFilter) ? boardFilter : 'split';
    draft.boards.push(normalizeBoard(id, { boardType: type, tripName: 'New Board', participants: [], characterIds: {}, admin: { adminId: 'ADM-' + uid().slice(-6), adminName: '' } }));
    draft.boards[draft.boards.length - 1].created = true;
    dirty = true;
    render();
  });
}
function addUser(boardId) {
  const b = boardById(boardId);
  if (!b) return;
  inputAction('เพิ่ม User', `เพิ่ม User ใหม่ใน Board ${b.urlId}`, 'ชื่อ User', name => {
    if (!name || b.participants.includes(name)) return;
    b.participants.push(name);
    b.characterIds[name] = String(Math.floor(1000 + Math.random() * 9000));
    dirty = true;
    render();
  });
}
function deleteUser(boardId, name) {
  const b = boardById(boardId);
  if (!b) return;
  confirmAction('ลบ User?', `ลบ ${name} จาก ${b.urlId}`, () => {
    b.participants = b.participants.filter(x => x !== name);
    delete b.characterIds[name];
    dirty = true;
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

function diffBoards() {
  const changes = [];
  const pub = new Map(published.boards.map(b => [b.originalId, b]));
  draft.boards.forEach(b => {
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
  });
  return changes;
}
function validateDraft() {
  const ids = new Set();
  for (const b of draft.boards.filter(x => !x.deleted)) {
    if (!b.urlId) return 'Board URL ห้ามว่าง';
    if (ids.has(b.urlId)) return `Board URL ซ้ำ: ${b.urlId}`;
    ids.add(b.urlId);
  }
  return '';
}
function saveDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  dirty = true;
  showModal('Saved', 'บันทึก draft ลง localStorage แล้ว', [{ label: 'ปิด' }]);
  render();
}
function restoreDraft() {
  confirmAction('Restore?', 'ทิ้ง draft และโหลดเวอร์ชันล่าสุดที่ publish แล้ว', () => {
    localStorage.removeItem(DRAFT_KEY);
    draft = { boards: clone(published.boards) };
    dirty = false;
    render();
  });
}
async function publishDraft() {
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
      const batch = db.batch();
      draft.boards.forEach(b => {
        if (b.deleted) {
          batch.delete(db.collection('trips').doc(b.originalId));
          return;
        }
        const data = materializeBoard(b);
        if (b.originalId !== b.urlId && !b.created) batch.delete(db.collection('trips').doc(b.originalId));
        batch.set(db.collection('trips').doc(b.urlId), data, { merge: false });
      });
      batch.set(db.collection('adminRevisions').doc(uid()), revisionDoc(changes));
      await batch.commit();
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
  return { id: uid(), createdAt: Date.now(), author: 'Phase 1 Super Admin', changes };
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
function statCard(label, value, detail, ico = '◇', tone = 'flat') {
  return `<div class="stat stat-card"><div class="s-top"><div class="s-label">${h(label)}</div><div class="s-ico">${ico}</div></div><div class="s-val">${value}</div>${detail ? `<div class="s-delta ${tone}">${detail}</div>` : ''}</div>`;
}
function searchBox(placeholder) {
  return `<div class="search"><span class="s-ico">⌕</span><input placeholder="${h(placeholder)}" value="${h(query)}" oninput="query=this.value;render()"></div>`;
}
function seg(name, value, items) {
  return `<div class="seg">${items.map(([key, label]) => `<button type="button" class="${value === key ? 'on' : ''}" onclick="${name}='${key}';render()">${h(label)}</button>`).join('')}</div>`;
}
function editInput(value, oninput, opts = {}) {
  const type = opts.type || 'text';
  const cls = opts.small ? ' edit-control small' : ' edit-control';
  const placeholder = opts.placeholder ? ` placeholder="${h(opts.placeholder)}"` : '';
  const max = opts.max ? ` maxlength="${opts.max}"` : '';
  return `<div class="field inline-field"><input class="${cls}" type="${type}" value="${h(value)}"${placeholder}${max} oninput="${oninput}"></div>`;
}
function formField(label, control, hint = '') {
  return `<div class="field"><label>${h(label)}</label>${control}${hint ? `<div class="hint">${h(hint)}</div>` : ''}</div>`;
}
function table(headers, rows, cls = '') {
  return `<div class="tbl-wrap"><table class="tbl ${cls}"><thead><tr>${headers.map(x => `<th>${h(x)}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}" class="muted">No records</td></tr>`}</tbody></table></div>`;
}
function quickOpen(items, kind, labelFn) {
  const buttons = items.slice(0, 4).map(item => `<button class="btn btn-ghost sm" onclick="openDetail('${kind}',${q(item.key || item.originalId || item.userId)})">Detail <span class="muted">${h(labelFn(item))}</span></button>`).join('');
  return buttons ? `<div class="quick-open wrap-chips">${buttons}</div>` : '';
}
function modBadge(type) {
  const t = type || 'split';
  return `<span class="badge mod-${t}">${boardTypeIcon({ type:t })} ${boardTypeLabel({ type:t })}</span>`;
}
function statusBadge(label, cls = 'active') {
  return `<span class="badge st-${cls}">${h(label)}</span>`;
}
function statusForBoard(b) { return b.deleted ? 'deleted' : b.data?.status || (b.deleted ? 'archived' : 'active'); }
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
function levelBadge(level) {
  return `<span class="lvl-badge">LV ${h(level || 1)}</span>`;
}
function tabs(name, value, items) {
  return `<div class="tabs">${items.map(item => `<button type="button" class="tab ${value === item.key ? 'on' : ''}" onclick="${name}='${item.key}';render()">${h(item.label)}${item.count != null ? `<span class="tcount">${item.count}</span>` : ''}</button>`).join('')}</div>`;
}
function boardVersions(b) {
  const revisionRows = (published.revisions || [])
    .filter(rev => (rev.changes || []).some(c => String(c.detail || '').includes(b.originalId) || String(c.detail || '').includes(b.urlId)))
    .slice(0, 3)
    .map((rev, i) => ({
      v: `v${Math.max(1, (published.revisions || []).length - i)}`,
      at: rev.createdAt || Date.now(),
      by: rev.author || 'Super Admin',
      current: false,
      note: `${(rev.changes || []).length} changes`
    }));
  return [
    { v: 'current', at: b.data?.updatedAt || Date.now(), by: b.adminName || 'Super Admin', current: true, note: 'Current state' },
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
  if (!drafts.length && !publishedRows.length) {
    return activeBoards().slice(0, 8).map(b => ({
      id: `board-${b.originalId}`,
      ts: b.data?.updatedAt || Date.now(),
      actor: b.adminName || 'Super Admin',
      scope: 'board',
      action: `${b.tripName} active snapshot`,
      target: b.urlId
    }));
  }
  return [...drafts, ...publishedRows].sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0));
}
function renderDashboard() {
  const boards = activeBoards();
  const split = boards.filter(b => (b.type || 'split') === 'split').length;
  const debt = boards.filter(b => (b.type || 'split') === 'debt').length;
  const treasury = boards.filter(b => (b.type || 'split') === 'treasury').length;
  const records = userRecords();
  const totals = boards.reduce((acc, b) => {
    const st = boardStats(b);
    acc.spend += st.spend;
    acc.balance += st.balance;
    acc.overdue += st.overdue;
    return acc;
  }, { spend: 0, balance: 0, overdue: 0 });
  const attention = boards.filter(b => !b.adminId || !b.adminName || !b.urlId).slice(0, 5);
  const recent = diffBoards().slice(0, 6);
  const kpis = `<div class="grid g-4 mt16">
    ${statCard('Boards', boards.length, `${split} Split · ${debt} Debt · ${treasury} Treasury`, '🗂️', 'flat')}
    ${statCard('Users / Characters', records.length, `${users().length} board links`, '👤', 'flat')}
    ${statCard('Debt Watch', totals.overdue, `${fmtMoney(totals.balance)} balance tracked`, '🐉', totals.overdue ? 'down' : 'flat')}
    ${statCard('Unpublished Changes', diffBoards().length, dirty ? 'local draft active' : 'published snapshot', '🧾', dirty ? 'up' : 'flat')}
  </div>`;
  const quick = `<div class="log-list">
    <div class="log-item"><div class="log-ico add">＋</div><div class="log-body"><div class="log-text">Create a new board draft</div><div class="log-meta">Not published until Publish</div></div><div class="log-actions"><button class="btn btn-primary sm" onclick="addBoard()">New board</button></div></div>
    <div class="log-item"><div class="log-ico edit">👤</div><div class="log-body"><div class="log-text">Invite / add user</div><div class="log-meta">Create character links inside a board</div></div><div class="log-actions"><button class="btn btn-ghost sm" onclick="selectTab('users')">Open</button></div></div>
    <div class="log-item"><div class="log-ico slay">🧾</div><div class="log-body"><div class="log-text">Version control</div><div class="log-meta">${diffBoards().length} local changes</div></div><div class="log-actions"><button class="btn btn-ghost sm" onclick="selectTab('revisions')">Open</button></div></div>
  </div>`;
  const feed = recent.length ? `<div class="log-list">${recent.map(c => `<div class="log-item"><div class="log-ico ${String(c.action).toLowerCase().slice(0,3) === 'add' ? 'add' : 'edit'}">✦</div><div class="log-body"><div class="log-text"><b>${h(c.area)}</b> ${statusBadge(c.action, 'active')}</div><div class="log-meta">${h(c.detail)}</div></div></div>`).join('')}</div>` : '<div class="empty"><div class="e-ico">🧾</div><div class="e-t">No local draft changes yet</div><div class="e-d">Edits appear here before publishing.</div></div>';
  const needs = attention.length ? `<div class="log-list">${attention.map(b => `<div class="log-item"><div class="log-ico fire">!</div><div class="log-body"><div class="log-text">${idChip('board', b.urlId, b.originalId)}</div><div class="log-meta">${!b.adminId ? 'Missing admin ID' : !b.adminName ? 'Missing admin nickname' : 'Missing URL'}</div></div><div class="log-actions"><button class="btn btn-ghost sm" onclick="openDetail('board',${q(b.originalId)})">Open</button></div></div>`).join('')}</div>` : '<div class="empty"><div class="e-ico">✓</div><div class="e-t">No flagged boards</div><div class="e-d">Required admin metadata is present.</div></div>';
  const command = dashMode === 'b'
    ? `<div class="grid dashboard-grid">${card('Needs Attention', needs)}${card('Quick Actions', quick)}${card('Recent Activity', feed, '', 'wide')}</div>${kpis}`
    : `${kpis}<div class="grid dashboard-grid mt16">${card('Recent Activity', feed, '', 'wide')}${card('Needs Attention', needs)}${card('Quick Actions', quick)}</div>`;
  return `${pageHead('Dashboard', 'Super Admin command center', seg('dashMode', dashMode, [['a','A Cards'], ['b','B Command']]))}${command}`;
}
function renderRelationshipMap() {
  const u = userRecords().find(x => x.adminGroups.length) || userRecords()[0];
  if (!u) return `${pageHead('Relationship Map', 'User → Character / Admin ID → Board')} ${card('Relationship Map', '<div class="empty"><div class="e-t">ยังไม่มี user</div></div>')}`;
  const adminCards = u.adminGroups.map(g => `<div class="rel-node admin" style="border-color:#c9d9f1;background:#f1f6fc">
    <div class="rn-top">🛡️ Admin IDs</div>
    <div class="rn-sub">${idChip('admin', g.adminId || '-', g.key)} ${h(g.adminName || '')}</div>
  </div>`).join('') || `<div class="rel-node admin" style="border-color:#c9d9f1;background:#f1f6fc"><div class="rn-top">🛡️ Admin IDs</div><div class="rn-sub muted">Not an admin</div></div>`;
  const chars = u.chars.map(c => `<div class="rel-node char">
    <div class="rn-top">⚔️ ${h(c.name)} ${idChip('char', c.id || '-', c.id)}</div>
    <div class="rn-sub">${h(c.className)} · ${levelBadge(characterLevelFromXp(c.xp).lvl)} · ${Number(c.xp || 0).toLocaleString()} XP</div>
    <div class="rn-sub" style="margin-top:5px">plays in: ${c.boards.map(bid => {
      const b = boardById(bid);
      return b ? idChip('board', b.urlId, b.originalId) : '';
    }).join(' ') || '<span class="muted">—</span>'}</div>
  </div>`).join('');
  const boards = [...new Set([...u.boards, ...u.adminGroups.flatMap(g => g.boards)])].map(b => `<div class="rel-node board">
    <div class="rn-top">${boardTypeIcon(b)} ${h(b.tripName)}</div>
    <div class="rn-sub">${idChip('board', b.urlId, b.originalId)} · owns: ${idChip('admin', b.adminId || '-', b.adminOwnerHash || b.adminId)}</div>
  </div>`).join('');
  const map = `<div class="relmap">
    <div class="rel-col"><div class="rel-col-title">Global User ID</div>
      <div class="rel-node user"><div class="rn-top">👤 ${h(u.name)} ${idChip('user', u.userId, u.userId)}</div><div class="rn-sub">${u.chars.length} active character · ${u.adminGroups.length} admin roles</div></div>
      ${adminCards}
    </div>
    <div class="rel-col"><div class="rel-col-title">Character</div>${chars || '<div class="rel-node char"><div class="rn-sub muted">No character yet</div></div>'}</div>
    <div class="rel-col"><div class="rel-col-title">Boards</div>${boards || '<div class="rel-node board"><div class="rn-sub muted">No boards yet</div></div>'}</div>
  </div>
  <div class="rel-legend">
    <span><span class="rar-dot" style="background:#7c5cd0"></span> Global User ID</span>
    <span><span class="rar-dot" style="background:#d99a1f"></span> one active Character per user in the current auth loop</span>
    <span><span class="rar-dot" style="background:#9a8c72"></span> Admin IDs can own many Boards</span>
  </div>`;
  const rules = `<ul class="model-rules">
    <li>One User ID works across Split Expenses, Debt Dragon, Treasury, and Character Profile.</li>
    <li>Current player/auth canon: one User ID has one active Character. Admin can edit that character's name/class/XP.</li>
    <li>Character XP uses PointyLogic.levelFromXp(); overall Renown uses PointyLogic.levelFromRenown().</li>
    <li>A user can be a board admin through one or more Admin IDs, and one Admin ID can own multiple boards.</li>
    <li>Compare Prices is a tool, not a Board.</li>
  </ul>`;
  return `${pageHead('Relationship Map', 'User → Character / Admin ID → Board links')}${card('Relationship Map', map)}<div class="mt16">${flatCard(`<p class="section-label">📐 Model rules</p>${rules}`)}</div>`;
}
function boardRows() {
  return filtered(activeBoards().filter(b => boardFilter === 'all' || (b.type || 'split') === boardFilter), ['urlId', 'tripName', 'adminId', 'adminName']).map(b => {
    const st = boardStats(b);
    return `<tr>
      <td>${editInput(b.urlId, `updateBoard(${q(b.originalId)},{urlId:this.value.trim()})`, { small:true })}</td>
      <td>${modBadge(b.type)}</td>
      <td>${editInput(b.tripName, `updateBoard(${q(b.originalId)},{tripName:this.value})`)}</td>
      <td>${editInput(b.adminId, `updateBoard(${q(b.originalId)},{adminId:this.value})`, { small:true })}</td>
      <td>${editInput(b.adminName, `updateBoard(${q(b.originalId)},{adminName:this.value})`)}</td>
      <td>${editInput('', `updateBoard(${q(b.originalId)},{newPassword:this.value})`, { type:'password', placeholder:'ตั้งรหัสใหม่' })}</td>
      <td><span class="pill">${b.participants.length}</span> <span class="muted">${b.type === 'debt' ? `${st.dragons} dragons` : `${st.expenses} quests`}</span></td>
      <td class="td-actions"><button class="btn btn-ghost sm" onclick="openDetail('board',${q(b.originalId)})">Detail</button><button class="btn btn-ghost sm" onclick="addUser(${q(b.originalId)})">+ User</button><button class="btn btn-danger sm" onclick="deleteBoard(${q(b.originalId)})">ลบ</button></td>
    </tr>`;
  }).join('');
}
function renderBoards() {
  if (detail?.kind === 'board') return renderBoardDetail(detail.id);
  const toolbar = `<div class="toolbar">${searchBox('ค้นหา board/admin')}${seg('boardFilter', boardFilter, [['all','all'],['split','split'],['debt','debt'],['treasury','treasury']])}<button class="btn btn-primary" onclick="addBoard()">+ เพิ่ม Board</button></div>`;
  const visibleBoards = activeBoards().filter(b => boardFilter === 'all' || (b.type || 'split') === boardFilter);
  return `${pageHead('Boards', 'All created Split, Debt, and Treasury boards')}${toolbar}${quickOpen(visibleBoards, 'board', b => b.urlId)}${card('Boards', table(['URL','Type','ชื่อ Board','Admin ID','ชื่อเล่น Admin','Reset Password','Members',''], boardRows()))}`;
}
function renderBoardDetail(id) {
  const b = boardById(id);
  if (!b) return card('Board not found', '<button class="btn btn-ghost" onclick="closeDetail()">Back</button>');
  const st = boardStats(b);
  const ownerUser = adminUserId(b);
  const versions = boardVersions(b);
  const adminForm = `${formField('URL', `<input value="${h(b.urlId)}" oninput="updateBoard(${q(b.originalId)},{urlId:this.value.trim()})">`)}${formField('Name', `<input value="${h(b.tripName)}" oninput="updateBoard(${q(b.originalId)},{tripName:this.value})">`)}${formField('Admin ID', `<input value="${h(b.adminId)}" oninput="updateBoard(${q(b.originalId)},{adminId:this.value})">`)}${formField('Nickname', `<input value="${h(b.adminName)}" oninput="updateBoard(${q(b.originalId)},{adminName:this.value})">`)}${formField('Password reset', `<input type="password" placeholder="ตั้งรหัสใหม่" oninput="updateBoard(${q(b.originalId)},{newPassword:this.value})">`)}`;
  const overview = `<div class="grid g-2">
    ${card('📋 Board info', `<div class="kv">
      <div class="kv-row"><span class="k">Board ID</span><span class="v mono">${h(b.urlId)}</span></div>
      <div class="kv-row"><span class="k">Type</span><span class="v">${modBadge(b.type)}</span></div>
      <div class="kv-row"><span class="k">Status</span><span class="v">${statusBadgeFor(statusForBoard(b))}</span></div>
      <div class="kv-row"><span class="k">Owner admin</span><span class="v">${idChip('admin', b.adminId || '-', b.adminOwnerHash || b.adminId)}</span></div>
      <div class="kv-row"><span class="k">Owner user</span><span class="v">${idChip('user', ownerUser, ownerUser)}</span></div>
      <div class="kv-row"><span class="k">Last active</span><span class="v">${h(b.data?.updatedAt ? new Date(b.data.updatedAt).toLocaleString() : '—')}</span></div>
    </div>`)}
    ${card('📈 Stats', `<div class="grid g-2" style="gap:12px">
      ${b.type === 'debt'
        ? `${statCard('Dragons', st.dragons, 'tracked debts', '🐉')}${statCard('Balance', fmtMoney(st.balance), 'outstanding', '💳')}${statCard('Overdue', st.overdue, 'needs attention', '🔥', st.overdue ? 'down' : 'flat')}${statCard('Party size', b.participants.length, 'slayers', '👥')}`
        : b.type === 'treasury'
        ? `${statCard('Monthly income', fmtMoney(b.data?.treasury?.income || 0), 'treasury', '💰')}${statCard('Spent', fmtMoney(st.spend), 'logged', '🗡️')}${statCard('Party size', b.participants.length, 'owner party', '👥')}${statCard('Quests', st.expenses, 'entries', '📜')}`
        : `${statCard('Quests', st.expenses, 'ledger rows', '📜')}${statCard('Total spend', fmtMoney(st.spend), 'party spend', '💰')}${statCard('Party size', b.participants.length, 'heroes', '👥')}${statCard('Unsettled', fmtMoney(0), 'draft proxy', '💸')}`}
    </div><div class="mt16"><div class="spark">${[22, 40, 28, 48, 36, 58, 44].map(v => `<i style="height:${v}%"></i>`).join('')}</div></div>`)}
    ${card('Owner / Admin', adminForm, '', 'wide')}
  </div>`;
  const members = b.participants.map(name => {
    const charId = b.characterIds[name] || '';
    const c = charById(charId) || { className: b.data?.heroClasses?.[name] || 'hero', xp: 0 };
    const uId = userKey(name, charId);
    const role = name === b.adminName || charId === b.data?.admin?.characterId ? 'Owner' : b.type === 'debt' ? 'Slayer' : 'Hero';
    return `<tr><td><div class="flex gap8" style="align-items:center"><span style="font-size:18px">⚔️</span><span class="cell-strong">${h(name)}</span> ${idChip('char', charId || '-', charId)}</div></td><td>${idChip('user', uId, uId)}</td><td>${h(c.className)}</td><td>${levelBadge(characterLevelFromXp(c.xp).lvl)}</td><td><span class="badge ${role === 'Owner' ? 'role' : 'outline'}">${role === 'Owner' ? '👑 ' : ''}${role}</span></td><td>${editInput(charId, `updateUser(${q(b.originalId)},${q(name)},this.value)`, { small:true, max:4 })}</td><td class="td-actions"><button class="btn btn-danger sm" onclick="deleteUser(${q(b.originalId)},${q(name)})">ลบ</button></td></tr>`;
  }).join('');
  const membersPanel = card('👥 Members', `${table(['Character','User ID','Class','Level','Role','Edit ID',''], members)}<button class="btn btn-ghost mt12" onclick="addUser(${q(b.originalId)})">+ Add user</button>`);
  const changeRows = diffBoards().filter(c => c.detail.includes(b.originalId) || c.detail.includes(b.urlId) || c.detail.includes(b.tripName)).map(c => `<div class="log-item"><div class="log-ico edit">✏️</div><div class="log-body"><div class="log-text"><b>${h(c.area)}</b> ${statusBadge(c.action, 'active')}</div><div class="log-meta">${h(c.detail)}</div></div><div class="log-actions"><button class="btn tiny btn-ghost" onclick="restoreBoard(${q(b.originalId)})">↩ Revert</button></div></div>`).join('') || '<div class="empty"><div class="e-t">No draft changes for this board</div></div>';
  const logPanel = card('📜 Change Log', `<div class="log-list">${changeRows}</div>`);
  const versionRows = versions.map(v => `<div class="log-item"><div class="log-ico edit">${v.current ? '⭐' : '🕰️'}</div><div class="log-body"><div class="log-text"><b class="mono">${h(v.v)}</b>${v.current ? ` <span class="badge st-active">Current</span>` : ''} · ${h(v.note)}</div><div class="log-meta"><span>${h(typeof v.at === 'number' ? new Date(v.at).toLocaleString() : v.at)}</span><span class="dot-sep">·</span><span>by ${h(v.by)}</span></div></div><div class="log-actions">${!v.current ? `<button class="btn tiny btn-ghost" onclick="restoreBoard(${q(b.originalId)})">↺ Restore</button>` : ''}</div></div>`).join('');
  const versionsPanel = card('🕰️ Versions', `<div class="log-list">${versionRows}</div>`);
  const dangerPanel = `<div class="grid" style="gap:14px">
    <div class="phase-note" style="margin:0"><span class="pn-ico">🔒</span><span>In-app board admins can only archive a board. Permanent delete is a Super Admin action here.</span></div>
    <div class="danger-zone between"><div><h4>♻️ Reset board data</h4><div class="cell-sub">Clears quests/dragons but keeps members and admin metadata.</div></div><button class="btn btn-danger" onclick="restoreBoard(${q(b.originalId)})">Reset board data</button></div>
    <div class="danger-zone between"><div><h4>📦 Archive board</h4><div class="cell-sub">Hide from use while keeping data recoverable.</div></div><button class="btn btn-gold" onclick="deleteBoard(${q(b.originalId)})">Archive board</button></div>
    <div class="danger-zone between" style="border-color:var(--danger)"><div><h4>🗑️ Delete board</h4><div class="cell-sub">Delete the board and all data after Publish.</div></div><button class="btn btn-danger" onclick="deleteBoard(${q(b.originalId)})">Delete board</button></div>
  </div>`;
  const tabbed = `${tabs('boardDetailTab', boardDetailTab, [
    { key:'overview', label:'Overview' },
    { key:'members', label:'Members', count:b.participants.length },
    { key:'log', label:'Change Log', count:diffBoards().length },
    { key:'versions', label:'Versions', count:versions.length },
    { key:'danger', label:'Danger zone' }
  ])}${boardDetailTab === 'overview' ? overview : boardDetailTab === 'members' ? membersPanel : boardDetailTab === 'log' ? logPanel : boardDetailTab === 'versions' ? versionsPanel : dangerPanel}`;
  const scroll = `<div class="grid" style="gap:18px">${overview}${membersPanel}${logPanel}${versionsPanel}${dangerPanel}</div>`;
  return `<div class="crumbs"><button onclick="closeDetail('boards')">Boards</button><span class="sep">/</span><span class="cur">${h(b.urlId)}</span></div>${pageHead(b.tripName, `<span>${idChip('board', b.urlId, b.originalId)} ${modBadge(b.type)} ${statusBadgeFor(statusForBoard(b))}</span>`, `<span class="count-note">Layout</span>${seg('boardDetailView', boardDetailView, [['tabbed','Tabs'],['scroll','Scroll']])}<button class="btn btn-gold" onclick="showExportModal(${q(b.originalId)})">📤 Export data</button>`)}${boardDetailView === 'tabbed' ? tabbed : scroll}`;
}
function renderAdmins() {
  if (detail?.kind === 'admin') return renderAdminDetail(detail.id);
  const groups = filtered(adminGroups(), ['adminId', 'adminName', 'key']);
  const rows = groups.map(g => `
    <tr>
      <td>${editInput(g.adminId, `updateAdminGroup(${q(g.key)},{adminId:this.value})`, { small:true })}</td>
      <td>${editInput(g.adminName, `updateAdminGroup(${q(g.key)},{adminName:this.value})`)}</td>
      <td>${idChip('user', g.boards[0] ? adminUserId(g.boards[0]) : userKey(g.adminName, g.adminId), g.boards[0] ? adminUserId(g.boards[0]) : userKey(g.adminName, g.adminId))}</td>
      <td class="muted mono">${h(g.key)}</td>
      <td>${g.boards.map(b => idChip('board', b.urlId, b.originalId)).join(' ')}</td>
      <td class="td-actions"><button class="btn btn-ghost sm" onclick="openDetail('admin',${q(g.key)})">Detail</button></td>
    </tr>`).join('');
  return `${pageHead('Board Admins', 'Board Admin IDs may own multiple boards', `<button class="btn btn-ghost" onclick="supportAction('Invite Admin','เลือก user แล้วผูก Admin ID เข้ากับ board')">Invite admin</button>`)}<div class="toolbar">${searchBox('ค้นหา admin')}</div>${quickOpen(groups, 'admin', g => g.adminId || '-')}${card('Board Admins', table(['ID','ชื่อเล่น','User','Owner Hash','Boards',''], rows))}`;
}
function renderAdminDetail(key) {
  const g = adminGroupByKey(key);
  if (!g) return card('Admin not found', '<button class="btn btn-ghost" onclick="closeDetail()">Back</button>');
  const first = g.boards[0];
  const userId = first ? adminUserId(first) : userKey(g.adminName, g.adminId);
  const identity = `${flatCard(`<div class="profile-card"><div class="profile-ava">🛡️</div><div class="profile-name">${h(g.adminName || g.adminId || 'Admin')}</div><div class="profile-id">${idChip('admin', g.adminId || '-', g.key)}</div><div class="mt12">${idChip('user', userId, userId)}</div></div>`)}
    ${card('Identity', `${formField('Admin ID', `<input value="${h(g.adminId)}" oninput="updateAdminGroup(${q(g.key)},{adminId:this.value})">`)}${formField('Nickname', `<input value="${h(g.adminName)}" oninput="updateAdminGroup(${q(g.key)},{adminName:this.value})">`)}<div class="kv"><div class="kv-row"><span class="k">Owner hash</span><span class="v mono">${h(g.key)}</span></div></div>`)}`;
  const owned = g.boards.map(b => `<tr><td>${idChip('board', b.urlId, b.originalId)}</td><td class="cell-strong">${h(b.tripName)}</td><td>${modBadge(b.type)}</td><td class="td-actions"><button class="btn btn-ghost sm" onclick="openDetail('board',${q(b.originalId)})">Open</button></td></tr>`).join('');
  return `<div class="crumbs"><button onclick="closeDetail('admins')">Admins</button><span class="sep">/</span><span class="cur">${h(g.adminId || key)}</span></div>${pageHead('Admin Detail', 'Admin identity and board ownership')}<div class="detail-grid"><div>${identity}</div><div>${card('Owned Boards', table(['Board','Name','Type',''], owned))}</div></div>`;
}
function renderUsers() {
  if (detail?.kind === 'user') return renderUserDetail(detail.id);
  const records = userRecords().filter(u => !query || `${u.name} ${u.username || ''} ${u.userId}`.toLowerCase().includes(query.toLowerCase()));
  const rows = records.map(u => `
    <tr>
      <td>${idChip('user', u.userId, u.userId)}</td>
      <td><div class="cell-strong">${h(u.name)}</div>${u.username ? `<div class="cell-sub">@${h(u.username)}</div>` : ''}</td>
      <td><div class="wrap-chips">${u.chars.map(c => idChip('char', c.id || '-', c.id, `<span>${h(c.name)}</span>`)).join(' ') || '<span class="muted cell-sub">—</span>'}</div></td>
      <td class="mono">${u.boards.length}</td>
      <td>${levelBadge(userLevel(u))} <span class="cell-sub mono">${userRenown(u).toLocaleString()}</span></td>
      <td>${u.adminGroups.length ? `<span class="badge role">🛡️ ${u.adminGroups.length} Admin roles</span>` : '<span class="muted cell-sub">—</span>'}</td>
      <td>${statusBadgeFor(u.status)}</td>
      <td class="td-actions"><a class="btn btn-ghost sm" href="${h(characterProfileLink(u.chars[0]?.id || ''))}">Profile</a><button class="btn btn-ghost sm" onclick="openDetail('user',${q(u.userId)})">Detail</button></td>
    </tr>`).join('');
  return `${pageHead('Users', `${records.length} global users · one active character per User ID`, `<button class="btn btn-primary" onclick="showAddUserModal()">+ Add user</button>`)}<div class="toolbar">${searchBox('Search user / character')}</div>${quickOpen(records, 'user', u => u.userId)}${card('Users', table(['User ID','Display name','Character','Boards','Total renown','Admin role','Status',''], rows))}`;
}
function renderUserDetail(id) {
  const u = userById(id);
  if (!u) return card('User not found', '<button class="btn btn-ghost" onclick="closeDetail()">Back</button>');
  const renown = userRenown(u);
  const deleteReady = TEST_MODE || adminBackendStatus.adminDeleteConfigured;
  const deleteDisabled = deleteReady ? '' : 'disabled';
  const deleteHint = deleteReady
    ? 'Requests backend deletion of Auth user, user mapping, character ownership, and username record.'
    : adminDeleteBackendNote();
  const profile = flatCard(`<div class="profile-card"><div class="profile-ava">👤</div><div class="profile-name">${h(u.name)}</div>${u.username ? `<div class="profile-id">@${h(u.username)}</div>` : ''}<div class="profile-id">User ID · <span class="mono">${h(u.userId)}</span></div><div class="mt12 flex" style="justify-content:center;gap:8px">${levelBadge(userLevel(u))}${statusBadgeFor(u.status)}</div><hr class="hr"><div class="kv">
    <div class="kv-row"><span class="k">Overall level (Renown)</span><span class="v"><b>LV ${userLevel(u)}</b> · ${renown.toLocaleString()}</span></div>
    <div class="kv-row"><span class="k">Character</span><span class="v">${u.chars.length}</span></div>
    <div class="kv-row"><span class="k">Boards</span><span class="v">${u.boards.length}</span></div>
    <div class="kv-row"><span class="k">Status</span><span class="v">${statusBadgeFor(u.status)}</span></div>
    <div class="kv-row"><span class="k">Is admin</span><span class="v">${u.adminGroups.length ? `<span class="badge role">🛡️ ${u.adminGroups.length}</span>` : 'Not an admin'}</span></div>
  </div>`);
  const activitySpark = flatCard(`<p class="section-label">📊 14-day activity</p><div class="spark">${[18, 52, 38, 64, 42, 70, 54].map(v => `<i style="height:${v}%"></i>`).join('')}</div>`);
  const chars = u.chars.map(c => `<div class="card flat card-pad" style="padding:15px 16px">
    <div class="between"><div class="flex gap12" style="align-items:center"><div class="profile-ava" style="width:48px;height:48px;font-size:24px;border-radius:12px;margin:0">⚔️</div><div><div style="font-weight:700;font-size:15px">${h(c.name)} ${idChip('char', c.id || '-', c.id)}</div><div class="cell-sub mt8" style="margin-top:3px">Class: <b>${h(c.className)}</b> · ${levelBadge(characterLevelFromXp(c.xp).lvl)} · ${Number(c.xp || 0).toLocaleString()} XP</div></div></div><button class="btn sm btn-ghost" onclick="showEditCharModal(${q(u.userId)},${q(c.id)})">Edit</button></div>
    <div class="xpbar mt12"><span style="width:${Math.min(100, characterLevelFromXp(c.xp).pct || 0)}%"></span></div>
    <div class="mt12"><div class="section-label" style="margin:0 0 7px">🔗 Appears in</div><div class="wrap-chips">${c.boards.map(bid => { const b = boardById(bid); return b ? `<button type="button" class="idchip k-board" onclick="openDetail('board',${q(b.originalId)})"><span class="ic-ico">${boardTypeIcon(b)}</span>${h(b.tripName)} · ${h(b.urlId)}</button>` : ''; }).join('') || '<span class="muted cell-sub">No boards</span>'}</div></div>
  </div>`).join('');
  const boards = u.boards.map(b => `<tr class="clickable" onclick="openDetail('board',${q(b.originalId)})"><td>${idChip('board', b.urlId, b.originalId)}</td><td class="cell-strong">${h(b.tripName)}</td><td>${modBadge(b.type)}</td><td>${idChip('char', u.chars.find(c => c.boards.includes(b.originalId))?.id || '-', u.chars.find(c => c.boards.includes(b.originalId))?.id || '-')}</td><td class="td-right"><button class="btn sm btn-ghost">Open →</button></td></tr>`).join('');
  const adminRows = u.adminGroups.map(g => `<div class="card flat card-pad mt12" style="margin-top:0;margin-bottom:12px"><div class="between"><div class="flex gap12" style="align-items:center"><div class="profile-ava" style="width:44px;height:44px;font-size:20px;border-radius:11px;margin:0;background:#e7eef9">🛡️</div><div><div style="font-weight:700;font-size:15px">${h(g.adminName || g.adminId || 'Admin')} ${idChip('admin', g.adminId || '-', g.key)}</div><div class="cell-sub" style="margin-top:3px">Owner hash: <span class="mono">${h(g.key)}</span></div></div></div><button class="btn sm btn-ghost" onclick="openDetail('admin',${q(g.key)})">Open →</button></div><div class="mt12"><div class="section-label" style="margin:0 0 7px">🗂️ Boards owned</div><div class="wrap-chips">${g.boards.map(b => idChip('board', b.urlId, b.originalId)).join(' ')}</div></div></div>`).join('') || '<div class="empty"><div class="e-t">Not an admin</div><div class="e-d">This user does not administer any board.</div></div>';
  const lifecyclePanel = card('🧯 Account lifecycle', `<div class="card-pad" style="padding:0">
    <div class="phase-note" style="margin-top:0"><span class="pn-ico">🛡️</span><span>Archive/deactivate keeps account data recoverable. Permanent delete must go through the privileged backend function and never through Firebase client Auth.</span></div>
    <div class="phase-note" style="margin-top:12px"><span class="pn-ico">${deleteReady ? '✅' : '⚠️'}</span><span>${h(adminDeleteBackendNote())}</span></div>
    <div class="kv mt12">
      <div class="kv-row"><span class="k">Current status</span><span class="v">${statusBadgeFor(u.status)}</span></div>
      <div class="kv-row"><span class="k">Firebase UID</span><span class="v mono">${h(u.uid || 'not linked')}</span></div>
      <div class="kv-row"><span class="k">Username</span><span class="v">${u.username ? '@' + h(u.username) : '-'}</span></div>
    </div>
    <div class="danger-zone between mt16" style="border-color:var(--border-strong);background:var(--panel-in)"><div><h4 style="color:var(--ink)">📦 Archive user</h4><div class="cell-sub">Soft-retain the account and mark it as out of active circulation.</div></div><button class="btn btn-gold" onclick="showUserLifecycleModal(${q(u.userId)},'archived')">Archive</button></div>
    <div class="danger-zone between mt12"><div><h4>⛔ Deactivate login</h4><div class="cell-sub">Mark the account unusable; player login guard blocks deactivated users.</div></div><button class="btn btn-danger" onclick="showUserLifecycleModal(${q(u.userId)},'deactivated')">Deactivate</button></div>
    ${normalizeUserStatus(u.status) === 'active' ? '' : `<div class="danger-zone between mt12" style="border-color:var(--green);background:#f0faf3"><div><h4 style="color:var(--green)">✅ Reactivate user</h4><div class="cell-sub">Move the user back to active status.</div></div><button class="btn btn-primary" onclick="showUserLifecycleModal(${q(u.userId)},'active')">Reactivate</button></div>`}
    <div class="danger-zone between mt12" style="border-color:var(--danger)"><div><h4>🗑️ Permanent delete request</h4><div class="cell-sub">${h(deleteHint)}</div></div><button class="btn btn-danger" onclick="showPermanentDeleteModal(${q(u.userId)})" ${deleteDisabled}>Request delete</button></div>
  </div>`);
  const activityRows = auditEntries().filter(a => a.actor === u.name || u.boards.some(b => a.target === b.urlId || a.target === b.originalId)).map(a => `<div class="log-item"><div class="log-ico">📌</div><div class="log-body"><div class="log-text">${h(a.action)}</div><div class="log-meta"><span>${new Date(a.ts).toLocaleString()}</span><span class="dot-sep">·</span><span class="mono">${h(a.target)}</span></div></div></div>`).join('') || '<div class="empty"><div class="e-t">No activity yet</div></div>';
  const body = userDetailTab === 'chars'
    ? card('🎭 Character', `<div class="card-pad" style="display:flex;flex-direction:column;gap:12px">${chars}</div>`)
    : userDetailTab === 'boards'
    ? card('🗂️ Boards', table(['Board','Name','Type','As character',''], boards))
    : userDetailTab === 'admin'
    ? card('🛡️ Admin roles', `<div class="card-pad">${adminRows}<button class="btn btn-ghost mt12" onclick="showInviteAdminModal(${q(u.userId)})">+ Invite admin</button></div>`)
    : userDetailTab === 'lifecycle'
    ? lifecyclePanel
    : card('📜 Activity', `<div class="card-pad" style="padding-top:4px;padding-bottom:8px"><div class="log-list">${activityRows}</div></div>`);
  return `<div class="crumbs"><button onclick="closeDetail('users')">Users</button><span class="sep">/</span><span class="cur">${h(u.name)}</span></div>${pageHead(u.name, 'User profile (one User ID)', `<button class="btn btn-ghost" onclick="showImpersonateModal(${q(u.userId)})">🎭 Impersonate user</button><button class="btn btn-ghost" onclick="showResetPwModal(${q(u.userId)})">🔑 Reset password</button><button class="btn btn-gold" onclick="showExportModal(${q(u.userId)})">📤 Export data</button><button class="btn btn-danger" onclick="userDetailTab='lifecycle';render()">🧯 Lifecycle</button>`)}<div class="detail-grid"><div>${profile}${activitySpark}</div><div>${tabs('userDetailTab', userDetailTab, [{key:'chars',label:'Character',count:u.chars.length},{key:'boards',label:'Boards',count:u.boards.length},{key:'admin',label:'Admin roles',count:u.adminGroups.length},{key:'activity',label:'Activity'},{key:'lifecycle',label:'Lifecycle'}])}${body}</div></div>`;
}
function renderAuditLog() {
  const scopeIco = { board:'🗂️', user:'👤', admin:'🛡️', system:'⚙️' };
  const rows = auditEntries()
    .filter(a => auditFilter === 'all' || a.scope === auditFilter)
    .filter(a => !query || `${a.actor} ${a.action} ${a.target}`.toLowerCase().includes(query.toLowerCase()));
  const body = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>When</th><th>Actor</th><th>Scope</th><th>Action</th><th>Target</th><th></th></tr></thead><tbody>${rows.map(a => `<tr><td class="cell-sub mono nowrap">${h(new Date(a.ts).toLocaleString())}</td><td class="cell-strong">${h(a.actor)}</td><td><span class="badge outline">${scopeIco[a.scope] || '•'} ${h(a.scope)}</span></td><td>${h(a.action)}</td><td>${a.scope === 'board' && a.target !== 'draft' ? idChip('board', a.target, a.target) : a.scope === 'user' ? idChip('user', a.target, a.target) : `<span class="mono cell-sub">${h(a.target)}</span>`}</td><td class="td-right">${a.scope !== 'system' ? '<button class="btn tiny btn-ghost">View diff</button>' : ''}</td></tr>`).join('')}</tbody></table></div>`;
  const filter = `${searchBox('Search audit')} ${seg('auditFilter', auditFilter, [['all','All types'],['board','Board'],['user','User'],['admin','Admin'],['system','System']])}`;
  return `${pageHead('Audit Log', 'Every change across the system, with actor and target')}${`<div class="toolbar">${filter}</div>`}${card('Audit Log', rows.length ? body : '<div class="empty"><div class="e-t">No audit entries yet</div></div>')}`;
}
function renderRevisions() {
  const revs = published.revisions || [];
  const current = diffBoards();
  const versionRows = [
    { v:'current', at:Date.now(), by:'Local Draft', current:true, note: current.length ? `${current.length} unpublished changes` : 'Published version' },
    ...revs.map((rev, i) => ({ v:`v${revs.length - i}`, at:rev.createdAt, by:rev.author || 'Super Admin', current:false, note:`${(rev.changes || []).length} changes`, rev }))
  ];
  const body = `<div class="log-list">${versionRows.map(v => `<div class="log-item"><div class="log-ico edit">${v.current ? '⭐' : '🕰️'}</div><div class="log-body"><div class="log-text"><b class="mono">${h(v.v)}</b>${v.current ? ' <span class="badge st-active">Published</span>' : ''} · ${h(v.note)}</div><div class="log-meta"><span>${h(v.at ? new Date(v.at).toLocaleString() : '—')}</span><span class="dot-sep">·</span><span>by ${h(v.by)}</span></div></div><div class="log-actions"><button class="btn tiny btn-ghost">View diff</button>${!v.current ? '<button class="btn tiny btn-ghost" onclick="restoreDraft()">↺ Restore</button>' : ''}</div></div>`).join('')}</div>`;
  const revDetails = revs.map(rev => `<details class="rev"><summary><span>${new Date(rev.createdAt).toLocaleString()} · ${(rev.changes || []).length} changes</span><span>${h(rev.author || '')}</span></summary><div class="rev-list">${(rev.changes || []).map(c => `<div class="log-item"><div class="log-ico edit">✎</div><div class="log-body"><div class="log-text"><b>${h(c.area)}</b> ${statusBadge(c.action, 'active')}</div><div class="log-meta">${h(c.detail)}</div></div></div>`).join('')}</div></details>`).join('');
  const actions = `<button class="btn btn-ghost" onclick="saveDraft()">💾 Save snapshot</button><button class="btn btn-primary" onclick="publishDraft()">🚀 Publish now${current.length ? ` (${current.length})` : ''}</button>`;
  return `${pageHead('Versions & Publishing', 'System-wide snapshots: save, restore, and publish', actions)}<div class="phase-note"><span class="pn-ico">🛡️</span><span>${h(TEST_MODE ? 'Test mode writes the draft to session/local storage for regression.' : 'Super Admin is Google-auth protected. Publish writes the current admin draft to storage.')}</span></div>${card('🕰️ System version history', body)}${revDetails ? `<div class="mt16">${card('Published revision details', revDetails)}</div>` : ''}`;
}
function renderSupportTools() {
  const cards = [
    ['impersonate','🎭','Impersonate user','Open the app in a user view (read-only).','Open user view','showImpersonateModal()','btn-ghost'],
    ['reset','🔑','Reset password','Set a temporary password for a user or admin.','Reset password','showResetPwModal()','btn-ghost'],
    ['export','📤','Export data','Download board or user data as JSON.','Export JSON','showExportModal()','btn-gold'],
    ['merge','🔗','Merge accounts','Merge duplicate users into one User ID.','Run','showMergeModal()','btn-ghost'],
  ];
  const toolCards = `<div class="grid g-2">${cards.map(c => `<div class="card card-pad"><div class="flex gap12" style="align-items:flex-start"><div class="s-ico" style="width:42px;height:42px;font-size:20px;background:var(--panel-2)">${c[1]}</div><div style="flex:1"><div style="font-family:var(--font-display);font-weight:600;font-size:16px">${c[2]}</div><div class="cell-sub mt8" style="margin-top:4px">${c[3]}</div><button class="btn ${c[6]} mt12" style="margin-top:14px" onclick="${c[5]}">${c[4]}</button></div></div></div>`).join('')}</div>`;
  const flows = `<div class="page-head-actions"><button class="btn btn-primary" onclick="addBoard()">New board</button><button class="btn btn-ghost" onclick="showInviteAdminModal()">Invite admin</button><button class="btn btn-ghost" onclick="showAddUserModal()">Add user</button></div>`;
  return `${pageHead('Support Tools', 'Tools for helping users; every action should be audit logged.')}${`<div class="phase-note"><span class="pn-ico">🛡️</span><span>Every action here is recorded in the Audit Log once wired to production security.</span></div>`}${toolCards}<div class="mt16">${card('Create / invite flows', flows)}</div>`;
}
function panel(title, body) { return card(title, body); }
function renderMain() {
  const body = tab === 'dashboard' ? renderDashboard() : tab === 'map' ? renderRelationshipMap() : tab === 'admins' ? renderAdmins() : tab === 'users' ? renderUsers() : tab === 'audit' ? renderAuditLog() : tab === 'revisions' ? renderRevisions() : tab === 'support' ? renderSupportTools() : renderBoards();
  const changes = diffBoards().length;
  const groups = [
    ['Overview', [['dashboard', 'Dashboard', '📊'], ['map', 'Relationship Map', '🕸️']]],
    ['Manage', [['boards', 'Boards', '🗂️'], ['users', 'Users', '👤'], ['admins', 'Board Admins', '🛡️']]],
    ['Ops', [['audit', 'Audit Log', '📜'], ['revisions', 'Version Control', '🧾'], ['support', 'Support Tools', '🧰']]]
  ];
  const nav = groups.map(([label, items]) => `
    <div class="nav-group-label">${label}</div>
    ${items.map(([key, text, ico]) => `<button class="nav-item ${tab === key ? 'active on' : ''}" onclick="selectTab('${key}')"><span class="ni-ico">${ico}</span><span>${text}</span>${key === 'revisions' && changes ? `<span class="ni-badge">${changes}</span>` : ''}</button>`).join('')}
  `).join('');
  document.getElementById('app').innerHTML = `<div class="app">
    <header class="topbar">
      <div class="tb-brand">
        <div class="tb-crest">⚔️</div>
        <div><div class="tb-title">Super Admin Portal</div><div class="tb-sub">Coin Quest Ledger · Board ↔ Admin ↔ User ↔ Character</div></div>
      </div>
      <div class="tb-right">
        <span class="env-pill"><span class="dot"></span>${TEST_MODE ? 'TEST MODE' : 'GOOGLE AUTH'}</span>
        <span id="draft-badge" class="env-pill">${dirty ? 'Draft changed locally' : 'Published version'}</span>
        <button class="btn btn-ghost sm" onclick="saveDraft()">Save</button>
        <button class="btn btn-ghost sm" onclick="restoreDraft()">Restore</button>
        <button id="publish-btn" class="btn btn-primary sm" onclick="publishDraft()">Publish ${changes ? `(${changes})` : ''}</button>
        <button class="btn btn-ghost sm" onclick="lockGate()">Sign out</button>
        <div class="tb-admin"><div class="who"><b>Super Admin</b><span>${h(TEST_MODE ? 'test gate' : (adminUser?.email || SUPER_ADMIN_EMAIL))}</span></div><div class="tb-ava">🛡️</div></div>
      </div>
    </header>
    <div class="shell">
      <aside class="sidebar">${nav}<div class="nav-spacer"></div><div class="nav-foot"><b>${activeBoards().length}</b> Boards · <b>${adminGroups().length}</b> Admins<br><b>${userRecords().length}</b> Global users · <b>${users().length}</b> Character links</div></aside>
      <main class="main">
        <div class="phase-note"><span class="pn-ico">🛡️</span><span>${h(TEST_MODE ? 'Test mode uses a local gate for automated regression.' : `Super Admin is protected by Google sign-in and allowlisted to ${SUPER_ADMIN_EMAIL}. ${adminDeleteBackendNote()}`)}</span></div>
        ${body}
      </main>
    </div>
  </div>`;
}
function renderGate() {
  const error = adminGateError ? `<div class="login-err" style="display:block;margin-top:12px">${h(adminGateError)}</div>` : '';
  if (!TEST_MODE) {
    document.getElementById('app').innerHTML = `<div class="gate"><div class="gate-card card card-pad"><div class="gate-crest">⚔️</div><div class="gate-title">Super Admin Portal</div><div class="gate-sub">Google sign-in required</div><div class="phase-note"><span class="pn-ico">🛡️</span><span>เข้าได้เฉพาะ Gmail <b>${h(SUPER_ADMIN_EMAIL)}</b> เท่านั้น</span></div><button class="btn btn-primary" onclick="unlockGate()" ${adminAuthReady ? '' : 'disabled'}>Sign in with Google</button>${error}</div></div>`;
    return;
  }
  document.getElementById('app').innerHTML = `<div class="gate"><div class="gate-card card card-pad"><div class="gate-crest">⚔️</div><div class="gate-title">Super Admin Portal</div><div class="gate-sub">Coin Quest Ledger admin command center</div><div class="phase-note"><span class="pn-ico">⚠️</span><span>Test mode local gate for automated regression only</span></div>${formField('', `<input id="gate-pass" class="pin-input" type="password" placeholder="${gateConfigured() ? 'Super Admin test pass' : 'ตั้ง test pass ครั้งแรก'}" onkeydown="if(event.key==='Enter')unlockGate()">`)}<button class="btn btn-primary" onclick="unlockGate()">${gateConfigured() ? 'Unlock' : 'Set & Unlock'}</button>${error}</div></div>`;
}
function render() { isUnlocked() ? renderMain() : renderGate(); }
function userOptions(selected = '') {
  return userRecords().map(u => `<option value="${h(u.userId)}" ${u.userId === selected ? 'selected' : ''}>${h(u.name)} · ${h(u.userId)}</option>`).join('');
}
function boardOptions(selected = '') {
  return activeBoards().map(b => `<option value="${h(b.originalId)}" ${b.originalId === selected || b.urlId === selected ? 'selected' : ''}>${h(b.tripName)} · ${h(b.urlId)}</option>`).join('');
}
function closePortalModal() {
  const root = document.getElementById('modal-root');
  root.classList.remove('show');
  root.innerHTML = '';
}
function portalModal(title, body, footer = '') {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal floating-modal"><div class="modal-head"><h3>${title}</h3><button class="x-btn" onclick="closePortalModal()">×</button></div><div class="modal-body">${body}</div>${footer ? `<div class="modal-foot">${footer}</div>` : ''}</div>`;
  root.classList.add('show');
}
function showExportModal(target = '') {
  const body = `<div class="field"><label>Select board / user</label><select id="export-target"><option value="">All</option><optgroup label="Boards">${activeBoards().map(b => `<option value="b:${h(b.originalId)}" ${b.originalId === target || b.urlId === target ? 'selected' : ''}>🗂️ ${h(b.tripName)} · ${h(b.urlId)}</option>`).join('')}</optgroup><optgroup label="Users">${userRecords().map(u => `<option value="u:${h(u.userId)}" ${u.userId === target ? 'selected' : ''}>👤 ${h(u.name)} · ${h(u.userId)}</option>`).join('')}</optgroup></select></div><div class="field"><label>Format</label><select><option>JSON</option><option>CSV</option></select></div>`;
  portalModal('📤 Export data', body, `<button class="btn btn-ghost" onclick="closePortalModal()">Cancel</button><button class="btn btn-gold" onclick="supportAction('Export data','Prepared coin-quest-export.json');closePortalModal()">Export JSON</button>`);
}
function showImpersonateModal(uid = '') {
  portalModal('🎭 Impersonate user', `<div class="field"><label>Select user</label><select>${userOptions(uid)}</select></div><div class="phase-note" style="margin:0"><span class="pn-ico">👁️</span><span>Read-only mode. Actions should be logged when production auth is wired.</span></div>`, `<button class="btn btn-ghost" onclick="closePortalModal()">Cancel</button><button class="btn btn-primary" onclick="supportAction('Impersonate user','Opened read-only user view');closePortalModal()">Open user view</button>`);
}
function showResetPwModal(id = '') {
  const temp = tempPassword();
  portalModal('🔑 Reset password', `<div class="field"><label>Real account username</label><input id="reset-username" class="mono" placeholder="pointy"><div class="hint">No real email needed. This rotates the Firebase Auth credential behind this username.</div></div><div class="field"><label>Temporary password</label><input id="reset-temp-password" class="mono" value="${h(temp)}"><div class="hint">Give this password to the user. They can login, then keep it or reset again with recovery code.</div></div><div class="field"><label>Optional User ID to preserve</label><select id="reset-user-id"><option value="">From existing account mapping</option>${userOptions(id)}</select></div><div class="phase-note" style="margin:0"><span class="pn-ico">🔐</span><span>Admin reset creates a new Firebase Auth credential and moves the username/User ID/Character pointer to it.</span></div><div class="login-err" id="reset-error" hidden></div>`, `<button class="btn btn-ghost" onclick="closePortalModal()">Cancel</button><button class="btn btn-primary" onclick="performAdminPasswordReset()">Confirm reset</button>`);
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
    setError('Enter a username and 6+ character temporary password.');
    return;
  }
  try {
    const db = window.PointyFirebase?.firestore?.();
    const auth = window.PointyFirebase?.auth?.();
    if (!db || !auth) throw new Error('Firebase Auth is not available on this page.');
    const snap = await db.collection('usernames').doc(username).get();
    const old = snap.exists ? snap.data() || {} : {};
    const oldUser = old.uid ? await db.collection('users').doc(old.uid).get().then(s => s.exists ? s.data() : {}) : {};
    const authEmail = adminAuthEmail(username);
    const cred = await auth.createUserWithEmailAndPassword(authEmail, password);
    await cred.user.updateProfile({ displayName: username });
    const recoveryCode = recoveryCodeValue();
    const recHash = await recoveryHash(username, recoveryCode);
    const character = oldUser.character || null;
    const userId = oldUser.userId || old.userId || keepUserId || String(Math.floor(1000 + Math.random() * 9000));
    const next = {
      uid: cred.user.uid,
      username,
      email: authEmail,
      userId,
      name: oldUser.name || username,
      character,
      characterId: character?.id || old.characterId || '',
      provider: 'firebase',
      recoveryHash: recHash,
      recoveryIssuedAt: Date.now(),
      tempPasswordRequired: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('users').doc(cred.user.uid).set(next, { merge: true });
    await db.collection('usernames').doc(username).set({
      username,
      uid: cred.user.uid,
      authEmail,
      userId,
      characterId: next.characterId,
      recoveryHash: recHash,
      recoveryIssuedAt: Date.now(),
      adminResetAt: Date.now(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    if (next.characterId) {
      await db.collection('characters').doc(next.characterId).set({
        ownerUid: cred.user.uid,
        userId,
        username,
        accountName: next.name,
        updatedAt: Date.now()
      }, { merge: true });
    }
    supportAction('Reset password', `Admin reset username ${username}`);
    portalModal('✅ Password reset ready', `<div class="field"><label>Username</label><input class="mono" value="${h(username)}" readonly></div><div class="field"><label>Temporary password</label><input class="mono" value="${h(password)}" readonly></div><div class="field"><label>New recovery code</label><input class="mono" value="${h(recoveryCode)}" readonly><div class="hint">Give this to the user once. It replaces their previous recovery code.</div></div>`, `<button class="btn btn-primary" onclick="closePortalModal()">Done</button>`);
  } catch (error) {
    setError(error?.message || 'Reset failed.');
  }
}
function showMergeModal() {
  portalModal('🔗 Merge accounts', `<div class="field"><label>Keep this user</label><select>${userOptions()}</select></div><div class="field"><label>Merge from (will be removed)</label><select>${userOptions()}</select></div><div class="phase-note" style="margin:0"><span class="pn-ico">⚠️</span><span>All characters and boards move to the kept User ID. <b>This action cannot be undone.</b></span></div>`, `<button class="btn btn-ghost" onclick="closePortalModal()">Cancel</button><button class="btn btn-danger" onclick="supportAction('Merge accounts','Prepared duplicate-user merge');closePortalModal()">Confirm</button>`);
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
    const local = localUserLifecycle();
    local[u.userId] = { ...(local[u.userId] || {}), ...patch, reason };
    saveLocalUserLifecycle(local);
    if (!TEST_MODE && u.uid) {
      const db = window.PointyFirebase?.firestore?.();
      if (!db) throw new Error('Firebase Firestore is not available.');
      await db.collection('users').doc(u.uid).set({
        ...patch,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      if (u.username) {
        await db.collection('usernames').doc(normalizeUsername(u.username)).set({
          lifecycleStatus: nextStatus,
          lifecycleUpdatedAt: now,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
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
  portalModal('🗑️ Permanent delete request', `<div class="phase-note" style="margin-top:0"><span class="pn-ico">⚠️</span><span>This action is backend-only. The browser sends your Google-auth ID token; only ${h(SUPER_ADMIN_EMAIL)} is accepted.</span></div><div class="field"><label>User</label><input class="mono" value="${h(u.name)} · ${h(u.userId)}${u.username ? ' · @' + h(u.username) : ''}" readonly></div><div class="field"><label>Reason</label><textarea id="delete-reason" rows="3" placeholder="Required audit reason"></textarea></div><div class="field"><label>Type to confirm</label><input id="delete-confirm" class="mono" placeholder="${h(confirmText)}"><div class="hint">This requests deletion of Auth uid, user doc, username mapping, and character owner links.</div></div><div class="login-err" id="delete-error" hidden></div>`, `<button class="btn btn-ghost" onclick="closePortalModal()">Cancel</button><button class="btn btn-danger" onclick="performPermanentDeleteRequest(${q(userId)})">Request permanent delete</button>`);
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
function showInviteAdminModal(uid = '') {
  portalModal('🛡️ Invite admin', `<div class="field"><label>Pick the user to make admin</label><select>${userOptions(uid)}</select><div class="hint">This User ID gets a new Admin ID.</div></div><div class="field"><label>Admin nickname</label><input placeholder="e.g. PartyMaster"></div><div class="field"><label>Assign admin → Boards</label><select>${boardOptions()}</select></div>`, `<button class="btn btn-ghost" onclick="closePortalModal()">Cancel</button><button class="btn btn-primary" onclick="supportAction('Invite admin','Prepared Admin ID invitation');closePortalModal()">Confirm</button>`);
}
function showAddUserModal(boardId = '') {
  portalModal('👤 Add user', `<div class="field"><label>Type</label><div class="seg"><button type="button" class="on">Existing user</button><button type="button">New user</button></div></div><div class="field"><label>Select user</label><select>${userOptions()}</select></div><div class="field"><label>Select board</label><select id="add-user-board">${boardOptions(boardId)}</select><div class="hint">Creates/links one active character in this board.</div></div>`, `<button class="btn btn-ghost" onclick="closePortalModal()">Cancel</button><button class="btn btn-primary" onclick="supportAction('Add user','Prepared board user link');closePortalModal()">Confirm</button>`);
}
function showEditCharModal(userId, charId) {
  const u = userById(userId);
  const c = u?.chars.find(x => x.id === charId);
  if (!u || !c) return;
  const classKeys = PointyLogic.CLASS_ORDER || ['warrior', 'wizard', 'cleric', 'monk', 'bard', 'dragoon'];
  const radios = classKeys.map(key => `<button type="button" class="radio-card av-card ${c.className === key ? 'on' : ''}" onclick="document.getElementById('edit-char-class').value='${h(key)}';this.parentElement.querySelectorAll('.radio-card').forEach(b=>b.classList.remove('on'));this.classList.add('on')"><div class="rc-ico">⚔️</div><div class="rc-t">${h(key)}</div></button>`).join('');
  portalModal('🎭 Edit character · ' + h(c.name), `<div class="phase-note" style="margin-top:0;margin-bottom:14px"><span class="pn-ico">👤</span><span>Each user has one active character in the current player loop; admin edits that character here.</span></div><input id="edit-char-class" type="hidden" value="${h(c.className)}"><div class="field"><label>Character name</label><input id="edit-char-name" value="${h(c.name)}"></div><div class="field"><label>Avatar / Class</label><div class="radio-cards av-grid">${radios}</div></div><div class="grid g-2" style="gap:12px"><div class="field"><label>Level</label><input id="edit-char-level" type="number" min="1" value="${h(characterLevelFromXp(c.xp).lvl)}"></div><div class="field"><label>EXP</label><input id="edit-char-xp" type="number" min="0" value="${h(c.xp)}"></div></div>`, `<button class="btn btn-ghost" onclick="closePortalModal()">Cancel</button><button class="btn btn-primary" onclick="saveEditedCharacter(${q(userId)},${q(charId)})">Save</button>`);
}
function saveEditedCharacter(userId, charId) {
  const u = userById(userId);
  const c = u?.chars.find(x => x.id === charId);
  if (!u || !c) return closePortalModal();
  const nextName = document.getElementById('edit-char-name')?.value.trim() || c.name;
  const nextClass = document.getElementById('edit-char-class')?.value || c.className;
  const levelValue = Math.max(1, parseInt(document.getElementById('edit-char-level')?.value || '1', 10));
  const xpValue = Math.max(0, parseInt(document.getElementById('edit-char-xp')?.value || String((levelValue - 1) * PointyLogic.CHARACTER_LEVEL_STEP), 10));
  activeBoards().forEach(b => {
    const currentName = Object.keys(b.characterIds || {}).find(name => b.characterIds[name] === charId);
    if (!currentName) return;
    if (nextName !== currentName && !b.participants.includes(nextName)) {
      b.participants = b.participants.map(name => name === currentName ? nextName : name);
      b.characterIds[nextName] = b.characterIds[currentName];
      delete b.characterIds[currentName];
      if (b.data?.heroClasses?.[currentName]) {
        b.data.heroClasses[nextName] = b.data.heroClasses[currentName];
        delete b.data.heroClasses[currentName];
      }
    }
    b.data.heroClasses = { ...(b.data.heroClasses || {}), [nextName]: nextClass };
    b.data.characterXp = { ...(b.data.characterXp || {}), [charId]: xpValue };
  });
  markDirty();
  closePortalModal();
  render();
}
function showModal(title, body, actions = []) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal floating-modal"><div class="modal-head"><h3>${h(title)}</h3><button class="x-btn" data-i="0">×</button></div><div class="modal-body">${h(body)}</div><div class="modal-foot">${actions.map((a, i) => `<button class="btn ${a.primary ? 'btn-primary' : 'btn-ghost'} ${a.danger ? 'btn-danger' : ''}" data-i="${i}">${h(a.label || 'ตกลง')}</button>`).join('')}</div></div>`;
  root.classList.add('show');
  [...root.querySelectorAll('button')].forEach(btn => btn.onclick = () => {
    const fn = actions[Number(btn.dataset.i)]?.onClick;
    root.classList.remove('show');
    root.innerHTML = '';
    if (fn) fn();
  });
}
function confirmAction(title, body, onConfirm) {
  showModal(title, body, [{ label: 'ยกเลิก' }, { label: 'ยืนยัน', primary: true, danger: /ลบ|Delete/.test(title), onClick: onConfirm }]);
}
function inputAction(title, body, placeholder, onConfirm) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal floating-modal"><div class="modal-head"><h3>${h(title)}</h3><button class="x-btn" data-action="cancel">×</button></div><div class="modal-body"><p class="muted">${h(body)}</p>${formField(placeholder, `<input id="modal-input" placeholder="${h(placeholder)}">`)}</div><div class="modal-foot"><button class="btn btn-ghost" data-action="cancel">ยกเลิก</button><button class="btn btn-primary" data-action="ok">ยืนยัน</button></div></div>`;
  root.classList.add('show');
  const input = document.getElementById('modal-input');
  const close = () => { root.classList.remove('show'); root.innerHTML = ''; };
  root.querySelector('[data-action="cancel"]').onclick = close;
  root.querySelector('[data-action="ok"]').onclick = () => {
    const value = input.value.trim();
    close();
    if (value) onConfirm(value);
  };
  input.onkeydown = event => {
    if (event.key === 'Enter') root.querySelector('[data-action="ok"]').click();
    if (event.key === 'Escape') close();
  };
  input.focus();
}
async function boot() {
  if (!TEST_MODE) {
    startAdminAuth();
    if (!adminAuthReady || !isUnlocked()) { renderGate(); return; }
  }
  if (!isUnlocked()) { renderGate(); return; }
  await loadPublished();
  renderMain();
}
boot();
