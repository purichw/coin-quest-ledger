import { useModule } from '../../modules/useModule';
import { useState } from 'react';
import { router, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { Action, ErrorNote, Field, ui } from '../../auth/ui';
import { canon } from '../../domain/canon';
import { changeModule } from '../../modules/service';
import { label } from '../../modules/types';
import { DragonArt } from '../../modules/DragonArt';
import { Body, Card, Choice, confirm, LoadError, Loading, money, number, p, Page, PlayerGate, Row, Stats, today, useWork, type Player } from '../../player/ui';

export default function DebtRoute() { return <PlayerGate>{player => <Debt {...player} />}</PlayerGate>; }
function Debt({ account }: Player) {
  const load = useModule('debt', account); const work = useWork(); const [extra, setExtra] = useState('0');
  if (!load.data) return load.error ? <LoadError error={load.error} retry={load.reload} /> : <Loading />;
  const snapshot = load.data; const state = snapshot.data; const all = state.dragons.filter(d => !d.archived); const live = all.filter(d => !d.slain); const strategy = state.strategy || 'avalanche';
  const forecast = canon.simulateLair(live, strategy, Math.max(0, number(extra) || 0)); const target = canon.strategyTarget(live, strategy);
  return <Page><Stack.Screen options={{ title: 'Debt Dragon · มังกรหนี้' }} /><View><Text style={ui.title}>ค่อย ๆ พิชิตหนี้</Text><Body>บันทึกยอดจริงและวางแผนการจ่ายของคุณ</Body></View>
    <Card><Stats items={[["ยอดคงเหลือ", money(live.reduce((s, d) => s + d.balance, 0))], ["หนี้ที่ปิดแล้ว", String(all.filter(d => d.slain).length)]]} /><Body>ยอดตามวันที่คิดดอกเบี้ยล่าสุดของแต่ละรายการ</Body><Action title="เพิ่มมังกรหนี้" onPress={() => router.push('/debt/dragon')} /></Card>
    {all.length ? all.map(d => <Card key={d.id}><DragonArt type={d.type} uri={state.art[d.type]} /><Row title={label(d.name)} detail={`${money(d.balance)} · ${d.apr}% ต่อปี · ${d.slain ? 'ปิดแล้ว' : d.id === target ? 'เป้าหมายตามแผน' : 'กำลังชำระ'}`} onPress={() => router.push({ pathname: '/debt/dragon', params: { id: d.id } })} /></Card>) : <Card title="ยังไม่มีรายการหนี้"><Body>เพิ่มยอดคงเหลือ ดอกเบี้ย และวันครบกำหนด เพื่อเริ่มแผนของคุณ</Body></Card>}
    {!!live.length && <><Card title="แผนพิชิตหนี้"><View style={p.choices}>{[['avalanche', 'ดอกเบี้ยสูงก่อน'], ['snowball', 'ยอดน้อยก่อน']].map(([value, text]) => <Choice key={value} label={text} selected={strategy === value} onPress={() => void work.run(async () => { load.setData(await changeModule('debt', account, snapshot, current => ({ ...current, strategy: value as 'avalanche' | 'snowball' }))); })} />)}</View><Field label="จ่ายเพิ่มต่อเดือน (บาท)" value={extra} onChangeText={setExtra} keyboardType="decimal-pad" /><Text style={ui.value}>{forecast.never ? 'ยอดผ่อนยังไม่พอปิดหนี้ตามแผนนี้' : `ประมาณ ${forecast.months} เดือน`}</Text><Body>ดอกเบี้ยตามแบบจำลอง {money(forecast.interest)} · คำนวณเฉพาะหนี้ที่ผ่อนรายเดือน ตามอัตราที่คุณกรอก</Body></Card>
    <Card title="อัปเดตดอกเบี้ย"><Body>คิดดอกเบี้ยรายวันถึง {today()} โดยใช้สูตรเดียวกับเว็บ กดซ้ำวันเดิมจะไม่คิดซ้ำ</Body><Action title="คิดดอกเบี้ยถึงวันนี้" secondary busy={work.busy} onPress={() => confirm('อัปเดตดอกเบี้ยถึงวันนี้?', 'ยอดคงเหลือจะรวมดอกเบี้ยจากวันที่คิดล่าสุด', () => void work.run(async () => { load.setData(await changeModule('debt', account, snapshot, current => { let interest = 0; const dragons = current.dragons.map(d => { if (d.archived) return d; const result = canon.accrueDebtToDate(d, today()); interest += result.interest; return result.debt; }); return { ...current, dragons, lastAccrued: canon.dateOnlyMs(today()), stats: { ...current.stats, interest: current.stats.interest + interest } }; })); }))} /></Card></>}
    {state.dragons.some(d => d.archived) && <Card title="หนี้ที่เก็บไว้">{state.dragons.filter(d => d.archived).map(d => <Action key={d.id} title={`นำ ${label(d.name)} กลับมา`} secondary busy={work.busy} onPress={() => void work.run(async () => { load.setData(await changeModule('debt', account, snapshot, current => ({ ...current, dragons: current.dragons.map(x => x.id === d.id ? { ...x, archived: false } : x) }))); })} />)}</Card>}
    <ErrorNote message={work.error || load.error} /><Action title="รีเฟรชข้อมูลหนี้" secondary busy={load.loading} onPress={load.reload} />
  </Page>;
}
