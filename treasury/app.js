const TR_KEY = 'pointy_treasury_v1';
const THEME_KEY = 'pointy_theme';
const UI_KEY = 'coin_quest_ui_v1';

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
    trCloseMonth: 'บันทึกสรุปเดือน',
    trCloseConfirm: 'บันทึกสรุปเดือนนี้พร้อมรายละเอียด? รายจ่ายยังแก้ไขได้ และเริ่มรอบใหม่เมื่อถึงเดือนถัดไป',
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
    trCloseMonth: 'Save month summary',
    trCloseConfirm: 'Save a summary with expense details? Entries remain editable until the next calendar month.',
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


let S = loadTreasury();
let modal = null;
let toastTimer = null;
let modalReturnFocus = null;

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
function money(n) { return '฿' + (Number(n) || 0).toLocaleString(lang() === 'th' ? 'th-TH' : 'en-US', { maximumFractionDigits: 2 }); }
const fmtInput = value => PointyLogic.formatNumberInput(value);
const numInput = value => PointyLogic.parseNumberInput(value);
function monthKey(d) { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'); }
function daysInMonth(d) { const x = new Date(d); return new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate(); }
function isoDay(mk, day) { const [y, m] = mk.split('-').map(Number); const dim = new Date(y, m, 0).getDate(); return `${mk}-${String(Math.min(day, dim)).padStart(2, '0')}`; }
function monthLabel(mk) {
  const [y, m] = String(mk).split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  const mon = lang() === 'en' ? d.toLocaleString('en-US', { month: 'short' }) : ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][(m || 1) - 1];
  return `${mon} ${lang() === 'en' ? y : (y + 543) % 100}`;
}
function blankTreasury(mk = monthKey(new Date())) {
  return { keeper: {}, income: 0, categories: [], bills: [], expenses: [], history: [], stats: { monthsWon: 0, logged: 0, onTime: 0 }, month: mk };
}
function normalizeTreasury(data) {
  const fresh = { keeper: {}, income: 0, categories: [], bills: [], expenses: [], history: [], stats: { monthsWon: 0, logged: 0, onTime: 0 }, month: monthKey(new Date()) };
  const next = { ...fresh, ...(data || {}) };
  next.keeper = { ...fresh.keeper, ...(next.keeper || {}) };
  next.categories = Array.isArray(next.categories) ? next.categories : fresh.categories;
  next.bills = Array.isArray(next.bills) ? next.bills : fresh.bills;
  next.expenses = Array.isArray(next.expenses) ? next.expenses : [];
  next.history = Array.isArray(next.history) ? next.history : [];
  next.stats = { ...fresh.stats, ...(next.stats || {}) };
  next.month = next.month || monthKey(new Date());
  next.stats.monthsWon = Math.max(Number(next.stats.monthsWon) || 0, wonMonthCount(next));
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
  return blankTreasury();
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
function totalSpent(tr) { return PointyLogic.treasurySpent(tr); }
function totalBudget(tr) { return (tr.categories || []).reduce((a, c) => a + (Number(c.budget) || 0), 0); }
function wonMonthCount(tr = S) {
  return new Set((tr.history || []).filter(row => row.won && row.month).map(row => row.month)).size;
}
function recordMonthClose(won, spent) {
  S = PointyLogic.treasuryClose(S);
}
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
  return PointyLogic.treasuryXp(tr);
}
function projectMonth(tr = S, today = new Date()) {
  return PointyLogic.treasuryProjection(tr, today);
}
function toast(msg) {
  if (modal) {
    let feedback = modal.querySelector('.modal-feedback');
    if (!feedback) {
      feedback = document.createElement('p');
      feedback.className = 'modal-feedback';
      feedback.setAttribute('role','alert');
      modal.querySelector('.modal-head').after(feedback);
    }
    feedback.textContent = msg;
  }
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}
function closeModal() {
  if (modal) { modal.close(); modal.remove(); }
  modal = null;
  const previous = modalReturnFocus;
  requestAnimationFrame(() => {
    if (previous?.element?.isConnected) previous.element.focus();
    else if (previous?.action) [...document.querySelectorAll('[data-action]')].find(el=>el.dataset.action===previous.action && (el.dataset.id||'')===previous.id)?.focus();
  });
}
function mountModal(title, body) {
  if (modal) { modal.close(); modal.remove(); }
  const active = document.activeElement;
  modalReturnFocus = {element:active,action:active?.dataset?.action,id:active?.dataset?.id||''};
  modal = document.createElement('dialog');
  modal.className = 'modal-cover';
  modal.setAttribute('aria-labelledby','treasury-dialog-title');
  modal.innerHTML = `<div class="modal"><div class="modal-head"><h2 class="modal-title" id="treasury-dialog-title">${h(title)}</h2><button class="x" type="button" data-close aria-label="${h(trText('ปิด','Close'))}">×</button></div>${body}</div>`;
  document.body.appendChild(modal);
  modal.showModal();
  modal.addEventListener('input',()=>modal?.querySelector('.modal-feedback')?.remove());
  modal.addEventListener('change',()=>modal?.querySelector('.modal-feedback')?.remove());
  (modal.querySelector('input, select') || modal.querySelector('[data-close]')).focus();
  modal.addEventListener('cancel', e=>{e.preventDefault();closeModal();});
  modal.addEventListener('keydown', e=>{
    if (e.key === 'Enter' && e.target.matches('input')) {
      e.preventDefault(); modal.querySelector('.btn-primary')?.click();
    }
    if (e.key !== 'Tab') return;
    const items = [...modal.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]')].filter(el=>el.getClientRects().length);
    const first = items[0], last = items[items.length - 1];
    if (!e.shiftKey && document.activeElement === last) { e.preventDefault();first?.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault();last?.focus(); }
  });
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
  recordMonthClose(won, spent);
  S.month = cur;
  S.expenses = [];
  save();
}
function renderAll() { render(); }
// View-only controls never change the active month's financial state.
let viewedMonth = null;
let categoryFilter = 'all';
const sectionState = new Map();
const categoryState = new Set();
const trText = (th, en) => lang() === 'th' ? th : en;
const catName = cat => cat?.name?.[lang()] || cat?.name?.en || cat?.name || '';
const art = (name, extra = '') => '<img class="tr-art ' + extra + '" src="/assets/treasury-reference/' + name + '.webp" alt="" width="48" height="48">';
const glyphArt = glyph => ({'🏠':'home','🍜':'food','🛵':'transport','🎮':'fun','🛍️':'shop','💊':'health'})[glyph];
function categoryIcon(cat) { return glyphArt(cat.glyph) ? art(glyphArt(cat.glyph)) : '<span class="tr-glyph" aria-hidden="true">' + h(cat.glyph || '📦') + '</span>'; }
function categoryStatus(cat) {
  const spent = catSpent(S,cat.id), budget = Number(cat.budget) || 0;
  return spent > budget ? 'over' : budget > 0 && spent / budget >= .8 ? 'near' : 'normal';
}
function isSectionOpen(id) {
  if (sectionState.has(id)) return sectionState.get(id);
  return id === 'wards' ? innerWidth >= 600 : id === 'forecast' && innerWidth >= 1100;
}
function section(id, icon, title, body, count = '') {
  return '<details class="treasury-section panel section-' + id + '" id="section-' + id + '" ' + (isSectionOpen(id) ? 'open' : '') + '><summary>' + art(icon) + '<h2>' + h(title) + '</h2>' + (count !== '' ? '<span class="section-count">' + h(count) + '</span>' : '') + '<span class="chevron" aria-hidden="true">›</span></summary><div class="section-body">' + body + '</div></details>';
}
function availableMonths() { return [...new Set([S.month, ...S.history.map(row=>row.month)])].filter(Boolean).sort(); }
function showMonth(mk) {
  if (!availableMonths().includes(mk)) return;
  viewedMonth = mk === S.month ? null : mk;
  render();
  document.getElementById('treasury-month')?.focus();
}
function stepMonth(step) {
  const months = availableMonths(), index = months.indexOf(viewedMonth || S.month);
  showMonth(months[index + step]);
}
function render() {
  rolloverIfNeeded();
  const L = st(), past = viewedMonth && S.history.find(row => row.month === viewedMonth && row.month !== S.month);
  if (!past) viewedMonth = null;
  const activeMonth = past?.month || S.month, months = availableMonths(), index = months.indexOf(activeMonth);
  document.title = 'Coin Quest Ledger — ' + L.trTitle;
  translatePage();
  const income = Number(past?.income ?? S.income) || 0;
  const spent = past ? Number(past.spent) || 0 : totalSpent(S), remaining = income - spent;
  const vaultPct = Math.max(0, Math.min(100, Math.round(remaining / Math.max(1,income) * 100)));
  const forecast = projectMonth(S), budget = totalBudget(S);
  const summaryMoney = n => '<span class="amount-full">' + money(n) + '</span><span class="amount-compact">' + (Math.abs(n) >= 10000 ? '฿' + (n / 1000).toLocaleString(lang() === 'th' ? 'th-TH' : 'en-US',{maximumFractionDigits:1}) + 'K' : money(n)) + '</span>';
  const pendingBills = S.bills.filter(b=>!b.archived && !billPaidThisMonth(S,b.id));
  const stat = (icon, key, value, label, editable = false) => '<' + (editable ? 'button type="button" data-action="income" aria-label="' + h(L.trSetIncome) + '"' : 'div') + ' class="hoard-stat stat-' + key + '">' + art(icon) + '<span class="stat-copy"><span class="hs-val">' + value + '</span><span class="hs-lab">' + h(label) + (editable ? ' <span aria-hidden="true">✎</span>' : '') + '</span></span></' + (editable ? 'button' : 'div') + '>';
  const filterLabels = {all:trText('ทั้งหมด','All'),normal:trText('ปกติ','On track'),near:trText('ใกล้เกินงบ','Near limit'),over:L.trOver};
  const filtered = S.categories.filter(c=>categoryFilter === 'all' || categoryStatus(c) === categoryFilter);
  const filters = '<div class="category-tools"><div class="category-filters" role="group" aria-label="' + h(trText('กรองหมวดหมู่','Filter categories')) + '">' + Object.entries(filterLabels).map(([key,label])=>'<button type="button" data-filter="' + key + '" aria-pressed="' + (categoryFilter === key) + '">' + h(label) + ' <span>(' + S.categories.filter(c=>key === 'all'||categoryStatus(c) === key).length + ')</span></button>').join('') + '</div></div>';
  const wards = filters + '<div class="ward-grid">' + (filtered.length ? filtered.map(renderWard).join('') : '<div class="empty-state">' + art('chest') + '<p>' + h(S.categories.length ? trText('ไม่มีหมวดในกลุ่มนี้','No categories in this group') : trText('เริ่มวางแผนด้วยงบหมวดแรกของคุณ','Start planning with your first budget category')) + '</p></div>') + '</div><button type="button" class="btn-ghost category-add" data-action="category">＋ ' + h(L.trAddCat) + '</button>';
  const forecastBody = '<div class="forecast-stats"><div class="forecast-row">' + art('forecast') + '<div><span class="row-sub">' + h(trText('คาดใช้จ่ายสิ้นเดือน','Projected spending')) + '</span><strong>' + money(forecast.projected) + '</strong></div><span class="status-pill ' + (forecast.onTrack?'safe':'over') + '">' + h(forecast.onTrack?L.trOnTrack:L.trOverspend) + '</span></div><div class="forecast-row">' + art('coins') + '<div><span class="row-sub">' + h(trText('ใช้ได้เฉลี่ยต่อวัน','Daily allowance')) + '</span><strong>' + money(forecast.dailyLeft) + ' <small>/ ' + h(L.trDays) + '</small></strong></div></div><div class="forecast-row forecast-surplus"><span class="row-sub">' + h(forecast.surplus >= 0?L.trSurplus:L.trDeficit) + '</span><strong class="' + (forecast.surplus >= 0?'positive':'negative') + '">' + money(Math.abs(forecast.surplus)) + '</strong></div></div><div class="forecast-categories">' + S.categories.map(c=>'<button type="button" class="forecast-category" data-action="category" data-id="' + h(c.id) + '">' + categoryIcon(c) + '<span>' + h(catName(c)) + '<small>' + money(catSpent(S,c.id)) + ' / ' + money(c.budget) + '</small></span><span aria-hidden="true">›</span></button>').join('') + '</div><div class="allocation"><span>' + h(L.trAllocated) + '<strong>' + money(budget) + '</strong></span><span>' + h(budget>income?trText('จัดเกินรายรับ','Over-allocated'):L.trUnalloc) + '<strong class="' + (budget>income?'negative':'') + '">' + money(Math.abs(income-budget)) + '</strong></span></div>';
  const bills = '<p class="section-help">' + h(trText('ติดตามบิลประจำและบันทึกเมื่อชำระแล้ว','Track recurring bills and record payments.')) + '</p><div class="bill-list">' + (S.bills.filter(b=>!b.archived).map(renderBill).join('') || '<p class="row-sub">' + h(L.trNoBills) + '</p>') + S.bills.filter(b=>b.archived).map(b=>'<button type="button" class="btn-ghost" data-restore-bill="' + h(b.id) + '">' + h(trText('นำบิลกลับมา','Restore bill')) + ' · ' + h(catName(b)) + '</button>').join('') + '</div><button type="button" class="btn-ghost category-add" data-action="bill">＋ ' + h(L.trAddBill) + '</button>';
  const history = '<div class="history-list">' + (S.history.slice().sort((a,b)=>b.month.localeCompare(a.month)).map(row=>'<button type="button" class="history-row" data-month="' + h(row.month) + '"><span aria-hidden="true">' + (row.won?'✓':'!') + '</span><span><strong>' + h(monthLabel(row.month)) + '</strong><small>' + money(row.spent) + ' / ' + money(row.income) + '</small></span><span class="' + (row.won?'positive':'negative') + '">' + h(row.won?L.trWon:L.trLost) + ' ›</span></button>').join('') || '<p class="row-sub">' + h(trText('ยังไม่มีสรุปเดือน','No monthly summaries yet')) + '</p>') + '</div><div class="history-xp">XP ' + treasuryXp(S) + ' · ' + h(L.trMonthsWon) + ' ' + wonMonthCount() + '</div><div class="ward-actions"><button type="button" class="btn-gold" data-action="close-month">' + h(L.trCloseMonth) + '</button><button type="button" class="btn-danger" data-action="reset">' + h(L.trReset) + '</button></div>';
  document.getElementById('app').innerHTML = '<section class="treasury-overview"><div class="treasury-hero"><div class="hero-title">' + art('chest') + '<h1>' + h(L.trTitle) + '</h1></div><p class="hero-sub">' + h(trText('ปกป้องคลังประจำเดือน — ตั้งงบ คุมค่าใช้จ่าย และเก็บเป้าหมายการผจญภัย','Protect your monthly vault. Plan, spend wisely, and save for your next quest.')) + '</p><div class="month-picker"><button type="button" data-month-step="-1" aria-label="' + h(trText('เดือนก่อนหน้า','Previous month')) + '" ' + (index<=0?'disabled':'') + '>‹</button><select id="treasury-month" aria-label="' + h(trText('เลือกเดือน','Choose month')) + '">' + months.map(m=>'<option value="' + h(m) + '" ' + (m===activeMonth?'selected':'') + '>' + h(monthLabel(m)) + '</option>').join('') + '</select><button type="button" data-month-step="1" aria-label="' + h(trText('เดือนถัดไป','Next month')) + '" ' + (index>=months.length-1?'disabled':'') + '>›</button></div><button type="button" class="btn-primary hero-add" data-action="' + (past?'current':'expense') + '">＋ ' + h(past?trText('กลับเดือนนี้','Back to this month'):L.trAddExpense) + '</button></div><div class="overview-content"><div class="hoard-bar">' + stat('coins','income',summaryMoney(income),trText('รายรับทั้งหมด','Income'),!past) + stat('swords','spent',summaryMoney(spent),L.trSpent) + stat('chest','remaining',summaryMoney(remaining),L.trRemaining) + stat('hourglass','days',past?'—':forecast.daysLeft,trText('วันคงเหลือ','Days left')) + '</div><div class="vault ' + (remaining<0?'breached':'') + '">' + art('chest') + '<span class="vault-label">' + h(trText('สถานะคลัง','Vault status')) + '</span><div class="vault-track" role="meter" aria-label="' + h(L.trRemaining) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + vaultPct + '"><div class="vault-fill" style="width:' + vaultPct + '%"></div></div><span class="vault-percent">' + vaultPct + '%<span> ' + h(trText('ของรายรับเดือนนี้','of monthly income')) + '</span></span>' + (remaining<0?'<strong class="negative">' + h(L.trOver) + '</strong>':'') + '</div><button type="button" class="btn-primary overview-add" data-action="' + (past?'current':'expense') + '">＋ ' + h(past?trText('กลับเดือนนี้','Back to this month'):L.trAddExpense) + '</button></div></section>' + (past ? renderHistoricalMonth(past) : '<div class="main-grid">' + section('wards','home',trText('หมวดงบของฉัน','My budgets'),wards,S.categories.length) + '<aside>' + section('forecast','forecast',L.trForecast,forecastBody) + section('bills','history',trText('บิลและรายการที่ต้องจ่าย','Bills & payments'),bills,pendingBills.length || '') + section('history','history',trText('ประวัติเดือน','Monthly history'),history) + '</aside></div>') + '<cq-footer></cq-footer>';
  document.querySelectorAll('.treasury-section').forEach(el=>el.querySelector('summary').addEventListener('click',()=>sectionState.set(el.id.replace('section-',''),!el.open)));
  document.querySelectorAll('.ward-card').forEach(el=>el.querySelector('summary').addEventListener('click',()=>!el.open?categoryState.add(el.dataset.categoryId):categoryState.delete(el.dataset.categoryId)));
}
function renderHistoricalMonth(row) {
  const expenses = Array.isArray(row.expenses) ? row.expenses : null;
  return '<section class="panel historical-month"><div class="historical-heading">' + art('history') + '<div><h2>' + h(trText('สรุปเดือน','Monthly summary')) + ' · ' + h(monthLabel(row.month)) + '</h2><p class="' + (row.won?'positive':'negative') + '">' + h(row.won?st().trWon:st().trLost) + ' · ' + money(Math.abs(row.surplus)) + ' ' + h(row.surplus>=0?st().trLeft:st().trOver) + '</p></div><button type="button" class="btn-ghost" data-action="current">' + h(trText('กลับเดือนนี้','This month')) + '</button></div><div class="log-list">' + (expenses ? expenses.map(renderExpenseRow).join('') || '<p class="row-sub">' + h(trText('ไม่มีรายจ่ายในเดือนนี้','No expenses this month')) + '</p>' : '<p class="row-sub">' + h(trText('เดือนนี้มีเฉพาะยอดสรุป ไม่มีรายการรายจ่ายที่บันทึกไว้','Only totals were saved for this month; individual expenses are unavailable.')) + '</p>') + '</div></section>';
}
function renderExpenseRow(e) {
  return '<div class="log-row"><span aria-hidden="true">▤</span><div><div class="row-title">' + h(e.note || st().trAddExpense) + '</div><div class="row-sub">' + h(e.date || '') + '</div></div><span class="row-amt negative">−' + money(e.amount) + '</span></div>';
}
function renderWard(cat) {
  const L=st(), spent=catSpent(S,cat.id), budget=Number(cat.budget)||0;
  const ratio=budget>0?Math.round(spent/budget*100):spent>0?100:0, pct=Math.min(100,ratio);
  const over=spent>budget, recent=S.expenses.filter(e=>e.catId===cat.id).slice(-2).reverse();
  return '<details class="ward-card ' + (over?'breached':'') + '" data-category-id="' + h(cat.id) + '" ' + (innerWidth>=1100||categoryState.has(cat.id)?'open':'') + '><summary><span class="ward-top">' + categoryIcon(cat) + '<span class="ward-name">' + h(catName(cat)) + '</span><span class="ward-edit-hint" aria-hidden="true">›</span></span><span class="ward-bar-track"><span class="ward-bar-fill" style="width:' + pct + '%"></span></span><span class="ward-mini-percent">' + ratio + '%</span></summary><div class="ward-content"><div class="ward-nums"><span><strong>' + money(spent) + '</strong> / ' + money(budget) + '</span><span>' + ratio + '%</span></div><div class="ward-status ' + (over?'negative':'positive') + '">' + (over?h(L.trOver)+' '+money(spent-budget):money(budget-spent)+' '+h(L.trLeft)) + '</div><div class="log-list">' + (recent.length?recent.map(renderExpenseRow).join(''):'<p class="row-sub">' + h(L.trNoExpenses) + '</p>') + '</div><button type="button" class="btn-primary" data-action="expense" data-id="' + h(cat.id) + '">＋ ' + h(L.trAddExpense) + '</button><button type="button" class="ward-edit btn-ghost" data-action="category" data-id="' + h(cat.id) + '" aria-label="' + h(L.trEditCat+' '+catName(cat)) + '"><span aria-hidden="true">✎</span><span class="edit-caption">' + h(L.trEditCat) + '</span></button></div></details>';
}
function renderBill(bill) {
  const L = st();
  const due = billDueStatus(bill);
  const cat = S.categories.find(c => c.id === bill.catId);
  return `<div class="bill-row ${due?.overdue ? 'overdue' : ''}">
    <span>${h(bill.glyph || '📜')}</span>
    <div><div class="row-title">${h(bill.name?.[lang()] || bill.name?.en || bill.name || '')}</div><div class="row-sub">${h(cat?.name?.[lang()] || '')} · ${h(L.trDueDay)} ${h(bill.dueDay)} · ${h(statusTextForBill(bill))}</div></div>
    <div class="bill-actions"><span class="row-amt">${money(bill.amount)}</span>${due?.paid ? `<span class="row-sub">✓ ${h(L.trPaid)}</span>` : `<button type="button" class="btn-primary sm" data-action="pay" data-id="${h(bill.id)}">${h(L.trPayBill)}</button>`}<button type="button" class="btn-ghost sm" data-action="bill" data-id="${h(bill.id)}" aria-label="${h(trText('แก้ไขบิล','Edit bill')+' '+catName(bill))}">✎</button></div>
  </div>`;
}
function localToday() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function editIncome() {
  const L = st();
  mountModal(L.trSetIncome, `<div class="form-grid"><label class="field">${h(L.trIncome)}<input id="income-input" type="text" inputmode="decimal" value="${h(fmtInput(S.income))}" oninput="PointyLogic.formatNumberInputElement(this)"></label><button class="btn-primary" onclick="saveIncome()">${h(L.trSave)}</button></div>`);
}
function saveIncome() {
  try { S.income = PointyLogic.readField('income-input', { label: 'รายรับ' }); }
  catch (error) { toast(error.message); return; }
  save(); closeModal(); render();
}
function openExpenseForm(catId = '') {
  if (!S.categories.length) { toast('เพิ่มหมวดงบประมาณก่อนบันทึกรายจ่าย / Add a category first'); openCategoryForm(); return; }
  const L = st();
  const today = localToday();
  mountModal(L.trAddExpense, `<div class="form-grid">
    <label class="field">${h(L.trCategory)}<select id="expense-cat">${S.categories.map(c => `<option value="${h(c.id)}" ${catId === c.id ? 'selected' : ''}>${h(c.glyph)} ${h(c.name?.[lang()] || c.name?.en || c.name)}</option>`).join('')}</select></label>
    <div class="form-grid two"><label class="field">${h(L.trAmount)}<input id="expense-amount" type="text" inputmode="decimal" placeholder="0" oninput="PointyLogic.formatNumberInputElement(this)"></label><label class="field">${h(trText('วันที่','Date'))}<input id="expense-date" type="date" min="${S.month}-01" max="${isoDay(S.month,31)}" value="${today}"></label></div>
    <label class="field">${h(L.trNote)}<input id="expense-note" maxlength="120" placeholder="${h(L.trNotePh)}"></label>
    <button class="btn-primary" onclick="saveExpense()">${h(L.trLogExpense)}</button>
  </div>`);
}
function saveExpense(extra = {}) {
  const L = st();
  let amount, date, note;
  const catId = document.getElementById('expense-cat')?.value;
  try {
    if (!S.categories.some(c => c.id === catId)) throw new Error('เลือกหมวดรายจ่ายก่อน / Choose a category');
    amount = PointyLogic.readField('expense-amount', { label: 'รายจ่าย', min: .01 });
    date = PointyLogic.readField('expense-date', { type: 'date', month: S.month });
    note = PointyLogic.readField('expense-note', { type: 'text', label: 'รายละเอียด', max: 120, optional: true }) || L.trAddExpense;
  } catch (error) { toast(error.message); return; }
  S.expenses.push({ id: truid(), catId, amount, note, date, ...extra });
  S.stats = { ...(S.stats || {}), logged: (S.stats?.logged || 0) + 1, onTime: (S.stats?.onTime || 0) + (extra.onTime ? 1 : 0) };
  sectionState.set('wards',true);
  categoryState.add(catId);
  categoryFilter = 'all';
  save(); closeModal(); toast(L.trLogged); render();
}
function openCategoryForm(id = '') {
  const L = st();
  const cat = S.categories.find(c => c.id === id);
  const glyphs = ['🏠', '🍜', '🛵', '🎮', '🛍️', '💊', '✈️', '🎓', '🎁', '💡', '📦'];
  mountModal(cat ? L.trEditCat : L.trAddCat, `<div class="form-grid">
    <label class="field">Icon<select id="cat-glyph">${glyphs.map(g => `<option value="${h(g)}" ${cat?.glyph === g ? 'selected' : ''}>${h(g)}</option>`).join('')}</select></label>
    <label class="field">${h(L.trCatName)}<input id="cat-name" maxlength="80" value="${h(cat?.name?.[lang()] || cat?.name?.en || '')}"></label>
    <label class="field">${h(L.trMonster)}<input id="cat-monster" maxlength="80" value="${h(cat?.monster?.[lang()] || cat?.monster?.en || '')}"></label>
    <label class="field">${h(L.trBudget)}<input id="cat-budget" type="text" inputmode="decimal" value="${h(fmtInput(cat?.budget ?? 3000))}" oninput="PointyLogic.formatNumberInputElement(this)"></label>
    <div class="ward-actions">${cat ? `<button class="btn-danger" onclick="deleteCategory('${h(cat.id)}')">${h(L.trDelete)}</button>` : ''}<button class="btn-primary" onclick="saveCategory('${h(cat?.id || '')}')">${h(L.trSave)}</button></div>
  </div>`);
}
function saveCategory(id = '') {
  let data;
  try {
    const name = PointyLogic.readField('cat-name', { type: 'text', label: 'ชื่อหมวด', max: 80 });
    const monster = PointyLogic.readField('cat-monster', { type: 'text', label: 'ชื่อมอนสเตอร์', max: 80, optional: true }) || name;
    data = { name: { th: name, en: name }, glyph: document.getElementById('cat-glyph').value, monster: { th: monster, en: monster }, budget: PointyLogic.readField('cat-budget', { label: 'งบประมาณ' }) };
  } catch (error) { toast(error.message); return; }
  if (id) S.categories = S.categories.map(c => c.id === id ? { ...c, ...data } : c);
  else S.categories.push({ id: truid(), ...data });
  sectionState.set('wards',true);
  categoryFilter = 'all';
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
  if (!S.categories.length) { toast(trText('เพิ่มหมวดงบประมาณก่อนสร้างบิล','Add a budget category before creating a bill')); openCategoryForm(); return; }
  const L = st();
  const bill = S.bills.find(b => b.id === id);
  const glyphs = ['📜', '🏠', '⚡', '📶', '📺', '🏋️', '🚗', '💳', '💧'];
  mountModal(bill ? L.trBills : L.trAddBill, `<div class="form-grid">
    <label class="field">Icon<select id="bill-glyph">${glyphs.map(g => `<option value="${h(g)}" ${bill?.glyph === g ? 'selected' : ''}>${h(g)}</option>`).join('')}</select></label>
    <label class="field">${h(L.trBillName)}<input id="bill-name" maxlength="80" value="${h(bill?.name?.[lang()] || bill?.name?.en || '')}"></label>
    <div class="form-grid two"><label class="field">${h(L.trAmount)}<input id="bill-amount" type="text" inputmode="decimal" value="${h(fmtInput(bill?.amount || 0))}" oninput="PointyLogic.formatNumberInputElement(this)"></label><label class="field">${h(L.trDueDay)}<input id="bill-due" type="number" min="1" max="31" value="${h(bill?.dueDay || 1)}"></label></div>
    <label class="field">${h(L.trCategory)}<select id="bill-cat">${S.categories.map(c => `<option value="${h(c.id)}" ${bill?.catId === c.id ? 'selected' : ''}>${h(c.glyph)} ${h(c.name?.[lang()] || c.name?.en || c.name)}</option>`).join('')}</select></label>
    <div class="ward-actions">${bill ? `<button class="btn-danger" onclick="deleteBill('${h(bill.id)}')">${h(L.trDelete)}</button>` : ''}<button class="btn-primary" onclick="saveBill('${h(bill?.id || '')}')">${h(L.trSave)}</button></div>
  </div>`);
}
function saveBill(id = '') {
  let data;
  try {
    const name = PointyLogic.readField('bill-name', { type: 'text', label: 'ชื่อบิล', max: 80 });
    const catId = document.getElementById('bill-cat').value;
    if (!S.categories.some(c => c.id === catId)) throw new Error('เลือกหมวดของบิล / Choose a category');
    data = { name: { th: name, en: name }, amount: PointyLogic.readField('bill-amount', { label: 'ยอดบิล', min: .01 }), dueDay: PointyLogic.readField('bill-due', { label: 'วันครบกำหนด', min: 1, max: 31, decimals: 0 }), catId, glyph: document.getElementById('bill-glyph').value };
  } catch (error) { toast(error.message); return; }
  if (id) S.bills = S.bills.map(b => b.id === id ? { ...b, ...data } : b);
  else S.bills.push({ id: truid(), ...data });
  sectionState.set('bills',true);
  save(); closeModal(); render();
}
function deleteBill(id) {
  S.bills = S.bills.filter(b => b.id !== id);
  save(); closeModal(); render();
}
function payBill(id) {
  const bill = S.bills.find(b => b.id === id);
  if (!bill || bill.archived || billPaidThisMonth(S, id)) return;
  try {
    PointyLogic.validateNumber(bill.amount, { label: 'ยอดบิล', min: .01 });
    PointyLogic.validateNumber(bill.dueDay, { label: 'วันครบกำหนด', min: 1, max: 31, decimals: 0 });
    if (!S.categories.some(c => c.id === bill.catId)) throw new Error('แก้ไขหมวดของบิลก่อน / Edit the bill category first');
  } catch (error) { toast(error.message); return; }
  const due = billDueStatus(bill);
  S.expenses.push({ id: truid(), catId: bill.catId, billId: bill.id, amount: bill.amount, note: bill.name?.[lang()] || bill.name?.en || '', date: localToday(), onTime: !(due && due.overdue) });
  S.stats = { ...(S.stats || {}), logged: (S.stats?.logged || 0) + 1, onTime: (S.stats?.onTime || 0) + (!(due && due.overdue) ? 1 : 0) };
  save(); toast(st().trPaid); render();
}
function closeMonth() {
  if (!confirm(st().trCloseConfirm)) return;
  const spent = totalSpent(S);
  const won = spent <= Number(S.income || 0);
  recordMonthClose(won, spent);
  save(); toast(won ? st().trWon : st().trLost); render();
}
function resetTreasury() {
  if (!confirm(st().trResetConfirm)) return;
  S = blankTreasury();
  viewedMonth = null;
  categoryFilter = 'all';
  save(); render();
}

window.billDueStatus = billDueStatus;
document.getElementById('app').addEventListener('click', event => { const button = event.target.closest('[data-restore-bill]'); if (!button) return; S.bills = S.bills.map(b => b.id === button.dataset.restoreBill ? { ...b, archived: false } : b); save(); render(); });
window.treasuryXp = treasuryXp;
document.getElementById('app').addEventListener('change', event => {
  if (event.target.id === 'treasury-month') showMonth(event.target.value);
});
document.getElementById('app').addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.monthStep) return stepMonth(Number(button.dataset.monthStep));
  if (button.dataset.month) return showMonth(button.dataset.month);
  if (button.dataset.filter) {
    categoryFilter = button.dataset.filter; render();
    document.querySelector('[data-filter="'+categoryFilter+'"]')?.focus();
    return;
  }
  const id = button.dataset.id || '';
  switch (button.dataset.action) {
    case 'income': editIncome(); break;
    case 'expense': openExpenseForm(id); break;
    case 'category': openCategoryForm(id); break;
    case 'bill': openBillForm(id); break;
    case 'pay': payBill(id); break;
    case 'close-month': closeMonth(); break;
    case 'reset': resetTreasury(); break;
    case 'current': showMonth(S.month); break;
  }
});
window.projectMonth = projectMonth;
window.monthKey = monthKey;
window.totalSpent = totalSpent;
window.catSpent = catSpent;
window.setTheme = setTheme;
for (const breakpoint of [600,1100]) matchMedia('(min-width: '+breakpoint+'px)').addEventListener('change',()=>render());

setTheme(currentGlobalTheme('tavern'));
render();
window.PointyModuleCloud?.register({ key: TR_KEY, field: 'treasury', empty: () => ({ month: monthKey(new Date()), income: 0, keeper: {}, categories: [], bills: [], expenses: [], history: [], stats: {} }), apply: value => { S = normalizeTreasury(value); render(); } });
