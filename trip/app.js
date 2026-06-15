const _params = new URLSearchParams(window.location.search);
const TEST_MODE = _params.get('test') === '1';
let tripId = _params.get('id');
if (!tripId) {
  const lastId = localStorage.getItem('last_trip_id');
  tripId = lastId || makeTripCode();
  history.replaceState(null, '', '?id=' + tripId);
}
if (!TEST_MODE) localStorage.setItem('last_trip_id', tripId);
let tripRef = TEST_MODE ? testTripRef(tripId) : cloudTripRef(tripId);
const TripStore = {
  read() {
    return tripRef.get();
  },
  write(state) {
    const updatedAt = TEST_MODE ? Date.now() : firebase.firestore.FieldValue.serverTimestamp();
    return tripRef.set({ ...state, updatedAt });
  }
};

function cloudTripRef(id) {
  if (!firebase.apps.length) {
    firebase.initializeApp({
      apiKey: "AIzaSyBDDC1sJnITQOqyp1qiPGvB1KLuUH1B28o",
      authDomain: "pointy-personal-toolkit.firebaseapp.com",
      projectId: "pointy-personal-toolkit",
      storageBucket: "pointy-personal-toolkit.firebasestorage.app",
      messagingSenderId: "901775387853",
      appId: "1:901775387853:web:030f47acc78c71a5548d84"
    });
  }
  return firebase.firestore().collection('trips').doc(id);
}
function testTripRef(id) {
  const key = 'pointy_test_trip_' + id;
  return {
    async get() {
      const raw = sessionStorage.getItem(key);
      return { exists: !!raw, data: () => raw ? JSON.parse(raw) : null };
    },
    async set(data) {
      const copy = { ...data, updatedAt: Date.now() };
      sessionStorage.setItem(key, JSON.stringify(copy));
    }
  };
}

const QUEST_ICONS = window.QUEST_ICON_IDS || window.QUEST_ICONS || ["🍜","⛽","🏕️","☕","🍺","🎟️","🚕","🛒","🎁","🏨","🍰","⚓"];
const CHARACTER_REGISTRY_KEY = 'pointy_character_registry_v1';
const CLASS_ORDER = PointyLogic.CLASS_ORDER;
const CLASSES = PointyLogic.CLASSES;
const SKIN_DEFS = {
  'archfiend-male': [
    { id: 'crimson-regent', res: 'crimson-regent-male', th: 'ราชันเลือด', en: 'Crimson Regent' },
    { id: 'archfiend-swimmer', res: 'archfiend-swimmer-male', th: 'อาร์คฟีนด์นักว่ายน้ำ', en: 'Archfiend Swimmer' },
    { id: 'archfiend-swimmer-blackred', res: 'archfiend-swimmer-blackred-male', th: 'อาร์คฟีนด์นักว่ายน้ำดำแดง', en: 'Archfiend Swimmer Black/Red' }
  ]
};
const LEVEL_STEP = PointyLogic.LEVEL_STEP;
const SETTLE_BONUS_PAYER = PointyLogic.SETTLE_BONUS_PAYER;
const SETTLE_BONUS_PAYEE = PointyLogic.SETTLE_BONUS_PAYEE;
const ACCENTS = ['#2f8f5b','#c79a2e','#d4503f','#6d5ae0','#2a7fb8'];
const QUEST_TEMPLATES = [
  { id:'beach', icon:'🏖️', th:'ทริปทะเล', en:'Beach Trip', items:[['🏨','ที่พักริมหาด','Beachfront stay',3200],['⛽','ค่าน้ำมัน','Fuel',900],['🦞','ซีฟู้ดมื้อค่ำ','Seafood dinner',1600],['🏄','เช่าอุปกรณ์','Gear rental',700]] },
  { id:'city', icon:'🏙️', th:'เที่ยวในเมือง', en:'City Break', items:[['🏨','โรงแรม','Hotel',2800],['🚕','ค่าแท็กซี่','Taxis',480],['🍜','มื้อค่ำ','Dinner',1200],['🎟️','ตั๋วเข้าชม','Tickets',600],['☕','คาเฟ่','Cafe',320]] },
  { id:'camp', icon:'🏕️', th:'เข้าป่า/แคมป์', en:'Camping', items:[['⛺','ค่าที่กางเต็นท์','Campsite fee',600],['🪵','ฟืน+แก๊ส','Firewood & gas',350],['🥩','วัตถุดิบปิ้งย่าง','BBQ supplies',1400],['⛽','ค่าน้ำมัน','Fuel',1100]] },
  { id:'party', icon:'🎉', th:'ปาร์ตี้/เลี้ยงสังสรรค์', en:'House Party', items:[['🍕','อาหาร','Food',1500],['🍺','เครื่องดื่ม','Drinks',1800],['🧊','น้ำแข็ง+ของจุกจิก','Ice & snacks',400],['🎁','ของขวัญ','Gift',800]] }
];
const LEVEL_REWARDS = PointyLogic.LEVEL_REWARDS;

let S = {
  tripName: t('trip_default_name'),
  participants: [],
  expenses: [],
  budgets: {},
  heroClasses: {},
  heroGenders: {},
  heroSkins: {},
  characterIds: {},
  promptpay: {},
  settleXp: {},
  activeCampaignId: '',
  campaigns: [],
  admin: { passwordHash: '', ownerHash: '', createdAt: null, urlLocked: false },
  settings: { entry: 'form', settleView: 'list', theme: 'tavern', accent: '#2f8f5b', stats: true, sound: true, animations: true }
};
let _saveTimer, _toastTimer, _iconOpen = false, _iconDropUp = false, _iconPickerMax = 430, _addHeroOpen = false, _addHeroClass = null, _addHeroGender = null, _addHeroName = '', _addHeroCustom = null, _heroPickerOpen = false, _heroConfirmOpen = false, _pickerGender = 'all', _skinOpen = '';
let _resetEntryDraft = false;
let _settledTx = [];
let _celebrateName = null;
let _celebrateTimer;
let _prevLevels = {};
let _splitMode = 'equal', _payerMode = 'one', _splitWeights = {}, _payerAmounts = {};
let _lootItems = [], _receiptData = null, _receiptView = null, _expenseDate = '', _tributeTx = null, _tributeEdit = false;
let _overlay = null, _prevOutstanding = null, _newTripCode = '', _newTripAdminPass = '';
let _audioCtx = null;
let _characterRegistry = {};

function makeId() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }
function makeTripCode() { return String(Math.floor(1000 + Math.random() * 9000)); }
function makeAdminCode() { return String(Math.floor(100000 + Math.random() * 900000)); }
function makeOwnerToken() {
  return (window.crypto?.randomUUID?.() || `${makeId()}-${Date.now().toString(36)}`);
}
function h(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function q(s) { return JSON.stringify(String(s ?? '')).replace(/"/g, '&quot;'); }
function questIconId(value) { return window.migrateIcon ? window.migrateIcon(value) : (value || QUEST_ICONS[0]); }
function questIconMarkup(value, size = 30, className = '') {
  const icon = questIconId(value);
  return window.questIconSvg ? window.questIconSvg(icon, size, className) : h(icon);
}
function questIconLabel(value) {
  const icon = questIconId(value);
  return window.iconLabel ? window.iconLabel(icon, LANG || 'th') : '';
}
function money(n) { return '฿' + Math.round(Number(n) || 0).toLocaleString(LANG === 'th' ? 'th-TH' : 'en-US'); }
function money2(n) { return '฿' + (Number(n) || 0).toLocaleString(LANG === 'th' ? 'th-TH' : 'en-US', { maximumFractionDigits: 2 }); }
function ppTLV(tag, value) { const v = String(value); return tag + String(v.length).padStart(2, "0") + v; }
function ppCRC16(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
function promptPayPayload(target, amount) {
  const digits = String(target || "").replace(/[^0-9]/g, "");
  let acct;
  if (digits.length === 13) acct = ppTLV("02", digits);
  else if (digits.length === 15) acct = ppTLV("03", digits);
  else { let m = digits; if (m.length === 10 && m[0] === "0") m = m.slice(1); acct = ppTLV("01", "0066" + m); }
  const merchant = ppTLV("29", ppTLV("00", "A000000677010111") + acct);
  const amt = amount > 0 ? ppTLV("54", Number(amount).toFixed(2)) : "";
  const payload =
    ppTLV("00", "01") +
    ppTLV("01", amount > 0 ? "12" : "11") +
    merchant +
    ppTLV("58", "TH") +
    ppTLV("53", "764") +
    amt +
    "6304";
  return payload + ppCRC16(payload);
}
function fmtPP(v) {
  const d = (v || "").replace(/[^0-9]/g, "");
  if (d.length === 10) return d.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  if (d.length === 13) return d.replace(/(\d)(\d{4})(\d{5})(\d{2})(\d)/, "$1-$2-$3-$4-$5");
  return d;
}
function validPromptPay(v) { return /^(?:\d{10}|\d{13}|\d{15})$/.test(String(v || '').replace(/\D/g, '')); }
function qrSvg(text, size = 240) {
  if (typeof qrcode !== 'function') return `<div class="empty">QR</div>`;
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const cell = size / count;
  let rects = '';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) rects += `<rect x="${(c * cell).toFixed(2)}" y="${(r * cell).toFixed(2)}" width="${Math.ceil(cell)}" height="${Math.ceil(cell)}"/>`;
    }
  }
  return `<svg class="qr-svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="PromptPay QR"><rect width="${size}" height="${size}" fill="#fff"/><g fill="#111">${rects}</g></svg>`;
}
function hashOf(name) { return PointyLogic.hashOf(name); }
function adminHash(pass) { return String(hashOf(`pointy:${pass || ''}:admin`)); }
function ownerHash(token) { return String(hashOf(`pointy:${token || ''}:owner`)); }
function adminSessionKey() { return `pointy_admin_unlocked_${tripId}`; }
function adminLockKey() { return `pointy_admin_locked_${tripId}`; }
function ownerSessionKey(id = tripId) { return `pointy_admin_owner_${id}`; }
function hasCreatorAdmin() {
  const token = sessionStorage.getItem(ownerSessionKey());
  return !!(token && S.admin?.ownerHash && ownerHash(token) === S.admin.ownerHash);
}
function isAdminConfigured() { return !!(S.admin?.passwordHash || S.admin?.ownerHash); }
function isAdminUnlocked() {
  if (!isAdminConfigured()) return true;
  if (sessionStorage.getItem(adminLockKey()) === '1') return false;
  return sessionStorage.getItem(adminSessionKey()) === '1' || hasCreatorAdmin();
}
function canChangeTripUrl() { return !S.participants.length && !S.expenses.length && !S.admin?.urlLocked; }
function sanitizeTripCode(value) { return String(value || '').replace(/\D/g, '').slice(0, 4); }
function sanitizeTripSlug(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 36);
}
function tripLinkFor(id = tripId) {
  const url = new URL(window.location.href);
  url.searchParams.set('id', id);
  if (TEST_MODE) url.searchParams.set('test', '1');
  else url.searchParams.delete('test');
  return url.toString();
}
function readLocalRegistry() {
  try {
    const data = JSON.parse(localStorage.getItem(CHARACTER_REGISTRY_KEY) || '{}');
    return data && typeof data === 'object' ? data : {};
  } catch (_) {
    return {};
  }
}
function writeLocalRegistry(registry) {
  try { localStorage.setItem(CHARACTER_REGISTRY_KEY, JSON.stringify(registry)); } catch (_) {}
}
async function loadCharacterRegistry(ids = []) {
  _characterRegistry = { ...readLocalRegistry(), ..._characterRegistry };
  if (!TEST_MODE && ids.length) {
    await Promise.all([...new Set(ids.filter(Boolean))].map(async id => {
      try {
        const snap = await firebase.firestore().collection('characters').doc(id).get();
        if (snap.exists) _characterRegistry[id] = { ...(_characterRegistry[id] || {}), ...snap.data(), id };
      } catch (err) {
        console.warn('Character registry load failed', id, err);
      }
    }));
  }
  writeLocalRegistry(_characterRegistry);
}
function persistCharacterRecord(rec) {
  _characterRegistry[rec.id] = rec;
  writeLocalRegistry(_characterRegistry);
  if (!TEST_MODE) {
    firebase.firestore().collection('characters').doc(rec.id).set({ ...rec, updatedAt: Date.now() }, { merge: true }).catch(err => {
      console.warn('Character registry save failed', rec.id, err);
    });
  }
}
function deleteCharacterRecord(id) {
  delete _characterRegistry[id];
  writeLocalRegistry(_characterRegistry);
  if (!TEST_MODE) {
    firebase.firestore().collection('characters').doc(id).delete().catch(err => {
      console.warn('Character registry delete failed', id, err);
    });
  }
}
function generateCharacterId() {
  const registry = { ...readLocalRegistry(), ..._characterRegistry };
  const used = new Set([...Object.keys(registry), ...Object.values(S.characterIds || {})].map(String));
  for (let i = 0; i < 2000; i++) {
    const id = String(Math.floor(1000 + Math.random() * 9000));
    if (!used.has(id)) return id;
  }
  for (let n = 1000; n <= 9999; n++) {
    const id = String(n);
    if (!used.has(id)) return id;
  }
  return String(Math.floor(1000 + Math.random() * 9000));
}
function ensureCharacterId(name) {
  S.characterIds ||= {};
  if (!S.characterIds[name]) S.characterIds[name] = generateCharacterId();
  return S.characterIds[name];
}
function ensureAllCharacterIds() {
  let changed = false;
  S.participants.forEach(name => {
    if (!S.characterIds?.[name]) {
      ensureCharacterId(name);
      changed = true;
    }
  });
  Object.keys(S.characterIds || {}).forEach(name => {
    if (!S.participants.includes(name)) {
      delete S.characterIds[name];
      changed = true;
    }
  });
  return changed;
}
function characterBaseXp(name) {
  const id = S.characterIds?.[name];
  if (!id) return 0;
  const rec = _characterRegistry[id] || readLocalRegistry()[id];
  if (!rec?.trips) return Number(rec?.xp) || 0;
  return Object.entries(rec.trips).reduce((sum, [id, xp]) => id === tripId ? sum : sum + (Number(xp) || 0), 0);
}
function syncCharacterRegistry(party) {
  party.forEach(hero => {
    const id = ensureCharacterId(hero.name);
    const rec = _characterRegistry[id] || { id, trips: {}, createdAt: Date.now() };
    const before = JSON.stringify(rec);
    const base = characterBaseXp(hero.name);
    rec.name = hero.name;
    rec.class = hero.cls;
    rec.gender = genderOf(hero.name);
    rec.trips = { ...(rec.trips || {}), [tripId]: Math.max(0, Math.round(hero.xp - base)) };
    rec.xp = Object.values(rec.trips).reduce((sum, xp) => sum + (Number(xp) || 0), 0);
    rec.updatedAt = Date.now();
    if (before !== JSON.stringify(rec)) persistCharacterRecord(rec);
  });
}
function normalizeClass(cls) { return PointyLogic.normalizeClass(cls); }
function classOf(name) { return normalizeClass(S.heroClasses[name] || CLASS_ORDER[hashOf(name) % CLASS_ORDER.length]); }
function genderOf(name) { return S.heroGenders[name] || (hashOf(name) % 2 ? 'female' : 'male'); }
function avatarId(clsId, gender) { return `${normalizeClass(clsId)}-${gender === 'female' ? 'female' : 'male'}`; }
function portraitFile(res) { return `/assets/rpg-portraits/${res}.png`; }
function avatarSrc(clsId, gender, skinId = '') { return resolveAvatarFile(avatarId(clsId, gender), skinId); }
function avatarSkins(id) {
  if (!/^[a-z-]+-(female|male)$/.test(String(id || ''))) return [];
  return [
    { id: 'default', res: id, file: portraitFile(id), th: t('skin_default'), en: 'Original', isDefault: true },
    ...(SKIN_DEFS[id] || []).map(sk => ({ ...sk, file: portraitFile(sk.res), isDefault: false }))
  ];
}
function hasSkins(id) { return (SKIN_DEFS[id] || []).length > 0; }
function resolveAvatarFile(id, skinId) {
  const list = avatarSkins(id);
  const found = skinId && list.find(sk => sk.id === skinId);
  return (found || list[0] || { file: portraitFile(id) }).file;
}
function skinOf(name) { return (S.heroSkins && S.heroSkins[name]) || ''; }
function resetHeroSkin(name) {
  if (!name || !S.heroSkins) return;
  delete S.heroSkins[name];
}
function setHeroSkin(name, skinId) {
  const id = avatarId(classOf(name), genderOf(name));
  const valid = avatarSkins(id).find(sk => sk.id === skinId);
  S.heroSkins ||= {};
  if (!valid || valid.isDefault) delete S.heroSkins[name];
  else S.heroSkins[name] = valid.id;
  _skinOpen = '';
  SFX.click();
  save(); renderAll(false);
}
function toggleSkinPicker(name) {
  _skinOpen = _skinOpen === name ? '' : name;
  SFX.click();
  renderParty();
}
window.SKIN_DEFS = SKIN_DEFS;
window.avatarSkins = avatarSkins;
window.hasSkins = hasSkins;
window.resolveAvatarFile = resolveAvatarFile;
function classColor(clsId) {
  const h = (CLASSES[clsId] || CLASSES.ranger).hue;
  return {
    top: `oklch(0.74 0.16 ${h})`, bot: `oklch(0.55 0.17 ${h})`,
    ring: `oklch(0.46 0.15 ${h})`, soft: `oklch(0.92 0.05 ${h})`,
    text: `oklch(0.42 0.16 ${h})`
  };
}
function avatarBg(clsId) {
  const hue = (CLASSES[normalizeClass(clsId)] || CLASSES.ranger).hue;
  return `radial-gradient(125% 92% at 50% 16%, oklch(0.52 0.08 ${hue}), oklch(0.20 0.045 ${hue}) 78%)`;
}
function audioContext() {
  if (!S.settings.sound) return null;
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { return null; }
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}
function tone(freq, delay, duration, type = 'triangle', gain = .12) {
  const ctx = audioContext();
  if (!ctx) return;
  const at = ctx.currentTime + delay;
  const osc = ctx.createOscillator(), vol = ctx.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, at);
  vol.gain.setValueAtTime(.0001, at);
  vol.gain.exponentialRampToValueAtTime(gain, at + .012);
  vol.gain.exponentialRampToValueAtTime(.0001, at + duration);
  osc.connect(vol).connect(ctx.destination);
  osc.start(at); osc.stop(at + duration + .02);
}
const SFX = {
  click() { tone(420, 0, .05, 'triangle', .08); },
  coin() { tone(880, 0, .08, 'square', .12); tone(1318, .06, .12, 'square', .12); },
  heal() { [523,659,784,1046].forEach((f,i) => tone(f, i*.05, .25, 'sine', .13)); },
  levelUp() { [523,659,784,1046,1318].forEach((f,i) => tone(f, i*.07, .3, 'triangle', .15)); tone(1568,.42,.4,'sine',.12); },
  win() { [659,784,988,1318].forEach((f,i) => tone(f, i*.08, .3, 'triangle', .14)); }
};
function colorVars(clsId) {
  const c = classColor(clsId);
  return `--cc-top:${c.top};--cc-bot:${c.bot};--cc-ring:${c.ring};--cc-soft:${c.soft};--cc:${c.text}`;
}
function heroAvatar(name, size = 32, hp = null) {
  const cls = classOf(name), c = classColor(cls), g = CLASSES[cls].glyph;
  const src = customAvatarData(name) || avatarSrc(cls, genderOf(name), skinOf(name));
  return `<span style="position:relative;width:${size}px;height:${size}px;display:inline-flex;flex-shrink:0">
    <span class="mini-hero-avatar" style="width:${size}px;height:${size}px;border-radius:${Math.round(size*.28)}px;border:2px solid ${c.ring};background:${avatarBg(cls)};font-size:${Math.round(size*.48)}px">
      <img src="${src}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <span class="fallback-glyph">${g}</span>
    </span>
    ${hp !== null && hp < 100 ? `<span style="position:absolute;left:10%;right:10%;bottom:-3px;height:5px;border-radius:4px;background:var(--hp-bg);overflow:hidden;border:1px solid rgba(0,0,0,.15)"><span style="display:block;height:100%;width:${hp}%;background:var(--hp)"></span></span>` : ''}
  </span>`;
}
function customAvatarKey(name) { return `pointy_custom_avatar_${tripId}_${hashOf(name)}`; }
function customAvatarData(name) {
  try { return localStorage.getItem(customAvatarKey(name)); } catch (_) { return null; }
}
function heroPortraitImg(name, clsId, gender, extra = '') {
  const cls = normalizeClass(clsId);
  const glyph = CLASSES[cls].glyph;
  const custom = name ? customAvatarData(name) : _addHeroCustom;
  if (custom) return `<img class="portrait-img ${extra}" src="${custom}" alt="">`;
  return `<img class="portrait-img ${extra}" src="${avatarSrc(cls, gender, name ? skinOf(name) : '')}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'portrait-fallback',textContent:'${glyph}'}))">`;
}
function heroChip(name, active, dim, onClick) {
  const cls = classOf(name), g = CLASSES[cls].glyph;
  const src = customAvatarData(name) || avatarSrc(cls, genderOf(name), skinOf(name));
  return `<button type="button" class="hero-chip ${active ? 'on' : ''} ${dim ? 'dim' : ''}" style="${colorVars(cls)}" onclick="${onClick}">
    <span class="chip-avatar"><img src="${src}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span style="display:none;align-items:center;justify-content:center">${g}</span></span><span>${h(name)}</span>
  </button>`;
}
function levelFromXp(xp) { return PointyLogic.levelFromXp(xp); }
function rewardFor(lvl) { return PointyLogic.rewardFor(lvl); }
function hpColor(pct) { return PointyLogic.hpColor(pct); }
function statusOf(hero) {
  return PointyLogic.statusOf(hero, { guardian: t('st_guardian'), debt: t('st_debt'), even: t('st_even') });
}
function normalizeState(data) {
  return PointyLogic.normalizeTripState(data, {
    defaultTripName: t('trip_default_name'),
    questFallback: t('quest_fallback'),
    questIcons: QUEST_ICONS
  });
}
function freshTripState(admin = {}) {
  return {
    tripName: t('trip_default_name'),
    participants: [],
    expenses: [],
    budgets: {},
    heroClasses: {},
    heroGenders: {},
    heroSkins: {},
    characterIds: {},
    promptpay: {},
    settleXp: {},
    activeCampaignId: '',
    campaigns: [],
    admin: { passwordHash: '', ownerHash: '', createdAt: null, urlLocked: false, ...admin },
    settings: { entry: 'form', settleView: 'list', theme: 'tavern', accent: '#2f8f5b', stats: true, sound: true, animations: true }
  };
}
function resetTripRuntime() {
  _iconOpen = false; _iconDropUp = false; _iconPickerMax = 430;
  _addHeroOpen = false; _addHeroClass = null; _addHeroGender = null; _addHeroName = ''; _addHeroCustom = null;
  _heroPickerOpen = false; _heroConfirmOpen = false; _pickerGender = 'all'; _skinOpen = '';
  _resetEntryDraft = true; _settledTx = []; _celebrateName = null; _prevLevels = {};
  _splitMode = 'equal'; _payerMode = 'one'; _splitWeights = {}; _payerAmounts = {};
  _lootItems = []; _receiptData = null; _receiptView = null; _expenseDate = ''; _tributeTx = null; _tributeEdit = false;
  _prevOutstanding = null; _newTripCode = ''; _newTripAdminPass = '';
}
function campaignId() { return `camp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }
function activeCampaign() {
  return (S.campaigns || []).find(c => c.id === S.activeCampaignId) || null;
}
function snapshotCampaign(extra = {}) {
  return {
    id: S.activeCampaignId || campaignId(),
    tripName: S.tripName,
    participants: S.participants.slice(),
    expenses: S.expenses.slice(),
    budgets: { ...S.budgets },
    heroClasses: { ...S.heroClasses },
    heroGenders: { ...S.heroGenders },
    heroSkins: { ...(S.heroSkins || {}) },
    characterIds: { ...S.characterIds },
    promptpay: { ...(S.promptpay || {}) },
    settleXp: { ...S.settleXp },
    createdAt: activeCampaign()?.createdAt || Date.now(),
    completedAt: activeCampaign()?.completedAt || null,
    ...extra
  };
}
function applyCampaign(c) {
  if (!c) return;
  S.activeCampaignId = c.id;
  S.tripName = c.tripName || t('trip_fallback_name');
  S.participants = Array.isArray(c.participants) ? c.participants.slice() : [];
  S.expenses = Array.isArray(c.expenses) ? c.expenses.slice() : [];
  S.budgets = { ...(c.budgets || {}) };
  S.heroClasses = { ...(c.heroClasses || {}) };
  S.heroGenders = { ...(c.heroGenders || {}) };
  S.heroSkins = { ...(c.heroSkins || {}) };
  S.characterIds = { ...(c.characterIds || {}) };
  S.promptpay = { ...(c.promptpay || {}) };
  S.settleXp = { ...(c.settleXp || {}) };
}
function syncActiveCampaign(extra = {}) {
  S.campaigns ||= [];
  if (!S.activeCampaignId) S.activeCampaignId = campaignId();
  const snap = snapshotCampaign(extra);
  const i = S.campaigns.findIndex(c => c.id === snap.id);
  if (i >= 0) S.campaigns[i] = { ...S.campaigns[i], ...snap };
  else S.campaigns.unshift(snap);
  return snap;
}
function ensureCampaignState() {
  S.campaigns ||= [];
  if (!S.campaigns.length) {
    S.activeCampaignId = S.activeCampaignId || campaignId();
    syncActiveCampaign();
    return true;
  }
  if (!S.activeCampaignId || !S.campaigns.some(c => c.id === S.activeCampaignId)) {
    S.activeCampaignId = S.campaigns[0].id;
  }
  applyCampaign(activeCampaign());
  return false;
}
function payerMap(e) { return PointyLogic.payerMap(e); }
function splitShares(e, validNames = null) { return PointyLogic.splitShares(e, validNames); }
function computeParty() { return PointyLogic.computeParty(S, { classOf, baseXp: characterBaseXp }); }
function settleUp(party) { return PointyLogic.settleUp(party); }
function detectLevelUps(party) {
  party.forEach(p => {
    const prev = _prevLevels[p.name];
    if (prev !== undefined && p.level.lvl > prev) {
      _celebrateName = p.name;
      SFX.levelUp();
      clearTimeout(_celebrateTimer);
      _celebrateTimer = setTimeout(() => { _celebrateName = null; renderAll(false); }, 1600);
    }
    _prevLevels[p.name] = p.level.lvl;
  });
}

function setSaveStatus(state, msg) {
  const el = document.getElementById('save-status');
  if (!el) return;
  el.className = state;
  el.textContent = msg;
}
function save() {
  setSaveStatus('saving', t('status_saving'));
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(writeState, 800);
}
async function saveNow() {
  setSaveStatus('saving', t('status_saving'));
  clearTimeout(_saveTimer);
  await writeState();
}
async function writeState() {
  try {
    syncActiveCampaign();
    await TripStore.write(S);
    setSaveStatus('saved', t('status_saved'));
  } catch (err) {
    console.error('Save failed', err);
    setSaveStatus('error', t('status_save_err'));
  }
}
function applySettings() {
  document.body.dataset.theme = S.settings.theme || 'tavern';
  document.body.classList.toggle('no-animations', S.settings.animations === false);
  document.documentElement.style.setProperty('--accent', S.settings.accent || '#2f8f5b');
  renderQuickToggles();
}
async function load() {
  setSaveStatus('saving', t('status_loading'));
  let migrated = false;
  try {
    const snap = await TripStore.read();
    if (snap.exists) {
      S = normalizeState(snap.data());
      ensureCampaignState();
      migrated = ensureAllCharacterIds();
      await loadCharacterRegistry(Object.values(S.characterIds || {}));
    } else {
      await loadCharacterRegistry();
      ensureCampaignState();
      _overlay = 'onboarding';
    }
    applySettings();
    setSaveStatus('saved', t('status_saved'));
    if (migrated) save();
  } catch (err) {
    console.error('Load failed', err);
    setSaveStatus('error', t('status_load_err'));
  }
}

function newTrip() {
  _newTripCode = makeTripCode();
  _newTripAdminPass = makeAdminCode();
  _overlay = 'new-trip';
  SFX.click();
  renderOverlay();
}
function randomizeNewTripCode() {
  _newTripCode = makeTripCode();
  renderOverlay();
}
function randomizeNewTripAdminPass() {
  _newTripAdminPass = makeAdminCode();
  renderOverlay();
}
async function confirmNewTrip() {
  const input = document.getElementById('new-trip-code');
  const passInput = document.getElementById('new-trip-admin-pass');
  const code = sanitizeTripCode(input?.value || _newTripCode || makeTripCode());
  const adminPass = String(passInput?.value || _newTripAdminPass || '').trim();
  if (!/^\d{4}$/.test(code)) {
    toast(t('new_trip_code_invalid'));
    return;
  }
  if (adminPass.length < 4) {
    toast(t('admin_pass_short'));
    return;
  }
  await saveNow();
  const ownerToken = makeOwnerToken();
  tripId = code;
  tripRef = TEST_MODE ? testTripRef(tripId) : cloudTripRef(tripId);
  S = freshTripState({
    passwordHash: adminHash(adminPass),
    ownerHash: ownerHash(ownerToken),
    createdAt: Date.now(),
    urlLocked: true
  });
  sessionStorage.setItem(ownerSessionKey(tripId), ownerToken);
  sessionStorage.setItem(adminSessionKey(), '1');
  sessionStorage.removeItem(adminLockKey());
  if (!TEST_MODE) localStorage.setItem('last_trip_id', tripId);
  const next = new URL(tripLinkFor(tripId));
  history.replaceState(null, '', next.pathname + next.search);
  resetTripRuntime();
  ensureCampaignState();
  applySettings();
  await TripStore.write(S);
  setSaveStatus('saved', t('status_saved'));
  _overlay = 'onboarding';
  renderAll(false);
  toast(t('new_trip_created', { id: tripId }));
}
function openQuestBoard() { syncActiveCampaign(); _overlay = 'board'; SFX.click(); renderOverlay(); }
function createCampaign() {
  syncActiveCampaign();
  const id = campaignId();
  const next = {
    id,
    tripName: `${t('trip_fallback_name')} ${S.campaigns.length + 1}`,
    participants: S.participants.slice(),
    expenses: [],
    budgets: { ...S.budgets },
    heroClasses: { ...S.heroClasses },
    heroGenders: { ...S.heroGenders },
    heroSkins: { ...(S.heroSkins || {}) },
    characterIds: { ...S.characterIds },
    promptpay: { ...(S.promptpay || {}) },
    settleXp: {},
    createdAt: Date.now(),
    completedAt: null
  };
  S.campaigns.unshift(next);
  applyCampaign(next);
  _settledTx = [];
  _prevOutstanding = null;
  _resetEntryDraft = true;
  _overlay = null;
  SFX.click();
  save(); renderAll(false); toast(t('start_campaign'));
}
function openCampaign(id) {
  syncActiveCampaign();
  const c = S.campaigns.find(x => x.id === id);
  if (!c) return;
  applyCampaign(c);
  _settledTx = [];
  _prevOutstanding = null;
  _overlay = null;
  SFX.click();
  save(); renderAll(false);
}
function deleteCampaign(id) {
  if (S.campaigns.length <= 1) return;
  if (!confirm(t('delete_quest_confirm'))) return;
  S.campaigns = S.campaigns.filter(c => c.id !== id);
  if (S.activeCampaignId === id) applyCampaign(S.campaigns[0]);
  save(); renderAll(false); renderOverlay();
}
function completeCampaign() {
  syncActiveCampaign({ completedAt: Date.now() });
  save(); renderOverlay();
}
function shareTrip() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    SFX.click();
    const btn = document.getElementById('share-btn');
    if (btn) {
      btn.textContent = LANG === 'en' ? '✓ Link copied' : '✓ คัดลอกแล้ว';
      setTimeout(() => { btn.textContent = t('share_party'); }, 1800);
    }
    toast(t('toast_link_copied'));
  });
}
function startEditTrip() {
  const d = document.getElementById('trip-name-display');
  const i = document.getElementById('trip-name-input');
  i.value = S.tripName;
  d.style.display = 'none';
  i.style.display = 'inline-block';
  i.focus(); i.select();
}
function saveTrip() {
  S.tripName = document.getElementById('trip-name-input').value.trim() || t('trip_fallback_name');
  syncActiveCampaign();
  save(); renderTripName();
}
function renderTripName() {
  document.getElementById('trip-name-display').textContent = S.tripName || t('trip_click_name');
  document.getElementById('trip-name-display').style.display = '';
  document.getElementById('trip-name-input').style.display = 'none';
  document.title = `${S.tripName || t('title_split')} — Party Ledger`;
}

function addParticipant() {
  const el = document.getElementById('new-hero-name');
  const name = (el?.value || _addHeroName).trim();
  if (!name || !_addHeroClass || !_addHeroGender) return;
  if (S.participants.includes(name)) { toast(t('err_duplicate', { name })); return; }
  S.participants.push(name);
  S.characterIds[name] = generateCharacterId();
  S.heroClasses[name] = _addHeroClass;
  S.heroGenders[name] = _addHeroGender;
  resetHeroSkin(name);
  S.budgets[name] = 3000;
  if (_addHeroCustom) {
    try { localStorage.setItem(customAvatarKey(name), _addHeroCustom); } catch (_) {}
  }
  _addHeroOpen = false;
  _heroConfirmOpen = false;
  _addHeroName = '';
  _addHeroClass = null;
  _addHeroGender = null;
  _addHeroCustom = null;
  SFX.click();
  saveNow(); renderAll();
}
function removeParticipant(name) {
  const used = S.expenses.some(e => e.paidBy === name || e.sharedBy.includes(name) || Number(e.payers?.[name]) > 0);
  if (used && !confirm(t('confirm_remove_hero'))) return;
  S.participants = S.participants.filter(p => p !== name);
  S.expenses = S.expenses.map(e => {
    const payers = e.payers ? { ...e.payers } : undefined;
    const weights = e.split?.weights ? { ...e.split.weights } : undefined;
    if (payers) delete payers[name];
    if (weights) delete weights[name];
    const items = e.split?.items ? e.split.items.map(item => ({ ...item, claimedBy: (item.claimedBy || []).filter(p => p !== name) })) : undefined;
    return {
      ...e,
      payers,
      split: e.split ? { ...e.split, weights, items } : undefined,
      sharedBy: e.sharedBy.filter(p => p !== name)
    };
  }).filter(e => e.sharedBy.length > 0 && (e.paidBy !== name || Object.keys(e.payers || {}).length > 0));
  delete S.budgets[name]; delete S.heroClasses[name]; delete S.heroGenders[name]; delete S.heroSkins?.[name]; delete S.settleXp[name];
  delete S.characterIds[name]; delete S.promptpay?.[name];
  try { localStorage.removeItem(customAvatarKey(name)); } catch (_) {}
  save(); renderAll();
}
function saveBudget(name) {
  const el = document.getElementById('budget-' + hashOf(name));
  const n = parseFloat(el.value);
  if (n > 0) { S.budgets[name] = n; save(); renderAll(); }
}
function pickClass(cls) { _addHeroClass = normalizeClass(cls); renderParty(); }
function pickGender(gender) { _addHeroGender = gender === 'female' ? 'female' : 'male'; renderParty(); }
function openAddHero() {
  _addHeroName = '';
  _addHeroClass = null;
  _addHeroGender = null;
  _addHeroCustom = null;
  _heroPickerOpen = false;
  _heroConfirmOpen = false;
  _addHeroOpen = true;
  renderParty();
  setTimeout(() => document.getElementById('new-hero-name')?.focus(), 0);
}
function openHeroPicker() { _heroPickerOpen = true; renderParty(); }
function closeHeroPicker() { _heroPickerOpen = false; renderParty(); }
function cancelAddHero() {
  _addHeroName = '';
  _addHeroClass = null;
  _addHeroGender = null;
  _addHeroCustom = null;
  _heroPickerOpen = false;
  _heroConfirmOpen = false;
  _addHeroOpen = false;
  renderParty();
}
function requestHeroConfirmation() {
  const el = document.getElementById('new-hero-name');
  _addHeroName = (el?.value || _addHeroName).trim();
  if (!_addHeroName || !_addHeroClass || !_addHeroGender) return;
  if (S.participants.includes(_addHeroName)) { toast(t('err_duplicate', { name: _addHeroName })); return; }
  _heroConfirmOpen = true;
  renderParty();
}
function closeHeroConfirmation() { _heroConfirmOpen = false; renderParty(); }
function setPickerGender(gender) { _pickerGender = ['all','female','male'].includes(gender) ? gender : 'all'; renderParty(); }
function pickHeroVariant(cls, gender) {
  _addHeroClass = normalizeClass(cls);
  _addHeroGender = gender === 'female' ? 'female' : 'male';
  _addHeroCustom = null;
  _heroPickerOpen = false;
  SFX.click();
  renderParty();
}
function chooseCustomAvatar() {
  if (!_addHeroClass || !_addHeroGender) {
    toast(t('hero_not_selected'));
    return;
  }
  document.getElementById('custom-avatar-input').value = '';
  document.getElementById('custom-avatar-input').click();
}
function loadCustomAvatar(input) {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    _addHeroCustom = String(reader.result || '');
    _heroPickerOpen = false;
    SFX.click();
    renderParty();
  };
  reader.readAsDataURL(file);
}
function heroPickerModal() {
  if (!_heroPickerOpen) return '';
  const variants = CLASS_ORDER.flatMap(cls => ['female', 'male'].map(gender => ({ cls, gender })))
    .filter(v => _pickerGender === 'all' || v.gender === _pickerGender);
  const used = new Set(S.participants.map(name => avatarId(classOf(name), genderOf(name))));
  return `<div class="picker-overlay" onclick="closeHeroPicker()">
    <div class="picker" onclick="event.stopPropagation()">
      <div class="picker-head">
        <div>
          <div class="picker-title">⚔️ ${t('choose_hero')}</div>
          <div class="picker-sub">${t('choose_hero_sub')}</div>
        </div>
        <button type="button" class="picker-close" onclick="closeHeroPicker()">✕</button>
      </div>
      <div class="picker-filter">
        <button type="button" class="${_pickerGender === 'all' ? 'on' : ''}" onclick="setPickerGender('all')">${t('all_heroes')}</button>
        <button type="button" class="${_pickerGender === 'female' ? 'on' : ''}" onclick="setPickerGender('female')">♀ ${t('gender_female')}</button>
        <button type="button" class="${_pickerGender === 'male' ? 'on' : ''}" onclick="setPickerGender('male')">♂ ${t('gender_male')}</button>
      </div>
      <div class="picker-grid">${variants.map(v => {
        const cls = CLASSES[v.cls];
        const c = classColor(v.cls);
        const selected = _addHeroClass === v.cls && _addHeroGender === v.gender;
        return `<button type="button" class="picker-cell ${selected ? 'on' : ''}" data-class="${v.cls}" data-gender="${v.gender}" onclick="pickHeroVariant('${v.cls}','${v.gender}')">
          <div class="pc-art" style="--cc-top:${c.top};--cc-bot:${c.bot};--avatar-bg:${avatarBg(v.cls)}">
            <img src="${avatarSrc(v.cls, v.gender)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <span class="portrait-fallback" style="display:none">${cls.glyph}</span>
          </div>
          <div class="pc-name"><span class="pc-gender">${v.gender === 'female' ? '♀' : '♂'}</span>${h(cls[LANG] || cls.th)}</div>
          ${used.has(avatarId(v.cls, v.gender)) ? `<div class="pc-taken">${t('in_use')}</div>` : ''}
          ${selected ? '<div class="pc-check">✓</div>' : ''}
        </button>`;
      }).join('')}
        <button type="button" class="picker-cell ${_addHeroCustom ? 'on' : ''}" onclick="chooseCustomAvatar()">
          <div class="pc-art pc-upload">📷</div>
          <div class="pc-name">${t('upload_photo')}</div>
          ${_addHeroCustom ? '<div class="pc-check">✓</div>' : ''}
        </button>
      </div>
    </div>
  </div>`;
}
function heroConfirmationModal() {
  if (!_heroConfirmOpen || !_addHeroClass || !_addHeroGender) return '';
  const cls = CLASSES[_addHeroClass];
  const c = classColor(_addHeroClass);
  return `<div class="picker-overlay" onclick="closeHeroConfirmation()">
    <div class="confirm-card" role="dialog" aria-modal="true" aria-labelledby="confirm-hero-title" onclick="event.stopPropagation()">
      <div class="picker-head">
        <div>
          <div class="picker-title" id="confirm-hero-title">⚔️ ${t('confirm_hero_title')}</div>
          <div class="picker-sub">${t('hero_choice_locked')}</div>
        </div>
        <button type="button" class="picker-close" onclick="closeHeroConfirmation()" aria-label="${h(t('confirm_hero_back'))}">✕</button>
      </div>
      <div class="confirm-hero-summary">
        <div class="confirm-portrait" style="--top:${c.top};--bot:${c.bot};--ring:${c.ring};background:${avatarBg(_addHeroClass)}">
          ${heroPortraitImg('', _addHeroClass, _addHeroGender)}
          <span class="class-badge">${cls.glyph}</span>
        </div>
        <div>
          <div class="confirm-name">${h(_addHeroName)}</div>
          <div class="confirm-class">${cls.glyph} ${h(cls[LANG] || cls.th)} · ${_addHeroGender === 'female' ? '♀' : '♂'} ${t(_addHeroGender === 'female' ? 'gender_female' : 'gender_male')}</div>
        </div>
      </div>
      <div class="confirm-warning">⚠️ ${t('confirm_hero_warning')}</div>
      <div class="confirm-actions">
        <button type="button" class="btn-ghost" onclick="closeHeroConfirmation()">${t('confirm_hero_back')}</button>
        <button type="button" class="btn-primary sm" onclick="addParticipant()">${t('confirm_hero_final')}</button>
      </div>
    </div>
  </div>`;
}
function skinPickerHtml(hero) {
  const id = avatarId(hero.cls, genderOf(hero.name));
  if (customAvatarData(hero.name) || !hasSkins(id)) return '';
  const active = skinOf(hero.name) || 'default';
  const skins = avatarSkins(id);
  return `<button type="button" class="hc-skin ${_skinOpen === hero.name ? 'on' : ''}" onclick="toggleSkinPicker(${q(hero.name)})" title="${h(t('skins'))}" aria-label="${h(t('skins'))}">✨</button>
    ${_skinOpen === hero.name ? `<div class="skin-pop" onclick="event.stopPropagation()">
      <div class="skin-pop-h">✨ ${h(t('skins'))}</div>
      <div class="skin-pop-grid">${skins.map(sk => {
        const cls = classOf(hero.name);
        return `<button type="button" class="skin-opt ${active === sk.id ? 'on' : ''}" onclick="setHeroSkin(${q(hero.name)},'${h(sk.id)}')">
          <span class="skin-thumb" style="--avatar-bg:${avatarBg(cls)}"><img src="${h(resolveAvatarFile(id, sk.id))}" alt="" onerror="this.style.display='none'"></span>
          <span class="skin-name">${h(sk[LANG] || sk.th || sk.en || sk.id)}</span>
          ${active === sk.id ? '<span class="skin-check">✓</span>' : ''}
        </button>`;
      }).join('')}</div>
    </div>` : ''}`;
}

function renderParty() {
  const party = computeParty();
  document.getElementById('party-count').textContent = S.participants.length;
  const grid = document.getElementById('party-grid');
  const cards = party.map(hero => {
    const cls = CLASSES[hero.cls];
    const c = classColor(hero.cls);
    const status = statusOf(hero);
    const hpCol = hpColor(hero.hp);
    const reward = hero.reward;
    const rankTitle = reward.title[LANG] || reward.title.th;
    const frameClass = reward.frame === 'legend' ? 'legend' : reward.frame === 'gold' ? 'gold' : '';
    return `<div class="hero-card ${status.kind}" style="--cc-top:${c.top};--cc-bot:${c.bot};--cc-ring:${c.ring};--frame:${S.settings.stats && reward.frame === 'bronze' ? '#c08a4a' : S.settings.stats && reward.frame === 'silver' ? '#b6c0cf' : S.settings.stats && (reward.frame === 'gold' || reward.frame === 'legend') ? 'var(--gold)' : 'var(--border)'}">
      ${isAdminUnlocked() && S.participants.length > 1 ? `<button class="hero-remove" onclick="removeParticipant(${q(hero.name)})">×</button>` : ''}
      <div class="portrait ${S.settings.stats ? frameClass : ''}" style="--avatar-bg:${avatarBg(hero.cls)}">
        ${heroPortraitImg(hero.name, hero.cls, genderOf(hero.name))}
        <span class="class-badge" title="${h(cls[LANG] || cls.th)}">${cls.glyph}</span>
        ${S.settings.stats ? `<span class="lvl-badge"><span>${t('lvl')}</span><span>${hero.level.lvl}</span></span>` : ''}
        <span class="status-badge ${status.kind}" title="${status.kind === 'guardian' ? h(t('guardian_tip')) : status.kind === 'debt' ? h(t('debt_tip')) : ''}">${status.icon}</span>
        ${skinPickerHtml(hero)}
        ${_celebrateName === hero.name ? `<div class="levelup">
          <span class="lub-star s1">✦</span><span class="lub-star s2">✧</span><span class="lub-star s3">★</span><span class="lub-star s4">✦</span>
          <strong>${t('level_up')}</strong><div class="rank-pill rank-${reward.frame}">${reward.glyph} ${h(rankTitle)}</div>
        </div>` : ''}
      </div>
      <div class="hero-name">${h(hero.name)}<span class="char-id">#${h(ensureCharacterId(hero.name))}</span></div>
      <div class="hero-class-row">
        <span class="hero-class">${h(cls[LANG] || cls.th)}</span>
        ${S.settings.stats ? `<span class="rank-pill rank-${reward.frame}">${reward.glyph} ${h(rankTitle)}</span>` : ''}
      </div>
      ${S.settings.stats ? `<div class="bars">
        <div class="bar-row">
          <span class="bar-lab hp">${t('hp')}</span>
          <span class="bar"><span class="bar-fill" style="width:${hero.hp}%;background:linear-gradient(${hpCol.a},${hpCol.b})"></span></span>
          <button class="bar-val budget-btn" onclick="editBudget(${q(hero.name)})">${hero.over ? `<span class="over">${t('over_budget')}</span>` : money(hero.remaining)}</button>
        </div>
        <div class="bar-row">
          <span class="bar-lab xp">${t('xp')}</span>
          <span class="bar xp-bar"><span class="bar-fill" style="width:${hero.level.pct}%"></span></span>
          <span class="bar-val">${hero.level.into}/${hero.level.need}</span>
        </div>
      </div>` : ''}
      <div class="hero-foot">
        <div class="mini-stat"><span>💰 ${t('gold')}</span><span>${money(hero.paid)}</span></div>
        <div class="status-chip ${status.kind}" title="${status.kind === 'guardian' ? h(t('guardian_tip')) : status.kind === 'debt' ? h(t('debt_tip')) : ''}">
          <span>${status.icon}</span><span><strong>${status.label}</strong>${status.amt > 0 ? `<span>${status.kind === 'guardian' ? '+' : '−'}${money(status.amt)}</span>` : ''}</span>
        </div>
      </div>
    </div>`;
  }).join('');
  const add = _addHeroOpen ? `<div class="hero-card add-hero-form">
    <input id="new-hero-name" class="field-input" value="${h(_addHeroName)}" placeholder="${h(t('hero_name'))}" maxlength="24" oninput="_addHeroName=this.value;document.getElementById('confirm-hero-btn').disabled=!(this.value.trim() && _addHeroClass && _addHeroGender)" onkeydown="if(event.key==='Enter' && this.value.trim() && _addHeroClass && _addHeroGender)requestHeroConfirmation()">
    <div class="hero-builder">
      ${(() => {
        if (!_addHeroClass || !_addHeroGender) {
          return `<div class="avatar-preview empty">
            <button type="button" class="hc-choose" onclick="openHeroPicker()" aria-label="${h(t('tap_choose_hero'))}">
              <span class="hc-choose-q">?</span>
              <span class="hc-choose-lab">${t('tap_choose_hero')}</span>
            </button>
            <span class="class-badge">⚔️</span>
            <span class="status-badge guardian">🛡️</span>
          </div>`;
        }
        const c = classColor(_addHeroClass);
        const cls = CLASSES[_addHeroClass];
        return `<div class="avatar-preview" style="--top:${c.top};--bot:${c.bot};--ring:${c.ring};background:${avatarBg(_addHeroClass)}">
          ${heroPortraitImg('', _addHeroClass, _addHeroGender)}
          <span class="class-badge">${cls.glyph}</span>
          <span class="avatar-preview-label">${h(cls[LANG] || cls.th)} · ${t(_addHeroGender === 'female' ? 'gender_female' : 'gender_male')}</span>
        </div>`;
      })()}
      <div class="class-tools">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <div class="field-label">${t('choose_hero')}</div>
          <div class="gender-toggle">
            <button type="button" class="gender-btn ${_addHeroGender === 'male' ? 'on' : ''}" aria-pressed="${_addHeroGender === 'male'}" onclick="pickGender('male')" title="${h(t('gender_male'))}">♂</button>
            <button type="button" class="gender-btn ${_addHeroGender === 'female' ? 'on' : ''}" aria-pressed="${_addHeroGender === 'female'}" onclick="pickGender('female')" title="${h(t('gender_female'))}">♀</button>
          </div>
        </div>
        <button type="button" class="choose-hero-btn" onclick="openHeroPicker()">⚔️ ${t('choose_hero')}</button>
        <div class="field-label">${_addHeroClass && _addHeroGender ? `${CLASSES[_addHeroClass].glyph} ${h(CLASSES[_addHeroClass][LANG] || CLASSES[_addHeroClass].th)} · ${_addHeroGender === 'female' ? '♀' : '♂'}` : h(t('hero_not_selected'))}</div>
        <div class="lock-note">${t('hero_choice_locked')}</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button type="button" class="btn-ghost" onclick="cancelAddHero()">✕</button>
      <button type="button" id="confirm-hero-btn" class="btn-primary sm" onclick="requestHeroConfirmation()" ${_addHeroName.trim() && _addHeroClass && _addHeroGender ? '' : 'disabled'}>${t('confirm_hero')}</button>
    </div>
  </div>` : `<button class="add-hero" onclick="openAddHero()"><span style="font-size:28px;line-height:1">＋</span><span>${t('add_hero')}</span></button>`;
  grid.innerHTML = cards + add + heroPickerModal() + heroConfirmationModal();
}
function editBudget(name) {
  const id = 'budget-' + hashOf(name);
  const btn = event.currentTarget;
  btn.outerHTML = `<input class="budget-edit" id="${id}" type="number" value="${Number(S.budgets[name]) || 3000}" onblur="saveBudget(${q(name)})" onkeydown="if(event.key==='Enter')saveBudget(${q(name)})">`;
  setTimeout(() => document.getElementById(id)?.focus(), 0);
}

function captureEntryDraft() {
  document.querySelectorAll('.weight-value').forEach(el => { _splitWeights[el.dataset.name] = el.value; });
  document.querySelectorAll('.payer-value').forEach(el => { _payerAmounts[el.dataset.name] = el.value; });
  _expenseDate = document.getElementById('exp-date')?.value || _expenseDate || '';
  if (_splitMode === 'items') captureLootItems();
}
function setEntryMode(mode) { captureEntryDraft(); S.settings.entry = mode; save(); SFX.click(); renderEntry(); }
function setSplitMode(mode) {
  captureEntryDraft();
  _splitMode = ['equal','shares','exact','percent','items'].includes(mode) ? mode : 'equal';
  if (_splitMode === 'items' && !_lootItems.length) _lootItems = [{ id: makeId(), name: '', amount: '', claimedBy: [] }];
  SFX.click(); renderEntry();
}
function setPayerMode(mode) {
  captureEntryDraft();
  _payerMode = mode === 'multi' ? 'multi' : 'one';
  if (_payerMode === 'multi' && !Object.values(_payerAmounts).some(v => Number(v) > 0)) {
    const payer = document.getElementById('exp-payer')?.value || S.participants[0];
    const amount = document.getElementById('exp-amount')?.value || '';
    if (payer) _payerAmounts[payer] = amount;
  }
  SFX.click(); renderEntry();
}
function setSinglePayer(name) {
  document.getElementById('exp-payer').value = name;
  renderPayerChips();
}
function renderPayerChips() {
  const box = document.getElementById('payer-chip-row');
  const payer = document.getElementById('exp-payer')?.value || S.participants[0];
  if (box) box.innerHTML = S.participants.map(name => heroChip(name, name === payer, false, `setSinglePayer(${q(name)})`)).join('');
}
function toggleIconPicker(ev) {
  const willOpen = !_iconOpen;
  if (willOpen && ev?.currentTarget) {
    const rect = ev.currentTarget.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 24;
    const above = rect.top - 24;
    _iconDropUp = below < 320 && above > below;
    _iconPickerMax = Math.max(260, Math.min(430, _iconDropUp ? above : below));
  }
  _iconOpen = willOpen;
  renderEntry();
}
function pickExpenseIcon(icon) { document.getElementById('exp-icon-value').value = questIconId(icon); _iconOpen = false; renderEntry(); }
function fileToScaledDataURL(file, maxDim, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      w = Math.max(1, Math.round(w * scale)); h = Math.max(1, Math.round(h * scale));
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      cv.getContext("2d").drawImage(img, 0, 0, w, h);
      try { cb(cv.toDataURL("image/jpeg", 0.82)); } catch (e) { cb(reader.result); }
    };
    img.onerror = () => cb(reader.result);
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
function pickReceipt() {
  const input = document.getElementById('receipt-input');
  input.value = '';
  input.click();
}
function loadReceipt(input) {
  const file = input.files?.[0];
  if (!file) return;
  fileToScaledDataURL(file, 1400, data => {
    _receiptData = data;
    SFX.click();
    renderEntry();
  });
}
function removeReceipt() { _receiptData = null; renderEntry(); }
function openReceipt(data) { _receiptView = data; _overlay = 'receipt'; SFX.click(); renderOverlay(); }
function renderReceiptField() {
  return `<div class="receipt-row">
    <button type="button" class="receipt-btn" data-entry-action="pick-receipt">📎 ${t('attach_receipt')}</button>
    ${_receiptData ? `<span class="receipt-chip"><img class="receipt-thumb" src="${_receiptData}" alt="">${t('receipt_attached')} <button type="button" class="btn-ghost xs" data-entry-action="remove-receipt">×</button></span>` : ''}
  </div>`;
}
function captureLootItems() {
  document.querySelectorAll('.loot-row').forEach(row => {
    const id = row.dataset.id;
    const item = _lootItems.find(x => x.id === id);
    if (!item) return;
    item.name = row.querySelector('.loot-name')?.value || '';
    item.amount = row.querySelector('.loot-amount')?.value || '';
  });
}
function lootTotal() {
  captureLootItems();
  return _lootItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}
function addLootItem() {
  captureLootItems();
  _lootItems.push({ id: makeId(), name: '', amount: '', claimedBy: [] });
  renderEntry();
}
function removeLootItem(id) {
  captureLootItems();
  _lootItems = _lootItems.filter(item => item.id !== id);
  if (!_lootItems.length) _lootItems.push({ id: makeId(), name: '', amount: '', claimedBy: [] });
  renderEntry();
}
function toggleLootClaim(id, name) {
  captureLootItems();
  const item = _lootItems.find(x => x.id === id);
  if (!item) return;
  item.claimedBy ||= [];
  item.claimedBy = item.claimedBy.includes(name) ? item.claimedBy.filter(x => x !== name) : [...item.claimedBy, name];
  renderEntry();
}
function updateLootTotal() {
  const total = lootTotal();
  const amount = document.getElementById('exp-amount');
  if (amount && _splitMode === 'items') amount.value = total ? String(total) : '';
  const label = document.getElementById('loot-total-label');
  if (label) label.textContent = `${t('loot_total')}: ${money2(total)}`;
  updateSplitInfo();
}
function renderLootItems() {
  if (_splitMode !== 'items') return '';
  return `<div class="loot-box">
    <div class="loot-head"><div><div class="loot-title">🎒 ${t('loot_distribution')}</div><div class="settings-sub">${t('loot_unclaimed')}</div></div><div class="loot-total" id="loot-total-label">${t('loot_total')}: ${money2(lootTotal())}</div></div>
    ${_lootItems.map(item => `<div class="loot-row" data-id="${h(item.id)}">
      <input class="field-input loot-name" value="${h(item.name)}" placeholder="${h(t('loot_item_ph'))}">
      <div class="gold-in"><span>฿</span><input class="field-input loot-amount" type="number" inputmode="decimal" value="${h(item.amount)}" placeholder="0"></div>
      <button type="button" class="loot-del" data-entry-action="remove-loot" data-id="${h(item.id)}">×</button>
      <div class="loot-claim-label">${t('loot_claimed_by')}</div>
      <div class="loot-claim">${S.participants.map(name => heroChip(name, (item.claimedBy || []).includes(name), false, `toggleLootClaim('${item.id}',${q(name)})`)).join('')}</div>
    </div>`).join('')}
    <button type="button" class="btn-ghost" data-entry-action="add-loot">＋ ${t('loot_add_item')}</button>
  </div>`;
}
function sharedBy() { return Array.from(document.querySelectorAll('.share-cb:checked')).map(cb => cb.value); }
function toggleShare(name) {
  const cb = document.querySelector(`.share-cb[value="${CSS.escape(name)}"]`);
  if (cb) { cb.checked = !cb.checked; updateSplitInfo(); renderShareChips(); if (_splitMode !== 'equal') renderEntry(); }
}
function selectAllShares() {
  const boxes = Array.from(document.querySelectorAll('.share-cb'));
  const all = boxes.every(cb => cb.checked);
  boxes.forEach(cb => cb.checked = !all);
  updateSplitInfo(); renderShareChips(); if (_splitMode !== 'equal') renderEntry();
}
function updateSplitInfo() {
  const n = sharedBy().length;
  const amt = parseFloat(document.getElementById('exp-amount')?.value) || 0;
  const info = document.getElementById('split-info');
  if (info) info.textContent = _splitMode === 'items'
    ? `${t('loot_total')}: ${money2(lootTotal())}`
    : (n ? `${n} ${LANG === 'en' ? 'heroes' : 'คน'}${amt > 0 ? ' · ' + money2(amt / n) + ' ' + t('each') : ''}` : '—');
  const weights = {};
  document.querySelectorAll('.weight-value').forEach(el => { weights[el.dataset.name] = Number(el.value) || 0; _splitWeights[el.dataset.name] = el.value; });
  const itemSplit = _splitMode === 'items' ? { mode: 'items', items: _lootItems.map(item => ({ name: item.name, amount: Number(item.amount) || 0, claimedBy: item.claimedBy || [] })) } : null;
  const shares = splitShares({ amount: amt, sharedBy: sharedBy(), split: _splitMode === 'equal' ? undefined : (itemSplit || { mode: _splitMode, weights }) }, S.participants);
  document.querySelectorAll('.wr-share').forEach(el => { el.textContent = money2(shares[el.dataset.name] || 0); });
  let paid = 0;
  document.querySelectorAll('.payer-value').forEach(el => { _payerAmounts[el.dataset.name] = el.value; paid += Number(el.value) || 0; });
  const payTotal = document.getElementById('pay-total');
  if (payTotal) {
    const diff = amt - paid;
    payTotal.className = `pay-total ${Math.abs(diff) <= 1 ? 'ok' : 'off'}`;
    payTotal.textContent = Math.abs(diff) <= 1 ? `✓ ${money2(paid)}` : `${diff > 0 ? t('short_by') : t('over_by')} ${money2(Math.abs(diff))}`;
  }
}
function renderShareChips() {
  const box = document.getElementById('share-chip-row');
  if (!box) return;
  const active = sharedBy();
  box.innerHTML = S.participants.map(name => heroChip(name, active.includes(name), !active.includes(name), `toggleShare(${q(name)})`)).join('') +
    `<button type="button" class="chip-all" data-entry-action="select-all-shares">${active.length === S.participants.length ? '✕' : '✓'} ${t('everyone')}</button>`;
}
function renderEntry() {
  document.getElementById('entry-section').style.display = S.participants.length ? '' : 'none';
  if (!S.participants.length) return;
  const mode = S.settings.entry || 'form';
  document.getElementById('entry-form-btn').classList.toggle('on', mode === 'form');
  document.getElementById('entry-quick-btn').classList.toggle('on', mode === 'quick');
  document.getElementById('entry-title').innerHTML = mode === 'quick' ? `⚡ ${t('quick_strike')}` : `📜 ${t('log_encounter')}`;
  const resetDraft = _resetEntryDraft;
  _resetEntryDraft = false;
  if (resetDraft) { _splitMode = 'equal'; _payerMode = 'one'; _splitWeights = {}; _payerAmounts = {}; _lootItems = []; _receiptData = null; _expenseDate = ''; }
  const prevDesc = resetDraft ? '' : (document.getElementById('exp-desc')?.value || '');
  const prevAmt = _splitMode === 'items' ? (lootTotal() ? String(lootTotal()) : '') : (resetDraft ? '' : (document.getElementById('exp-amount')?.value || ''));
  const prevDate = resetDraft ? '' : (document.getElementById('exp-date')?.value || _expenseDate || '');
  const prevIcon = questIconId(resetDraft ? QUEST_ICONS[0] : (document.getElementById('exp-icon-value')?.value || QUEST_ICONS[0]));
  const prevPayer = resetDraft ? S.participants[0] : (document.getElementById('exp-payer')?.value || S.participants[0]);
  const split = _splitMode === 'items' ? S.participants.slice() : (resetDraft ? S.participants.slice() : sharedBy());
  const hiddenShares = S.participants.map(p => `<input type="checkbox" class="share-cb" value="${h(p)}" ${!split.length || split.includes(p) ? 'checked' : ''}>`).join('');
  const iconPicker = `<div class="icon-picker ${_iconDropUp ? 'drop-up' : ''}" style="--icon-pop-max:${_iconPickerMax}px"><button class="icon-btn" data-entry-action="toggle-icon-picker" type="button" aria-label="${h(questIconLabel(prevIcon) || t('quest_name'))}">${questIconMarkup(prevIcon, 34)}</button>${_iconOpen ? `<div class="icon-pop labeled">${QUEST_ICONS.map(ic => `<button class="icon-opt ${questIconId(ic) === prevIcon ? 'on' : ''}" data-entry-action="pick-icon" data-icon="${h(ic)}" type="button" title="${h(questIconLabel(ic))}">${questIconMarkup(ic, 18)}<span class="io-lab">${h(questIconLabel(ic))}</span></button>`).join('')}</div>` : ''}</div><input type="hidden" id="exp-icon-value" value="${h(prevIcon)}">`;
  const payerBlock = `<div class="field">
    <div class="field-lab-row"><label>${t('who_paid')}</label><button type="button" class="mini-toggle" data-payer-mode="${_payerMode === 'one' ? 'multi' : 'one'}">${_payerMode === 'one' ? '＋ ' + t('multi_payer') : '↩ ' + t('one_payer')}</button></div>
    <input type="hidden" id="exp-payer" value="${h(prevPayer)}">
    ${_payerMode === 'one' ? `<div class="chip-row" id="payer-chip-row"></div>` : `<div class="payer-amts">${S.participants.map(name => `
      <div class="payer-amt-row">${heroChip(name, Number(_payerAmounts[name]) > 0, !Number(_payerAmounts[name]), 'void(0)')}
        <div class="mini-gold"><span>฿</span><input class="payer-value" data-name="${h(name)}" type="number" inputmode="decimal" value="${h(_payerAmounts[name] || '')}" placeholder="0"></div>
      </div>`).join('')}<div id="pay-total" class="pay-total"></div></div>`}
  </div>`;
  const modeButtons = [['equal','split_equal'],['shares','split_shares'],['exact','split_exact'],['percent','split_percent'],['items','split_items']]
    .map(([mode,key]) => `<button type="button" class="${_splitMode === mode ? 'on' : ''}" data-split-mode="${mode}">${t(key)}</button>`).join('');
  const selected = split.length ? split : S.participants.slice();
  const weightRows = (_splitMode === 'equal' || _splitMode === 'items') ? '' : `<div class="weight-rows">${selected.map(name => {
    const suffix = _splitMode === 'percent' ? '%' : _splitMode === 'exact' ? '฿' : t('share_label');
    return `<div class="weight-row">${heroAvatar(name,26)}<span class="wr-name">${h(name)}</span><div class="weight-in"><input class="weight-value" data-name="${h(name)}" type="number" inputmode="decimal" value="${h(_splitWeights[name] || '')}" placeholder="${_splitMode === 'shares' ? '1' : '0'}"><span class="wr-suffix">${suffix}</span></div><span class="wr-share" data-name="${h(name)}">${money2(0)}</span></div>`;
  }).join('')}</div>`;
  const shareBlock = `<div id="hidden-shares" class="hidden">${hiddenShares}</div><div class="field">
    <div class="field-lab-row"><label>${t('split_with')} <span class="lab-hint" id="split-info"></span></label><div class="split-seg">${modeButtons}</div></div>
    ${_splitMode === 'items' ? renderLootItems() : `<div class="chip-row" id="share-chip-row"></div>${weightRows}`}
  </div>`;
  const receiptField = renderReceiptField();
  const amountAttrs = _splitMode === 'items' ? 'readonly aria-readonly="true"' : '';
  document.getElementById('entry-body').innerHTML = mode === 'quick' ? `
    <div class="quick-amount"><span>฿</span><input id="exp-amount" type="number" inputmode="decimal" value="${h(prevAmt)}" placeholder="0" ${amountAttrs}></div>
    <div class="qf-top">${iconPicker}<div class="field grow"><input class="field-input" id="exp-desc" value="${h(prevDesc)}" placeholder="${h(t('placeholder_desc'))}"></div></div>
    ${receiptField}
    ${payerBlock}
    ${shareBlock}
    <button class="btn-primary big" data-entry-action="add-expense">⚔️ ${t('log_it')}</button>` : `
    <div class="qf-top">
      ${iconPicker}
      <div class="field grow"><label>${t('quest_name')}</label><input class="field-input" id="exp-desc" value="${h(prevDesc)}" placeholder="${h(t('placeholder_desc'))}"></div>
      <div class="field gold-field"><label>${t('gold_spent')}</label><div class="gold-in"><span>฿</span><input class="field-input" id="exp-amount" type="number" inputmode="decimal" value="${h(prevAmt)}" placeholder="0" ${amountAttrs}></div></div>
      <div class="field date-field"><label>${t('date_label')} <span class="lab-hint">${t('date_optional')}</span></label><input class="field-input" id="exp-date" type="datetime-local" value="${h(prevDate)}"></div>
    </div>
    ${receiptField}
    ${payerBlock}
    ${shareBlock}
    <button class="btn-primary big" data-entry-action="add-expense">⚔️ ${t('add_entry')}</button>`;
  updateSplitInfo(); if (_splitMode !== 'items') renderShareChips(); renderPayerChips();
}
function setQuickPayer(name) { setSinglePayer(name); }
function handleEntryAction(button, event) {
  const action = button.dataset.entryAction;
  if (action === 'toggle-icon-picker') {
    toggleIconPicker({ currentTarget: button });
  } else if (action === 'pick-icon') {
    pickExpenseIcon(button.dataset.icon);
  } else if (action === 'pick-receipt') {
    pickReceipt();
  } else if (action === 'remove-receipt') {
    removeReceipt();
  } else if (action === 'add-loot') {
    addLootItem();
  } else if (action === 'remove-loot') {
    removeLootItem(button.dataset.id);
  } else if (action === 'select-all-shares') {
    selectAllShares();
  } else if (action === 'add-expense') {
    addExpense();
  }
}
function bindAppShellEvents() {
  document.addEventListener('click', event => {
    const langButton = event.target.closest('.lang-btn[data-lang]');
    if (langButton) {
      setLang(langButton.dataset.lang);
      return;
    }

    const entryButton = event.target.closest('[data-entry-mode]');
    if (entryButton) {
      setEntryMode(entryButton.dataset.entryMode);
      return;
    }

    const settleButton = event.target.closest('[data-settle-view]');
    if (settleButton) {
      setSettleView(settleButton.dataset.settleView);
      return;
    }

    const entryAction = event.target.closest('[data-entry-action]');
    if (entryAction) {
      handleEntryAction(entryAction, event);
      return;
    }

    const payerModeButton = event.target.closest('[data-payer-mode]');
    if (payerModeButton) {
      setPayerMode(payerModeButton.dataset.payerMode);
      return;
    }

    const splitModeButton = event.target.closest('[data-split-mode]');
    if (splitModeButton) {
      setSplitMode(splitModeButton.dataset.splitMode);
      return;
    }

    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;
    const actions = {
      'edit-trip-name': startEditTrip,
      'quest-board': openQuestBoard,
      'new-trip': newTrip,
      'share-trip': shareTrip,
      'template-modal': openTemplateModal,
      'import-modal': openImportModal,
      'export-excel': exportExcel,
      'clear-expenses': confirmClearExpenses,
      settings: openSettings
    };
    actions[actionButton.dataset.action]?.();
  });

  document.addEventListener('input', event => {
    if (event.target.id === 'exp-date') {
      _expenseDate = event.target.value;
      return;
    }
    if (
      event.target.id === 'exp-amount' ||
      event.target.classList.contains('payer-value') ||
      event.target.classList.contains('weight-value')
    ) {
      updateSplitInfo();
      return;
    }
    if (event.target.classList.contains('loot-name') || event.target.classList.contains('loot-amount')) {
      updateLootTotal();
    }
  });

  document.addEventListener('change', event => {
    if (event.target.id === 'import-input') importExcel(event.target);
    if (event.target.id === 'custom-avatar-input') loadCustomAvatar(event.target);
    if (event.target.id === 'receipt-input') loadReceipt(event.target);
  });

  document.addEventListener('focusout', event => {
    if (event.target.id === 'trip-name-input') saveTrip();
  });

  document.addEventListener('keydown', event => {
    if (event.target.id === 'trip-name-input' && event.key === 'Enter') saveTrip();
    if ((event.target.id === 'exp-desc' || event.target.id === 'exp-amount') && event.key === 'Enter') addExpense();
  });
}
function addExpense() {
  const desc = document.getElementById('exp-desc').value.trim() || t('quest_fallback');
  captureLootItems();
  const cleanItems = _splitMode === 'items'
    ? _lootItems.map(item => ({
      name: String(item.name || '').trim() || t('loot_item_name'),
      amount: Number(item.amount) || 0,
      claimedBy: (item.claimedBy || []).filter(name => S.participants.includes(name))
    })).filter(item => item.amount > 0)
    : [];
  const amount = _splitMode === 'items' ? cleanItems.reduce((sum, item) => sum + item.amount, 0) : parseFloat(document.getElementById('exp-amount').value);
  const paidBy = document.getElementById('exp-payer').value;
  let shared = sharedBy();
  const icon = questIconId(document.getElementById('exp-icon-value').value || QUEST_ICONS[0]);
  if (!amount || amount <= 0) { toast(t('err_amount')); return; }
  if (_splitMode === 'items' && !cleanItems.length) { toast(t('err_loot_items')); return; }
  if (_splitMode === 'items') {
    const claimers = [...new Set(cleanItems.flatMap(item => item.claimedBy))];
    const hasUnclaimed = cleanItems.some(item => !item.claimedBy.length);
    shared = hasUnclaimed ? S.participants.slice() : (claimers.length ? claimers : S.participants.slice());
  }
  const payers = {};
  if (_payerMode === 'multi') {
    document.querySelectorAll('.payer-value').forEach(el => { const n = Number(el.value) || 0; if (n > 0) payers[el.dataset.name] = n; });
    if (!Object.keys(payers).length) { toast(t('err_payer')); return; }
  } else if (!paidBy) { toast(t('err_payer')); return; }
  if (!shared.length) { toast(t('err_sharers')); return; }
  const weights = {};
  if (_splitMode !== 'equal') document.querySelectorAll('.weight-value').forEach(el => { weights[el.dataset.name] = Number(el.value) || 0; });
  const exp = {
    id: Date.now() + Math.random(), desc, icon, amount,
    paidBy: _payerMode === 'multi' ? Object.keys(payers)[0] : paidBy,
    payers: _payerMode === 'multi' ? payers : undefined,
    sharedBy: shared,
    split: _splitMode === 'equal' ? undefined : (_splitMode === 'items' ? { mode: 'items', items: cleanItems } : { mode: _splitMode, weights }),
    receipt: _receiptData || undefined,
    date: document.getElementById('exp-date')?.value || undefined
  };
  S.expenses.push(exp);
  _settledTx = [];
  _resetEntryDraft = true;
  SFX.coin();
  save(); renderAll(); toast(t('success_added'));
}
function deleteExpense(id) {
  S.expenses = S.expenses.filter(e => e.id !== id);
  _settledTx = [];
  save(); renderAll();
}
function confirmClearExpenses() {
  if (!S.expenses.length) return;
  if (confirm(t('confirm_clear_log'))) {
    S.expenses = []; S.settleXp = {}; _settledTx = [];
    save(); renderAll();
  }
}
function renderLog(party) {
  document.getElementById('expense-count').textContent = S.expenses.length;
  const total = S.expenses.reduce((a,e) => a + e.amount, 0);
  document.getElementById('party-total').textContent = money(total);
  const el = document.getElementById('quest-log');
  if (!S.expenses.length) { el.innerHTML = `<div class="empty">⚔️ ${t('no_quests')}</div>`; return; }
  const byName = Object.fromEntries(party.map(p => [p.name, p]));
  el.innerHTML = `<div class="quest-rows">${S.expenses.slice().reverse().map(e => {
    const shares = splitShares(e, S.participants);
    const parts = Object.keys(shares);
    const payers = Object.keys(payerMap(e)).filter(name => byName[name]);
    const payer = payers.length === 1 ? byName[payers[0]] : null;
    const splitMode = e.split?.mode || 'equal';
    const modeKey = { shares:'split_shares', exact:'split_exact', percent:'split_percent', items:'split_items' }[splitMode];
    const generosityXp = Math.round(Object.entries(payerMap(e)).reduce((sum, [name, paid]) => sum + Math.max(0, paid - (shares[name] || 0)), 0));
    const splitLabel = splitMode === 'equal' && parts.length
      ? `${money2(e.amount / parts.length)} ${t('each')}`
      : parts.map(name => `${h(name)} ${money2(shares[name] || 0)}`).join(' · ');
    const dateLabel = e.date ? new Date(e.date).toLocaleString(LANG === 'th' ? 'th-TH' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '';
    return `<div class="quest-row">
      <div class="qr-icon">${questIconMarkup(e.icon || QUEST_ICONS[0], 32)}</div>
      <div class="qr-main">
        <div class="qr-name">${h(e.desc)}${modeKey ? `<span class="qr-mode">${t(modeKey)}</span>` : ''}</div>
        <div class="qr-meta">
          ${payer ? `<span>${heroAvatar(payer.name, 18)} ${h(payer.name)}</span>` : payers.length > 1 ? `<span>${payers.map(name => CLASSES[classOf(name)].glyph).join('')} ${t('payer_count',{n:payers.length})}</span>` : ''}
          <span>·</span>
          <span>${parts.map(p => CLASSES[classOf(p)].glyph).join('')} <span style="font-family:var(--font-stat)">${splitLabel}</span></span>
          ${dateLabel ? `<span>·</span><span>${h(dateLabel)}</span>` : ''}
          ${e.receipt ? `<button type="button" class="receipt-btn" style="padding:3px 7px;font-size:11px" onclick="openReceipt(${q(e.receipt)})"><img class="receipt-mini" src="${e.receipt}" alt=""> ${t('view_receipt')}</button>` : ''}
        </div>
      </div>
      <div class="qr-right"><div class="qr-amt">${money(e.amount)}</div>${generosityXp ? `<div class="qr-xp">+${generosityXp} ${t('xp')}</div>` : ''}</div>
      <button class="qr-del" onclick="deleteExpense(${e.id})">×</button>
    </div>`;
  }).join('')}<div class="log-total"><span>${t('party_gold')}</span><strong>${money(total)}</strong></div></div>`;
}
function setSettleView(view) { S.settings.settleView = view; save(); renderSettlement(computeParty()); }
function settleOne(key, from, to) {
  _settledTx.push(key);
  S.settleXp[from] = (Number(S.settleXp[from]) || 0) + SETTLE_BONUS_PAYER;
  S.settleXp[to] = (Number(S.settleXp[to]) || 0) + SETTLE_BONUS_PAYEE;
  SFX.heal();
  save(); renderAll();
}
function openTribute(from, to, amount) {
  _tributeTx = { from, to, amount, key: from + '>' + to };
  _tributeEdit = !validPromptPay(S.promptpay?.[to]);
  _overlay = 'tribute';
  SFX.click();
  renderOverlay();
}
function savePromptPay(name) {
  const digits = String(document.getElementById('promptpay-input')?.value || '').replace(/\D/g, '');
  if (!validPromptPay(digits)) { toast(t('promptpay_invalid')); return; }
  S.promptpay ||= {};
  S.promptpay[name] = digits;
  _tributeEdit = false;
  SFX.click();
  save();
  renderOverlay();
}
function confirmTributePaid() {
  if (!_tributeTx) return;
  const { key, from, to } = _tributeTx;
  _overlay = null;
  _tributeTx = null;
  settleOne(key, from, to);
}
function renderSettlement(party) {
  document.getElementById('settle-list-btn').classList.toggle('on', (S.settings.settleView || 'list') === 'list');
  document.getElementById('settle-map-btn').classList.toggle('on', S.settings.settleView === 'map');
  const el = document.getElementById('settle-body');
  if (!S.expenses.length || party.length < 2) { el.innerHTML = `<div class="empty">${t('no_quests')}</div>`; return; }
  const txns = settleUp(party).filter(tx => !_settledTx.includes(tx.from + '>' + tx.to));
  if (!txns.length) {
    el.innerHTML = `<div class="settled"><div class="emoji">🛡️✨</div><div class="title">${t('settled_msg')}</div><div class="sub">${t('rest_msg')}</div></div>`;
    return;
  }
  const byName = Object.fromEntries(party.map(p => [p.name, p]));
  if (S.settings.settleView === 'map') {
    const max = Math.max(1, ...party.map(p => Math.abs(p.bal)));
    el.innerHTML = `<div class="debt-map">${party.slice().sort((a,b) => b.bal - a.bal).map(p => {
      const pos = p.bal > .5, neg = p.bal < -.5, w = Math.round((Math.abs(p.bal) / max) * 50);
      return `<div class="debt-row">
        <div class="debt-name">${heroAvatar(p.name, 32)}<span>${h(p.name)}</span></div>
        <div class="debt-track"><span class="debt-zero"></span>${pos || neg ? `<span class="debt-fill ${pos ? 'pos' : 'neg'}" style="width:${w}%"></span>` : ''}</div>
        <div class="debt-val ${pos ? 'pos' : neg ? 'neg' : ''}">${pos ? '+' + money(p.bal) : neg ? '−' + money(-p.bal) : t('even')}</div>
      </div>`;
    }).join('')}</div>`;
    return;
  }
  el.innerHTML = `<div class="tribute-list"><div class="field-label">${t('tributes')}</div>${txns.map(tx => {
    const from = byName[tx.from], to = byName[tx.to], key = tx.from + '>' + tx.to;
    return `<div class="tribute">
      <div class="tr-person">${heroAvatar(tx.from, 38, from?.hp ?? null)}<span>${h(tx.from)}</span></div>
      <div class="tr-mid"><div class="tr-amt">${money(tx.amount)}</div><div>⮕</div></div>
      <div class="tr-person">${heroAvatar(tx.to, 38)}<span>${h(tx.to)}</span></div>
      <button class="btn-primary sm" onclick="openTribute(${q(tx.from)},${q(tx.to)},${Number(tx.amount) || 0})">💸 ${t('send_tribute')}</button>
    </div>`;
  }).join('')}</div>`;
}
function openTemplateModal() { _overlay = 'templates'; SFX.click(); renderOverlay(); }
function openImportModal() { _overlay = 'import'; SFX.click(); renderOverlay(); }
function openSettings() { _overlay = 'settings'; SFX.click(); renderOverlay(); }
function closeOverlay() { _overlay = null; renderOverlay(); }
function startOnboarding() {
  _overlay = null;
  SFX.click();
  renderOverlay();
  openAddHero();
}
function useTemplate(id) {
  const tp = QUEST_TEMPLATES.find(x => x.id === id);
  if (!tp || !S.participants.length) return;
  const payer = S.participants[0];
  tp.items.forEach(([icon, th, en, amount], i) => {
    S.expenses.push({ id: Date.now() + i + Math.random(), desc: LANG === 'en' ? en : th, icon: questIconId(icon), amount, paidBy: payer, sharedBy: S.participants.slice() });
  });
  _settledTx = []; _overlay = null; SFX.coin(); save(); renderAll(); toast(t('imported_items', { n: tp.items.length }));
}
function parseImportItems(text) {
  return PointyLogic.parseImportItems(text);
}
function updateImportCount() {
  const el = document.getElementById('import-count');
  if (el) el.textContent = t('import_parsed_count', { n: parseImportItems(document.getElementById('import-text')?.value || '').length });
}
function importTextItems() {
  const items = parseImportItems(document.getElementById('import-text')?.value || '');
  if (!items.length || !S.participants.length) return;
  const payer = S.participants[0];
  items.forEach((item, i) => S.expenses.push({
    id: Date.now() + i + Math.random(), desc: item.desc, icon: '📜', amount: item.amount,
    paidBy: payer, sharedBy: S.participants.slice()
  }));
  _settledTx = []; _overlay = null; SFX.coin(); save(); renderAll(); toast(t('imported_items', { n: items.length }));
}
function renderQuickToggles() {
  const root = document.getElementById('quick-toggles');
  if (!root) return;
  const soundOn = S.settings.sound !== false;
  const animOn = S.settings.animations !== false;
  root.innerHTML = `
    <button class="quick-toggle ${soundOn ? '' : 'off'}" type="button" onclick="quickToggleSetting('sound')" aria-label="${h(t('sound_effects'))}" title="${h(t('sound_effects'))}" aria-pressed="${soundOn}">${soundOn ? '🔊' : '🔇'}</button>
    <button class="quick-toggle ${animOn ? '' : 'off'}" type="button" onclick="quickToggleSetting('animations')" aria-label="${h(t('animations'))}" title="${h(t('animations'))}" aria-pressed="${animOn}">${animOn ? '✨' : '◌'}</button>`;
}
function quickToggleSetting(key) {
  S.settings[key] = !S.settings[key];
  applySettings();
  saveNow();
  renderOverlay();
  if (key === 'sound' && S.settings.sound) SFX.click();
}
function setTheme(theme) { S.settings.theme = theme === 'dungeon' ? 'dungeon' : 'tavern'; applySettings(); save(); renderAll(false); renderOverlay(); }
function setAccent(color) { if (ACCENTS.includes(color)) S.settings.accent = color; applySettings(); save(); renderAll(false); renderOverlay(); }
function toggleSetting(key) { S.settings[key] = !S.settings[key]; applySettings(); save(); renderAll(false); renderOverlay(); if (key === 'sound' && S.settings.sound) SFX.click(); }
async function setupAdmin() {
  const pass = document.getElementById('admin-pass-new')?.value || '';
  const slug = sanitizeTripSlug(document.getElementById('admin-url-id')?.value || tripId);
  const canMove = slug !== tripId && canChangeTripUrl();
  if (pass.length < 4) { toast(t('admin_pass_short')); return; }
  if (!slug) { toast(t('admin_url_invalid')); return; }
  S.admin = { ...(S.admin || {}), passwordHash: adminHash(pass), createdAt: S.admin?.createdAt || Date.now(), urlLocked: true };
  sessionStorage.setItem(adminSessionKey(), '1');
  sessionStorage.removeItem(adminLockKey());
  if (canMove) {
    tripId = slug;
    tripRef = TEST_MODE ? testTripRef(tripId) : cloudTripRef(tripId);
    sessionStorage.setItem(adminSessionKey(), '1');
    sessionStorage.removeItem(adminLockKey());
    const next = new URL(tripLinkFor(tripId));
    history.replaceState(null, '', next.pathname + next.search);
    if (!TEST_MODE) localStorage.setItem('last_trip_id', tripId);
    await tripRef.set({ ...S, updatedAt: TEST_MODE ? Date.now() : firebase.firestore.FieldValue.serverTimestamp() });
    toast(t('admin_url_saved'));
    renderAll(false);
    return;
  }
  save(); renderOverlay(); toast(t('admin_saved'));
}
function unlockAdmin() {
  const pass = document.getElementById('admin-pass')?.value || '';
  if (adminHash(pass) !== S.admin?.passwordHash) { toast(t('admin_bad_pass')); return; }
  sessionStorage.setItem(adminSessionKey(), '1');
  sessionStorage.removeItem(adminLockKey());
  renderOverlay();
  toast(t('admin_unlocked'));
}
function lockAdmin() {
  sessionStorage.removeItem(adminSessionKey());
  sessionStorage.setItem(adminLockKey(), '1');
  renderOverlay();
  toast(t('admin_locked'));
}
function copyAdminLink() {
  navigator.clipboard.writeText(tripLinkFor()).then(() => toast(t('toast_link_copied')));
}
async function saveCharacterId(name) {
  if (!isAdminUnlocked()) return;
  const el = document.getElementById('char-id-' + hashOf(name));
  const next = String(el?.value || '').replace(/\D/g, '').slice(0, 4);
  if (!/^\d{4}$/.test(next)) { toast(t('char_id_invalid')); return; }
  const old = S.characterIds[name];
  if (!_characterRegistry[next]) await loadCharacterRegistry([next]);
  if (old && old !== next && _characterRegistry[old]) {
    persistCharacterRecord({ ...(_characterRegistry[next] || {}), ..._characterRegistry[old], id: next, updatedAt: Date.now() });
    deleteCharacterRecord(old);
  } else {
    persistCharacterRecord({ ...(_characterRegistry[next] || {}), id: next, name, class: classOf(name), gender: genderOf(name), trips: _characterRegistry[next]?.trips || {}, createdAt: _characterRegistry[next]?.createdAt || Date.now(), updatedAt: Date.now() });
  }
  S.characterIds[name] = next;
  save(); renderAll(false); renderOverlay(); toast(t('char_id_saved'));
}
function resetCharacterId(name) {
  if (!isAdminUnlocked()) return;
  const old = S.characterIds[name];
  if (old) deleteCharacterRecord(old);
  S.characterIds[name] = generateCharacterId();
  save(); renderAll(false); renderOverlay(); toast(t('char_id_reset'));
}
function adminDeleteHero(name) {
  if (!isAdminUnlocked()) return;
  removeParticipant(name);
  renderOverlay();
}
function renderAdminPanel() {
  const link = tripLinkFor();
  if (!isAdminConfigured()) {
    return `<div class="settings-section">
      <div>
        <div class="settings-label">${t('admin_setup')}</div>
        <div class="settings-sub">${t('admin_setup_sub')}</div>
      </div>
      <div class="admin-box">
        <div class="field"><label>${t('admin_url')}</label><input id="admin-url-id" class="field-input" value="${h(sanitizeTripSlug(tripId))}" ${canChangeTripUrl() ? '' : 'disabled'}></div>
        <div class="field"><label>${t('admin_password')}</label><input id="admin-pass-new" class="field-input" type="password" autocomplete="new-password" placeholder="${h(t('admin_password_placeholder'))}"></div>
        <button class="btn-primary sm" onclick="setupAdmin()">${t('admin_create')}</button>
      </div>
    </div>`;
  }
  if (!isAdminUnlocked()) {
    return `<div class="settings-section">
      <div>
        <div class="settings-label">${t('admin_controls')}</div>
        <div class="settings-sub">${t('admin_locked_sub')}</div>
      </div>
      <div class="admin-box admin-row">
        <div class="field"><label>${t('admin_password')}</label><input id="admin-pass" class="field-input" type="password" autocomplete="current-password" onkeydown="if(event.key==='Enter')unlockAdmin()"></div>
        <button class="btn-primary sm" onclick="unlockAdmin()">${t('admin_unlock')}</button>
      </div>
    </div>`;
  }
  const rows = S.participants.map(name => {
    const id = ensureCharacterId(name);
    const rec = _characterRegistry[id] || {};
    return `<tr>
      <td>${h(name)}</td>
      <td><input id="char-id-${hashOf(name)}" class="admin-id-input" maxlength="4" inputmode="numeric" value="${h(id)}"></td>
      <td>${Math.round(Number(rec.xp) || characterBaseXp(name) || 0)} XP</td>
      <td>${h(CLASSES[classOf(name)][LANG] || CLASSES[classOf(name)].th)}</td>
      <td><div class="admin-actions"><button class="btn-ghost xs" onclick="saveCharacterId(${q(name)})">${t('btn_save')}</button><button class="btn-ghost xs" onclick="resetCharacterId(${q(name)})">${t('char_id_new')}</button><button class="btn-ghost xs danger" onclick="adminDeleteHero(${q(name)})">${t('del_title')}</button></div></td>
    </tr>`;
  }).join('');
  return `<div class="settings-section">
    <div>
      <div class="settings-label">${t('admin_controls')}</div>
      <div class="settings-sub">${t('admin_controls_sub')}</div>
    </div>
    <div class="admin-box">
      <div class="field"><label>${t('admin_url')}</label><input class="field-input" value="${h(link)}" readonly></div>
      <div class="admin-actions"><button class="btn-ghost xs" onclick="copyAdminLink()">🔗 ${t('btn_share')}</button><button class="btn-ghost xs" onclick="lockAdmin()">${t('admin_lock')}</button></div>
      <table class="admin-table"><thead><tr><th>${t('hero_name_short')}</th><th>${t('character_id')}</th><th>${t('xp')}</th><th>${t('pick_class')}</th><th>${t('admin_actions')}</th></tr></thead><tbody>${rows || `<tr><td colspan="5">${t('no_participants')}</td></tr>`}</tbody></table>
    </div>
  </div>`;
}
function renderOverlay() {
  const root = document.getElementById('app-overlays');
  if (!root) return;
  if (!_overlay) { root.innerHTML = ''; return; }
  if (_overlay === 'onboarding') {
    root.innerHTML = `<div class="picker-overlay"><div class="picker" onclick="event.stopPropagation()">
      <div class="victory-card" style="width:100%;box-shadow:none;border:0;background:transparent;padding:14px 8px 8px">
        <div class="vc-crown">⚔️</div>
        <div class="vc-title">${t('onboarding_title')}</div>
        <div class="vc-sub">${t('onboarding_sub')}</div>
        <button class="btn-gold" style="width:100%;margin-top:18px" onclick="startOnboarding()">＋ ${t('onboarding_start')}</button>
        <button class="btn-ghost" style="width:100%;margin-top:10px" onclick="_overlay='settings';renderOverlay()">⚙ ${t('admin_setup')}</button>
      </div>
    </div></div>`;
    return;
  }
  if (_overlay === 'new-trip') {
    const code = _newTripCode || makeTripCode();
    _newTripCode = code;
    const adminPass = _newTripAdminPass || makeAdminCode();
    _newTripAdminPass = adminPass;
    root.innerHTML = `<div class="picker-overlay" onclick="closeOverlay()"><div class="picker" onclick="event.stopPropagation()">
      <div class="picker-head"><div><div class="picker-title">✚ ${t('new_trip_setup')}</div><div class="picker-sub">${t('new_trip_setup_sub')}</div></div><button class="picker-close" onclick="closeOverlay()">✕</button></div>
      <div class="admin-box">
        <div class="field">
          <label>${t('new_trip_code')}</label>
          <input id="new-trip-code" class="field-input" inputmode="numeric" maxlength="4" value="${h(code)}" placeholder="0000" oninput="this.value=this.value.replace(/\\D/g,'').slice(0,4);_newTripCode=this.value">
          <div class="settings-sub">${t('new_trip_code_hint')}</div>
        </div>
        <button class="btn-ghost" type="button" onclick="randomizeNewTripCode()">🎲 ${t('new_trip_random')}</button>
        <div class="field">
          <label>${t('new_trip_admin_pass')}</label>
          <input id="new-trip-admin-pass" class="field-input" autocomplete="new-password" value="${h(adminPass)}" placeholder="${h(t('admin_password_placeholder'))}" oninput="_newTripAdminPass=this.value">
          <div class="settings-sub">${t('new_trip_admin_hint')}</div>
        </div>
        <button class="btn-ghost" type="button" onclick="randomizeNewTripAdminPass()">🎲 ${t('new_trip_admin_random')}</button>
      </div>
      <div class="import-actions"><button class="btn-ghost" onclick="closeOverlay()">${t('btn_cancel')}</button><button class="btn-primary" onclick="confirmNewTrip()">✚ ${t('new_trip_start')}</button></div>
    </div></div>`;
    return;
  }
  if (_overlay === 'board') {
    syncActiveCampaign();
    const campaigns = (S.campaigns || []).slice();
    root.innerHTML = `<div class="picker-overlay" onclick="closeOverlay()"><div class="picker modal-wide" onclick="event.stopPropagation()">
      <div class="picker-head"><div><div class="picker-title">🗺️ ${t('quest_board')}</div><div class="picker-sub">${t('quest_board_sub')}</div></div><button class="picker-close" onclick="closeOverlay()">✕</button></div>
      <div class="board-grid">${campaigns.map(c => {
        const total = (c.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const active = c.id === S.activeCampaignId;
        const status = active ? t('active_quest') : c.completedAt ? t('completed_quest') : t('saved_quest');
        return `<div class="board-card ${active ? 'active' : ''}">
          <div><div class="board-title">${h(c.tripName || t('trip_fallback_name'))}</div><div class="board-meta">${status} · ${(c.participants || []).length} ${t('party')} · ${(c.expenses || []).length} ${t('quest_count')} · ${money(total)}</div></div>
          <div class="board-actions">
            ${active ? `<button class="btn-ghost xs" onclick="completeCampaign()">🏁 ${t('complete_quest')}</button>` : `<button class="btn-primary sm" onclick="openCampaign('${c.id}')">${t('open_quest')}</button>`}
            ${campaigns.length > 1 ? `<button class="btn-ghost xs danger" onclick="deleteCampaign('${c.id}')">${t('del_title')}</button>` : ''}
          </div>
        </div>`;
      }).join('')}</div>
      <hr class="modal-divider">
      <div class="import-actions"><button class="btn-ghost" onclick="closeOverlay()">${t('btn_cancel')}</button><button class="btn-primary" onclick="newTrip()">＋ ${t('new_trip_start')}</button></div>
    </div></div>`;
    return;
  }
  if (_overlay === 'receipt') {
    root.innerHTML = `<div class="picker-overlay" onclick="closeOverlay()"><div onclick="event.stopPropagation()">
      <button class="picker-close" style="position:fixed;right:22px;top:22px" onclick="closeOverlay()">✕</button>
      <img class="lightbox-img" src="${_receiptView || ''}" alt="${h(t('receipt'))}">
    </div></div>`;
    return;
  }
  if (_overlay === 'tribute' && _tributeTx) {
    const pp = S.promptpay?.[_tributeTx.to] || '';
    const ok = validPromptPay(pp);
    const payload = ok ? promptPayPayload(pp, Number(_tributeTx.amount) || 0) : '';
    root.innerHTML = `<div class="picker-overlay" onclick="closeOverlay()"><div class="picker" onclick="event.stopPropagation()">
      <div class="picker-head"><div><div class="picker-title">💸 ${t('send_tribute')}</div><div class="picker-sub">${h(_tributeTx.from)} → ${h(_tributeTx.to)} · ${money2(_tributeTx.amount)}</div></div><button class="picker-close" onclick="closeOverlay()">✕</button></div>
      <div class="tribute-summary">${heroAvatar(_tributeTx.from, 42)}<span>${money2(_tributeTx.amount)}</span><span>⮕</span>${heroAvatar(_tributeTx.to, 42)}<strong>${h(_tributeTx.to)}</strong></div>
      ${!ok || _tributeEdit ? `<div class="pp-form">
        <div class="settings-sub">${t('promptpay_missing')}</div>
        <div class="field"><label>${t('promptpay')}</label><input id="promptpay-input" class="field-input" inputmode="numeric" value="${h(pp)}" placeholder="${h(t('promptpay_placeholder'))}" onkeydown="if(event.key==='Enter')savePromptPay(${q(_tributeTx.to)})"></div>
        <button class="btn-primary" onclick="savePromptPay(${q(_tributeTx.to)})">${t('save_promptpay')}</button>
      </div>` : `<div class="qr-paybox">
        <div class="settings-sub">${t('scan_to_pay')} · ${fmtPP(pp)}</div>
        ${qrSvg(payload, 260)}
        <div class="import-actions" style="width:100%"><button class="btn-ghost" onclick="_tributeEdit=true;renderOverlay()">${t('edit_promptpay')}</button><button class="btn-primary" onclick="confirmTributePaid()">✓ ${t('confirm_paid')}</button></div>
      </div>`}
    </div></div>`;
    return;
  }
  if (_overlay === 'templates') {
    root.innerHTML = `<div class="picker-overlay" onclick="closeOverlay()"><div class="picker modal-wide" onclick="event.stopPropagation()">
      <div class="picker-head"><div><div class="picker-title">📋 ${t('pick_template')}</div></div><button class="picker-close" onclick="closeOverlay()">✕</button></div>
      <div class="tmpl-grid">${QUEST_TEMPLATES.map(tp => {
        const total = tp.items.reduce((sum, item) => sum + item[3], 0);
        return `<div class="tmpl-card"><div class="tmpl-top"><span class="tmpl-icon">${questIconMarkup(tp.icon, 32)}</span><div><div class="tmpl-name">${h(tp[LANG] || tp.th)}</div><div class="tmpl-meta">${tp.items.length} ${LANG === 'en' ? 'quests' : 'เควส'} · ${money(total)}</div></div></div>
          <div class="tmpl-items">${tp.items.map(item => `<div class="tmpl-item"><span class="ti-label">${questIconMarkup(item[0], 18)} ${h(LANG === 'en' ? item[2] : item[1])}</span><span>${money(item[3])}</span></div>`).join('')}</div>
          <button class="btn-primary sm" onclick="useTemplate('${tp.id}')">＋ ${t('use_template')}</button></div>`;
      }).join('')}</div>
      <hr class="modal-divider"><button class="btn-ghost" onclick="downloadTemplate()">📥 ${t('download_excel_template')}</button>
    </div></div>`;
    return;
  }
  if (_overlay === 'import') {
    root.innerHTML = `<div class="picker-overlay" onclick="closeOverlay()"><div class="picker" onclick="event.stopPropagation()">
      <div class="picker-head"><div><div class="picker-title">📥 ${t('import_scroll')}</div><div class="picker-sub">${t('import_scroll_hint')}</div></div><button class="picker-close" onclick="closeOverlay()">✕</button></div>
      <textarea id="import-text" class="import-area" placeholder="${h(t('import_scroll_placeholder'))}" oninput="updateImportCount()"></textarea>
      <div id="import-count" class="import-count">${t('import_parsed_count', { n: 0 })}</div>
      <div class="import-actions"><button class="btn-ghost" onclick="closeOverlay();triggerImport()">📊 ${t('import_excel_btn')}</button><button class="btn-primary" onclick="importTextItems()">📥 ${t('import_text_btn')}</button></div>
    </div></div>`;
    return;
  }
  if (_overlay === 'settings') {
    root.innerHTML = `<div class="picker-overlay" onclick="closeOverlay()"><div class="picker" onclick="event.stopPropagation()">
      <div class="picker-head"><div class="picker-title">⚙ ${t('settings')}</div><button class="picker-close" onclick="closeOverlay()">✕</button></div>
      <div class="settings-grid">
        <div class="settings-row"><div><div class="settings-label">${t('theme')}</div></div><div class="setting-seg"><button class="${S.settings.theme === 'tavern' ? 'on' : ''}" onclick="setTheme('tavern')">${t('theme_tavern')}</button><button class="${S.settings.theme === 'dungeon' ? 'on' : ''}" onclick="setTheme('dungeon')">${t('theme_dungeon')}</button></div></div>
        <div class="settings-row"><div class="settings-label">${t('accent')}</div><div class="swatches">${ACCENTS.map(color => `<button class="swatch ${S.settings.accent === color ? 'on' : ''}" style="background:${color}" onclick="setAccent('${color}')" aria-label="${color}"></button>`).join('')}</div></div>
        <div class="settings-row"><div><div class="settings-label">${t('game_stats')}</div><div class="settings-sub">HP / LVL / XP</div></div><button class="switch ${S.settings.stats ? 'on' : ''}" onclick="toggleSetting('stats')" aria-pressed="${S.settings.stats}"></button></div>
        <div class="settings-row"><div class="settings-label">${t('sound_effects')}</div><button class="switch ${S.settings.sound ? 'on' : ''}" onclick="toggleSetting('sound')" aria-pressed="${S.settings.sound}"></button></div>
        <div class="settings-row"><div class="settings-label">${t('animations')}</div><button class="switch ${S.settings.animations !== false ? 'on' : ''}" onclick="toggleSetting('animations')" aria-pressed="${S.settings.animations !== false}"></button></div>
        ${renderAdminPanel()}
      </div>
    </div></div>`;
    return;
  }
  if (_overlay === 'victory') {
    const party = computeParty();
    const mvp = party.slice().sort((a,b) => b.gen - a.gen)[0];
    const settler = party.slice().sort((a,b) => (Number(S.settleXp[b.name])||0) - (Number(S.settleXp[a.name])||0))[0];
    const total = S.expenses.reduce((sum,e) => sum + e.amount, 0);
    const colors = ['var(--gold)','var(--accent)','var(--hp)','#6d5ae0','#2a7fb8','#ffe79c'];
    root.innerHTML = `<div class="victory-overlay" onclick="closeOverlay()"><div class="confetti">${Array.from({length:18},(_,i) => `<i style="left:${5+i*5.2}%;background:${colors[i%colors.length]};animation-delay:${(i%9)*.12}s"></i>`).join('')}</div>
      <div class="victory-card" onclick="event.stopPropagation()"><div class="vc-crown">🏆</div><div class="vc-title">${t('quest_complete')}</div><div class="vc-sub">${t('quest_complete_sub')}</div>
      <div class="vc-recap"><div class="vc-stat"><strong>${money(total)}</strong><span>${t('total_spent')}</span></div><div class="vc-stat"><strong>${S.expenses.length}</strong><span>${t('quest_count')}</span></div><div class="vc-stat"><strong>${party.length}</strong><span>${t('party')}</span></div></div>
      <div class="vc-awards">${mvp?.gen > 0 ? `<div class="vc-award"><span style="font-size:26px">🥇</span>${heroAvatar(mvp.name,46)}<div><strong>${h(mvp.name)}</strong><small>${t('most_generous')} · ${t('fronted')} ${money(mvp.gen)}</small></div></div>` : ''}
      ${settler && Number(S.settleXp[settler.name]) > 0 && settler.name !== mvp?.name ? `<div class="vc-award"><span style="font-size:26px">🤝</span>${heroAvatar(settler.name,46)}<div><strong>${h(settler.name)}</strong><small>${t('top_settler')}</small></div></div>` : ''}</div>
      <button class="btn-gold" style="width:100%" onclick="closeOverlay()">⚔️ ${t('view_party')}</button></div></div>`;
  }
}
function renderAll(checkLevels = true) {
  ensureAllCharacterIds();
  const party = computeParty();
  syncCharacterRegistry(party);
  if (checkLevels) detectLevelUps(party);
  renderTripName();
  renderParty();
  renderEntry();
  renderLog(party);
  renderSettlement(party);
  const outstanding = settleUp(party).filter(tx => !_settledTx.includes(tx.from + '>' + tx.to)).length;
  if (_prevOutstanding !== null && _prevOutstanding > 0 && outstanding === 0 && S.expenses.length) {
    syncActiveCampaign({ completedAt: Date.now() });
    _overlay = 'victory'; SFX.win(); save();
  }
  _prevOutstanding = outstanding;
  renderOverlay();
  translatePage();
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

async function saveWorkbook(wb, filename) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function xlHeaderRow(row, bgArgb) {
  row.height = 22;
  row.eachCell({ includeEmpty: true }, cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb || 'FF2f8f5b' } };
    cell.alignment = { vertical: 'middle' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF1f6b41' } } };
  });
}
function xlDataRow(row, isAlt) {
  row.height = 18;
  if (isAlt) row.eachCell({ includeEmpty: true }, cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E9D4' } };
  });
}
function cellStr(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return String(v.result ?? v.text ?? '');
  return String(v);
}
async function exportExcel() {
  if (!S.expenses.length) { toast(t('err_no_data')); return; }
  const total = S.expenses.reduce((s, e) => s + e.amount, 0);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Party Ledger';
  const ws1 = wb.addWorksheet('Quest Log');
  [34,14,18,42].forEach((w,i) => ws1.getColumn(i + 1).width = w);
  ws1.views = [{ state: 'frozen', ySplit: 1 }];
  xlHeaderRow(ws1.addRow(['Quest', 'Gold (฿)', 'Paid By', 'Split With']));
  S.expenses.forEach((e, i) => {
    const payers = payerMap(e);
    const payerText = Object.keys(payers).length > 1
      ? Object.entries(payers).map(([name, amount]) => `${name}: ${amount.toFixed(2)}`).join('; ')
      : (Object.keys(payers)[0] || e.paidBy);
    const shares = splitShares(e);
    const splitText = (e.split?.mode || 'equal') === 'equal'
      ? e.sharedBy.join(', ')
      : Object.entries(shares).map(([name, amount]) => `${name}: ${amount.toFixed(2)}`).join('; ');
    const row = ws1.addRow([e.desc, e.amount, payerText, splitText]);
    row.getCell(2).numFmt = '#,##0.00';
    row.getCell(2).alignment = { horizontal: 'right' };
    xlDataRow(row, i % 2 === 1);
  });
  ws1.addRow([]);
  const totRow = ws1.addRow(['Total', total]);
  totRow.getCell(1).font = { bold: true };
  totRow.getCell(2).font = { bold: true };
  totRow.getCell(2).numFmt = '#,##0.00';
  const party = computeParty();
  const txns = settleUp(party);
  const ws2 = wb.addWorksheet('Balance the Party');
  [22,22,16].forEach((w,i) => ws2.getColumn(i + 1).width = w);
  ws2.mergeCells('A1:C1');
  ws2.getCell('A1').value = `Party Ledger: ${S.tripName}`;
  ws2.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF2f8f5b' } };
  ws2.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFefe0b6' } };
  ws2.addRow([]); xlHeaderRow(ws2.addRow(['Hero', 'Balance (฿)', 'Status']));
  party.forEach((p, i) => {
    const row = ws2.addRow([p.name, Math.abs(p.bal), p.bal > .5 ? 'Guardian' : p.bal < -.5 ? 'In Debt' : 'Even']);
    row.getCell(2).numFmt = '#,##0.00';
    row.getCell(2).alignment = { horizontal: 'right' };
    xlDataRow(row, i % 2 === 1);
  });
  ws2.addRow([]); xlHeaderRow(ws2.addRow(['From', 'To', 'Gold (฿)']));
  txns.forEach((tx, i) => {
    const row = ws2.addRow([tx.from, tx.to, tx.amount]);
    row.getCell(3).numFmt = '#,##0.00';
    row.getCell(3).alignment = { horizontal: 'right' };
    xlDataRow(row, i % 2 === 1);
  });
  await saveWorkbook(wb, `${S.tripName || 'party-ledger'}.xlsx`);
}
async function downloadTemplate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Party Ledger';
  const ws1 = wb.addWorksheet('Instructions');
  [18,54,16,42].forEach((w,i) => ws1.getColumn(i + 1).width = w);
  ws1.mergeCells('A1:D1');
  ws1.getCell('A1').value = 'Party Ledger — Import Template';
  ws1.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF2f8f5b' } };
  ws1.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFefe0b6' } };
  ws1.addRow([]); xlHeaderRow(ws1.addRow(['Description', 'Amount (฿)', 'Paid By', 'Split With']));
  [['Dinner',900,'Shane','Shane, Pointy, Arm'],['Gas',500,'Pointy','Shane, Pointy'],['Hotel',3000,'Arm','Shane, Pointy, Arm']].forEach((data, i) => {
    const row = ws1.addRow(data); row.getCell(2).numFmt = '#,##0.00'; xlDataRow(row, i % 2 === 1);
  });
  const ws2 = wb.addWorksheet('Expenses');
  [34,14,18,42].forEach((w,i) => ws2.getColumn(i + 1).width = w);
  ws2.views = [{ state: 'frozen', ySplit: 1 }];
  xlHeaderRow(ws2.addRow(['Description', 'Amount (฿)', 'Paid By', 'Split With']));
  for (let i = 0; i < 20; i++) {
    const row = ws2.addRow(['', null, '', '']);
    row.getCell(2).numFmt = '#,##0.00';
    xlDataRow(row, i % 2 === 1);
  }
  await saveWorkbook(wb, 'party-ledger-template.xlsx');
}
function triggerImport() {
  document.getElementById('import-input').value = '';
  document.getElementById('import-input').click();
}
async function importExcel(input) {
  const file = input.files[0];
  if (!file) return;
  try {
    const buffer = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);
    const ws = wb.worksheets.length > 1 ? wb.worksheets[1] : wb.worksheets[0];
    let imported = 0, firstRow = true;
    ws.eachRow({ includeEmpty: false }, row => {
      if (firstRow) { firstRow = false; return; }
      const v = row.values;
      const desc = cellStr(v[1]).trim();
      const amtNum = parseFloat(cellStr(v[2]));
      const payer = cellStr(v[3]).trim();
      const split = cellStr(v[4]);
      if (!desc || !amtNum || amtNum <= 0 || !payer) return;
      const sharers = split ? split.split(',').map(s => s.trim()).filter(Boolean) : [payer];
      if (!S.participants.includes(payer)) S.participants.push(payer);
      sharers.forEach(p => { if (p && !S.participants.includes(p)) S.participants.push(p); });
      const icon = QUEST_ICONS[hashOf(desc) % QUEST_ICONS.length];
      S.expenses.push({ id: Date.now() + Math.random(), desc, icon, amount: amtNum, paidBy: payer, sharedBy: sharers });
      imported++;
    });
    if (!imported) { toast(t('err_import_empty')); return; }
    _settledTx = [];
    save(); renderAll();
    toast(t('toast_imported', { n: imported }));
  } catch (err) {
    console.error('Import failed', err);
    toast(t('err_import_format'));
  }
}

bindAppShellEvents();
translatePage();
renderAll(false);
load().then(() => { renderAll(false); translatePage(); });
