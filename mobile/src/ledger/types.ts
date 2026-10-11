export type SplitMode = 'equal' | 'shares' | 'exact' | 'percent' | 'items';
export type LootItem = { name: string; amount: number; claimedBy: string[] };
export type Expense = {
  id: string | number; desc: string; icon: string; amount: number;
  paidBy: string; payers?: Record<string, number>; sharedBy: string[];
  split?: { mode: SplitMode; weights?: Record<string, number>; items?: LootItem[] };
  date?: string; receipt?: string; [key: string]: unknown;
};
export type Campaign = {
  id: string; tripName: string; participants: string[]; expenses: Expense[];
  budgets: Record<string, number>; heroClasses: Record<string, string>;
  heroGenders: Record<string, string>; heroSkins: Record<string, string>;
  characterIds: Record<string, string>; guestHeroes: Record<string, boolean>;
  promptpay: Record<string, string>; settleXp: Record<string, number>;
  expenseTrash?: Expense[]; removedMembers?: string[];
  settlementRecords?: (Transfer & { revision: string; at: number })[];
  createdAt: unknown; completedAt: unknown; [key: string]: unknown;
};
export type Board = Omit<Campaign, 'id' | 'createdAt' | 'completedAt'> & {
  tripName: string; participants: string[]; expenses: Expense[];
  budgets: Record<string, number>; heroClasses: Record<string, string>;
  heroGenders: Record<string, string>; heroSkins: Record<string, string>;
  characterIds: Record<string, string>; guestHeroes: Record<string, boolean>;
  promptpay: Record<string, string>; settleXp: Record<string, number>;
  activeCampaignId: string; campaigns: Campaign[];
  admin: { passwordHash: string; ownerHash: string; adminId: string; adminName: string; characterId: string; createdAt: unknown; urlLocked: boolean; [key: string]: unknown };
  access?: { ownerUids: string[]; memberUids: string[]; memberCharacterIds: string[]; [key: string]: unknown };
  settings: Record<string, unknown>; updatedAt?: unknown;
  expenseTrash?: Expense[];
  removedMembers?: string[];
  settlementRecords?: (Transfer & { revision: string; at: number })[];
};
export type BoardRow = { id: string; data: Board };
export type HeroStat = { name: string; paid: number; share: number; bal: number; gen: number; xp: number; quests: number; budget: number; remaining: number; hp: number; level: { lvl: number; pct: number; into: number; need: number } };
export type Transfer = { from: string; to: string; amount: number };
export type Invite = { id: string; tripId: string; tripName: string; targetCharacterId: string; targetOwnerUid: string; targetName: string; targetClass: string; targetGender: string; targetSkin: string; inviterUid: string; inviterName: string; inviterCharacterId: string; status: string; createdAt: number; expiresAt: number; respondedAt?: number };
