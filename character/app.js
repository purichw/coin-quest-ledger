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
function avatarBg(clsId) {
  const hue = (CLASSES[PointyLogic.normalizeClass(clsId)] || CLASSES.warrior).hue;
  return `radial-gradient(125% 92% at 50% 16%, oklch(0.52 0.08 ${hue}), oklch(0.20 0.045 ${hue}) 78%)`;
}
function assetUrl(path) { return window.PointyAssets ? window.PointyAssets.url(path) : `/${String(path).replace(/^\/+/, '')}`; }
const LOCAL_PORTRAITS = new Set(['tiderunner-female', 'tiderunner-male', 'tiderunner-classic-female', 'tiderunner-classic-male']);
function portraitFile(res) {
  const path = `assets/rpg-portraits/${res}.png`;
  if (LOCAL_PORTRAITS.has(res) && window.PointyAssets?.local) return window.PointyAssets.local(path);
  return assetUrl(path);
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
    const snap = await firebase.firestore().collection('characters').doc(id).get();
    return snap.exists ? { ...local, ...snap.data(), id } : { id, ...local };
  } catch (err) {
    console.warn('Character profile record load failed', err);
    return { id, ...local };
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
  const snap = await firebase.firestore().collection('trips').get();
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
  const c = copy();
  return `<nav class="cnav">
    <a class="cback" href="${h(returnHref())}">&larr; ${h(c.back)}</a>
    <span class="cnav-title brand">${h(c.title)}</span>
    <div class="lang">
      <button type="button" class="${LANG === 'th' ? 'on' : ''}" onclick="setProfileLanguage('th')">TH</button>
      <button type="button" class="${LANG === 'en' ? 'on' : ''}" onclick="setProfileLanguage('en')">EN</button>
    </div>
  </nav>`;
}
function renderSearch(message = '') {
  document.getElementById('app').innerHTML = `${navMarkup()}<main class="wrap">
    <section class="search-card">
      <h1>${h(t('profile_title'))}</h1>
      <div class="sub">${h(message || t('profile_search_hint'))}</div>
      <div class="search-row"><input id="profile-id-input" inputmode="numeric" maxlength="4" placeholder="1234" onkeydown="if(event.key==='Enter')openProfileSearch()"><button class="cback" onclick="openProfileSearch()">${h(t('profile_open'))}</button></div>
    </section>
  </main>`;
}
function switchProfileLanguage() {
  setProfileLanguage(LANG === 'th' ? 'en' : 'th');
}
function setProfileLanguage(next) {
  LANG = next === 'en' ? 'en' : 'th';
  localStorage.setItem('lang', LANG);
  if (activeProfile) renderProfile(activeProfile);
  else renderSearch();
}
function openProfileSearch() {
  const id = String(document.getElementById('profile-id-input')?.value || '').replace(/\D/g, '').slice(0, 4);
  if (id.length !== 4) { renderSearch(t('profile_invalid')); return; }
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
}
function copyProfileLink() {
  navigator.clipboard?.writeText(location.href).then(() => {
    const button = document.getElementById('copy-profile-btn');
    if (!button) return;
    button.textContent = t('profile_copied');
    setTimeout(() => { if (button) button.textContent = t('profile_copy_link'); }, 1200);
  }).catch(() => {});
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
  if (TEST_MODE) {
    const key = `pointy_test_trip_${id}`;
    const data = readJson(key, null);
    if (data) {
      sessionStorage.setItem(key, JSON.stringify({ ...data, archived: !!archived, updatedAt: Date.now() }));
    }
    boot();
    return;
  }
  initFirebase();
  await firebase.firestore().collection('trips').doc(String(id)).set({ archived: !!archived, updatedAt: Date.now() }, { merge: true });
  boot();
}
function moneyText(value) {
  return hideMoney ? '••••' : money(value);
}
function stat(n, l, moneyValue = false) {
  return `<div class="ms"><span class="ms-n ${moneyValue ? 'money' : ''}">${h(moneyValue && hideMoney ? '••••' : n)}</span><span class="ms-l">${h(l)}</span></div>`;
}
function ribbon(n, l, moneyValue = false) {
  return `<div class="rib"><div class="rib-n ${moneyValue ? 'money' : ''}">${h(moneyValue && hideMoney ? '••••' : n)}</div><div class="rib-l">${h(l)}</div></div>`;
}
function badgeIcon(id) {
  return { 'party-member':'🧭', veteran:'🏕️', treasurer:'💰', 'debt-slayer':'⚔️', 'board-admin':'🗝️', 'debt-dragon':'🐉', 'high-level':'👑' }[id] || '✦';
}
function badgeCopy(badge, profile) {
  const en = LANG === 'en';
  const copy = {
    'party-member': [en ? 'Party Member' : 'สมาชิกปาร์ตี้', en ? 'Joined the first board' : 'เข้าร่วมบอร์ดแรกแล้ว'],
    veteran: [en ? 'Veteran Traveler' : 'นักเดินทางรุ่นเก๋า', `${profile.totals.boards} ${en ? 'boards' : 'บอร์ด'}`],
    treasurer: [en ? 'Treasurer' : 'เหรัญญิก', en ? 'Fronted plenty for the party' : 'ออกเงินแทนปาร์ตี้เยอะมาก'],
    'debt-slayer': [en ? 'Debt Slayer' : 'ผู้ปราบหนี้', en ? 'Reached a settled board' : 'เคลียร์บอร์ดสำเร็จแล้ว'],
    'board-admin': [en ? 'Board Admin' : 'แอดมินบอร์ด', `${profile.adminBoards.length} ${en ? 'boards' : 'บอร์ด'}`],
    'debt-dragon': [en ? 'Dragon Slayer' : 'นักล่ามังกร', badge.detail],
    'high-level': [en ? 'Seasoned Hero' : 'ฮีโร่ชำนาญศึก', `Level ${profile.level.lvl}`]
  }[badge.id];
  return copy || [badge.label, badge.detail];
}
function classColors(clsId) {
  const hue = (CLASSES[PointyLogic.normalizeClass(clsId)] || CLASSES.warrior).hue || 256;
  return {
    top: `oklch(0.60 0.16 ${hue})`,
    bottom: `oklch(0.33 0.12 ${hue})`,
    hue
  };
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
  return trophies.map(item => {
    const pct = item.progress?.[1] ? Math.round((item.progress[0] / item.progress[1]) * 100) : 0;
    return `<div class="tr ${item.unlocked ? 'got' : 'locked'}">
      <div class="tr-ic">${h(item.unlocked ? item.icon : '🔒')}</div>
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
      <div class="bd-crest">${board.archived ? '🗄️' : '🏕️'}</div>
      <div class="bd-main">
        <div class="board-title"><a href="${h(tripUrl(board.id))}">${h(board.tripName)}</a></div>
        <div class="board-meta">${h(c.code)} ${h(board.id)} · Admin ID ${h(board.adminId || '-')} · ${h(board.adminName || '-')}</div>
      </div>
      <span class="bd-status ${board.archived ? 'arch' : ''}">${h(board.archived ? c.archived : c.active)}</span>
    </div>
    <div class="bd-meta">
      <div><span>${h(c.created)}</span><b>${h(dateLabel(board.createdAt))}</b></div>
      <div><span>${h(c.updated)}</span><b>${h(dateLabel(board.updatedAt))}</b></div>
      <div><span>${h(c.members)}</span><b>${Number(board.members) || 0}</b></div>
    </div>
    <div class="bd-actions">
      <a class="btn" href="${h(tripUrl(board.id))}">${h(t('profile_open_board'))}</a>
      <button class="btn" type="button" data-board-copy="${h(board.id)}" onclick="copyBoardInvite('${h(board.id)}')">🔗 ${h(c.copyInvite)}</button>
      <button class="btn ${board.archived ? '' : 'danger'}" type="button" onclick="setBoardArchived('${h(board.id)}', ${board.archived ? 'false' : 'true'})">${board.archived ? '♻️ ' + h(c.restore) : '🗄️ ' + h(c.archive)}</button>
    </div>
  </div>`).join('');
}
function renderProfile(profile) {
  activeProfile = profile;
  const cls = CLASSES[profile.class] || CLASSES.warrior;
  const c = copy();
  const colors = classColors(profile.class);
  const rewardTitle = profile.reward.title?.[LANG] || profile.reward.title?.th || '';
  const store = profileStore();
  const account = accountStore();
  const trophies = trophyList(profile);
  const got = trophies.filter(item => item.unlocked).length;
  const debtXp = Number(profile.record?.debtXp) || 0;
  document.body.classList.toggle('money-hidden', hideMoney);
  document.getElementById('app').innerHTML = `${navMarkup()}<main class="wrap">
    <section class="banner" style="background:radial-gradient(125% 100% at 50% 8%, oklch(0.5 0.16 ${colors.hue}), oklch(0.17 0.07 ${colors.hue}) 88%)">
      <div class="banner-art portrait-stage">
        <img src="${h(resolveAvatarFile(profile.class, profile.gender, profile.skin))}" alt="${h(profile.displayName)}">
      </div>
      <div class="banner-grad"></div>
      <div class="banner-meta">
        <h1 class="banner-name">${h(profile.displayName)}</h1>
        <div class="banner-rank">${h(profile.reward.glyph || '')} ${h(rewardTitle)} &middot; ${h(classLabel(profile.class))}</div>
      </div>
    </section>

    <section class="idcard">
      <div class="ci-ava">
        <div class="ci-bg" style="background:linear-gradient(160deg, ${colors.top}, ${colors.bottom})"></div>
        <img src="${h(resolveAvatarFile(profile.class, profile.gender, profile.skin))}" alt="${h(profile.class)}">
        <span class="ci-badge">${h(cls.glyph)}</span>
      </div>
      <div class="ci-info portrait-info">
        <div class="ci-name">${h(profile.displayName)}</div>
        <div class="ci-rank">${h(profile.reward.glyph || '')} ${h(rewardTitle)} &middot; ${h(classLabel(profile.class))}</div>
        <span class="char-id">#${h(profile.id)}</span>
        <div class="ci-lvlrow">
          <span class="ci-lvl-k">${h(c.lvl)}</span>
          <span class="ci-lvl-n">${profile.level.lvl}</span>
          <span class="ci-renown">${profile.xp.toLocaleString()} ${h(c.renown)}</span>
        </div>
        <div class="ci-bar"><div style="width:${profile.level.pct}%"></div></div>
      </div>
    </section>

    <section class="ribbon summary">
      ${ribbon(profile.level.lvl, c.lvl)}
      ${ribbon(profile.xp.toLocaleString(), c.renown)}
      ${ribbon(store.streak || 0, c.streakLab)}
      ${ribbon(money(profile.totals.paid), t('profile_paid'), true)}
    </section>

    <section class="streak">
      <div class="streak-flame">🔥</div>
      <div>
        <div class="streak-n">${store.streak || 0} <span>${h(c.streakDays)}</span></div>
        <div class="streak-l">${h(c.streakLab)} &middot; ${h(c.best)} ${store.bestStreak || 0}</div>
      </div>
      <div class="streak-note">${h(c.today)}</div>
    </section>

    <div class="sec-h">${h(c.stats)}</div>
    <section class="mods">
      <div class="mod" style="--mc:#2f9e54">
        <div class="mod-h">&#9876;&#65039; ${h(c.mPL)}</div>
        <div class="mod-stats">
          ${stat(profile.totals.quests, c.quests)}
          ${stat(moneyText(profile.totals.paid), c.logged, true)}
          ${stat(moneyText(profile.totals.fronted), c.fronted, true)}
          ${stat(profile.totals.settledBoards, c.settled)}
        </div>
      </div>
      <div class="mod" style="--mc:#c0492f">
        <div class="mod-h">&#128009; ${h(c.mDD)}</div>
        <div class="mod-stats">
          ${stat(debtXp > 0 ? 1 : 0, c.slain)}
          ${stat(debtXp, 'XP')}
          ${stat(moneyText(Math.max(0, debtXp)), c.reclaimed, true)}
          ${stat(0, c.live)}
        </div>
      </div>
      <div class="mod" style="--mc:#3a6fd0">
        <div class="mod-h">&#9878;&#65039; ${h(c.mPA)}</div>
        <div class="mod-stats">
          ${stat(0, c.showdowns)}
          ${stat(0, c.merchants)}
          ${stat('0%', c.deal)}
        </div>
      </div>
      <div class="mod" style="--mc:#caa033">
        <div class="mod-h">&#127974; ${h(c.mTR)}</div>
        <div class="mod-stats">
          ${stat(0, c.months)}
          ${stat(0, c.tlog)}
          ${stat(0, c.disc)}
        </div>
      </div>
    </section>

    <div class="sec-h">${h(c.trophies)} <span class="count">${got} / ${trophies.length}</span></div>
    <section class="trophies badges">${renderTrophies(profile)}</section>

    ${account ? `<section class="acct">
      <div class="acct-ava">&#128100;</div>
      <div class="acct-info">
        <b>${h(account.name || 'Hero')}</b>
        <span>@${h(account.username || String(account.email || '').split('@')[0] || '')}</span>
        <span>${h(c.userId)} &middot; ${h(account.userId || '')}</span>
      </div>
    </section>` : ''}

    <section class="profile-tools" aria-label="${h(c.actions)}">
      <button class="cback" onclick="toggleMoney()">${h(hideMoney ? t('profile_show_money') : t('profile_hide_money'))}</button>
      <button id="copy-profile-btn" class="cback" onclick="copyProfileLink()">${h(t('profile_copy_link'))}</button>
      <a class="cback" href="/trip/">Party Ledger</a>
    </section>

    <section class="grid">
      <section class="panel">
        <div class="panel-head"><h2>${h(t('profile_board_history'))}</h2><span class="muted">${h(t('profile_records', { n: profile.boards.length }))}</span></div>
        <div class="board-list">${profile.boards.length ? renderBoards(profile) : `<div class="empty">${h(t('profile_no_boards'))}</div>`}</div>
      </section>
      <aside class="panel">
        <div class="panel-head"><h2>🗺️ ${h(c.myBoards)}</h2><span class="muted">${h(c.boardsSub)}</span></div>
        <div class="board-list">${renderAdminBoards(profile)}</div>
        ${profile.adminBoards.length ? `<div class="bd-locknote">🔒 ${h(c.cantDelete)}</div>` : ''}
      </aside>
    </section>
  </main>`;
}
async function boot() {
  if (!CHARACTER_ID || CHARACTER_ID.length !== 4) { renderSearch(); return; }
  document.getElementById('app').innerHTML = `${navMarkup()}<main class="wrap"><section class="search-card"><h1>${h(t('profile_loading'))}</h1><div class="sub">${h(t('profile_loading_sub'))}</div></section></main>`;
  try {
    const [record, boards] = await Promise.all([loadCharacterRecord(CHARACTER_ID), loadBoards()]);
    const profile = PointyLogic.buildCharacterProfile(CHARACTER_ID, boards, record, { lang: LANG, boardFallback: LANG === 'en' ? 'Untitled board' : 'บอร์ดไม่มีชื่อ' });
    if (!record.name && !profile.boards.length) { renderSearch(t('profile_not_found', { id: CHARACTER_ID })); return; }
    renderProfile(profile);
  } catch (err) {
    console.error(err);
    renderSearch(t('profile_load_failed'));
  }
}
boot();
