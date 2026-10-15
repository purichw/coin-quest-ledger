import { useState } from 'react';
import { router, Stack } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Action, ErrorNote, Field, ui } from '../../auth/ui';
import { canon } from '../../domain/canon';
import { monthKey, saveTreasuryExpense } from '../../modules/contracts';
import { changeModule } from '../../modules/service';
import { useModule } from '../../modules/useModule';
import { label } from '../../modules/types';
import { ListTools } from '../../modules/ListTools';
import { categorySpent, categoryStatus, visibleCategories, type CategoryFilter } from '../../modules/list-filters';
import { fonts } from '../../theme/typography';
import { scenicStackOptions } from '../../player/navigation';
import { Body, Card, Choice, confirm, Disclosure, LoadError, Loading, money, p, Page, PlayerGate, Row, SceneHeader, Stats, useWork, type Player } from '../../player/ui';
export default function TreasuryRoute() { return <PlayerGate>{p => <TreasuryHome {...p} />}</PlayerGate>; }
const categoryFilters = [['all', 'ทั้งหมด'], ['normal', 'ปกติ'], ['near', 'ใกล้เกินงบ'], ['over', 'เกินงบ']] as const;
function TreasuryHome({ account }: Player) {
  const load = useModule('treasury', account); const work = useWork(); const [income, setIncome] = useState<string | null>(null);
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState<CategoryFilter>('all');
  if (!load.data) return load.error ? <LoadError error={load.error} retry={load.reload} /> : <Loading />;
  const snapshot = load.data; const state = snapshot.data; const forecast = canon.treasuryProjection(state); const currentMonth = monthKey();
  const edit = (kind: string, id?: string) => router.push({ pathname: '/treasury/edit', params: { kind, ...(id ? { id } : {}) } });
  const monthLabel = new Date(`${state.month}-01T12:00:00`).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  const categories = visibleCategories(state, filter, query); const resetCategories = () => { setQuery(''); setFilter('all'); };
  return <Page scene="treasury"><Stack.Screen options={{ ...scenicStackOptions, title: 'คลังหลวง' }} /><SceneHeader kind="treasury" title="คลังหลวง" subtitle={`${monthLabel} · ดูแลทองของเดือนนี้`} />
    {state.month !== currentMonth && <Card title="เริ่มเดือนปัจจุบัน"><Body>เก็บรายละเอียดเดือน {state.month} ก่อนเริ่ม {currentMonth} หมวดและบิลประจำจะตามไปด้วย</Body><Action title={`เริ่มเดือน ${currentMonth}`} busy={work.busy} onPress={() => void work.run(async () => load.setData(await changeModule('treasury', account, snapshot, s => canon.treasuryClose(s, currentMonth))))} /></Card>}
    <View style={styles.balance}><Image source={require('../../../../assets/treasury-reference/chest.webp')} style={styles.chest} resizeMode="contain" accessible={false} /><View style={styles.balanceText}><Text style={styles.balanceLabel}>เงินคงเหลือเดือนนี้</Text><Text style={styles.balanceNumber}>{money(state.income - forecast.spent)}</Text></View></View>
    <Card><Stats items={[["เงินเข้า", money(state.income), require('../../../../assets/treasury-reference/coins.webp')], ["ใช้ไป", money(forecast.spent), require('../../../../assets/treasury-reference/swords.webp')]]} /><Action title="บันทึกรายจ่าย" disabled={!state.categories.length} onPress={() => edit('expense')} />{!state.categories.length && <Body>เพิ่มหมวดงบประมาณด้านล่างก่อนบันทึกรายจ่าย</Body>}</Card>
    <Disclosure title="แก้ไขรายรับเดือนนี้"><Field label="รายรับเดือนนี้ (บาท)" value={income ?? String(state.income)} onChangeText={setIncome} keyboardType="decimal-pad" /><Action title="บันทึกรายรับ" secondary busy={work.busy} onPress={() => void work.run(async () => { const value = canon.validateNumber(income ?? String(state.income), { label: 'รายรับ' }); load.setData(await changeModule('treasury', account, snapshot, s => ({ ...s, income: value }))); setIncome(null); })} /></Disclosure>
    <Disclosure title={`หมวดงบประมาณ · ${state.categories.length}`} art={require('../../../../assets/treasury-reference/home.webp')} initiallyOpen={!state.categories.length}>
      {state.categories.length > 0 && <ListTools label="ค้นหาหมวดงบประมาณ" query={query} onQuery={setQuery} summary={categoryFilters.find(([value]) => value === filter)![1]} count={categories.length} changed={!!query || filter !== 'all'} onReset={resetCategories}><Text style={ui.label}>สถานะงบประมาณ</Text><View style={p.choices}>{categoryFilters.map(([value, text]) => <Choice key={value} label={`${text} (${state.categories.filter(category => value === 'all' || categoryStatus(state, category) === value).length})`} selected={filter === value} onPress={() => setFilter(value)} />)}</View><Body>ใกล้เกินงบเมื่อใช้ตั้งแต่ 80% ถึงเต็มวงเงิน เกินงบเมื่อใช้มากกว่าวงเงิน</Body></ListTools>}
      {categories.map(c => <Row key={c.id} title={`${c.glyph} ${label(c.name)}`} detail={`${money(categorySpent(state, c.id))} / ${money(c.budget)} · ${categoryFilters.find(([value]) => value === categoryStatus(state, c))![1]}`} onPress={() => edit('category', c.id)} />)}{!state.categories.length ? <Body>เพิ่มหมวดและวงเงินก่อนบันทึกรายจ่าย</Body> : !categories.length && <><Body>ไม่มีหมวดที่ตรงกับสถานะหรือคำค้นนี้</Body><Action title="ล้างคำค้นและตัวกรอง" secondary onPress={resetCategories} /></>}<Body>จัดสรรแล้ว {money(state.categories.reduce((sum, c) => sum + c.budget, 0))} จากรายรับ {money(state.income)}</Body><Action title="เพิ่มหมวดงบประมาณ" secondary onPress={() => edit('category')} />
    </Disclosure>
    <Disclosure title={`บิลประจำ · ${state.bills.filter(b => !b.archived).length}`}>{state.bills.filter(b => !b.archived).map(b => <View key={b.id} style={{ gap: 8 }}><Row title={`${b.glyph} ${label(b.name)}`} detail={`${money(b.amount)} · ครบกำหนดวันที่ ${b.dueDay} · ${canon.treasuryBillPaid(state, b.id) ? 'จ่ายแล้ว' : 'ยังไม่บันทึกจ่าย'}`} onPress={() => edit('bill', b.id)} />{!canon.treasuryBillPaid(state, b.id) && <Action title={`บันทึกจ่าย ${label(b.name)}`} secondary onPress={() => router.push({ pathname: '/treasury/edit', params: { kind: 'expense', billId: b.id } })} />}</View>)}<Action title="เพิ่มบิลประจำ" secondary disabled={!state.categories.length} onPress={() => edit('bill')} /></Disclosure>
    <Disclosure title={`รายจ่ายเดือนนี้ · ${state.expenses.length} รายการ`} initiallyOpen>{[...state.expenses].reverse().map(e => <Row key={e.id} title={`${e.note} · ${money(e.amount)}`} detail={`${e.date} · ${label(state.categories.find(c => c.id === e.catId)?.name || 'ไม่พบหมวด')}`} onPress={() => edit('expense', e.id)} />)}{!state.expenses.length && <Body>ยังไม่มีรายจ่ายในเดือนนี้</Body>}</Disclosure>
    <Disclosure title="ประมาณการสิ้นเดือน" art={require('../../../../assets/treasury-reference/forecast.webp')}><Stats items={[["คาดว่าจะใช้", money(forecast.projected)], ["เหลือเก็บโดยประมาณ", money(forecast.surplus)]]} /><Body>บิลที่ยังไม่จ่าย {money(forecast.unpaidBills)} · ใช้ได้เฉลี่ย {money(forecast.dailyLeft)}/วัน</Body><Body>ประมาณจากอัตรารายจ่ายที่ผ่านมาและบิลที่เหลือ</Body></Disclosure>
    <Disclosure title="สรุปและประวัติ" art={require('../../../../assets/treasury-reference/history.webp')}><Action title="บันทึกสรุปเดือนนี้" secondary busy={work.busy} onPress={() => confirm('บันทึกสรุปเดือนนี้?', 'เก็บสำเนารายละเอียดและยอดรวม รายจ่ายเดือนนี้ยังแก้ไขได้', () => void work.run(async () => load.setData(await changeModule('treasury', account, snapshot, s => canon.treasuryClose(s)))))} /><Action title="เปิดประวัติรายเดือน" secondary onPress={() => router.push('/treasury/history')} /></Disclosure>
    {(state.expenseTrash?.length || state.bills.some(b => b.archived)) ? <Disclosure title="รายการที่เก็บไว้">{state.expenseTrash?.filter(e => e.date.slice(0, 7) === state.month).map(e => <Action key={e.id} title={`คืน ${e.note} · ${money(e.amount)}`} secondary busy={work.busy} onPress={() => void work.run(async () => load.setData(await changeModule('treasury', account, snapshot, s => ({ ...saveTreasuryExpense(s, e), expenseTrash: s.expenseTrash?.filter(row => row.id !== e.id) }))))} />)}{state.bills.filter(b => b.archived).map(b => <Action key={b.id} title={`คืนบิล ${label(b.name)}`} secondary busy={work.busy} onPress={() => void work.run(async () => load.setData(await changeModule('treasury', account, snapshot, s => ({ ...s, bills: s.bills.map(row => row.id === b.id ? { ...row, archived: false } : row) }))))} />)}</Disclosure> : null}
    {!!state.categoryTrash?.length && <Disclosure title="หมวดที่เก็บไว้">{state.categoryTrash.map(c => <Action key={c.id} title={`คืนหมวด ${label(c.name)}`} secondary busy={work.busy} onPress={() => void work.run(async () => load.setData(await changeModule('treasury', account, snapshot, s => ({ ...s, categories: s.categories.some(row => row.id === c.id) ? s.categories : [...s.categories, c], categoryTrash: s.categoryTrash?.filter(row => row.id !== c.id) }))))} />)}</Disclosure>}
    <ErrorNote message={work.error || load.error} /><Action title="รีเฟรชคลังหลวง" secondary busy={load.loading} onPress={load.reload} />
  </Page>;
}
const styles = StyleSheet.create({
  balance: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 18, backgroundColor: '#234d3c', borderRadius: 20, borderWidth: 1, borderColor: '#b69852' },
  chest: { width: 64, height: 68 },
  balanceText: { flexShrink: 1, alignItems: 'center', gap: 3 },
  balanceLabel: { fontFamily: fonts.body, color: '#f1dfad', fontSize: 13, lineHeight: 22, textAlign: 'center' },
  balanceNumber: { fontFamily: fonts.stat, color: '#fff6dc', fontSize: 30, lineHeight: 42, textAlign: 'center' },
});
