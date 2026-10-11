import { addGuest, validateExpense } from './contracts.ts';
import { canon } from '../domain/canon.ts';
import type { Board, Expense } from './types';

export type ImportPreview = { expenses: Expense[]; guests: string[] };
export const spreadsheetExpense = canon.spreadsheetExpense;
// A file adds expenses; it never imports ownership, registry IDs or access permissions.
export function previewImport(rows: unknown[], board: Board, id: () => string): ImportPreview {
  if (!rows.length || rows.length > 500) throw new Error('ไฟล์ต้องมี 1–500 รายการ');
  let working = board; const guests: string[] = [];
  const expenses = rows.map((value, index) => {
    if (!value || typeof value !== 'object') throw new Error(`รายการ ${index + 1} อ่านไม่ได้`);
    const row = value as Expense;
    const names = [...new Set([row.paidBy, ...Object.keys(row.payers || {}), ...(row.sharedBy || [])].filter(Boolean))];
    for (const name of names) {
      if (typeof name !== 'string' || !name.trim() || name.length > 30 || ['__proto__', 'constructor', 'prototype'].includes(name)) throw new Error(`รายการ ${index + 1} มีชื่อสมาชิกไม่ถูกต้อง`);
      if (!working.participants.includes(name)) { working = addGuest(working, name, 'warrior', 'female'); guests.push(name); }
    }
    const expense: Expense = { id: id(), desc: String(row.desc || '').trim(), amount: Number(row.amount), paidBy: row.paidBy,
      sharedBy: row.sharedBy, icon: typeof row.icon === 'string' ? row.icon : 'coin',
      ...(row.payers ? { payers: row.payers } : {}), ...(row.split ? { split: row.split } : {}),
      ...(typeof row.date === 'string' ? { date: row.date } : {}),
      ...(typeof row.receipt === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(row.receipt) && row.receipt.length <= 350000 ? { receipt: row.receipt } : {}) };
    try { validateExpense(expense, working); } catch (error) { throw new Error(`รายการ ${index + 1}: ${(error as Error).message}`); }
    return expense;
  });
  return { expenses, guests };
}
export function applyImport(board: Board, preview: ImportPreview) {
  let current = board;
  for (const name of preview.guests) if (!current.participants.includes(name)) current = addGuest(current, name, 'warrior', 'female');
  for (const expense of preview.expenses) validateExpense(expense, current);
  return { ...current, expenses: [...current.expenses, ...preview.expenses.filter(e => !current.expenses.some(old => old.id === e.id))] };
}
export function textExpenses(text: string, payer: string, sharedBy: string[]): unknown[] {
  return text.split(/\r?\n/).filter(line => line.trim()).map((line, index) => {
    const match = line.match(/^(.+?)[,;\t]\s*(\d+(?:\.\d{1,2})?)\s*$/);
    if (!match) throw new Error(`บรรทัด ${index + 1}: ใช้รูปแบบ ชื่อรายการ,จำนวนเงิน`);
    return { desc: match[1].trim(), amount: Number(match[2]), paidBy: payer, sharedBy };
  });
}
