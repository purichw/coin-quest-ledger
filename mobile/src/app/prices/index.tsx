import { router, Stack } from 'expo-router';
import { Text } from 'react-native';
import { Action, ErrorNote, ui } from '../../auth/ui';
import { canon } from '../../domain/canon';
import { changeModule } from '../../modules/service';
import { useModule } from '../../modules/useModule';
import { Body, Card, LoadError, Loading, Page, PlayerGate, Row, useWork, type Player } from '../../player/ui';
export default function PricesRoute() { return <PlayerGate>{p => <Prices {...p} />}</PlayerGate>; }
function Prices({ account }: Player) {
  const load = useModule('comparisons', account); const work = useWork();
  if (!load.data) return load.error ? <LoadError error={load.error} retry={load.reload} /> : <Loading />;
  const snapshot = load.data; const active = snapshot.data.filter(c => !c.archived);
  return <Page><Stack.Screen options={{ title: 'Price Arena · เทียบราคา' }} /><Text style={ui.title}>หาเจ้าราคาคุ้ม</Text><Body>เทียบราคาต่อหน่วยเดียวกัน รวมโปรโมชั่นและขนาดแพ็ค</Body><Action title="เพิ่มสินค้าเปรียบเทียบ" onPress={() => router.push('/prices/item')} />
    {active.length ? active.map(c => { const ranked = canon.rankOffers(c.offers, c).filter(o => o.norm.valid); return <Card key={c.id}><Row title={c.name} detail={`${c.offers.length} ตัวเลือก · ${ranked.length ? `เริ่ม ฿${ranked[0].pu.toFixed(3)} / ${c.baseUnit}` : 'ยังไม่มีราคา'}`} onPress={() => router.push({ pathname: '/prices/item', params: { id: c.id } })} /></Card>; }) : <Card title="เริ่มจากสินค้าที่อยากเทียบ"><Body>เพิ่มชื่อสินค้า แล้วใส่ราคาและปริมาณของแต่ละร้านเพื่อหาตัวเลือกคุ้มที่สุด</Body></Card>}
    {snapshot.data.some(c => c.archived) && <Card title="สินค้าที่เก็บไว้">{snapshot.data.filter(c => c.archived).map(c => <Action key={c.id} title={`นำ ${c.name} กลับมา`} secondary busy={work.busy} onPress={() => void work.run(async () => load.setData(await changeModule('comparisons', account, snapshot, data => data.map(item => item.id === c.id ? { ...item, archived: false } : item))))} />)}</Card>}
    <ErrorNote message={work.error || load.error} /><Action title="รีเฟรชราคา" secondary busy={load.loading} onPress={load.reload} /></Page>;
}
