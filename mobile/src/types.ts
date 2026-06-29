export type Lang = 'th' | 'en';
export type Gender = 'male' | 'female';
export type ThemeName = 'tavern' | 'dungeon';

export type CharacterRecord = {
  id: string;
  name: string;
  class: string;
  cls?: string;
  gender: Gender;
  skin?: string;
  xp?: number;
  debtXp?: number;
  trips?: Record<string, number>;
  ownerUid?: string;
  userId?: string;
  username?: string;
  accountName?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type Account = {
  uid: string;
  provider: 'firebase';
  username: string;
  email: string;
  userId: string;
  name: string;
  status: string;
  recoveryCode?: string;
  recoveryHash?: string;
  recoveryIssuedAt?: number;
  character: CharacterRecord | null;
  characterId?: string;
};

export type Expense = {
  id: string | number;
  desc: string;
  icon?: string;
  amount: number;
  paidBy: string;
  sharedBy: string[];
  payers?: Record<string, number>;
  split?: {
    mode: 'equal' | 'shares' | 'exact' | 'percent' | 'items' | string;
    weights?: Record<string, number>;
    items?: Array<{ name?: string; desc?: string; amount: number; claimedBy: string[] }>;
  };
  receipt?: string;
  date?: string;
};

export type TripState = {
  id: string;
  tripName: string;
  participants: string[];
  expenses: Expense[];
  budgets: Record<string, number>;
  heroClasses: Record<string, string>;
  heroGenders: Record<string, Gender>;
  heroSkins: Record<string, string>;
  settleXp: Record<string, number>;
  characterIds: Record<string, string>;
  guestHeroes: Record<string, boolean>;
  promptpay: Record<string, string>;
  activeCampaignId: string;
  campaigns: unknown[];
  admin: {
    passwordHash: string;
    ownerHash: string;
    adminId: string;
    adminName: string;
    characterId: string;
    createdAt: unknown;
    urlLocked: boolean;
  };
  settings: Record<string, unknown>;
  archived?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  raw?: Record<string, unknown>;
};

export type PartyHero = {
  name: string;
  cls: string;
  budget: number;
  paid: number;
  share: number;
  gen: number;
  quests: number;
  bal: number;
  remaining: number;
  over: boolean;
  hp: number;
  xp: number;
  level: LevelInfo;
};

export type Settlement = {
  from: string;
  to: string;
  amount: number;
};

export type LevelInfo = {
  lvl: number;
  into: number;
  need: number;
  pct: number;
};

export type CharacterProfile = {
  id: string;
  displayName: string;
  class: string;
  gender: Gender;
  skin: string;
  xp: number;
  level: LevelInfo;
  totals: {
    paid: number;
    share: number;
    fronted: number;
    balance: number;
    quests: number;
    boards: number;
    settledBoards: number;
    activeBoards: number;
    settlementXp: number;
  };
  boards: Array<{
    id: string;
    tripName: string;
    name: string;
    paid: number;
    share: number;
    fronted: number;
    balance: number;
    quests: number;
    members: number;
    settled: boolean;
    archived: boolean;
    updatedAt: number;
  }>;
  badges: Array<{ id: string; label: string; detail: string }>;
};

export type DebtDragon = {
  id: string;
  name: string;
  type: 'card' | 'autoloan' | 'student' | 'mortgage' | 'medical' | 'tax' | 'other';
  original: number;
  balance: number;
  apr: number;
  payment: number;
  interestMode: 'compound' | 'simple';
  payMode: 'monthly' | 'adhoc';
  dueDay?: number;
  log: Array<{ id: string; amount: number; date: string; ts: number; move: string }>;
  slain: boolean;
  slainAt?: number | null;
};

export type DebtState = {
  strategy: 'avalanche' | 'snowball';
  dragons: DebtDragon[];
  stats: { interest: number };
  updatedAt?: unknown;
};

export type TreasuryExpense = {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
};

export type TreasuryState = {
  month: string;
  income: number;
  expenses: TreasuryExpense[];
  updatedAt?: unknown;
};

export type CompareOffer = {
  id: string;
  merchant: string;
  price: number;
  qty: number;
  unit: string;
  perPack?: number;
  buy?: number;
  free?: number;
};

export type PriceComparison = {
  id: string;
  name: string;
  icon: string;
  baseUnit: string;
  offers: CompareOffer[];
};

export type PlayerModules = {
  uid: string;
  characterId: string;
  debt: DebtState;
  treasury: TreasuryState;
  comparisons: PriceComparison[];
  updatedAt?: unknown;
};
