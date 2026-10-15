import { canon } from '../domain/canon.ts';
import type { BoardRow } from '../ledger/types';
import { normalizeClass } from './catalog.ts';
import type { Character } from './contracts';

export function profileTarget(value: unknown, ownId: string) {
  if (value === undefined || value === ownId) return { kind: 'own' } as const;
  if (typeof value !== 'string' || value.length !== 4 || !/^\d{4}$/.test(value)) return { kind: 'invalid' } as const;
  return { kind: 'public', id: value } as const;
}

export function publicCharacterId(value: unknown): string {
  if (typeof value !== 'string' || value.length !== 4 || !/^\d{4}$/.test(value)) throw new Error('ใช้ Character ID 4 หลัก');
  return value;
}

export function buildPublicProfile(id: string, record: Record<string, unknown> | undefined, boards: BoardRow[]) {
  publicCharacterId(id);
  if (!record || typeof record.name !== 'string' || !record.name.trim() || (record.id !== undefined && record.id !== id)) throw new Error('ไม่พบตัวละครนี้');
  const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
  const trips = record.trips && typeof record.trips === 'object' && !Array.isArray(record.trips)
    ? Object.fromEntries(Object.entries(record.trips).map(([key, value]) => [key, number(value)])) : {};
  // A public character document can contain owner/account metadata. Only the
  // fields already displayed by the web public profile reach this view model.
  const publicRecord = { id, name: record.name, class: normalizeClass(record.class || record.cls),
    gender: record.gender === 'female' ? 'female' : 'male', skin: String(record.skin || ''),
    xp: number(record.xp), debtXp: number(record.debtXp), trips, createdAt: record.createdAt, updatedAt: record.updatedAt };
  const profile = canon.buildCharacterProfile(id, boards, publicRecord);
  const hero: Character = { id, name: profile.displayName, classId: publicRecord.class, gender: publicRecord.gender === 'female' ? 'female' : 'male', skin: publicRecord.skin, xp: profile.xp };
  return { hero, profile };
}
