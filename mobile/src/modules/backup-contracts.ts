import { normalizeModule, validateOffer, validateISO } from './contracts.ts';
import type { Modules } from './types';
import { canon } from '../domain/canon.ts';
export type ModuleBackup = { format: 'coin-quest-player-v1'; uid: string; savedAt: string; modules: Modules };
export function parseBackup(text: string, uid: string): ModuleBackup {
  const raw = JSON.parse(text);
  if (raw?.format !== 'coin-quest-player-v1' || raw.uid !== uid || !raw.modules || typeof raw.savedAt !== 'string' || !Number.isFinite(Date.parse(raw.savedAt))) throw new Error('ใช้ไฟล์สำรอง Coin Quest ของบัญชีนี้เท่านั้น');
  for (const key of ['debt', 'treasury', 'comparisons']) if (!(key in raw.modules)) throw new Error('ไฟล์มีโมดูลไม่ครบ');
  for (const key of ['debt', 'treasury', 'comparisons']) canon.validateModuleBackupValue(key, raw.modules[key]);
  const unique = (rows: { id: string }[]) => { if (!Array.isArray(rows) || rows.some(r => typeof r.id !== 'string' || !r.id) || new Set(rows.map(r => r.id)).size !== rows.length) throw new Error('รหัสรายการในไฟล์ไม่ครบหรือซ้ำกัน'); };
  const amount = (value: number) => { if (!Number.isFinite(value) || value < 0) throw new Error('ยอดเงินในไฟล์ไม่ถูกต้อง'); };
  // Validate before legacy normalizers can clamp negative money or drop offers.
  if (!raw.modules.debt || !raw.modules.treasury) throw new Error('ไฟล์มีโมดูลไม่ครบ');
  const debt = raw.modules.debt as Modules['debt']; unique(debt.dragons);
  debt.dragons.forEach(d => { [d.balance, d.original, d.apr, d.payment].forEach(amount); unique(d.log); d.log.forEach(l => amount(l.amount)); });
  const comparisons = raw.modules.comparisons as Modules['comparisons']; unique(comparisons);
  comparisons.forEach(c => { unique(c.offers); c.offers.forEach(o => validateOffer(o, c)); });
  const modules: Modules = { debt: normalizeModule('debt', debt), treasury: normalizeModule('treasury', raw.modules.treasury), comparisons: normalizeModule('comparisons', comparisons) };
  unique(modules.debt.dragons);
  modules.debt.dragons.forEach(d => { [d.balance, d.original, d.apr, d.payment].forEach(amount); unique(d.log); d.log.forEach(l => { amount(l.amount); if (!Number.isFinite(l.ts) || l.ts <= 0) validateISO(l.date); }); });
  const t = modules.treasury; amount(t.income); unique(t.categories); unique(t.bills); unique(t.expenses);
  t.categories.forEach(c => amount(c.budget)); t.bills.forEach(b => amount(b.amount)); t.expenses.forEach(e => { amount(e.amount); validateISO(e.date); if (!t.categories.some(c => c.id === e.catId)) throw new Error('รายจ่ายไม่มีหมวดที่อ้างอิง'); });
  unique(modules.comparisons); modules.comparisons.forEach(c => { unique(c.offers); c.offers.forEach(o => validateOffer(o, c)); });
  return { format: 'coin-quest-player-v1', uid, savedAt: raw.savedAt, modules };
}
