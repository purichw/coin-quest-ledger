import { useState, type ReactNode, type Ref } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../theme/typography';

// Classic player brand, aligned with shared/player-brand.css on the website.
export const colors = {
  background: '#e7dcc6', surface: '#fbf6ea', surfaceAlt: '#f3e9d4', input: '#fffdf7',
  ink: '#2f2515', muted: '#715f46', green: '#277b4e', gold: '#987016', goldSoft: '#efe0b6',
  border: '#ddc9a3', borderStrong: '#987f55', error: '#b63929',
  hero: '#254e3b', heroDeep: '#204532', track: '#e6d7b5',
};

// Both auth forms share field semantics, focus treatment and keyboard behavior.
// Values, validation and submit state remain owned by their respective screen.
export function Field({ label, hint, password = false, inputRef, ...props }: TextInputProps & { label: string; hint?: string; password?: boolean; inputRef?: Ref<TextInput> }) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return <View style={ui.field}>
    <Text style={ui.label}>{label}</Text>
    <View style={[ui.inputFrame, focused && { borderColor: colors.green, borderWidth: 2 }]}>
      <TextInput ref={inputRef} accessibilityLabel={label} placeholderTextColor={colors.muted} autoCorrect={false} autoCapitalize="none" {...props} secureTextEntry={password && !visible} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={ui.input} />
      {password && <Pressable accessibilityRole="button" accessibilityLabel={`${visible ? 'ซ่อน' : 'แสดง'}${label}`} onPress={() => setVisible(!visible)} style={ui.reveal}><Text style={ui.revealText}>{visible ? 'ซ่อน' : 'แสดง'}</Text></Pressable>}
    </View>
    {hint && <Text style={ui.hint}>{hint}</Text>}
  </View>;
}

export function Action({ title, onPress, busy = false, secondary = false, disabled = false }: { title: string; onPress: () => void; busy?: boolean; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={onPress} style={({ pressed }) => [ui.action, secondary && ui.secondary, (pressed || disabled || busy) && { opacity: 0.65 }]}>
    {busy && <ActivityIndicator color={secondary ? colors.green : colors.surface} />}
    <Text style={[ui.actionText, secondary && { color: colors.green }]}>{title}</Text>
  </Pressable>;
}

export function ErrorNote({ message }: { message?: string }) {
  return message ? <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={ui.error}><Text style={ui.errorText}>{message}</Text></View> : null;
}

export function AuthPage({ children, header = false }: { children: ReactNode; header?: boolean }) {
  return <SafeAreaView edges={header ? ['left', 'right', 'bottom'] : ['top', 'left', 'right', 'bottom']} style={ui.screen}>
    <ScrollView automaticallyAdjustKeyboardInsets keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} keyboardShouldPersistTaps="handled" contentContainerStyle={ui.page}>
      <View style={ui.column}>{children}</View>
    </ScrollView>
  </SafeAreaView>;
}

export function Brand() {
  return <View style={ui.brand}><View style={ui.mark}><Text style={ui.markText}>CQ</Text></View><View style={{ gap: 3 }}><Text style={ui.wordmark}>COIN QUEST</Text><Text style={ui.brandCaption}>LEDGER · ทุกการเดินทางมีเรื่องเล่า</Text></View></View>;
}

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  page: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32, justifyContent: 'center' },
  column: { width: '100%', maxWidth: 460, alignSelf: 'center', gap: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  mark: { width: 54, height: 58, borderRadius: 17, backgroundColor: colors.green, borderWidth: 1, borderColor: '#1d5738', alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#f4d687', fontSize: 23, fontFamily: fonts.brand },
  wordmark: { fontSize: 18, letterSpacing: 2, fontFamily: fonts.brand, color: colors.ink },
  brandCaption: { fontSize: 11, fontFamily: fonts.body, color: colors.muted, lineHeight: 19 },
  title: { fontSize: 26, lineHeight: 39, fontFamily: fonts.display, color: colors.ink },
  description: { fontSize: 15, fontFamily: fonts.body, lineHeight: 25, color: colors.muted, marginTop: 5 },
  panel: { padding: 20, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 18 },
  field: { gap: 8 },
  label: { textAlign: 'center', color: colors.ink, fontSize: 14, fontFamily: fonts.emphasis, lineHeight: 22 },
  inputFrame: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 12, backgroundColor: colors.input, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, minWidth: 0, minHeight: 52, paddingHorizontal: 14, paddingVertical: 12, color: colors.ink, fontSize: 16, fontFamily: fonts.body, lineHeight: 24 },
  reveal: { marginRight: 4, minHeight: 44, minWidth: 52, alignItems: 'center', justifyContent: 'center' },
  revealText: { color: colors.green, fontSize: 12, fontFamily: fonts.emphasis },
  hint: { color: colors.muted, fontSize: 12, fontFamily: fonts.body, lineHeight: 20 },
  action: { minHeight: 54, backgroundColor: colors.green, borderRadius: 13, padding: 14, gap: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  actionText: { color: colors.surface, fontSize: 15, lineHeight: 25, fontFamily: fonts.emphasis, textAlign: 'center' },
  footer: { fontSize: 12, fontFamily: fonts.body, lineHeight: 21, color: colors.muted, textAlign: 'center' },
  error: { borderRadius: 12, padding: 12, backgroundColor: '#f7e5dc', borderWidth: 1, borderColor: '#e4b4a6' },
  errorText: { color: colors.error, fontSize: 14, fontFamily: fonts.body, lineHeight: 23 },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkText: { color: colors.green, fontSize: 14, fontFamily: fonts.emphasis, lineHeight: 24 },
  divider: { height: 1, backgroundColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  value: { fontSize: 16, color: colors.ink, fontFamily: fonts.emphasis, lineHeight: 26, flexShrink: 1 },
});
