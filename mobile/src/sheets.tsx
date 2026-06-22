import { useEffect, useState, type ReactNode } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { avatarFor } from './assets';
import { DRAGON_TYPES } from './gameLogic';
import { palette, ui } from './theme';
import type { Account, CharacterProfile, CharacterRecord, DebtDragon, Lang, TripState } from './types';
import { formatMoney, Stat } from './ui';

export function Sheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <View style={styles.modalBackdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        {children}
      </View>
    </View>
  );
}

export function ProfileSheet({ visible, account, character, profile, busy, onClose, onRegenerateRecovery, onSignOut }: {
  visible: boolean;
  account: Account;
  character: CharacterRecord;
  profile: CharacterProfile | null;
  busy: boolean;
  onClose: () => void;
  onRegenerateRecovery: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Sheet onClose={onClose}>
        <Image source={avatarFor(character)} style={styles.sheetAvatar} />
        <Text style={ui.h1}>{character.name}</Text>
        <Text style={ui.muted}>{account.username} · User #{account.userId} · Character #{character.id}</Text>
        <View style={styles.recoveryBox}>
          <Text style={ui.h2}>Recovery ID</Text>
          <Text style={styles.recoveryCode}>{account.recoveryCode || 'Not stored yet'}</Text>
          <Pressable style={[ui.ghostButton, busy && styles.disabled]} disabled={busy} onPress={onRegenerateRecovery}>
            <Text>{busy ? '...' : 'Regenerate Recovery ID'}</Text>
          </Pressable>
        </View>
        <View style={styles.statsRow}>
          <Stat label="XP" value={String(profile?.xp || 0)} />
          <Stat label="Level" value={String(profile?.level.lvl || 1)} />
          <Stat label="Boards" value={String(profile?.totals.boards || 0)} />
        </View>
        <Pressable style={ui.ghostButton} onPress={async () => { await onSignOut(); onClose(); }}><Text>Sign Out</Text></Pressable>
      </Sheet>
    </Modal>
  );
}

export function BoardSheet({ visible, busy, lang, onClose, onCreate }: { visible: boolean; busy: boolean; lang: Lang; onClose: () => void; onCreate: (name: string) => Promise<void> }) {
  const [name, setName] = useState('');
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Sheet onClose={onClose}>
        <Text style={ui.h1}>{lang === 'en' ? 'New Board' : 'สร้างบอร์ดใหม่'}</Text>
        <TextInput style={ui.input} value={name} onChangeText={setName} placeholder="New Quest Board" />
        <Pressable style={[ui.primaryButton, busy && styles.disabled]} disabled={busy} onPress={() => onCreate(name)}>
          <Text style={ui.primaryText}>{busy ? '...' : lang === 'en' ? 'Create Board' : 'สร้างบอร์ด'}</Text>
        </Pressable>
      </Sheet>
    </Modal>
  );
}

export function ExpenseSheet({ visible, busy, lang, trip, onClose, onCreate }: {
  visible: boolean;
  busy: boolean;
  lang: Lang;
  trip: TripState | null;
  onClose: () => void;
  onCreate: (desc: string, amount: number, paidBy: string) => Promise<void>;
}) {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  useEffect(() => setPaidBy(trip?.participants[0] || ''), [trip]);
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Sheet onClose={onClose}>
        <Text style={ui.h1}>{lang === 'en' ? 'Add Expense' : 'เพิ่มรายการ'}</Text>
        <TextInput style={ui.input} value={desc} onChangeText={setDesc} placeholder={lang === 'en' ? 'Description' : 'รายละเอียด'} />
        <TextInput style={ui.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder={lang === 'en' ? 'Amount' : 'จำนวนเงิน'} />
        <View style={styles.wrap}>
          {(trip?.participants || []).map((name) => (
            <Pressable key={name} style={[styles.pill, paidBy === name && styles.pillOn]} onPress={() => setPaidBy(name)}><Text>{name}</Text></Pressable>
          ))}
        </View>
        <Pressable style={[ui.primaryButton, busy && styles.disabled]} disabled={busy || !trip} onPress={() => onCreate(desc || 'New expense', Number(amount) || 0, paidBy)}>
          <Text style={ui.primaryText}>{busy ? '...' : lang === 'en' ? 'Save Expense' : 'บันทึก'}</Text>
        </Pressable>
      </Sheet>
    </Modal>
  );
}

export function RecoverySheet({ visible, code, onClose }: { visible: boolean; code: string; onClose: () => void }) {
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Sheet onClose={onClose}>
        <Text style={ui.h1}>Recovery ID</Text>
        <Text style={ui.muted}>Keep this code. Old regenerated codes become invalid.</Text>
        <Text style={styles.recoveryCode}>{code}</Text>
        <Pressable style={ui.primaryButton} onPress={onClose}><Text style={ui.primaryText}>OK</Text></Pressable>
      </Sheet>
    </Modal>
  );
}

export function DragonSheet({ visible, busy, lang, onClose, onCreate }: { visible: boolean; busy: boolean; lang: Lang; onClose: () => void; onCreate: (input: { name: string; type: DebtDragon['type']; balance: number; apr: number; payment: number }) => Promise<void> }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<DebtDragon['type']>('card');
  const [balance, setBalance] = useState('');
  const [apr, setApr] = useState('');
  const [payment, setPayment] = useState('');
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Sheet onClose={onClose}>
        <Text style={ui.h1}>{lang === 'en' ? 'Add Dragon' : 'เพิ่มมังกร'}</Text>
        <TextInput style={ui.input} value={name} onChangeText={setName} placeholder={lang === 'en' ? 'Debt name' : 'ชื่อหนี้'} />
        <View style={styles.wrap}>
          {(Object.keys(DRAGON_TYPES) as DebtDragon['type'][]).map((id) => (
            <Pressable key={id} style={[styles.pill, type === id && styles.pillOn]} onPress={() => setType(id)}><Text>{DRAGON_TYPES[id][lang]}</Text></Pressable>
          ))}
        </View>
        <TextInput style={ui.input} value={balance} onChangeText={setBalance} keyboardType="decimal-pad" placeholder={lang === 'en' ? 'Balance' : 'ยอดคงเหลือ'} />
        <TextInput style={ui.input} value={apr} onChangeText={setApr} keyboardType="decimal-pad" placeholder="APR %" />
        <TextInput style={ui.input} value={payment} onChangeText={setPayment} keyboardType="decimal-pad" placeholder={lang === 'en' ? 'Monthly payment' : 'จ่ายต่อเดือน'} />
        <Pressable style={[ui.primaryButton, busy && styles.disabled]} disabled={busy} onPress={() => onCreate({ name, type, balance: Number(balance) || 0, apr: Number(apr) || 0, payment: Number(payment) || 0 })}>
          <Text style={ui.primaryText}>{busy ? '...' : lang === 'en' ? 'Save Dragon' : 'บันทึกมังกร'}</Text>
        </Pressable>
      </Sheet>
    </Modal>
  );
}

export function StrikeSheet({ visible, busy, lang, dragon, onClose, onStrike }: { visible: boolean; busy: boolean; lang: Lang; dragon: DebtDragon | null; onClose: () => void; onStrike: (amount: number) => Promise<void> }) {
  const [amount, setAmount] = useState('');
  useEffect(() => setAmount(dragon?.payment ? String(Math.round(dragon.payment)) : ''), [dragon]);
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Sheet onClose={onClose}>
        <Text style={ui.h1}>{lang === 'en' ? 'Strike' : 'จู่โจม'}</Text>
        <Text style={ui.muted}>{dragon?.name} · ฿{formatMoney(dragon?.balance || 0)}</Text>
        <TextInput style={ui.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder={lang === 'en' ? 'Amount' : 'จำนวนเงิน'} />
        <Pressable style={[ui.primaryButton, busy && styles.disabled]} disabled={busy || !dragon} onPress={() => onStrike(Number(amount) || 0)}>
          <Text style={ui.primaryText}>{busy ? '...' : lang === 'en' ? 'Save Strike' : 'บันทึกการโจมตี'}</Text>
        </Pressable>
      </Sheet>
    </Modal>
  );
}

export function TreasurySheet({ visible, busy, lang, onClose, onSave }: { visible: boolean; busy: boolean; lang: Lang; onClose: () => void; onSave: (input: { name: string; category: string; amount: number; income?: number }) => Promise<void> }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('general');
  const [amount, setAmount] = useState('');
  const [income, setIncome] = useState('');
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Sheet onClose={onClose}>
        <Text style={ui.h1}>{lang === 'en' ? 'Treasury Log' : 'ลงบันทึกคลัง'}</Text>
        <TextInput style={ui.input} value={income} onChangeText={setIncome} keyboardType="decimal-pad" placeholder={lang === 'en' ? 'Monthly income (optional)' : 'รายรับต่อเดือน (ไม่บังคับ)'} />
        <TextInput style={ui.input} value={name} onChangeText={setName} placeholder={lang === 'en' ? 'Expense name' : 'ชื่อรายการ'} />
        <TextInput style={ui.input} value={category} onChangeText={setCategory} placeholder={lang === 'en' ? 'Category' : 'หมวด'} />
        <TextInput style={ui.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder={lang === 'en' ? 'Amount' : 'จำนวนเงิน'} />
        <Pressable style={[ui.primaryButton, busy && styles.disabled]} disabled={busy} onPress={() => onSave({ name, category, amount: Number(amount) || 0, income: income ? Number(income) || 0 : undefined })}>
          <Text style={ui.primaryText}>{busy ? '...' : lang === 'en' ? 'Save Log' : 'บันทึก'}</Text>
        </Pressable>
      </Sheet>
    </Modal>
  );
}

export function CompareSheet({ visible, busy, lang, onClose, onCreate }: { visible: boolean; busy: boolean; lang: Lang; onClose: () => void; onCreate: (name: string, unit: string) => Promise<void> }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('pcs');
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Sheet onClose={onClose}>
        <Text style={ui.h1}>{lang === 'en' ? 'Add Item' : 'เพิ่มสินค้า'}</Text>
        <TextInput style={ui.input} value={name} onChangeText={setName} placeholder={lang === 'en' ? 'Item name' : 'ชื่อสินค้า'} />
        <View style={styles.wrap}>
          {['pcs', 'ml', 'g'].map((item) => <Pressable key={item} style={[styles.pill, unit === item && styles.pillOn]} onPress={() => setUnit(item)}><Text>{item}</Text></Pressable>)}
        </View>
        <Pressable style={[ui.primaryButton, busy && styles.disabled]} disabled={busy} onPress={() => onCreate(name, unit)}>
          <Text style={ui.primaryText}>{busy ? '...' : lang === 'en' ? 'Save Item' : 'บันทึกสินค้า'}</Text>
        </Pressable>
      </Sheet>
    </Modal>
  );
}

export function OfferSheet({ visible, busy, lang, onClose, onCreate }: { visible: boolean; busy: boolean; lang: Lang; onClose: () => void; onCreate: (input: { merchant: string; price: number; qty: number; unit: string }) => Promise<void> }) {
  const [merchant, setMerchant] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('pcs');
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Sheet onClose={onClose}>
        <Text style={ui.h1}>{lang === 'en' ? 'Add Offer' : 'เพิ่มข้อเสนอ'}</Text>
        <TextInput style={ui.input} value={merchant} onChangeText={setMerchant} placeholder={lang === 'en' ? 'Merchant' : 'ร้านค้า'} />
        <TextInput style={ui.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder={lang === 'en' ? 'Price' : 'ราคา'} />
        <TextInput style={ui.input} value={qty} onChangeText={setQty} keyboardType="decimal-pad" placeholder={lang === 'en' ? 'Quantity' : 'จำนวน'} />
        <TextInput style={ui.input} value={unit} onChangeText={setUnit} placeholder="pcs/ml/g/kg/l" />
        <Pressable style={[ui.primaryButton, busy && styles.disabled]} disabled={busy} onPress={() => onCreate({ merchant, price: Number(price) || 0, qty: Number(qty) || 0, unit })}>
          <Text style={ui.primaryText}>{busy ? '...' : lang === 'en' ? 'Save Offer' : 'บันทึกข้อเสนอ'}</Text>
        </Pressable>
      </Sheet>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(24,17,10,.42)' },
  sheet: { backgroundColor: palette.bg, padding: 20, paddingBottom: 34, borderTopLeftRadius: 26, borderTopRightRadius: 26, gap: 12, borderTopWidth: 1, borderColor: palette.line },
  grabber: { alignSelf: 'center', width: 46, height: 5, borderRadius: 999, backgroundColor: '#cbb98f', marginBottom: 4 },
  sheetAvatar: { width: 88, height: 88, borderRadius: 22, alignSelf: 'center', borderWidth: 3, borderColor: palette.gold },
  recoveryBox: { borderRadius: 16, padding: 14, backgroundColor: palette.card2, gap: 8 },
  recoveryCode: { color: palette.ink, fontSize: 20, fontWeight: '900', letterSpacing: 1.1 },
  statsRow: { flexDirection: 'row', gap: 10 },
  disabled: { opacity: 0.55 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 20, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line },
  pillOn: { backgroundColor: '#d8efe0', borderColor: palette.accent },
});
