import { useModule } from '../../modules/useModule';
import { useState } from 'react';
import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Action, ErrorNote, Field, ui } from '../../auth/ui';
import { canon } from '../../domain/canon';
import { changeModule } from '../../modules/service';
import { label } from '../../modules/types';
import { DragonArt } from '../../modules/DragonArt';
import { ListTools } from '../../modules/ListTools';
import { matchesDebtFilter, visibleDebts, type DebtFilter, type DebtSort } from '../../modules/list-filters';
import { scenicStackOptions } from '../../player/navigation';
import { Body, Card, Choice, confirm, Disclosure, LoadError, Loading, money, number, p, Page, PlayerGate, SceneHeader, Stats, today, useWork, type Player } from '../../player/ui';

export default function DebtRoute() { return <PlayerGate>{player => <Debt {...player} />}</PlayerGate>; }
const debtFilters = [['all', 'ทั้งหมด'], ['active', 'กำลังชำระ'], ['due', 'ใกล้กำหนด'], ['paid', 'ปิดแล้ว'], ['archived', 'เก็บไว้']] as const;
const debtSorts = [['added', 'วันที่เพิ่ม'], ['balance', 'ยอดหนี้สูงสุด'], ['apr', 'ดอกเบี้ยสูงสุด']] as const;
function Debt({ account }: Player) {
  const load = useModule('debt', account); const work = useWork(); const [extra, setExtra] = useState('0');
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState<DebtFilter>('all'); const [sort, setSort] = useState<DebtSort>('added');
  if (!load.data) return load.error ? <LoadError error={load.error} retry={load.reload} /> : <Loading />;
  const snapshot = load.data; const state = snapshot.data; const all = state.dragons.filter(d => !d.archived); const live = all.filter(d => !d.slain); const strategy = state.strategy || 'avalanche';
  const forecast = canon.simulateLair(live, strategy, Math.max(0, number(extra) || 0)); const target = canon.strategyTarget(live, strategy);
  const now = new Date(); const visible = visibleDebts(state.dragons, filter, query, sort, now);
  const listChanged = !!query || filter !== 'all' || sort !== 'added';
  const resetList = () => { setQuery(''); setFilter('all'); setSort('added'); };
  return <Page scene="debt"><Stack.Screen options={{ ...scenicStackOptions, title: 'มังกรหนี้' }} /><SceneHeader kind="debt" title="ค่อย ๆ พิชิตหนี้" subtitle="บันทึกยอดจริง แล้ววางแผนทีละก้าว" />
    <Card><Stats items={[["ยอดคงเหลือ", money(live.reduce((s, d) => s + d.balance, 0))], ["หนี้ที่ปิดแล้ว", String(all.filter(d => d.slain).length)]]} /><Body>ยอดตามวันที่คิดดอกเบี้ยล่าสุดของแต่ละรายการ</Body><Action title="เพิ่มมังกรหนี้" onPress={() => router.push('/debt/dragon')} /></Card>
    <ListTools label="ค้นหาชื่อหรือประเภทหนี้" query={query} onQuery={setQuery} summary={`${debtFilters.find(([value]) => value === filter)![1]} · ${debtSorts.find(([value]) => value === sort)![1]}`} count={visible.length} changed={listChanged} onReset={resetList}>
      <Text style={ui.label}>สถานะหนี้</Text><View style={p.choices}>{debtFilters.map(([value, text]) => <Choice key={value} label={`${text} (${state.dragons.filter(d => matchesDebtFilter(d, value, now)).length})`} selected={filter === value} onPress={() => setFilter(value)} />)}</View><Text style={ui.label}>เรียงรายการ</Text><View style={p.choices}>{debtSorts.map(([value, text]) => <Choice key={value} label={text} selected={sort === value} onPress={() => setSort(value)} />)}</View><Body>ใกล้กำหนดรวมรายการเลยกำหนดและครบกำหนดภายใน 7 วัน</Body>
    </ListTools>
    {visible.length ? <Card title={`มังกรของฉัน · ${visible.length}`}>{visible.map(d => <View key={d.id}><Pressable accessibilityRole="button" accessibilityLabel={`${label(d.name)} ${money(d.balance)} ดอกเบี้ย ${d.apr}% ต่อปี${d.archived ? ' เก็บไว้' : ''}`} onPress={() => router.push({ pathname: '/debt/dragon', params: { id: d.id } })} style={({ pressed }) => [styles.dragonRow, pressed && { opacity: .65 }]}><View style={styles.portrait}><DragonArt type={d.type} uri={state.art[d.type]} compact /></View><View style={styles.dragonText}><Text style={ui.value}>{label(d.name)}</Text><Text style={[p.number, { textAlign: 'left', fontSize: 22, lineHeight: 30 }]}>{money(d.balance)}</Text><Text style={ui.hint}>{d.apr}% ต่อปี · {d.archived ? 'เก็บไว้' : d.slain ? 'ปิดแล้ว' : d.id === target ? 'เป้าหมายตามแผน' : 'กำลังชำระ'}</Text></View><Text accessibilityElementsHidden style={p.section}>›</Text></Pressable>{d.archived && <Action title={`นำ ${label(d.name)} กลับมา`} secondary busy={work.busy} onPress={() => void work.run(async () => { load.setData(await changeModule('debt', account, snapshot, current => ({ ...current, dragons: current.dragons.map(x => x.id === d.id ? { ...x, archived: false } : x) }))); })} />}</View>)}</Card> : <Card title={state.dragons.length ? 'ไม่พบหนี้ในรายการนี้' : 'ยังไม่มีรายการหนี้'}><Body>{state.dragons.length ? 'ลองเปลี่ยนสถานะหรือคำค้น รายการที่เก็บไว้ยังนำกลับมาได้' : 'เพิ่มยอดคงเหลือ ดอกเบี้ย และวันครบกำหนด เพื่อเริ่มแผนของคุณ'}</Body>{state.dragons.length > 0 && <Action title={listChanged ? "ล้างคำค้นและตัวกรอง" : "ดูหนี้ที่เก็บไว้"} secondary onPress={listChanged ? resetList : () => setFilter('archived')} />}</Card>}
    {!!live.length && <><Disclosure title="กลยุทธ์และแผนพิชิตหนี้"><View style={p.choices}>{[['avalanche', 'ดอกเบี้ยสูงก่อน'], ['snowball', 'ยอดน้อยก่อน']].map(([value, text]) => <Choice key={value} label={text} selected={strategy === value} disabled={work.busy} onPress={() => void work.run(async () => { load.setData(await changeModule('debt', account, snapshot, current => ({ ...current, strategy: value as 'avalanche' | 'snowball' }))); })} />)}</View><Field label="จ่ายเพิ่มต่อเดือน (บาท)" value={extra} onChangeText={setExtra} keyboardType="decimal-pad" /><Text style={ui.value}>{forecast.never ? 'ยอดผ่อนยังไม่พอปิดหนี้ตามแผนนี้' : `ประมาณ ${forecast.months} เดือน`}</Text><Body>ดอกเบี้ยตามแบบจำลอง {money(forecast.interest)} · คำนวณเฉพาะหนี้ที่ผ่อนรายเดือน ตามอัตราที่คุณกรอก</Body></Disclosure>
    <Disclosure title="อัปเดตดอกเบี้ย"><Body>คิดดอกเบี้ยรายวันถึง {today()} กดซ้ำวันเดิมจะไม่คิดซ้ำ</Body><Action title="คิดดอกเบี้ยถึงวันนี้" secondary busy={work.busy} onPress={() => confirm('อัปเดตดอกเบี้ยถึงวันนี้?', 'ยอดคงเหลือจะรวมดอกเบี้ยจากวันที่คิดล่าสุด', () => void work.run(async () => { load.setData(await changeModule('debt', account, snapshot, current => { let interest = 0; const dragons = current.dragons.map(d => { if (d.archived) return d; const result = canon.accrueDebtToDate(d, today()); interest += result.interest; return result.debt; }); return { ...current, dragons, lastAccrued: canon.dateOnlyMs(today()), stats: { ...current.stats, interest: current.stats.interest + interest } }; })); }))} /></Disclosure></>}
    {filter !== 'archived' && state.dragons.some(d => d.archived) && <Disclosure title="หนี้ที่เก็บไว้">{state.dragons.filter(d => d.archived).map(d => <Action key={d.id} title={`นำ ${label(d.name)} กลับมา`} secondary busy={work.busy} onPress={() => void work.run(async () => { load.setData(await changeModule('debt', account, snapshot, current => ({ ...current, dragons: current.dragons.map(x => x.id === d.id ? { ...x, archived: false } : x) }))); })} />)}</Disclosure>}
    <ErrorNote message={work.error || load.error} /><Action title="รีเฟรชข้อมูลหนี้" secondary busy={load.loading} onPress={load.reload} />
  </Page>;
}
const styles = StyleSheet.create({
  dragonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, minHeight: 96 },
  portrait: { width: 80, minHeight: 94, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#243d55', borderWidth: 1, borderColor: '#b59759' },
  dragonText: { flex: 1, minWidth: 0, gap: 2 },
});
