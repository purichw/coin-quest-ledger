import { canon } from '../domain/canon.ts';
import type { BoardRow } from '../ledger/types';
import { label, type Modules } from '../modules/types.ts';
export type Reminder = { id: string; title: string; detail: string; route: '/debt/dragon' | '/treasury/edit' | '/split/board'; params: Record<string, string>; rank: number };
export function financialReminders(modules: Modules, boards: BoardRow[], characterId: string, date = new Date()) {
  const result: Reminder[] = []; const year = date.getFullYear(); const month = date.getMonth(); const day = date.getDate();
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`; const start = new Date(year, month, day).getTime();
  const dueText = (days: number) => days < 0 ? `เลยกำหนด ${-days} วัน` : days === 0 ? 'ครบกำหนดวันนี้' : `ครบกำหนดอีก ${days} วัน`;
  modules.debt.dragons.filter(d => !d.archived && !d.slain && d.payMode === 'monthly' && d.dueDay > 0).forEach(d => {
    const paid = d.log.some(row => { const time = new Date(row.ts || row.date); return time.getFullYear() === year && time.getMonth() === month; });
    const offset = paid ? 1 : 0; const due = new Date(year, month + offset, Math.min(d.dueDay, new Date(year, month + offset + 1, 0).getDate())); const days = Math.round((due.getTime() - start) / 86400000);
    if (days <= 5) result.push({ id: `debt:${d.id}`, title: label(d.name), detail: `${dueText(days)} · ยอดผ่อน ฿${d.payment.toLocaleString()}`, route: '/debt/dragon', params: { id: d.id }, rank: days });
  });
  const treasury = modules.treasury;
  if (treasury.month === monthKey) treasury.bills.filter(b => !b.archived && !canon.treasuryBillPaid(treasury, b.id)).forEach(b => {
    const days = Math.min(b.dueDay, new Date(year, month + 1, 0).getDate()) - day;
    if (days <= 5) result.push({ id: `bill:${b.id}`, title: label(b.name), detail: `${dueText(days)} · ฿${b.amount.toLocaleString()}`, route: '/treasury/edit', params: { kind: 'expense', billId: b.id }, rank: days });
  });
  boards.filter(b => !b.data.archived).forEach(b => {
    const names = Object.keys(b.data.characterIds).filter(name => b.data.characterIds[name] === characterId); const pending = canon.pendingSettlements(b.data).filter(t => names.includes(t.from) || names.includes(t.to));
    if (pending.length) result.push({ id: `board:${b.id}`, title: b.data.tripName, detail: `ยอดระหว่างเพื่อนที่ยังไม่ยืนยัน ${pending.length} รายการ`, route: '/split/board', params: { id: b.id }, rank: 99 });
  });
  return result.sort((a, b) => a.rank - b.rank);
}
