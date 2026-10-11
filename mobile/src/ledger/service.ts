import { collection, doc, getDocFromServer, getDocsFromServer, query, runTransaction, where, type Transaction } from 'firebase/firestore';
import { randomUUID } from 'expo-crypto';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../auth/firebase';
import { readAccount, type Account } from '../auth/contracts';
import { normalizeClass } from '../character/catalog';
import type { Character } from '../character/contracts';
import { canon } from '../domain/canon';
import { acceptInvite, addHero, freshBoard, memberName, ownsBoard, readBoard, syncCampaign, withoutUndefined } from './contracts';
import type { Board, BoardRow, Invite } from './types';

export const makeId = () => randomUUID();
const unlocked = new Map<string, string>();
onAuthStateChanged(auth, () => unlocked.clear());
export function canManageBoard(board: Board, account: Account, id: string) { return ownsBoard(board, account) || !!(board.admin.passwordHash && unlocked.get(`${account.uid}:${id}`) === board.admin.passwordHash); }
export async function unlockBoard(id: string, account: Account, password: string) { const board = await loadBoard(id); const hash = boardPasswordHash(password); if (!password || hash !== board.admin.passwordHash) throw new Error('รหัสผู้ดูแลบอร์ดไม่ถูกต้อง'); unlocked.set(`${account.uid}:${id}`, hash); return board; }
const boardRef = (id: string) => {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) throw new Error('รหัสบอร์ดไม่ถูกต้อง');
  return doc(db, 'trips', id);
};
async function actor(tx: Transaction, account: Account) {
  if (auth.currentUser?.uid !== account.uid) throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง');
  const snap = await tx.get(doc(db, 'users', account.uid));
  const current = readAccount(account.uid, snap.data() || {});
  if (current.characterId !== account.characterId) throw new Error('ตัวละครเปลี่ยนแล้ว กรุณาโหลดบัญชีใหม่');
  return current;
}
export async function listBoards(account: Account): Promise<BoardRow[]> {
  // The web profile reads the same signed-in collection. Legacy boards lack access metadata.
  const snap = await getDocsFromServer(collection(db, 'trips'));
  if (auth.currentUser?.uid !== account.uid) throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง');
  return snap.docs.filter(d => {
    const data = d.data();
    return Object.values(data.characterIds || {}).includes(account.characterId) || data.admin?.characterId === account.characterId || data.access?.ownerUids?.includes(account.uid);
  }).map(d => ({ id: d.id, data: readBoard(d.data()) }));
}
export async function loadBoard(id: string) {
  const snap = await getDocFromServer(boardRef(id));
  if (!snap.exists()) throw new Error('ไม่พบบอร์ดนี้ ตรวจรหัสอีกครั้ง');
  return readBoard(snap.data());
}
export async function setBoardArchived(id: string, account: Account, archived: boolean) {
  return runTransaction(db, async tx => { await actor(tx, account); const ref = boardRef(id); const snap = await tx.get(ref); if (!snap.exists()) throw new Error('ไม่พบบอร์ด'); const board = readBoard(snap.data()); if (!ownsBoard(board, account)) throw new Error('เฉพาะเจ้าของบอร์ด'); tx.set(ref, { archived, archivedAt: archived ? Date.now() : null, updatedAt: Date.now() }, { merge: true }); });
}
export async function createBoard(account: Account, hero: Character, name: string, id: string) {
  const ref = boardRef(id); const now = Date.now();
  await runTransaction(db, async tx => {
    const current = await actor(tx, account);
    const old = await tx.get(ref);
    if (old.exists()) throw new Error('รหัสบอร์ดนี้มีผู้ใช้แล้ว ลองรหัสอื่น');
    const board = freshBoard(current, hero, name, now);
    tx.set(ref, withoutUndefined({ ...board, createdAt: now, updatedAt: now }));
  });
  return id;
}
export async function changeBoard(id: string, account: Account, change: (board: Board) => Board, adminOnly = false, unlockHash = '') {
  const ref = boardRef(id);
  return runTransaction(db, async tx => {
    await actor(tx, account);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('ไม่พบบอร์ดนี้');
    const current = readBoard(snap.data());
    const admin = canManageBoard(current, account, id) || !!(unlockHash && current.admin.passwordHash === unlockHash);
    if (!admin && (adminOnly || !memberName(current, account.characterId))) throw new Error(adminOnly ? 'เฉพาะเจ้าของบอร์ดเท่านั้น' : 'เข้าร่วมบอร์ดก่อนบันทึกรายการ');
    if (current.archived) throw new Error('บอร์ดถูกเก็บแล้ว กรุณาให้เจ้าของเปิดใช้งานอีกครั้ง');
    const next = withoutUndefined({ ...syncCampaign(change(current), Date.now()), updatedAt: Date.now() });
    tx.set(ref, next);
    return next;
  });
}
export async function joinBoard(id: string, account: Account, hero: Character) {
  return runTransaction(db, async tx => {
    await actor(tx, account);
    const ref = boardRef(id); const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('ไม่พบบอร์ดนี้');
    const board = readBoard(snap.data());
    if (board.archived) throw new Error('บอร์ดนี้ถูกเก็บแล้ว');
    const next = withoutUndefined({ ...syncCampaign(addHero(board, hero, account.uid), Date.now()), updatedAt: Date.now() });
    tx.set(ref, next); return next;
  });
}
export async function findHero(id: string) {
  if (!/^\d{4}$/.test(id)) throw new Error('ใส่ Character ID 4 หลัก');
  const snap = await getDocFromServer(doc(db, 'characters', id));
  const data = snap.data();
  if (!data?.ownerUid || data.id !== id) throw new Error('ไม่พบตัวละครที่มีบัญชีเจ้าของ');
  return { id, name: String(data.name), classId: normalizeClass(String(data.class || data.cls)), gender: data.gender === 'female' ? 'female' as const : 'male' as const, skin: String(data.skin || ''), xp: null, ownerUid: String(data.ownerUid) };
}
export async function sendInvite(boardId: string, account: Account, targetId: string, unlockHash = '') {
  const target = await findHero(targetId); const now = Date.now();
  if (target.ownerUid === account.uid) throw new Error('นี่คือตัวละครของคุณ ใช้ปุ่มเข้าร่วมบอร์ด');
  const id = `${boardId}_${target.id}_${makeId()}`;
  return runTransaction(db, async tx => {
    await actor(tx, account);
    const snap = await tx.get(boardRef(boardId));
    const targetSnap = await tx.get(doc(db, 'characters', target.id));
    if (targetSnap.data()?.ownerUid !== target.ownerUid) throw new Error('เจ้าของตัวละครเปลี่ยน กรุณาค้นหาใหม่');
    if (!snap.exists()) throw new Error('ไม่พบบอร์ด');
    const board = readBoard(snap.data());
    if (board.archived) throw new Error('บอร์ดถูกเก็บแล้ว');
    if (!canManageBoard(board, account, boardId) && !(unlockHash && board.admin.passwordHash === unlockHash)) throw new Error('เฉพาะเจ้าของบอร์ดส่งคำเชิญได้');
    if (memberName(board, target.id)) throw new Error('ตัวละครนี้อยู่ในบอร์ดแล้ว');
    const invite: Invite = { id, tripId: boardId, tripName: board.tripName, targetCharacterId: target.id,
      targetOwnerUid: target.ownerUid, targetName: target.name, targetClass: target.classId,
      targetGender: target.gender, targetSkin: target.skin, inviterUid: account.uid,
      inviterName: memberName(board, account.characterId) || account.name, inviterCharacterId: account.characterId,
      status: 'pending', createdAt: now, expiresAt: now + 86400000 };
    // Create-only prevents a sender overwriting a response. Rules allow only the target to update.
    tx.set(doc(db, 'users', target.ownerUid, 'boardInvites', id), invite);
    return invite;
  });
}
export async function loadInvites(account: Account) {
  const snap = await getDocsFromServer(query(collection(db, 'users', account.uid, 'boardInvites'), where('status', '==', 'pending')));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }) as Invite).filter(i => i.expiresAt > Date.now() && i.targetCharacterId === account.characterId);
}
export async function respondInvite(inviteId: string, account: Account, hero: Character, accept: boolean) {
  return runTransaction(db, async tx => {
    await actor(tx, account);
    const ref = doc(db, 'users', account.uid, 'boardInvites', inviteId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('ไม่พบคำเชิญ');
    const invite = snap.data() as Invite;
    const trip = boardRef(invite.tripId);
    const boardSnap = accept ? await tx.get(trip) : null;
    if (invite.targetOwnerUid !== account.uid || invite.targetCharacterId !== hero.id || invite.status !== 'pending' || invite.expiresAt <= Date.now()) throw new Error('คำเชิญไม่พร้อมใช้งานหรือหมดอายุ');
    if (accept) {
      if (!boardSnap?.exists()) throw new Error('บอร์ดนี้ไม่มีแล้ว');
      const current = readBoard(boardSnap.data());
      if (current.archived) throw new Error('บอร์ดถูกเก็บแล้ว');
      const next = acceptInvite(current, invite, account, hero, Date.now());
      tx.set(trip, withoutUndefined({ ...syncCampaign(next, Date.now()), updatedAt: Date.now() }));
    }
    tx.update(ref, { status: accept ? 'accepted' : 'declined', respondedAt: Date.now() });
    return invite.tripId;
  });
}
export function boardPasswordHash(password: string) { return String(canon.hashOf(`pointy:${password}:admin`)); }
