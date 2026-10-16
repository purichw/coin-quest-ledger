import { canon } from '../domain/canon.ts';
import type { Account } from '../auth/contracts';
import type { Character } from '../character/contracts';
import type { Board, Campaign, Expense, Invite } from './types';

export function readBoard(data: Record<string, unknown>): Board {
  const normalized = canon.normalizeTripState(data);
  const original = Array.isArray(data.expenses) ? data.expenses : [];
  if (normalized.expenses.length !== original.length) throw new Error('บอร์ดมีรายการที่อ่านไม่ได้ กรุณาตรวจข้อมูลบนเว็บก่อนแก้ไข');
  if (Array.isArray(data.campaigns) && data.campaigns.some((c, i) => Array.isArray(c.expenses) && normalized.campaigns[i].expenses.length !== c.expenses.length)) throw new Error('ประวัติแคมเปญมีรายการที่อ่านไม่ได้ กรุณาตรวจข้อมูลก่อนแก้ไข');
  return { ...data, ...normalized,
    admin: { ...(data.admin as Board['admin'] || {}), ...normalized.admin },
    expenses: normalized.expenses.map((e, i) => ({ ...original[i], ...e })),
    campaigns: normalized.campaigns.map((c, i) => ({ ...((data.campaigns as Campaign[] || [])[i]), ...c })),
  } as Board;
}

export function memberName(board: Board, characterId: string) {
  return board.participants.find(name => board.characterIds[name] === characterId && !board.guestHeroes[name]);
}
export function confirmBoardRepayment(board: Board, displayed: Board, from: string, to: string, amount: number, now = Date.now()): Board {
  const pending = canon.pendingSettlements(board).find(t => t.from === from && t.to === to);
  if (canon.settlementRevision(board) !== canon.settlementRevision(displayed) || !pending || Math.round(pending.amount * 100) !== Math.round(amount * 100)) throw new Error('ยอดเปลี่ยนจากอีกเครื่อง กรุณารีเฟรชก่อนยืนยัน');
  return canon.confirmSettlement(board, from, to, now);
}
export function parseBoardReference(input: string) {
  let value = input.trim();
  if (/^https?:\/\//i.test(value)) { const url = new URL(value); if (!['coinquestledger.vercel.app', 'localhost', '127.0.0.1'].includes(url.hostname) || !/^\/trip\/?$/.test(url.pathname)) throw new Error('ใช้ลิงก์บอร์ด Coin Quest'); value = url.searchParams.get('id') || ''; }
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(value)) throw new Error('รหัสหรือลิงก์บอร์ดไม่ถูกต้อง'); return value;
}
export function removeMember(board: Board, name: string, actorId: string): Board {
  if (!board.participants.includes(name)) throw new Error('สมาชิกนี้ไม่ได้อยู่ในแคมเปญแล้ว');
  if (board.characterIds[name] === actorId || board.characterIds[name] === board.admin.characterId) throw new Error('นำตัวละครของคุณหรือเจ้าของบอร์ดออกไม่ได้');
  const referenced = [...board.expenses, ...(board.expenseTrash || [])].some(e => e.paidBy === name || e.sharedBy.includes(name) || name in (e.payers || {}));
  if (referenced || board.settlementRecords?.some(t => t.from === name || t.to === name)) throw new Error('สมาชิกนี้มีรายการเงินอ้างอิงอยู่ ใช้แคมเปญใหม่เพื่อเปลี่ยนปาร์ตี้โดยรักษาประวัติเดิม');
  return { ...board, participants: board.participants.filter(n => n !== name), removedMembers: [...new Set([...(Array.isArray(board.removedMembers) ? board.removedMembers as string[] : []), name])] };
}
export function restoreMember(board: Board, name: string): Board {
  const removed = Array.isArray(board.removedMembers) ? board.removedMembers as string[] : [];
  if (!removed.includes(name)) throw new Error('ไม่พบสมาชิกที่เก็บไว้');
  return { ...board, participants: [...new Set([...board.participants, name])], removedMembers: removed.filter(n => n !== name) };
}
export function ownsBoard(board: Board, account: Account) {
  return !!board.access?.ownerUids?.includes(account.uid) || !!(account.characterId && board.admin.characterId === account.characterId);
}
export function localName(board: Board, name: string) {
  let result = name; let suffix = 2;
  while (board.participants.includes(result) || ['__proto__', 'constructor', 'prototype'].includes(result)) result = `${name} (${suffix++})`;
  return result;
}
export function addHero(board: Board, hero: Character, ownerUid: string) {
  if (memberName(board, hero.id)) return board;
  const name = localName(board, hero.name);
  return { ...board, participants: [...board.participants, name],
    characterIds: { ...board.characterIds, [name]: hero.id },
    heroClasses: { ...board.heroClasses, [name]: hero.classId },
    heroGenders: { ...board.heroGenders, [name]: hero.gender },
    heroSkins: { ...board.heroSkins, [name]: hero.skin },
    budgets: { ...board.budgets, [name]: 3000 },
    access: { ...board.access, visibility: board.access?.visibility || 'authenticated',
      ownerUids: board.access?.ownerUids || [], memberUids: [...new Set([...(board.access?.memberUids || []), ownerUid])],
      memberCharacterIds: [...new Set([...Object.values(board.characterIds), hero.id])], updatedAt: Date.now() },
  };
}
export function addGuest(board: Board, name: string, classId: string, gender: string) {
  if (!name.trim() || name.trim().length > 30) throw new Error('ใส่ชื่อผู้ร่วมทางไม่เกิน 30 ตัวอักษร');
  const key = localName(board, name.trim());
  return { ...board, participants: [...board.participants, key], guestHeroes: { ...board.guestHeroes, [key]: true },
    heroClasses: { ...board.heroClasses, [key]: classId }, heroGenders: { ...board.heroGenders, [key]: gender },
    budgets: { ...board.budgets, [key]: 3000 } };
}
export function syncCampaign(board: Board, now: number): Board {
  const id = board.activeCampaignId || `camp-${now}`;
  const existing = board.campaigns.find(c => c.id === id);
  const snapshot: Campaign = { ...existing, id, tripName: board.tripName, participants: board.participants,
    expenses: board.expenses, budgets: board.budgets, heroClasses: board.heroClasses, heroGenders: board.heroGenders,
    heroSkins: board.heroSkins, characterIds: board.characterIds, guestHeroes: board.guestHeroes,
    promptpay: board.promptpay, settleXp: board.settleXp, settlementRecords: board.settlementRecords || [], expenseTrash: board.expenseTrash || [], removedMembers: board.removedMembers || [], createdAt: existing?.createdAt || now, completedAt: existing?.completedAt || null };
  return { ...board, activeCampaignId: id, campaigns: [snapshot, ...board.campaigns.filter(c => c.id !== id)] };
}
export function switchCampaign(board: Board, id: string, now: number): Board {
  const synced = syncCampaign(board, now);
  const selected = synced.campaigns.find(c => c.id === id);
  if (!selected) throw new Error('ไม่พบแคมเปญ');
  const { id: activeCampaignId, createdAt, completedAt, ...state } = selected;
  void createdAt; void completedAt;
  return { ...synced, ...state, activeCampaignId, expenseTrash: state.expenseTrash || [], removedMembers: state.removedMembers || [], settlementRecords: state.settlementRecords || [] };
}
export function editGuest(board: Board, oldName: string, name: string, classId: string, gender: string, skin = ''): Board {
  name = name.trim();
  if (!board.guestHeroes[oldName] || !board.participants.includes(oldName)) throw new Error('Guest นี้เปลี่ยนไปแล้ว กรุณาโหลดใหม่');
  if (!name || name.length > 30 || ['__proto__', 'constructor', 'prototype'].includes(name) || (name !== oldName && board.participants.includes(name))) throw new Error('ใช้ชื่อที่ไม่ซ้ำกับสมาชิก 1–30 ตัวอักษร');
  const rename = (n: string) => n === oldName ? name : n;
  const map = <T,>(value: Record<string, T>) => Object.fromEntries(Object.entries(value || {}).map(([k, v]) => [rename(k), v]));
  const expense = (e: Expense): Expense => ({ ...e, paidBy: rename(e.paidBy), sharedBy: e.sharedBy.map(rename), ...(e.payers ? { payers: map(e.payers) } : {}), ...(e.split ? { split: { ...e.split, ...(e.split.weights ? { weights: map(e.split.weights) } : {}), ...(e.split.items ? { items: e.split.items.map(item => ({ ...item, claimedBy: item.claimedBy.map(rename) })) } : {}) } } : {}) });
  return { ...board, participants: board.participants.map(rename), expenses: board.expenses.map(expense), expenseTrash: board.expenseTrash?.map(expense), budgets: map(board.budgets), guestHeroes: map(board.guestHeroes), characterIds: map(board.characterIds), promptpay: map(board.promptpay), settleXp: map(board.settleXp), heroClasses: { ...map(board.heroClasses), [name]: classId }, heroGenders: { ...map(board.heroGenders), [name]: gender }, heroSkins: { ...map(board.heroSkins), [name]: skin }, settlementRecords: board.settlementRecords?.map(t => ({ ...t, from: rename(t.from), to: rename(t.to) })) };
}
export function freshBoard(account: Account, hero: Character, name: string, now: number): Board {
  if (!name.trim() || name.trim().length > 80) throw new Error('ใส่ชื่อบอร์ด 1–80 ตัวอักษร');
  const board = readBoard({ tripName: name.trim(), participants: [], expenses: [], campaigns: [],
    admin: { adminId: account.userId, adminName: account.name, characterId: hero.id, ownerHash: '', passwordHash: '', createdAt: now, urlLocked: true },
    access: { visibility: 'authenticated', ownerUids: [account.uid], memberUids: [], memberCharacterIds: [], updatedAt: now } });
  return syncCampaign(addHero(board, hero, account.uid), now);
}
export function validateExpense(expense: Expense, board: Board) {
  canon.validateLedgerExpense(expense, board.participants);
}
export function acceptInvite(board: Board, invite: Invite, account: Account, hero: Character, now: number) {
  if (invite.targetOwnerUid !== account.uid || invite.targetCharacterId !== hero.id) throw new Error('คำเชิญนี้ไม่ใช่ของบัญชีคุณ');
  if (invite.status !== 'pending' || invite.expiresAt <= now) throw new Error('คำเชิญหมดอายุหรือได้รับการตอบแล้ว');
  return addHero(board, hero, account.uid);
}
export function withoutUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withoutUndefined) as T;
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).map(([k, v]) => [k, withoutUndefined(v)])) as T;
  return value;
}
