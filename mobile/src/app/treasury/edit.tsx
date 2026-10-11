import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Action, ErrorNote, Field } from '../../auth/ui';
import { makeId } from '../../ledger/service';
import { archiveTreasuryCategory, removeTreasuryExpense, saveTreasuryExpense } from '../../modules/contracts';
import { changeModule } from '../../modules/service';
import { useModule } from '../../modules/useModule';
import { label, type Label, type ModuleSnapshot } from '../../modules/types';
import { DateField } from '../../player/DateField';
import { Body, Card, Choice, confirm, LoadError, Loading, number, p, Page, PlayerGate, today, useWork, type Player } from '../../player/ui';
type Params = { kind: string; id?: string; billId?: string };
export default function EditRoute() { const params = useLocalSearchParams<Params>(); return <PlayerGate>{p => <LoadEditor {...p} {...params} />}</PlayerGate>; }
function LoadEditor(props: Player & Params) { const load = useModule('treasury', props.account); if (!load.data) return load.error ? <LoadError error={load.error} retry={load.reload} /> : <Loading />; return <Editor key={load.data.baseline} {...props} initial={load.data} />; }
function Editor({ account, kind, id, billId, initial }: Player & Params & { initial: ModuleSnapshot<'treasury'> }) {
  const state = initial.data; const isCategory = kind === 'category'; const isBill = kind === 'bill'; const expense = state.expenses.find(e => e.id === id); const category = state.categories.find(c => c.id === id); const bill = state.bills.find(b => b.id === (billId || id));
  const work = useWork(); const [entryId] = useState(id || makeId()); const [name, setName] = useState(isCategory ? label(category?.name || '') : isBill || billId ? label(bill?.name || '') : expense?.note || '');
  const [amount, setAmount] = useState(String((isCategory ? category?.budget : isBill || billId ? bill?.amount : expense?.amount) ?? '')); const [catId, setCatId] = useState((isBill || billId ? bill?.catId : expense?.catId) || state.categories[0]?.id || '');
  const [glyph, setGlyph] = useState((isCategory ? category?.glyph : bill?.glyph) || '📦'); const [monster, setMonster] = useState(label((category?.monster || '') as Label));
  const [due, setDue] = useState(String(bill?.dueDay || 1)); const [date, setDate] = useState(expense?.date || today());
  const title = isCategory ? 'หมวดงบประมาณ' : isBill ? 'บิลประจำ' : billId ? 'บันทึกจ่ายบิล' : 'รายจ่าย';
  async function save() {
    if (!name.trim() || name.length > 120) throw new Error('ใส่ชื่อหรือรายละเอียด 1–120 ตัวอักษร');
    const value = number(amount); if (!Number.isFinite(value) || value < (isCategory ? 0 : .01)) throw new Error('ตรวจจำนวนเงิน');
    if (isBill && (!Number.isInteger(number(due)) || number(due) < 1 || number(due) > 31)) throw new Error('วันครบกำหนดต้องเป็น 1–31');
    await changeModule('treasury', account, initial, s => {
      if (isCategory) { const data = { ...category, id: entryId, name: { th: name.trim(), en: name.trim() }, budget: value, glyph, monster: { th: monster.trim() || name.trim(), en: monster.trim() || name.trim() } }; return { ...s, categories: id ? s.categories.map(c => c.id === id ? data : c) : [...s.categories, data] }; }
      if (isBill) { if (!s.categories.some(c => c.id === catId)) throw new Error('เลือกหมวดรายจ่าย'); const data = { ...bill, id: entryId, name: { th: name.trim(), en: name.trim() }, amount: value, glyph, catId, dueDay: number(due) }; return { ...s, bills: id ? s.bills.map(b => b.id === id ? data : b) : [...s.bills, data] }; }
      const linked = billId ? bill : s.bills.find(b => b.id === expense?.billId); const [year, month, day] = date.split('-').map(Number);
      return saveTreasuryExpense(s, { ...expense, id: entryId, note: name.trim(), amount: value, catId, date, ...(linked ? { billId: linked.id, onTime: day <= Math.min(linked.dueDay, new Date(year, month, 0).getDate()) } : {}) });
    }); router.back();
  }
  return <Page><Stack.Screen options={{ title }} /><Card title={title}><Field label={isCategory || isBill ? 'ชื่อ' : 'รายละเอียดรายจ่าย'} value={name} onChangeText={setName} maxLength={120} /><Field label={isCategory ? 'งบต่อเดือน (บาท)' : 'จำนวนเงิน (บาท)'} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
    {isCategory || isBill ? <View style={p.choices}>{['🏠', '🍜', '🛵', '🎮', '🛍️', '💊', '✈️', '🎓', '🎁', '💡', '📦', '📜', '⚡', '📶'].map(g => <Choice key={g} label={g} selected={glyph === g} onPress={() => setGlyph(g)} />)}</View> : <DateField label="วันที่จ่าย" value={date} onChange={setDate} />}
    {isCategory ? <Field label="ชื่อสัตว์ร้ายประจำหมวด" value={monster} onChangeText={setMonster} maxLength={80} /> : <View style={p.choices}>{state.categories.map(c => <Choice key={c.id} label={label(c.name)} selected={catId === c.id} onPress={() => setCatId(c.id)} />)}</View>}
    {isBill && <Field label="วันครบกำหนด 1–31" value={due} onChangeText={setDue} keyboardType="number-pad" maxLength={2} />}
    {billId && <Body>บันทึกบิลที่จ่ายแล้ว ยอดจะรวมในรายจ่ายเดือนนี้</Body>}<Action title={billId ? 'บันทึกจ่ายบิล' : `บันทึก${title}`} busy={work.busy} onPress={() => void work.run(save)} />
    {id && <Action title={`เก็บ${title}นี้`} secondary busy={work.busy} onPress={() => confirm('เก็บรายการนี้?', 'ข้อมูลจะอยู่ในรายการที่เก็บไว้ กู้คืนได้จากคลังหลวง', () => void work.run(async () => { await changeModule('treasury', account, initial, s => isCategory ? archiveTreasuryCategory(s, id) : isBill ? { ...s, bills: s.bills.map(b => b.id === id ? { ...b, archived: true } : b) } : removeTreasuryExpense(s, id)); router.back(); }))} />}
  </Card><ErrorNote message={work.error} /></Page>;
}
