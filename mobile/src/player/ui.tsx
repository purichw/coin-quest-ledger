import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Redirect, useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthProvider';
import { Action, colors, ErrorNote, ui } from '../auth/ui';
import { fonts } from '../theme/typography';
import { authMessage, type Account } from '../auth/contracts';
import type { Character } from '../character/contracts';

export type Player = { account: Account; hero: Character };
export function PlayerGate({ children }: { children: (player: Player) => ReactNode }) {
  const { session } = useAuth();
  if (session.status === 'loading') return <Loading />;
  if (session.status !== 'ready' || !session.character || session.recoveryCode) return <Redirect href="/" />;
  return children({ account: session.account, hero: session.character });
}
export function Page({ children }: { children: ReactNode }) {
  return <SafeAreaView style={ui.screen} edges={['left', 'right', 'bottom']}><ScrollView automaticallyAdjustKeyboardInsets keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} keyboardShouldPersistTaps="handled" contentContainerStyle={p.page}>{children}</ScrollView></SafeAreaView>;
}
export function Loading() { return <View style={p.loading}><ActivityIndicator accessibilityLabel="กำลังโหลดข้อมูล" color={colors.green} /></View>; }
export function Card({ title, children }: { title?: string; children: ReactNode }) { return <View style={[ui.panel, { gap: 14 }]}>{title && <Text style={p.section}>{title}</Text>}{children}</View>; }
export function Intro({ title, description, glyph }: { title: string; description: string; glyph: string }) {
  return <View style={p.intro}><View style={{ flex: 1, gap: 5 }}><Text style={ui.title}>{title}</Text><Body>{description}</Body></View><View style={p.introMark}><Text accessible={false} style={p.introGlyph}>{glyph}</Text></View></View>;
}
export function Body({ children }: { children: ReactNode }) { return <Text style={p.body}>{children}</Text>; }
export function Choice({ label, selected, onPress, disabled = false, multiple = false }: { label: string; selected: boolean; onPress: () => void; disabled?: boolean; multiple?: boolean }) {
  return <Pressable accessibilityRole={multiple ? 'checkbox' : 'radio'} accessibilityLabel={label} accessibilityState={{ checked: selected, disabled }} onPress={onPress} disabled={disabled} style={[p.choice, selected && p.selected]}><Text style={[p.choiceText, selected && { color: colors.surface }]}>{label}</Text></Pressable>;
}
export function Row({ title, detail, onPress }: { title: string; detail?: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={p.row}><View style={{ flex: 1, gap: 4 }}><Text style={ui.value}>{title}</Text>{detail && <Text style={ui.hint}>{detail}</Text>}</View><Text style={p.section}>›</Text></Pressable>;
}
export function Stats({ items }: { items: [string, string][] }) { return <View style={p.stats}>{items.map(([label, value], index) => <View key={label} style={[p.stat, items.length % 2 === 1 && index === 0 && p.statWide]}><Text style={p.number}>{value}</Text><Text style={[ui.hint, { textAlign: 'center' }]}>{label}</Text></View>)}</View>; }
export const money = (value: number) => `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const number = (value: string) => Number(value.replace(/,/g, ''));
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
  page: { padding: 20, paddingTop: 16, paddingBottom: 40, width: '100%', maxWidth: 600, alignSelf: 'center', gap: 20 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  section: { fontFamily: fonts.display, fontSize: 18, lineHeight: 28, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 24, color: colors.muted },
  intro: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 8 },
  introMark: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#eee5c9', alignItems: 'center', justifyContent: 'center' },
  introGlyph: { color: colors.gold, fontSize: 25, lineHeight: 34 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 46, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  selected: { backgroundColor: colors.green, borderColor: colors.green },
  choiceText: { fontFamily: fonts.emphasis, fontSize: 13, lineHeight: 23, textAlign: 'center', color: colors.ink },
  row: { minHeight: 68, paddingVertical: 14, gap: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  stats: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', gap: 10 },
  stat: { flexGrow: 1, flexBasis: '45%', minHeight: 96, alignItems: 'center', justifyContent: 'center', padding: 12, gap: 6, borderRadius: 16, backgroundColor: '#eeefe6' },
  statWide: { flexBasis: '100%' },
  number: { fontFamily: fonts.stat, fontSize: 25, lineHeight: 36, textAlign: 'center', color: colors.ink },
});
