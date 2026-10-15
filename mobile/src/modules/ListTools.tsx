import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, ui } from '../auth/ui';
import { fonts } from '../theme/typography';

export function ListTools({ label, query, onQuery, summary, count, changed, onReset, children }: {
  label: string; query: string; onQuery: (value: string) => void;
  summary: string; count: number; changed: boolean; onReset: () => void; children: ReactNode;
}) {
  const [open, setOpen] = useState(false); const [focused, setFocused] = useState(false);
  return <View style={styles.panel}>
    <Text style={ui.label}>{label}</Text>
    <View style={styles.searchRow}><TextInput accessibilityLabel={label} value={query} onChangeText={onQuery} placeholder={label} placeholderTextColor={colors.muted} selectionColor={colors.green} autoCorrect={false} autoCapitalize="none" clearButtonMode="while-editing" returnKeyType="search" onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[styles.input, focused && { borderColor: colors.green }]} /><Pressable accessibilityRole="button" accessibilityLabel="ตัวกรองและการเรียงรายการ" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={[styles.toggle, open && styles.selected]}><Text style={[styles.toggleText, open && { color: colors.surface }]}>กรอง {open ? '−' : '+'}</Text></Pressable></View>
    <View style={styles.summary}><Text style={[ui.hint, { flex: 1 }]}>{summary} · {count} รายการ</Text>{changed && <Pressable accessibilityRole="button" accessibilityLabel="ล้างคำค้นและตัวกรอง" onPress={onReset} style={styles.reset}><Text style={styles.toggleText}>ล้าง</Text></Pressable>}</View>
    <View style={[styles.options, !open && { display: 'none' }]} accessibilityElementsHidden={!open} importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}>{children}</View>
  </View>;
}

const styles = StyleSheet.create({
  panel: { padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 8 },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, minWidth: 0, minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fffdf7', fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  toggle: { minWidth: 64, minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  selected: { backgroundColor: colors.green },
  toggleText: { fontFamily: fonts.emphasis, fontSize: 13, lineHeight: 22, color: colors.green },
  summary: { flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 24 },
  reset: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  options: { gap: 10, paddingTop: 4 },
});
