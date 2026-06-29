import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { avatarFor } from './assets';
import { tabs, type ViewKey } from './copy';
import { CLASSES } from './pointy';
import { palette, shellColors, ui } from './theme';
import type { CharacterRecord, Lang, ThemeName } from './types';

export function Shell({ children, theme }: { children: ReactNode; theme: ThemeName }) {
  const dark = theme === 'dungeon';
  return (
    <LinearGradient colors={shellColors(theme)} style={styles.root}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      {children}
    </LinearGradient>
  );
}

export function TopChrome({
  character,
  lang,
  theme,
  onProfile,
  onLang,
  onTheme,
}: {
  character: CharacterRecord;
  lang: Lang;
  theme: ThemeName;
  onProfile: () => void;
  onLang: () => void;
  onTheme: () => void;
}) {
  return (
    <View style={styles.topbar}>
      <Pressable style={styles.heroChip} onPress={onProfile}>
        <Image source={avatarFor(character)} style={styles.avatar} />
        <View style={{ minWidth: 0 }}>
          <Text style={styles.chipName} numberOfLines={1}>{character.name}</Text>
          <Text style={styles.chipMeta} numberOfLines={1}>#{character.id} · {CLASSES[character.class]?.[lang] || character.class}</Text>
        </View>
      </Pressable>
      <View style={styles.actions}>
        <Pressable style={styles.circleButton} onPress={onLang}><Text style={styles.circleText}>{lang.toUpperCase()}</Text></Pressable>
        <Pressable style={styles.circleButton} onPress={onTheme}><Text style={styles.circleText}>{theme === 'dungeon' ? '☀' : '☾'}</Text></Pressable>
      </View>
    </View>
  );
}

export function BottomTabs({ view, lang, onChange, onPlus }: { view: ViewKey; lang: Lang; onChange: (view: ViewKey) => void; onPlus: () => void }) {
  return (
    <View style={styles.nav}>
      {tabs.map((tab) => (
        <Pressable key={tab.key} style={[styles.navItem, view === tab.key && styles.navActive]} onPress={() => onChange(tab.key)}>
          <Glyph id={tab.glyph} active={view === tab.key} accent={tab.accent} />
          <Text style={styles.navText}>{lang === 'en' ? tab.en : tab.th}</Text>
        </Pressable>
      ))}
      <Pressable style={styles.fab} onPress={onPlus}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

export function Glyph({ id, active = false, accent = palette.accent }: { id: string; active?: boolean; accent?: string }) {
  const label: Record<string, string> = { castle: '♜', scales: '⚖', dragon: '◆', vault: '▣', merchant: '$', coin: '¢', sword: '⚔', trophy: '★' };
  return (
    <View style={[styles.glyph, active && { backgroundColor: accent, borderColor: accent }]}>
      <Text style={[styles.glyphText, active && styles.glyphTextActive]}>{label[id] || '•'}</Text>
    </View>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function EmptyState({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <View style={[ui.card, { gap: 10, minHeight: 168, justifyContent: 'center' }]}>
      <Glyph id="coin" active accent={palette.gold} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={ui.muted}>{body}</Text>
      {action && onAction ? (
        <Pressable style={[ui.primaryButton, { alignSelf: 'flex-start', marginTop: 6 }]} onPress={onAction}>
          <Text style={ui.primaryText}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function formatMoney(value: number): string {
  return (Number(value) || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 });
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topbar: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: 8 },
  heroChip: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(253,248,236,.9)', borderColor: palette.line, borderWidth: 1, borderRadius: 18, padding: 8, maxWidth: '68%' },
  avatar: { width: 46, height: 46, borderRadius: 13, borderWidth: 2, borderColor: palette.gold },
  chipName: { fontWeight: '900', color: palette.ink, fontSize: 16 },
  chipMeta: { color: palette.ink2, fontSize: 12 },
  circleButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(253,248,236,.92)', borderWidth: 1, borderColor: palette.line },
  circleText: { color: palette.ink, fontWeight: '800', fontSize: 15 },
  nav: { position: 'absolute', left: 14, right: 14, bottom: 18, minHeight: 78, borderRadius: 30, backgroundColor: 'rgba(253,248,236,.94)', borderWidth: 1, borderColor: palette.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8 },
  navItem: { width: 58, alignItems: 'center', justifyContent: 'center', gap: 4, opacity: 0.62 },
  navActive: { opacity: 1 },
  navText: { fontSize: 10.5, fontWeight: '900', color: palette.ink },
  fab: { position: 'absolute', left: '50%', marginLeft: -31, top: -27, width: 62, height: 62, borderRadius: 31, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: palette.bg },
  fabText: { color: '#fff', fontSize: 36, fontWeight: '700', marginTop: -4 },
  glyph: { width: 28, height: 28, borderRadius: 10, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card2, alignItems: 'center', justifyContent: 'center' },
  glyphText: { color: palette.ink, fontWeight: '900', fontSize: 15 },
  glyphTextActive: { color: '#fff' },
  stat: { flex: 1, borderRadius: 13, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, padding: 12 },
  statValue: { fontSize: 20, fontWeight: '900', color: palette.ink },
  statLabel: { fontSize: 11, color: palette.ink2, fontWeight: '700' },
  section: { fontSize: 15, color: palette.ink, fontWeight: '900', marginTop: 8, marginBottom: 2 },
  emptyTitle: { fontSize: 22, color: palette.ink, fontWeight: '900' },
});
