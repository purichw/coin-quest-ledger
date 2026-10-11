// Names/order mirror shared/pointy-logic.js; parity is checked against the web canon.
export const classes = [
  { id: 'warrior', th: 'นักรบ', en: 'Warrior' },
  { id: 'wizard', th: 'พ่อมด', en: 'Wizard' },
  { id: 'cleric', th: 'นักบวช', en: 'Cleric' },
  { id: 'monk', th: 'นักพรต', en: 'Monk' },
  { id: 'bard', th: 'นักดนตรี', en: 'Bard' },
  { id: 'dragoon', th: 'ทหารมังกร', en: 'Dragoon' },
  { id: 'summoner', th: 'ผู้อัญเชิญ', en: 'Summoner' },
  { id: 'thief', th: 'นักโจร', en: 'Thief' },
  { id: 'ranger', th: 'นักธนู', en: 'Ranger' },
  { id: 'alchemist', th: 'นักเล่นแร่', en: 'Alchemist' },
  { id: 'necromancer', th: 'จอมเวทมรณะ', en: 'Necromancer' },
  { id: 'engineer', th: 'วิศวกร', en: 'Engineer' },
  { id: 'berserker', th: 'นักรบคลั่ง', en: 'Berserker' },
  { id: 'archfiend', th: 'จอมอสูร', en: 'Archfiend' },
  { id: 'corsair', th: 'โจรสลัด', en: 'Corsair' },
  { id: 'reveler', th: 'นักรื่นเริง', en: 'Reveler' },
  { id: 'seraph', th: 'ทูตสวรรค์', en: 'Seraph' },
  { id: 'tiderunner', th: 'นักแล่นคลื่น', en: 'Tiderunner' },
] as const;

export type ClassId = typeof classes[number]['id'];
export type Gender = 'female' | 'male';
export function classInfo(id: ClassId) { return classes.find(item => item.id === id)!; }

export function normalizeClass(value: unknown): ClassId {
  const aliases: Record<string, string> = { mage: 'wizard', knight: 'warrior', rogue: 'thief', druid: 'summoner' };
  const id = aliases[String(value)] || String(value || 'warrior');
  if (classes.some(item => item.id === id)) return id as ClassId;
  let hash = 0;
  for (const char of id) hash = ((hash * 31) + char.charCodeAt(0)) | 0;
  return classes[Math.abs(hash) % classes.length].id;
}

export function levelFromXp(value: number) {
  const xp = Math.max(0, Math.round(value));
  const thresholds = [0, 300, 800, 1500, 2500, 4000, 6000, 8500, 12000, 16000];
  const index = thresholds.findIndex(mark => mark > xp);
  if (index < 0) {
    const extra = Math.floor((xp - 16000) / 5000);
    const into = xp - (16000 + extra * 5000);
    return { lvl: 10 + extra, into, need: 5000, pct: Math.round(into / 5000 * 100) };
  }
  const into = xp - thresholds[index - 1];
  const need = thresholds[index] - thresholds[index - 1];
  return { lvl: index, into, need, pct: Math.round(into / need * 100) };
}
