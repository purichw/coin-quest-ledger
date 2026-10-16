import { canon } from '../domain/canon.ts';
import type { Comparison, Dragon, ModuleKey, Modules, Offer, Treasury, TreasuryExpense } from './types';

export const monthKey = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
export function emptyTreasury(now = new Date()): Treasury {
  return { month: monthKey(now), income: 0, keeper: {}, categories: [], bills: [], expenses: [], history: [], stats: { monthsWon: 0, logged: 0, onTime: 0 } };
}
export function normalizeModule<K extends ModuleKey>(key: K, value: unknown): Modules[K] {
  if (key === 'debt') { const raw = (value || {}) as Partial<Modules['debt']>; return canon.normalizeDebtState({ ...raw, dragons: raw.dragons || [], stats: raw.stats || { interest: 0 }, strategy: raw.strategy || 'avalanche' }) as Modules[K]; }
  if (key === 'comparisons') {
    if (value !== undefined && value !== null && !Array.isArray(value)) throw new Error('ข้อมูลเปรียบเทียบราคาอ่านไม่ได้');
    const raw = (value || []) as Comparison[];
    const normalized = raw.map(canon.normalizeComparison);
    if (raw.some((c, i) => Array.isArray(c.offers) && c.offers.length !== normalized[i].offers.length)) throw new Error('มีข้อเสนอราคาที่อ่านไม่ได้ กรุณาตรวจข้อมูลบนเว็บก่อนแก้ไข');
    return normalized as Modules[K];
  }
  const raw = (value || {}) as Partial<Treasury>; const fresh = emptyTreasury();
  const categories = raw.categories || [];
  // Older native records used name/category instead of note/catId.
  const expenses = (raw.expenses || []).map(e => ({ ...e, note: String(e.note ?? e.name ?? ''), catId: String(e.catId ?? e.category ?? '') }));
  return { ...fresh, ...raw, categories, expenses, bills: raw.bills || [], history: raw.history || [], stats: { ...fresh.stats, ...raw.stats } } as Modules[K];
}
export function validateDragon(d: Dragon, previous?: Dragon) {
  const name = typeof d.name === 'string' ? d.name : d.name.th;
  if (!name.trim() || name.length > 80) throw new Error('ใส่ชื่อหนี้ 1–80 ตัวอักษร');
  if (!['reducing', 'compound', 'simple'].includes(d.interestMode)) throw new Error('เลือกวิธีคิดดอกเบี้ย');
  if (![d.balance, d.original, d.apr, d.payment].every(n => Number.isFinite(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER / 100)) throw new Error('ตรวจยอดคงเหลือ เงินต้น ดอกเบี้ย และยอดผ่อน');
  // Interest may exceed principal and produce sub-satang precision. Preserve it
  // when unchanged; newly entered monetary amounts still require two decimals.
  if (!previous || d.balance !== previous.balance) canon.validateNumber(d.balance, { label: 'ยอดคงเหลือ' });
  [d.original, d.payment].forEach(n => canon.validateNumber(n, { label: 'จำนวนเงิน' }));
  canon.validateNumber(d.apr, { label: 'ดอกเบี้ย', decimals: 4 });
  if (d.payMode === 'monthly' && (!(d.payment > 0) || !Number.isInteger(d.dueDay) || d.dueDay < 1 || d.dueDay > 31)) throw new Error('ระบุยอดผ่อนและวันครบกำหนด 1–31');
}
export function validateISO(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error('วันที่ไม่ถูกต้อง');
}
export function payDragon(d: Dragon, amount: number, date: string, id: string, now = Date.now()) {
  validateISO(date);
  if (d.log.some(row => row.id === id)) return { debt: d, interest: 0 };
  const day = canon.dateOnlyMs(date);
  if (day < canon.dateOnlyMs(Math.max(d.createdAt, d.interestAccruedAt)) || day > canon.dateOnlyMs(now)) throw new Error('วันที่จ่ายต้องไม่ก่อนวันที่คิดดอกเบี้ยล่าสุด และไม่อยู่ในอนาคต');
  if (!Number.isFinite(amount) || amount <= 0 || d.slain) throw new Error('ใส่ยอดจ่ายมากกว่า 0 สำหรับหนี้ที่ยังไม่ปิด');
  canon.validateNumber(amount, { label: 'ยอดชำระ', min: .01 });
  const result = canon.applyDebtPayment(d, amount, date);
  if (amount > result.balanceBefore + .005) throw new Error('ยอดจ่ายมากกว่ายอดหนี้รวมดอกเบี้ย ณ วันที่เลือก');
  return { debt: { ...result.debt, log: [...d.log, { id, date, ts: day, amount: result.applied, interest: result.interestPaid, principal: result.principalPaid, accruedInterest: result.interest, balanceBefore: result.balanceBefore, balanceAfter: result.balanceAfter, days: result.days, move: 'projectile' }] }, interest: result.interest };
}
export function editDebtLog(d: Dragon, id: string, amount: number, date: string, remove = false) {
  if (!remove) validateISO(date);
  if (!remove) canon.validateNumber(amount, { label: 'ยอดชำระ', min: .01 });
  return canon.reviseDebtLog(d, { id, amount, date, remove }) as Dragon;
}
export function restoreDebtLog(d: Dragon, id: string) {
  return canon.reviseDebtLog(d, { id, restore: true }) as Dragon;
}
export function saveTreasuryExpense(state: Treasury, entry: TreasuryExpense) {
  validateISO(entry.date);
  if (entry.date.slice(0, 7) !== state.month) throw new Error('เลือกรายจ่ายในเดือนที่เปิดอยู่');
  if (!Number.isFinite(entry.amount) || entry.amount <= 0) throw new Error('จำนวนเงินต้องมากกว่า 0');
  canon.validateNumber(entry.amount, { label: 'รายจ่าย', min: .01 });
  if (!state.categories.some(c => c.id === entry.catId)) throw new Error('เลือกหมวดรายจ่าย');
  if (!entry.note.trim() || entry.note.length > 120) throw new Error('ใส่รายละเอียด 1–120 ตัวอักษร');
  const existing = state.expenses.find(e => e.id === entry.id);
  if (entry.billId && state.expenses.some(e => e.billId === entry.billId && e.id !== entry.id)) throw new Error('บิลนี้บันทึกว่าจ่ายแล้วในเดือนนี้');
  return { ...state, expenses: existing ? state.expenses.map(e => e.id === entry.id ? { ...e, ...entry } : e) : [...state.expenses, entry], stats: { ...state.stats, logged: state.stats.logged + (existing ? 0 : 1), onTime: state.stats.onTime - (existing?.onTime ? 1 : 0) + (entry.onTime ? 1 : 0) } };
}
export function removeTreasuryExpense(state: Treasury, id: string) {
  const entry = state.expenses.find(e => e.id === id); if (!entry) throw new Error('รายการนี้เปลี่ยนไปแล้ว');
  return { ...state, expenses: state.expenses.filter(e => e.id !== id), expenseTrash: [...(state.expenseTrash || []), entry], stats: { ...state.stats, logged: Math.max(0, state.stats.logged - 1), onTime: Math.max(0, state.stats.onTime - (entry.onTime ? 1 : 0)) } };
}
export function archiveTreasuryCategory(state: Treasury, id: string) {
  const category = state.categories.find(c => c.id === id); if (!category) throw new Error('ไม่พบหมวดนี้');
  if ([...state.expenses, ...(state.expenseTrash || []), ...state.bills].some(e => e.catId === id)) throw new Error('หมวดนี้ยังมีรายจ่ายหรือบิลอ้างอิง ย้ายรายการไปหมวดอื่นก่อนเก็บหมวด');
  return { ...state, categories: state.categories.filter(c => c.id !== id), categoryTrash: [...(state.categoryTrash || []), category] };
}
export function validateOffer(offer: Offer, comparison: Comparison) {
  canon.validateOfferInput(offer, comparison);
  if (!offer.merchant.trim() || offer.merchant.length > 100) throw new Error('ใส่ชื่อร้านหรือตัวเลือก 1–100 ตัวอักษร');
  if (![offer.price, offer.qty, offer.perPack, offer.buy, offer.free].every(Number.isFinite) || offer.price <= 0 || offer.qty <= 0) throw new Error('ราคาและปริมาณต้องมากกว่า 0');
  if (!Number.isInteger(offer.buy) || offer.buy < 1 || !Number.isInteger(offer.free) || offer.free < 0) throw new Error('โปรโมชั่นต้องเป็นจำนวนเต็ม ซื้ออย่างน้อย 1 และแถมตั้งแต่ 0');
  if (!canon.normalizedOffer(offer, comparison).valid) throw new Error('ตรวจหน่วยและจำนวนชิ้นต่อแพ็คให้เข้ากับสินค้านี้');
}
