import { collection, doc, getDocFromServer, getDocsFromServer } from 'firebase/firestore';
import { auth, db } from '../auth/firebase';
import { canon } from '../domain/canon';
import { buildPublicProfile, publicCharacterId } from './public-profile-contracts';

// Match the web profile's signed-in read boundary. This loader intentionally
// has no owner profile refresh, private account/module read or write operation.
export async function loadPublicProfile(value: string, viewerUid: string) {
  const id = publicCharacterId(value);
  const checkSession = () => { if (!viewerUid || auth.currentUser?.uid !== viewerUid) throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง'); };
  checkSession();
  const character = await getDocFromServer(doc(db, 'characters', id));
  checkSession();
  if (!character.exists()) throw new Error('ไม่พบตัวละครนี้');
  const trips = await getDocsFromServer(collection(db, 'trips'));
  checkSession();
  const boards = trips.docs.map(row => ({ id: row.id, data: canon.normalizeTripState(row.data()) }));
  return buildPublicProfile(id, character.data(), boards);
}
