const PARAMS = new URLSearchParams(location.search);
const TEST_MODE = PARAMS.get('test') === '1';
const CHARACTER_ID = String(PARAMS.get('id') || '').replace(/\D/g, '').slice(0, 4);
const PRIVACY_KEY = 'pointy_character_profile_hide_money_v1';
const CLASSES = PointyLogic.CLASSES;
const SKIN_DEFS = {
  'archfiend-male': [
    { id: 'crimson-regent', res: 'crimson-regent-male' },
    { id: 'archfiend-swimmer', res: 'archfiend-swimmer-male' },
    { id: 'archfiend-swimmer-blackred', res: 'archfiend-swimmer-blackred-male' }
  ]
};

let hideMoney = PARAMS.get('private') === '1' || localStorage.getItem(PRIVACY_KEY) === '1';
let activeProfile = null;

function h(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
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
function portraitFile(res) { return `/assets/rpg-portraits/${res}.png`; }
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
  const url = `/character/?id=${encodeURIComponent(id)}`;
  return TEST_MODE ? `${url}&test=1` : url;
}
function localCharacterRegistry() {
  try { return JSON.parse(localStorage.getItem('pointy_character_registry_v1') || '{}') || {}; } catch (_) { return {}; }
}
async function loadCharacterRecord(id) {
  const local = localCharacterRegistry()[id] || {};
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
function renderSearch(message = '') {
  document.getElementById('app').innerHTML = `<main class="shell">
    <header class="top"><div class="brand">🎴 ${h(t('profile_title'))}</div><div class="top-actions"><button class="btn ghost" onclick="switchProfileLanguage()">${LANG === 'th' ? 'EN' : 'TH'}</button><a class="btn ghost" href="/trip/">${h(t('profile_back'))}</a></div></header>
    <section class="panel search-card">
      <h1>${h(t('profile_title'))}</h1>
      <div class="sub">${h(message || t('profile_search_hint'))}</div>
      <div class="search-row"><input id="profile-id-input" inputmode="numeric" maxlength="4" placeholder="1234" onkeydown="if(event.key==='Enter')openProfileSearch()"><button class="btn primary" onclick="openProfileSearch()">${h(t('profile_open'))}</button></div>
    </section>
  </main>`;
}
function switchProfileLanguage() {
  LANG = LANG === 'th' ? 'en' : 'th';
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
function stat(label, value, moneyValue = false) {
  return `<div class="stat"><span>${h(label)}</span><strong class="${moneyValue ? 'money' : ''}">${moneyValue && hideMoney ? '••••' : h(value)}</strong></div>`;
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
  if (!profile.adminBoards.length) return `<div class="empty">${h(t('profile_no_admin_boards'))}</div>`;
  return profile.adminBoards.map(board => `<div class="board">
    <div>
      <div class="board-title"><a href="${h(tripUrl(board.id))}">${h(board.tripName)}</a></div>
      <div class="board-meta">Admin ID ${h(board.adminId || '-')} · ${h(board.adminName || '-')} · #${h(board.id)}</div>
    </div>
    <a class="btn" href="${h(tripUrl(board.id))}">${h(t('profile_open_board'))}</a>
  </div>`).join('');
}
function renderProfile(profile) {
  activeProfile = profile;
  const cls = CLASSES[profile.class] || CLASSES.warrior;
  const rewardTitle = profile.reward.title?.[LANG] || profile.reward.title?.th || '';
  const created = profile.createdAt ? dateLabel(profile.createdAt) : '-';
  const updated = profile.updatedAt ? dateLabel(profile.updatedAt) : '-';
  document.body.classList.toggle('money-hidden', hideMoney);
  document.getElementById('app').innerHTML = `<main class="shell">
    <header class="top">
      <div class="brand">🎴 ${h(t('profile_title'))}</div>
      <div class="top-actions">
        <button class="btn ghost" onclick="switchProfileLanguage()">${LANG === 'th' ? 'EN' : 'TH'}</button>
        <button class="btn ghost" onclick="toggleMoney()">${h(hideMoney ? t('profile_show_money') : t('profile_hide_money'))}</button>
        <button id="copy-profile-btn" class="btn ghost" onclick="copyProfileLink()">${h(t('profile_copy_link'))}</button>
        <a class="btn ghost" href="/trip/">Party Ledger</a>
      </div>
    </header>
    <section class="hero">
      <article class="portrait-card">
        <div class="portrait-stage" style="--avatar-bg:${avatarBg(profile.class)}">
          <img src="${h(resolveAvatarFile(profile.class, profile.gender, profile.skin))}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'empty',textContent:'${h(cls.glyph)}'}))">
        </div>
        <div class="portrait-info">
          <span class="char-id">#${h(profile.id)}</span>
          <h1>${h(profile.displayName)}</h1>
          <div class="sub">${h(cls.glyph)} ${h(classLabel(profile.class))} · ${h(t(profile.gender === 'female' ? 'gender_female' : 'gender_male'))}${profile.skin ? ` · ${h(profile.skin)}` : ''}</div>
          <div class="sub">${h(t('profile_created'))} ${h(created)} · ${h(t('profile_updated'))} ${h(updated)}</div>
        </div>
      </article>
      <div class="hero-main">
        <section class="panel xp-panel">
          <div class="xp-row"><div><h2>Level ${profile.level.lvl}</h2><div class="sub">${h(rewardTitle)} · ${profile.xp.toLocaleString()} XP</div></div><strong>${profile.level.into}/${profile.level.need}</strong></div>
          <div class="bar"><span class="fill" style="--pct:${profile.level.pct}%"></span></div>
        </section>
        <section class="summary">
          ${stat(t('profile_boards'), profile.totals.boards)}
          ${stat(t('profile_quests'), profile.totals.quests)}
          ${stat(t('profile_paid'), money(profile.totals.paid), true)}
          ${stat(t('profile_share'), money(profile.totals.share), true)}
          ${stat(t('profile_fronted'), money(profile.totals.fronted), true)}
          ${stat(t('profile_balance'), `${profile.totals.balance >= 0 ? '+' : '-'}${money(Math.abs(profile.totals.balance))}`, true)}
          ${stat(t('profile_settled_boards'), profile.totals.settledBoards)}
          ${stat(t('profile_admin_boards'), profile.adminBoards.length)}
        </section>
      </div>
    </section>
    <section class="grid">
      <section class="panel">
        <div class="panel-head"><h2>${h(t('profile_board_history'))}</h2><span class="muted">${h(t('profile_records', { n: profile.boards.length }))}</span></div>
        <div class="board-list">${profile.boards.length ? renderBoards(profile) : `<div class="empty">${h(t('profile_no_boards'))}</div>`}</div>
      </section>
      <aside class="panel">
        <div class="panel-head"><h2>${h(t('profile_achievements'))}</h2></div>
        <div class="badges">${profile.badges.length ? profile.badges.map(b => { const copy = badgeCopy(b, profile); return `<div class="badge"><span class="badge-icon">${badgeIcon(b.id)}</span><div><strong>${h(copy[0])}</strong><div class="muted">${h(copy[1])}</div></div></div>`; }).join('') : `<div class="empty">${h(t('profile_no_badges'))}</div>`}</div>
        <div class="panel-head" style="margin-top:18px"><h2>${h(t('profile_admin_ownership'))}</h2></div>
        <div class="board-list">${renderAdminBoards(profile)}</div>
      </aside>
    </section>
  </main>`;
}
async function boot() {
  if (!CHARACTER_ID || CHARACTER_ID.length !== 4) { renderSearch(); return; }
  document.getElementById('app').innerHTML = `<main class="shell"><section class="panel search-card"><h1>${h(t('profile_loading'))}</h1><div class="sub">${h(t('profile_loading_sub'))}</div></section></main>`;
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
