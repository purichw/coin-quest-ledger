import type { CharacterProfile, CharacterRecord, Expense, Gender, LevelInfo, PartyHero, Settlement, TripState } from './types';

export const CLASS_ORDER = [
  'warrior',
  'wizard',
  'cleric',
  'monk',
  'bard',
  'dragoon',
  'summoner',
  'thief',
  'ranger',
  'alchemist',
  'necromancer',
  'engineer',
  'berserker',
  'archfiend',
  'corsair',
  'reveler',
  'seraph',
  'tiderunner',
] as const;

export const CLASSES: Record<string, { glyph: string; th: string; en: string }> = {
  warrior: { glyph: '⚔️', th: 'นักรบ', en: 'Warrior' },
  wizard: { glyph: '🪄', th: 'พ่อมด', en: 'Wizard' },
  cleric: { glyph: '✨', th: 'นักบวช', en: 'Cleric' },
  monk: { glyph: '👊', th: 'นักพรต', en: 'Monk' },
  bard: { glyph: '🎻', th: 'นักดนตรี', en: 'Bard' },
  dragoon: { glyph: '🔱', th: 'ทหารมังกร', en: 'Dragoon' },
  summoner: { glyph: '🐾', th: 'ผู้อัญเชิญ', en: 'Summoner' },
  thief: { glyph: '🗡️', th: 'นักโจร', en: 'Thief' },
  ranger: { glyph: '🏹', th: 'นักธนู', en: 'Ranger' },
  alchemist: { glyph: '⚗️', th: 'นักเล่นแร่', en: 'Alchemist' },
  necromancer: { glyph: '💀', th: 'จอมเวทมรณะ', en: 'Necromancer' },
  engineer: { glyph: '🔧', th: 'วิศวกร', en: 'Engineer' },
  berserker: { glyph: '🪓', th: 'นักรบคลั่ง', en: 'Berserker' },
  archfiend: { glyph: '😈', th: 'จอมอสูร', en: 'Archfiend' },
  corsair: { glyph: '🐚', th: 'โจรสลัด', en: 'Corsair' },
  reveler: { glyph: '🎭', th: 'นักรื่นเริง', en: 'Reveler' },
  seraph: { glyph: '😇', th: 'ทูตสวรรค์', en: 'Seraph' },
  tiderunner: { glyph: '🌊', th: 'นักแล่นคลื่น', en: 'Tiderunner' },
};

export const CHARACTER_LEVEL_STEP = 600;
export const CHARACTER_LEVEL_THRESHOLDS = [0, 300, 800, 1500, 2500, 4000, 6000, 8500, 12000, 16000];
export const CHARACTER_LEVEL_TAIL_STEP = 5000;
export const SPLIT_FRONTED_XP_DIVISOR = 20;
export const SPLIT_FRONTED_XP_CAP = 250;

export function hashOf(value: string): number {
  let x = 0;
  for (const char of String(value || '?')) x = (x * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(x);
}

export function genId4(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function normalizeClass(cls?: string): string {
  const map: Record<string, string> = { mage: 'wizard', knight: 'warrior', rogue: 'thief', druid: 'summoner' };
  const id = map[String(cls || '')] || String(cls || '');
  return CLASSES[id] ? id : CLASS_ORDER[hashOf(id) % CLASS_ORDER.length];
}

export function levelFromXp(xp: number): LevelInfo {
  return levelFromThresholds(xp, CHARACTER_LEVEL_THRESHOLDS, CHARACTER_LEVEL_TAIL_STEP);
}

function levelFromThresholds(value: number, thresholds: number[], tailStep: number): LevelInfo {
  const clean = Math.max(0, Math.round(Number(value) || 0));
  let lvl = 1;
  while (lvl < thresholds.length && clean >= thresholds[lvl]) lvl += 1;
  let prev: number;
  let next: number;
  if (lvl < thresholds.length) {
    prev = thresholds[lvl - 1];
    next = thresholds[lvl];
  } else {
    prev = thresholds[thresholds.length - 1];
    while (clean >= prev + tailStep) {
      prev += tailStep;
      lvl += 1;
    }
    next = prev + tailStep;
  }
  const need = Math.max(1, next - prev);
  const into = clean - prev;
  return { lvl, into, need, pct: Math.round((into / need) * 100) };
}

export function splitFrontedXp(amount: number): number {
  return Math.round(Math.min(SPLIT_FRONTED_XP_CAP, Math.max(0, Number(amount) || 0) / SPLIT_FRONTED_XP_DIVISOR));
}

export function timestampValue(value: unknown): number {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Date.parse(value) || 0;
  if (typeof value === 'object' && value && 'toMillis' in value && typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value === 'object' && value && 'seconds' in value && typeof value.seconds === 'number') return value.seconds * 1000;
  return 0;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : [];
}

function asNumberRecord(value: unknown): Record<string, number> {
  return Object.fromEntries(Object.entries(asRecord(value)).map(([key, val]) => [key, Number(val) || 0]));
}

function asStringRecord(value: unknown): Record<string, string> {
  return Object.fromEntries(Object.entries(asRecord(value)).map(([key, val]) => [key, String(val || '')]));
}

function asBoolRecord(value: unknown): Record<string, boolean> {
  return Object.fromEntries(Object.entries(asRecord(value)).map(([key, val]) => [key, !!val]));
}

function asGenderRecord(value: unknown): Record<string, Gender> {
  return Object.fromEntries(Object.entries(asRecord(value)).map(([key, val]) => [key, val === 'female' ? 'female' : 'male']));
}

export function normalizeTripState(id: string, data: Record<string, unknown>): TripState {
  const expenses = Array.isArray(data.expenses) ? data.expenses : [];
  const admin = asRecord(data.admin);
  const settings = asRecord(data.settings);
  return {
    id,
    tripName: String(data.tripName || 'Untitled board'),
    participants: asStringArray(data.participants),
    expenses: expenses.map((item) => normalizeExpense(asRecord(item))).filter((item) => item.amount > 0 && item.sharedBy.length),
    budgets: asNumberRecord(data.budgets),
    heroClasses: Object.fromEntries(Object.entries(asRecord(data.heroClasses)).map(([name, cls]) => [name, normalizeClass(String(cls || ''))])),
    heroGenders: asGenderRecord(data.heroGenders),
    heroSkins: asStringRecord(data.heroSkins),
    settleXp: asNumberRecord(data.settleXp),
    characterIds: asStringRecord(data.characterIds),
    guestHeroes: asBoolRecord(data.guestHeroes),
    promptpay: asStringRecord(data.promptpay),
    activeCampaignId: String(data.activeCampaignId || data.activeId || ''),
    campaigns: Array.isArray(data.campaigns) ? data.campaigns : [],
    admin: {
      passwordHash: String(admin.passwordHash || ''),
      ownerHash: String(admin.ownerHash || ''),
      adminId: String(admin.adminId || ''),
      adminName: String(admin.adminName || ''),
      characterId: String(admin.characterId || ''),
      createdAt: admin.createdAt || null,
      urlLocked: !!admin.urlLocked,
    },
    settings,
    archived: !!data.archived,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    raw: data,
  };
}

function normalizeExpense(data: Record<string, unknown>): Expense {
  const split = asRecord(data.split);
  return {
    id: String(data.id || Date.now()),
    desc: String(data.desc || data.name || ''),
    icon: String(data.icon || ''),
    amount: Number(data.amount) || 0,
    paidBy: String(data.paidBy || data.payer || ''),
    sharedBy: asStringArray(data.sharedBy || data.participants),
    payers: Object.keys(asRecord(data.payers)).length ? asNumberRecord(data.payers) : undefined,
    split: Object.keys(split).length
      ? {
          mode: String(split.mode || 'equal'),
          weights: Object.keys(asRecord(split.weights)).length ? asNumberRecord(split.weights) : undefined,
          items: Array.isArray(split.items)
            ? split.items.map((item) => {
                const row = asRecord(item);
                return { name: String(row.name || row.desc || ''), amount: Number(row.amount) || 0, claimedBy: asStringArray(row.claimedBy) };
              })
            : undefined,
        }
      : undefined,
    receipt: typeof data.receipt === 'string' ? data.receipt : undefined,
    date: typeof data.date === 'string' ? data.date : undefined,
  };
}

function payerMap(expense: Expense): Record<string, number> {
  if (expense.payers && typeof expense.payers === 'object') {
    const entries = Object.entries(expense.payers).filter(([, value]) => Number(value) > 0);
    if (entries.length) return Object.fromEntries(entries.map(([key, value]) => [key, Number(value) || 0]));
  }
  return expense.paidBy ? { [expense.paidBy]: Number(expense.amount) || 0 } : {};
}

function splitShares(expense: Expense, validNames: string[]): Record<string, number> {
  const parts = expense.sharedBy.filter((name) => validNames.includes(name));
  if (!parts.length) return {};
  const mode = expense.split?.mode || 'equal';
  const weights = expense.split?.weights || {};
  if (mode === 'shares' || mode === 'percent') {
    const totalWeight = parts.reduce((sum, name) => sum + Math.max(0, Number(weights[name]) || 0), 0);
    if (totalWeight > 0) {
      return Object.fromEntries(parts.map((name) => [name, expense.amount * (Math.max(0, Number(weights[name]) || 0) / totalWeight)]));
    }
  }
  if (mode === 'exact') {
    const out = Object.fromEntries(parts.map((name) => [name, Math.max(0, Number(weights[name]) || 0)]));
    const total = Object.values(out).reduce((sum, value) => sum + value, 0);
    const remainder = expense.amount - total;
    if (Math.abs(remainder) > 0.5) parts.forEach((name) => (out[name] += remainder / parts.length));
    return out;
  }
  return Object.fromEntries(parts.map((name) => [name, expense.amount / parts.length]));
}

export function computeParty(state: TripState): PartyHero[] {
  const stat: Record<string, { paid: number; share: number; gen: number; quests: number }> = {};
  state.participants.forEach((name) => (stat[name] = { paid: 0, share: 0, gen: 0, quests: 0 }));
  state.expenses.forEach((expense) => {
    const shares = splitShares(expense, state.participants);
    const payers = payerMap(expense);
    Object.entries(payers).forEach(([name, amount]) => {
      if (!stat[name]) return;
      stat[name].paid += amount;
      stat[name].gen += Math.max(0, amount - (shares[name] || 0));
    });
    Object.keys(shares).forEach((name) => {
      stat[name].share += shares[name];
      stat[name].quests += 1;
    });
  });
  return state.participants.map((name) => {
    const row = stat[name] || { paid: 0, share: 0, gen: 0, quests: 0 };
    const budget = Number(state.budgets[name]) || 3000;
    const remaining = budget - row.share;
    const xp = Math.round(splitFrontedXp(row.gen) + (Number(state.settleXp[name]) || 0));
    return {
      name,
      cls: normalizeClass(state.heroClasses[name]),
      budget,
      paid: row.paid,
      share: row.share,
      gen: Math.round(row.gen),
      quests: row.quests,
      bal: row.paid - row.share,
      remaining,
      over: remaining < 0,
      hp: Math.max(0, Math.min(100, Math.round((remaining / budget) * 100))),
      xp,
      level: levelFromXp(xp),
    };
  });
}

function globalSettleUp(party: PartyHero[]): Settlement[] {
  const credit = party.filter((hero) => hero.bal > 0.5).map((hero) => ({ name: hero.name, amount: hero.bal })).sort((a, b) => b.amount - a.amount);
  const debt = party.filter((hero) => hero.bal < -0.5).map((hero) => ({ name: hero.name, amount: -hero.bal })).sort((a, b) => b.amount - a.amount);
  const out: Settlement[] = [];
  let i = 0;
  let j = 0;
  while (i < debt.length && j < credit.length) {
    const amount = Math.min(debt[i].amount, credit[j].amount);
    if (amount > 0.5) out.push({ from: debt[i].name, to: credit[j].name, amount });
    debt[i].amount -= amount;
    credit[j].amount -= amount;
    if (debt[i].amount < 0.5) i += 1;
    if (credit[j].amount < 0.5) j += 1;
  }
  return out;
}

export function settleUp(party: PartyHero[], state: TripState | null = null): Settlement[] {
  if (!state?.expenses?.length || !state?.participants?.length) return globalSettleUp(party);
  const participants = state.participants;
  const valid = new Set(participants);
  const pair: Record<string, number> = {};
  state.expenses.forEach((expense) => {
    const shares = splitShares(expense, participants);
    const payers = Object.entries(payerMap(expense)).filter(([name, amount]) => valid.has(name) && Number(amount) > 0);
    const totalPaid = payers.reduce((sum, [, amount]) => sum + (Number(amount) || 0), 0);
    if (totalPaid <= 0) return;
    Object.entries(shares).forEach(([from, share]) => {
      const owedShare = Number(share) || 0;
      if (!valid.has(from) || owedShare <= 0) return;
      payers.forEach(([to, paid]) => {
        if (from === to) return;
        const amount = owedShare * ((Number(paid) || 0) / totalPaid);
        if (amount <= 0) return;
        const key = `${from}\u0000${to}`;
        pair[key] = (pair[key] || 0) + amount;
      });
    });
  });
  const out: Settlement[] = [];
  const seen = new Set<string>();
  Object.keys(pair).forEach((key) => {
    if (seen.has(key)) return;
    const [from, to] = key.split('\u0000');
    const reverse = `${to}\u0000${from}`;
    seen.add(key);
    seen.add(reverse);
    const net = (pair[key] || 0) - (pair[reverse] || 0);
    const amount = Math.round(Math.abs(net) * 100) / 100;
    if (amount <= 0.005) return;
    out.push(net > 0 ? { from, to, amount } : { from: to, to: from, amount });
  });
  if (!out.length) return [];
  const totalOut = out.reduce<Record<string, number>>((acc, tx) => {
    acc[tx.from] = (acc[tx.from] || 0) + tx.amount;
    return acc;
  }, {});
  return out.sort(
    (a, b) =>
      (totalOut[b.from] || 0) - (totalOut[a.from] || 0) ||
      b.amount - a.amount ||
      participants.indexOf(a.from) - participants.indexOf(b.from) ||
      participants.indexOf(a.to) - participants.indexOf(b.to),
  );
}

export function buildCharacterProfile(characterId: string, boards: TripState[], record: CharacterRecord | null, lang: 'th' | 'en'): CharacterProfile {
  const id = String(characterId || '').trim();
  const rec = record || ({} as CharacterRecord);
  const rows: CharacterProfile['boards'] = [];
  const totals = { paid: 0, share: 0, fronted: 0, balance: 0, quests: 0, boards: 0, settledBoards: 0, activeBoards: 0, settlementXp: 0 };
  let frontedXp = 0;
  boards.forEach((board) => {
    const names = board.participants.filter((name) => String(board.characterIds[name] || '') === id);
    if (!names.length && String(board.admin.characterId || '') === id) names.push(board.admin.adminName || rec.name || id);
    if (!names.length) return;
    const party = computeParty(board);
    names.forEach((name) => {
      const hero = party.find((item) => item.name === name) || { paid: 0, share: 0, gen: 0, bal: 0, quests: 0 };
      const settled = board.expenses.length > 0 && settleUp(party, board).length === 0;
      rows.push({
        id: board.id,
        tripName: board.tripName,
        name,
        paid: hero.paid,
        share: hero.share,
        fronted: hero.gen,
        balance: hero.bal,
        quests: hero.quests,
        members: board.participants.length,
        settled,
        archived: !!board.archived,
        updatedAt: timestampValue(board.updatedAt),
      });
      totals.paid += hero.paid;
      totals.share += hero.share;
      totals.fronted += hero.gen;
      frontedXp += splitFrontedXp(hero.gen);
      totals.balance += hero.bal;
      totals.quests += hero.quests;
      totals.settlementXp += Number(board.settleXp[name]) || 0;
    });
  });
  rows.sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id));
  totals.boards = new Set(rows.map((row) => row.id)).size;
  totals.settledBoards = new Set(rows.filter((row) => row.settled).map((row) => row.id)).size;
  totals.activeBoards = Math.max(0, totals.boards - totals.settledBoards);
  const debtXp = Math.round(Number(rec.debtXp) || 0);
  const tripXp = Object.values(rec.trips || {}).reduce((sum, xp) => sum + (Number(xp) || 0), 0);
  const xp = Math.round(Number(rec.xp) || tripXp + debtXp || frontedXp + totals.settlementXp + debtXp);
  const level = levelFromXp(xp);
  const badges: CharacterProfile['badges'] = [];
  if (totals.boards >= 1) badges.push({ id: 'party-member', label: lang === 'en' ? 'Party Member' : 'สมาชิกปาร์ตี้', detail: lang === 'en' ? 'Joined a board' : 'เข้าร่วมบอร์ดแล้ว' });
  if (totals.fronted >= 1000) badges.push({ id: 'treasurer', label: lang === 'en' ? 'Treasurer' : 'เหรัญญิก', detail: lang === 'en' ? 'Fronted money for the party' : 'ออกเงินแทนปาร์ตี้' });
  if (totals.settledBoards >= 1) badges.push({ id: 'settled', label: lang === 'en' ? 'Debt Slayer' : 'ผู้ปราบหนี้', detail: lang === 'en' ? 'Settled a board' : 'เคลียร์บอร์ดสำเร็จ' });
  if (level.lvl >= 5) badges.push({ id: 'level', label: lang === 'en' ? 'Seasoned Hero' : 'ฮีโร่ชำนาญศึก', detail: `Level ${level.lvl}` });
  return {
    id,
    displayName: rec.name || rows[0]?.name || `#${id}`,
    class: normalizeClass(rec.class || rec.cls),
    gender: rec.gender === 'female' ? 'female' : 'male',
    skin: rec.skin || '',
    xp,
    level,
    totals,
    boards: rows,
    badges,
  };
}
