import { canon } from '../domain/canon.ts';
import { label, type Comparison, type Dragon, type Treasury, type TreasuryCategory } from './types.ts';

export type DebtFilter = 'all' | 'active' | 'due' | 'paid' | 'archived';
export type DebtSort = 'added' | 'balance' | 'apr';
export type PriceFilter = 'all' | 'active' | 'archived';
export type PriceSort = 'latest' | 'name' | 'saving';
export type CategoryFilter = 'all' | 'normal' | 'near' | 'over';
const queryText = (value: string) => value.trim().toLocaleLowerCase();

// Same calendar/payment rule as debt/app.js dueStatus and matchesDebtFilter.
// This is a list predicate only: it never accrues interest or changes a debt.
export function matchesDebtFilter(dragon: Dragon, filter: DebtFilter, today = new Date()) {
  if (filter === 'archived') return !!dragon.archived;
  if (dragon.archived) return false;
  if (filter === 'active') return !dragon.slain;
  if (filter === 'paid') return dragon.slain;
  if (filter !== 'due') return true;
  if (dragon.payMode === 'adhoc' || !dragon.dueDay || dragon.slain) return false;
  const year = today.getFullYear(); const month = today.getMonth();
  const paidThisMonth = dragon.log.some(row => {
    const date = new Date(row.ts || 0);
    return date.getFullYear() === year && date.getMonth() === month;
  });
  const dueDay = canon.clampedDueDay(year, month, dragon.dueDay);
  if (!paidThisMonth && today.getDate() > dueDay) return true;
  const due = paidThisMonth ? canon.dueDateForMonth(year, month + 1, dragon.dueDay) : new Date(year, month, dueDay);
  return Math.round((canon.dateOnlyMs(due) - canon.dateOnlyMs(today)) / 86400000) <= 7;
}

export function visibleDebts(dragons: Dragon[], filter: DebtFilter, query: string, sort: DebtSort, today = new Date()) {
  const search = queryText(query);
  const rows = dragons.filter(dragon => matchesDebtFilter(dragon, filter, today) && `${label(dragon.name)} ${(canon.DRAGON_TYPES[dragon.type] || canon.DRAGON_TYPES.card).th}`.toLocaleLowerCase().includes(search));
  if (sort === 'balance') rows.sort((a, b) => b.balance - a.balance);
  if (sort === 'apr') rows.sort((a, b) => b.apr - a.apr);
  return rows;
}

// "Latest" retains saved source order, matching shared/price-arena.js.
export function visibleComparisons(comparisons: Comparison[], filter: PriceFilter, query: string, sort: PriceSort) {
  const search = queryText(query);
  const rows = comparisons.filter(item => (filter === 'all' || (filter === 'archived' ? item.archived : !item.archived)) && item.name.toLocaleLowerCase().includes(search));
  if (sort === 'name') rows.sort((a, b) => a.name.localeCompare(b.name, 'th-TH'));
  if (sort === 'saving') rows.sort((a, b) => (canon.rankOffers(b.offers, b)[0]?.savePct || 0) - (canon.rankOffers(a.offers, a)[0]?.savePct || 0));
  return rows;
}

export function categorySpent(state: Treasury, categoryId: string) {
  return state.expenses.filter(expense => expense.catId === categoryId).reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
}

// Exact thresholds from treasury/app.js categoryStatus (100% is still near).
export function categoryStatus(state: Treasury, category: TreasuryCategory): Exclude<CategoryFilter, 'all'> {
  const spent = categorySpent(state, category.id); const budget = Number(category.budget) || 0;
  return spent > budget ? 'over' : budget > 0 && spent / budget >= .8 ? 'near' : 'normal';
}

export function visibleCategories(state: Treasury, filter: CategoryFilter, query: string) {
  const search = queryText(query);
  return state.categories.filter(category => (filter === 'all' || categoryStatus(state, category) === filter) && label(category.name).toLocaleLowerCase().includes(search));
}
