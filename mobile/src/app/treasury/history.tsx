import { Stack } from 'expo-router';
import { Text } from 'react-native';
import { ui } from '../../auth/ui';
import { useModule } from '../../modules/useModule';
import { Body, Card, LoadError, Loading, money, Page, PlayerGate, Stats, type Player } from '../../player/ui';
export default function HistoryRoute() { return <PlayerGate>{p => <History {...p} />}</PlayerGate>; }
function History({ account }: Player) {
  const load = useModule('treasury', account); if (!load.data) return load.error ? <LoadError error={load.error} retry={load.reload} /> : <Loading />;
  return <Page><Stack.Screen options={{ title: 'ประวัติคลังหลวง' }} />{load.data.data.history.length ? load.data.data.history.map(row => <Card key={row.month} title={`เดือน ${row.month}`}><Stats items={[["รายรับ", money(row.income)], ["รายจ่าย", money(row.spent)], ["คงเหลือ", money(row.surplus)]]} /><Text style={ui.value}>{row.won ? 'คุมงบได้' : 'เกินงบเดือนนี้'}</Text>{row.expenses?.map(e => <Body key={e.id}>{e.date} · {e.note} · {money(e.amount)}</Body>)}</Card>) : <Card><Body>ยังไม่มีประวัติ เริ่มจากบันทึกสรุปเดือนในคลังหลวง</Body></Card>}</Page>;
}
