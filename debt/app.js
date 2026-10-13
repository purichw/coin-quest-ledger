const PARAMS = new URLSearchParams(window.location.search);
const TEST_MODE = PARAMS.get('test') === '1';
const STORE_KEY = TEST_MODE ? 'pointy_test_debt_v1' : 'pointy_debt_v5';
const CHARACTER_REGISTRY_KEY = 'pointy_character_registry_v1';
const AUTH_KEY = 'pointy_auth_v1';
const ACCENTS = ['#2f8f5b', '#c79a2e', '#d4503f', '#6d5ae0', '#2a7fb8'];
const CLASSES = PointyLogic.CLASSES;
const CLASS_ORDER = PointyLogic.CLASS_ORDER;
const DRAGON_TYPES = PointyLogic.DRAGON_TYPES;
const DRAGON_ORDER = PointyLogic.DRAGON_TYPE_ORDER;
const fmtInput = value => PointyLogic.formatNumberInput(value);
const numInput = value => PointyLogic.parseNumberInput(value);
const THEME_KEY = 'pointy_theme';
const UI_KEY = 'coin_quest_ui_v1';
const SKIN_DEFS = {
  'archfiend-male': [
    { id: 'crimson-regent', res: 'crimson-regent-male', th: 'ราชันเลือด', en: 'Crimson Regent' },
    { id: 'archfiend-swimmer', res: 'archfiend-swimmer-male', th: 'อาร์คฟีนด์นักว่ายน้ำ', en: 'Archfiend Swimmer' },
    { id: 'archfiend-swimmer-blackred', res: 'archfiend-swimmer-blackred-male', th: 'อาร์คฟีนด์นักว่ายน้ำดำแดง', en: 'Archfiend Swimmer Black/Red' }
  ]
};

function readJsonSetting(key, fallback = {}) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}
function writeJsonSetting(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}
function normalizeThemeValue(theme) {
  return theme === 'dungeon' ? 'dungeon' : 'tavern';
}
function currentGlobalTheme(fallback = 'tavern') {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dungeon' || saved === 'tavern') return saved;
  } catch (_) {}
  const uiTheme = readJsonSetting(UI_KEY, {}).theme;
  if (uiTheme === 'dungeon' || uiTheme === 'tavern') return uiTheme;
  const domTheme = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme');
  if (domTheme === 'dungeon' || domTheme === 'tavern') return domTheme;
  return normalizeThemeValue(fallback);
}
function persistGlobalTheme(theme) {
  const next = normalizeThemeValue(theme);
  try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
  writeJsonSetting(UI_KEY, { ...readJsonSetting(UI_KEY, {}), theme: next });
  return next;
}
function applyGlobalTheme(theme) {
  const next = persistGlobalTheme(theme);
  document.documentElement.setAttribute('data-theme', next);
  document.body.setAttribute('data-theme', next);
  return next;
}

let S = PointyLogic.normalizeDebtState(loadDebtState());
let SETTINGS = loadSettings();
let STRIKE_OPEN = '';
let EDIT_OPEN = '';
const DRAGON_DETAILS = new Set();
const DEBT_PANELS = { finance: innerWidth >= 600, slayer: innerWidth >= 600, strategy: false, manage: false };
let DEBT_FILTER = 'all';
let DEBT_QUERY = '';
let DEBT_SORT = 'added';
const debtCopy = (th, en) => LANG === 'th' ? th : en;
const debtIcon = name => window.CoinQuestIcons(name);
let EDIT_LOG = {};
let EDIT_LOG_DRAFTS = {};
let ADD_OPEN = false;
let ADD_FORM_DRAFT = {};
let EDIT_FORM_DRAFT = {};
let STRIKE_DRAFT = {};
let FX = {};
let BREATHING = [];
let OVERLAY = '';
let ACCRUAL_NOTE = null;
let POWER_EXTRA = 0;
let flashToken = 0;
let toastTimer;
let audioCtx = null;

function readDebtAccount() {
  if (TEST_MODE) return null;
  try {
    const account = window.PointyScope?.readAuth
      ? window.PointyScope.readAuth()
      : JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    return account && !account.signedOut ? account : null;
  } catch (_) {
    return null;
  }
}

function accountHero() {
  const account = readDebtAccount();
  const character = account?.character || null;
  if (!account || !character) return null;
  const id = String(character.id || account.userId || '').replace(/\D/g, '').slice(0, 4);
  const cls = PointyLogic.normalizeClass(character.class || character.cls || 'dragoon');
  return {
    id,
    name: character.name || account.name || account.username || 'Hero',
    class: cls,
    gender: character.gender === 'female' ? 'female' : 'male',
    skin: character.skin || '',
    account
  };
}

function syncSlayerWithAccount() {
  const hero = accountHero();
  if (!hero) return false;
  S.slayer = {
    ...(S.slayer || {}),
    name: hero.name,
    characterId: hero.id,
    class: hero.class,
    gender: hero.gender,
    skin: hero.skin,
    accountLinked: true
  };
  return true;
}

function fallback(key) {
  const th = {
    nav_debt: 'มังกรหนี้',
    dd_title: 'มังกรหนี้',
    dd_sub: 'ปราบมังกรที่กกหนี้ของคุณไว้ ฟันทีละหมัดจนปลอดหนี้',
    dd_hoard: 'หนี้ที่มังกรกกไว้',
    dd_slain_count: 'มังกรที่ปราบแล้ว',
    dd_free_in: 'ปลอดหนี้ใน',
    dd_months: 'เดือน',
    dd_month_short: 'ด.',
    dd_never: 'ไม่มีวันหมด',
    dd_lair: 'ถ้ำมังกร',
    dd_slayer: 'นักล่ามังกร',
    dd_tactics: 'ยุทธวิธี',
    dd_avalanche: 'ถล่มดอกเบี้ย',
    dd_avalanche_sub: 'ฟัน APR สูงสุดก่อน ประหยัดทองมากสุด',
    dd_snowball: 'ล้มทีละตัว',
    dd_snowball_sub: 'ฟันยอดน้อยสุดก่อน ปราบได้ไวสุด',
    dd_target: 'เป้าหมายถัดไป',
    dd_recommended: 'แนะนำ',
    dd_no_target: 'ไม่มีมังกรเหลือแล้ว',
    dd_forecast: 'คำพยากรณ์',
    dd_power_attack: 'พลังจู่โจมพิเศษ',
    dd_power_sub: 'ทุ่มทองเพิ่มต่อเดือนเข้าใส่เป้าหมาย',
    dd_interest_ahead: 'ดอกเบี้ยที่รออยู่',
    dd_saves: 'ประหยัดดอกเบี้ย',
    dd_sooner: 'เร็วขึ้น',
    dd_debt_free_by: 'ปลอดหนี้ราว',
    dd_strike: 'จู่โจม',
    dd_hit: 'ฟัน!',
    dd_confirm_strike: 'ฟัน!',
    dd_payment: 'ทองต่อเดือน',
    dd_apr: 'อัตราดอกเบี้ย/ปี',
    dd_original: 'พลังเต็ม',
    dd_balance: 'พลังที่เหลือ',
    dd_reclaimed: 'ทวงคืนแล้ว',
    dd_regen: 'ฟื้น/เดือน',
    dd_regen_day: 'ฟื้น/วัน',
    dd_slain: 'ปราบมังกรสำเร็จ!',
    dd_slain_tag: 'ปราบแล้ว',
    dd_add: 'เพิ่มมังกร',
    dd_new: 'มังกรตัวใหม่',
    dd_name: 'ชื่อมังกร',
    dd_name_ph: 'เช่น บัตรเครดิต',
    dd_no_dragons: 'ไม่มีมังกรในถ้ำ คุณปลอดหนี้แล้ว',
    dd_all_slain: 'ปราบครบทุกตัว ปลอดหนี้แล้ว',
    dd_never_warn: 'ทองต่อเดือนยังน้อยกว่าดอกเบี้ย มังกรฟื้นพลังเร็วกว่าที่คุณฟัน',
    dd_log: 'บันทึกการต่อสู้',
    dd_no_log: 'ยังไม่ได้ลงดาบ',
    dd_edit: 'แก้ไข',
    dd_save: 'บันทึก',
    dd_cancel: 'ยกเลิก',
    dd_delete_confirm: 'ปล่อยมังกรตัวนี้ไป? บันทึกการต่อสู้จะหายไป',
    dd_clear_lair: 'ล้างถ้ำ',
    dd_clear_lair_confirm: 'ล้างมังกรทุกตัวและสถิติถ้ำนี้? Character ID ของนักล่าจะยังอยู่',
    dd_end_month: 'ข้ามเดือน',
    dd_end_month_date: 'วันที่จบเดือน',
    dd_end_month_sub: 'จำลองเวลาไป 1 เดือน — มังกรพ่นไฟ ดอกเบี้ยงอก',
    dd_month_passed: 'ดอกเบี้ยงอก!',
    dd_accrued: 'ผ่านไป {n} เดือน · ดอกเบี้ยงอกรวม {amt}',
    dd_accrued_days: 'ผ่านไป {n} วัน · ดอกเบี้ยงอกรวม {amt}',
    dd_weakening: 'มังกรอ่อนแรง!',
    dd_pay_mode: 'การชำระ',
    dd_monthly: 'รายเดือน',
    dd_adhoc: 'จ่ายเมื่อพร้อม',
    dd_adhoc_note: 'จ่ายเมื่อพร้อม ไม่มีกำหนด',
    dd_interest_type: 'ดอกเบี้ย',
    dd_compound: 'ทบต้น',
    dd_simple: 'คงที่',
    dd_minpay: 'ขั้นต่ำ/เดือน',
    dd_due_day: 'ครบกำหนดวันที่',
    dd_due_suffix: 'ของเดือน',
    dd_due_today: 'ครบกำหนดวันนี้',
    dd_due_in: 'ครบกำหนดใน {n} วัน',
    dd_overdue: 'เลยกำหนด!',
    dd_move_strike: 'ฟัน',
    dd_move_fire: 'ลูกไฟ',
    dd_move_bolt: 'สายฟ้า',
    dd_character: 'Character ID',
    dd_character_hint: 'เชื่อมกับโปรไฟล์เดิม หรือสร้าง ID ใหม่จากหน้านี้',
    dd_create_character: 'สร้าง ID',
    dd_open_profile: 'เปิดโปรไฟล์',
    dd_record: 'สถิตินักล่า',
    dd_reclaimed_life: 'ทวงคืนทั้งหมด',
    dd_interest_fed: 'จ่ายดอกเบี้ยไป',
    dd_biggest_hit: 'โจมแรงสุด',
    dd_strike_now: 'โจมตอนนี้',
    dd_apply_target: 'โจม {name} ด้วยยอดรวม',
    dd_edit_strike: 'แตะเพื่อแก้ไข',
    dd_delete: 'ลบ',
    dd_warn_below: 'ยอดจ่ายขั้นต่ำต่ำกว่าดอกเบี้ย — หนี้จะไม่มีวันหมด',
    dd_warn_orig: 'ยอดคงเหลือสูงกว่าเงินต้นได้เมื่อมีดอกเบี้ยสะสม',
    dd_saved: 'บันทึกแล้ว',
    settings: 'ตั้งค่า',
    theme: 'ธีม',
    theme_tavern: 'โรงเตี๊ยม',
    theme_dungeon: 'ดันเจียน',
    accent: 'สีหลัก',
    sound_effects: 'เสียงเอฟเฟกต์',
    animations: 'แอนิเมชัน',
    battle_fx: 'เอฟเฟกต์ต่อสู้',
    full: 'เต็ม',
    minimal: 'เบา',
    strategy: 'ยุทธวิธีหลัก',
    close: 'ปิด'
  };
  const en = {
    nav_debt: 'Debt Dragon',
    dd_title: 'Debt Dragon',
    dd_sub: 'Slay the dragons hoarding your debt, one strike at a time',
    dd_hoard: 'Debt hoarded',
    dd_slain_count: 'Dragons slain',
    dd_free_in: 'Debt-free in',
    dd_months: 'months',
    dd_month_short: 'mo',
    dd_never: 'never',
    dd_lair: 'The Lair',
    dd_slayer: 'Dragon Slayer',
    dd_tactics: 'Battle Tactics',
    dd_avalanche: 'Avalanche',
    dd_avalanche_sub: 'Highest APR first, saves the most gold',
    dd_snowball: 'Snowball',
    dd_snowball_sub: 'Smallest balance first, fastest kills',
    dd_target: 'Next target',
    dd_recommended: 'Recommended',
    dd_no_target: 'No dragons left',
    dd_forecast: 'Forecast',
    dd_power_attack: 'Power Attack',
    dd_power_sub: 'Throw extra gold per month at your target',
    dd_interest_ahead: 'Interest ahead',
    dd_saves: 'Interest saved',
    dd_sooner: 'sooner',
    dd_debt_free_by: 'Debt-free around',
    dd_strike: 'Strike',
    dd_hit: 'Hit!',
    dd_confirm_strike: 'Hit!',
    dd_payment: 'Monthly strike',
    dd_apr: 'Interest rate / yr',
    dd_original: 'Full HP',
    dd_balance: 'Remaining',
    dd_reclaimed: 'Reclaimed',
    dd_regen: 'regen/mo',
    dd_regen_day: 'regen/day',
    dd_slain: 'Dragon slain!',
    dd_slain_tag: 'Slain',
    dd_add: 'Add a dragon',
    dd_new: 'New dragon',
    dd_name: 'Dragon name',
    dd_name_ph: 'e.g. Credit card',
    dd_no_dragons: 'No dragons in the lair. You are debt-free.',
    dd_all_slain: 'Every dragon slain. You are free.',
    dd_never_warn: 'Monthly strike is below interest. The dragon heals faster than you hit.',
    dd_log: 'Battle log',
    dd_no_log: 'No strikes landed yet',
    dd_edit: 'Edit',
    dd_save: 'Save',
    dd_cancel: 'Cancel',
    dd_delete_confirm: 'Release this dragon? Its battle log will be lost.',
    dd_clear_lair: 'Clear lair',
    dd_clear_lair_confirm: "Clear every dragon and lair stat? Your Slayer's Character ID will stay.",
    dd_end_month: 'Advance month',
    dd_end_month_date: 'End-month date',
    dd_end_month_sub: 'Simulate one month forward — dragons breathe fire, interest accrues',
    dd_month_passed: 'Interest accrued!',
    dd_accrued: 'Advanced {n} mo · {amt} interest accrued',
    dd_accrued_days: 'Advanced {n}d · {amt} interest accrued',
    dd_weakening: 'Dragon weakening!',
    dd_pay_mode: 'Payment',
    dd_monthly: 'Monthly',
    dd_adhoc: 'Ad-hoc',
    dd_adhoc_note: 'Pay anytime, no schedule',
    dd_interest_type: 'Interest',
    dd_compound: 'Compound',
    dd_simple: 'Simple',
    dd_minpay: 'min / mo',
    dd_due_day: 'Due day',
    dd_due_suffix: 'of mo',
    dd_due_today: 'Due today',
    dd_due_in: 'Due in {n}d',
    dd_overdue: 'Overdue!',
    dd_move_strike: 'Strike',
    dd_move_fire: 'Fireball',
    dd_move_bolt: 'Lightning',
    dd_character: 'Character ID',
    dd_character_hint: 'Connect an existing profile or create a new ID here',
    dd_create_character: 'Create ID',
    dd_open_profile: 'Open profile',
    dd_record: "Slayer's Record",
    dd_reclaimed_life: 'Total reclaimed',
    dd_interest_fed: 'Interest fed',
    dd_biggest_hit: 'Biggest hit',
    dd_strike_now: 'Strike now',
    dd_apply_target: 'Strike {name} with the extra',
    dd_edit_strike: 'Tap to edit',
    dd_delete: 'Delete',
    dd_warn_below: 'Monthly strike is below the interest — this dragon never dies',
    dd_warn_orig: 'Accrued interest can make the remaining balance exceed the initial principal',
    dd_saved: 'Saved',
    settings: 'Settings',
    theme: 'Theme',
    theme_tavern: 'Tavern',
    theme_dungeon: 'Dungeon',
    accent: 'Accent',
    sound_effects: 'Sound effects',
    animations: 'Animations',
    battle_fx: 'Battle FX',
    full: 'Full',
    minimal: 'Minimal',
    strategy: 'Default tactic',
    close: 'Close'
  };
  return (LANG === 'en' ? en : th)[key] || key;
}

function tt(key, vars) {
  const value = t(key);
  let out = value === key ? fallback(key) : value;
  if (vars) Object.keys(vars).forEach(k => { out = out.split('{' + k + '}').join(String(vars[k])); });
  return out;
}
function h(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function q(value) { return JSON.stringify(String(value ?? '')).replace(/"/g, '&quot;'); }
function uid() { return 'd' + Math.random().toString(36).slice(2, 9); }
function money(n) { return '฿' + (Number(n) || 0).toLocaleString(LANG === 'th' ? 'th-TH' : 'en-US', { maximumFractionDigits: 2 }); }
function moneyShort(n) {
  const value = Number(n) || 0;
  if (Math.abs(value) >= 1000000) return '฿' + (value / 1000000).toLocaleString(LANG === 'th' ? 'th-TH' : 'en-US', { maximumFractionDigits: 1 }) + 'M';
  return money(value);
}
function dateISO(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
function todayISO() { return dateISO(new Date()); }
function endOfMonthISO(date = new Date()) { return dateISO(new Date(date.getFullYear(), date.getMonth() + 1, 0)); }
function isoToLocalDate(iso) {
  const [year, month, day] = String(iso || '').split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day) : new Date();
}
function nextEndOfMonthISO(iso) {
  const date = isoToLocalDate(iso);
  return dateISO(new Date(date.getFullYear(), date.getMonth() + 2, 0));
}
function defaultEndMonthISO() {
  return SETTINGS.lastEndMonthDate ? nextEndOfMonthISO(SETTINGS.lastEndMonthDate) : endOfMonthISO();
}
function dateMsFromISO(iso) {
  return PointyLogic.dateOnlyMs(iso ? new Date(`${iso}T00:00:00`) : new Date());
}
function accrueDragonsToDate(dragons, date) {
  let added = 0;
  let days = 0;
  const next = dragons.map(d => {
    if (d.archived) return d;
    const res = PointyLogic.accrueDebtToDate(d, date);
    added += Number(res.interest) || 0;
    days = Math.max(days, Number(res.days) || 0);
    return res.debt;
  });
  return { next, added, days };
}
function dayStart(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function dueStatus(d, today = new Date()) {
  if (d.payMode === 'adhoc' || !d.dueDay || d.slain) return null;
  const y = today.getFullYear();
  const m = today.getMonth();
  const paidThisMonth = (d.log || []).some(row => {
    const t = new Date(row.ts || 0);
    return t.getFullYear() === y && t.getMonth() === m;
  });
  const dueThis = PointyLogic.clampedDueDay(y, m, d.dueDay);
  if (!paidThisMonth && today.getDate() > dueThis) return { overdue: true };
  const dueDate = paidThisMonth
    ? PointyLogic.dueDateForMonth(y, m + 1, d.dueDay)
    : new Date(y, m, dueThis);
  return { overdue: false, days: Math.round((dayStart(dueDate) - dayStart(today)) / 86400000) };
}
function lairRecord(dragons, interestFed) {
  let reclaimed = 0;
  let biggest = 0;
  let strikes = 0;
  (dragons || []).forEach(d => (d.log || []).forEach(row => {
    const amount = Number(row.amount) || 0;
    reclaimed += amount;
    biggest = Math.max(biggest, amount);
    strikes += 1;
  }));
  return {
    reclaimed,
    biggest,
    strikes,
    slain: (dragons || []).filter(d => d.slain).length,
    interestFed: Math.round(Number(interestFed) || 0)
  };
}
function classLabel(id) { const cls = CLASSES[PointyLogic.normalizeClass(id)] || CLASSES.warrior; return cls[LANG] || cls.th || cls.en; }
function classColor(clsId) {
  const hue = (CLASSES[PointyLogic.normalizeClass(clsId)] || CLASSES.warrior).hue;
  return { ring: `oklch(0.46 0.15 ${hue})`, bg: `radial-gradient(125% 92% at 50% 16%, oklch(0.52 0.08 ${hue}), oklch(0.20 0.045 ${hue}) 78%)` };
}
function dragonBg(type) {
  const hue = PointyLogic.dragonType(type).hue;
  return `radial-gradient(125% 92% at 50% 14%, oklch(0.54 0.11 ${hue}), oklch(0.18 0.05 ${hue}) 80%)`;
}
function assetUrl(path) { return window.PointyAssets ? window.PointyAssets.url(path) : `/${String(path).replace(/^\/+/, '')}`; }
function portraitFile(res) { return assetUrl(`assets/rpg-portraits/${res}.png`); }
function avatarId(clsId, gender) { return `${PointyLogic.normalizeClass(clsId)}-${gender === 'female' ? 'female' : 'male'}`; }
function avatarSkins(base) {
  return [
    { id: '', res: base, th: t('skin_default'), en: 'Original' },
    ...(SKIN_DEFS[base] || [])
  ];
}
function avatarSrc(clsId, gender, skin = '') {
  const base = avatarId(clsId, gender);
  const skinDef = avatarSkins(base).find(item => item.id === skin);
  return portraitFile(skinDef?.res || base);
}
function dragonName(d) { return typeof d.name === 'object' ? (d.name[LANG] || d.name.th || d.name.en) : d.name; }
function dragonTypeName(type) { const ty = PointyLogic.dragonType(type); return ty[LANG] || ty.th || ty.en; }
function profileUrl(id = S.slayer.characterId) {
  const url = `/character/?id=${encodeURIComponent(id || '')}`;
  return TEST_MODE ? `${url}&test=1` : url;
}

function loadDebtState() {
  const fallback = window.PointyScope?.accountKey?.()
    ? { dragons: [], settings: {}, profile: {}, history: [], stats: {} }
    : PointyLogic.SEED_DEBT;
  try {
    if (window.PointyScope) return window.PointyScope.getJSON(STORE_KEY, fallback);
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : PointyLogic.SEED_DEBT;
  } catch (_) {
    return fallback;
  }
}
function saveDebtState() {
  syncSlayerWithAccount();
  S.strategy = SETTINGS.strategy || 'avalanche';
  try {
    if (window.PointyScope) window.PointyScope.setJSON(STORE_KEY, S);
    else localStorage.setItem(STORE_KEY, JSON.stringify(S));
  } catch (_) {}
  persistSlayerRecord();
  window.dispatchEvent(new CustomEvent('coin-quest-state-changed'));
}
function loadSettings() {
  try {
    return {
      theme: currentGlobalTheme('tavern'),
      accent: '#2f8f5b',
      sound: true,
      animations: true,
      battlefx: 'full',
      strategy: 'avalanche',
      ...(JSON.parse(localStorage.getItem('pointy_debt_settings_v1') || '{}') || {})
    };
  } catch (_) {
    return { theme: currentGlobalTheme('tavern'), accent: '#2f8f5b', sound: true, animations: true, battlefx: 'full', strategy: 'avalanche' };
  }
}
function saveSettings() {
  try { localStorage.setItem('pointy_debt_settings_v1', JSON.stringify(SETTINGS)); } catch (_) {}
}
function readLocalRegistry() {
  if (window.PointyScope?.getJSON) return window.PointyScope.getJSON(CHARACTER_REGISTRY_KEY, {});
  try { return JSON.parse(localStorage.getItem(CHARACTER_REGISTRY_KEY) || '{}') || {}; } catch (_) { return {}; }
}
function writeLocalRegistry(registry) {
  try {
    if (window.PointyScope?.setJSON) window.PointyScope.setJSON(CHARACTER_REGISTRY_KEY, registry);
    else localStorage.setItem(CHARACTER_REGISTRY_KEY, JSON.stringify(registry));
  } catch (_) {}
}
function generateCharacterId() {
  const registry = readLocalRegistry();
  const used = new Set(Object.keys(registry));
  for (let i = 0; i < 80; i++) {
    const id = String(Math.floor(1000 + Math.random() * 9000));
    if (!used.has(id)) return id;
  }
  return String(Math.floor(1000 + Math.random() * 9000));
}
function persistSlayerRecord() {
  syncSlayerWithAccount();
  const id = String(S.slayer.characterId || '').replace(/\D/g, '').slice(0, 4);
  if (id.length !== 4) return;
  const registry = readLocalRegistry();
  const current = registry[id] || { id, createdAt: Date.now() };
  registry[id] = {
    ...current,
    id,
    name: S.slayer.name || current.name || '',
    class: PointyLogic.normalizeClass(S.slayer.class || current.class || 'dragoon'),
    gender: S.slayer.gender === 'female' ? 'female' : 'male',
    skin: S.slayer.skin || '',
    debtXp: PointyLogic.slayerXpFrom(S.dragons),
    updatedAt: Date.now()
  };
  writeLocalRegistry(registry);
}

function ac() {
  if (!SETTINGS.sound) return null;
  if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { return null; } }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function haptic(pattern) {
  if (!SETTINGS.sound || !navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch (_) {}
}
function tone(freq, start, dur, type = 'triangle', gain = .14) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + .012);
  g.gain.exponentialRampToValueAtTime(.0001, start + dur);
  o.connect(g).connect(c.destination);
  o.start(start); o.stop(start + dur + .02);
}
function noise(start, dur, gain = .16, hp = 0) {
  const c = ac(); if (!c) return;
  const n = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = n.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  const src = c.createBufferSource(); src.buffer = n;
  const g = c.createGain(); g.gain.setValueAtTime(gain, start); g.gain.exponentialRampToValueAtTime(.0001, start + dur);
  if (hp) { const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; src.connect(f).connect(g).connect(c.destination); }
  else src.connect(g).connect(c.destination);
  src.start(start); src.stop(start + dur + .02);
}
function sweep(f0, f1, start, dur, type = 'sawtooth', gain = .14) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, start); o.frequency.exponentialRampToValueAtTime(f1, start + dur);
  g.gain.setValueAtTime(.0001, start); g.gain.exponentialRampToValueAtTime(gain, start + .03); g.gain.exponentialRampToValueAtTime(.0001, start + dur);
  o.connect(g).connect(c.destination); o.start(start); o.stop(start + dur + .02);
}
const SFX = {
  click() { haptic(8); const c = ac(); if (c) tone(420, c.currentTime, .05, 'triangle', .08); },
  clang() { haptic([18, 22, 22]); const c = ac(); if (!c) return; const n = c.currentTime; noise(n, .09, .22, 2200); tone(2100, n, .12, 'square', .1); tone(2640, n + .005, .16, 'triangle', .08); },
  reclaim() { haptic([10, 24, 12]); const c = ac(); if (!c) return; const n = c.currentTime; [1046, 1318, 1568, 2093].forEach((f, i) => tone(f, n + i * .04, .1, 'square', .07)); },
  roar() { haptic([26, 34, 44]); const c = ac(); if (!c) return; const n = c.currentTime; sweep(160, 70, n, .55, 'sawtooth', .16); sweep(240, 110, n + .02, .5, 'square', .07); noise(n + .04, .42, .1, 500); },
  fire() { haptic([20, 30, 18]); const c = ac(); if (!c) return; const n = c.currentTime; noise(n, .34, .16, 320); sweep(520, 120, n, .32, 'sawtooth', .13); },
  zap() { haptic([8, 18, 8, 18, 14]); const c = ac(); if (!c) return; const n = c.currentTime; sweep(2400, 600, n, .12, 'square', .1); noise(n, .14, .2, 3000); tone(3600, n + .02, .05, 'square', .08); },
  win() { haptic([18, 36, 18, 36, 26]); const c = ac(); if (!c) return; const n = c.currentTime; [659, 784, 988, 1318].forEach((f, i) => tone(f, n + i * .08, .3, 'triangle', .14)); }
};

function applySettings() {
  SETTINGS.theme = applyGlobalTheme(currentGlobalTheme(SETTINGS.theme || 'tavern'));
  document.body.classList.toggle('no-animations', SETTINGS.animations === false);
  document.documentElement.style.setProperty('--accent', SETTINGS.accent || '#2f8f5b');
}
function setLang(l) {
  LANG = l;
  localStorage.setItem('lang', l);
  translatePage();
  renderAll(false);
}
window.setLang = setLang;

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1700);
}

function renderDragonPortrait(type, opts = {}) {
  const ty = PointyLogic.dragonType(type);
  const url = S.art?.[type] || assetUrl(`assets/debt-dragons/${type}.png`);
  const classes = ['dragon-medallion'];
  if (opts.face) classes.push('face');
  if (opts.dead) classes.push('dead');
  const inputId = opts.drop ? `dragon-art-${type}-${opts.suffix || 'main'}` : '';
  return `<div class="${classes.join(' ')}" data-drop-type="${opts.drop ? h(type) : ''}" style="--dragon-bg:${dragonBg(type)}">
    <div class="dragon-stage">
      <img class="dragon-png ${opts.face ? 'mode-face' : 'mode-full'} ${opts.hurt ? 'hurt' : ''}" src="${h(url)}" alt="" draggable="false" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="dragon-ph" style="display:none" onclick="${opts.drop ? `pickDragonArt('${h(type)}','${h(inputId)}')` : ''}">
        <span class="dragon-ph-ring"></span><span class="dragon-ph-glyph">${ty.glyph}</span>${opts.face ? '' : `<span class="dragon-ph-cap">${debtCopy('ภาพมังกร', 'Dragon artwork')}</span>`}
      </div>
      ${opts.drop ? `<button type="button" class="dragon-repick" title="Replace art" onclick="pickDragonArt('${h(type)}','${h(inputId)}')">⟲</button><input id="${h(inputId)}" type="file" accept="image/*" hidden onchange="setDragonArt('${h(type)}',this.files&&this.files[0])">` : ''}
    </div>
  </div>`;
}

function renderSlayerPortrait() {
  const cls = PointyLogic.normalizeClass(S.slayer.class || 'dragoon');
  const gender = S.slayer.gender === 'female' ? 'female' : 'male';
  const color = classColor(cls);
  const level = PointyLogic.levelFromXp(PointyLogic.slayerXpFrom(S.dragons));
  const reward = PointyLogic.rewardFor(level.lvl);
  const src = avatarSrc(cls, gender, S.slayer.skin || '');
  return `<div class="slayer-portrait ${reward.frame}" style="--avatar-bg:${color.bg};border-color:${color.ring}">
    <img class="portrait-img" src="${h(src)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'slayer-q',textContent:'${CLASSES[cls].glyph}'}))">
    <span class="slayer-classbadge">${CLASSES[cls].glyph}</span>
    <div class="slayer-lvl"><span>${t('lvl')}</span><span>${level.lvl}</span></div>
  </div>`;
}

function dateShort(iso) {
  const d = iso ? new Date(`${iso}T00:00:00`) : new Date();
  return d.toLocaleDateString(LANG === 'en' ? 'en-GB' : 'th-TH', { day: '2-digit', month: 'short' });
}
function debtFreeLabel(months) {
  if (!isFinite(months)) return '—';
  const d = new Date();
  d.setMonth(d.getMonth() + Math.round(months));
  return d.toLocaleDateString(LANG === 'en' ? 'en-US' : 'th-TH', { month: 'short', year: '2-digit' });
}
function aliveDragons() { return S.dragons.filter(d => !d.archived && !d.slain && Number(d.balance) > .005); }
function targetId() { return PointyLogic.strategyTarget(S.dragons, SETTINGS.strategy || 'avalanche'); }

function renderStrikeForm(d) {
  const id = h(d.id);
  const draft = STRIKE_DRAFT[d.id] || {};
  const amt = draft.amount ?? fmtInput(Math.round(Number(d.payment) || Number(d.balance) || 0));
  const cls = PointyLogic.normalizeClass(S.slayer.class || 'dragoon');
  const glyph = CLASSES[cls].glyph;
  const moves = [
    ['projectile', glyph, tt('dd_move_strike'), 'melee'],
    ['fireball', '☀️', tt('dd_move_fire'), 'fire'],
    ['lightning', '⚡', tt('dd_move_bolt'), 'bolt']
  ];
  return `<div class="dc-strike-form">
    <div class="dc-move-pick">${moves.map(m => `<button type="button" class="dc-move ${m[3]} ${(draft.move || 'projectile') === m[0] ? 'on' : ''}" data-move="${m[0]}" onclick="pickMove('${id}','${m[0]}')"><span class="dc-move-ic">${m[1]}</span><span class="dc-move-nm">${h(m[2])}</span></button>`).join('')}</div>
    <div class="dc-strike-row">
      <label class="df-field"><span>${debtCopy('จำนวนเงินที่จ่าย', 'Payment amount')}</span><div class="dc-strike-amt"><span>฿</span><input id="strike-amt-${id}" type="text" inputmode="decimal" value="${h(amt)}" oninput="PointyLogic.formatNumberInputElement(this)"></div></label>
      <label class="df-field"><span>${debtCopy('วันที่จ่าย', 'Payment date')}</span><input id="strike-date-${id}" class="dc-strike-date" type="date" max="${todayISO()}" value="${h(draft.date || todayISO())}"></label>
    </div>
    <div class="dc-strike-go">
      <button class="btn-danger" style="flex:1" onclick="strikeDragon('${id}')">⚔️ ${tt('dd_hit')}</button>
      <button class="btn-ghost sm" aria-label="${h(tt('dd_cancel'))}" onclick="closeStrike()">✕</button>
    </div>
  </div>`;
}

function renderDragonForm(form = {}, mode = 'add') {
  if (mode === 'edit') form = { ...form, ...EDIT_FORM_DRAFT[form.id] };
  const d = {
    name: form.name || '',
    type: form.type || 'card',
    balance: form.balance ?? 0,
    original: form.original ?? form.balance ?? 0,
    apr: form.apr ?? 18,
    payment: form.payment ?? PointyLogic.dragonType(form.type || 'card').minPay,
    payMode: form.payMode || (PointyLogic.dragonType(form.type || 'card').minPay > 0 ? 'monthly' : 'adhoc'),
    interestMode: form.interestMode || 'compound',
    dueDay: form.dueDay ?? 0
  };
  const prefix = mode === 'edit' ? `edit-${h(form.id)}` : 'new';
  const isAdhoc = d.payMode === 'adhoc';
  const monthlyInterest = d.apr > 0 ? (d.interestMode === 'simple' ? d.original : d.balance) * PointyLogic.monthlyDebtRate(d.apr) : 0;
  const belowInterest = !isAdhoc && d.apr > 0 && d.payment > 0 && d.payment <= monthlyInterest;
  const originalLow = d.original > 0 && d.original < d.balance;
  return `<div class="dragon-form">
    <label class="df-field"><span>${debtCopy('ชื่อมังกร / ชื่อหนี้', 'Dragon / debt name')}</span><input id="${prefix}-name" maxlength="80" class="df-name" placeholder="${h(tt('dd_name_ph'))}" value="${h(d.name)}"></label>
    <div class="df-types">${DRAGON_ORDER.map(type => `<button type="button" class="df-type ${d.type === type ? 'on' : ''}" data-dragon-type="${h(type)}" aria-pressed="${d.type === type}" onclick="setDragonFormType('${prefix}','${type}')">
      ${renderDragonPortrait(type, { face: true, suffix: prefix })}<span>${h(dragonTypeName(type))}</span>
    </button>`).join('')}</div>
    <input id="${prefix}-type" type="hidden" value="${h(d.type)}">
    <div class="df-grid">
      <label class="df-field"><span>${tt('dd_balance')}</span><div class="df-num"><span>฿</span><input id="${prefix}-balance" type="text" inputmode="decimal" value="${h(fmtInput(d.balance))}" oninput="PointyLogic.formatNumberInputElement(this)"></div></label>
      <label class="df-field"><span>${tt('dd_original')}</span><div class="df-num"><span>฿</span><input id="${prefix}-original" type="text" inputmode="decimal" value="${h(fmtInput(d.original))}" oninput="PointyLogic.formatNumberInputElement(this)"></div></label>
      <label class="df-field"><span>${tt('dd_apr')}</span><div class="df-num"><input id="${prefix}-apr" type="number" min="0" step="0.0001" inputmode="decimal" value="${h(d.apr)}"><span>%</span></div></label>
      <label class="df-field" id="${prefix}-payment-wrap" style="${isAdhoc ? 'display:none' : ''}"><span>${tt('dd_payment')} (${tt('dd_minpay')})</span><div class="df-num"><span>฿</span><input id="${prefix}-payment" type="text" inputmode="decimal" value="${h(fmtInput(d.payment))}" oninput="PointyLogic.formatNumberInputElement(this)"></div></label>
      <label class="df-field" id="${prefix}-due-wrap" style="${isAdhoc ? 'display:none' : ''}"><span>${tt('dd_due_day')}</span><div class="df-num"><input id="${prefix}-dueDay" type="number" min="1" max="31" placeholder="—" value="${h(d.dueDay || '')}"><span class="suf">${tt('dd_due_suffix')}</span></div></label>
    </div>
    ${(belowInterest || originalLow) ? `<div class="df-warns">${belowInterest ? `<div class="df-warn">⚠️ ${tt('dd_warn_below')}</div>` : ''}${originalLow ? `<div class="df-warn">ℹ️ ${tt('dd_warn_orig')}</div>` : ''}</div>` : ''}
    <div class="df-seg"><button type="button" class="${!isAdhoc ? 'on' : ''}" onclick="setPayMode('${prefix}','monthly')">📅 ${tt('dd_monthly')}</button><button type="button" class="${isAdhoc ? 'on' : ''}" onclick="setPayMode('${prefix}','adhoc')">🤝 ${tt('dd_adhoc')}</button></div>
    <input id="${prefix}-payMode" type="hidden" value="${h(d.payMode)}">
    <div class="df-seg"><button type="button" class="${d.interestMode !== 'simple' ? 'on' : ''}" onclick="setInterestMode('${prefix}','compound')">⟳ ${tt('dd_compound')}</button><button type="button" class="${d.interestMode === 'simple' ? 'on' : ''}" onclick="setInterestMode('${prefix}','simple')">▭ ${tt('dd_simple')}</button></div>
    <input id="${prefix}-interestMode" type="hidden" value="${h(d.interestMode)}">
    <div class="df-actions"><button class="btn-ghost sm" onclick="${mode === 'edit' ? 'cancelEdit()' : 'closeAddDragon()'}">${tt('dd_cancel')}</button><button class="btn-primary sm" onclick="${mode === 'edit' ? `saveDragon('${h(form.id)}')` : 'addDragon()'}">${tt('dd_save')}</button></div>
  </div>`;
}

function renderDragonCard(d) {
  const paidPct = Math.max(0, Math.min(100, ((Number(d.original) - Number(d.balance)) / Math.max(1, Number(d.original))) * 100));
  const months = PointyLogic.payoffMonths(d);
  const regen = PointyLogic.monthlyInterest(d);
  const todayMs = PointyLogic.dateOnlyMs(new Date());
  const dailyRegen = PointyLogic.dailyInterest(d, todayMs, todayMs + 86400000);
  const adhoc = d.payMode === 'adhoc';
  const never = !adhoc && Number(regen) > 0 && !isFinite(months) && !d.slain;
  const fx = FX[d.id];
  const due = dueStatus(d);
  const log = (d.log || []).slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const id = h(d.id);
  const expanded = DRAGON_DETAILS.has(d.id) || STRIKE_OPEN === d.id || EDIT_OPEN === d.id || !!EDIT_LOG[d.id];
  const forecast = d.slain ? `✓ ${tt('dd_slain_tag')}` : adhoc ? tt('dd_adhoc_note') : never ? `<span class="dc-never">⚠ ${tt('dd_never_warn')}</span>` : `${tt('dd_debt_free_by')} ${debtFreeLabel(months)}`;
  const dueLabel = due ? (due.overdue ? tt('dd_overdue') : due.days === 0 ? tt('dd_due_today') : tt('dd_due_in', { n: due.days })) : '';
  const aprLabel = `${debtCopy('ดอกเบี้ย', 'APR')} ${Number(d.apr)}%`;
  return `<article class="dragon-card${d.slain ? ' slain' : ''}${never ? ' is-never' : ''}" data-dragon-id="${id}">
    <div class="dc-body">
      <button class="dc-summary" type="button" aria-expanded="${expanded}" aria-controls="detail-${id}" onclick="toggleDragonDetails('${id}')" aria-label="${h(debtCopy('รายละเอียด ', 'Details: ') + dragonName(d))}">
        <span class="dc-art-wrap" data-drop-type="${d.slain ? '' : h(d.type)}">${renderDragonPortrait(d.type, { hurt: !!fx, suffix: d.id })}${BREATHING.includes(d.id) ? '<span class="dc-breath-fire"></span>' : ''}${renderFx(fx)}</span>
        <span class="dc-main"><span class="dc-head"><span class="dc-name">${h(dragonName(d))}</span><span class="dc-type">${h(dragonTypeName(d.type))}</span><span class="dc-apr">${aprLabel}</span></span>
          <span class="dc-hp-nums"><strong class="dc-bal">${money(d.balance)}</strong><span class="dc-orig">/ ${money(d.original)}</span></span>
          <span class="dc-progress"><span class="dc-hp-track" role="progressbar" aria-label="${h(tt('dd_reclaimed'))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(paidPct)}"><span class="dc-hp-fill" style="width:${paidPct}%"></span></span><span class="dc-paid">${Math.round(paidPct)}% <span>${tt('dd_reclaimed')}</span></span><span class="dc-mobile-apr">${d.slain ? tt('dd_slain_tag') : aprLabel}</span></span>
          <span class="dc-meta"><span>${adhoc ? tt('dd_adhoc') : `${tt('dd_payment')} <b>${money(d.payment)}</b>`}</span>${dueLabel ? `<span class="${due.overdue ? 'dc-never' : ''}">${h(dueLabel)}</span>` : ''}<span>${forecast}</span>${dailyRegen > 0 ? `<span class="regen-pill">+${money(dailyRegen)}${debtCopy('/วัน', '/day')}</span>` : ''}</span>
        </span><span class="dc-chevron">${debtIcon('chevron')}</span>
      </button>
      <div class="dc-row-actions">${d.archived ? `<button class="btn-ghost sm" data-restore-dragon="${id}">${debtCopy('นำกลับมา', 'Restore')}</button>` : !d.slain ? `<button class="dc-strike-btn" onclick="openStrike('${id}')">${debtIcon('swords')}<span>${debtCopy('บันทึกการจ่าย', 'Record payment')}</span></button>` : `<span class="dc-paid-badge">✓ ${tt('dd_slain_tag')}</span>`}<button class="btn-ghost sm dc-details-button" aria-expanded="${expanded}" aria-controls="detail-${id}" onclick="toggleDragonDetails('${id}')">${debtCopy('ดูรายละเอียด', 'View details')}</button></div>
    </div>
    <div class="dc-detail" id="detail-${id}" ${expanded ? '' : 'hidden'}>
      <div class="dc-detail-facts"><span>${h(dragonTypeName(d.type))} · ${aprLabel} · ${tt(d.interestMode === 'simple' ? 'dd_simple' : 'dd_compound')}</span><span>${adhoc ? tt('dd_adhoc_note') : `${tt('dd_payment')} ${money(d.payment)}`}</span><span>${forecast}${dueLabel ? ` · ${h(dueLabel)}` : ''}</span>${dailyRegen > 0 ? `<span class="regen-pill">${tt('dd_regen_day')} +${money(dailyRegen)}</span>` : ''}</div>
      <div class="dc-detail-tools">${d.archived ? `<button class="btn-ghost sm dc-mobile-restore" data-restore-dragon="${id}">${debtCopy('นำกลับมา', 'Restore')}</button>` : ''}${!d.slain && !d.archived ? `<button class="btn-danger sm dc-mobile-pay" onclick="openStrike('${id}')">${debtIcon('swords')} ${debtCopy('บันทึกการจ่าย', 'Record payment')}</button>` : ''}<button class="btn-ghost sm dc-edit" onclick="openEdit('${id}')">✎ ${tt('dd_edit')}</button><button class="btn-ghost sm" onclick="pickDragonArt('${h(d.type)}','detail-art-${id}')">${debtCopy('เปลี่ยนภาพมังกร', 'Change artwork')}</button><input id="detail-art-${id}" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onchange="setDragonArt('${h(d.type)}',this.files&&this.files[0])"><button class="btn-ghost sm dc-remove" onclick="deleteDragon('${id}')">${tt('dd_delete')}</button></div>
      ${STRIKE_OPEN === d.id ? renderStrikeForm(d) : ''}
      ${EDIT_OPEN === d.id ? renderDragonForm({ ...d, name: dragonName(d), id: d.id }, 'edit') : ''}
      <div class="dc-log"><h3 class="dc-log-h">${debtIcon('scroll')} ${tt('dd_log')}</h3><div class="dc-log-rows">${log.length ? log.map(row => renderLogRow(d, row)).join('') : `<span class="settings-sub">${debtCopy('ยังไม่มีรายการจ่าย', 'No payments recorded yet')}</span>`}</div></div>
    </div>
  </article>`;
}

function renderFx(fx) {
  if (!fx) return '';
  const cls = PointyLogic.normalizeClass(S.slayer.class || 'dragoon');
  const glyph = CLASSES[cls].glyph;
  const hue = CLASSES[cls].hue;
  const tint = `oklch(0.62 0.18 ${hue})`;
  const move = fx.move || 'projectile';
  const projectile = move === 'fireball' ? '<span class="sfx-fireball">☀️</span>' : move === 'lightning' ? '<span class="sfx-bolt">⚡</span>' : `<span class="sfx-proj" style="--tint:${tint};color:${tint}">${glyph}</span>`;
  const coins = SETTINGS.battlefx === 'minimal' ? '' : [0, 1, 2, 3, 4].map(i => `<span class="sfx-coin c${i}">🪙</span>`).join('');
  return `<div class="strike-fx">${projectile}<span class="sfx-impact"></span>${coins}<span class="sfx-dmg">−${money(fx.dmg)}</span></div>`;
}

function renderLogRow(d, row) {
  const edit = EDIT_LOG[d.id] === row.id;
  if (!edit) {
    return `<button type="button" class="dc-log-row" title="${h(tt('dd_edit_strike'))}" onclick="openLogEdit('${h(d.id)}','${h(row.id)}')"><span class="dc-log-date">${h(row.date)}</span><span class="dc-log-dmg">−${money(row.amount)}</span></button>`;
  }
  const draft = EDIT_LOG_DRAFTS[logDraftKey(d.id, row.id)] || {};
  const date = row.ts ? dateISO(new Date(row.ts)) : todayISO();
  const amountValue = draft.amount ?? fmtInput(row.amount);
  const dateValue = draft.date ?? date;
  return `<div class="dc-log-edit">
    <div class="dc-le-amt"><span>฿</span><input id="log-amt-${h(d.id)}-${h(row.id)}" type="text" inputmode="decimal" value="${h(amountValue)}" oninput="PointyLogic.formatNumberInputElement(this); setLogEditDraft('${h(d.id)}','${h(row.id)}','amount',this.value)"></div>
    <input id="log-date-${h(d.id)}-${h(row.id)}" class="dc-le-date" type="date" max="${todayISO()}" value="${h(dateValue)}" oninput="setLogEditDraft('${h(d.id)}','${h(row.id)}','date',this.value)" onchange="setLogEditDraft('${h(d.id)}','${h(row.id)}','date',this.value)">
    <button type="button" class="dc-le-save" title="${h(tt('dd_save'))}" onclick="saveLogEdit('${h(d.id)}','${h(row.id)}')">✓</button>
    <button type="button" class="dc-le-del" title="${h(tt('dd_delete'))}" onclick="deleteStrikeLog('${h(d.id)}','${h(row.id)}')">🗑</button>
    <button type="button" class="dc-le-x" onclick="closeLogEdit('${h(d.id)}')">✕</button>
  </div>`;
}

function renderLair() {
  const filters = [['all', debtCopy('ทั้งหมด', 'All')], ['active', debtCopy('กำลังสู้', 'Active')], ['due', debtCopy('ใกล้ครบกำหนด', 'Due soon')], ['paid', debtCopy('ชำระครบ', 'Paid')], ['archived', debtCopy('เก็บเข้าคลัง', 'Archived')]];
  return `<section class="panel lair-panel">
    <div class="panel-head"><h2 class="panel-title">${debtIcon('castle')} ${debtCopy('มังกรของฉัน', 'My dragons')} (${S.dragons.filter(d => !d.archived).length})</h2><button class="debt-view-all" onclick="resetDebtFilters()">${debtCopy('ดูทั้งหมด', 'View all')} ${debtIcon('arrow')}</button></div>
    <details class="debt-filter-tools" ${DEBT_FILTER !== 'all' || DEBT_QUERY ? 'open' : ''}><summary>${debtCopy('ค้นหาและกรองมังกร', 'Search and filter dragons')}${debtIcon('chevron')}</summary><div class="debt-toolbar"><div class="debt-filters" aria-label="${debtCopy('สถานะหนี้', 'Debt status')}">${filters.map(([key, label]) => `<button type="button" data-debt-filter="${key}" aria-pressed="${DEBT_FILTER === key}" onclick="setDebtFilter('${key}')">${label} (${S.dragons.filter(d => matchesDebtFilter(d, key)).length})</button>`).join('')}</div><label class="debt-search"><span class="debt-sr">${debtCopy('ค้นหามังกร', 'Search dragons')}</span><input id="debt-query" type="search" placeholder="${debtCopy('ค้นหามังกร...', 'Search dragons...')}" value="${h(DEBT_QUERY)}" oninput="DEBT_QUERY=this.value;applyDebtFilters()"></label><label class="debt-sort"><span class="debt-sr">${debtCopy('เรียงลำดับ', 'Sort by')}</span><select id="debt-sort" onchange="DEBT_SORT=this.value;applyDebtFilters()">${[['added', debtCopy('วันที่เพิ่ม', 'Date added')], ['balance', debtCopy('ยอดหนี้สูงสุด', 'Highest balance')], ['apr', debtCopy('ดอกเบี้ยสูงสุด', 'Highest APR')]].map(([key,label]) => `<option value="${key}" ${DEBT_SORT === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div></details>
    <div class="lair-grid">${S.dragons.map(renderDragonCard).join('')}<div class="empty debt-no-results" hidden><p>${debtCopy('ไม่พบมังกรในรายการนี้', 'No dragons in this list')}</p><button class="btn-ghost sm" onclick="resetDebtFilters()">${debtCopy('ดูมังกรทั้งหมด', 'Show all dragons')}</button></div></div>
  </section>`;
}

function matchesDebtFilter(d, filter) {
  if (filter === 'archived') return !!d.archived;
  if (d.archived) return false;
  if (filter === 'active') return !d.slain;
  if (filter === 'paid') return !!d.slain;
  if (filter === 'due') { const due = dueStatus(d); return !!due && (due.overdue || due.days <= 7); }
  return true;
}
function applyDebtFilters() {
  const grid = document.querySelector('.lair-grid');
  if (!grid) return;
  const query = DEBT_QUERY.trim().toLocaleLowerCase();
  const ordered = S.dragons.slice().sort((a,b) => DEBT_SORT === 'balance' ? b.balance - a.balance : DEBT_SORT === 'apr' ? b.apr - a.apr : 0);
  let visible = 0;
  for (const d of ordered) {
    const card = grid.querySelector(`[data-dragon-id="${CSS.escape(d.id)}"]`);
    if (!card) continue;
    card.hidden = !matchesDebtFilter(d, DEBT_FILTER) || !(dragonName(d) + ' ' + dragonTypeName(d.type)).toLocaleLowerCase().includes(query);
    if (!card.hidden) visible++;
    grid.appendChild(card);
  }
  grid.querySelector('.debt-no-results').hidden = visible > 0;
  document.querySelectorAll('[data-debt-filter]').forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.debtFilter === DEBT_FILTER)));
}
function setDebtFilter(filter) { DEBT_FILTER = filter; applyDebtFilters(); }
function resetDebtFilters() { DEBT_FILTER = 'all'; DEBT_QUERY = ''; const input = document.getElementById('debt-query'); if (input) input.value = ''; applyDebtFilters(); }
function toggleDragonDetails(id) {
  const detail = document.getElementById(`detail-${id}`);
  if (!detail) return;
  const open = detail.hidden;
  detail.hidden = !open;
  if (open) DRAGON_DETAILS.add(id); else DRAGON_DETAILS.delete(id);
  document.querySelectorAll(`[aria-controls="detail-${CSS.escape(id)}"]`).forEach(btn => btn.setAttribute('aria-expanded', String(open)));
}
function debtDisclosure(key, title, contents) {
  return `<details class="debt-disclosure" id="debt-${key}" ${DEBT_PANELS[key] ? 'open' : ''} ontoggle="DEBT_PANELS['${key}']=this.open"><summary>${title}${debtIcon('chevron')}</summary><div class="debt-disclosure-body">${contents}</div></details>`;
}
function openDebtStrategy() {
  const panel = document.getElementById('debt-strategy');
  panel.open = true; DEBT_PANELS.strategy = true;
  panel.scrollIntoView({ behavior: SETTINGS.animations === false ? 'auto' : 'smooth', block: 'start' });
  panel.querySelector('summary').focus({ preventScroll: true });
}

function renderSlayerPanel() {
  const linkedHero = accountHero();
  const cls = PointyLogic.normalizeClass(S.slayer.class || 'dragoon');
  const xp = PointyLogic.slayerXpFrom(S.dragons);
  const level = PointyLogic.levelFromXp(xp);
  const reward = PointyLogic.rewardFor(level.lvl);
  const base = avatarId(cls, S.slayer.gender);
  const skins = avatarSkins(base);
  const characterLink = S.slayer.characterId ? `<a class="char-id-link" href="${h(profileUrl())}">#${h(S.slayer.characterId)}</a>` : `<span class="settings-sub">${tt('dd_character_hint')}</span>`;
  const characterActions = linkedHero
    ? `${characterLink}${S.slayer.characterId ? `<a class="btn-ghost sm" href="${h(profileUrl())}">${tt('dd_open_profile')}</a>` : ''}`
    : `${characterLink}<button class="btn-ghost sm" onclick="ensureDebtCharacter()">${tt('dd_create_character')}</button>${S.slayer.characterId ? `<a class="btn-ghost sm" href="${h(profileUrl())}">${tt('dd_open_profile')}</a>` : ''}`;
  const classControls = linkedHero
    ? `<div class="field-input account-hero-lock">${CLASSES[cls].glyph} ${h(classLabel(cls))}</div>
      <div class="gender-toggle locked"><button class="${S.slayer.gender !== 'female' ? 'on' : ''}" disabled>♂</button><button class="${S.slayer.gender === 'female' ? 'on' : ''}" disabled>♀</button></div>`
    : `<select class="field-input" onchange="updateSlayerField('class',this.value)">${CLASS_ORDER.map(id => `<option value="${id}" ${id === cls ? 'selected' : ''}>${CLASSES[id].glyph} ${h(classLabel(id))}</option>`).join('')}</select>
      <div class="gender-toggle"><button class="${S.slayer.gender !== 'female' ? 'on' : ''}" onclick="updateSlayerField('gender','male')">♂</button><button class="${S.slayer.gender === 'female' ? 'on' : ''}" onclick="updateSlayerField('gender','female')">♀</button></div>`;
  return `<section class="panel slayer-panel">
    <div class="panel-head"><h2 class="panel-title">🗡️ ${tt('dd_slayer')}</h2></div>
    <div class="slayer-body">${renderSlayerPortrait()}<div class="slayer-info">
      <input id="slayer-name" class="slayer-name" value="${h(S.slayer.name || '')}" ${linkedHero ? 'readonly aria-readonly="true"' : "oninput=\"updateSlayerField('name',this.value)\""}>
      <div class="slayer-rank">${reward.glyph} ${h(reward.title?.[LANG] || reward.title?.th || '')} · ${h(classLabel(cls))}</div>
      <div class="char-row">${characterActions}</div>
      <div class="bar-row"><span class="bar-lab">${t('xp')}</span><div class="bar"><span class="bar-fill" style="display:block;width:${level.pct}%"></span></div><span class="bar-val">${level.into}/${level.need}</span></div>
    </div></div>
    ${linkedHero ? '' : `<details class="slayer-edit-controls"><summary>${debtCopy('ปรับแต่งนักล่ามังกร', 'Customize your slayer')}</summary><div class="class-row">${classControls}</div>`}
    ${!linkedHero && skins.length > 1 ? `<select class="field-input" style="margin-top:8px" onchange="updateSlayerField('skin',this.value)">${skins.map(sk => `<option value="${h(sk.id)}" ${S.slayer.skin === sk.id ? 'selected' : ''}>${h(sk[LANG] || sk.th || sk.en)}</option>`).join('')}</select>` : ''}
    ${linkedHero ? '' : `<div class="slayer-editor"><input id="slayer-character-id" class="field-input" aria-label="${h(tt('dd_character'))}" inputmode="numeric" maxlength="4" placeholder="${tt('dd_character')}" value="${h(S.slayer.characterId || '')}" oninput="this.value=this.value.replace(/\\D/g,'').slice(0,4)"><button class="btn-primary sm" onclick="linkDebtCharacter()">${tt('dd_character')}</button></div></details>`}
  </section>`;
}

function renderTacticsPanel() {
  const target = S.dragons.find(d => d.id === targetId());
  return `<section class="panel tactics-panel">
    <div class="panel-head"><h2 class="panel-title">⚔️ ${tt('dd_tactics')}</h2></div>
    <div class="tactic-toggle">
      <button class="tactic-opt ${SETTINGS.strategy === 'avalanche' ? 'on' : ''}" onclick="setStrategy('avalanche')"><span class="to-name">🏔️ ${tt('dd_avalanche')}</span><span class="to-sub">${tt('dd_avalanche_sub')}</span></button>
      <button class="tactic-opt ${SETTINGS.strategy === 'snowball' ? 'on' : ''}" onclick="setStrategy('snowball')"><span class="to-name">❄️ ${tt('dd_snowball')}</span><span class="to-sub">${tt('dd_snowball_sub')}</span></button>
    </div>
    ${target ? `<div class="tactic-target"><div class="tt-lab">🎯 ${tt('dd_target')} · <span class="tt-rec">${tt('dd_recommended')}</span></div><div class="tt-card">${renderDragonPortrait(target.type, { face: true })}<div><div class="tt-name">${h(dragonName(target))}</div><div class="tt-meta">${h(dragonTypeName(target.type))} · ${money(target.balance)} · ${target.apr}%</div></div></div>${target.payMode !== 'adhoc' ? `<button class="tt-strike" onclick="requestStrike('${h(target.id)}',${Number(target.payment) || 0})">⚔️ ${tt('dd_strike_now')}</button>` : ''}</div>` : `<div class="settings-sub" style="padding:12px">${tt('dd_no_target')}</div>`}
  </section>`;
}

function renderForecastPanel() {
  const extra = POWER_EXTRA;
  const base = PointyLogic.simulateLair(S.dragons, SETTINGS.strategy, 0);
  const boost = PointyLogic.simulateLair(S.dragons, SETTINGS.strategy, extra);
  const monthsSaved = isFinite(base.months) && isFinite(boost.months) ? Math.max(0, base.months - boost.months) : 0;
  const interestSaved = Math.max(0, base.interest - boost.interest);
  const target = S.dragons.find(d => d.id === targetId() && d.payMode !== 'adhoc');
  if (!aliveDragons().length) return `<section class="panel forecast-panel"><div class="panel-head"><h2 class="panel-title">🔮 ${tt('dd_forecast')}</h2></div><div class="settings-sub">${tt('dd_all_slain')}</div></section>`;
  return `<section class="panel forecast-panel">
    <div class="panel-head"><h2 class="panel-title">🔮 ${tt('dd_forecast')}</h2></div>
    <div class="forecast-grid">
      <div class="fc-stat"><span class="fc-v">${isFinite(boost.months) ? boost.months : '∞'}</span><span class="fc-l">${tt('dd_free_in')} · ${tt('dd_months')}</span></div><div class="fc-div"></div>
      <div class="fc-stat"><span class="fc-v gold">${moneyShort(boost.interest)}</span><span class="fc-l">${tt('dd_interest_ahead')}</span></div><div class="fc-div"></div>
      <div class="fc-stat"><span class="fc-v">${debtFreeLabel(boost.months)}</span><span class="fc-l">${tt('dd_debt_free_by')}</span></div>
    </div>
    <div class="power-attack"><div class="pa-head"><span class="pa-title">💥 ${tt('dd_power_attack')}</span><span class="pa-val">+${money(extra)}/${tt('dd_month_short')}</span></div>
      <input id="power-attack" class="pa-slider" type="range" min="0" max="10000" step="250" value="${extra}" oninput="updatePowerAttack(this.value)">
      <div class="pa-sub">${tt('dd_power_sub')}</div>
      ${extra > 0 ? `<div class="pa-result"><span class="pa-chip">⏩ −${monthsSaved} ${tt('dd_month_short')} ${tt('dd_sooner')}</span><span class="pa-chip gold">💰 ${tt('dd_saves')} ${money(interestSaved)}</span></div>` : ''}
      ${extra > 0 && target ? `<button class="pa-apply" onclick="requestStrike('${h(target.id)}',${(Number(target.payment) || 0) + extra})">⚔️ ${tt('dd_apply_target', { name: dragonName(target) })}</button>` : ''}
    </div>
  </section>`;
}

function renderRecordPanel() {
  const rec = lairRecord(S.dragons, S.stats?.interest || 0);
  if (!rec.strikes && !rec.slain) return '';
  return `<section class="panel record-panel">
    <div class="panel-head"><h2 class="panel-title">📜 ${tt('dd_record')}</h2></div>
    <div class="record-grid">
      <div class="rec-stat"><span class="rec-v gold">${money(rec.reclaimed)}</span><span class="rec-l">${tt('dd_reclaimed_life')}</span></div>
      <div class="rec-stat"><span class="rec-v fire">${money(rec.interestFed)}</span><span class="rec-l">${tt('dd_interest_fed')}</span></div>
      <div class="rec-stat"><span class="rec-v">${money(rec.biggest)}</span><span class="rec-l">${tt('dd_biggest_hit')}</span></div>
      <div class="rec-stat"><span class="rec-v">${rec.slain} 🏆</span><span class="rec-l">${tt('dd_slain_count')}</span></div>
    </div>
  </section>`;
}

function renderAll(shouldSave = true) {
  // Retain input through language/theme changes, cloud refreshes and battle effects.
  if (ADD_OPEN && document.getElementById('new-name')) ADD_FORM_DRAFT = formPayload('new');
  if (EDIT_OPEN && document.getElementById(`edit-${EDIT_OPEN}-name`)) EDIT_FORM_DRAFT[EDIT_OPEN] = formPayload(`edit-${EDIT_OPEN}`);
  if (STRIKE_OPEN && document.getElementById(`strike-amt-${STRIKE_OPEN}`)) STRIKE_DRAFT[STRIKE_OPEN] = {
    amount: document.getElementById(`strike-amt-${STRIKE_OPEN}`).value,
    date: document.getElementById(`strike-date-${STRIKE_OPEN}`).value,
    move: document.querySelector(`[data-dragon-id="${CSS.escape(STRIKE_OPEN)}"] .dc-move.on`)?.dataset.move
  };
  syncSlayerWithAccount();
  applySettings();
  translatePage();
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('lang-active', btn.dataset.lang === LANG));
  const live = aliveDragons();
  const totalDebt = live.reduce((sum, d) => sum + Number(d.balance || 0), 0);
  const sim = PointyLogic.simulateLair(S.dragons, SETTINGS.strategy, 0);
  const monthly = live.reduce((sum, d) => sum + (d.payMode === 'adhoc' ? 0 : Number(d.payment || 0)), 0);
  const stat = (icon, value, label) => `<div class="hoard-stat"><span class="hs-icon">${icon}</span><strong class="hs-val">${value}</strong><span class="hs-lab">${label}</span></div>`;
  document.getElementById('app').innerHTML = `<section class="debt-hero">
    <div class="debt-hero-heading"><span class="banner-crest" aria-hidden="true">🐉</span><div><h1 class="banner-title" aria-label="${h(tt('dd_title'))}">Debt Dragon</h1><p class="banner-sub">${debtCopy('ปราบมังกรทีละก้อน เพื่ออิสรภาพทางการเงินของคุณ', 'Face your debts. One step closer to freedom.')}</p></div></div>
    <p class="debt-hero-note">${debtIcon('shield')}<span>${debtCopy('หนี้ไม่ใช่จุดจบ', 'One payment at a time.')}<small>${debtCopy('แต่คือมังกรที่เราเอาชนะได้', 'Every dragon can be defeated.')}</small></span></p>
  </section>
  <div class="debt-workspace"><div class="hoard-bar">${stat('🐉', money(totalDebt), debtCopy('ยอดหนี้คงเหลือ', 'Outstanding balance'))}${stat(debtIcon('trophy'), live.length, debtCopy('มังกรที่ยังอยู่', 'Active dragons'))}${stat('📜', S.dragons.filter(d => d.slain).length, tt('dd_slain_count'))}${stat(debtIcon('shield'), isFinite(sim.months) ? sim.months : '—', `${tt('dd_free_in')} · ${tt('dd_months')}`)}</div>
    ${ACCRUAL_NOTE ? `<div class="accrual-note">🔥 ${tt(ACCRUAL_NOTE.days ? 'dd_accrued_days' : 'dd_accrued', { n: ACCRUAL_NOTE.n, amt: money(ACCRUAL_NOTE.added) })}</div>` : ''}
    <div class="debt-actions"><button class="btn-primary add-dragon" onclick="openAddDragon()"><span aria-hidden="true">＋</span>${debtCopy('เพิ่มมังกรหนี้', 'Add a debt dragon')}</button><button class="btn-ghost debt-strategy-button" onclick="openDebtStrategy()">${debtIcon('swords')} ${debtCopy('กลยุทธ์และจำลอง', 'Strategy & simulation')}</button><button class="btn-ghost debt-settings" aria-label="${debtCopy('ตั้งค่าเกม', 'Game settings')}" onclick="openSettings()">${debtIcon('settings')}<span>${debtCopy('ตั้งค่าเกม', 'Game settings')}</span></button></div>
    ${ADD_OPEN ? `<section class="panel debt-add-panel" aria-label="${h(tt('dd_new'))}"><h2 class="panel-title">${tt('dd_new')}</h2>${renderDragonForm(ADD_FORM_DRAFT, 'add')}</section>` : ''}
    ${renderLair()}
    <div class="debt-support">${debtDisclosure('finance', `${debtIcon('scroll')} ${debtCopy('ภาพรวมการเงิน', 'Financial overview')}`, `<div class="finance-stats">${stat('', money(totalDebt), debtCopy('ยอดหนี้คงเหลือ', 'Outstanding balance'))}${stat('', money(Math.round(sim.interest)), tt('dd_interest_ahead'))}${stat('', money(monthly), debtCopy('ยอดจ่ายต่อเดือน', 'Monthly payments'))}${stat('', isFinite(sim.months) ? `${sim.months} ${tt('dd_months')}` : '—', `${tt('dd_debt_free_by')} ${debtFreeLabel(sim.months)}`)}</div>${renderRecordPanel()}`)}${debtDisclosure('slayer', `${debtIcon('swords')} ${tt('dd_slayer')}`, renderSlayerPanel())}</div>
    ${debtDisclosure('strategy', `${debtIcon('swords')} ${debtCopy('กลยุทธ์และจำลองการจ่าย', 'Strategy & payment simulator')}`, `<div class="debt-strategy-grid">${renderTacticsPanel()}<div id="forecast-slot">${renderForecastPanel()}</div></div>`)}
    ${debtDisclosure('manage', `${debtIcon('settings')} ${debtCopy('จัดการถ้ำมังกร', 'Manage your lair')}`, `<div class="lair-actions">${live.length ? `<button class="end-month" title="${h(tt('dd_end_month_sub'))}" onclick="endMonth()">🔥 ${tt('dd_end_month')}</button>` : ''}${S.dragons.length ? `<button class="btn-ghost sm dc-remove" onclick="clearLair()">${tt('dd_clear_lair')}</button>` : ''}</div><p class="settings-sub">${tt('dd_end_month_sub')}</p>`)}
    <cq-footer></cq-footer>
  </div>${flashToken ? '<div class="debt-flash"></div>' : ''}`;
  applyDebtFilters();
  renderOverlay();
  attachDragonDropHandlers();
  if (shouldSave) { saveDebtState(); toast(tt('dd_saved')); }
}

function renderForecastOnly() {
  const el = document.getElementById('forecast-slot');
  if (el) el.innerHTML = renderForecastPanel();
}

function attachDragonDropHandlers() {
  document.querySelectorAll('[data-drop-type]').forEach(el => {
    const type = el.dataset.dropType;
    if (!type) return;
    el.ondragover = ev => { ev.preventDefault(); el.classList.add('drag-over'); };
    el.ondragleave = () => el.classList.remove('drag-over');
    el.ondrop = ev => {
      ev.preventDefault(); el.classList.remove('drag-over');
      setDragonArt(type, ev.dataTransfer.files && ev.dataTransfer.files[0]);
    };
  });
}

function openStrike(id) { DRAGON_DETAILS.add(id); STRIKE_DRAFT = {}; STRIKE_OPEN = id; EDIT_OPEN = ''; SFX.click(); renderAll(false); document.getElementById(`strike-amt-${id}`)?.focus(); }
function closeStrike() { STRIKE_OPEN = ''; STRIKE_DRAFT = {}; renderAll(false); }
function pickMove(id, move) {
  document.querySelectorAll(`[data-dragon-id="${CSS.escape(id)}"] .dc-move`).forEach(btn => btn.classList.toggle('on', btn.dataset.move === move));
}
function strikeDragon(id) {
  const d = S.dragons.find(item => item.id === id);
  if (!d) return;
  let amount, date;
  try {
    amount = PointyLogic.readField(`strike-amt-${id}`, { label: 'ยอดชำระ', min: .01 });
    date = PointyLogic.readField(`strike-date-${id}`, { type: 'date', max: todayISO() });
  } catch (error) { toast(error.message); return; }
  const move = document.querySelector(`[data-dragon-id="${CSS.escape(id)}"] .dc-move.on`)?.dataset.move || 'projectile';
  const ts = dateMsFromISO(date);
  if (!Number.isFinite(ts) || ts < PointyLogic.dateOnlyMs(Math.max(Number(d.createdAt) || 0, Number(d.interestAccruedAt) || 0)) || ts > PointyLogic.dateOnlyMs(Date.now())) { toast('ตรวจวันที่ชำระ ต้องไม่ก่อนวันที่คิดดอกเบี้ยล่าสุดหรืออยู่ในอนาคต'); return; }
  const result = PointyLogic.applyDebtPayment(d, amount, ts);
  if (amount > result.balanceBefore + .005) { toast('ยอดชำระมากกว่ายอดหนี้รวมดอกเบี้ย'); return; }
  if (result.applied <= 0) return;
  const row = {
    id: uid(),
    date: dateShort(date),
    amount: result.applied,
    interest: result.interestPaid,
    principal: result.principalPaid,
    accruedInterest: result.interest,
    balanceBefore: result.balanceBefore,
    balanceAfter: result.balanceAfter,
    days: result.days,
    ts,
    move
  };
  const nextDebt = { ...result.debt, log: [...(d.log || []), row] };
  S.dragons = S.dragons.map(item => item.id === id ? nextDebt : item);
  if (result.interest > 0) S.stats = { ...(S.stats || {}), interest: Number(S.stats?.interest || 0) + result.interest };
  if (!d.slain && nextDebt.slain) { flashToken = Date.now(); setTimeout(() => { flashToken = 0; renderAll(false); }, 620); }
  FX[id] = { id: uid(), dmg: result.applied, move };
  STRIKE_OPEN = '';
  if (move === 'fireball') SFX.fire();
  else if (move === 'lightning') SFX.zap();
  else SFX.clang();
  setTimeout(() => SFX.reclaim(), 120);
  if (!d.slain && nextDebt.slain) setTimeout(() => SFX.win(), 240);
  setTimeout(() => { delete FX[id]; renderAll(false); }, 1000);
  renderAll();
}
function endMonth() {
  const ids = aliveDragons().map(d => d.id);
  if (!ids.length) return;
  BREATHING = ids;
  SFX.roar();
  const targetIso = defaultEndMonthISO();
  const { next, added, days } = accrueDragonsToDate(S.dragons, dateMsFromISO(targetIso));
  S.dragons = next;
  S.stats = { ...(S.stats || {}), interest: Number(S.stats?.interest || 0) + added };
  S.lastAccrued = dateMsFromISO(targetIso);
  SETTINGS.lastEndMonthDate = targetIso;
  saveSettings();
  toast(`${tt('dd_month_passed')} · ${money(added)}`);
  setTimeout(() => { BREATHING = []; renderAll(false); }, 1150);
  renderAll();
}
function openEdit(id) { DRAGON_DETAILS.add(id); EDIT_OPEN = id; STRIKE_OPEN = ''; renderAll(false); document.getElementById(`edit-${id}-name`)?.focus(); }
function cancelEdit() { EDIT_OPEN = ''; EDIT_FORM_DRAFT = {}; renderAll(false); }
function openAddDragon() { ADD_OPEN = true; ADD_FORM_DRAFT = {}; renderAll(false); document.getElementById('new-name')?.focus(); }
function closeAddDragon() { ADD_OPEN = false; ADD_FORM_DRAFT = {}; renderAll(false); }
function formPayload(prefix, validate = false) {
  if (validate) {
    const read = (field, rule) => PointyLogic.readField(`${prefix}-${field}`, rule);
    const existing = prefix.startsWith('edit-') ? S.dragons.find(d => d.id === prefix.slice(5)) : null;
    const unchangedBalance = existing && existing.balance >= 0 && document.getElementById(`${prefix}-balance`)?.value === fmtInput(existing.balance);
    // Accrued interest retains full precision when editing other details.
    const balance = unchangedBalance ? existing.balance : read('balance', { label: 'ยอดหนี้', min: prefix === 'new' ? .01 : 0 });
    const original = document.getElementById(`${prefix}-original`)?.value.trim() ? read('original', { label: 'ยอดหนี้เริ่มต้น' }) : balance;
    const payMode = document.getElementById(`${prefix}-payMode`)?.value === 'adhoc' ? 'adhoc' : 'monthly';
    return { name: read('name', { type: 'text', label: 'ชื่อมังกร', max: 80 }), type: document.getElementById(`${prefix}-type`).value,
      balance, original, payMode, apr: read('apr', { label: 'ดอกเบี้ย', decimals: 4 }),
      payment: payMode === 'adhoc' ? 0 : read('payment', { label: 'ยอดชำระต่อเดือน', min: .01 }),
      dueDay: payMode === 'adhoc' ? 0 : read('dueDay', { label: 'วันครบกำหนด', min: 1, max: 31, decimals: 0 }),
      interestMode: document.getElementById(`${prefix}-interestMode`)?.value === 'simple' ? 'simple' : 'compound' };
  }
  const type = document.getElementById(`${prefix}-type`)?.value || 'card';
  const balance = document.getElementById(`${prefix}-balance`)?.value || '';
  const original = document.getElementById(`${prefix}-original`)?.value || '';
  const payMode = document.getElementById(`${prefix}-payMode`)?.value === 'adhoc' ? 'adhoc' : 'monthly';
  return {
    name: (document.getElementById(`${prefix}-name`)?.value || '').trim(),
    type,
    balance,
    original,
    apr: document.getElementById(`${prefix}-apr`)?.value || '',
    payment: document.getElementById(`${prefix}-payment`)?.value || '',
    payMode,
    interestMode: document.getElementById(`${prefix}-interestMode`)?.value === 'simple' ? 'simple' : 'compound',
    dueDay: document.getElementById(`${prefix}-dueDay`)?.value || ''
  };
}
function addDragon() {
  let form;
  try { form = formPayload('new', true); } catch (error) { toast(error.message); return; }
  const now = PointyLogic.dateOnlyMs(new Date());
  S.dragons.push({ id: uid(), name: { th: form.name, en: form.name }, ...form, log: [], createdAt: now, interestAccruedAt: now, slain: false, slainAt: null });
  ADD_OPEN = false;
  ADD_FORM_DRAFT = {};
  SFX.click();
  renderAll();
}
function saveDragon(id) {
  let form;
  try { form = formPayload(`edit-${id}`, true); } catch (error) { toast(error.message); return; }
  const now = PointyLogic.dateOnlyMs(new Date());
  S.dragons = S.dragons.map(d => d.id === id ? { ...d, name: { th: form.name, en: form.name }, ...form, interestAccruedAt: ['balance', 'original', 'apr', 'interestMode'].some(key => d[key] !== form[key]) ? now : d.interestAccruedAt, slain: form.balance <= .005, slainAt: form.balance <= .005 ? d.slainAt || Date.now() : null } : d);
  EDIT_OPEN = '';
  EDIT_FORM_DRAFT = {};
  SFX.click();
  renderAll();
}
function deleteDragon(id) {
  if (!confirm(tt('dd_delete_confirm'))) return;
  S.dragons = S.dragons.filter(d => d.id !== id);
  renderAll();
}
function clearLair() {
  if (!S.dragons.length || !confirm(tt('dd_clear_lair_confirm'))) return;
  const slayer = { ...(S.slayer || {}) };
  S = PointyLogic.normalizeDebtState({
    slayer,
    dragons: [],
    art: {},
    lastAccrued: Date.now(),
    stats: { interest: 0 }
  });
  STRIKE_OPEN = '';
  EDIT_OPEN = '';
  EDIT_LOG = {};
  EDIT_LOG_DRAFTS = {};
  ADD_OPEN = false;
  FX = {};
  BREATHING = [];
  ACCRUAL_NOTE = null;
  POWER_EXTRA = 0;
  SFX.roar();
  renderAll();
}
function setDragonFormType(prefix, type) {
  const hidden = document.getElementById(`${prefix}-type`);
  if (!hidden) return;
  hidden.value = type;
  const min = PointyLogic.dragonType(type).minPay;
  const payMode = document.getElementById(`${prefix}-payMode`);
  const payment = document.getElementById(`${prefix}-payment`);
  if (payMode && prefix === 'new') payMode.value = min > 0 ? 'monthly' : 'adhoc';
  if (payment && prefix === 'new') payment.value = fmtInput(min);
  const form = hidden.closest('.dragon-form') || document;
  form.querySelectorAll('.df-type').forEach(btn => {
    const on = btn.dataset.dragonType === type;
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', String(on));
  });
  const wrap = document.getElementById(`${prefix}-payment-wrap`);
  if (wrap) wrap.style.display = payMode?.value === 'adhoc' ? 'none' : '';
  const dueWrap = document.getElementById(`${prefix}-due-wrap`);
  if (dueWrap) dueWrap.style.display = payMode?.value === 'adhoc' ? 'none' : '';
  if (prefix === 'new') ADD_FORM_DRAFT = formPayload(prefix);
}
function setPayMode(prefix, mode) {
  const el = document.getElementById(`${prefix}-payMode`);
  if (el) el.value = mode;
  const wrap = document.getElementById(`${prefix}-payment-wrap`);
  if (wrap) wrap.style.display = mode === 'adhoc' ? 'none' : '';
  const dueWrap = document.getElementById(`${prefix}-due-wrap`);
  if (dueWrap) dueWrap.style.display = mode === 'adhoc' ? 'none' : '';
  const group = el?.previousElementSibling;
  if (group) [...group.querySelectorAll('button')].forEach((btn, idx) => btn.classList.toggle('on', (idx === 0 && mode === 'monthly') || (idx === 1 && mode === 'adhoc')));
  if (prefix === 'new') ADD_FORM_DRAFT = formPayload(prefix);
}
function setInterestMode(prefix, mode) {
  const el = document.getElementById(`${prefix}-interestMode`);
  if (el) el.value = mode;
  const group = el?.previousElementSibling;
  if (group) [...group.querySelectorAll('button')].forEach((btn, idx) => btn.classList.toggle('on', (idx === 0 && mode === 'compound') || (idx === 1 && mode === 'simple')));
  if (prefix === 'new') ADD_FORM_DRAFT = formPayload(prefix);
}
function pickDragonArt(type, inputId) { document.getElementById(inputId)?.click(); }
function setDragonArt(type, file) {
  if (!file) return;
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type) || file.size > 2 * 1024 * 1024) { toast('ใช้ภาพ PNG, JPEG, WebP หรือ GIF ไม่เกิน 2 MB'); return; }
  const reader = new FileReader();
  reader.onload = () => { S.art = { ...(S.art || {}), [type]: reader.result }; renderAll(); };
  reader.readAsDataURL(file);
}
function requestStrike(id, amount) {
  DRAGON_DETAILS.add(id);
  DEBT_FILTER = 'all'; DEBT_QUERY = '';
  STRIKE_OPEN = id;
  EDIT_OPEN = '';
  SFX.click();
  renderAll(false);
  setTimeout(() => {
    const card = document.querySelector(`[data-dragon-id="${CSS.escape(id)}"]`);
    if (card) {
      const y = card.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: SETTINGS.animations === false ? 'auto' : 'smooth' });
    }
    if (amount != null) {
      const input = document.getElementById(`strike-amt-${id}`);
      if (input) input.value = fmtInput(Math.round(Number(amount) || 0));
    }
  }, 0);
}
function updatePowerAttack(value) {
  POWER_EXTRA = Math.max(0, Number(value) || 0);
  renderForecastOnly();
}
function logDraftKey(id, logId) {
  return `${id}::${logId}`;
}
function setLogEditDraft(id, logId, field, value) {
  const key = logDraftKey(id, logId);
  EDIT_LOG_DRAFTS[key] = { ...(EDIT_LOG_DRAFTS[key] || {}), [field]: value };
}
function openLogEdit(id, logId) {
  const row = (S.dragons.find(item => item.id === id)?.log || []).find(item => item.id === logId);
  EDIT_LOG_DRAFTS = row ? {
    [logDraftKey(id, logId)]: {
      amount: fmtInput(row.amount),
      date: row.ts ? dateISO(new Date(row.ts)) : todayISO()
    }
  } : {};
  EDIT_LOG = { [id]: logId };
  renderAll(false);
}
function closeLogEdit(id) {
  if (EDIT_LOG[id]) EDIT_LOG = {};
  EDIT_LOG_DRAFTS = {};
  renderAll(false);
}
function saveLogEdit(id, logId) {
  const draft = EDIT_LOG_DRAFTS[logDraftKey(id, logId)] || {};
  const amountRaw = draft.amount ?? document.getElementById(`log-amt-${id}-${logId}`)?.value;
  const date = draft.date ?? document.getElementById(`log-date-${id}-${logId}`)?.value ?? todayISO();
  try {
    const amount = PointyLogic.validateNumber(amountRaw, { label: 'ยอดชำระ', min: .01 });
    PointyLogic.validateDate(date);
    S.dragons = S.dragons.map(d => d.id === id ? PointyLogic.reviseDebtLog(d, { id: logId, amount, date }) : d);
  }
  catch (error) { toast(error.message); return; }
  EDIT_LOG = {};
  EDIT_LOG_DRAFTS = {};
  renderAll();
}
function deleteStrikeLog(id, logId) {
  try { S.dragons = S.dragons.map(d => d.id === id ? PointyLogic.reviseDebtLog(d, { id: logId, remove: true }) : d); }
  catch (error) { toast(error.message); return; }
  EDIT_LOG = {};
  EDIT_LOG_DRAFTS = {};
  renderAll();
}
function updateSlayerField(field, value) {
  if (accountHero()) {
    syncSlayerWithAccount();
    saveDebtState();
    if (field !== 'name') renderAll(false);
    return;
  }
  if (field === 'class') S.slayer.class = PointyLogic.normalizeClass(value);
  else if (field === 'gender') S.slayer.gender = value === 'female' ? 'female' : 'male';
  else if (field === 'skin') S.slayer.skin = value;
  else S.slayer[field] = value;
  saveDebtState();
  if (field !== 'name') renderAll(false);
}
function ensureDebtCharacter() {
  if (syncSlayerWithAccount()) {
    persistSlayerRecord();
    SFX.click();
    renderAll();
    return;
  }
  S.slayer.characterId = generateCharacterId();
  persistSlayerRecord();
  SFX.click();
  renderAll();
}
function linkDebtCharacter() {
  if (syncSlayerWithAccount()) {
    persistSlayerRecord();
    renderAll();
    return;
  }
  const id = String(document.getElementById('slayer-character-id')?.value || '').replace(/\D/g, '').slice(0, 4);
  if (id.length !== 4) return;
  const registry = readLocalRegistry();
  const rec = registry[id] || {};
  S.slayer.characterId = id;
  if (rec.name) S.slayer.name = rec.name;
  if (rec.class) S.slayer.class = PointyLogic.normalizeClass(rec.class);
  if (rec.gender) S.slayer.gender = rec.gender;
  if (rec.skin) S.slayer.skin = rec.skin;
  persistSlayerRecord();
  renderAll();
}
function setStrategy(strategy) {
  SETTINGS.strategy = strategy === 'snowball' ? 'snowball' : 'avalanche';
  saveSettings();
  saveDebtState();
  SFX.click();
  renderAll(false);
}
function toggleSetting(key) {
  SETTINGS[key] = !SETTINGS[key];
  saveSettings();
  renderAll(false);
}
function setTheme(theme) { SETTINGS.theme = applyGlobalTheme(theme); saveSettings(); renderAll(false); }
function setAccent(color) { if (ACCENTS.includes(color)) SETTINGS.accent = color; saveSettings(); renderAll(false); }
function setBattleFx(mode) { SETTINGS.battlefx = mode === 'minimal' ? 'minimal' : 'full'; saveSettings(); renderAll(false); }
function openSettings() { OVERLAY = 'settings'; SFX.click(); renderOverlay(); }
function closeOverlay() { OVERLAY = ''; renderOverlay(); document.querySelector('.debt-settings')?.focus(); }
function renderOverlay() {
  const root = document.getElementById('overlay-root');
  document.body.classList.toggle('debt-settings-open', OVERLAY === 'settings');
  if (OVERLAY !== 'settings') { root.innerHTML = ''; return; }
  const focusAction = root.contains(document.activeElement) ? document.activeElement.getAttribute('onclick') : null;
  root.innerHTML = `<div class="picker-overlay" onclick="closeOverlay()"><div class="picker" role="dialog" aria-modal="true" aria-labelledby="debt-settings-title" onclick="event.stopPropagation()">
    <div class="picker-head"><h2 class="picker-title" id="debt-settings-title">⚙ ${tt('settings')}</h2><button class="picker-close" aria-label="${debtCopy('ปิด', 'Close')}" onclick="closeOverlay()">✕</button></div>
    <div class="settings-grid">
      <div class="settings-row"><div><div class="settings-label">${tt('theme')}</div></div><div class="seg"><button class="${SETTINGS.theme === 'tavern' ? 'on' : ''}" onclick="setTheme('tavern')">${tt('theme_tavern')}</button><button class="${SETTINGS.theme === 'dungeon' ? 'on' : ''}" onclick="setTheme('dungeon')">${tt('theme_dungeon')}</button></div></div>
      <div class="settings-row"><div class="settings-label">${tt('accent')}</div><div class="swatches">${ACCENTS.map(color => `<button class="swatch ${SETTINGS.accent === color ? 'on' : ''}" style="background:${color}" onclick="setAccent('${color}')" aria-label="${color}"></button>`).join('')}</div></div>
      <div class="settings-row"><div class="settings-label">${tt('sound_effects')}</div><div class="seg"><button class="${SETTINGS.sound ? 'on' : ''}" onclick="toggleSetting('sound')">ON</button><button class="${!SETTINGS.sound ? 'on' : ''}" onclick="toggleSetting('sound')">OFF</button></div></div>
      <div class="settings-row"><div class="settings-label">${tt('animations')}</div><div class="seg"><button class="${SETTINGS.animations !== false ? 'on' : ''}" onclick="toggleSetting('animations')">ON</button><button class="${SETTINGS.animations === false ? 'on' : ''}" onclick="toggleSetting('animations')">OFF</button></div></div>
      <div class="settings-row"><div><div class="settings-label">${tt('battle_fx')}</div></div><div class="seg"><button class="${SETTINGS.battlefx !== 'minimal' ? 'on' : ''}" onclick="setBattleFx('full')">${tt('full')}</button><button class="${SETTINGS.battlefx === 'minimal' ? 'on' : ''}" onclick="setBattleFx('minimal')">${tt('minimal')}</button></div></div>
    </div>
  </div></div>`;
  const focusTarget = [...root.querySelectorAll('button')].find(btn => focusAction && btn.getAttribute('onclick') === focusAction);
  (focusTarget || root.querySelector('.picker-close')).focus();
  root.onkeydown = event => {
    if (event.key === 'Escape') { event.stopPropagation(); closeOverlay(); return; }
    if (event.key !== 'Tab') return;
    const buttons = [...root.querySelectorAll('button:not(:disabled)')];
    if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
  };
}

function reconcileAccrualOnOpen() {
  const { next, added, days } = accrueDragonsToDate(S.dragons, PointyLogic.dateOnlyMs(new Date()));
  if (days <= 0) return;
  S.lastAccrued = PointyLogic.dateOnlyMs(new Date());
  if (added <= 0) return;
  S.dragons = next;
  S.stats = { ...(S.stats || {}), interest: Number(S.stats?.interest || 0) + added };
  ACCRUAL_NOTE = { n: days, days: true, added: Math.round(added) };
  BREATHING = next.filter(d => !d.slain && Number(d.balance) > .005 && Number(d.apr) > 0).map(d => d.id);
  SFX.roar();
  setTimeout(() => { BREATHING = []; ACCRUAL_NOTE = null; renderAll(false); }, 5000);
}

Object.assign(window, {
  setDebtFilter, resetDebtFilters, applyDebtFilters, toggleDragonDetails, openDebtStrategy,
  renderAll,
  openStrike,
  closeStrike,
  pickMove,
  strikeDragon,
  endMonth,
  openEdit,
  cancelEdit,
  openAddDragon,
  closeAddDragon,
  addDragon,
  saveDragon,
  deleteDragon,
  clearLair,
  setDragonFormType,
  setPayMode,
  setInterestMode,
  pickDragonArt,
  setDragonArt,
  requestStrike,
  updatePowerAttack,
  openLogEdit,
  closeLogEdit,
  setLogEditDraft,
  saveLogEdit,
  deleteStrikeLog,
  updateSlayerField,
  ensureDebtCharacter,
  linkDebtCharacter,
  setStrategy,
  toggleSetting,
  setTheme,
  setAccent,
  setBattleFx,
  openSettings,
  closeOverlay,
  renderForecastOnly
});

applySettings();
reconcileAccrualOnOpen();
renderAll(false);
window.PointyModuleCloud?.register({ key: STORE_KEY, field: 'debt', empty: () => ({ dragons: [], stats: { interest: 0 } }), apply: value => { S = PointyLogic.normalizeDebtState({ ...value, dragons: value.dragons || [] }); SETTINGS.strategy = value.strategy || SETTINGS.strategy; syncSlayerWithAccount(); renderAll(false); } });
document.getElementById('app').addEventListener('click', event => { const button = event.target.closest('[data-restore-dragon]'); if (!button) return; S.dragons = S.dragons.map(d => d.id === button.dataset.restoreDragon ? { ...d, archived: false } : d); renderAll(); });
