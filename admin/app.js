const TEST_MODE = new URLSearchParams(location.search).get('test') === '1';
const DRAFT_KEY = 'pointy_super_admin_draft_v2';
const GATE_KEY = 'pointy_super_admin_gate_hash_v2';
const GATE_UNLOCK_KEY = 'pointy_super_admin_unlocked_v2';
const LOCAL_REVISIONS_KEY = 'pointy_super_admin_revisions_v2';

let published = { boards: [], revisions: [] };
let draft = { boards: [] };
let tab = 'boards';
let query = '';
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

function addBoard() {
  confirmAction('เพิ่ม Board ใหม่?', 'จะเพิ่ม draft board ใหม่ ยังไม่ publish จนกด Publish', () => {
    const id = 'new-' + uid().slice(-4);
    draft.boards.push(normalizeBoard(id, { tripName: 'New Board', participants: [], characterIds: {}, admin: { adminId: 'ADM-' + uid().slice(-6), adminName: '' } }));
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
  data.tripName = b.tripName;
  data.participants = b.participants.slice();
  data.characterIds = { ...b.characterIds };
  data.admin = { ...(data.admin || {}), adminId: b.adminId, adminName: b.adminName, ownerHash: b.adminOwnerHash, urlLocked: true };
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
function renderBoards() {
  const rows = filtered(draft.boards.filter(b => !b.deleted), ['urlId', 'tripName', 'adminId', 'adminName']).map(b => `
    <tr>
      <td><input class="field small" value="${h(b.urlId)}" oninput="updateBoard(${q(b.originalId)},{urlId:this.value.trim()})"></td>
      <td><input class="field" value="${h(b.tripName)}" oninput="updateBoard(${q(b.originalId)},{tripName:this.value})"></td>
      <td><input class="field small" value="${h(b.adminId)}" oninput="updateBoard(${q(b.originalId)},{adminId:this.value})"></td>
      <td><input class="field" value="${h(b.adminName)}" oninput="updateBoard(${q(b.originalId)},{adminName:this.value})"></td>
      <td><input class="field" type="password" placeholder="ตั้งรหัสใหม่" oninput="updateBoard(${q(b.originalId)},{newPassword:this.value})"></td>
      <td><span class="pill">${b.participants.length}</span> <button class="btn" onclick="addUser(${q(b.originalId)})">+ User</button></td>
      <td><button class="btn danger" onclick="deleteBoard(${q(b.originalId)})">ลบ</button></td>
    </tr>`).join('');
  return panel('Boards / Trips', `<div class="toolbar"><input class="search" placeholder="ค้นหา board/admin" value="${h(query)}" oninput="query=this.value;render()"><button class="btn primary" onclick="addBoard()">+ เพิ่ม Board</button></div><table><thead><tr><th>URL</th><th>ชื่อ Board</th><th>Admin ID</th><th>ชื่อเล่น Admin</th><th>Reset Password</th><th>Users</th><th></th></tr></thead><tbody>${rows}</tbody></table>`);
}
function renderAdmins() {
  const rows = filtered(adminGroups(), ['adminId', 'adminName', 'key']).map(g => `
    <tr>
      <td><input class="field small" value="${h(g.adminId)}" oninput="updateAdminGroup(${q(g.key)},{adminId:this.value})"></td>
      <td><input class="field" value="${h(g.adminName)}" oninput="updateAdminGroup(${q(g.key)},{adminName:this.value})"></td>
      <td class="muted">${h(g.key)}</td>
      <td>${g.boards.map(b => `<span class="pill">${h(b.urlId)}</span>`).join(' ')}</td>
    </tr>`).join('');
  return panel('Board Admins', `<div class="toolbar"><input class="search" placeholder="ค้นหา admin" value="${h(query)}" oninput="query=this.value;render()"></div><table><thead><tr><th>ID</th><th>ชื่อเล่น</th><th>Owner Hash</th><th>Boards</th></tr></thead><tbody>${rows}</tbody></table>`);
}
function renderUsers() {
  const rows = users().filter(u => !query || `${u.name} ${u.id} ${u.board.urlId}`.toLowerCase().includes(query.toLowerCase())).map(u => `
    <tr>
      <td>${h(u.board.urlId)}</td>
      <td>${h(u.name)}</td>
      <td><input class="field small" value="${h(u.id)}" maxlength="4" oninput="updateUser(${q(u.board.originalId)},${q(u.name)},this.value)"></td>
      <td><button class="btn danger" onclick="deleteUser(${q(u.board.originalId)},${q(u.name)})">ลบ</button></td>
    </tr>`).join('');
  return panel('Users', `<div class="toolbar"><input class="search" placeholder="ค้นหา user/board" value="${h(query)}" oninput="query=this.value;render()"></div><table><thead><tr><th>Board</th><th>ชื่อ</th><th>ID</th><th></th></tr></thead><tbody>${rows}</tbody></table>`);
}
function renderRevisions() {
  const revs = published.revisions || [];
  return panel('Version Control', revs.map(rev => `<details class="rev"><summary><span>${new Date(rev.createdAt).toLocaleString()} · ${(rev.changes || []).length} changes</span><span>${h(rev.author || '')}</span></summary><div class="rev-list">${(rev.changes || []).map(c => `<div class="change"><strong>${h(c.area)} <span class="pill">${h(c.action)}</span></strong><span>${h(c.detail)}</span></div>`).join('')}</div></details>`).join('') || '<div class="muted">ยังไม่มี revision</div>');
}
function panel(title, body) { return `<section class="panel"><div class="toolbar"><h2>${title}</h2></div>${body}</section>`; }
function renderMain() {
  const body = tab === 'admins' ? renderAdmins() : tab === 'users' ? renderUsers() : tab === 'revisions' ? renderRevisions() : renderBoards();
  const changes = diffBoards().length;
  document.getElementById('app').innerHTML = `<div class="shell">
    <div class="top"><div><h1>Admin Portal</h1><div class="sub">Phase 1 local portal · Phase 2 ต้องใส่ Firebase Auth/Rules</div></div><div class="actions"><span id="draft-badge" class="badge">${dirty ? 'Draft changed locally' : 'Published version'}</span><button class="btn" onclick="saveDraft()">Save</button><button class="btn warn" onclick="restoreDraft()">Restore</button><button id="publish-btn" class="btn primary" onclick="publishDraft()">Publish ${changes ? `(${changes})` : ''}</button><button class="btn" onclick="lockGate()">Lock</button></div></div>
    <div class="notice">Phase 1: local gate ยังไม่ใช่ security จริง ห้ามถือว่าเป็นการกันคนนอกจนกว่าจะมี Firebase Auth และ Security Rules</div>
    <div class="grid"><aside class="side"><div class="nav">${['boards','admins','users','revisions'].map(x => `<button class="${tab === x ? 'on' : ''}" onclick="tab='${x}';query='';render()">${x === 'boards' ? 'Boards' : x === 'admins' ? 'Board Admins' : x === 'users' ? 'Users' : 'Version Control'}</button>`).join('')}</div><div class="stats"><div class="stat"><strong>${draft.boards.filter(b => !b.deleted).length}</strong>Boards</div><div class="stat"><strong>${adminGroups().length}</strong>Admins</div><div class="stat"><strong>${users().length}</strong>Users</div></div></aside>${body}</div>
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
