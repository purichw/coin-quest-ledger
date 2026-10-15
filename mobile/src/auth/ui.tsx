import { useId, useState, type ReactNode, type Ref } from 'react';
import { ActivityIndicator, Image, ImageBackground, InputAccessoryView, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View, type TextInputProps } from 'react-native';
import { useIsFocused } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { fonts } from '../theme/typography';
import { LivingArt } from '../player/LivingArt';

export const colors = { background: '#f2eadb', surface: '#fff9ed', ink: '#302b20', muted: '#6f634e', green: '#205b49', gold: '#956b22', border: '#d8c7a5', error: '#a33228' };

const seal = require('../../../assets/auth-guild/treasury-seal.webp');
const doorway = require('../../../assets/auth-guild/doorway.webp');
const parchment = require('../../../assets/auth-guild/parchment.webp');

// Both auth forms share field semantics, focus treatment and keyboard behavior.
// Values, validation and submit state remain owned by their respective screen.
export function Field({ label, hint, password = false, inputRef, ...props }: TextInputProps & { label: string; hint?: string; password?: boolean; inputRef?: Ref<TextInput> }) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const accessoryId = `coin-quest-numeric-${useId()}`;
  const numeric = props.keyboardType === 'decimal-pad' || props.keyboardType === 'number-pad';
  const numericAccessory = Platform.OS === 'ios' && numeric && !props.multiline && props.inputAccessoryViewID === undefined;
  const numericPattern = props.keyboardType === 'number-pad' ? /^\d*$/ : /^(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d*)?$/;
  const invalidNumber = numeric && !!props.value && !numericPattern.test(props.value);
  return <View style={ui.field}>
    <Text style={ui.label}>{label}</Text>
    <View style={[ui.inputFrame, focused && { borderColor: colors.green, backgroundColor: '#ffffff' }, invalidNumber && { borderColor: colors.error }]}>
      <TextInput ref={inputRef} accessibilityLabel={label} placeholderTextColor="#7d7059" autoCorrect={false} autoCapitalize="none" selectionColor={colors.green} {...props} inputAccessoryViewID={props.inputAccessoryViewID ?? (numericAccessory ? accessoryId : undefined)} secureTextEntry={password && !visible} onFocus={event => { setFocused(true); props.onFocus?.(event); }} onBlur={event => { setFocused(false); props.onBlur?.(event); }} style={[ui.input, props.style]} />
      {password && <Pressable accessibilityRole="button" accessibilityLabel={`${visible ? 'ซ่อน' : 'แสดง'}${label}`} onPress={() => setVisible(!visible)} style={ui.reveal}><Text style={ui.revealText}>{visible ? 'ซ่อน' : 'แสดง'}</Text></Pressable>}
    </View>
    {hint && <Text style={ui.hint}>{hint}</Text>}
    {invalidNumber && <ErrorNote message={props.keyboardType === 'number-pad' ? 'ใช้จำนวนเต็มตั้งแต่ 0 เท่านั้น' : 'ใช้ตัวเลขตั้งแต่ 0 และจุดทศนิยมเท่านั้น'} />}
    {numericAccessory && <InputAccessoryView nativeID={accessoryId} backgroundColor={colors.background}><View style={ui.keyboardBar}><Pressable accessibilityRole="button" accessibilityLabel="เสร็จ ปิดแป้นพิมพ์" onPress={Keyboard.dismiss} style={({ pressed }) => [ui.keyboardDone, pressed && { opacity: 0.6 }]}><Text style={ui.keyboardDoneText}>เสร็จ</Text></Pressable></View></InputAccessoryView>}
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

export function AuthPage({ children, header = false, compact = false }: { children: ReactNode; header?: boolean; compact?: boolean }) {
  const focused = useIsFocused();
  const content = <SafeAreaView edges={header ? ['left', 'right', 'bottom'] : ['top', 'left', 'right', 'bottom']} style={[ui.screen, compact && ui.illustratedScreen]}>
    {focused && <StatusBar style={compact ? 'light' : 'dark'} />}
    <ScrollView automaticallyAdjustKeyboardInsets keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} keyboardShouldPersistTaps="handled" contentContainerStyle={[ui.page, header && ui.formPage, compact && ui.compactPage]}>
      <View style={[ui.column, compact && ui.compactColumn]}>{children}</View>
    </ScrollView>
  </SafeAreaView>;
  return compact ? <ImageBackground source={doorway} resizeMode="cover" style={ui.authBackdrop}>{content}</ImageBackground> : content;
}

export function Brand() {
  return <View style={ui.brand}><Image source={seal} style={ui.seal} resizeMode="contain" accessible={false} /><View style={{ flex: 1, gap: 2 }}><Text style={ui.wordmark}>COIN QUEST</Text><Text style={ui.brandCaption}>LEDGER · ทุกการเดินทางมีเรื่องเล่า</Text></View></View>;
}

export function AuthHero() {
  const { height, fontScale } = useWindowDimensions();
  const small = height < 740 || fontScale > 1.2;
  return <View style={[ui.authHero, { minHeight: small ? 156 : 212 }]}>
    <LivingArt kind="seal" repeat={false}><Image source={seal} style={[ui.heroSeal, small && { width: 88, height: 92 }]} resizeMode="contain" accessible={false} /></LivingArt>
    <View style={ui.heroBrand}><Text style={ui.heroWordmark}>COIN QUEST</Text><Text style={ui.heroCaption}>LEDGER · Every Quest Counts</Text></View>
  </View>;
}

// The decorative sheet belongs to auth; shared financial cards keep their own
// surface and layout contracts. Stretch only the existing border/texture art.
export function AuthSheet({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return <ImageBackground source={parchment} resizeMode="stretch" style={[ui.authSheet, compact && ui.authSheetCompact]}>{children}</ImageBackground>;
}

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  page: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32, justifyContent: 'center' },
  formPage: { justifyContent: 'flex-start', paddingTop: 16 },
  compactPage: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 },
  column: { width: '100%', maxWidth: 460, alignSelf: 'center', gap: 20 },
  compactColumn: { gap: 0 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  seal: { width: 52, height: 56 },
  wordmark: { fontSize: 18, lineHeight: 27, letterSpacing: 1, fontFamily: fonts.brand, color: colors.green },
  brandCaption: { fontSize: 12, fontFamily: fonts.body, color: colors.muted, lineHeight: 20 },
  authBackdrop: { flex: 1, backgroundColor: '#203a2a' },
  illustratedScreen: { backgroundColor: 'transparent' },
  authHero: { justifyContent: 'center', alignItems: 'center', paddingVertical: 4 },
  heroBrand: { alignItems: 'center', paddingVertical: 4, paddingHorizontal: 16, borderRadius: 10, backgroundColor: 'rgba(21, 64, 47, 0.94)', borderWidth: 1, borderColor: '#d5b56b' },
  heroSeal: { width: 112, height: 118 },
  heroWordmark: { fontFamily: fonts.brand, fontSize: 21, lineHeight: 29, color: '#fff7e5', letterSpacing: 1 },
  heroCaption: { fontFamily: fonts.body, fontSize: 11, lineHeight: 18, color: '#f4d88c' },
  authSheet: { paddingHorizontal: 24, paddingTop: 44, paddingBottom: 44, gap: 16 },
  authSheetCompact: { paddingTop: 22, paddingBottom: 20, gap: 10 },
  title: { fontSize: 28, lineHeight: 42, fontFamily: fonts.display, color: colors.ink },
  description: { fontSize: 15, fontFamily: fonts.body, lineHeight: 25, color: colors.muted, marginTop: 5 },
  panel: { padding: 18, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 16 },
  field: { gap: 6 },
  label: { textAlign: 'center', color: colors.ink, fontSize: 14, fontFamily: fonts.emphasis, lineHeight: 22 },
  inputFrame: { borderWidth: 1, borderColor: '#a18c68', borderRadius: 12, backgroundColor: '#fffcf5', flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, minWidth: 0, minHeight: 50, paddingHorizontal: 14, paddingVertical: 11, color: colors.ink, fontSize: 16, fontFamily: fonts.body, lineHeight: 24 },
  keyboardBar: { minHeight: 44, alignItems: 'flex-end', paddingHorizontal: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  keyboardDone: { minHeight: 44, minWidth: 64, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  keyboardDoneText: { color: colors.green, fontSize: 16, lineHeight: 26, fontFamily: fonts.emphasis },
  reveal: { marginRight: 4, minHeight: 44, minWidth: 52, alignItems: 'center', justifyContent: 'center' },
  revealText: { color: colors.green, fontSize: 13, fontFamily: fonts.emphasis },
  hint: { color: colors.muted, fontSize: 12, fontFamily: fonts.body, lineHeight: 20 },
  action: { minHeight: 54, backgroundColor: colors.green, borderRadius: 13, padding: 14, gap: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  actionText: { color: colors.surface, fontSize: 16, lineHeight: 26, fontFamily: fonts.display, textAlign: 'center' },
  footer: { fontSize: 12, fontFamily: fonts.body, lineHeight: 21, color: colors.muted, textAlign: 'center' },
  error: { borderRadius: 12, padding: 12, backgroundColor: '#f7e5dc', borderWidth: 1, borderColor: '#e4b4a6' },
  errorText: { color: colors.error, fontSize: 14, fontFamily: fonts.body, lineHeight: 23 },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkText: { color: colors.green, fontSize: 14, fontFamily: fonts.emphasis, lineHeight: 24 },
  divider: { height: 1, backgroundColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  value: { fontSize: 16, color: colors.ink, fontFamily: fonts.emphasis, lineHeight: 26, flexShrink: 1 },
  loginTitle: { fontSize: 26, lineHeight: 36, fontFamily: fonts.display, color: colors.green, textAlign: 'center' },
  loginDescription: { fontSize: 14, lineHeight: 23, fontFamily: fonts.body, color: colors.muted, textAlign: 'center', marginTop: 3 },
  loginForm: { gap: 12 },
  loginMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 12 },
  loginRemember: { fontSize: 12, lineHeight: 20, fontFamily: fonts.body, color: colors.muted },
  signupLink: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center', alignItems: 'center', minHeight: 44, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  recoveryCode: { fontSize: 23, fontFamily: fonts.code, letterSpacing: 1.5, color: colors.ink, textAlign: 'center', lineHeight: 36 },
});
