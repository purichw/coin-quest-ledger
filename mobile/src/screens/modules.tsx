import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { dragonAssets } from '../assets';
import { debtTotals, DRAGON_TYPES, rankOffers, treasuryTotals } from '../gameLogic';
import { palette, ui } from '../theme';
import type { Lang, PlayerModules } from '../types';
import { EmptyState, formatMoney, Glyph, SectionTitle, Stat } from '../ui';

export function DebtScreen({
  modules,
  lang,
  onAddDragon,
  onStrike,
}: {
  modules: PlayerModules | null;
  lang: Lang;
  onAddDragon: () => void;
  onStrike: (dragonId: string) => void;
}) {
  const debt = modules?.debt;
  if (!debt || !debt.dragons.length) {
    return <EmptyState title={lang === 'en' ? 'Debt Dragon' : 'มังกรหนี้'} body={lang === 'en' ? 'Your lair is cloud-backed and empty. Add your first real debt dragon.' : 'ถ้ำนี้ sync กับ Firebase และยังว่าง เพิ่มมังกรหนี้จริงตัวแรกได้เลย'} action={lang === 'en' ? 'Add Dragon' : 'เพิ่มมังกร'} onAction={onAddDragon} />;
  }
  const totals = debtTotals(debt);
  return (
    <View style={{ gap: 14 }}>
      <Text style={ui.h1}>{lang === 'en' ? 'Debt Dragon' : 'มังกรหนี้'}</Text>
      <View style={styles.redBanner}>
        <Text style={styles.bannerSub}>{lang === 'en' ? 'Debt hoarded' : 'หนี้ที่มังกรกกไว้'}</Text>
        <Text style={styles.bannerBig}>฿{formatMoney(totals.hoard)}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.bannerMini}>{totals.slain} {lang === 'en' ? 'slain' : 'ปราบแล้ว'}</Text>
          <Text style={styles.bannerMini}>฿{formatMoney(totals.monthly)} / mo</Text>
        </View>
      </View>
      {debt.dragons.map((dragon) => (
        <View key={dragon.id} style={styles.dragonCard}>
          <Image source={dragonAssets[dragon.type]} style={styles.dragonImage} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.rowTitle}>{dragon.name}</Text>
            <Text style={ui.muted}>{DRAGON_TYPES[dragon.type][lang]} · APR {dragon.apr}%</Text>
            <View style={styles.hpTrack}><View style={[styles.hpFill, { width: `${Math.max(0, Math.min(100, Math.round((dragon.balance / Math.max(1, dragon.original)) * 100)))}%` }]} /></View>
            <Text style={ui.muted}>฿{formatMoney(dragon.balance)} / ฿{formatMoney(dragon.original)}</Text>
          </View>
          <Pressable style={styles.smallButton} onPress={() => onStrike(dragon.id)}><Text style={styles.smallButtonText}>{lang === 'en' ? 'Strike' : 'โจมตี'}</Text></Pressable>
        </View>
      ))}
      <Pressable style={ui.primaryButton} onPress={onAddDragon}><Text style={ui.primaryText}>{lang === 'en' ? 'Add Dragon' : 'เพิ่มมังกร'}</Text></Pressable>
    </View>
  );
}

export function TreasuryScreen({
  modules,
  lang,
  onLogExpense,
}: {
  modules: PlayerModules | null;
  lang: Lang;
  onLogExpense: () => void;
}) {
  const treasury = modules?.treasury;
  const totals = treasury ? treasuryTotals(treasury) : { spent: 0, remaining: 0, projected: 0, pct: 0 };
  if (!treasury || (!treasury.income && !treasury.expenses.length)) {
    return <EmptyState title={lang === 'en' ? 'Personal Treasury' : 'คลังหลวง'} body={lang === 'en' ? 'Cloud treasury is ready. Set income or log your first expense.' : 'คลัง sync พร้อมแล้ว ตั้งรายรับหรือลงรายจ่ายแรกได้เลย'} action={lang === 'en' ? 'Log Expense' : 'ลงบันทึก'} onAction={onLogExpense} />;
  }
  return (
    <View style={{ gap: 14 }}>
      <Text style={ui.h1}>{lang === 'en' ? 'Personal Treasury' : 'คลังหลวง'}</Text>
      <View style={styles.goldBanner}>
        <Text style={styles.bannerSub}>{lang === 'en' ? 'Vault remaining' : 'ทองคงเหลือ'}</Text>
        <Text style={styles.bannerBig}>฿{formatMoney(totals.remaining)}</Text>
        <View style={styles.vaultTrack}><View style={[styles.vaultFill, { width: `${totals.pct}%` }]} /></View>
        <Text style={styles.bannerMini}>{lang === 'en' ? 'Spent' : 'ใช้แล้ว'} ฿{formatMoney(totals.spent)} · {treasury.month}</Text>
      </View>
      <View style={styles.statsRow}>
        <Stat label={lang === 'en' ? 'Income' : 'รายรับ'} value={`฿${formatMoney(treasury.income)}`} />
        <Stat label={lang === 'en' ? 'Logs' : 'บันทึก'} value={String(treasury.expenses.length)} />
      </View>
      <SectionTitle>{lang === 'en' ? 'Ledger' : 'รายการ'}</SectionTitle>
      {treasury.expenses.map((expense) => (
        <View key={expense.id} style={styles.rowCard}>
          <Glyph id="vault" />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{expense.name}</Text>
            <Text style={ui.muted}>{expense.category} · {expense.date}</Text>
          </View>
          <Text style={styles.amount}>฿{formatMoney(expense.amount)}</Text>
        </View>
      ))}
      <Pressable style={ui.primaryButton} onPress={onLogExpense}><Text style={ui.primaryText}>{lang === 'en' ? 'Log Expense' : 'ลงบันทึก'}</Text></Pressable>
    </View>
  );
}

export function CompareScreen({
  modules,
  lang,
  onAddCompare,
  onAddOffer,
}: {
  modules: PlayerModules | null;
  lang: Lang;
  onAddCompare: () => void;
  onAddOffer: (comparisonId: string) => void;
}) {
  const comparisons = modules?.comparisons || [];
  if (!comparisons.length) {
    return <EmptyState title={lang === 'en' ? 'Merchant Showdown' : 'เปรียบเทียบราคา'} body={lang === 'en' ? 'Create a cloud-backed comparison and add real merchant offers.' : 'สร้างดีลบน Firebase แล้วเพิ่มราคาแต่ละร้านจริง ๆ'} action={lang === 'en' ? 'Add Item' : 'เพิ่มสินค้า'} onAction={onAddCompare} />;
  }
  return (
    <View style={{ gap: 14 }}>
      <Text style={ui.h1}>{lang === 'en' ? 'Merchant Showdown' : 'เปรียบเทียบราคา'}</Text>
      {comparisons.map((comparison) => {
        const ranked = rankOffers(comparison);
        const best = ranked.find((offer) => offer.isBest) || ranked[0];
        return (
          <View key={comparison.id} style={styles.compareCard}>
            <View style={styles.compareHead}>
              <Glyph id="merchant" active accent={palette.blue} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{comparison.name}</Text>
                <Text style={ui.muted}>{ranked.length} {lang === 'en' ? 'offers' : 'ข้อเสนอ'} · /{comparison.baseUnit}</Text>
              </View>
            </View>
            {best ? (
              <View style={styles.champion}>
                <Text style={styles.championLabel}>{lang === 'en' ? 'Champion' : 'ผู้ชนะ'}</Text>
                <Text style={styles.championName}>{best.merchant}</Text>
                <Text style={styles.championSave}>฿{best.pu < 10 ? best.pu.toFixed(2) : Math.round(best.pu)}/{comparison.baseUnit}</Text>
              </View>
            ) : <Text style={ui.muted}>{lang === 'en' ? 'No offers yet.' : 'ยังไม่มีข้อเสนอ'}</Text>}
            {ranked.map((offer) => (
              <View key={offer.id} style={styles.offerRow}>
                <Text style={styles.rowTitle}>{offer.merchant}</Text>
                <Text style={styles.amount}>฿{formatMoney(offer.price)} · {offer.qty} {offer.unit}</Text>
              </View>
            ))}
            <Pressable style={ui.ghostButton} onPress={() => onAddOffer(comparison.id)}><Text>{lang === 'en' ? 'Add Offer' : 'เพิ่มข้อเสนอ'}</Text></Pressable>
          </View>
        );
      })}
      <Pressable style={ui.primaryButton} onPress={onAddCompare}><Text style={ui.primaryText}>{lang === 'en' ? 'Add Item' : 'เพิ่มสินค้า'}</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  redBanner: { borderRadius: 18, padding: 18, backgroundColor: '#3a1e18', gap: 7 },
  goldBanner: { borderRadius: 18, padding: 18, backgroundColor: palette.dark, gap: 7 },
  bannerSub: { color: '#d9b96a', fontWeight: '800' },
  bannerBig: { color: palette.parchment, fontSize: 34, fontWeight: '900' },
  bannerMini: { color: '#caa75e', fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10 },
  dragonCard: { flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, padding: 12 },
  dragonImage: { width: 74, height: 74, borderRadius: 18, backgroundColor: palette.card2 },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, borderRadius: 14, padding: 12 },
  rowTitle: { color: palette.ink, fontWeight: '900', fontSize: 15 },
  amount: { color: palette.ink, fontWeight: '900' },
  hpTrack: { height: 8, borderRadius: 4, backgroundColor: palette.card2, overflow: 'hidden', marginVertical: 7 },
  hpFill: { height: '100%', borderRadius: 4, backgroundColor: palette.danger },
  smallButton: { borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: palette.danger },
  smallButtonText: { color: '#fff', fontWeight: '900' },
  vaultTrack: { height: 10, borderRadius: 5, backgroundColor: 'rgba(243,234,214,.18)', overflow: 'hidden' },
  vaultFill: { height: '100%', backgroundColor: palette.goldLight },
  compareCard: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, borderRadius: 17, padding: 14, gap: 12 },
  compareHead: { flexDirection: 'row', gap: 11, alignItems: 'center' },
  champion: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: palette.dark, borderRadius: 13, padding: 12 },
  championLabel: { color: '#d9b96a', fontSize: 10, fontWeight: '800' },
  championName: { flex: 1, color: palette.parchment, fontWeight: '900' },
  championSave: { color: '#7be0a8', fontWeight: '900' },
  offerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
