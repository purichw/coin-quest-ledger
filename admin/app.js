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
function boardTypeLabel(b) { return (b.type || 'split') === 'debt' ? 'Debt' : 'Split'; }
function boardTypeIcon(b) { return (b.type || 'split') === 'debt' ? '🐉' : '📜'; }
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
  return `<button type="button" class="id-chip ${safeKind}"${on}>${tag}<span>${h(label || '-')}</span>${extra}</button>`;
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
    draft.boards.push(normalizeBoard(id, { boardType: boardFilter === 'debt' ? 'debt' : 'split', tripName: 'New Board', participants: [], characterIds: {}, admin: { adminId: 'ADM-' + uid().slice(-6), adminName: '' } }));
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
function renderDashboard() {
  const boards = activeBoards();
  const split = boards.filter(b => (b.type || 'split') === 'split').length;
  const debt = boards.length - split;
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
  const kpis = `<div class="stat-grid">
    <div class="stat-card"><span>Boards</span><strong>${boards.length}</strong><small>${split} Split · ${debt} Debt</small></div>
    <div class="stat-card"><span>Users / Characters</span><strong>${records.length}</strong><small>${users().length} board links</small></div>
    <div class="stat-card"><span>Debt Watch</span><strong>${totals.overdue}</strong><small>${fmtMoney(totals.balance)} balance tracked</small></div>
    <div class="stat-card"><span>Unpublished Changes</span><strong>${diffBoards().length}</strong><small>${dirty ? 'local draft active' : 'published snapshot'}</small></div>
  </div>`;
  const quick = `<div class="mini-list">
    <button class="btn primary" onclick="addBoard()">+ New board</button>
    <button class="btn" onclick="selectTab('users')">Invite / add user</button>
    <button class="btn" onclick="selectTab('support')">Support tools</button>
    <button class="btn warn" onclick="selectTab('revisions')">Version control</button>
  </div>`;
  const feed = recent.length ? recent.map(c => `<div class="mini-row"><span><b>${h(c.area)}</b> <span class="pill">${h(c.action)}</span><br><span class="muted">${h(c.detail)}</span></span></div>`).join('') : '<div class="mini-row muted">No local draft changes yet</div>';
  const needs = attention.length ? attention.map(b => `<div class="mini-row"><span>${idChip('board', b.urlId, b.originalId)}<br><span class="muted">${!b.adminId ? 'Missing admin ID' : !b.adminName ? 'Missing admin nickname' : 'Missing URL'}</span></span><button class="btn" onclick="openDetail('board',${q(b.originalId)})">Open</button></div>`).join('') : '<div class="mini-row muted">No flagged boards</div>';
  const command = dashMode === 'b'
    ? `<div class="split-layout"><div>${panel('Needs Attention', needs)}${panel('Recent Activity', feed)}</div><div>${panel('Quick Actions', quick)}</div></div>${kpis}`
    : `${kpis}<div class="split-layout"><div>${panel('Recent Activity', feed)}</div><div>${panel('Needs Attention', needs)}${panel('Quick Actions', quick)}</div></div>`;
  return panel('Dashboard', `<div class="toolbar"><div class="sub">Super Admin command center</div><div class="seg"><button class="${dashMode === 'a' ? 'on' : ''}" onclick="dashMode='a';render()">A Cards</button><button class="${dashMode === 'b' ? 'on' : ''}" onclick="dashMode='b';render()">B Command</button></div></div>${command}`);
}
function renderRelationshipMap() {
  return panel('Relationship Map', `<div class="map">
    <div class="map-node"><b>Global User ID</b><div class="muted">หนึ่ง user ใช้ข้าม Split และ Debt</div></div>
    <div class="map-arrow">→</div>
    <div class="map-node"><b>Character IDs</b><div class="muted">EXP/LV อยู่บน Character ไม่ใช่ User</div></div>
    <div class="map-arrow">→</div>
    <div class="map-node"><b>Boards</b><div class="muted">Split trip หรือ Debt lair เท่านั้น Compare ไม่ใช่ Board</div></div>
    <div class="map-node"><b>User as Admin</b><div class="muted">หนึ่ง User มีหลาย Admin ID ได้</div></div>
    <div class="map-arrow">→</div>
    <div class="map-node"><b>Admin IDs</b><div class="muted">Admin ID เดียวผูกหลาย Board ได้</div></div>
    <div class="map-arrow">→</div>
    <div class="map-node"><b>Owned Boards</b><div class="muted">Super Admin แก้ทุกอย่างได้ผ่าน portal นี้</div></div>
  </div><div class="section"><h3>Live links</h3>${userRecords().slice(0, 6).map(u => `<div class="mini-row"><span>${idChip('user', u.userId, u.userId)} ${u.chars.map(c => idChip('char', c.id || '-', c.id)).join(' ')} ${u.boards.map(b => idChip('board', b.urlId, b.originalId)).join(' ')}</span></div>`).join('') || '<div class="muted">ยังไม่มี user</div>'}</div>`);
}
function boardRows() {
  return filtered(activeBoards().filter(b => boardFilter === 'all' || (b.type || 'split') === boardFilter), ['urlId', 'tripName', 'adminId', 'adminName']).map(b => {
    const st = boardStats(b);
    return `<tr>
      <td><input class="field small" value="${h(b.urlId)}" oninput="updateBoard(${q(b.originalId)},{urlId:this.value.trim()})"></td>
      <td><span class="badge">${boardTypeIcon(b)} ${boardTypeLabel(b)}</span></td>
      <td><input class="field" value="${h(b.tripName)}" oninput="updateBoard(${q(b.originalId)},{tripName:this.value})"></td>
      <td><input class="field small" value="${h(b.adminId)}" oninput="updateBoard(${q(b.originalId)},{adminId:this.value})"></td>
      <td><input class="field" value="${h(b.adminName)}" oninput="updateBoard(${q(b.originalId)},{adminName:this.value})"></td>
      <td><input class="field" type="password" placeholder="ตั้งรหัสใหม่" oninput="updateBoard(${q(b.originalId)},{newPassword:this.value})"></td>
      <td><span class="pill">${b.participants.length}</span> <span class="muted">${b.type === 'debt' ? `${st.dragons} dragons` : `${st.expenses} quests`}</span></td>
      <td><button class="btn" onclick="openDetail('board',${q(b.originalId)})">Detail</button> <button class="btn" onclick="addUser(${q(b.originalId)})">+ User</button> <button class="btn danger" onclick="deleteBoard(${q(b.originalId)})">ลบ</button></td>
    </tr>`;
  }).join('');
}
function renderBoards() {
  if (detail?.kind === 'board') return renderBoardDetail(detail.id);
  return panel('Boards', `<div class="toolbar"><div class="filters"><input class="search" placeholder="ค้นหา board/admin" value="${h(query)}" oninput="query=this.value;render()"><div class="seg">${['all','split','debt'].map(x => `<button class="${boardFilter === x ? 'on' : ''}" onclick="boardFilter='${x}';render()">${x}</button>`).join('')}</div></div><button class="btn primary" onclick="addBoard()">+ เพิ่ม Board</button></div><table><thead><tr><th>URL</th><th>Type</th><th>ชื่อ Board</th><th>Admin ID</th><th>ชื่อเล่น Admin</th><th>Reset Password</th><th>Members</th><th></th></tr></thead><tbody>${boardRows()}</tbody></table>`);
}
function renderBoardDetail(id) {
  const b = boardById(id);
  if (!b) return panel('Board not found', '<button class="btn" onclick="closeDetail()">Back</button>');
  const st = boardStats(b);
  const ownerUser = adminUserId(b);
  const changeRows = diffBoards().filter(c => c.detail.includes(b.originalId) || c.detail.includes(b.urlId) || c.detail.includes(b.tripName)).map(c => `<div class="change"><strong>${h(c.area)} <span class="pill">${h(c.action)}</span></strong><span>${h(c.detail)} <button class="btn warn" onclick="restoreBoard(${q(b.originalId)})">Revert board</button></span></div>`).join('') || '<div class="muted">No draft changes for this board</div>';
  const members = b.participants.map(name => {
    const charId = b.characterIds[name] || '';
    const uId = userKey(name, charId);
    const role = name === b.adminName ? 'Owner' : b.type === 'debt' ? 'Slayer' : 'Hero';
    return `<tr><td>${h(name)}</td><td>${idChip('char', charId || '-', charId)}</td><td>${idChip('user', uId, uId)}</td><td><span class="pill">${role}</span></td><td><input class="field small" value="${h(charId)}" maxlength="4" oninput="updateUser(${q(b.originalId)},${q(name)},this.value)"></td><td><button class="btn danger" onclick="deleteUser(${q(b.originalId)},${q(name)})">ลบ</button></td></tr>`;
  }).join('');
  return `<div class="crumbs"><button onclick="closeDetail('boards')">Boards</button><span>/</span><span>${h(b.urlId)}</span></div>
    <section class="panel"><div class="toolbar"><h2>${h(b.tripName)}</h2><div>${idChip('board', b.urlId, b.originalId)} ${idChip('admin', b.adminId || '-', b.adminOwnerHash || b.adminId)} ${idChip('user', ownerUser, ownerUser)}</div></div>
      <div class="detail-grid"><div>
        <div class="section"><h3>Overview</h3><div class="kv"><b>Type</b><span>${boardTypeIcon(b)} ${boardTypeLabel(b)}</span></div><div class="kv"><b>URL</b><input class="field" value="${h(b.urlId)}" oninput="updateBoard(${q(b.originalId)},{urlId:this.value.trim()})"></div><div class="kv"><b>Name</b><input class="field" value="${h(b.tripName)}" oninput="updateBoard(${q(b.originalId)},{tripName:this.value})"></div><div class="kv"><b>Stats</b><span>${b.type === 'debt' ? `${st.dragons} dragons · ${fmtMoney(st.balance)}` : `${st.expenses} quests · ${fmtMoney(st.spend)}`}</span></div></div>
        <div class="section danger-zone"><h3>Danger Zone</h3><div class="actions"><button class="btn warn" onclick="restoreBoard(${q(b.originalId)})">Restore board</button><button class="btn danger" onclick="deleteBoard(${q(b.originalId)})">Delete board</button></div></div>
      </div><div>
        <div class="section"><h3>Owner / Admin</h3><div class="kv"><b>Admin ID</b><input class="field" value="${h(b.adminId)}" oninput="updateBoard(${q(b.originalId)},{adminId:this.value})"></div><div class="kv"><b>Nickname</b><input class="field" value="${h(b.adminName)}" oninput="updateBoard(${q(b.originalId)},{adminName:this.value})"></div><div class="kv"><b>Password reset</b><input class="field" type="password" placeholder="ตั้งรหัสใหม่" oninput="updateBoard(${q(b.originalId)},{newPassword:this.value})"></div></div>
        <div class="section"><h3>Members</h3><table><thead><tr><th>Name</th><th>Character</th><th>User</th><th>Role</th><th>Edit ID</th><th></th></tr></thead><tbody>${members}</tbody></table><button class="btn" onclick="addUser(${q(b.originalId)})">+ Add user</button></div>
        <div class="section"><h3>Change Log</h3><div class="rev-list">${changeRows}</div></div>
        <div class="section"><h3>Board Versions</h3><div class="mini-row"><span>Latest published snapshot</span><button class="btn warn" onclick="restoreBoard(${q(b.originalId)})">Restore</button></div></div>
      </div></div>
    </section>`;
}
function renderAdmins() {
  if (detail?.kind === 'admin') return renderAdminDetail(detail.id);
  const rows = filtered(adminGroups(), ['adminId', 'adminName', 'key']).map(g => `
    <tr>
      <td><input class="field small" value="${h(g.adminId)}" oninput="updateAdminGroup(${q(g.key)},{adminId:this.value})"></td>
      <td><input class="field" value="${h(g.adminName)}" oninput="updateAdminGroup(${q(g.key)},{adminName:this.value})"></td>
      <td>${idChip('user', g.boards[0] ? adminUserId(g.boards[0]) : userKey(g.adminName, g.adminId), g.boards[0] ? adminUserId(g.boards[0]) : userKey(g.adminName, g.adminId))}</td>
      <td class="muted">${h(g.key)}</td>
      <td>${g.boards.map(b => idChip('board', b.urlId, b.originalId)).join(' ')}</td>
      <td><button class="btn" onclick="openDetail('admin',${q(g.key)})">Detail</button></td>
    </tr>`).join('');
  return panel('Board Admins', `<div class="toolbar"><input class="search" placeholder="ค้นหา admin" value="${h(query)}" oninput="query=this.value;render()"><button class="btn" onclick="supportAction('Invite Admin','เลือก user แล้วผูก Admin ID เข้ากับ board')">Invite admin</button></div><table><thead><tr><th>ID</th><th>ชื่อเล่น</th><th>User</th><th>Owner Hash</th><th>Boards</th><th></th></tr></thead><tbody>${rows}</tbody></table>`);
}
function renderAdminDetail(key) {
  const g = adminGroupByKey(key);
  if (!g) return panel('Admin not found', '<button class="btn" onclick="closeDetail()">Back</button>');
  const first = g.boards[0];
  const userId = first ? adminUserId(first) : userKey(g.adminName, g.adminId);
  return `<div class="crumbs"><button onclick="closeDetail('admins')">Admins</button><span>/</span><span>${h(g.adminId || key)}</span></div>${panel('Admin Detail', `<div class="detail-grid"><div class="section"><h3>Identity</h3><div class="kv"><b>Admin ID</b><input class="field" value="${h(g.adminId)}" oninput="updateAdminGroup(${q(g.key)},{adminId:this.value})"></div><div class="kv"><b>Nickname</b><input class="field" value="${h(g.adminName)}" oninput="updateAdminGroup(${q(g.key)},{adminName:this.value})"></div><div class="kv"><b>User</b><span>${idChip('user', userId, userId)}</span></div><div class="kv"><b>Owner hash</b><span class="muted">${h(g.key)}</span></div></div><div class="section"><h3>Owned Boards</h3><table><thead><tr><th>Board</th><th>Name</th><th>Type</th><th></th></tr></thead><tbody>${g.boards.map(b => `<tr><td>${idChip('board', b.urlId, b.originalId)}</td><td>${h(b.tripName)}</td><td>${boardTypeLabel(b)}</td><td><button class="btn" onclick="openDetail('board',${q(b.originalId)})">Open</button></td></tr>`).join('')}</tbody></table></div></div>`)}`;
}
function renderUsers() {
  if (detail?.kind === 'user') return renderUserDetail(detail.id);
  const flatRows = users().filter(u => !query || `${u.name} ${u.id} ${u.board.urlId}`.toLowerCase().includes(query.toLowerCase())).map(u => `
    <tr>
      <td>${idChip('board', u.board.urlId, u.board.originalId)}</td>
      <td>${h(u.name)}</td>
      <td><input class="field small" value="${h(u.id)}" maxlength="4" oninput="updateUser(${q(u.board.originalId)},${q(u.name)},this.value)"></td>
      <td>${idChip('user', userKey(u.name, u.id), userKey(u.name, u.id))}</td>
      <td><a class="btn" href="${h(characterProfileLink(u.id))}">Profile</a> <button class="btn" onclick="openDetail('user',${q(userKey(u.name, u.id))})">Detail</button> <button class="btn danger" onclick="deleteUser(${q(u.board.originalId)},${q(u.name)})">ลบ</button></td>
    </tr>`).join('');
  return panel('Users', `<div class="toolbar"><input class="search" placeholder="ค้นหา user/board" value="${h(query)}" oninput="query=this.value;render()"><button class="btn" onclick="supportAction('Add User','เลือก existing/new user แล้วสร้าง character LV 1 ใน board')">+ Add user</button></div><table><thead><tr><th>Board</th><th>ชื่อ</th><th>Character ID</th><th>User ID</th><th></th></tr></thead><tbody>${flatRows}</tbody></table>`);
}
function renderUserDetail(id) {
  const u = userById(id);
  if (!u) return panel('User not found', '<button class="btn" onclick="closeDetail()">Back</button>');
  const renown = userRenown(u);
  const boards = u.boards.map(b => `<tr><td>${idChip('board', b.urlId, b.originalId)}</td><td>${h(b.tripName)}</td><td>${boardTypeLabel(b)}</td><td>${idChip('admin', b.adminId || '-', b.adminOwnerHash || b.adminId)}</td></tr>`).join('');
  const chars = u.chars.map(c => `<tr><td>${idChip('char', c.id || '-', c.id)}</td><td>${h(c.name)}</td><td>${h(c.className)}</td><td>LV ${Math.floor(Number(c.xp || 0) / 1200) + 1} · ${Number(c.xp || 0)} XP</td><td>${idChip('board', boardById(c.boardId)?.urlId || c.boardId, c.boardId)}</td></tr>`).join('');
  const adminRows = u.adminGroups.map(g => `<tr><td>${idChip('admin', g.adminId || '-', g.key)}</td><td class="muted">${h(g.key)}</td><td>${g.boards.map(b => idChip('board', b.urlId, b.originalId)).join(' ')}</td></tr>`).join('');
  return `<div class="crumbs"><button onclick="closeDetail('users')">Users</button><span>/</span><span>${h(u.userId)}</span></div>${panel('User Profile', `<div class="stat-grid"><div class="stat-card"><span>User ID</span><strong>${h(u.userId)}</strong><small>${h(u.name)}</small></div><div class="stat-card"><span>Overall Level</span><strong>${userLevel(u)}</strong><small>${renown} Renown</small></div><div class="stat-card"><span>Characters</span><strong>${u.chars.length}</strong><small>EXP lives on each character</small></div><div class="stat-card"><span>Admin Roles</span><strong>${u.adminGroups.length}</strong><small>${u.adminGroups.flatMap(g => g.boards).length} owned boards</small></div></div><div class="section"><h3>Characters</h3><table><thead><tr><th>Character</th><th>Name</th><th>Class</th><th>Level / XP</th><th>Boards</th></tr></thead><tbody>${chars}</tbody></table></div><div class="section"><h3>Admin roles</h3><table><thead><tr><th>Admin ID</th><th>Owner hash</th><th>Owned boards</th></tr></thead><tbody>${adminRows || '<tr><td colspan="3" class="muted">No admin roles</td></tr>'}</tbody></table></div><div class="section"><h3>Boards</h3><table><thead><tr><th>Board</th><th>Name</th><th>Type</th><th>Admin</th></tr></thead><tbody>${boards}</tbody></table></div>`)}`;
}
function renderAuditLog() {
  const changes = diffBoards().map((c, i) => ({ ...c, id: 'draft-' + i, at: Date.now(), author: 'Local Draft' }));
  const revChanges = (published.revisions || []).flatMap(rev => (rev.changes || []).map((c, i) => ({ ...c, id: `${rev.id || rev.createdAt}-${i}`, at: rev.createdAt, author: rev.author || 'Super Admin' })));
  const all = [...changes, ...revChanges].filter(c => auditFilter === 'all' || String(c.area).toLowerCase().includes(auditFilter));
  const rows = all.map(c => `<div class="change"><strong>${new Date(c.at || Date.now()).toLocaleString()}<br><span class="pill">${h(c.area)} · ${h(c.action)}</span></strong><span>${h(c.detail)}<br><span class="muted">${h(c.author)}</span></span></div>`).join('');
  return panel('Audit Log', `<div class="toolbar"><div class="sub">System-wide chronological feed from drafts and published revisions</div><select class="field audit-filter" onchange="auditFilter=this.value;render()">${['all','boards','admins','users'].map(x => `<option value="${x}" ${auditFilter === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="rev-list">${rows || '<div class="muted">No audit entries yet</div>'}</div>`);
}
function renderRevisions() {
  const revs = published.revisions || [];
  const current = diffBoards();
  return panel('Version Control', `<div class="toolbar"><div class="actions"><button class="btn" onclick="saveDraft()">Save snapshot</button><button class="btn primary" onclick="publishDraft()">Publish now${current.length ? ` (${current.length})` : ''}</button><button class="btn warn" onclick="restoreDraft()">Restore latest</button></div></div>${revs.map(rev => `<details class="rev"><summary><span>${new Date(rev.createdAt).toLocaleString()} · ${(rev.changes || []).length} changes</span><span>${h(rev.author || '')}</span></summary><div class="rev-list">${(rev.changes || []).map(c => `<div class="change"><strong>${h(c.area)} <span class="pill">${h(c.action)}</span></strong><span>${h(c.detail)}</span></div>`).join('')}</div></details>`).join('') || '<div class="muted">ยังไม่มี revision</div>'}`);
}
function renderSupportTools() {
  return panel('Support Tools', `<div class="stat-grid"><div class="stat-card"><span>Impersonate</span><strong>👁</strong><small>Read-only user view</small><button class="btn" onclick="supportAction('Impersonate','เปิด read-only user view สำหรับ debug')">Open</button></div><div class="stat-card"><span>Reset password</span><strong>🔑</strong><small>Temporary board admin password</small><button class="btn" onclick="supportAction('Reset Password','สร้าง temporary password และ log action')">Reset</button></div><div class="stat-card"><span>Export</span><strong>📦</strong><small>Board/User JSON or CSV</small><button class="btn" onclick="supportAction('Export Data','เตรียม export package สำหรับ support')">Export</button></div><div class="stat-card"><span>Merge</span><strong>🔀</strong><small>Merge duplicate accounts</small><button class="btn warn" onclick="supportAction('Merge Accounts','รวมบัญชีซ้ำพร้อมบันทึก audit')">Merge</button></div></div><div class="section"><h3>Create / invite flows</h3><div class="actions"><button class="btn primary" onclick="addBoard()">New board</button><button class="btn" onclick="supportAction('Invite Admin','เลือก user → nickname → board แล้วเพิ่ม Admin ID')">Invite admin</button><button class="btn" onclick="supportAction('Add User','เพิ่ม existing/new user เข้า board และสร้าง character LV 1')">Add user</button></div></div>`);
}
function panel(title, body) { return `<section class="panel"><div class="toolbar"><h2>${title}</h2></div>${body}</section>`; }
function renderMain() {
  const body = tab === 'dashboard' ? renderDashboard() : tab === 'map' ? renderRelationshipMap() : tab === 'admins' ? renderAdmins() : tab === 'users' ? renderUsers() : tab === 'audit' ? renderAuditLog() : tab === 'revisions' ? renderRevisions() : tab === 'support' ? renderSupportTools() : renderBoards();
  const changes = diffBoards().length;
  const nav = [
    ['dashboard', 'Dashboard'], ['map', 'Relationship Map'], ['boards', 'Boards'], ['users', 'Users'], ['admins', 'Board Admins'], ['audit', 'Audit Log'], ['revisions', 'Version Control'], ['support', 'Support Tools']
  ].map(([key, label]) => `<button class="${tab === key ? 'on' : ''}" onclick="selectTab('${key}')"><span>${label}</span>${key === 'revisions' && changes ? `<b>${changes}</b>` : ''}</button>`).join('');
  document.getElementById('app').innerHTML = `<div class="shell">
    <div class="top"><div><h1>Admin Portal</h1><div class="sub">Super Admin console · Board ↔ Admin ↔ User ↔ Character</div></div><div class="actions"><span id="draft-badge" class="badge">${dirty ? 'Draft changed locally' : 'Published version'}</span><button class="btn" onclick="saveDraft()">Save</button><button class="btn warn" onclick="restoreDraft()">Restore</button><button id="publish-btn" class="btn primary" onclick="publishDraft()">Publish ${changes ? `(${changes})` : ''}</button><button class="btn" onclick="lockGate()">Lock</button></div></div>
    <div class="notice">Phase 1: local gate ยังไม่ใช่ security จริง ห้ามถือว่าเป็นการกันคนนอกจนกว่าจะมี Firebase Auth และ Security Rules</div>
    <div class="grid"><aside class="side"><div class="nav">${nav}</div><div class="stats"><div class="stat"><strong>${activeBoards().length}</strong>Boards</div><div class="stat"><strong>${adminGroups().length}</strong>Admins</div><div class="stat"><strong>${userRecords().length}</strong>Global users</div><div class="stat"><strong>${users().length}</strong>Character links</div></div></aside>${body}</div>
  </div>`;
}
function renderGate() {
  document.getElementById('app').innerHTML = `<div class="gate"><div class="panel"><h1>Admin Portal</h1><div class="notice">Phase 1 local gate เท่านั้น ยังไม่ใช่ security จริง</div><input id="gate-pass" class="field" type="password" placeholder="${gateConfigured() ? 'Super Admin local pass' : 'ตั้ง local pass ครั้งแรก'}" onkeydown="if(event.key==='Enter')unlockGate()"><button class="btn primary" onclick="unlockGate()">${gateConfigured() ? 'Unlock' : 'Set & Unlock'}</button></div></div>`;
}
function render() { isUnlocked() ? renderMain() : renderGate(); }
function showModal(title, body, actions = []) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal"><h2>${h(title)}</h2><div>${h(body)}</div><div class="modal-actions">${actions.map((a, i) => `<button class="btn ${a.primary ? 'primary' : ''} ${a.danger ? 'danger' : ''}" data-i="${i}">${h(a.label || 'ตกลง')}</button>`).join('')}</div></div>`;
  root.classList.add('show');
  [...root.querySelectorAll('button')].forEach(btn => btn.onclick = () => {
    const fn = actions[Number(btn.dataset.i)]?.onClick;
    root.classList.remove('show');
    if (fn) fn();
  });
}
function confirmAction(title, body, onConfirm) {
  showModal(title, body, [{ label: 'ยกเลิก' }, { label: 'ยืนยัน', primary: true, danger: /ลบ|Delete/.test(title), onClick: onConfirm }]);
}
function inputAction(title, body, placeholder, onConfirm) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal"><h2>${h(title)}</h2><div>${h(body)}</div><input id="modal-input" class="field modal-input" placeholder="${h(placeholder)}"><div class="modal-actions"><button class="btn" data-action="cancel">ยกเลิก</button><button class="btn primary" data-action="ok">ยืนยัน</button></div></div>`;
  root.classList.add('show');
  const input = document.getElementById('modal-input');
  const close = () => root.classList.remove('show');
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
