import { useState } from 'react';
import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Action, ErrorNote, ui } from '../../auth/ui';
import { canon } from '../../domain/canon';
import { changeModule } from '../../modules/service';
import { useModule } from '../../modules/useModule';
import { ListTools } from '../../modules/ListTools';
import { visibleComparisons, type PriceFilter, type PriceSort } from '../../modules/list-filters';
import { scenicStackOptions } from '../../player/navigation';
import { Body, Card, Choice, Disclosure, LoadError, Loading, p, Page, PlayerGate, SceneHeader, useWork, type Player } from '../../player/ui';
export default function PricesRoute() { return <PlayerGate>{p => <Prices {...p} />}</PlayerGate>; }
const priceFilters = [['all', 'ทั้งหมด'], ['active', 'กำลังเทียบ'], ['archived', 'เก็บไว้']] as const;
const priceSorts = [['latest', 'ล่าสุด'], ['name', 'ชื่อสินค้า'], ['saving', 'ประหยัดสูงสุด']] as const;
function Prices({ account }: Player) {
  const load = useModule('comparisons', account); const work = useWork();
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState<PriceFilter>('active'); const [sort, setSort] = useState<PriceSort>('latest');
  if (!load.data) return load.error ? <LoadError error={load.error} retry={load.reload} /> : <Loading />;
  const snapshot = load.data; const visible = visibleComparisons(snapshot.data, filter, query, sort);
  const listChanged = !!query || filter !== 'active' || sort !== 'latest';
  const resetList = () => { setQuery(''); setFilter('active'); setSort('latest'); };
  return <Page scene="prices"><Stack.Screen options={{ ...scenicStackOptions, title: 'เทียบราคา' }} /><SceneHeader kind="prices" title="เปรียบเทียบราคา" subtitle="ของชิ้นเดียวกัน ตัวเลือกไหนคุ้มที่สุด" /><Action title="เพิ่มสินค้าเปรียบเทียบ" onPress={() => router.push('/prices/item')} />
    <ListTools label="ค้นหาสินค้า" query={query} onQuery={setQuery} summary={`${priceFilters.find(([value]) => value === filter)![1]} · ${priceSorts.find(([value]) => value === sort)![1]}`} count={visible.length} changed={listChanged} onReset={resetList}>
      <Text style={ui.label}>สถานะสินค้า</Text><View style={p.choices}>{priceFilters.map(([value, text]) => <Choice key={value} label={`${text} (${snapshot.data.filter(item => value === 'all' || (value === 'archived' ? item.archived : !item.archived)).length})`} selected={filter === value} onPress={() => setFilter(value)} />)}</View><Text style={ui.label}>เรียงรายการ</Text><View style={p.choices}>{priceSorts.map(([value, text]) => <Choice key={value} label={text} selected={sort === value} onPress={() => setSort(value)} />)}</View>
    </ListTools>
    {visible.length ? visible.map(c => {
      const ranked = canon.rankOffers(c.offers, c).filter(o => o.norm.valid); const best = ranked[0];
      return <View key={c.id} style={{ gap: 8 }}><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/prices/item', params: { id: c.id } })} style={({ pressed }) => [ui.panel, styles.item, pressed && { opacity: .65 }]}>
        <View style={styles.heading}><View style={styles.icon}><Text style={{ fontSize: 27 }} accessibilityElementsHidden>{c.icon || '🛒'}</Text></View><View style={{ flex: 1, minWidth: 0 }}><Text style={p.section}>{c.name}</Text><Text style={ui.hint}>{c.offers.length} ตัวเลือก · ต่อ {c.baseUnit}{c.archived ? ' · เก็บไว้' : ''}</Text></View><Text style={p.section} accessibilityElementsHidden>›</Text></View>
        {best ? <View style={styles.best}><Text style={ui.value}>{ranked.length > 1 && best.isBest ? '♛ ' : ''}{best.merchant}</Text><Text style={[p.number, { textAlign: 'left' }]}>฿{best.pu.toFixed(best.pu < .1 ? 4 : 3)}<Text style={ui.hint}> / {c.baseUnit}</Text></Text><Text style={ui.hint}>{best.isEqual ? 'ตัวเลือกมีราคาต่อหน่วยเท่ากัน' : ranked.length > 1 && best.isBest ? `ประหยัด ${best.savePct}% เทียบตัวเลือกแพงสุด` : 'เพิ่มอีกตัวเลือกเพื่อเปรียบเทียบ'}</Text></View> : <Text style={ui.hint}>{c.offers.length ? 'เปิดสินค้าเพื่อตรวจหน่วยของราคา' : 'ยังไม่มีราคา · แตะเพื่อเพิ่มตัวเลือกแรก'}</Text>}
      </Pressable>{c.archived && <Action title={`นำ ${c.name} กลับมา`} secondary busy={work.busy} onPress={() => void work.run(async () => load.setData(await changeModule('comparisons', account, snapshot, data => data.map(item => item.id === c.id ? { ...item, archived: false } : item))))} />}</View>;
    }) : <Card title={snapshot.data.length ? 'ไม่พบสินค้าในรายการนี้' : 'เริ่มจากสินค้าที่อยากเทียบ'}><Body>{snapshot.data.length ? 'ลองเปลี่ยนสถานะหรือคำค้นเพื่อดูสินค้าอื่น' : 'เพิ่มชื่อสินค้า แล้วใส่ราคาและปริมาณของแต่ละร้านเพื่อหาตัวเลือกคุ้มที่สุด'}</Body>{snapshot.data.length > 0 && <Action title={listChanged ? "ล้างคำค้นและตัวกรอง" : "ดูสินค้าที่เก็บไว้"} secondary onPress={listChanged ? resetList : () => setFilter('archived')} />}</Card>}
    {filter === 'active' && snapshot.data.some(c => c.archived) && <Disclosure title="สินค้าที่เก็บไว้">{snapshot.data.filter(c => c.archived).map(c => <Action key={c.id} title={`นำ ${c.name} กลับมา`} secondary busy={work.busy} onPress={() => void work.run(async () => load.setData(await changeModule('comparisons', account, snapshot, data => data.map(item => item.id === c.id ? { ...item, archived: false } : item))))} />)}</Disclosure>}
    <ErrorNote message={work.error || load.error} /><Action title="รีเฟรชราคา" secondary busy={load.loading} onPress={load.reload} /></Page>;
}
const styles = StyleSheet.create({
  item: { gap: 12, borderColor: '#a5bec8', backgroundColor: '#f5faf9' },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 48, height: 52, borderWidth: 1, borderColor: '#a5bec8', borderRadius: 12, backgroundColor: '#d9eaf0', alignItems: 'center', justifyContent: 'center' },
  best: { padding: 14, borderWidth: 1, borderColor: '#a5bec8', borderRadius: 13, backgroundColor: '#e4eff2', gap: 3 },
});
