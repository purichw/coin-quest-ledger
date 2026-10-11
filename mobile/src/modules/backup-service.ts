import { doc, getDocFromServer, runTransaction } from 'firebase/firestore';
import { File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../auth/firebase';
import { readAccount, type Account } from '../auth/contracts';
import { canon } from '../domain/canon';
import { withoutUndefined } from '../ledger/contracts';
import { makeId } from '../ledger/service';
import { normalizeModule } from './contracts';
import type { ModuleBackup } from './backup-contracts';
const keyOf = (value: unknown) => canon.tripContentKey(value || {});
export async function loadBackup(account: Account) {
  if (auth.currentUser?.uid !== account.uid) throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง');
  const snap = await getDocFromServer(doc(db, 'playerModules', account.uid)); const raw = snap.data() || {};
  const backup: ModuleBackup = { format: 'coin-quest-player-v1', uid: account.uid, savedAt: new Date().toISOString(), modules: { debt: normalizeModule('debt', raw.debt), treasury: normalizeModule('treasury', raw.treasury), comparisons: normalizeModule('comparisons', raw.comparisons) } };
  return { backup, baseline: keyOf(raw) };
}
export async function beforeRestoreFile(account: Account) { const uri = await AsyncStorage.getItem(`coinquest.before-restore.${account.uid}`); return uri && new File(uri).exists ? new File(uri) : null; }
export async function restoreBackup(account: Account, next: ModuleBackup, current: Awaited<ReturnType<typeof loadBackup>>) {
  if (next.uid !== account.uid) throw new Error('ไฟล์ไม่ใช่ของบัญชีนี้');
  const file = new File(Paths.document, `before-restore-${makeId()}.json`); file.create(); file.write(JSON.stringify(withoutUndefined(current.backup)));
  await AsyncStorage.setItem(`coinquest.before-restore.${account.uid}`, file.uri);
  await runTransaction(db, async tx => {
    if (auth.currentUser?.uid !== account.uid) throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง');
    const user = await tx.get(doc(db, 'users', account.uid)); const owner = readAccount(account.uid, user.data() || {});
    if (owner.characterId !== account.characterId) throw new Error('ตัวละครเปลี่ยน กรุณาโหลดใหม่');
    const ref = doc(db, 'playerModules', account.uid); const snap = await tx.get(ref);
    if (keyOf(snap.data()) !== current.baseline) throw new Error('ข้อมูลเปลี่ยนจากอีกเครื่อง กรุณาโหลดใหม่ก่อนกู้คืน');
    if (auth.currentUser?.uid !== account.uid) throw new Error('บัญชีเปลี่ยน กรุณาเปิดใหม่');
    tx.set(ref, withoutUndefined({ ...next.modules, uid: account.uid, characterId: account.characterId, schemaVersion: 2, updatedAt: Date.now() }), { mergeFields: ['uid', 'characterId', 'schemaVersion', 'debt', 'treasury', 'comparisons', 'updatedAt'] });
  });
}
