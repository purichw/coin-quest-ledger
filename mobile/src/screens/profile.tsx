import { Image, StyleSheet, Text, View } from 'react-native';
import { avatarFor } from '../assets';
import { CLASSES } from '../pointy';
import { palette, ui } from '../theme';
import type { CharacterProfile, CharacterRecord, Lang } from '../types';
import { formatMoney, SectionTitle, Stat } from '../ui';

export function CharacterProfileScreen({ profile, character, lang }: { profile: CharacterProfile | null; character: CharacterRecord; lang: Lang }) {
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.banner}>
        <Image source={avatarFor(character)} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile?.displayName || character.name}</Text>
          <Text style={styles.rank}>#{character.id} · {CLASSES[character.class]?.[lang] || character.class}</Text>
          <Text style={styles.rank}>Level {profile?.level.lvl || 1} · {profile?.xp || 0} XP</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <Stat label={lang === 'en' ? 'Active' : 'บอร์ดเปิด'} value={String(profile?.totals.activeBoards || 0)} />
        <Stat label={lang === 'en' ? 'Fronted' : 'ออกแทน'} value={`฿${formatMoney(profile?.totals.fronted || 0)}`} />
        <Stat label={lang === 'en' ? 'Balance' : 'ยอดสุทธิ'} value={`฿${formatMoney(profile?.totals.balance || 0)}`} />
      </View>
      <SectionTitle>{lang === 'en' ? 'Trophy Hall' : 'หอถ้วยรางวัล'}</SectionTitle>
      <View style={styles.badgeGrid}>
        {(profile?.badges || []).map((badge) => (
          <View key={badge.id} style={styles.badge}>
            <Text style={styles.badgeMark}>★</Text>
            <Text style={styles.badgeName}>{badge.label}</Text>
          </View>
        ))}
      </View>
      <SectionTitle>{lang === 'en' ? 'My Boards' : 'บอร์ดของฉัน'}</SectionTitle>
      {profile?.boards.length ? profile.boards.map((board) => (
        <View key={board.id} style={styles.rowCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{board.tripName}</Text>
            <Text style={ui.muted}>{board.members} members · {board.quests} quests</Text>
          </View>
          <Text style={board.balance >= 0 ? styles.good : styles.bad}>฿{formatMoney(board.balance)}</Text>
        </View>
      )) : <Text style={ui.muted}>{lang === 'en' ? 'No synced boards yet.' : 'ยังไม่มีบอร์ดที่ sync'}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: palette.dark, padding: 18, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: { width: 84, height: 84, borderRadius: 21, borderWidth: 3, borderColor: palette.goldLight },
  name: { color: palette.parchment, fontSize: 25, fontWeight: '900' },
  rank: { color: '#d9b96a', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { width: '22.5%', aspectRatio: 1, borderRadius: 14, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center', padding: 5 },
  badgeMark: { color: palette.gold, fontSize: 21, fontWeight: '900' },
  badgeName: { color: palette.ink2, fontSize: 8.5, textAlign: 'center', fontWeight: '700' },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, borderRadius: 14, padding: 12 },
  rowTitle: { color: palette.ink, fontWeight: '900', fontSize: 15 },
  good: { color: palette.accent, fontWeight: '900' },
  bad: { color: palette.danger, fontWeight: '900' },
});
