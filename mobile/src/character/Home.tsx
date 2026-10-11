import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Account } from '../auth/contracts';
import { useAuth } from '../auth/AuthProvider';
import { Action, colors, ui } from '../auth/ui';
import { fonts } from '../theme/typography';
import { classInfo, levelFromXp } from './catalog';
import type { Character } from './contracts';
import { Portrait } from './Portrait';
import { usePlayerProfile } from './profile-service';

export function Home({ account, character: savedCharacter }: { account: Account; character: Character }) {
  const { retry } = useAuth();
  const profile = usePlayerProfile(account); const character = profile.data?.hero || savedCharacter;
  const meta = classInfo(character.classId);
  return <SafeAreaView style={ui.screen}>
    <ScrollView contentContainerStyle={styles.page}>
      <View style={ui.row}><Text style={styles.wordmark}>COIN QUEST <Text style={styles.wordmarkDot}>✦</Text></Text><Pressable accessibilityRole="button" onPress={() => router.push('/account')} style={styles.account}><Text style={ui.linkText}>บัญชี</Text></Pressable></View>
      <View><Text style={ui.hint}>ยินดีต้อนรับกลับ, {account.name}</Text><Text style={ui.title}>แคมป์ของคุณ</Text></View>
      <View style={styles.hero}>
        <View style={styles.identity}>
          <Portrait classId={character.classId} gender={character.gender} skin={character.skin} style={styles.portrait} />
          <View style={styles.identityText}><Text style={styles.kicker}>นักผจญภัยของคุณ</Text><Text style={styles.heroName}>{character.name}</Text><Text style={styles.heroClass}>{meta.th} · {meta.en}</Text><Text style={styles.heroId}>ID {character.id}</Text></View>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/character')} style={styles.detailButton}><Text style={styles.detailText}>ดูรายละเอียดตัวละคร</Text><Text accessible={false} style={styles.detailArrow}>›</Text></Pressable>
      </View>
      <View style={{ gap: 12 }}><View style={ui.row}><Text style={styles.section}>เลือกเควสของคุณ</Text><Text style={ui.hint}>4 เส้นทาง</Text></View><View style={styles.modules}>
        <ModuleTile title="แบ่งเงิน" subtitle="Party Ledger" glyph="⚔" detail="หารค่าใช้จ่ายกับปาร์ตี้" href="/split" primary />
        <ModuleTile title="มังกรหนี้" subtitle="Debt Dragon" glyph="♜" detail="วางแผนพิชิตยอดหนี้" href="/debt" />
        <ModuleTile title="คลังหลวง" subtitle="Treasury" glyph="♛" detail="ดูแลงบของเดือนนี้" href="/treasury" />
        <ModuleTile title="เทียบราคา" subtitle="Price Arena" glyph="⚖" detail="หาเจ้าราคาคุ้ม" href="/prices" />
      </View></View>
      <Pressable accessibilityRole="button" onPress={() => router.push('/reminders')} style={styles.notice}><View style={{ flex: 1 }}><Text style={ui.value}>การแจ้งเตือนและคำเชิญ</Text><Text style={ui.hint}>ข่าวสารจากเพื่อนร่วมทาง</Text></View><Text style={styles.section}>›</Text></Pressable>
      <Experience character={character} />
      <View style={styles.accountNote}><Text style={ui.hint}>@{account.username}</Text><Text style={ui.hint}>บัญชีเดียวกันทั้งเว็บและแอป</Text></View>
      <Action title="รีเฟรชข้อมูล" secondary onPress={retry} />
    </ScrollView>
  </SafeAreaView>;
}

function ModuleTile({ title, subtitle, glyph, detail, href, primary = false }: { title: string; subtitle: string; glyph: string; detail: string; href: Href; primary?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title} · ${subtitle}`} onPress={() => router.push(href)} style={({ pressed }) => [styles.module, primary && styles.modulePrimary, pressed && { opacity: .75 }]}>
    <View style={styles.moduleTop}><Text accessible={false} style={[styles.moduleGlyph, primary && { color: '#f2d996' }]}>{glyph}</Text><Text accessible={false} style={[styles.moduleArrow, primary && { color: '#d7e4d7' }]}>↗</Text></View>
    <Text style={[styles.moduleTitle, primary && { color: '#fff9e9' }]}>{title}</Text>
    <Text style={[styles.moduleSubtitle, primary && { color: '#d7e4d7' }]}>{subtitle}</Text>
    <Text style={[styles.moduleDetail, primary && { color: '#d7e4d7' }]}>{detail}</Text>
  </Pressable>;
}

export function Experience({ character }: { character: Character }) {
  const level = character.xp === null ? null : levelFromXp(character.xp);
  return <View style={ui.panel}>
    <Text style={styles.section}>เส้นทางนักผจญภัย</Text>
    {level ? <>
      <View style={styles.stats}>
        <View style={styles.stat}><Text style={ui.hint}>เลเวล</Text><Text style={styles.statNumber}>{level.lvl}</Text></View>
        <View style={styles.statDivider} />
        <View style={styles.stat}><Text style={ui.hint}>XP ที่บันทึก</Text><Text style={styles.statNumber}>{character.xp!.toLocaleString('en-US')}</Text></View>
      </View>
      <View accessible accessibilityRole="progressbar" accessibilityLabel={`ความคืบหน้าสู่เลเวล ${level.lvl + 1}`} accessibilityValue={{ min: 0, max: level.need, now: level.into }} style={styles.track}><View style={[styles.progress, { width: `${Math.min(100, level.into / level.need * 100)}%` }]} /></View>
      <Text style={ui.footer}>อีก {(level.need - level.into).toLocaleString('en-US')} XP ถึงเลเวล {level.lvl + 1}</Text>
    </> : <Text style={ui.description}>ยังไม่มีค่า XP ที่บันทึกสำหรับตัวละครนี้</Text>}
  </View>;
}

export const homeStyles = StyleSheet.create({
  page: { padding: 24, gap: 24, width: '100%', maxWidth: 560, alignSelf: 'center' },
  largePortrait: { width: '100%', height: 260, borderRadius: 20 },
  centered: { textAlign: 'center' },
  id: { fontFamily: fonts.stat, fontSize: 22, color: colors.ink },
});

const styles = StyleSheet.create({
  page: { ...homeStyles.page, padding: 20, gap: 20, paddingTop: 4, paddingBottom: 32 },
  wordmark: { fontFamily: fonts.brand, fontSize: 15, letterSpacing: 1.6, color: colors.ink },
  wordmarkDot: { color: colors.gold },
  account: { minHeight: 44, minWidth: 62, paddingHorizontal: 14, borderRadius: 22, backgroundColor: '#e7ebdf', alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: 22, backgroundColor: '#183d30', overflow: 'hidden' },
  identity: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 14 },
  portrait: { width: 110, height: 154, backgroundColor: '#183d30' },
  identityText: { flex: 1, paddingVertical: 8 },
  kicker: { fontFamily: fonts.body, fontSize: 11, color: '#e7dcc6', lineHeight: 19 },
  heroName: { fontFamily: fonts.display, fontSize: 20, lineHeight: 30, color: '#fff4d6', marginTop: 4 },
  heroClass: { fontFamily: fonts.body, fontSize: 12, lineHeight: 22, color: '#f0d58f', marginTop: 6 },
  heroId: { fontFamily: fonts.stat, fontSize: 12, letterSpacing: 1, color: '#d7e4d7', lineHeight: 22, marginTop: 4 },
  detailButton: { minHeight: 44, paddingHorizontal: 18, paddingVertical: 8, backgroundColor: '#224c3b', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  detailText: { fontFamily: fonts.emphasis, color: '#fff4d6', fontSize: 12 },
  detailArrow: { fontFamily: fonts.body, color: '#fff4d6', fontSize: 24, lineHeight: 26 },
  section: { fontFamily: fonts.display, fontSize: 17, lineHeight: 27, color: colors.ink },
  modules: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  module: { flexGrow: 1, flexBasis: '45%', padding: 16, minHeight: 164, gap: 2, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  modulePrimary: { backgroundColor: '#183d30', borderColor: '#183d30' },
  moduleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  moduleGlyph: { color: colors.gold, fontSize: 26, lineHeight: 30 },
  moduleArrow: { color: colors.muted, fontSize: 19, lineHeight: 28 },
  moduleTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 18, lineHeight: 28 },
  moduleSubtitle: { color: colors.muted, fontFamily: fonts.stat, fontSize: 12, lineHeight: 20 },
  moduleDetail: { color: colors.muted, fontFamily: fonts.body, fontSize: 11, lineHeight: 19, marginTop: 5 },
  notice: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 12, backgroundColor: '#e7ebdf', borderRadius: 18 },
  stats: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  statNumber: { fontFamily: fonts.stat, color: colors.ink, fontSize: 30, lineHeight: 40 },
  statDivider: { width: 1, height: 48, backgroundColor: colors.border },
  track: { height: 7, borderRadius: 4, backgroundColor: '#e1e7d8', overflow: 'hidden' },
  progress: { height: '100%', backgroundColor: colors.green },
  accountNote: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between' },
});
