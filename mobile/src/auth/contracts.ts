export type Account = {
  uid: string;
  username: string;
  userId: string;
  name: string;
  status: string;
  characterId: string;
  recoveryHash?: string;
};

export type SignupFields = { username: string; name: string; password: string; confirmation: string };
export const blockedStatuses = ['archived', 'deactivated', 'delete_requested', 'deleted'];

// Keep identity and recovery normalization identical to shared/profile-auth.js
// and shared/profile-recovery.js. Signup rejects lossy input instead of silently renaming it.
export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 32);
}

export function recoveryHashInput(username: string, code: string) {
  return `${normalizeUsername(username)}:${code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
}

export function isBlocked(record: Record<string, unknown>) {
  return [record.status, record.lifecycleStatus].some(value => blockedStatuses.includes(String(value || '').toLowerCase()));
}

export function isReusable(record: Record<string, unknown>) {
  return record.deleteReusable === true && record.lifecycleStatus === 'deleted' && /^\d{4}$/.test(String(record.userId));
}

export function problem(code: string) {
  return Object.assign(new Error(code), { code });
}

export function validateLogin(username: string, password: string) {
  if (!normalizeUsername(username) || !password) return 'กรอกชื่อผู้ใช้และรหัสผ่านก่อนนะ';
  if (!/^[a-z0-9._-]{1,32}$/i.test(username.trim())) return 'กรอกชื่อผู้ใช้ให้ถูกต้อง';
  return '';
}
export function validateRecovery(username: string, code: string, password: string, confirmation: string) {
  if (!/^[a-z0-9._-]{1,32}$/i.test(username.trim())) return 'กรอกชื่อผู้ใช้ให้ถูกต้อง';
  if (!/^[A-Z0-9]{12}$/.test(code.toUpperCase().replace(/[\s-]/g, ''))) return 'กรอก Recovery ID 12 ตัวอักษร';
  if (password.length < 6) return 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร';
  if (password !== confirmation) return 'รหัสผ่านทั้งสองช่องยังไม่ตรงกัน';
  return '';
}

export function validateSignup(fields: SignupFields) {
  if (!fields.name.trim()) return 'กรอกชื่อที่อยากให้เพื่อนเห็น';
  if (fields.name.trim().length > 60) return 'ชื่อที่แสดงต้องไม่เกิน 60 ตัวอักษร';
  if (!/^[a-z0-9._-]{1,32}$/i.test(fields.username.trim())) return 'ชื่อผู้ใช้ใช้ a–z, 0–9, จุด, ขีดกลาง หรือขีดล่าง ไม่เกิน 32 ตัว';
  if (fields.password.length < 6) return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
  if (fields.password !== fields.confirmation) return 'รหัสผ่านทั้งสองช่องยังไม่ตรงกัน';
  return '';
}

export function readAccount(uid: string, data: Record<string, unknown>): Account {
  if (isBlocked(data)) throw problem('account/blocked');
  if (data.uid !== uid || !/^\d{4}$/.test(String(data.userId)) || !data.username || !data.name) {
    throw problem('account/profile-invalid');
  }
  const embedded = data.character && typeof data.character === 'object' ? (data.character as { id?: unknown }).id : '';
  const characterId = String(data.characterId || embedded || '');
  if ((characterId && !/^\d{4}$/.test(characterId)) || (data.characterId && embedded && data.characterId !== embedded)) throw problem('account/profile-invalid');
  return { uid, username: String(data.username), userId: String(data.userId), name: String(data.name), status: String(data.status || 'active'), characterId, recoveryHash: typeof data.recoveryHash === 'string' ? data.recoveryHash : undefined };
}

export function authMessage(error: unknown) {
  const code = (error as { code?: string })?.code || '';
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(code)) return 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง ลองอีกครั้งได้เลย';
  if (code === 'auth/email-already-in-use' || code === 'account/username-taken') return 'ชื่อผู้ใช้นี้มีคนใช้แล้ว ลองชื่ออื่นหรือเข้าสู่ระบบ';
  if (code === 'auth/weak-password' || code === 'auth/password-does-not-meet-requirements') return 'รหัสผ่านยังไม่ผ่านเงื่อนไข ลองใช้รหัสที่ยาวและคาดเดายากขึ้น';
  if (code === 'auth/too-many-requests') return 'ลองหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่';
  if (['account/blocked', 'auth/user-disabled'].includes(code)) return 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแล';
  if (['auth/user-token-expired', 'auth/invalid-user-token'].includes(code)) return 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง';
  if (['auth/network-request-failed', 'unavailable', 'deadline-exceeded'].includes(code)) return 'เชื่อมต่อไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่ ข้อมูลที่กรอกยังอยู่';
  if (code === 'permission-denied') return 'ยังเข้าถึงข้อมูลบัญชีไม่ได้ กรุณาลองใหม่หรือติดต่อผู้ดูแล';
  if (code === 'account/profile-invalid') return 'ข้อมูลบัญชียังไม่ครบ กรุณาติดต่อผู้ดูแลเพื่อรักษา User ID เดิม';
  if (code === 'account/id-unavailable') return 'ยังจอง User ID ไม่สำเร็จ ลองอีกครั้งได้โดยไม่ต้องสมัครใหม่';
  if (code === 'character/identity-conflict') return 'ข้อมูลตัวละครไม่ตรงกับบัญชี กรุณาติดต่อผู้ดูแลเพื่อรักษาตัวละครเดิม';
  if (code === 'character/missing') return 'ยังไม่พบข้อมูลตัวละครที่ผูกไว้ ลองโหลดใหม่หรือติดต่อผู้ดูแล';
  if (code === 'character/invalid') return 'ตรวจสอบชื่อตัวละครและเลือกอาชีพก่อนบันทึก';
  return 'ทำรายการไม่สำเร็จ กรุณาลองอีกครั้ง';
}
