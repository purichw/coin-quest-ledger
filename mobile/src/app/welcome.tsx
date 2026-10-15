import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Action, colors } from '../auth/ui';
import { PlayerGate } from '../player/ui';
import { fonts } from '../theme/typography';

const steps = [
  { title: 'ทุกวันคือการผจญภัย', eyebrow: 'WELCOME TO COIN QUEST', art: require('../../../assets/tour/welcome.webp'), body: 'บัญชีเดียวใช้ร่วมกับเว็บไซต์ได้ เลือกเส้นทางจากแถบด้านล่าง แล้วกลับมาดูภาพรวมที่หน้าหลักได้เสมอ', points: ['แบ่งเงิน · หนี้ · คลัง · เทียบราคา อยู่ใกล้นิ้ว', 'แตะตัวละครเพื่อดูเลเวลและถ้วยรางวัล'] },
  { title: 'แบ่งเงินกับผู้ร่วมทาง', eyebrow: 'PARTY LEDGER', art: require('../../../assets/tour/party.webp'), body: 'สร้างบอร์ด ชวนเพื่อนด้วย User ID หรือเพิ่มแขก แล้วบันทึกว่าใครจ่ายและใครร่วมแบ่ง', points: ['แบ่งเท่ากัน ตามจำนวน เปอร์เซ็นต์ น้ำหนัก หรือไม่รวมบางคน', 'ดูยอดที่ต้องคืน แนบใบเสร็จ และแยกแคมเปญได้'] },
  { title: 'คุมงบ พิชิตมังกรหนี้', eyebrow: 'TREASURY & DEBT DRAGON', art: require('../../../assets/tour/treasury.webp'), body: 'ใช้คลังวางงบรายเดือนและติดตามบิล ส่วนหน้าหนี้ช่วยบันทึกเงินที่จ่ายและดูยอดคงเหลือ', points: ['แยกรายรับ รายจ่าย และงบแต่ละหมวด', 'ดูประวัติเดือนก่อนและการชำระหนี้ย้อนหลัง'] },
  { title: 'เลือกคุ้ม เติบโตไปด้วยกัน', eyebrow: 'PRICE ARENA & YOUR HERO', art: require('../../../assets/tour/compare.webp'), body: 'ใส่ราคา ขนาด และโปรโมชันของสินค้าเพื่อเทียบราคาต่อหน่วย กิจกรรมการเงินของคุณยังสะสมความก้าวหน้าให้ตัวละครด้วย', points: ['เทียบหลายร้านในสินค้ารายการเดียว', 'ดู XP เลเวล ชื่อเสียง และความสำเร็จที่โปรไฟล์'] },
] as const;

export default function WelcomeScreen() {
  return <PlayerGate>{() => <WelcomeTour />}</PlayerGate>;
}

function WelcomeTour() {
  const [index, setIndex] = useState(0);
  const scroll = useRef<ScrollView>(null);
  const { height, fontScale } = useWindowDimensions();
  const step = steps[index];
  const close = () => router.canGoBack() ? router.back() : router.replace('/play');
  function go(next: number) { setIndex(next); scroll.current?.scrollTo({ y: 0, animated: false }); }
  return <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.screen}>
    <Stack.Screen options={{ title: 'เริ่มต้น Coin Quest', headerRight: () => <Pressable accessibilityRole="button" accessibilityLabel="ปิดคำแนะนำ" onPress={close} style={styles.close}><Text style={styles.closeText}>ปิด</Text></Pressable> }} />
    <ScrollView ref={scroll} contentContainerStyle={styles.content}>
      <View style={[styles.artFrame, { height: height < 740 || fontScale > 1.2 ? 164 : 230 }]}><Image source={step.art} accessible={false} resizeMode="cover" style={[styles.art, index === 0 && styles.welcomeArt]} /></View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{step.eyebrow}</Text>
        <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>
        <View style={styles.points}>{step.points.map(point => <View key={point} style={styles.point}><Text accessible={false} style={styles.check}>✓</Text><Text style={styles.pointText}>{point}</Text></View>)}</View>
      </View>
    </ScrollView>
    <View style={styles.footer}>
      <View style={styles.progress}><Text accessibilityLabel={`คำแนะนำหน้า ${index + 1} จาก ${steps.length}`} style={styles.progressText}>{index + 1} / {steps.length}</Text><View accessible={false} style={styles.dots}>{steps.map((_, dot) => <View key={dot} style={[styles.dot, dot === index && styles.activeDot]} />)}</View></View>
      <View style={styles.actions}><View style={{ flex: 1 }}><Action title="ย้อนกลับ" secondary disabled={index === 0} onPress={() => go(index - 1)} /></View><View style={{ flex: 1.5 }}><Action title={index === steps.length - 1 ? 'พร้อมออกเดินทาง' : 'ถัดไป'} onPress={() => index === steps.length - 1 ? close() : go(index + 1)} /></View></View>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  close: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  closeText: { color: colors.green, fontFamily: fonts.emphasis, fontSize: 16 },
  content: { flexGrow: 1, width: '100%', maxWidth: 500, alignSelf: 'center', padding: 16, gap: 20 },
  artFrame: { overflow: 'hidden', borderRadius: 20, backgroundColor: colors.green, borderWidth: 1, borderColor: colors.gold },
  art: { width: '100%', height: '100%' },
  welcomeArt: { width: '200%', alignSelf: 'flex-start' },
  copy: { gap: 10, paddingHorizontal: 4 },
  eyebrow: { color: colors.gold, fontFamily: fonts.brand, fontSize: 11, lineHeight: 18, letterSpacing: 1.2 },
  title: { color: colors.ink, fontFamily: fonts.display, fontSize: 25, lineHeight: 38 },
  body: { color: colors.muted, fontFamily: fonts.body, fontSize: 15, lineHeight: 25 },
  points: { gap: 12, paddingTop: 6 },
  point: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  check: { color: colors.green, fontFamily: fonts.emphasis, fontSize: 16, lineHeight: 24 },
  pointText: { flex: 1, color: colors.ink, fontFamily: fonts.body, fontSize: 14, lineHeight: 24 },
  footer: { gap: 12, paddingHorizontal: 20, paddingBottom: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, width: '100%', maxWidth: 500, alignSelf: 'center' },
  progress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressText: { fontFamily: fonts.stat, color: colors.muted, fontSize: 13 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { height: 7, width: 7, borderRadius: 4, backgroundColor: colors.border },
  activeDot: { width: 22, backgroundColor: colors.green },
  actions: { flexDirection: 'row', gap: 12 },
});
