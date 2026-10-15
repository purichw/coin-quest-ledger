import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Redirect, useFocusEffect, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, Image, ImageBackground, Platform, Pressable, ScrollView, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthProvider';
import { Action, colors, ErrorNote, ui } from '../auth/ui';
import { fonts } from '../theme/typography';
import { authMessage, type Account } from '../auth/contracts';
import type { Character } from '../character/contracts';
import { canon } from '../domain/canon';

export type Player = { account: Account; hero: Character };
export function PlayerGate({ children }: { children: (player: Player) => ReactNode }) {
  const { session } = useAuth();
  if (session.status === 'loading') return <Loading />;
  if (session.status !== 'ready' || !session.character || session.recoveryCode) return <Redirect href="/" />;
  return children({ account: session.account, hero: session.character });
}
export function Page({ children, scene }: { children: ReactNode; scene?: keyof typeof scenes }) {
  const focused = useIsFocused();
  return <View style={ui.screen}>{focused && <StatusBar style={scene ? 'light' : 'dark'} />}{scene && <SceneBackdrop kind={scene} />}<SafeAreaView style={[ui.screen, scene && { backgroundColor: 'transparent' }]} edges={['left', 'right', 'bottom']}><ScrollView contentInsetAdjustmentBehavior="automatic" automaticallyAdjustKeyboardInsets keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} keyboardShouldPersistTaps="handled" contentContainerStyle={p.page}>{children}</ScrollView></SafeAreaView></View>;
}
const scenes = {
  home: require('../../../assets/home-reference/tavern-banner.webp'),
  split: require('../../../assets/board-reference/village-dusk.webp'),
  debt: require('../../../assets/debt-reference/valley-dragon.webp'),
  treasury: require('../../../assets/treasury-reference/castle-banner.webp'),
  prices: require('../../../assets/price-reference/market-banner.webp'),
  character: require('../../../assets/character-reference/forest-valley.webp'),
};
export function SceneBackdrop({ kind }: { kind: keyof typeof scenes }) {
  const source = kind === 'home' ? require('../../../assets/auth-guild/doorway.webp') : scenes[kind];
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}><Image source={source} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} /><View style={[StyleSheet.absoluteFill, { backgroundColor: '#10271f66' }]} /></View>;
}
export function SceneHeader({ kind, title, subtitle }: { kind: keyof typeof scenes; title: string; subtitle?: string }) {
  return <ImageBackground source={scenes[kind]} resizeMode="cover" style={p.scene} imageStyle={p.sceneImage}>
    <View style={p.sceneShade}><Text style={p.sceneTitle}>{title}</Text>{subtitle && <Text style={p.sceneSubtitle}>{subtitle}</Text>}</View>
  </ImageBackground>;
}
// Collapse secondary tools without unmounting drafts or triggering another load.
export function Disclosure({ title, children, initiallyOpen = false, art }: { title: string; children: ReactNode; initiallyOpen?: boolean; art?: ImageSourcePropType }) {
  const [open, setOpen] = useState(initiallyOpen);
  return <View style={p.disclosure}><Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={p.disclosureHeader}>
    {art && <Image source={art} accessible={false} resizeMode="contain" style={p.disclosureArt} />}<Text style={[p.section, { flex: 1 }]}>{title}</Text><Text accessible={false} style={p.disclosureChevron}>{open ? '−' : '+'}</Text>
  </Pressable><View style={[p.disclosureBody, !open && { display: 'none' }]} accessibilityElementsHidden={!open} importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}>{children}</View></View>;
}
export function Loading() { return <View style={p.loading}><ActivityIndicator accessibilityLabel="กำลังโหลดข้อมูล" color={colors.green} /></View>; }
export function Card({ title, children }: { title?: string; children: ReactNode }) { return <View style={[ui.panel, { gap: 14 }]}>{title && <Text style={p.section}>{title}</Text>}{children}</View>; }
export function Body({ children }: { children: ReactNode }) { return <Text style={p.body}>{children}</Text>; }
export function Choice({ label, selected, onPress, disabled = false, multiple = false }: { label: string; selected: boolean; onPress: () => void; disabled?: boolean; multiple?: boolean }) {
  return <Pressable accessibilityRole={multiple ? 'checkbox' : 'radio'} accessibilityLabel={label} accessibilityState={{ checked: selected, disabled }} onPress={onPress} disabled={disabled} style={[p.choice, selected && p.selected]}><Text style={[p.choiceText, selected && { color: colors.surface }]}>{label}</Text></Pressable>;
}
export function Row({ title, detail, onPress }: { title: string; detail?: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={p.row}><View style={{ flex: 1, gap: 4 }}><Text style={ui.value}>{title}</Text>{detail && <Text style={ui.hint}>{detail}</Text>}</View><Text style={p.section}>›</Text></Pressable>;
}
export function Stats({ items }: { items: [string, string, ImageSourcePropType?][] }) { return <View style={p.stats}>{items.map(([label, value, art], index) => <View key={label} style={[p.stat, items.length % 2 === 1 && index === 0 && { flexBasis: '100%' }]}>{art && <Image source={art} accessible={false} resizeMode="contain" style={p.statArt} />}<Text style={[ui.hint, { textAlign: 'center' }]}>{label}</Text><Text style={p.number}>{value}</Text></View>)}</View>; }
export const money = (value: number) => `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const number = (value: string) => value.trim() ? canon.parseNumberInput(value) : NaN;
export function confirm(title: string, message: string, action: () => void, actionLabel = 'ยืนยัน') {
  Alert.alert(title, message, [{ text: 'ยกเลิก', style: 'cancel' }, { text: actionLabel, onPress: action }]);
}
export function messageOf(error: unknown) {
  const code = (error as { code?: string })?.code;
  return code ? authMessage(error) : error instanceof Error ? error.message : 'ทำรายการไม่สำเร็จ ลองอีกครั้ง';
}
export function useWork() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const lock = useRef(false);
  async function run(work: () => Promise<unknown>) {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try { await work(); } catch (e) { setError(messageOf(e)); } finally { lock.current = false; setBusy(false); }
  }
  return { busy, error, setError, run };
}
export function useLoad<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const revision = useRef(0);
  const reload = useCallback(async () => {
    const version = ++revision.current; setLoading(true); setError('');
    try { const next = await loader(); if (version === revision.current) setData(next); }
    catch (e) { if (version === revision.current) setError(messageOf(e)); }
    finally { if (version === revision.current) setLoading(false); }
  }, [loader]);
  useFocusEffect(useCallback(() => { void reload(); return () => { revision.current++; }; }, [reload]));
  return { data, setData, error, loading, reload };
}
export function LoadError({ error, retry }: { error: string; retry: () => void }) { return <Page><ErrorNote message={error} /><Action title="ลองโหลดใหม่" onPress={retry} /></Page>; }
export const p = StyleSheet.create({
  page: { padding: 16, paddingBottom: 28, width: '100%', maxWidth: 640, alignSelf: 'center', gap: 16 },
  scene: { minHeight: 200, justifyContent: 'flex-end', borderRadius: 20, overflow: 'hidden', backgroundColor: '#244b3c', borderWidth: 1, borderColor: '#c8ad70' },
  sceneImage: { borderRadius: 19 },
  sceneShade: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#132b22e8', gap: 2, borderTopWidth: 1, borderColor: '#d3b96c80' },
  sceneTitle: { fontFamily: fonts.display, fontSize: 23, lineHeight: 33, color: '#fff8e8' },
  sceneSubtitle: { fontFamily: fonts.body, fontSize: 12, lineHeight: 20, color: '#f3e7c7' },
  disclosure: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.surface, overflow: 'hidden' },
  disclosureHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 18, paddingVertical: 12 },
  disclosureChevron: { color: colors.green, fontSize: 25, lineHeight: 30, textAlign: 'center', width: 28 },
  disclosureArt: { width: 36, height: 40 },
  disclosureBody: { paddingHorizontal: 16, paddingBottom: 18, gap: 14 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  section: { fontFamily: fonts.display, fontSize: 18, lineHeight: 28, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 24, color: colors.muted },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 46, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  selected: { backgroundColor: colors.green, borderColor: colors.green },
  choiceText: { fontFamily: fonts.emphasis, fontSize: 13, lineHeight: 23, textAlign: 'center', color: colors.ink },
  row: { minHeight: 62, paddingVertical: 12, gap: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  stats: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 12 },
  stat: { flexGrow: 1, flexBasis: '44%', minWidth: 0, minHeight: 76, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 5 },
  statArt: { width: 34, height: 34 },
  number: { fontFamily: fonts.stat, fontSize: 23, lineHeight: 33, textAlign: 'center', color: colors.ink },
});
