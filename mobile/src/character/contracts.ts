import type { Account } from '../auth/contracts';
import { isBlocked, problem } from '../auth/contracts.ts';
import { classes, normalizeClass, type ClassId, type Gender } from './catalog.ts';

export type CharacterDraft = { name: string; classId: ClassId | ''; gender: Gender };
export type Character = { id: string; name: string; classId: ClassId; gender: Gender; skin: string; xp: number | null };
type RecordData = Record<string, unknown>;

export function validateCharacter(draft: CharacterDraft) {
  if (!draft.name.trim()) return 'ตั้งชื่อตัวละครก่อนนะ';
  if (draft.name.trim().length > 30) return 'ชื่อตัวละครยาวได้ไม่เกิน 30 ตัวอักษร';
  if (!classes.some(item => item.id === draft.classId)) return 'เลือกอาชีพให้ตัวละครก่อนนะ';
  if (!['female', 'male'].includes(draft.gender)) return 'เลือกรูปลักษณ์ของตัวละคร';
  return '';
}

export function readCharacter(id: string, data: RecordData, account: Account): Character {
  if (!/^\d{4}$/.test(id) || data.id !== id || data.ownerUid !== account.uid || (data.userId && data.userId !== account.userId)) throw problem('character/identity-conflict');
  const xp = typeof data.xp === 'number' && Number.isFinite(data.xp) && data.xp >= 0 ? Math.round(data.xp) : null;
  return { id, name: String(data.name || account.name), classId: normalizeClass(data.class || data.cls || 'warrior'), gender: data.gender === 'female' ? 'female' : 'male', skin: String(data.skin || ''), xp };
}

// Called with fresh transaction reads. A repeated submission returns the first
// saved character and never resets its name, appearance, timestamps or XP.
export function prepareCharacter(account: Account, draft: CharacterDraft, existing: RecordData | undefined, lookup: RecordData | undefined, reservation: RecordData | undefined, now: number) {
  if (validateCharacter(draft)) throw problem('character/invalid');
  if (lookup?.uid !== account.uid || lookup.userId !== account.userId || reservation?.uid !== account.uid || reservation.userId !== account.userId) throw problem('character/identity-conflict');
  if (isBlocked(lookup) || isBlocked(reservation)) throw problem('account/blocked');
  const id = account.characterId || account.userId;
  for (const pointer of [lookup.characterId, reservation.characterId]) {
    if (pointer && pointer !== id) throw problem('character/identity-conflict');
  }
  if (!existing && (account.characterId || lookup.characterId || reservation.characterId)) throw problem('character/missing');
  const record = existing || {
    id, name: draft.name.trim(), class: draft.classId, cls: draft.classId,
    gender: draft.gender, skin: '', ownerUid: account.uid, userId: account.userId,
    username: account.username, accountName: account.name, xp: 0,
    createdAt: now, updatedAt: now,
  };
  const character = readCharacter(id, record, account);
  const summary = { id, name: character.name, class: character.classId, cls: character.classId, gender: character.gender, skin: character.skin };
  return { isNew: !existing, record, summary, character };
}
