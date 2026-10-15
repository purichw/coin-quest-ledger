import { useEffect, useState } from 'react';
import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, Image, ImageBackground, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Account } from '../auth/contracts';
import { useAuth } from '../auth/AuthProvider';
import { Action, colors, ErrorNote, ui } from '../auth/ui';
import { LivingArt, useMotionAllowed } from '../player/LivingArt';
import { SceneBackdrop } from '../player/ui';
import { fonts } from '../theme/typography';
import { classInfo, levelFromXp } from './catalog';
import type { Character } from './contracts';
import { Portrait } from './Portrait';
import { usePlayerProfile } from './profile-service';

const destinations = [
  { title: 'แบ่งเงิน', detail: 'จัดการเงินของปาร์ตี้', href: '/play/split', art: require('../../../assets/home-reference/chest.webp'), tint: '#e3eee3', accent: '#32684e', border: '#89ac8e', ink: '#224534' },
  { title: 'มังกรหนี้', detail: 'ค่อย ๆ พิชิตยอดหนี้', href: '/play/debt', art: require('../../../assets/home-reference/dragon.webp'), tint: '#f5e0d8', accent: '#9b4435', border: '#c58d7c', ink: '#713c31' },
  { title: 'เทียบราคา', detail: 'ค้นหาตัวเลือกที่คุ้ม', href: '/play/prices', art: require('../../../assets/home-reference/scales.webp'), tint: '#dfedf5', accent: '#2c6487', border: '#87aabb', ink: '#294e66' },
  { title: 'คลังหลวง', detail: 'ดูแลเงินของเดือนนี้', href: '/play/treasury', art: require('../../../assets/home-reference/treasury.webp'), tint: '#f1e6c5', accent: '#796021', border: '#bea361', ink: '#65501e' },
] as const;

export function Home({ account, character: savedCharacter }: { account: Account; character: Character }) {
  const { retry } = useAuth();
  const profile = usePlayerProfile(account); const character = profile.data?.hero || savedCharacter;
  const meta = classInfo(character.classId);
  const level = character.xp === null ? null : levelFromXp(character.xp);
  const motionAllowed = useMotionAllowed();
  const focused = useIsFocused();
  return <View style={styles.screen}><SceneBackdrop kind="home" />{focused && <StatusBar style="light" />}<SafeAreaView style={[ui.screen, styles.transparent]} edges={['top', 'left', 'right']}>
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.page} refreshControl={<RefreshControl refreshing={profile.loading && !!profile.data} onRefresh={profile.reload} tintColor="#fff4d6" />}>
      <View style={styles.header}><Text style={styles.wordmark}>COIN QUEST</Text><View style={styles.headerActions}><Pressable accessibilityRole="button" accessibilityLabel="การแจ้งเตือนและคำเชิญ" onPress={() => router.push('/reminders')} style={styles.headerAction}><Text style={styles.headerActionText}>แจ้งเตือน</Text></Pressable><Pressable accessibilityRole="button" onPress={() => router.push('/account')} style={styles.headerAction}><Text style={styles.headerActionText}>บัญชี</Text></Pressable></View></View>
      <ImageBackground source={require('../../../assets/home-reference/tavern-banner.webp')} resizeMode="cover" style={styles.hero}>
        <View style={styles.campHeading}><Text style={styles.campTitle}>แคมป์ของคุณ</Text></View>
        <View style={styles.heroBody}>
          <LivingArt style={styles.portraitStage}><Pressable accessibilityRole="button" accessibilityLabel={`ดูตัวละคร ${character.name}`} onPress={() => router.push('/character')}><Portrait classId={character.classId} gender={character.gender} skin={character.skin} style={styles.portrait} /></Pressable></LivingArt>
          <Pressable accessibilityRole="button" accessibilityLabel={`${character.name}, ${meta.th}, รหัส ${character.id}${level ? `, เลเวล ${level.lvl}, ${character.xp} XP` : ', ยังไม่มีค่า XP ที่บันทึก'}`} accessibilityHint="เปิดรายละเอียดตัวละคร" onPress={() => router.push('/character')} style={({ pressed }) => [styles.identityText, pressed && { opacity: .8 }]}>
            <Text style={styles.heroName}>{character.name}</Text><Text style={styles.heroClass}>{meta.th} · #{character.id}</Text>{level ? <><Text style={styles.heroXp}>เลเวล {level.lvl} · {character.xp!.toLocaleString('en-US')} XP</Text><View style={styles.heroTrack}><View style={[styles.heroProgress, { width: `${Math.min(100, level.into / level.need * 100)}%` }]} /></View><Text style={styles.heroHint}>อีก {(level.need - level.into).toLocaleString('en-US')} XP ถึงเลเวล {level.lvl + 1}</Text></> : <Text style={styles.heroHint}>ยังไม่มีค่า XP ที่บันทึก</Text>}<Text style={styles.heroLink}>ดูตัวละคร  ›</Text>
          </Pressable>
        </View>
      </ImageBackground>
      <View style={{ gap: 10 }}><Text style={styles.journeyHeading}>เลือกการผจญภัย</Text><View style={styles.destinations}>{destinations.map(item => <DestinationCard key={item.href} item={item} motionAllowed={motionAllowed} />)}</View></View>
      <ErrorNote message={profile.error} />
      {profile.error && <Action title="โหลดบัญชีอีกครั้ง" secondary onPress={retry} />}
      <Action title="รีเฟรชข้อมูล" secondary busy={profile.loading} onPress={profile.reload} />
      <Text style={styles.footer}>@{account.username}</Text>
    </ScrollView>
  </SafeAreaView></View>;
}

function DestinationCard({ item, motionAllowed }: { item: typeof destinations[number]; motionAllowed: boolean }) {
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => { if (!motionAllowed) { scale.stopAnimation(); scale.setValue(1); } return () => scale.stopAnimation(); }, [motionAllowed, scale]);
  const press = (down: boolean) => {
    if (!motionAllowed) return;
    Animated.timing(scale, { toValue: down ? .975 : 1, duration: down ? 90 : 110, easing: Easing.out(Easing.quad), useNativeDriver: true, isInteraction: false }).start();
  };
  return <Animated.View style={[styles.destinationSlot, { transform: [{ scale }] }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${item.title} · ${item.detail}`} onPress={() => router.navigate(item.href)} onPressIn={() => press(true)} onPressOut={() => press(false)} style={({ pressed }) => [styles.destination, { backgroundColor: item.tint, borderColor: item.border }, pressed && { opacity: .82 }]}>
      <View style={styles.destinationBody}><Image source={item.art} accessible={false} resizeMode="contain" style={styles.destinationArt} /><Text style={[styles.destinationTitle, { color: item.ink }]}>{item.title}</Text><Text style={[styles.destinationHint, { color: item.ink }]}>{item.detail}</Text></View>
      <View style={[styles.destinationAction, { backgroundColor: item.accent }]}><Text style={styles.destinationActionText}>เข้าเกม  →</Text></View>
    </Pressable>
  </Animated.View>;
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
  page: { padding: 16, gap: 16, width: '100%', maxWidth: 640, alignSelf: 'center' },
  largePortrait: { width: '100%', height: 180, borderRadius: 18 },
  centered: { textAlign: 'center' },
  id: { fontFamily: fonts.stat, fontSize: 22, color: colors.ink },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#183e2d' },
  transparent: { backgroundColor: 'transparent' },
  page: { ...homeStyles.page, paddingTop: 4, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, backgroundColor: '#143b2ae8', paddingHorizontal: 10, borderRadius: 16 },
  wordmark: { fontFamily: fonts.brand, fontSize: 15, letterSpacing: 1, color: '#fff4d6', flexShrink: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerAction: { minHeight: 44, minWidth: 44, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  headerActionText: { fontFamily: fonts.emphasis, fontSize: 13, lineHeight: 23, color: '#fff4d6' },
  journeyHeading: { fontFamily: fonts.display, fontSize: 19, lineHeight: 30, color: '#fff4d6', textShadowColor: '#102c20', textShadowRadius: 5 },
  footer: { fontFamily: fonts.body, fontSize: 12, lineHeight: 20, textAlign: 'center', color: '#fff4d6', textShadowColor: '#102c20', textShadowRadius: 4 },
  hero: { borderRadius: 22, backgroundColor: '#244f3d', borderWidth: 1, borderColor: '#aa8c4b', overflow: 'hidden' },
  campHeading: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, backgroundColor: '#193e2b88' },
  campTitle: { fontFamily: fonts.display, fontSize: 19, lineHeight: 28, color: '#fff4d6', textShadowColor: '#172c1c', textShadowRadius: 5 },
  heroBody: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, paddingTop: 6, backgroundColor: '#193e2b33' },
  portraitStage: { width: 104 },
  portrait: { width: 104, height: 158, backgroundColor: 'transparent' },
  identityText: { flex: 1, minWidth: 0, gap: 2, padding: 12, borderRadius: 15, backgroundColor: '#173b2def' },
  heroName: { fontFamily: fonts.display, fontSize: 21, lineHeight: 30, color: '#fff4d6' },
  heroClass: { fontFamily: fonts.body, fontSize: 12, lineHeight: 20, color: '#f0d58f' },
  heroXp: { fontFamily: fonts.stat, fontSize: 16, lineHeight: 24, color: '#fff4d6' },
  heroHint: { fontFamily: fonts.body, fontSize: 11, lineHeight: 18, color: '#eee2c4' },
  heroTrack: { height: 5, marginVertical: 3, borderRadius: 3, backgroundColor: '#52705a', overflow: 'hidden' },
  heroProgress: { height: '100%', backgroundColor: '#e7c777' },
  heroLink: { fontFamily: fonts.emphasis, fontSize: 12, lineHeight: 22, color: '#f0d58f', marginTop: 3 },
  destinations: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  destinationSlot: { flexGrow: 1, flexBasis: '44%', minWidth: 0 },
  destination: { flex: 1, borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  destinationBody: { flex: 1, alignItems: 'center', paddingHorizontal: 10, paddingTop: 6, paddingBottom: 8, gap: 2 },
  destinationArt: { width: 96, height: 80 },
  destinationTitle: { fontFamily: fonts.display, fontSize: 18, lineHeight: 26, textAlign: 'center' },
  destinationHint: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  destinationAction: { minHeight: 30, paddingVertical: 4, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  destinationActionText: { fontFamily: fonts.emphasis, fontSize: 12, lineHeight: 22, color: '#fff9e9' },
  section: { fontFamily: fonts.display, fontSize: 18, lineHeight: 28, color: colors.ink },
  stats: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  statNumber: { fontFamily: fonts.stat, color: colors.ink, fontSize: 30, lineHeight: 40 },
  statDivider: { width: 1, height: 48, backgroundColor: colors.border },
  track: { height: 8, borderRadius: 4, backgroundColor: '#e4d7b9', overflow: 'hidden' },
  progress: { height: '100%', backgroundColor: colors.green },
});
