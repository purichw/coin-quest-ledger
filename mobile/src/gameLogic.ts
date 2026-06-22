import type { CompareOffer, DebtDragon, DebtState, PlayerModules, PriceComparison, TreasuryState } from './types';

export const DRAGON_TYPES: Record<DebtDragon['type'], { th: string; en: string; minPay: number }> = {
  card: { th: 'บัตรเครดิต', en: 'Credit card', minPay: 3000 },
  autoloan: { th: 'สินเชื่อรถยนต์', en: 'Auto loan', minPay: 9600 },
  student: { th: 'เงินกู้เรียน', en: 'Student loan', minPay: 2000 },
  mortgage: { th: 'สินเชื่อบ้าน', en: 'Mortgage', minPay: 19300 },
  medical: { th: 'ค่ารักษา', en: 'Medical debt', minPay: 2500 },
  tax: { th: 'ภาษี', en: 'Tax debt', minPay: 3000 },
  other: { th: 'หนี้อื่น ๆ', en: 'Other debt', minPay: 0 },
};

export const UNIT_GROUPS = [
  { name: 'volume', base: 'ml', units: { ml: 1, l: 1000 } },
  { name: 'weight', base: 'g', units: { g: 1, kg: 1000 } },
  { name: 'count', base: 'pcs', units: { pcs: 1, pack: 1 } },
] as const;

const UNIT_ALIAS: Record<string, string> = {
  'ชิ้น': 'pcs',
  piece: 'pcs',
  pieces: 'pcs',
  'แพ็ค/กล่อง': 'pack',
  box: 'pack',
  'มล.': 'ml',
  'ลิตร': 'l',
  'กรัม': 'g',
  'กก.': 'kg',
};

export function uid(prefix = 'x'): string {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
}

export function todayIso(): string {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function emptyDebtState(): DebtState {
  return { strategy: 'avalanche', dragons: [], stats: { interest: 0 } };
}

export function emptyTreasuryState(): TreasuryState {
  return { month: monthKey(), income: 0, expenses: [] };
}

export function emptyPlayerModules(uidValue: string, characterId: string): PlayerModules {
  return {
    uid: uidValue,
    characterId,
    debt: emptyDebtState(),
    treasury: emptyTreasuryState(),
    comparisons: [],
  };
}

export function normalizeDebtState(value: unknown): DebtState {
  const row = asRecord(value);
  return {
    strategy: row.strategy === 'snowball' ? 'snowball' : 'avalanche',
    dragons: Array.isArray(row.dragons) ? row.dragons.map(normalizeDragon).filter(Boolean) as DebtDragon[] : [],
    stats: { interest: Math.max(0, Number(asRecord(row.stats).interest) || 0) },
    ...(row.updatedAt ? { updatedAt: row.updatedAt } : {}),
  };
}

export function normalizeTreasuryState(value: unknown): TreasuryState {
  const row = asRecord(value);
  return {
    month: String(row.month || monthKey()),
    income: Math.max(0, Number(row.income) || 0),
    expenses: Array.isArray(row.expenses)
      ? row.expenses.map((item) => {
          const exp = asRecord(item);
          return {
            id: String(exp.id || uid('te')),
            name: String(exp.name || exp.note || 'Expense'),
            category: String(exp.category || exp.catId || 'general'),
            amount: Math.max(0, Number(exp.amount) || 0),
            date: String(exp.date || todayIso()),
          };
        }).filter((item) => item.amount > 0)
      : [],
    ...(row.updatedAt ? { updatedAt: row.updatedAt } : {}),
  };
}

export function normalizeComparisons(value: unknown): PriceComparison[] {
  return Array.isArray(value)
    ? value.map((item) => normalizeComparison(item)).filter(Boolean) as PriceComparison[]
    : [];
}

export function debtTotals(state: DebtState): { hoard: number; slain: number; live: number; monthly: number } {
  return state.dragons.reduce(
    (sum, dragon) => ({
      hoard: sum.hoard + Math.max(0, dragon.balance),
      slain: sum.slain + (dragon.slain ? 1 : 0),
      live: sum.live + (!dragon.slain && dragon.balance > 0.5 ? 1 : 0),
      monthly: sum.monthly + (dragon.payMode === 'monthly' && !dragon.slain ? dragon.payment : 0),
    }),
    { hoard: 0, slain: 0, live: 0, monthly: 0 },
  );
}

export function strikeDragon(state: DebtState, dragonId: string, amount: number): DebtState {
  const cleanAmount = Math.max(0, Number(amount) || 0);
  if (!cleanAmount) return state;
  return {
    ...state,
    dragons: state.dragons.map((dragon) => {
      if (dragon.id !== dragonId) return dragon;
      const balance = Math.max(0, dragon.balance - cleanAmount);
      const slain = balance <= 0.5;
      return {
        ...dragon,
        balance,
        slain,
        slainAt: slain ? Date.now() : dragon.slainAt || null,
        log: [{ id: uid('hit'), amount: cleanAmount, date: todayIso(), ts: Date.now(), move: 'strike' }, ...dragon.log],
      };
    }),
  };
}

export function treasuryTotals(state: TreasuryState): { spent: number; remaining: number; projected: number; pct: number } {
  const spent = state.expenses.reduce((sum, item) => sum + item.amount, 0);
  const remaining = state.income - spent;
  const pct = state.income > 0 ? Math.max(0, Math.min(100, Math.round((remaining / state.income) * 100))) : 0;
  return { spent, remaining, projected: spent, pct };
}

export function rankOffers(comparison: PriceComparison): Array<CompareOffer & { pu: number; isBest: boolean; savePct: number }> {
  const ranked = comparison.offers
    .map((offer) => ({ ...offer, pu: pricePerUnit(offer, comparison) }))
    .filter((offer) => Number.isFinite(offer.pu))
    .sort((a, b) => a.pu - b.pu);
  const best = ranked[0]?.pu || 0;
  const worst = ranked[ranked.length - 1]?.pu || best;
  return ranked.map((offer) => ({
    ...offer,
    isBest: ranked.length > 1 && Math.abs(offer.pu - best) < 0.000001 && worst > best,
    savePct: worst > 0 ? Math.round((1 - offer.pu / worst) * 100) : 0,
  }));
}

export function dragonFromInput(input: { name: string; type: DebtDragon['type']; balance: number; apr: number; payment?: number }): DebtDragon {
  const type = DRAGON_TYPES[input.type] ? input.type : 'card';
  const balance = Math.max(0, Number(input.balance) || 0);
  return {
    id: uid('d'),
    name: input.name.trim() || DRAGON_TYPES[type].en,
    type,
    original: balance,
    balance,
    apr: Math.max(0, Number(input.apr) || 0),
    payment: Math.max(0, Number(input.payment) || DRAGON_TYPES[type].minPay),
    interestMode: 'compound',
    payMode: 'monthly',
    dueDay: 0,
    log: [],
    slain: balance <= 0.5,
    slainAt: null,
  };
}

export function comparisonFromInput(name: string, baseUnit: string): PriceComparison {
  return { id: uid('cmp'), name: name.trim() || 'Item', icon: 'merchant', baseUnit: normalizeUnit(baseUnit), offers: [] };
}

export function offerFromInput(input: { merchant: string; price: number; qty: number; unit: string }): CompareOffer {
  return {
    id: uid('of'),
    merchant: input.merchant.trim() || 'Merchant',
    price: Math.max(0, Number(input.price) || 0),
    qty: Math.max(0, Number(input.qty) || 0),
    unit: normalizeUnit(input.unit || 'pcs'),
    buy: 1,
    free: 0,
  };
}

function normalizeDragon(value: unknown): DebtDragon | null {
  const row = asRecord(value);
  const type = DRAGON_TYPES[String(row.type) as DebtDragon['type']] ? String(row.type) as DebtDragon['type'] : 'card';
  const balance = Math.max(0, Number(row.balance) || 0);
  const original = Math.max(balance, Number(row.original) || balance);
  return {
    id: String(row.id || uid('d')),
    name: String(row.name || DRAGON_TYPES[type].en),
    type,
    original,
    balance,
    apr: Math.max(0, Number(row.apr) || 0),
    payment: Math.max(0, Number(row.payment) || DRAGON_TYPES[type].minPay),
    interestMode: row.interestMode === 'simple' ? 'simple' : 'compound',
    payMode: row.payMode === 'adhoc' ? 'adhoc' : 'monthly',
    dueDay: Math.max(0, Math.min(31, Number(row.dueDay) || 0)),
    log: Array.isArray(row.log) ? row.log.map((hit) => {
      const item = asRecord(hit);
      return { id: String(item.id || uid('hit')), amount: Math.max(0, Number(item.amount) || 0), date: String(item.date || todayIso()), ts: Number(item.ts) || 0, move: String(item.move || 'strike') };
    }) : [],
    slain: !!row.slain || balance <= 0.5,
    slainAt: Number(row.slainAt) || null,
  };
}

function normalizeComparison(value: unknown): PriceComparison | null {
  const row = asRecord(value);
  return {
    id: String(row.id || uid('cmp')),
    name: String(row.name || 'Item'),
    icon: String(row.icon || 'merchant'),
    baseUnit: normalizeUnit(String(row.baseUnit || row.unit || 'pcs')),
    offers: Array.isArray(row.offers) ? row.offers.map((offer) => {
      const item = asRecord(offer);
      return offerFromInput({
        merchant: String(item.merchant || item.store || ''),
        price: Number(item.price) || 0,
        qty: Number(item.qty) || 0,
        unit: String(item.unit || row.baseUnit || 'pcs'),
      });
    }).filter((offer) => offer.price > 0 && offer.qty > 0) : [],
  };
}

function pricePerUnit(offer: CompareOffer, comparison: PriceComparison): number {
  const unit = normalizeUnit(offer.unit || comparison.baseUnit);
  const group = groupFor(comparison.baseUnit);
  if (!group || !(unit in group.units)) return Infinity;
  const factor = (group.units as Record<string, number>)[unit] || 1;
  const qty = Number(offer.qty) * factor;
  return qty > 0 && offer.price > 0 ? offer.price / qty : Infinity;
}

function normalizeUnit(unit: string): string {
  const raw = String(unit || '').trim();
  return UNIT_ALIAS[raw] || raw || 'pcs';
}

function groupFor(unit: string) {
  const clean = normalizeUnit(unit);
  return UNIT_GROUPS.find((group) => clean in group.units) || UNIT_GROUPS[2];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
