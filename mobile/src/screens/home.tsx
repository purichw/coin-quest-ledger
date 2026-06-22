import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tabs, type ViewKey } from '../copy';
import { palette, ui } from '../theme';
import type { CharacterProfile, Lang, PlayerModules, TripState } from '../types';
import { formatMoney, Glyph, Stat } from '../ui';
import { debtTotals, treasuryTotals } from '../gameLogic';

export function HomeScreen({
  profile,
  trips,
  selectedTrip,
  modules,
  lang,
  onNewBoard,
  onOpen,
}: {
  profile: CharacterProfile | null;
  trips: TripState[];
  selectedTrip: TripState | null;
  modules: PlayerModules | null;
  lang: Lang;
  onNewBoard: () => void;
  onOpen: (key: ViewKey) => void;
}) {
  const total = selectedTrip?.expenses.reduce((sum, item) => sum + item.amount, 0) || 0;
  const debt = modules ? debtTotals(modules.debt) : { live: 0, hoard: 0 };
  const treasury = modules ? treasuryTotals(modules.treasury) : { remaining: 0 };
  const moduleMeta: Record<ViewKey, string> = {
    home: '',
    split: `${trips.length} ${lang === 'en' ? 'boards' : 'บอร์ด'}`,
    debt: `${debt.live} ${lang === 'en' ? 'live dragons' : 'มังกร'}`,
    treasury: `฿${formatMoney(treasury.remaining)} ${lang === 'en' ? 'left' : 'เหลือ'}`,
    compare: `${modules?.comparisons.length || 0} ${lang === 'en' ? 'deals' : 'ดีล'}`,
    character: '',
  };
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.greeting}>{lang === 'en' ? 'Choose a quest' : 'เลือกเควสเพื่อเริ่มการผจญภัย'}</Text>
          <Text style={ui.title}>{profile?.displayName || (lang === 'en' ? 'Quest Hub' : 'ศูนย์บัญชีกิลด์')}</Text>
        </View>
        <Pressable style={styles.avatarMini} onPress={() => onOpen('character')}><Glyph id="trophy" active accent={palette.gold} /></Pressable>
      </View>
      <View style={styles.statsRow}>
        <Stat label={lang === 'en' ? 'Boards' : 'บอร์ด'} value={String(trips.length)} />
        <Stat label="XP" value={String(profile?.xp || 0)} />
        <Stat label={lang === 'en' ? 'Level' : 'เลเวล'} value={String(profile?.level.lvl || 1)} />
      </View>
      <Pressable style={styles.heroCard} onPress={() => onOpen('split')}>
        <View style={styles.heroIcon}><Glyph id="coin" active accent={palette.gold} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>{selectedTrip?.tripName || (lang === 'en' ? 'No active board' : 'ยังไม่มีบอร์ด')}</Text>
          <Text style={styles.heroMeta}>{selectedTrip ? `${selectedTrip.participants.length} members · ฿${formatMoney(total)}` : lang === 'en' ? 'Create a synced Firebase board.' : 'สร้างบอร์ด Firebase ที่ sync จริง'}</Text>
        </View>
      </Pressable>
      <View style={styles.grid}>
        {tabs.slice(1).map((tab) => (
          <Pressable key={tab.key} style={styles.moduleCard} onPress={() => onOpen(tab.key)}>
            <Glyph id={tab.glyph} active accent={tab.accent} />
            <Text style={styles.moduleTitle}>{lang === 'en' ? tab.en : tab.th}</Text>
            <Text style={ui.muted}>{moduleMeta[tab.key]}</Text>
            <Text style={[styles.play, { color: tab.accent }]}>▶ {lang === 'en' ? 'Play' : 'เล่น'}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={ui.primaryButton} onPress={onNewBoard}><Text style={ui.primaryText}>{lang === 'en' ? 'Create Board' : 'สร้างบอร์ดใหม่'}</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  greeting: { fontSize: 12.5, color: palette.ink2, fontWeight: '600' },
  avatarMini: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line },
  statsRow: { flexDirection: 'row', gap: 10 },
  heroCard: { borderRadius: 18, padding: 18, backgroundColor: palette.dark, shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(243,234,214,.1)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: palette.parchment, fontSize: 22, fontWeight: '900' },
  heroMeta: { color: '#caa75e', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moduleCard: { width: '48%', backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, borderRadius: 16, padding: 14, minHeight: 148, gap: 8 },
  moduleTitle: { color: palette.ink, fontSize: 17, fontWeight: '900' },
  play: { marginTop: 'auto', fontWeight: '900', fontSize: 12 },
});
