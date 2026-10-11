import { doc, getDocFromServer, runTransaction } from 'firebase/firestore';
import { auth, db } from '../auth/firebase';
import { readAccount, type Account } from '../auth/contracts';
import { readCharacter } from '../character/contracts';
import { canon } from '../domain/canon';
import { withoutUndefined } from '../ledger/contracts';
import { normalizeModule } from './contracts';
import type { ModuleKey, Modules, ModuleSnapshot } from './types';

const keyOf = (value: unknown) => canon.tripContentKey({ value: value ?? null });
export async function loadModule<K extends ModuleKey>(key: K, account: Account): Promise<ModuleSnapshot<K>> {
  if (auth.currentUser?.uid !== account.uid) throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง');
  const snap = await getDocFromServer(doc(db, 'playerModules', account.uid)); const raw = snap.data()?.[key];
  return { data: normalizeModule(key, raw), baseline: keyOf(raw) };
}
export async function changeModule<K extends ModuleKey>(key: K, account: Account, snapshot: ModuleSnapshot<K>, change: (data: Modules[K]) => Modules[K]): Promise<ModuleSnapshot<K>> {
  return runTransaction(db, async tx => {
    if (auth.currentUser?.uid !== account.uid) throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง');
    const user = await tx.get(doc(db, 'users', account.uid)); const current = readAccount(account.uid, user.data() || {});
    if (current.characterId !== account.characterId) throw new Error('บัญชีเปลี่ยน กรุณาเปิดใหม่');
    const ref = doc(db, 'playerModules', account.uid); const snap = await tx.get(ref); const raw = snap.data()?.[key];
    if (snapshot.baseline !== keyOf(raw)) throw new Error('ข้อมูลเปลี่ยนจากเว็บหรืออีกเครื่อง กรุณาโหลดใหม่ก่อนบันทึก');
    const character = await tx.get(doc(db, 'characters', current.characterId));
    const hero = readCharacter(current.characterId, character.data() || {}, current);
    const next = withoutUndefined(change(normalizeModule(key, raw)));
    const identity = { name: hero.name, characterId: hero.id, class: hero.classId, gender: hero.gender, skin: hero.skin };
    if (key === 'debt') Object.assign(next, { slayer: { ...(next as Modules['debt']).slayer, ...identity } });
    if (key === 'treasury') Object.assign(next, { keeper: { ...(next as Modules['treasury']).keeper, ...identity } });
    if (auth.currentUser?.uid !== account.uid) throw new Error('บัญชีเปลี่ยน กรุณาเปิดใหม่');
    tx.set(ref, { uid: account.uid, characterId: account.characterId, schemaVersion: 2, [key]: next, updatedAt: Date.now() }, { mergeFields: ['uid', 'characterId', 'schemaVersion', key, 'updatedAt'] });
    return { data: next, baseline: keyOf(next) };
  });
}
