const TR_KEY = 'pointy_treasury_v1';
const THEME_KEY = 'pointy_theme';
const UI_KEY = 'coin_quest_ui_v1';
const TR_XP_MONTH = 800;
const TR_XP_ONTIME = 60;
const TR_XP_LOG = 8;

const TR_STR = {
  th: {
    trNav: 'คลังหลวง',
    trTitle: 'คลังหลวง',
    trSub: 'ปกป้องคลังประจำเดือน — ตั้งงบ คุมเหล่าสัตว์ประหลาดที่มาปล้นทองทุกเดือน',
    trIncome: 'ทองเข้า',
    trSpent: 'ใช้ไป',
    trRemaining: 'คงเหลือ',
    trDaysLeft: 'เหลือ',
    trDays: 'วัน',
    trVault: 'คลังทอง',
    trVaultSafe: 'คลังมั่นคง',
    trVaultLow: 'ทองร่อยหรอ',
    trVaultBreached: 'คลังถูกปล้น!',
    trWards: 'ด่านป้องกัน',
    trBudget: 'งบ',
    trOver: 'เกินงบ',
    trLeft: 'เหลือ',
    trMonster: 'สัตว์ร้าย',
    trAddExpense: 'บันทึกรายจ่าย',
    trAmount: 'จำนวนทอง',
    trCategory: 'หมวด',
    trNote: 'รายละเอียด',
    trNotePh: 'เช่น ข้าวมันไก่',
    trLogExpense: 'ลงบันทึก',
    trLogged: 'บันทึกแล้ว!',
    trBills: 'บิลรายเดือน',
    trBillsSub: 'สัตว์ร้ายที่บุกปล้นทุกเดือน',
    trAddBill: 'เพิ่มบิล',
    trBillName: 'ชื่อบิล',
    trDueDay: 'ครบกำหนดวันที่',
    trDueSuffix: 'ของเดือน',
    trPayBill: 'จ่ายเลย',
    trPaid: 'จ่ายแล้ว',
    trDueIn: 'อีก {n} วัน',
    trDueToday: 'ครบวันนี้',
    trOverdue: 'เลยกำหนด!',
    trUnpaid: 'ยังไม่จ่าย',
    trForecast: 'พยากรณ์สิ้นเดือน',
    trOnTrack: 'คุมงบได้ดี',
    trOverspend: 'ใช้เกินจังหวะ',
    trProjected: 'คาดสิ้นเดือน',
    trSurplus: 'เหลือเก็บ',
    trDeficit: 'ขาดดุล',
    trDailyLeft: 'ใช้ได้/วัน',
    trMonthsWon: 'เดือนที่คุมงบ',
    trHistory: 'ย้อนหลัง',
    trThisMonth: 'เดือนนี้',
    trCloseMonth: 'ปิดยอดเดือน',
    trCloseConfirm: 'ปิดยอดเดือนนี้แล้วเริ่มเดือนใหม่? ยอดจะถูกบันทึกลงประวัติ',
    trWon: 'คุมงบสำเร็จ!',
    trLost: 'งบบานปลาย',
    trReset: 'ล้างคลัง',
    trResetConfirm: 'ล้างหมวด บิล และรายจ่ายทั้งหมด เริ่มใหม่?',
    trSetIncome: 'ตั้งทองเข้า/เดือน',
    trEditCat: 'แก้หมวด',
    trAddCat: 'เพิ่มหมวด',
    trCatName: 'ชื่อหมวด',
    trNoExpenses: 'ยังไม่มีรายจ่ายในหมวดนี้',
    trNoBills: 'ยังไม่มีบิลรายเดือน',
    trSpentLab: 'ใช้ไป',
    trOf: 'จาก',
    trAllocated: 'จัดงบแล้ว',
    trUnalloc: 'ยังไม่จัดงบ',
    trDelete: 'ลบ',
    trSave: 'บันทึก',
    trCancel: 'ยกเลิก'
  },
  en: {
    trNav: 'Personal Treasury',
    trTitle: 'Personal Treasury',
    trSub: "Defend this month's vault — set a budget and keep the monsters that raid your gold in check",
    trIncome: 'Income',
    trSpent: 'Spent',
    trRemaining: 'Remaining',
    trDaysLeft: 'Left',
    trDays: 'days',
    trVault: 'The Vault',
    trVaultSafe: 'Vault secure',
    trVaultLow: 'Running low',
    trVaultBreached: 'Vault breached!',
    trWards: 'The Wards',
    trBudget: 'Budget',
    trOver: 'over',
    trLeft: 'left',
    trMonster: 'Monster',
    trAddExpense: 'Log an expense',
    trAmount: 'Amount',
    trCategory: 'Category',
    trNote: 'Note',
    trNotePh: 'e.g. Chicken rice',
    trLogExpense: 'Log it',
    trLogged: 'Logged!',
    trBills: 'Monthly bills',
    trBillsSub: 'Monsters that raid every month',
    trAddBill: 'Add bill',
    trBillName: 'Bill name',
    trDueDay: 'Due day',
    trDueSuffix: 'of mo',
    trPayBill: 'Pay now',
    trPaid: 'Paid',
    trDueIn: 'in {n}d',
    trDueToday: 'due today',
    trOverdue: 'Overdue!',
    trUnpaid: 'Unpaid',
    trForecast: 'Month forecast',
    trOnTrack: 'On track',
    trOverspend: 'Overspending',
    trProjected: 'Projected',
    trSurplus: 'Surplus saved',
    trDeficit: 'Over budget',
    trDailyLeft: 'safe / day',
    trMonthsWon: 'Months won',
    trHistory: 'History',
    trThisMonth: 'This month',
    trCloseMonth: 'Close the month',
    trCloseConfirm: "Close this month and start a new one? It'll be saved to your history.",
    trWon: 'Under budget!',
    trLost: 'Over budget',
    trReset: 'Clear vault',
    trResetConfirm: 'Clear all categories, bills and expenses? This starts the vault over.',
    trSetIncome: 'Set monthly income',
    trEditCat: 'Edit ward',
    trAddCat: 'Add category',
    trCatName: 'Category name',
    trNoExpenses: 'No expenses in this ward yet',
    trNoBills: 'No monthly bills yet',
    trSpentLab: 'Spent',
    trOf: 'of',
    trAllocated: 'Budgeted',
    trUnalloc: 'Unbudgeted',
    trDelete: 'Delete',
    trSave: 'Save',
    trCancel: 'Cancel'
  }
};

const SEED_TREASURY = {
  keeper: { name: 'Pointy', avatar: 'engineer-male' },
  income: 45000,
  categories: [
    { id: 'home', name: { th: 'บ้าน & บิล', en: 'Home & Bills' }, glyph: '🏠', monster: { th: 'โทรลล์ค่าเช่า', en: 'Rent Troll' }, budget: 16000 },
    { id: 'food', name: { th: 'กินดื่ม', en: 'Food & Drink' }, glyph: '🍜', monster: { th: 'ก็อบลินหิว', en: 'Hunger Goblin' }, budget: 9000 },
    { id: 'transport', name: { th: 'เดินทาง', en: 'Transport' }, glyph: '🛵', monster: { th: 'ภูตถนน', en: 'Road Wraith' }, budget: 3000 },
    { id: 'fun', name: { th: 'บันเทิง', en: 'Fun & Leisure' }, glyph: '🎮', monster: { th: 'ภูตปาร์ตี้', en: 'Party Imp' }, budget: 4000 },
    { id: 'shop', name: { th: 'ช้อปปิ้ง', en: 'Shopping' }, glyph: '🛍️', monster: { th: 'เกรมลินช้อป', en: 'Loot Gremlin' }, budget: 3500 },
    { id: 'health', name: { th: 'สุขภาพ', en: 'Health' }, glyph: '💊', monster: { th: 'ค้างคาวโรคร้าย', en: 'Plague Bat' }, budget: 2500 }
  ],
  bills: [
    { id: 'tb1', name: { th: 'ค่าเช่าห้อง', en: 'Rent' }, catId: 'home', amount: 12000, dueDay: 1, glyph: '🏠' },
    { id: 'tb2', name: { th: 'ค่าไฟ', en: 'Electricity' }, catId: 'home', amount: 1400, dueDay: 18, glyph: '⚡' },
    { id: 'tb3', name: { th: 'เน็ต + มือถือ', en: 'Internet + Phone' }, catId: 'home', amount: 899, dueDay: 22, glyph: '📶' },
    { id: 'tb4', name: { th: 'Netflix + Spotify', en: 'Netflix + Spotify' }, catId: 'fun', amount: 419, dueDay: 5, glyph: '📺' },
    { id: 'tb5', name: { th: 'ฟิตเนส', en: 'Gym' }, catId: 'health', amount: 1200, dueDay: 10, glyph: '🏋️' }
  ],
  expenses: [],
  history: [
    { month: '2026-05', income: 45000, spent: 41250, surplus: 3750, won: true },
    { month: '2026-04', income: 45000, spent: 47600, surplus: -2600, won: false },
    { month: '2026-03', income: 45000, spent: 43800, surplus: 1200, won: true }
  ],
  stats: { monthsWon: 2, logged: 31, onTime: 11 },
  month: null
};

let S = loadTreasury();
let modal = null;
let toastTimer = null;

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
function setTheme(theme) {
  const next = normalizeThemeValue(theme);
  try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
  writeJsonSetting(UI_KEY, { ...readJsonSetting(UI_KEY, {}), theme: next });
  document.documentElement.setAttribute('data-theme', next);
  document.body.setAttribute('data-theme', next);
}

function truid() { return 't' + Math.random().toString(36).slice(2, 9); }
function lang() { return window.LANG === 'en' ? 'en' : 'th'; }
function st() { return TR_STR[lang()] || TR_STR.th; }
function h(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function money(n) { return '฿' + Math.round(Number(n) || 0).toLocaleString(lang() === 'th' ? 'th-TH' : 'en-US'); }
function monthKey(d) { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'); }
function daysInMonth(d) { const x = new Date(d); return new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate(); }
function isoDay(mk, day) { const [y, m] = mk.split('-').map(Number); const dim = new Date(y, m, 0).getDate(); return `${mk}-${String(Math.min(day, dim)).padStart(2, '0')}`; }
function monthLabel(mk) {
  const [y, m] = String(mk).split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  const mon = lang() === 'en' ? d.toLocaleString('en-US', { month: 'short' }) : ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][(m || 1) - 1];
  return `${mon} ${lang() === 'en' ? y : (y + 543) % 100}`;
}
function freshTreasury(mk = monthKey(new Date())) {
  const today = new Date();
  const dom = today.getDate();
  const exps = [];
  SEED_TREASURY.bills.forEach(b => {
    if (b.dueDay <= dom) exps.push({ id: truid(), catId: b.catId, billId: b.id, amount: b.amount, note: b.name.en, date: isoDay(mk, b.dueDay), onTime: true });
  });
  [
    { catId: 'food', amount: 320, note: 'Chicken rice', day: 2 },
    { catId: 'food', amount: 540, note: 'Groceries', day: 4 },
    { catId: 'transport', amount: 180, note: 'BTS top-up', day: 3 },
    { catId: 'fun', amount: 480, note: 'Movie night', day: 7 },
    { catId: 'shop', amount: 690, note: 'T-shirt', day: 9 }
  ].forEach(e => { if (e.day <= dom) exps.push({ ...e, id: truid(), date: isoDay(mk, e.day) }); });
  return JSON.parse(JSON.stringify({ ...SEED_TREASURY, expenses: exps, month: mk }));
}
function blankTreasury(mk = monthKey(new Date())) {
  return JSON.parse(JSON.stringify({ ...SEED_TREASURY, expenses: [], history: [], stats: {}, month: mk }));
}
function normalizeTreasury(data) {
  const fresh = freshTreasury();
  const next = { ...fresh, ...(data || {}) };
  next.keeper = { ...fresh.keeper, ...(next.keeper || {}) };
  next.categories = Array.isArray(next.categories) ? next.categories : fresh.categories;
  next.bills = Array.isArray(next.bills) ? next.bills : fresh.bills;
  next.expenses = Array.isArray(next.expenses) ? next.expenses : [];
  next.history = Array.isArray(next.history) ? next.history : [];
  next.stats = { ...fresh.stats, ...(next.stats || {}) };
  next.month = next.month || monthKey(new Date());
  return next;
}
function loadTreasury() {
  try {
    if (window.PointyScope) {
      const scoped = window.PointyScope.getJSON(TR_KEY, null);
      return scoped ? normalizeTreasury(scoped) : blankTreasury();
    }
    const raw = localStorage.getItem(TR_KEY);
    if (raw) return normalizeTreasury(JSON.parse(raw));
  } catch (_) {}
  return freshTreasury();
}
function save() {
  try {
    if (window.PointyScope) window.PointyScope.setJSON(TR_KEY, S);
    else localStorage.setItem(TR_KEY, JSON.stringify(S));
  } catch (_) {}
  window.dispatchEvent(new CustomEvent('pointy-treasury-changed'));
  window.dispatchEvent(new CustomEvent('coin-quest-state-changed'));
}
function catSpent(tr, catId) { return (tr.expenses || []).filter(e => e.catId === catId).reduce((a, e) => a + (Number(e.amount) || 0), 0); }
function totalSpent(tr) { return (tr.expenses || []).reduce((a, e) => a + (Number(e.amount) || 0), 0); }
function totalBudget(tr) { return (tr.categories || []).reduce((a, c) => a + (Number(c.budget) || 0), 0); }
function billPaidThisMonth(tr, billId, mk = tr.month) { return (tr.expenses || []).some(e => e.billId === billId && monthKey(e.date) === mk); }
function billDueStatus(bill, tr = S, today = new Date()) {
  const mk = tr.month || monthKey(today);
  if (monthKey(today) !== mk) return null;
  const paid = billPaidThisMonth(tr, bill.id, mk);
  const dueThis = Math.min(Number(bill.dueDay) || 1, daysInMonth(today));
  if (paid) return { paid: true, overdue: false, days: dueThis - today.getDate() };
  if (today.getDate() > dueThis) return { paid: false, overdue: true, days: today.getDate() - dueThis };
  return { paid: false, overdue: false, days: dueThis - today.getDate() };
}
function treasuryXp(tr = S) {
  const stats = tr.stats || {};
  return Math.round((stats.monthsWon || 0) * TR_XP_MONTH + (stats.onTime || 0) * TR_XP_ONTIME + (stats.logged || 0) * TR_XP_LOG);
}
function projectMonth(tr = S, today = new Date()) {
  const dim = daysInMonth(today);
  const dom = Math.max(1, today.getDate());
  const daysLeft = Math.max(0, dim - dom);
  const spent = totalSpent(tr);
  const paidBillIds = new Set((tr.expenses || []).filter(e => e.billId).map(e => e.billId));
  const unpaidBills = (tr.bills || []).filter(b => !paidBillIds.has(b.id)).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const variable = (tr.expenses || []).filter(e => !e.billId).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const projected = Math.round(spent + unpaidBills + (variable / dom) * daysLeft);
  const surplus = (Number(tr.income) || 0) - projected;
  const dailyLeft = daysLeft > 0 ? Math.max(0, Math.round(((Number(tr.income) || 0) - spent - unpaidBills) / daysLeft)) : Math.max(0, (Number(tr.income) || 0) - spent);
  return { dim, dom, daysLeft, spent, unpaidBills, projected, surplus, onTrack: surplus >= 0, dailyLeft };
}
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}
function closeModal() {
  if (modal) modal.remove();
  modal = null;
}
function mountModal(title, body) {
  closeModal();
  modal = document.createElement('div');
  modal.className = 'modal-cover';
  modal.innerHTML = `<div class="modal"><div class="modal-head"><div class="modal-title">${h(title)}</div><button class="x" type="button" data-close>×</button></div>${body}</div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('[data-close]')) closeModal(); });
}
function statusTextForBill(bill) {
  const due = billDueStatus(bill);
  if (!due) return '';
  if (due.paid) return st().trPaid;
  if (due.overdue) return st().trOverdue;
  if (due.days === 0) return st().trDueToday;
  return st().trDueIn.replace('{n}', due.days);
}
function rolloverIfNeeded() {
  const cur = monthKey(new Date());
  if (S.month === cur) return;
  const spent = totalSpent(S);
  const won = spent <= Number(S.income || 0);
  S.history = [{ month: S.month, income: S.income, spent, surplus: S.income - spent, won }, ...(S.history || [])].slice(0, 12);
  S.stats = { ...(S.stats || {}), monthsWon: (S.stats?.monthsWon || 0) + (won ? 1 : 0) };
  S.month = cur;
  S.expenses = [];
  save();
}
function renderAll() { render(); }
function render() {
  rolloverIfNeeded();
  const L = st();
  document.title = `Coin Quest Ledger — ${L.trTitle}`;
  document.querySelectorAll('[data-tr-i18n]').forEach(el => { el.textContent = L[el.dataset.trI18n] || el.textContent; });
  translatePage();
  const spent = totalSpent(S);
  const remaining = Number(S.income || 0) - spent;
  const vaultPct = Math.max(0, Math.min(100, Math.round((remaining / Math.max(1, Number(S.income || 0))) * 100)));
  const forecast = projectMonth(S);
  const budget = totalBudget(S);
  document.getElementById('app').innerHTML = `
    <section class="banner">
      <h1 class="banner-title">🏦 ${h(L.trTitle)}</h1>
      <div class="banner-sub">${h(L.trSub)} · <b>${h(monthLabel(S.month))}</b></div>
      <div class="hoard-bar">
        <div class="hoard-stat"><span class="hs-icon">💰</span><button class="hs-val btn-ghost sm" type="button" onclick="editIncome()">${money(S.income)} ✎</button><span class="hs-lab">${h(L.trIncome)}</span></div>
        <div class="hoard-stat"><span class="hs-icon">🗡️</span><span class="hs-val" style="color:var(--hp)">${money(spent)}</span><span class="hs-lab">${h(L.trSpent)}</span></div>
        <div class="hoard-stat"><span class="hs-icon">🛡️</span><span class="hs-val">${money(remaining)}</span><span class="hs-lab">${h(L.trRemaining)}</span></div>
        <div class="hoard-stat"><span class="hs-icon">⏳</span><span class="hs-val">${forecast.daysLeft}</span><span class="hs-lab">${h(L.trDaysLeft)} · ${h(L.trDays)}</span></div>
      </div>
      <div class="vault">
        <div class="vault-head"><span>🏰 ${h(L.trVault)}</span><span class="vault-state ${remaining < 0 ? 'breached' : ''}">${h(remaining < 0 ? L.trVaultBreached : vaultPct < 25 ? L.trVaultLow : L.trVaultSafe)}</span></div>
        <div class="vault-track"><div class="vault-fill" style="width:${vaultPct}%"></div></div>
      </div>
    </section>

    <div class="main-grid">
      <section class="panel">
        <div class="panel-head">
          <h2 class="panel-title">🛡️ ${h(L.trWards)}</h2>
          <div>
            <button class="btn-ghost sm" type="button" onclick="openExpenseForm()">${h(L.trAddExpense)}</button>
            <button class="btn-primary sm" type="button" onclick="openCategoryForm()">${h(L.trAddCat)}</button>
          </div>
        </div>
        <div class="ward-grid">${S.categories.map(renderWard).join('')}</div>
      </section>

      <aside>
        <section class="panel">
          <div class="panel-head">
            <h2 class="panel-title">🔮 ${h(L.trForecast)}</h2>
          </div>
          <div class="log-list">
            <div class="log-row"><span>📈</span><div><div class="row-title">${money(forecast.projected)}</div><div class="row-sub">${h(L.trProjected)}</div></div><span class="row-amt">${forecast.onTrack ? h(L.trOnTrack) : h(L.trOverspend)}</span></div>
            <div class="log-row"><span>${forecast.surplus >= 0 ? '💎' : '🔥'}</span><div><div class="row-title">${money(Math.abs(forecast.surplus))}</div><div class="row-sub">${h(forecast.surplus >= 0 ? L.trSurplus : L.trDeficit)}</div></div><span class="row-amt">${money(forecast.dailyLeft)}</span></div>
            <div class="log-row"><span>📊</span><div><div class="row-title">${money(budget)}</div><div class="row-sub">${h(L.trAllocated)}</div></div><span class="row-amt">${money((Number(S.income) || 0) - budget)}</span></div>
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2 class="panel-title">📜 ${h(L.trBills)}</h2><button class="btn-primary sm" type="button" onclick="openBillForm()">${h(L.trAddBill)}</button></div>
          <div class="bill-list">${S.bills.length ? S.bills.map(renderBill).join('') : `<div class="row-sub">${h(L.trNoBills)}</div>`}</div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2 class="panel-title">📅 ${h(L.trHistory)}</h2><span class="row-amt">XP ${treasuryXp(S)}</span></div>
          <div class="history-list">${S.history.slice(0, 5).map(row => `<div class="history-row"><span>${row.won ? '🏆' : '💥'}</span><div><div class="row-title">${h(monthLabel(row.month))}</div><div class="row-sub">${money(row.spent)} ${h(L.trOf)} ${money(row.income)}</div></div><span class="row-amt">${h(row.won ? L.trWon : L.trLost)}</span></div>`).join('')}</div>
          <div class="ward-actions"><button class="btn-gold sm" onclick="closeMonth()">${h(L.trCloseMonth)}</button><button class="btn-danger sm" onclick="resetTreasury()">${h(L.trReset)}</button></div>
        </section>
      </aside>
    </div>
  `;
}
function renderWard(cat) {
  const L = st();
  const spent = catSpent(S, cat.id);
  const budget = Math.max(1, Number(cat.budget) || 0);
  const pct = Math.min(100, Math.round((spent / budget) * 100));
  const over = spent > budget;
  const recent = S.expenses.filter(e => e.catId === cat.id).slice(-2).reverse();
  return `<article class="ward-card ${over ? 'breached' : ''}">
    <div class="ward-top">
      <span class="ward-glyph">${h(cat.glyph || '📦')}</span>
      <div class="ward-id"><div class="ward-name">${h(cat.name?.[lang()] || cat.name?.en || cat.name || '')}</div><div class="ward-monster">${over ? '🔥' : '🛡️'} ${h(cat.monster?.[lang()] || cat.monster?.en || L.trMonster)}</div></div>
      <button class="btn-ghost sm" onclick="openCategoryForm('${h(cat.id)}')">✎</button>
    </div>
    <div class="ward-bar-track"><div class="ward-bar-fill" style="width:${pct}%"></div></div>
    <div class="ward-nums"><span class="ward-spent ${over ? 'over' : ''}">${money(spent)}</span><span>${money(budget)}</span></div>
    <div class="ward-status"><span class="ward-tag ${over ? 'breach' : 'hold'}">${over ? `${h(L.trOver)} ${money(spent - budget)}` : `${money(budget - spent)} ${h(L.trLeft)}`}</span><span>${pct}%</span></div>
    <div class="log-list" style="margin-top:12px">${recent.length ? recent.map(e => `<div class="log-row"><span>${e.billId ? '🔁' : '🧾'}</span><div><div class="row-title">${h(e.note || L.trAddExpense)}</div><div class="row-sub">${h(e.date || '')}</div></div><span class="row-amt">-${money(e.amount)}</span></div>`).join('') : `<div class="row-sub">${h(L.trNoExpenses)}</div>`}</div>
    <div class="ward-actions"><button class="btn-primary sm" onclick="openExpenseForm('${h(cat.id)}')">＋ ${h(L.trAddExpense)}</button></div>
  </article>`;
}
function renderBill(bill) {
  const L = st();
  const due = billDueStatus(bill);
  const cat = S.categories.find(c => c.id === bill.catId);
  return `<div class="bill-row ${due?.overdue ? 'overdue' : ''}">
    <span>${h(bill.glyph || '📜')}</span>
    <div><div class="row-title">${h(bill.name?.[lang()] || bill.name?.en || bill.name || '')}</div><div class="row-sub">${h(cat?.name?.[lang()] || '')} · ${h(L.trDueDay)} ${h(bill.dueDay)} · ${h(statusTextForBill(bill))}</div></div>
    <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end;flex-wrap:wrap"><span class="row-amt">${money(bill.amount)}</span>${due?.paid ? `<span class="row-sub">✓</span>` : `<button class="btn-primary sm" onclick="payBill('${h(bill.id)}')">${h(L.trPayBill)}</button>`}<button class="btn-ghost sm" onclick="openBillForm('${h(bill.id)}')">✎</button></div>
  </div>`;
}
function editIncome() {
  const L = st();
  mountModal(L.trSetIncome, `<div class="form-grid"><label class="field">${h(L.trIncome)}<input id="income-input" type="number" value="${h(S.income)}"></label><button class="btn-primary" onclick="saveIncome()">${h(L.trSave)}</button></div>`);
}
function saveIncome() {
  S.income = Math.max(0, Number(document.getElementById('income-input').value) || 0);
  save(); closeModal(); render();
}
function openExpenseForm(catId = '') {
  const L = st();
  const today = new Date().toISOString().slice(0, 10);
  mountModal(L.trAddExpense, `<div class="form-grid">
    <label class="field">${h(L.trCategory)}<select id="expense-cat">${S.categories.map(c => `<option value="${h(c.id)}" ${catId === c.id ? 'selected' : ''}>${h(c.glyph)} ${h(c.name?.[lang()] || c.name?.en || c.name)}</option>`).join('')}</select></label>
    <div class="form-grid two"><label class="field">${h(L.trAmount)}<input id="expense-amount" type="number" inputmode="decimal" placeholder="0"></label><label class="field">Date<input id="expense-date" type="date" value="${today}"></label></div>
    <label class="field">${h(L.trNote)}<input id="expense-note" placeholder="${h(L.trNotePh)}"></label>
    <button class="btn-primary" onclick="saveExpense()">${h(L.trLogExpense)}</button>
  </div>`);
}
function saveExpense(extra = {}) {
  const L = st();
  const catId = document.getElementById('expense-cat')?.value || S.categories[0]?.id;
  const amount = Math.max(0, Number(document.getElementById('expense-amount')?.value) || 0);
  if (!amount) return;
  S.expenses.push({ id: truid(), catId, amount, note: document.getElementById('expense-note')?.value.trim() || L.trAddExpense, date: document.getElementById('expense-date')?.value || new Date().toISOString().slice(0, 10), ...extra });
  S.stats = { ...(S.stats || {}), logged: (S.stats?.logged || 0) + 1, onTime: (S.stats?.onTime || 0) + (extra.onTime ? 1 : 0) };
  save(); closeModal(); toast(L.trLogged); render();
}
function openCategoryForm(id = '') {
  const L = st();
  const cat = S.categories.find(c => c.id === id);
  const glyphs = ['🏠', '🍜', '🛵', '🎮', '🛍️', '💊', '✈️', '🎓', '🎁', '💡', '📦'];
  mountModal(cat ? L.trEditCat : L.trAddCat, `<div class="form-grid">
    <label class="field">Icon<select id="cat-glyph">${glyphs.map(g => `<option value="${h(g)}" ${cat?.glyph === g ? 'selected' : ''}>${h(g)}</option>`).join('')}</select></label>
    <label class="field">${h(L.trCatName)}<input id="cat-name" value="${h(cat?.name?.[lang()] || cat?.name?.en || '')}"></label>
    <label class="field">${h(L.trMonster)}<input id="cat-monster" value="${h(cat?.monster?.[lang()] || cat?.monster?.en || '')}"></label>
    <label class="field">${h(L.trBudget)}<input id="cat-budget" type="number" value="${h(cat?.budget || 3000)}"></label>
    <div class="ward-actions">${cat ? `<button class="btn-danger" onclick="deleteCategory('${h(cat.id)}')">${h(L.trDelete)}</button>` : ''}<button class="btn-primary" onclick="saveCategory('${h(cat?.id || '')}')">${h(L.trSave)}</button></div>
  </div>`);
}
function saveCategory(id = '') {
  const name = document.getElementById('cat-name').value.trim();
  if (!name) return;
  const data = { name: { th: name, en: name }, glyph: document.getElementById('cat-glyph').value, monster: { th: document.getElementById('cat-monster').value.trim() || name, en: document.getElementById('cat-monster').value.trim() || name }, budget: Math.max(0, Number(document.getElementById('cat-budget').value) || 0) };
  if (id) S.categories = S.categories.map(c => c.id === id ? { ...c, ...data } : c);
  else S.categories.push({ id: truid(), ...data });
  save(); closeModal(); render();
}
function deleteCategory(id) {
  if (S.categories.length <= 1) return;
  const fallback = S.categories.find(c => c.id !== id)?.id;
  S.categories = S.categories.filter(c => c.id !== id);
  S.expenses = S.expenses.map(e => e.catId === id ? { ...e, catId: fallback } : e);
  S.bills = S.bills.map(b => b.catId === id ? { ...b, catId: fallback } : b);
  save(); closeModal(); render();
}
function openBillForm(id = '') {
  const L = st();
  const bill = S.bills.find(b => b.id === id);
  const glyphs = ['📜', '🏠', '⚡', '📶', '📺', '🏋️', '🚗', '💳', '💧'];
  mountModal(bill ? L.trBills : L.trAddBill, `<div class="form-grid">
    <label class="field">Icon<select id="bill-glyph">${glyphs.map(g => `<option value="${h(g)}" ${bill?.glyph === g ? 'selected' : ''}>${h(g)}</option>`).join('')}</select></label>
    <label class="field">${h(L.trBillName)}<input id="bill-name" value="${h(bill?.name?.[lang()] || bill?.name?.en || '')}"></label>
    <div class="form-grid two"><label class="field">${h(L.trAmount)}<input id="bill-amount" type="number" value="${h(bill?.amount || 0)}"></label><label class="field">${h(L.trDueDay)}<input id="bill-due" type="number" min="1" max="31" value="${h(bill?.dueDay || 1)}"></label></div>
    <label class="field">${h(L.trCategory)}<select id="bill-cat">${S.categories.map(c => `<option value="${h(c.id)}" ${bill?.catId === c.id ? 'selected' : ''}>${h(c.glyph)} ${h(c.name?.[lang()] || c.name?.en || c.name)}</option>`).join('')}</select></label>
    <div class="ward-actions">${bill ? `<button class="btn-danger" onclick="deleteBill('${h(bill.id)}')">${h(L.trDelete)}</button>` : ''}<button class="btn-primary" onclick="saveBill('${h(bill?.id || '')}')">${h(L.trSave)}</button></div>
  </div>`);
}
function saveBill(id = '') {
  const name = document.getElementById('bill-name').value.trim();
  if (!name) return;
  const data = { name: { th: name, en: name }, amount: Math.max(0, Number(document.getElementById('bill-amount').value) || 0), dueDay: Math.max(1, Math.min(31, Number(document.getElementById('bill-due').value) || 1)), catId: document.getElementById('bill-cat').value, glyph: document.getElementById('bill-glyph').value };
  if (id) S.bills = S.bills.map(b => b.id === id ? { ...b, ...data } : b);
  else S.bills.push({ id: truid(), ...data });
  save(); closeModal(); render();
}
function deleteBill(id) {
  S.bills = S.bills.filter(b => b.id !== id);
  save(); closeModal(); render();
}
function payBill(id) {
  const bill = S.bills.find(b => b.id === id);
  if (!bill) return;
  const due = billDueStatus(bill);
  S.expenses.push({ id: truid(), catId: bill.catId, billId: bill.id, amount: bill.amount, note: bill.name?.[lang()] || bill.name?.en || '', date: new Date().toISOString().slice(0, 10), onTime: !(due && due.overdue) });
  S.stats = { ...(S.stats || {}), logged: (S.stats?.logged || 0) + 1, onTime: (S.stats?.onTime || 0) + (!(due && due.overdue) ? 1 : 0) };
  save(); toast(st().trPaid); render();
}
function closeMonth() {
  if (!confirm(st().trCloseConfirm)) return;
  const spent = totalSpent(S);
  const won = spent <= Number(S.income || 0);
  S.history = [{ month: S.month, income: S.income, spent, surplus: S.income - spent, won }, ...(S.history || [])].slice(0, 12);
  S.stats = { ...(S.stats || {}), monthsWon: (S.stats?.monthsWon || 0) + (won ? 1 : 0) };
  S.month = monthKey(new Date());
  S.expenses = [];
  save(); toast(won ? st().trWon : st().trLost); render();
}
function resetTreasury() {
  if (!confirm(st().trResetConfirm)) return;
  S = freshTreasury();
  save(); render();
}

window.billDueStatus = billDueStatus;
window.treasuryXp = treasuryXp;
window.projectMonth = projectMonth;
window.monthKey = monthKey;
window.totalSpent = totalSpent;
window.catSpent = catSpent;
window.setTheme = setTheme;

setTheme(currentGlobalTheme('tavern'));
render();
