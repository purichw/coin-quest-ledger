import { useCallback, useEffect, useRef } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { auth, db } from '../auth/firebase';
import { readAccount, type Account } from '../auth/contracts';
import { canon } from '../domain/canon';
import { readBoard, withoutUndefined } from '../ledger/contracts';
import { listBoards } from '../ledger/service';
import { normalizeModule } from '../modules/contracts';
import { useLoad } from '../player/ui';
import { readCharacter, validateCharacter, type CharacterDraft } from './contracts';
import { skinOptions } from './skins';

export async function loadPlayerProfile(account: Account) {
  const candidates = await listBoards(account);
  return runTransaction(db, async tx => {
    if (auth.currentUser?.uid !== account.uid) throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง');
    const userRef = doc(db, 'users', account.uid); const user = await tx.get(userRef); const current = readAccount(account.uid, user.data() || {});
    if (current.characterId !== account.characterId) throw new Error('ตัวละครเปลี่ยน กรุณาเปิดบัญชีใหม่');
    const characterRef = doc(db, 'characters', current.characterId); const character = await tx.get(characterRef); const raw = character.data() || {}; readCharacter(current.characterId, raw, current);
    const moduleDoc = await tx.get(doc(db, 'playerModules', account.uid)); const modules = { debt: normalizeModule('debt', moduleDoc.data()?.debt), treasury: normalizeModule('treasury', moduleDoc.data()?.treasury), comparisons: normalizeModule('comparisons', moduleDoc.data()?.comparisons) };
    const documents = await Promise.all(candidates.map(row => tx.get(doc(db, 'trips', row.id))));
    const boards = documents.filter(d => d.exists()).map(d => ({ id: d.id, data: readBoard(d.data()) }));
    const trips: Record<string, number> = { ...(raw.trips || {}) };
    boards.forEach(board => { const names = Object.keys(board.data.characterIds).filter(n => board.data.characterIds[n] === current.characterId && !board.data.guestHeroes[n]); trips[board.id] = canon.computeParty(board.data).filter(h => names.includes(h.name)).reduce((sum, h) => sum + h.xp, 0); });
    const debtXp = moduleDoc.data()?.debt === undefined ? Number(raw.debtXp) || 0 : canon.slayerXpFrom(modules.debt.dragons); const xp = Math.round(Object.values(trips).reduce((sum, n) => sum + (Number(n) || 0), 0) + debtXp);
    const record = { ...raw, trips, debtXp, xp }; const activity = canon.nextActivity(user.data()?.activity || {}, new Date());
    if (canon.tripContentKey({ trips, debtXp, xp }) !== canon.tripContentKey({ trips: raw.trips, debtXp: raw.debtXp, xp: raw.xp })) tx.set(characterRef, { trips, debtXp, xp, updatedAt: Date.now() }, { merge: true });
    if (canon.tripContentKey(activity) !== canon.tripContentKey(user.data()?.activity || {})) tx.set(userRef, { activity }, { merge: true });
    const hero = readCharacter(current.characterId, record, current);
    return { hero, boards, modules, activity, profile: canon.buildCharacterProfile(hero.id, boards, record), progress: canon.playerProgress(boards, hero, modules, { streak: activity.streak, accountName: current.name }) };
  });
}
export function usePlayerProfile(account: Account) {
  const latest = useRef(account); useEffect(() => { latest.current = account; }, [account]); const identity = `${account.uid}:${account.characterId}`;
  return useLoad(useCallback(() => { void identity; return loadPlayerProfile(latest.current); }, [identity]));
}
export async function editCharacter(account: Account, draft: CharacterDraft & { skin: string }) {
  const error = validateCharacter(draft); if (error) throw new Error(error);
  if (!skinOptions(String(draft.classId), draft.gender).some(s => s.id === draft.skin)) throw new Error('เลือกรูปลักษณ์ที่ตรงกับอาชีพ');
  return runTransaction(db, async tx => {
    if (auth.currentUser?.uid !== account.uid) throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง');
    const userRef = doc(db, 'users', account.uid); const user = await tx.get(userRef); const current = readAccount(account.uid, user.data() || {});
    if (current.characterId !== account.characterId) throw new Error('ตัวละครเปลี่ยน กรุณาเปิดบัญชีใหม่');
    const ref = doc(db, 'characters', current.characterId); const existing = await tx.get(ref); const old = existing.data() || {}; readCharacter(current.characterId, old, current);
    const summary = { id: current.characterId, name: draft.name.trim(), class: draft.classId, cls: draft.classId, gender: draft.gender, skin: draft.skin };
    tx.set(ref, withoutUndefined({ ...old, ...summary, updatedAt: Date.now() }), { merge: true });
    tx.set(userRef, { character: summary, updatedAt: Date.now() }, { merge: true });
    return readCharacter(current.characterId, { ...old, ...summary }, current);
  });
}
