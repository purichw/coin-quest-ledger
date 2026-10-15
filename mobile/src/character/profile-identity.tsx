import { ImageBackground, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { colors } from '../auth/ui';
import { LivingArt } from '../player/LivingArt';
import { fonts } from '../theme/typography';
import { classInfo } from './catalog';
import type { Character } from './contracts';
import { Portrait } from './Portrait';

export function ProfileIdentity({ hero, username, onEdit, onShare }: { hero: Character; username?: string; onEdit?: () => void; onShare: () => void }) {
  return <ImageBackground source={require('../../../assets/character-reference/forest-valley.webp')} resizeMode="cover" style={styles.hero}>
    <View style={styles.identity}>
      <LivingArt style={styles.portrait}><Portrait classId={hero.classId} gender={hero.gender} skin={hero.skin} style={{ width: 112, height: 180, backgroundColor: 'transparent' }} /></LivingArt>
      <View style={styles.details}><Text style={styles.name}>{hero.name}</Text><Text style={styles.className}>{classInfo(hero.classId).th} · #{hero.id}</Text><Text style={styles.caption}>{username ? `@${username}` : 'โปรไฟล์สาธารณะ'}</Text>
        <View style={styles.actions}>{onEdit && <Pressable accessibilityRole="button" onPress={onEdit} style={({ pressed }) => [styles.action, pressed && { opacity: .65 }]}><Text style={styles.actionText}>แต่งตัวละคร</Text></Pressable>}<Pressable accessibilityRole="button" accessibilityLabel={`แชร์โปรไฟล์ ${hero.name}`} onPress={onShare} style={({ pressed }) => [styles.action, pressed && { opacity: .65 }]}><Text style={styles.actionText}>แชร์</Text></Pressable></View>
      </View>
    </View>
  </ImageBackground>;
}

export function ProfilePrivacy({ hidden, onChange, disabled = false }: { hidden: boolean; onChange: (hidden: boolean) => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="switch" accessibilityLabel="ซ่อนยอดเงินบนหน้านี้" accessibilityHint="ใช้การตั้งค่านี้กับลิงก์ที่แชร์ด้วย" accessibilityState={{ checked: hidden, disabled }} disabled={disabled} onPress={() => onChange(!hidden)} style={styles.privacy}>
    <Text style={styles.privacyLabel}>ซ่อนยอดเงิน</Text><View pointerEvents="none"><Switch accessible={false} value={hidden} disabled={disabled} trackColor={{ false: colors.border, true: colors.green }} /></View>
  </Pressable>;
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#c8ad70', backgroundColor: '#244b3c' },
  identity: { minHeight: 212, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#10271f88' },
  portrait: { width: 112 },
  details: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontFamily: fonts.display, fontSize: 23, lineHeight: 33, color: '#fff8e8' },
  className: { fontFamily: fonts.body, fontSize: 13, lineHeight: 22, color: '#f3e7c7' },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 20, color: '#f3e7c7' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  action: { minHeight: 44, minWidth: 48, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#d3b96c', backgroundColor: '#1f513fe8' },
  actionText: { fontFamily: fonts.emphasis, fontSize: 14, lineHeight: 24, color: '#fff4d6' },
  privacy: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  privacyLabel: { flex: 1, fontFamily: fonts.body, fontSize: 15, lineHeight: 24, color: colors.ink },
});
