const PARAMS = new URLSearchParams(location.search);
const TEST_MODE = PARAMS.get('test') === '1';
const CHARACTER_ID = String(PARAMS.get('id') || '').replace(/\D/g, '').slice(0, 4);
const FROM_ADMIN = PARAMS.get('from') === 'admin';
const PRIVACY_KEY = 'pointy_character_profile_hide_money_v1';
const CLASSES = PointyLogic.CLASSES;
const SKIN_DEFS = {
  'archfiend-male': [
    { id: 'crimson-regent', res: 'crimson-regent-male' },
    { id: 'archfiend-swimmer', res: 'archfiend-swimmer-male' },
    { id: 'archfiend-swimmer-blackred', res: 'archfiend-swimmer-blackred-male' }
  ],
  'tiderunner-female': [
    { id: 'tiderunner-classic', res: 'tiderunner-classic-female' }
  ],
  'tiderunner-male': [
    { id: 'tiderunner-classic', res: 'tiderunner-classic-male' }
  ]
};

let hideMoney = PARAMS.get('private') === '1' || localStorage.getItem(PRIVACY_KEY) === '1';
let activeProfile = null;
const profileView = { expanded: new Set(['split', 'debt', 'compare', 'treasury']), allTrophies: false, boardDetails: {}, section: 'adventure' };
function profileIcon(name) { return window.CoinQuestIcons(name); }
function profileText(th, en) { return LANG === 'en' ? en : th; }
function moduleHref(path) { return `${path}${TEST_MODE ? (path.includes('?') ? '&' : '?') + 'test=1' : ''}`; }
function isOwnProfile(profile) {
  const account = accountStore();
  return !!account && String(account.character?.id || account.userId || '') === profile.id
    && (TEST_MODE || profile.record?.ownerUid === firebase.auth().currentUser?.uid);
}

function h(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function safeInternalPath(value, fallback = '/') {
  const path = String(value || '').trim();
  if (!path || !path.startsWith('/') || path.startsWith('//')) return fallback;
  return path;
}
function returnHref() {
  const fallback = FROM_ADMIN ? `/admin/${TEST_MODE ? '?test=1&tab=users' : '?tab=users'}` : '/';
  return safeInternalPath(PARAMS.get('return'), fallback);
}
function money(n) { return '฿' + Math.round(Number(n) || 0).toLocaleString(); }
function dateLabel(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleString(LANG === 'en' ? 'en-US' : 'th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}
function classLabel(id) {
  const cls = CLASSES[PointyLogic.normalizeClass(id)] || CLASSES.warrior;
  return cls[LANG] || cls.th || cls.en;
}
function assetUrl(path) { return window.PointyAssets ? window.PointyAssets.url(path) : `/${String(path).replace(/^\/+/, '')}`; }
function portraitFile(res) {
  return assetUrl(`assets/rpg-portraits/${res}.png`);
}
function avatarId(clsId, gender) { return `${PointyLogic.normalizeClass(clsId)}-${gender === 'female' ? 'female' : 'male'}`; }
function resolveAvatarFile(clsId, gender, skinId = '') {
  const base = avatarId(clsId, gender);
  const found = (SKIN_DEFS[base] || []).find(sk => sk.id === skinId);
  return portraitFile(found?.res || base);
}
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
function tripUrl(id) {
  const url = `/trip/?id=${encodeURIComponent(id)}`;
  return TEST_MODE ? `${url}&test=1` : url;
}
function profileUrl(id = CHARACTER_ID) {
  const params = new URLSearchParams({ id: String(id || '') });
  if (TEST_MODE) params.set('test', '1');
  if (FROM_ADMIN) {
    params.set('from', 'admin');
    params.set('return', returnHref());
  }
  return `/character/?${params.toString()}`;
}
function readJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}
function readScopedJson(key, fallback = null) {
  return window.PointyScope?.getJSON ? window.PointyScope.getJSON(key, fallback) : readJson(key, fallback);
}
function freshFirestoreGet(refOrQuery) {
  if (TEST_MODE) return refOrQuery.get();
  return window.PointyFirebase?.freshGet
    ? window.PointyFirebase.freshGet(refOrQuery)
    : refOrQuery.get({ source: 'server' });
}
function profileStore() {
  return { streak: 0, bestStreak: 0, ...readScopedJson('pointy_profile_v1', {}) };
}
function accountStore() {
  return readJson('pointy_auth_v1', null);
}
function localCharacterRegistry() {
  return readScopedJson('pointy_character_registry_v1', {}) || {};
}
function activeAccountCharacter(id) {
  const account = accountStore();
  const character = account?.character || null;
  const charId = String(character?.id || account?.userId || '').replace(/\D/g, '').slice(0, 4);
  if (!character || charId !== String(id || '')) return null;
  return {
    id: charId,
    name: character.name || account.name || 'Hero',
    class: character.class || character.cls || 'warrior',
    cls: character.cls || character.class || 'warrior',
    gender: character.gender === 'female' ? 'female' : 'male',
    skin: character.skin || ''
  };
}
async function loadCharacterRecord(id) {
  const local = { ...(activeAccountCharacter(id) || {}), ...(localCharacterRegistry()[id] || {}) };
  if (TEST_MODE) return { id, ...local };
  initFirebase();
  try {
    const snap = await freshFirestoreGet(firebase.firestore().collection('characters').doc(id));
    return snap.exists ? { ...local, ...snap.data(), id } : { id };
  } catch (err) {
    console.warn('Character profile record load failed', err);
    throw err;
  }
}
async function loadBoards() {
  if (TEST_MODE) {
    return Object.keys(sessionStorage)
      .filter(key => key.startsWith('pointy_test_trip_'))
      .map(key => {
        try {
          const id = key.replace('pointy_test_trip_', '');
          return { id, data: JSON.parse(sessionStorage.getItem(key) || '{}') };
        } catch (_) {
          return null;
        }
      })
      .filter(Boolean);
  }
  initFirebase();
  const snap = await freshFirestoreGet(firebase.firestore().collection('trips'));
  return snap.docs.map(doc => ({ id: doc.id, data: doc.data() || {} }));
}
function copy() {
  const en = LANG === 'en';
  return en ? {
    title: 'Character Profile',
    back: 'Back',
    lvl: 'Character level',
    renown: 'XP',
    streakDays: 'days',
    streakLab: 'Day streak',
    best: 'Best',
    today: 'Checked in today 🔥',
    stats: '📊 Adventure Stats',
    trophies: '🏆 Trophy Hall',
    mPL: 'Party Ledger',
    mDD: 'Debt Dragon',
    mPA: 'Price Arena',
    mTR: 'Treasury',
    quests: 'Quests',
    logged: 'Logged',
    fronted: 'Fronted',
    settled: 'Quests done',
    slain: 'Slain',
    strikes: 'Strikes',
    reclaimed: 'Reclaimed',
    live: 'Remaining',
    showdowns: 'Showdowns',
    merchants: 'Merchants',
    deal: 'Best deal',
    months: 'Months won',
    tlog: 'Expenses',
    disc: 'Discipline XP',
    userId: 'User ID',
    actions: 'Profile tools',
    myBoards: 'My Boards',
    boardsSub: 'Boards you administer',
    code: 'Code',
    created: 'Created',
    updated: 'Updated',
    members: 'Members',
    copyInvite: 'Copy invite',
    copied: 'Copied!',
    archive: 'Archive',
    restore: 'Restore',
    active: 'Active',
    archived: 'Archived',
    cantDelete: 'Only a Super Admin can delete a board permanently.'
  } : {
    title: 'โปรไฟล์ตัวละคร',
    back: 'กลับ',
    lvl: 'เลเวลตัวละคร',
    renown: 'XP',
    streakDays: 'วัน',
    streakLab: 'สตรีคต่อเนื่อง',
    best: 'สถิติ',
    today: 'เข้าเล่นแล้ววันนี้ 🔥',
    stats: '📊 สถิติการผจญภัย',
    trophies: '🏆 หอเกียรติยศ',
    mPL: 'แบ่งค่าใช้จ่าย',
    mDD: 'มังกรหนี้',
    mPA: 'เปรียบราคา',
    mTR: 'คลังหลวง',
    quests: 'เควส',
    logged: 'บันทึก',
    fronted: 'ออกทอง',
    settled: 'เควสจบ',
    slain: 'ปราบแล้ว',
    strikes: 'ฟัน',
    reclaimed: 'กอบกู้',
    live: 'เหลือ',
    showdowns: 'สังเวียน',
    merchants: 'ร้าน',
    deal: 'ดีลสูงสุด',
    months: 'เดือนชนะ',
    tlog: 'รายจ่าย',
    disc: 'XP วินัย',
    userId: 'User ID',
    actions: 'เครื่องมือโปรไฟล์',
    myBoards: 'บอร์ดของฉัน',
    boardsSub: 'บอร์ดที่คุณเป็นแอดมิน',
    code: 'รหัส',
    created: 'สร้างเมื่อ',
    updated: 'อัปเดต',
    members: 'สมาชิก',
    copyInvite: 'คัดลอกคำเชิญ',
    copied: 'คัดลอกแล้ว!',
    archive: 'เก็บเข้าคลัง',
    restore: 'นำกลับมา',
    active: 'ใช้งานอยู่',
    archived: 'เก็บคลังแล้ว',
    cantDelete: 'ลบถาวรได้เฉพาะผู้ดูแลระบบ (Super Admin)'
  };
}
function navMarkup() {
  return `<cq-player-header profile></cq-player-header>${FROM_ADMIN ? `<div class="cq-context-back"><a href="${h(returnHref())}">&larr; ${h(copy().back)}</a></div>` : ''}`;
}
function renderSearch(message = '') {
  document.getElementById('app').innerHTML = `${navMarkup()}<main class="wrap">
    <section class="search-card">
      <h1>${h(t('profile_title'))}</h1>
      <div class="sub">${h(message || t('profile_search_hint'))}</div>
      <div class="search-row"><input id="profile-id-input" aria-label="${h(t('character_id'))}" inputmode="numeric" maxlength="4" placeholder="${h(t('character_id'))}" onkeydown="if(event.key==='Enter')openProfileSearch()"><button class="cback" onclick="openProfileSearch()">${h(t('profile_open'))}</button></div>
    </section>
    <cq-footer></cq-footer>
  </main>`;
  window.CoinQuestMobileShell?.refresh();
}
function switchProfileLanguage() {
  setProfileLanguage(LANG === 'th' ? 'en' : 'th');
}
function setProfileLanguage(next) {
  LANG = next === 'en' ? 'en' : 'th';
  document.documentElement.lang = LANG;
  localStorage.setItem('lang', LANG);
  if (activeProfile) renderProfile(activeProfile);
  else renderSearch();
  document.querySelector(matchMedia('(max-width:600px)').matches ? '.cq-lang-compact' : '.lang-active')?.focus({ preventScroll:true });
}
function openProfileSearch() {
  const id = String(document.getElementById('profile-id-input')?.value || '').trim();
  if (!/^\d{4}$/.test(id)) { renderSearch(t('profile_invalid')); return; }
  location.href = profileUrl(id);
}
function toggleMoney() {
  hideMoney = !hideMoney;
  localStorage.setItem(PRIVACY_KEY, hideMoney ? '1' : '0');
  const url = new URL(location.href);
  if (hideMoney) url.searchParams.set('private', '1');
  else url.searchParams.delete('private');
  history.replaceState(null, '', url.pathname + url.search);
  if (activeProfile) renderProfile(activeProfile);
  document.querySelector('[onclick="toggleMoney()"]')?.focus({ preventScroll:true });
}
async function copyProfileLink() {
  try {
    await navigator.clipboard.writeText(location.href);
    const label = document.querySelector('#copy-profile-btn span');
    if (label) label.textContent = t('profile_copied');
    setTimeout(() => { if (label?.isConnected) label.textContent = t('profile_copy_link'); }, 1600);
  } catch (_) {
    document.getElementById('profile-status').textContent = profileText('คัดลอกไม่สำเร็จ กรุณาคัดลอกลิงก์จากแถบที่อยู่', 'Could not copy. Copy the link from the address bar.');
  }
}
function boardInviteUrl(id) {
  return `${location.origin}${tripUrl(id)}`;
}
function copyBoardInvite(id) {
  navigator.clipboard?.writeText(boardInviteUrl(id)).then(() => {
    const button = document.querySelector(`[data-board-copy="${CSS.escape(String(id))}"]`);
    if (!button) return;
    const old = button.textContent;
    button.textContent = copy().copied;
    setTimeout(() => { if (button) button.textContent = old; }, 1200);
  }).catch(() => {});
}
async function setBoardArchived(id, archived) {
  if (!activeProfile?.managedBoardIds?.includes(String(id))) return;
  if (TEST_MODE) {
    const key = `pointy_test_trip_${id}`;
    const data = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (data) {
      sessionStorage.setItem(key, JSON.stringify({ ...data, archived: !!archived, updatedAt: Date.now() }));
    }
    boot();
    return;
  }
  initFirebase();
  try {
    await firebase.firestore().collection('trips').doc(String(id)).set({ archived: !!archived, updatedAt: Date.now() }, { merge: true });
    boot();
  } catch (_) {
    const status = document.getElementById('profile-status');
    if (status) status.textContent = profileText('เปลี่ยนสถานะบอร์ดไม่สำเร็จ กรุณาลองอีกครั้ง', 'Could not update the board. Please try again.');
  }
}
function moneyText(value) {
  return hideMoney ? '••••' : money(value);
}
function stat(n, l, moneyValue = false) {
  return `<div class="ms"><span class="ms-n ${moneyValue ? 'money' : ''}">${h(moneyValue && hideMoney ? '••••' : n)}</span><span class="ms-l">${h(l)}</span></div>`;
}
function badgeIcon(id) {
  const asset = { veteran:'camp', 'board-admin':'key', 'high-level':'crown' }[id];
  return asset ? `<img src="/assets/split-entry/${asset}.svg" alt="">` : profileIcon({ 'party-member':'compass', treasurer:'coin', 'debt-slayer':'shield', 'debt-dragon':'debt' }[id] || 'star');
}
function badgeCopy(badge, profile) {
  const en = LANG === 'en';
  const copy = {
    'party-member': [en ? 'Party Member' : 'สมาชิกปาร์ตี้', en ? 'Joined the first board' : 'เข้าร่วมบอร์ดแรกแล้ว'],
    veteran: [en ? 'Veteran Traveler' : 'นักเดินทางรุ่นเก๋า', `${profile.totals.boards} ${en ? 'boards' : 'บอร์ด'}`],
    treasurer: [en ? 'Treasurer' : 'เหรัญญิก', en ? 'Funded the party' : 'ออกทองช่วยปาร์ตี้'],
    'debt-slayer': [en ? 'Debt Slayer' : 'ผู้ปราบหนี้', en ? 'Reached a settled board' : 'ชำระยอดค้างในบอร์ดครบแล้ว'],
    'board-admin': [en ? 'Board Admin' : 'แอดมินบอร์ด', `${profile.adminBoards.length} ${en ? 'boards' : 'บอร์ด'}`],
    'debt-dragon': [en ? 'Dragon Slayer' : 'นักล่ามังกร', badge.detail],
    'high-level': [en ? 'Seasoned Hero' : 'ฮีโร่ชำนาญศึก', `Level ${profile.level.lvl}`]
  }[badge.id];
  return copy || [badge.label, badge.detail];
}
function trophyList(profile) {
  const byId = new Map(profile.badges.map(b => [b.id, b]));
  const defs = [
    { id: 'party-member', icon: '🧭', prog: [Math.min(profile.totals.boards, 1), 1], test: () => profile.totals.boards >= 1 },
    { id: 'veteran', icon: '🏕️', prog: [Math.min(profile.totals.boards, 5), 5], test: () => profile.totals.boards >= 5 },
    { id: 'treasurer', icon: '💰', prog: [Math.min(Math.round(profile.totals.fronted), 1000), 1000], test: () => profile.totals.fronted >= 1000 },
    { id: 'debt-slayer', icon: '⚔️', prog: [Math.min(profile.totals.settledBoards, 1), 1], test: () => profile.totals.settledBoards >= 1 },
    { id: 'board-admin', icon: '🗝️', prog: [Math.min(profile.adminBoards.length, 1), 1], test: () => profile.adminBoards.length > 0 },
    { id: 'debt-dragon', icon: '🐉', prog: [Math.min(Number(profile.record?.debtXp) || 0, 1), 1], test: () => Number(profile.record?.debtXp) > 0 },
    { id: 'high-level', icon: '👑', prog: [Math.min(profile.level.lvl, 5), 5], test: () => profile.level.lvl >= 5 }
  ];
  return defs.map(def => {
    const existing = byId.get(def.id) || { id: def.id, detail: '' };
    const label = badgeCopy(existing, profile);
    return { ...def, label, unlocked: def.test(), progress: def.prog };
  });
}
function renderTrophies(profile) {
  const trophies = trophyList(profile);
  return trophies.sort((a,b) => Number(b.unlocked) - Number(a.unlocked)).map(item => {
    const pct = item.progress?.[1] ? Math.round((item.progress[0] / item.progress[1]) * 100) : 0;
    return `<div class="tr ${item.unlocked ? 'got' : 'locked'}">
      <div class="tr-ic">${item.unlocked ? badgeIcon(item.id) : '<svg class="cq-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 10V7a6 6 0 0 1 12 0v3h2v12H4V10Zm3 0h6V7a3 3 0 0 0-6 0Zm2 4v4h2v-4Z"/></svg>'}</div>
      <div style="flex:1;min-width:0">
        <div class="tr-t">${h(item.label[0])}</div>
        <div class="tr-d">${h(item.label[1])}</div>
        ${!item.unlocked && item.progress && item.progress[1] > 1 ? `<div class="tr-prog"><i style="width:${pct}%"></i></div>` : ''}
      </div>
      ${item.unlocked ? '<span class="tr-check">&#10003;</span>' : ''}
    </div>`;
  }).join('');
}
function renderBoards(profile) {
  return profile.boards.map(board => `<div class="board">
    <div>
      <div class="board-title"><a href="${h(tripUrl(board.id))}">${h(board.tripName)}</a></div>
      <div class="board-meta">#${h(board.id)} · ${h(board.name)} · ${h(classLabel(board.class))} · ${board.quests} ${h(t('profile_quests'))} · ${h(board.settled ? t('profile_settled') : t('profile_active'))} · ${h(dateLabel(board.updatedAt))}</div>
    </div>
    <div class="board-money">
      <div class="money">${hideMoney ? '••••' : money(board.share)}</div>
      <div class="${board.balance >= 0 ? 'pos' : 'neg'} money">${hideMoney ? '••••' : `${board.balance >= 0 ? '+' : '-'}${money(Math.abs(board.balance))}`}</div>
    </div>
  </div>`).join('');
}
function renderAdminBoards(profile) {
  const c = copy();
  if (!profile.adminBoards.length) return `<div class="empty">${h(t('profile_no_admin_boards'))}</div>`;
  return profile.adminBoards.map(board => `<div class="board my-board ${board.archived ? 'arch' : ''}">
    <div class="bd-top">
      <div class="bd-crest"><img src="/assets/split-entry/camp.svg" alt=""></div>
      <div class="bd-main">
        <div class="board-title"><a href="${h(tripUrl(board.id))}">${h(board.tripName)}</a></div>
        <div class="board-meta">${h(c.code)} ${h(board.id)} · ${h(board.adminName || '-')}</div>
      </div>
      <span class="bd-status ${board.archived ? 'arch' : ''}">${h(board.archived ? c.archived : c.active)}</span>
    </div>
    <details class="board-details" ${(profileView.boardDetails[board.id] ?? matchMedia('(min-width:1024px)').matches) ? 'open' : ''} ontoggle="profileView.boardDetails['${h(board.id)}']=this.open"><summary>${profileText('รายละเอียดและจัดการบอร์ด', 'Board details and actions')} ${profileIcon('chevron')}</summary><div class="bd-meta">
      <div><span>${h(c.created)}</span><b>${h(dateLabel(board.createdAt))}</b></div>
      <div><span>${h(c.updated)}</span><b>${h(dateLabel(board.updatedAt))}</b></div>
      <div><span>${h(c.members)}</span><b>${Number(board.members) || 0}</b></div>
    </div>
    <div class="bd-actions">
      <a class="btn" href="${h(tripUrl(board.id))}">${h(t('profile_open_board'))}</a>
      <button class="btn" type="button" data-board-copy="${h(board.id)}" onclick="copyBoardInvite('${h(board.id)}')">🔗 ${h(c.copyInvite)}</button>
      ${profile.managedBoardIds?.includes(String(board.id)) ? `<button class="btn ${board.archived ? '' : 'danger'}" type="button" onclick="setBoardArchived('${h(board.id)}', ${board.archived ? 'false' : 'true'})">${board.archived ? '♻️ ' + h(c.restore) : '🗄️ ' + h(c.archive)}</button>` : ''}
    </div>
    </details>
  </div>`).join('');
}
function toggleProfileTheme() {
  const theme = document.documentElement.dataset.theme === 'dungeon' ? 'tavern' : 'dungeon';
  localStorage.setItem('pointy_theme', theme);
  document.documentElement.dataset.theme = theme; document.body.dataset.theme = theme;
  if (activeProfile) renderProfile(activeProfile); else renderSearch();
  document.querySelector('[data-profile-theme]')?.focus({ preventScroll:true });
}
function toggleModule(id, button) {
  const expanded = button.getAttribute('aria-expanded') !== 'true';
  if (expanded) profileView.expanded.add(id); else profileView.expanded.delete(id);
  button.setAttribute('aria-expanded', String(expanded));
  document.getElementById(`stats-${id}`).hidden = !expanded;
}
function toggleTrophies(button) {
  profileView.allTrophies = !profileView.allTrophies;
  document.querySelector('.trophies').classList.toggle('show-all', profileView.allTrophies);
  button.setAttribute('aria-expanded', String(profileView.allTrophies));
  button.textContent = profileView.allTrophies ? profileText('ย่อรายการ ↑', 'Show less ↑') : profileText('ดูทั้งหมด →', 'View all →');
}
function setProfileSection(id) {
  profileView.section = id;
  document.querySelectorAll('.section-nav a').forEach(link => {
    if (link.hash === `#${id}`) link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  });
}
const profileTablet = matchMedia('(min-width:601px) and (max-width:1023px)');
function arrangeProfilePanels() {
  const grid = document.querySelector('.profile-grid');
  if (!grid) return;
  const panels = ['adventure','achievements','account','profile-tools-panel','history','boards'].map(id => document.getElementById(id));
  // Keep reading/focus order equal to visual order; tablet uses two independent columns.
  if (!profileTablet.matches) { grid.replaceChildren(...panels); return; }
  const columns = [[panels[0],panels[2],panels[3]],[panels[1],panels[4],panels[5]]].map(items => {
    const column = document.createElement('div'); column.className = 'profile-column'; column.append(...items); return column;
  });
  grid.replaceChildren(...columns);
}
profileTablet.addEventListener('change', arrangeProfilePanels);
function renderModule(id, icon, label, contents, href) {
  const expanded = profileView.expanded.has(id);
  return `<article class="mod mod-${id}"><h3><button type="button" class="mod-h" aria-expanded="${expanded}" aria-controls="stats-${id}" onclick="toggleModule('${id}',this)">${profileIcon(icon)}<span>${h(label)}</span>${profileIcon('chevron')}</button></h3>
    <div id="stats-${id}" ${expanded ? '' : 'hidden'}><div class="mod-stats">${contents}</div><a class="mod-link" href="${moduleHref(href)}">${profileText('ไปยังเกม', 'Open game')} ${profileIcon('arrow')}</a></div></article>`;
}
function renderProfile(profile) {
  activeProfile = profile;
  const c = copy(), own = isOwnProfile(profile);
  const rewardTitle = profile.reward.title?.[LANG] || profile.reward.title?.th || '';
  const store = profile.activity || (own ? profileStore() : {});
  const account = own ? accountStore() : null;
  const trophies = trophyList(profile), got = trophies.filter(item => item.unlocked).length;
  const metrics = profile.moduleProgress;
  const label = (th, en) => profileText(th,en);
  const sections = [['adventure','shield',label('สถิติ','Stats')],['achievements','trophy',label('รางวัล','Awards')],['account','profile',label('บัญชี','Account')],['history','scroll',label('ประวัติ','History')],['boards','split',label('บอร์ด','Boards')]];
  document.body.classList.toggle('money-hidden', hideMoney);
  document.getElementById('app').innerHTML = `${navMarkup()}<main class="wrap">
    <section class="banner ${profile.displayName.length > 22 ? 'long-name' : ''}" aria-label="${h(c.title)}">
      <div class="banner-art portrait-stage"><img src="${h(resolveAvatarFile(profile.class, profile.gender, profile.skin))}" alt="${h(profile.displayName)}"></div>
      <div class="banner-grad"></div>
      <p class="hero-quote">${label('“วินัยเล็ก ๆ ในวันนี้<br>สร้างการผจญภัยที่ยิ่งใหญ่ในวันข้างหน้า”','“Small steps today.<br>Brighter adventures tomorrow.”')}</p>
      <div class="banner-meta"><h1 class="banner-name">${h(profile.displayName)}</h1><div class="hero-identity"><span class="banner-rank">${h(profile.reward.glyph || '')} ${h(rewardTitle)} · ${h(classLabel(profile.class))}</span><span class="char-id">#${h(profile.id)}</span></div></div>
      <div class="hero-standard" aria-hidden="true"><svg viewBox="0 0 80 100"><g fill="none" stroke="currentColor" stroke-linecap="round"><path stroke-width="2.2" d="M32 95q12-16 8-69M40 70Q18 68 10 44m30 23q25-5 31-29M40 53Q23 43 24 24m17 28Q58 35 54 20M40 34l-6-17m7 17 6-18M27 95q14-7 27 0"/><path d="m16 55-9 1m11 1-3-13m10 19-1-12m-6-3-9-9m54 15 10 1m-13 6 1-15m6-1 9-12m-9 9 1-13M31 44l-9-4m7-4 2-10m18 17 12-4m-7-7 8-10M38 81l-16-6m19 6 17-10"/><path d="M9 34q-6-7 1-10 7 3-1 10Zm10-10q-5-8 3-9 6 5-3 9Zm45-4q-6-7 1-10 7 3-1 10ZM7 68q-6-6 1-10 7 4-1 10Zm64-5q-6-7 1-10 7 3-1 10Z" fill="currentColor"/></g><path d="m40 4 2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1Z" fill="currentColor"/></svg><span>Disciplined<br>Today<br>Richer<br>Tomorrow</span></div>
      <div class="hero-level"><span class="level-emblem">${profileIcon('shield')}</span><div class="level-title"><strong>Lv. ${profile.level.lvl}</strong><span>${label('นักสำรวจการเงิน','Financial adventurer')}</span></div><div class="level-progress"><b>${profile.level.into.toLocaleString()} / ${profile.level.need.toLocaleString()} XP</b><div class="ci-bar" role="progressbar" aria-label="XP" aria-valuenow="${profile.level.into}" aria-valuemin="0" aria-valuemax="${profile.level.need}"><div style="width:${profile.level.pct}%"></div></div></div></div>
    </section>
    <div class="profile-content">
      <section class="ribbon summary" aria-label="${label('สรุปข้อมูลตัวละคร','Character summary')}">
        ${[['shield',profile.level.lvl,c.lvl,''],['star',profile.xp.toLocaleString(),c.renown,''],['flame',store.streak ?? '—',c.streakLab, store.bestStreak == null ? '' : `${c.best} ${store.bestStreak} ${c.streakDays}`],['coins',moneyText(profile.totals.paid),t('profile_paid'),'money']].map(([icon,n,l,sub]) => `<div class="rib">${profileIcon(icon)}<div><div class="rib-n ${sub === 'money' ? 'money' : ''}">${h(n)}</div><div class="rib-l">${h(l)}</div>${sub && sub !== 'money' ? `<small>${h(sub)}</small>` : ''}</div></div>`).join('')}
        <aside class="daily-note"><span>${profileIcon('compass')}</span><p>${label('ทุกก้าวเล็ก ๆ<br>คือจุดเริ่มต้นของการเดินทาง','Every small step<br>starts a new adventure')}</p></aside>
      </section>
      <nav class="section-nav" aria-label="${label('ส่วนต่าง ๆ ของโปรไฟล์','Profile sections')}">${sections.map(([id,icon,title]) => `<a href="#${id}" ${profileView.section === id ? 'aria-current="location"' : ''} onclick="setProfileSection('${id}')">${profileIcon(icon)}${title}</a>`).join('')}</nav>
      <div class="profile-grid grid"><div class="profile-column profile-left">
        <section class="panel adventure-panel" id="adventure"><div class="panel-head"><h2>${profileIcon('shield')}${h(c.stats.replace('📊 ',''))}</h2></div><div class="mods">
          ${renderModule('split','split',c.mPL,stat(profile.totals.quests,c.quests)+stat(moneyText(profile.totals.paid),c.logged,true)+stat(moneyText(profile.totals.fronted),c.fronted,true)+stat(profile.totals.settledBoards,c.settled),'/trip/')}
          ${renderModule('debt','debt',c.mDD,stat(metrics?.slain ?? '—',c.slain)+stat(Number(profile.record?.debtXp)||0,'XP')+stat(metrics ? moneyText(metrics.reclaimed) : '—',c.reclaimed,true)+stat(metrics?.liveDragons ?? '—',c.live),'/debt/')}
          ${renderModule('compare','compare',c.mPA,stat(metrics?.showdowns ?? '—',c.showdowns)+stat(metrics?.merchants ?? '—',c.merchants)+stat(metrics ? `${metrics.bestRescue}%` : '—',c.deal),'/?view=compare')}
          ${renderModule('treasury','treasury',c.mTR,stat(metrics?.monthsWon ?? '—',c.months)+stat(metrics?.trLogged ?? '—',c.tlog)+stat(metrics?.treasuryReputation ?? '—',c.disc),'/treasury/')}
        </div></section>
        <section class="panel account-panel" id="account"><div class="panel-head"><h2>${profileIcon('profile')}${label('ข้อมูลบัญชี','Account information')}</h2></div><div class="acct"><div class="acct-ava"><img src="${h(resolveAvatarFile(profile.class,profile.gender,profile.skin))}" alt=""></div><div class="acct-info"><b>${h(account?.name || profile.displayName)}</b>${account ? `<span>@${h(account.username || String(account.email || '').split('@')[0] || '')}</span>` : ''}<span>${h(c.userId)} : ${h(profile.id)}</span></div></div></section>
        <section id="profile-tools-panel" class="panel tools-panel" aria-label="${h(c.actions)}"><div class="panel-head"><h2>${label('จัดการโปรไฟล์','Profile tools')}</h2></div><div class="profile-tools"><button type="button" class="cback" onclick="toggleMoney()">${profileIcon('eye')}<span>${h(hideMoney ? t('profile_show_money') : t('profile_hide_money'))}</span></button><button type="button" id="copy-profile-btn" class="cback" onclick="copyProfileLink()">${profileIcon('link')}<span>${h(t('profile_copy_link'))}</span></button><a class="cback primary" href="${moduleHref('/trip/')}">${profileIcon('split')}<span>Party Ledger</span></a></div></section>
</div><div class="profile-column profile-right">
        <section class="panel awards-panel" id="achievements"><div class="panel-head"><h2>${profileIcon('trophy')}${h(c.trophies.replace('🏆 ',''))}</h2><span class="count">${got} / ${trophies.length}</span><button class="text-button" type="button" aria-expanded="${profileView.allTrophies}" aria-controls="trophy-list" onclick="toggleTrophies(this)">${profileView.allTrophies ? label('ย่อรายการ ↑','Show less ↑') : label('ดูทั้งหมด →','View all →')}</button></div><div id="trophy-list" class="trophies badges ${profileView.allTrophies ? 'show-all' : ''}">${renderTrophies(profile)}</div></section>
        <section class="panel history-panel" id="history"><div class="panel-head"><h2>${profileIcon('scroll')}${h(t('profile_board_history'))}</h2><span class="muted">${h(t('profile_records',{n:profile.boards.length}))}</span></div><div class="board-list">${profile.boards.length ? renderBoards(profile) : `<div class="empty">${h(t('profile_no_boards'))}<a class="text-button" href="${moduleHref('/trip/')}">${label('เริ่มปาร์ตี้แรก →','Start your first party →')}</a></div>`}</div></section>
        <section class="panel owned-panel" id="boards"><div class="panel-head"><h2>${profileIcon('split')}${own ? h(c.myBoards) : label('บอร์ดที่ดูแล','Managed boards')}</h2><span class="muted">${profile.adminBoards.length} ${label('บอร์ด','boards')}</span></div><div class="board-list">${renderAdminBoards(profile)}</div></section>
      </div></div><p id="profile-status" role="status" aria-live="polite"></p>
      <cq-footer></cq-footer>
    </div>
  </main>`;
  arrangeProfilePanels();
  window.CoinQuestMobileShell?.refresh();
}
async function boot() {
  const releaseEntry = window.CoinQuestLoading?.begin();
  try {
    document.documentElement.lang = LANG;
    if (!CHARACTER_ID || CHARACTER_ID.length !== 4) { renderSearch(); return; }
    try {
      if (!TEST_MODE) {
        initFirebase();
        const user = await new Promise((resolve, reject) => { const unsubscribe = firebase.auth().onAuthStateChanged(value => { unsubscribe(); resolve(value); }, reject); });
        if (!user) { renderSearch(LANG === 'en' ? 'Sign in from Home to open profiles.' : 'เข้าสู่ระบบจากหน้าหลักก่อนเปิดโปรไฟล์'); return; }
      }
      const [record, boards] = await Promise.all([loadCharacterRecord(CHARACTER_ID), loadBoards()]);
      const profile = PointyLogic.buildCharacterProfile(CHARACTER_ID, boards, record, { lang: LANG, boardFallback: LANG === 'en' ? 'Untitled board' : 'บอร์ดไม่มีชื่อ' });
      const uid = TEST_MODE ? accountStore()?.uid : firebase.auth().currentUser?.uid;
      profile.managedBoardIds = boards.filter(board => uid && board.data?.access?.ownerUids?.includes(uid)).map(board => String(board.id));
      if (!TEST_MODE && record.ownerUid === firebase.auth().currentUser?.uid) {
        const uid = record.ownerUid; const [modules, user] = await Promise.all([freshFirestoreGet(firebase.firestore().collection('playerModules').doc(uid)), freshFirestoreGet(firebase.firestore().collection('users').doc(uid))]);
        const data = modules.data() || {};
        profile.activity = user.data()?.activity || profileStore();
        profile.moduleProgress = PointyLogic.playerProgress(boards, { id: CHARACTER_ID, name: record.name }, { debt: PointyLogic.normalizeDebtState({ dragons: [], ...(data.debt || {}) }), treasury: data.treasury || {}, comparisons: data.comparisons || [] }, { streak: profile.activity.streak });
      }
      if (!record.name && !profile.boards.length) { renderSearch(t('profile_not_found', { id: CHARACTER_ID })); return; }
      renderProfile(profile);
    } catch (err) {
      console.error(err);
      renderSearch(t('profile_load_failed'));
    }
  } finally { releaseEntry?.(); }
}
boot();
