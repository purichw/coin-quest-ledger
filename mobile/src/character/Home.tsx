import { router } from 'expo-router';
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
      <View style={ui.row}><Text style={styles.wordmark}>COIN QUEST</Text><Pressable accessibilityRole="button" onPress={() => router.push('/account')} style={styles.account}><Text style={ui.linkText}>บัญชี</Text></Pressable></View>
      <View><Text style={ui.title}>แคมป์ของคุณ</Text><Text style={ui.description}>ยินดีต้อนรับกลับ, {account.name}</Text></View>
      <View style={styles.hero}>
        <View style={styles.identity}>
          <Portrait classId={character.classId} gender={character.gender} skin={character.skin} style={styles.portrait} />
          <View style={styles.identityText}><Text style={styles.kicker}>นักผจญภัยของคุณ</Text><Text style={styles.heroName}>{character.name}</Text><Text style={styles.heroClass}>{meta.th}</Text><Text style={styles.heroEnglish}>{meta.en}</Text><Text style={styles.idLabel}>CHARACTER ID</Text><Text style={styles.heroId}>{character.id}</Text></View>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/character')} style={styles.detailButton}><Text style={styles.detailText}>ดูรายละเอียดตัวละคร</Text><Text accessible={false} style={styles.detailArrow}>›</Text></Pressable>
      </View>
      <Experience character={character} />
      <View style={ui.panel}><Text style={styles.section}>การเดินทางของคุณ</Text><Action title="แบ่งเงิน · Party Ledger" onPress={() => router.push('/split')} /><Action title="มังกรหนี้ · Debt Dragon" secondary onPress={() => router.push('/debt')} /><Action title="การแจ้งเตือนและคำเชิญ" secondary onPress={() => router.push('/reminders')} /></View>
      <Action title="คลังหลวง · Treasury" secondary onPress={() => router.push('/treasury')} />
      <Action title="เทียบราคา · Price Arena" secondary onPress={() => router.push('/prices')} />
      <View style={styles.accountNote}><Text style={ui.hint}>@{account.username}</Text></View>
      <Action title="รีเฟรชข้อมูล" secondary onPress={retry} />
    </ScrollView>
  </SafeAreaView>;
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
  page: { ...homeStyles.page, paddingTop: 10, paddingBottom: 32 },
  wordmark: { fontFamily: fonts.brand, fontSize: 18, letterSpacing: 2, color: colors.ink },
  account: { minHeight: 44, minWidth: 62, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: 24, backgroundColor: '#244f3d', borderWidth: 1, borderColor: '#365d40', overflow: 'hidden' },
  identity: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  portrait: { flex: 1, height: 216, backgroundColor: '#244f3d' },
  identityText: { flex: 1, paddingVertical: 8 },
  kicker: { fontFamily: fonts.body, fontSize: 11, color: '#e7dcc6', lineHeight: 19 },
  heroName: { fontFamily: fonts.display, fontSize: 23, lineHeight: 34, color: '#fff4d6', marginTop: 5 },
  heroClass: { fontFamily: fonts.emphasis, fontSize: 14, lineHeight: 24, color: '#f0d58f', marginTop: 8 },
  heroEnglish: { fontFamily: fonts.body, fontSize: 12, color: '#e7dcc6', lineHeight: 20 },
  idLabel: { fontFamily: fonts.body, fontSize: 9, letterSpacing: 1.2, color: '#e7dcc6', marginTop: 20 },
  heroId: { fontFamily: fonts.stat, fontSize: 24, letterSpacing: 2, color: '#fff4d6', lineHeight: 34 },
  detailButton: { minHeight: 52, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: '#1e4434', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  detailText: { fontFamily: fonts.emphasis, color: '#fff4d6', fontSize: 14 },
  detailArrow: { fontFamily: fonts.body, color: '#fff4d6', fontSize: 24, lineHeight: 26 },
  section: { fontFamily: fonts.display, fontSize: 18, lineHeight: 28, color: colors.ink },
  stats: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  statNumber: { fontFamily: fonts.stat, color: colors.ink, fontSize: 30, lineHeight: 40 },
  statDivider: { width: 1, height: 48, backgroundColor: colors.border },
  track: { height: 8, borderRadius: 4, backgroundColor: '#e4d7b9', overflow: 'hidden' },
  progress: { height: '100%', backgroundColor: colors.green },
  accountNote: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between' },
});
