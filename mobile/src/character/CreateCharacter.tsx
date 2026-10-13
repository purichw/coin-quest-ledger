import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthProvider';
import { Action, colors, ErrorNote, Field, ui } from '../auth/ui';
import { fonts } from '../theme/typography';
import { classes, classInfo } from './catalog';
import { validateCharacter } from './contracts';
import { Portrait } from './Portrait';

export function CreateCharacter() {
  const { session, busy, characterDraft: draft, updateCharacterDraft: update, createHero } = useAuth();
  const [error, setError] = useState('');
  const nameRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const confirming = useRef(false);
  if (session.status !== 'ready') return null;

  function submit() {
    if (busy || confirming.current) return;
    Keyboard.dismiss();
    const invalid = validateCharacter(draft);
    if (invalid) {
      setError(invalid);
      if (!draft.name.trim()) { scrollRef.current?.scrollTo({ y: 0 }); nameRef.current?.focus(); }
      return;
    }
    setError('');
    confirming.current = true;
    Alert.alert('พร้อมออกผจญภัย?', `สร้าง “${draft.name.trim()}” เป็น${classInfo(draft.classId as typeof classes[number]['id']).th}`, [
      { text: 'กลับไปแก้', style: 'cancel', onPress: () => { confirming.current = false; } },
      { text: 'สร้างตัวละคร', onPress: async () => { confirming.current = false; setError(await createHero(draft)); } },
    ], { cancelable: false });
  }

  return <SafeAreaView style={ui.screen} edges={['top', 'left', 'right', 'bottom']}>
    <View style={styles.top}><Text style={styles.eyebrow}>COIN QUEST</Text><Pressable disabled={busy} accessibilityRole="button" onPress={() => { Keyboard.dismiss(); router.push('/account'); }} style={styles.account}><Text style={ui.linkText}>บัญชี</Text></Pressable></View>
    <ScrollView ref={scrollRef} automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} contentContainerStyle={styles.content}>
      <View><Text style={ui.title}>นักผจญภัยคนใหม่</Text><Text style={ui.description}>ตั้งชื่อและเลือกตัวละครที่จะร่วมเดินทางกับคุณ</Text></View>
      <Field inputRef={nameRef} label="ชื่อตัวละคร" value={draft.name} onChangeText={name => { update({ name }); setError(''); }} editable={!busy} maxLength={30} autoCapitalize="words" autoComplete="off" textContentType="none" returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} placeholder="ชื่อที่อยากให้เพื่อนเรียก" hint="ใช้ชื่อไทยหรืออังกฤษได้ ไม่เกิน 30 ตัวอักษร" />
      <View style={{ gap: 10 }}><Text style={ui.label}>รูปลักษณ์</Text><View style={styles.segments}>
        {(['female', 'male'] as const).map(gender => <Pressable key={gender} accessibilityRole="radio" accessibilityState={{ checked: draft.gender === gender, disabled: busy }} disabled={busy} onPress={() => { Keyboard.dismiss(); update({ gender }); }} style={[styles.segment, draft.gender === gender && styles.segmentSelected]}><Text style={[styles.segmentText, draft.gender === gender && { color: colors.surface }]}>{gender === 'female' ? 'หญิง' : 'ชาย'}</Text></Pressable>)}
      </View></View>
      <View style={ui.row}><Text style={styles.section}>เลือกอาชีพ</Text><Text style={ui.hint}>18 อาชีพ</Text></View>
      <View style={styles.grid}>
        {classes.map(item => {
          const selected = draft.classId === item.id;
          return <Pressable key={item.id} accessibilityRole="radio" accessibilityLabel={`${item.th} ${draft.gender === 'female' ? 'หญิง' : 'ชาย'}`} accessibilityState={{ checked: selected, disabled: busy }} disabled={busy} onPress={() => { Keyboard.dismiss(); setError(''); update({ classId: item.id }); }} style={[styles.choice, selected && styles.selected]}>
            <Portrait classId={item.id} gender={draft.gender} style={styles.portrait} />
            <Text style={[styles.className, selected && { color: colors.green }]}>{item.th}</Text><Text style={styles.classEnglish}>{item.en}</Text>
            {selected && <View style={styles.check}><Text style={styles.checkText}>เลือกแล้ว</Text></View>}
          </Pressable>;
        })}
      </View>
      <Text style={ui.footer}>หนึ่งบัญชีมีตัวละครประจำตัวหนึ่งคน{ '\n' }Character ID จะเป็น {session.account.userId} เช่นเดียวกับ User ID</Text>
    </ScrollView>
    <View style={styles.bottom}>
      {draft.classId ? <View style={styles.selection}><Portrait classId={draft.classId} gender={draft.gender} style={{ width: 48, height: 48, borderRadius: 10 }} /><View style={{ flex: 1 }}><Text style={ui.value} numberOfLines={1}>{draft.name.trim() || 'ยังไม่ได้ตั้งชื่อ'}</Text><Text style={ui.hint}>{classInfo(draft.classId).th} · {draft.gender === 'female' ? 'หญิง' : 'ชาย'}</Text></View></View> : <Text style={ui.footer}>แตะภาพเพื่อเลือกอาชีพที่ชอบ</Text>}
      <ErrorNote message={error} /><Action title={busy ? 'กำลังสร้างตัวละคร…' : 'สร้างตัวละคร'} busy={busy} onPress={submit} />
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52 },
  eyebrow: { fontFamily: fonts.brand, fontSize: 15, letterSpacing: 1.5, color: colors.green },
  account: { minHeight: 44, minWidth: 60, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24, paddingTop: 12, gap: 22, maxWidth: 560, width: '100%', alignSelf: 'center' },
  section: { fontFamily: fonts.display, fontSize: 19, color: colors.ink },
  segments: { flexDirection: 'row', padding: 4, borderRadius: 14, borderColor: colors.border, borderWidth: 1, backgroundColor: colors.surface },
  segment: { flex: 1, minHeight: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  segmentSelected: { backgroundColor: colors.green },
  segmentText: { fontFamily: fonts.emphasis, fontSize: 15, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  choice: { flexBasis: '46%', flexGrow: 1, borderWidth: 2, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.surface, padding: 9, alignItems: 'center', gap: 3 },
  selected: { borderColor: colors.green, backgroundColor: '#f0f4df' },
  portrait: { width: '100%', height: 145, borderRadius: 11 },
  className: { fontFamily: fonts.display, fontSize: 15, lineHeight: 24, color: colors.ink },
  classEnglish: { fontFamily: fonts.body, fontSize: 11, lineHeight: 17, color: colors.muted },
  check: { position: 'absolute', top: 8, right: 8, backgroundColor: colors.green, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  checkText: { fontFamily: fonts.emphasis, color: colors.surface, fontSize: 10 },
  bottom: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 10, gap: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  selection: { flexDirection: 'row', gap: 12, alignItems: 'center' },
});
