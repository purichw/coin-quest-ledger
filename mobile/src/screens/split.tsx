import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { computeParty, settleUp } from '../pointy';
import { palette, ui } from '../theme';
import type { Lang, TripState } from '../types';
import { EmptyState, formatMoney, Glyph, SectionTitle, Stat } from '../ui';

export function SplitScreen({
  trip,
  trips,
  lang,
  onPick,
  onAdd,
  onNewBoard,
}: {
  trip: TripState | null;
  trips: TripState[];
  lang: Lang;
  onPick: (id: string) => void;
  onAdd: () => void;
  onNewBoard: () => void;
}) {
  if (!trip) {
    return <EmptyState title={lang === 'en' ? 'Split Expenses' : 'แบ่งค่าใช้จ่าย'} body={lang === 'en' ? 'No synced board is linked to this Character ID yet.' : 'ยังไม่มีบอร์ดที่ผูกกับ Character ID นี้'} action={lang === 'en' ? 'Create Board' : 'สร้างบอร์ดใหม่'} onAction={onNewBoard} />;
  }
  const party = computeParty(trip);
  const settlements = settleUp(party, trip);
  const total = trip.expenses.reduce((sum, item) => sum + item.amount, 0);
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.head}>
        <View>
          <Text style={ui.h1}>{trip.tripName}</Text>
          <Text style={ui.muted}>trips/{trip.id}</Text>
        </View>
        <Glyph id="scales" active />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {trips.map((item) => (
          <Pressable key={item.id} style={[styles.pill, item.id === trip.id && styles.pillOn]} onPress={() => onPick(item.id)}>
            <Text style={styles.pillText}>{item.tripName}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.banner}>
        <Text style={styles.bannerSmall}>{lang === 'en' ? 'Party Gold' : 'ทองของปาร์ตี้'}</Text>
        <Text style={styles.bannerTotal}>฿{formatMoney(total)}</Text>
        <View style={styles.bannerActions}>
          <Pressable style={styles.bannerGhost}><Text style={styles.bannerButtonText}>{lang === 'en' ? 'Quest Board' : 'บอร์ดเควส'}</Text></Pressable>
          <Pressable style={styles.bannerGold} onPress={onAdd}><Text style={styles.bannerButtonDark}>{lang === 'en' ? 'Add Expense' : 'เพิ่มรายการ'}</Text></Pressable>
        </View>
      </View>
      <View style={styles.statsRow}>
        <Stat label={lang === 'en' ? 'Total' : 'รวม'} value={`฿${formatMoney(total)}`} />
        <Stat label={lang === 'en' ? 'Quests' : 'รายการ'} value={String(trip.expenses.length)} />
        <Stat label={lang === 'en' ? 'Members' : 'สมาชิก'} value={String(trip.participants.length)} />
      </View>
      <SectionTitle>{lang === 'en' ? 'Your Party' : 'ปาร์ตี้'}</SectionTitle>
      {party.map((hero) => (
        <View key={hero.name} style={styles.rowCard}>
          <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>LV {hero.level.lvl}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{hero.name}</Text>
            <Text style={ui.muted}>{lang === 'en' ? 'Share' : 'ส่วนแบ่ง'} ฿{formatMoney(hero.share)}</Text>
          </View>
          <Text style={hero.bal >= 0 ? styles.good : styles.bad}>{hero.bal >= 0 ? '+' : '-'}฿{formatMoney(Math.abs(hero.bal))}</Text>
        </View>
      ))}
      <SectionTitle>{lang === 'en' ? 'Expenses' : 'รายการ'}</SectionTitle>
      {trip.expenses.length ? trip.expenses.map((expense) => (
        <View key={String(expense.id)} style={styles.rowCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{expense.desc}</Text>
            <Text style={ui.muted}>{expense.paidBy}</Text>
          </View>
          <Text style={styles.amount}>฿{formatMoney(expense.amount)}</Text>
        </View>
      )) : <Text style={ui.muted}>{lang === 'en' ? 'No expenses yet.' : 'ยังไม่มีรายการ'}</Text>}
      <SectionTitle>{lang === 'en' ? 'Settle Up' : 'เคลียร์กัน'}</SectionTitle>
      {settlements.length ? settlements.map((item) => (
        <View key={`${item.from}-${item.to}-${item.amount}`} style={styles.rowCard}>
          <Text style={styles.rowTitle}>{item.from} → {item.to}</Text>
          <Text style={styles.amount}>฿{formatMoney(item.amount)}</Text>
        </View>
      )) : <Text style={ui.muted}>{lang === 'en' ? 'All even.' : 'เสมอกันแล้ว'}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 20, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, marginRight: 8 },
  pillOn: { backgroundColor: '#d8efe0', borderColor: palette.accent },
  pillText: { color: palette.ink, fontWeight: '800' },
  banner: { borderRadius: 18, padding: 18, backgroundColor: palette.dark, gap: 8, shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  bannerSmall: { color: '#caa75e', fontWeight: '700' },
  bannerTotal: { color: palette.parchment, fontSize: 34, fontWeight: '900' },
  bannerActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  bannerGhost: { flex: 1, borderRadius: 11, borderWidth: 1, borderColor: 'rgba(243,234,214,.25)', padding: 10, alignItems: 'center' },
  bannerGold: { flex: 1, borderRadius: 11, backgroundColor: palette.goldLight, padding: 10, alignItems: 'center' },
  bannerButtonText: { color: palette.parchment, fontWeight: '800' },
  bannerButtonDark: { color: palette.ink, fontWeight: '900' },
  statsRow: { flexDirection: 'row', gap: 10 },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, borderRadius: 14, padding: 12 },
  heroBadge: { width: 48, height: 48, borderRadius: 13, backgroundColor: palette.card2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.gold },
  heroBadgeText: { color: palette.gold, fontSize: 10, fontWeight: '900' },
  rowTitle: { color: palette.ink, fontWeight: '900', fontSize: 15 },
  amount: { color: palette.ink, fontWeight: '900' },
  good: { color: palette.accent, fontWeight: '900' },
  bad: { color: palette.danger, fontWeight: '900' },
});
