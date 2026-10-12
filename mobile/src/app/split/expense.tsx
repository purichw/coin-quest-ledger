import { useCallback, useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { Action, ErrorNote, Field, ui } from '../../auth/ui';
import { canon } from '../../domain/canon';
import { validateExpense } from '../../ledger/contracts';
import { changeBoard, loadBoard, makeId } from '../../ledger/service';
import { pickReceipt } from '../../ledger/files';
import { DateField } from '../../player/DateField';
import type { Board, Expense, LootItem, SplitMode } from '../../ledger/types';
import { Body, Card, Choice, confirm, LoadError, Loading, money, number, p, Page, PlayerGate, today, useLoad, useWork, type Player } from '../../player/ui';

const modes: [SplitMode, string][] = [['equal', 'เท่ากัน'], ['shares', 'ตามสัดส่วน'], ['exact', 'ระบุยอด'], ['percent', 'เปอร์เซ็นต์'], ['items', 'แยกของ']];
export default function ExpenseRoute() { const { id, expenseId } = useLocalSearchParams<{ id: string; expenseId?: string }>(); return <PlayerGate>{player => <LoadExpense {...player} id={id} expenseId={expenseId} />}</PlayerGate>; }
function LoadExpense(player: Player & { id: string; expenseId?: string }) {
  const loader = useCallback(() => loadBoard(player.id), [player.id]); const load = useLoad(loader);
  if (!load.data) return load.error ? <LoadError error={load.error} retry={load.reload} /> : <Loading />;
  const expense = load.data.expenses.find(e => String(e.id) === player.expenseId);
  if (player.expenseId && !expense) return <LoadError error="รายการนี้ถูกเปลี่ยนหรือนำออกแล้ว" retry={load.reload} />;
  return <ExpenseForm {...player} board={load.data} original={expense} />;
}
function ExpenseForm({ account, id, board, original }: Player & { id: string; board: Board; original?: Expense }) {
  const work = useWork(); const [entryId] = useState(() => original?.id || makeId());
  const [desc, setDesc] = useState(original?.desc || ''); const [amount, setAmount] = useState(original ? String(original.amount) : '');
  const [date, setDate] = useState(original?.date?.slice(0, 10) || today());
  const [mode, setMode] = useState<SplitMode>(original?.split?.mode || 'equal');
  const [payers, setPayers] = useState<Record<string, string>>(Object.fromEntries(Object.entries(original ? canon.payerMap(original) : {}).map(([k, v]) => [k, String(v)])));
  const [payer, setPayer] = useState(original?.paidBy || board.participants[0] || ''); const [multi, setMulti] = useState(!!original?.payers && Object.keys(original.payers).length > 1);
  const [shared, setShared] = useState(original?.sharedBy || board.participants);
  const [weights, setWeights] = useState<Record<string, string>>(Object.fromEntries(Object.entries(original?.split?.weights || {}).map(([k, v]) => [k, String(v)])));
  const [items, setItems] = useState<LootItem[]>(original?.split?.items || []);
  const [itemName, setItemName] = useState(''); const [itemAmount, setItemAmount] = useState(''); const [claimers, setClaimers] = useState<string[]>([]);
  const [receipt, setReceipt] = useState(original?.receipt || '');
  const toggle = (name: string, list: string[], set: (v: string[]) => void) => set(list.includes(name) ? list.filter(n => n !== name) : [...list, name]);
  const total = mode === 'items' ? items.reduce((s, i) => s + i.amount, 0) : number(amount);
  const draft: Expense = { ...original, id: entryId, desc: desc.trim(), amount: total, icon: original?.icon || 'coin',
    paidBy: multi ? Object.keys(payers).find(n => number(payers[n]) > 0) || '' : payer,
    payers: multi ? Object.fromEntries(Object.entries(payers).filter(([, v]) => number(v) > 0).map(([k, v]) => [k, number(v)])) : undefined,
    sharedBy: shared, split: { mode, ...(mode === 'items' ? { items } : { weights: Object.fromEntries(shared.map(n => [n, number(weights[n] || '0')])) }) }, date, receipt };
  let previewShares: Record<string, number> | null = null;
  try {
    canon.validateLedgerExpense({ ...draft, desc: draft.desc || 'รายการ' }, board.participants);
    previewShares = canon.splitShares(draft, board.participants);
  } catch { /* Incomplete drafts have no valid split preview yet. */ }
  return <Page><Stack.Screen options={{ title: original ? 'แก้ไขรายการจ่าย' : 'เพิ่มรายการจ่าย', headerBackButtonDisplayMode: 'minimal' }} />
    <Card><Field label="ชื่อรายการ" value={desc} onChangeText={setDesc} placeholder="เช่น มื้อค่ำ" maxLength={120} />{mode !== 'items' && <Field label="จำนวนเงิน (บาท)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />}<DateField value={date} onChange={setDate} /></Card>
    <Card title="แบ่งกันแบบไหน"><View style={p.choices}>{modes.map(([value, label]) => <Choice key={value} label={label} selected={mode === value} onPress={() => setMode(value)} />)}</View><Body>ผู้ร่วมจ่าย</Body><View style={p.choices}>{board.participants.map(n => <Choice multiple key={n} label={n} selected={shared.includes(n)} onPress={() => toggle(n, shared, setShared)} />)}</View>
      {['shares', 'exact', 'percent'].includes(mode) && shared.map(n => <Field key={n} label={`${n} · ${mode === 'percent' ? '%' : mode === 'shares' ? 'ส่วน' : 'บาท'}`} value={weights[n] || ''} onChangeText={v => setWeights({ ...weights, [n]: v })} keyboardType="decimal-pad" />)}
      {mode === 'items' && <><Field label="ชื่อของ" value={itemName} onChangeText={setItemName} /><Field label="ราคาของ (บาท)" value={itemAmount} onChangeText={setItemAmount} keyboardType="decimal-pad" /><Body>ผู้รับของ · ไม่เลือกหมายถึงทุกคนที่ร่วมจ่าย</Body><View style={p.choices}>{shared.map(n => <Choice multiple key={n} label={`รับของ: ${n}`} selected={claimers.includes(n)} onPress={() => toggle(n, claimers, setClaimers)} />)}</View><Action title="เพิ่มของในรายการ" secondary onPress={() => { try { const name = canon.validateText(itemName, { label: 'ชื่อของ', max: 120 }); const amount = canon.validateNumber(itemAmount, { label: 'ราคาของ', min: .01 }); setItems([...items, { name, amount, claimedBy: claimers }]); setItemName(''); setItemAmount(''); setClaimers([]); work.setError(''); } catch (error) { work.setError(error instanceof Error ? error.message : 'ตรวจชื่อและราคาของ'); } }} />{items.map((item, index) => <View key={index}><Body>{item.name} · {money(item.amount)} · {item.claimedBy.join(', ') || 'ทุกคน'}</Body><Action title={`นำ ${item.name} ออกจากร่าง`} secondary onPress={() => setItems(items.filter((_, i) => i !== index))} /></View>)}</>}
    </Card>
    <Card title="ใครสำรองจ่าย"><View style={p.choices}><Choice label="คนเดียว" selected={!multi} onPress={() => setMulti(false)} /><Choice label="หลายคน" selected={multi} onPress={() => setMulti(true)} /></View>{multi ? board.participants.map(n => <Field key={n} label={`${n} จ่าย (บาท)`} value={payers[n] || ''} onChangeText={v => setPayers({ ...payers, [n]: v })} keyboardType="decimal-pad" />) : <View style={p.choices}>{board.participants.map(n => <Choice key={n} label={`ผู้จ่าย: ${n}`} selected={payer === n} onPress={() => setPayer(n)} />)}</View>}</Card>
    <Card title="ใบเสร็จ">{!!receipt && <><Image accessibilityLabel="ใบเสร็จแนบ" source={{ uri: receipt }} style={{ width: '100%', height: 240 }} resizeMode="contain" /><Action title="นำรูปออกจากร่าง" secondary onPress={() => setReceipt('')} /></>}<Action title="เลือกรูปใบเสร็จ" secondary busy={work.busy} onPress={() => void work.run(async () => { const image = await pickReceipt(); if (image) setReceipt(image); })} /><Action title="ถ่ายรูปใบเสร็จ" secondary busy={work.busy} onPress={() => void work.run(async () => { const image = await pickReceipt(true); if (image) setReceipt(image); })} /></Card>
    <Card title="สรุปส่วนแบ่ง">{previewShares ? <><Text style={ui.value}>รวม {money(total)}</Text>{Object.entries(previewShares).map(([n, sum]) => <Body key={n}>{n} · {money(sum)}</Body>)}</> : <Body>กรอกยอด ผู้จ่าย และส่วนแบ่งให้ครบเพื่อดูสรุป</Body>}</Card>
    <ErrorNote message={work.error} /><Action title="บันทึกรายการ" busy={work.busy} onPress={() => void work.run(async () => {
      validateExpense(draft, board);
      if (multi && Object.values(payers).some(v => v.trim() && (!Number.isFinite(number(v)) || number(v) < 0))) throw new Error('ยอดผู้จ่ายต้องเป็นตัวเลขไม่ติดลบ');
      await changeBoard(id, account, current => { validateExpense(draft, current); const prior = current.expenses.find(e => e.id === entryId); if (original && canon.tripContentKey(prior) !== canon.tripContentKey(original)) throw new Error('มีการแก้ไขรายการนี้จากอีกเครื่อง กรุณาเปิดรายการใหม่'); return { ...current, expenses: prior ? current.expenses.map(e => e.id === entryId ? draft : e) : [...current.expenses, draft] }; }); router.back();
    })} />
    {original && <Action title="นำรายการออก" secondary busy={work.busy} onPress={() => confirm('นำรายการออก?', 'รายการจะอยู่ในถังรายการของบอร์ดและกู้คืนได้', () => void work.run(async () => { await changeBoard(id, account, current => ({ ...current, expenses: current.expenses.filter(e => e.id !== original.id), expenseTrash: [...(current.expenseTrash || []), ...current.expenses.filter(e => e.id === original.id)] })); router.back(); }), 'นำออก')} />}
  </Page>;
}
