import type { Lang } from './types';

export type ViewKey = 'home' | 'split' | 'debt' | 'treasury' | 'compare' | 'character';
export type SheetKey = 'profile' | 'newBoard' | 'expense' | 'recovery' | 'dragon' | 'strike' | 'treasury' | 'compare' | 'offer' | null;
export type AuthMode = 'in' | 'up';

export const copy = {
  th: {
    username: 'ชื่อผู้ใช้',
    password: 'รหัสผ่าน',
    displayName: 'ชื่อที่แสดง',
    signIn: 'เข้าสู่ระบบ',
    signUp: 'สร้างบัญชี',
    signOut: 'ออกจากระบบ',
    createCharacter: 'สร้างตัวละคร',
    noBoards: 'ยังไม่มีบอร์ดที่ผูกกับ Character ID นี้',
    makeBoard: 'สร้างบอร์ดใหม่',
    addExpense: 'เพิ่มรายการ',
    amount: 'จำนวนเงิน',
    description: 'รายละเอียด',
    paidBy: 'คนจ่าย',
    splitTitle: 'แบ่งค่าใช้จ่าย',
    debtTitle: 'มังกรหนี้',
    treasuryTitle: 'คลังหลวง',
    compareTitle: 'เปรียบเทียบราคา',
    homeTitle: 'ศูนย์บัญชีกิลด์',
    saved: 'บันทึกบน Firebase',
    addDragon: 'เพิ่มมังกร',
    strike: 'จู่โจม',
    addTreasury: 'ลงบันทึก',
    addCompare: 'เพิ่มสินค้า',
    addOffer: 'เพิ่มข้อเสนอ',
  },
  en: {
    username: 'Username',
    password: 'Password',
    displayName: 'Display name',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    createCharacter: 'Create Character',
    noBoards: 'No boards are linked to this Character ID yet',
    makeBoard: 'New Board',
    addExpense: 'Add Expense',
    amount: 'Amount',
    description: 'Description',
    paidBy: 'Paid by',
    splitTitle: 'Split Expenses',
    debtTitle: 'Debt Dragon',
    treasuryTitle: 'Personal Treasury',
    compareTitle: 'Merchant Showdown',
    homeTitle: 'Quest Hub',
    saved: 'Saved to Firebase',
    addDragon: 'Add Dragon',
    strike: 'Strike',
    addTreasury: 'Log Expense',
    addCompare: 'Add Item',
    addOffer: 'Add Offer',
  },
};

export const tabs: Array<{ key: ViewKey; glyph: string; th: string; en: string; accent: string }> = [
  { key: 'home', glyph: 'castle', th: 'หน้าหลัก', en: 'Home', accent: '#2f8f5b' },
  { key: 'split', glyph: 'scales', th: 'แบ่งเงิน', en: 'Split', accent: '#2f8f5b' },
  { key: 'debt', glyph: 'dragon', th: 'มังกร', en: 'Debt', accent: '#cf4633' },
  { key: 'treasury', glyph: 'vault', th: 'คลัง', en: 'Treasury', accent: '#a8842d' },
  { key: 'compare', glyph: 'merchant', th: 'ดีล', en: 'Compare', accent: '#2a7fb8' },
];

export function t(lang: Lang) {
  return copy[lang];
}
