const TEST_MODE = new URLSearchParams(location.search).get('test') === '1';
const DRAFT_KEY = 'pointy_super_admin_draft_v2';
const GATE_KEY = 'pointy_super_admin_gate_hash_v2';
const GATE_UNLOCK_KEY = 'pointy_super_admin_unlocked_v2';
const LOCAL_REVISIONS_KEY = 'pointy_super_admin_revisions_v2';

let published = { boards: [], revisions: [] };
let draft = { boards: [] };
let tab = 'boards';
let query = '';
let detail = null;
let boardFilter = 'all';
let auditFilter = 'all';
let dashMode = 'a';
let dirty = false;

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

function isUnlocked() {
  return sessionStorage.getItem(GATE_UNLOCK_KEY) === '1';
}
function gateConfigured() {
  return !!localStorage.getItem(GATE_KEY);
}
function unlockGate() {
  const pass = document.getElementById('gate-pass')?.value || '';
  if (!pass.trim()) return;
  if (!gateConfigured()) {
    localStorage.setItem(GATE_KEY, String(hashOf(`super:${pass}`)));
    sessionStorage.setItem(GATE_UNLOCK_KEY, '1');
    boot();
    return;
  }
  if (String(hashOf(`super:${pass}`)) !== localStorage.getItem(GATE_KEY)) {
    showModal('รหัสไม่ถูกต้อง', 'Phase 1 gate นี้เป็น local gate ชั่วคราว ไม่ใช่ security จริง', [{ label: 'ปิด' }]);
    return;
  }
  sessionStorage.setItem(GATE_UNLOCK_KEY, '1');
  boot();
}
function lockGate() {
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
function characterProfileLink(id) {
  const url = `/character/?id=${encodeURIComponent(id || '')}`;
  return TEST_MODE ? `${url}&test=1` : url;
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
function userRecords() {
  const map = new Map();
  activeBoards().forEach(b => {
    b.participants.forEach(name => {
      const charId = b.characterIds[name] || '';
      const key = userKey(name, charId);
      if (!map.has(key)) map.set(key, { userId: key, name, chars: [], boards: [], adminGroups: [] });
      const u = map.get(key);
      if (!u.boards.some(x => x.originalId === b.originalId)) u.boards.push(b);
      if (!u.chars.some(c => c.id === charId && c.boardId === b.originalId)) {
        u.chars.push({ id: charId, name, className: b.data?.heroClasses?.[name] || 'hero', xp: b.data?.characterXp?.[charId] || 0, boardId: b.originalId });
      }
    });
  });
  adminGroups().forEach(g => {
    const b = g.boards[0];
    const key = b ? adminUserId(b) : userKey(g.adminName, g.adminId);
    if (!map.has(key)) map.set(key, { userId: key, name: g.adminName || g.adminId || 'Admin', chars: [], boards: [], adminGroups: [] });
    map.get(key).adminGroups.push(g);
  });
  return [...map.values()].sort((a, b) => a.userId.localeCompare(b.userId));
}
function userById(id) { return userRecords().find(u => u.userId === id); }
function adminGroupByKey(key) { return adminGroups().find(g => g.key === key); }
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
function userLevel(u) { return Math.floor(userRenown(u) / 1200) + 1; }
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
  return `<div class="page-head"><div><h1 class="page-title">${h(title)}</h1>${desc ? `<div class="page-desc">${h(desc)}</div>` : ''}</div>${actions ? `<div class="page-head-actions">${actions}</div>` : ''}</div>`;
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
  const cols = [
    ['Users', 'Global User ID', 'หนึ่ง user ใช้ข้าม Split และ Debt', 'user'],
    ['Characters', 'Character IDs', 'EXP/LV อยู่บน Character ไม่ใช่ User', 'char'],
    ['Boards', 'Boards', 'Split trip หรือ Debt lair เท่านั้น Compare ไม่ใช่ Board', 'board'],
    ['Admins', 'Admin IDs', 'Admin ID เดียวผูกหลาย Board ได้', 'admin'],
    ['Ownership', 'Owned Boards', 'Super Admin แก้ทุกอย่างได้ผ่าน portal นี้', 'board'],
  ];
  const map = `<div class="relmap">${cols.map(([title, name, desc, cls]) => `<div class="rel-col"><div class="rel-col-title">${h(title)}</div><div class="rel-node ${cls}"><div class="rn-top">${h(name)}</div><div class="rn-sub">${h(desc)}</div></div></div>`).join('')}</div>`;
  const links = userRecords().slice(0, 6).map(u => `<div class="log-item"><div class="log-ico">👤</div><div class="log-body"><div class="log-text">${idChip('user', u.userId, u.userId)} ${h(u.name)}</div><div class="log-meta">${u.chars.map(c => idChip('char', c.id || '-', c.id)).join(' ')} ${u.boards.map(b => idChip('board', b.urlId, b.originalId)).join(' ')}</div></div></div>`).join('');
  return `${pageHead('Relationship Map', 'Board ↔ Admin ↔ User ↔ Character links')}${card('Relationship Map', `${map}<div class="hr"></div><p class="section-label">Live links</p><div class="log-list">${links || '<div class="empty"><div class="e-t">ยังไม่มี user</div></div>'}</div>`)}`;
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
  const changeRows = diffBoards().filter(c => c.detail.includes(b.originalId) || c.detail.includes(b.urlId) || c.detail.includes(b.tripName)).map(c => `<div class="log-item"><div class="log-ico edit">✎</div><div class="log-body"><div class="log-text"><b>${h(c.area)}</b> ${statusBadge(c.action, 'active')}</div><div class="log-meta">${h(c.detail)}</div></div><div class="log-actions"><button class="btn btn-ghost sm" onclick="restoreBoard(${q(b.originalId)})">Revert board</button></div></div>`).join('') || '<div class="empty"><div class="e-t">No draft changes for this board</div></div>';
  const members = b.participants.map(name => {
    const charId = b.characterIds[name] || '';
    const uId = userKey(name, charId);
    const role = name === b.adminName ? 'Owner' : b.type === 'debt' ? 'Slayer' : 'Hero';
    return `<tr><td class="cell-strong">${h(name)}</td><td>${idChip('char', charId || '-', charId)}</td><td>${idChip('user', uId, uId)}</td><td>${statusBadge(role, 'active')}</td><td>${editInput(charId, `updateUser(${q(b.originalId)},${q(name)},this.value)`, { small:true, max:4 })}</td><td class="td-actions"><button class="btn btn-danger sm" onclick="deleteUser(${q(b.originalId)},${q(name)})">ลบ</button></td></tr>`;
  }).join('');
  const overview = `${flatCard(`<div class="profile-card"><div class="profile-ava">${boardTypeIcon(b)}</div><div class="profile-name">${h(b.tripName)}</div><div class="profile-id">${idChip('board', b.urlId, b.originalId)}</div><div class="wrap-chips mt12">${modBadge(b.type)} ${idChip('admin', b.adminId || '-', b.adminOwnerHash || b.adminId)} ${idChip('user', ownerUser, ownerUser)}</div></div>`)}
    ${card('Overview', `<div class="kv"><div class="kv-row"><span class="k">Type</span><span class="v">${boardTypeIcon(b)} ${boardTypeLabel(b)}</span></div><div class="kv-row"><span class="k">Stats</span><span class="v">${b.type === 'debt' ? `${st.dragons} dragons · ${fmtMoney(st.balance)}` : `${st.expenses} quests · ${fmtMoney(st.spend)}`}</span></div></div>`)}
    <div class="danger-zone mt16"><h4>Danger Zone</h4><div class="page-head-actions mt8"><button class="btn btn-ghost sm" onclick="restoreBoard(${q(b.originalId)})">Restore board</button><button class="btn btn-danger sm" onclick="deleteBoard(${q(b.originalId)})">Delete board</button></div></div>`;
  const adminForm = `${formField('URL', `<input value="${h(b.urlId)}" oninput="updateBoard(${q(b.originalId)},{urlId:this.value.trim()})">`)}${formField('Name', `<input value="${h(b.tripName)}" oninput="updateBoard(${q(b.originalId)},{tripName:this.value})">`)}${formField('Admin ID', `<input value="${h(b.adminId)}" oninput="updateBoard(${q(b.originalId)},{adminId:this.value})">`)}${formField('Nickname', `<input value="${h(b.adminName)}" oninput="updateBoard(${q(b.originalId)},{adminName:this.value})">`)}${formField('Password reset', `<input type="password" placeholder="ตั้งรหัสใหม่" oninput="updateBoard(${q(b.originalId)},{newPassword:this.value})">`)}`;
  return `<div class="crumbs"><button onclick="closeDetail('boards')">Boards</button><span class="sep">/</span><span class="cur">${h(b.urlId)}</span></div>${pageHead(b.tripName, 'Board detail and admin controls')}<div class="detail-grid"><div>${overview}</div><div class="grid">${card('Owner / Admin', adminForm)}${card('Members', `${table(['Name','Character','User','Role','Edit ID',''], members)}<button class="btn btn-ghost mt12" onclick="addUser(${q(b.originalId)})">+ Add user</button>`)}${card('Change Log', `<div class="log-list">${changeRows}</div>`)}${card('Board Versions', `<div class="between"><span>Latest published snapshot</span><button class="btn btn-ghost sm" onclick="restoreBoard(${q(b.originalId)})">Restore</button></div>`)}</div></div>`;
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
  const records = userRecords().filter(u => !query || `${u.name} ${u.userId}`.toLowerCase().includes(query.toLowerCase()));
  const flatRows = users().filter(u => !query || `${u.name} ${u.id} ${u.board.urlId}`.toLowerCase().includes(query.toLowerCase())).map(u => `
    <tr>
      <td>${idChip('board', u.board.urlId, u.board.originalId)}</td>
      <td class="cell-strong">${h(u.name)}</td>
      <td>${editInput(u.id, `updateUser(${q(u.board.originalId)},${q(u.name)},this.value)`, { small:true, max:4 })}</td>
      <td>${idChip('user', userKey(u.name, u.id), userKey(u.name, u.id))}</td>
      <td class="td-actions"><a class="btn btn-ghost sm" href="${h(characterProfileLink(u.id))}">Profile</a><button class="btn btn-ghost sm" onclick="openDetail('user',${q(userKey(u.name, u.id))})">Detail</button><button class="btn btn-danger sm" onclick="deleteUser(${q(u.board.originalId)},${q(u.name)})">ลบ</button></td>
    </tr>`).join('');
  return `${pageHead('Users', `${records.length} global users · ${users().length} board character links`, `<button class="btn btn-ghost" onclick="supportAction('Add User','เลือก existing/new user แล้วสร้าง character LV 1 ใน board')">+ Add user</button>`)}<div class="toolbar">${searchBox('ค้นหา user/board')}</div>${quickOpen(records, 'user', u => u.userId)}${card('Users', table(['Board','ชื่อ','Character ID','User ID',''], flatRows))}`;
}
function renderUserDetail(id) {
  const u = userById(id);
  if (!u) return card('User not found', '<button class="btn btn-ghost" onclick="closeDetail()">Back</button>');
  const renown = userRenown(u);
  const boards = u.boards.map(b => `<tr><td>${idChip('board', b.urlId, b.originalId)}</td><td>${h(b.tripName)}</td><td>${boardTypeLabel(b)}</td><td>${idChip('admin', b.adminId || '-', b.adminOwnerHash || b.adminId)}</td></tr>`).join('');
  const chars = u.chars.map(c => `<tr><td>${idChip('char', c.id || '-', c.id)}</td><td>${h(c.name)}</td><td>${h(c.className)}</td><td>LV ${Math.floor(Number(c.xp || 0) / 1200) + 1} · ${Number(c.xp || 0)} XP</td><td>${idChip('board', boardById(c.boardId)?.urlId || c.boardId, c.boardId)}</td></tr>`).join('');
  const adminRows = u.adminGroups.map(g => `<tr><td>${idChip('admin', g.adminId || '-', g.key)}</td><td class="muted">${h(g.key)}</td><td>${g.boards.map(b => idChip('board', b.urlId, b.originalId)).join(' ')}</td></tr>`).join('');
  const profile = flatCard(`<div class="profile-card"><div class="profile-ava">👤</div><div class="profile-name">${h(u.name)}</div><div class="profile-id">${idChip('user', u.userId, u.userId)}</div></div>`);
  const stats = `<div class="grid g-4">${statCard('User ID', h(u.userId), h(u.name), 'ID')}${statCard('Overall Level', userLevel(u), `${renown} Renown`, 'LV')}${statCard('Characters', u.chars.length, 'EXP lives on each character', '⚔️')}${statCard('Admin Roles', u.adminGroups.length, `${u.adminGroups.flatMap(g => g.boards).length} owned boards`, '🛡️')}</div>`;
  return `<div class="crumbs"><button onclick="closeDetail('users')">Users</button><span class="sep">/</span><span class="cur">${h(u.userId)}</span></div>${pageHead('User Profile', 'Global user, character IDs, and admin roles')}<div class="detail-grid"><div>${profile}</div><div class="grid">${stats}${card('Characters', table(['Character','Name','Class','Level / XP','Boards'], chars))}${card('Admin roles', table(['Admin ID','Owner hash','Owned boards'], adminRows))}${card('Boards', table(['Board','Name','Type','Admin'], boards))}</div></div>`;
}
function renderAuditLog() {
  const changes = diffBoards().map((c, i) => ({ ...c, id: 'draft-' + i, at: Date.now(), author: 'Local Draft' }));
  const revChanges = (published.revisions || []).flatMap(rev => (rev.changes || []).map((c, i) => ({ ...c, id: `${rev.id || rev.createdAt}-${i}`, at: rev.createdAt, author: rev.author || 'Super Admin' })));
  const all = [...changes, ...revChanges].filter(c => auditFilter === 'all' || String(c.area).toLowerCase().includes(auditFilter));
  const rows = all.map(c => `<div class="log-item"><div class="log-ico edit">✦</div><div class="log-body"><div class="log-text">${h(c.detail)}</div><div class="log-meta"><span>${new Date(c.at || Date.now()).toLocaleString()}</span><span class="dot-sep">•</span><span>${h(c.author)}</span><span class="dot-sep">•</span>${statusBadge(`${c.area} · ${c.action}`, 'active')}</div></div></div>`).join('');
  const filter = `<div class="field compact-select"><select onchange="auditFilter=this.value;render()">${['all','boards','admins','users'].map(x => `<option value="${x}" ${auditFilter === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>`;
  return `${pageHead('Audit Log', 'System-wide chronological feed from drafts and published revisions', filter)}${card('Audit Log', `<div class="log-list">${rows || '<div class="empty"><div class="e-t">No audit entries yet</div></div>'}</div>`)}`;
}
function renderRevisions() {
  const revs = published.revisions || [];
  const current = diffBoards();
  const body = revs.map(rev => `<details class="rev"><summary><span>${new Date(rev.createdAt).toLocaleString()} · ${(rev.changes || []).length} changes</span><span>${h(rev.author || '')}</span></summary><div class="rev-list">${(rev.changes || []).map(c => `<div class="log-item"><div class="log-ico edit">✎</div><div class="log-body"><div class="log-text"><b>${h(c.area)}</b> ${statusBadge(c.action, 'active')}</div><div class="log-meta">${h(c.detail)}</div></div></div>`).join('')}</div></details>`).join('') || '<div class="empty"><div class="e-t">ยังไม่มี revision</div></div>';
  const actions = `<button class="btn btn-ghost" onclick="saveDraft()">Save snapshot</button><button class="btn btn-primary" onclick="publishDraft()">Publish now${current.length ? ` (${current.length})` : ''}</button><button class="btn btn-ghost" onclick="restoreDraft()">Restore latest</button>`;
  return `${pageHead('Version Control', 'Published revisions and local draft changes', actions)}${card('Recent Revisions', body)}`;
}
function renderSupportTools() {
  const tools = `<div class="grid g-4">
    ${statCard('Read-only view', '👁', 'User perspective debug', 'View')}
    ${statCard('Reset password', '🔑', 'Temporary board admin password', 'Key')}
    ${statCard('Export', '📦', 'Board/User JSON or CSV', 'JSON')}
    ${statCard('Merge', '🔀', 'Merge duplicate accounts', 'Ops')}
  </div>`;
  const toolActions = `<div class="log-list">
    <div class="log-item"><div class="log-ico edit">👁</div><div class="log-body"><div class="log-text">Impersonate</div><div class="log-meta">Open read-only user view for debugging.</div></div><div class="log-actions"><button class="btn btn-ghost sm" onclick="supportAction('Impersonate','เปิด read-only user view สำหรับ debug')">Open</button></div></div>
    <div class="log-item"><div class="log-ico edit">🔑</div><div class="log-body"><div class="log-text">Reset password</div><div class="log-meta">Create a temporary board admin password.</div></div><div class="log-actions"><button class="btn btn-ghost sm" onclick="supportAction('Reset Password','สร้าง temporary password และ log action')">Reset</button></div></div>
    <div class="log-item"><div class="log-ico add">📦</div><div class="log-body"><div class="log-text">Export</div><div class="log-meta">Prepare a Board/User data package.</div></div><div class="log-actions"><button class="btn btn-ghost sm" onclick="supportAction('Export Data','เตรียม export package สำหรับ support')">Export</button></div></div>
    <div class="log-item"><div class="log-ico fire">🔀</div><div class="log-body"><div class="log-text">Merge</div><div class="log-meta">Merge duplicate accounts with audit logging.</div></div><div class="log-actions"><button class="btn btn-ghost sm" onclick="supportAction('Merge Accounts','รวมบัญชีซ้ำพร้อมบันทึก audit')">Merge</button></div></div>
  </div>`;
  const flows = `<div class="page-head-actions"><button class="btn btn-primary" onclick="addBoard()">New board</button><button class="btn btn-ghost" onclick="supportAction('Invite Admin','เลือก user → nickname → board แล้วเพิ่ม Admin ID')">Invite admin</button><button class="btn btn-ghost" onclick="supportAction('Add User','เพิ่ม existing/new user เข้า board และสร้าง character LV 1')">Add user</button></div>`;
  return `${pageHead('Support Tools', 'Operator actions for Phase 1')}${tools}<div class="mt16">${card('Support Actions', toolActions)}</div><div class="mt16">${card('Create / invite flows', flows)}</div>`;
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
        <span class="env-pill"><span class="dot"></span>PHASE 1</span>
        <span id="draft-badge" class="env-pill">${dirty ? 'Draft changed locally' : 'Published version'}</span>
        <button class="btn btn-ghost sm" onclick="saveDraft()">Save</button>
        <button class="btn btn-ghost sm" onclick="restoreDraft()">Restore</button>
        <button id="publish-btn" class="btn btn-primary sm" onclick="publishDraft()">Publish ${changes ? `(${changes})` : ''}</button>
        <button class="btn btn-ghost sm" onclick="lockGate()">Lock</button>
        <div class="tb-admin"><div class="who"><b>Super Admin</b><span>LOCAL GATE</span></div><div class="tb-ava">🛡️</div></div>
      </div>
    </header>
    <div class="shell">
      <aside class="sidebar">${nav}<div class="nav-spacer"></div><div class="nav-foot"><b>${activeBoards().length}</b> Boards · <b>${adminGroups().length}</b> Admins<br><b>${userRecords().length}</b> Global users · <b>${users().length}</b> Character links</div></aside>
      <main class="main">
        <div class="phase-note"><span class="pn-ico">⚠️</span><span>Phase 1: local gate ยังไม่ใช่ security จริง ห้ามถือว่าเป็นการกันคนนอกจนกว่าจะมี Firebase Auth และ Security Rules</span></div>
        ${body}
      </main>
    </div>
  </div>`;
}
function renderGate() {
  document.getElementById('app').innerHTML = `<div class="gate"><div class="gate-card card card-pad"><div class="gate-crest">⚔️</div><div class="gate-title">Super Admin Portal</div><div class="gate-sub">Coin Quest Ledger admin command center</div><div class="phase-note"><span class="pn-ico">⚠️</span><span>Phase 1 local gate เท่านั้น ยังไม่ใช่ security จริง</span></div>${formField('', `<input id="gate-pass" class="pin-input" type="password" placeholder="${gateConfigured() ? 'Super Admin local pass' : 'ตั้ง local pass ครั้งแรก'}" onkeydown="if(event.key==='Enter')unlockGate()">`)}<button class="btn btn-primary" onclick="unlockGate()">${gateConfigured() ? 'Unlock' : 'Set & Unlock'}</button></div></div>`;
}
function render() { isUnlocked() ? renderMain() : renderGate(); }
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
  if (!isUnlocked()) { renderGate(); return; }
  await loadPublished();
  renderMain();
}
boot();
