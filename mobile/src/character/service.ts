import { doc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../auth/firebase';
import { problem, readAccount, type Account } from '../auth/contracts';
import { prepareCharacter, readCharacter, type CharacterDraft } from './contracts';

export async function loadCharacter(account: Account) {
  const id = account.characterId || account.userId;
  const snapshot = await getDocFromServer(doc(db, 'characters', id));
  if (!snapshot.exists()) {
    if (account.characterId) throw problem('character/missing');
    return null;
  }
  return readCharacter(id, snapshot.data(), account);
}

export async function createCharacter(uid: string, draft: CharacterDraft) {
  if (auth.currentUser?.uid !== uid) throw problem('auth/user-token-expired');
  const now = Date.now();
  return runTransaction(db, async transaction => {
    const profileRef = doc(db, 'users', uid);
    const profile = await transaction.get(profileRef);
    if (!profile.exists()) throw problem('account/profile-invalid');
    const account = readAccount(uid, profile.data());
    const characterRef = doc(db, 'characters', account.characterId || account.userId);
    const lookupRef = doc(db, 'usernames', account.username);
    const reservationRef = doc(db, 'userIds', account.userId);
    const [character, lookup, reservation] = await Promise.all([transaction.get(characterRef), transaction.get(lookupRef), transaction.get(reservationRef)]);
    const result = prepareCharacter(account, draft, character.data(), lookup.data(), reservation.data(), now);
    if (auth.currentUser?.uid !== uid) throw problem('auth/user-token-expired');
    if (result.isNew) transaction.set(characterRef, result.record);
    const link = { characterId: result.character.id, updatedAt: serverTimestamp() };
    transaction.update(profileRef, { ...link, character: result.summary });
    transaction.update(lookupRef, link);
    transaction.update(reservationRef, link);
    return result.character;
  });
}
