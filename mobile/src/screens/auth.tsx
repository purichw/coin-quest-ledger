import { useState } from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { avatarFor } from '../assets';
import { type AuthMode } from '../copy';
import { normalizeUsername } from '../data';
import { CLASS_ORDER, CLASSES } from '../pointy';
import { palette, ui } from '../theme';
import type { Account, Gender, Lang } from '../types';
import { Glyph } from '../ui';

export function LoginScreen({
  c,
  busy,
  error,
  lang,
  onLang,
  onTheme,
  onSubmit,
}: {
  c: Record<string, string>;
  busy: boolean;
  error: string;
  lang: Lang;
  onLang: () => void;
  onTheme: () => void;
  onSubmit: (mode: AuthMode, username: string, password: string, displayName: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<AuthMode>('in');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  return (
    <SafeAreaView style={ui.safe}>
      <View style={styles.loginTop}>
        <Pressable style={styles.circle} onPress={onLang}><Text style={styles.circleText}>{lang.toUpperCase()}</Text></Pressable>
        <Pressable style={styles.circle} onPress={onTheme}><Text style={styles.circleText}>☾</Text></Pressable>
      </View>
      <View style={styles.authCard}>
        <Glyph id="coin" active accent={palette.gold} />
        <Text style={styles.logo}>Coin Quest Ledger</Text>
        <View style={styles.segment}>
          <Pressable style={[styles.segmentItem, mode === 'in' && styles.segmentOn]} onPress={() => setMode('in')}><Text style={styles.segmentText}>{c.signIn}</Text></Pressable>
          <Pressable style={[styles.segmentItem, mode === 'up' && styles.segmentOn]} onPress={() => setMode('up')}><Text style={styles.segmentText}>{c.signUp}</Text></Pressable>
        </View>
        <TextInput style={ui.input} value={username} onChangeText={(value) => setUsername(normalizeUsername(value))} autoCapitalize="none" placeholder={c.username} />
        {mode === 'up' ? <TextInput style={ui.input} value={displayName} onChangeText={setDisplayName} placeholder={c.displayName} /> : null}
        <TextInput style={ui.input} value={password} onChangeText={setPassword} secureTextEntry placeholder={c.password} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[ui.primaryButton, busy && styles.disabled]} disabled={busy} onPress={() => onSubmit(mode, username, password, displayName)}>
          <Text style={ui.primaryText}>{busy ? '...' : mode === 'in' ? c.signIn : c.signUp}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export function CharacterCreation({
  account,
  c,
  lang,
  busy,
  error,
  onCreate,
  onSignOut,
}: {
  account: Account;
  c: Record<string, string>;
  lang: Lang;
  busy: boolean;
  error: string;
  onCreate: (input: { name: string; cls: string; gender: Gender }) => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  const [name, setName] = useState(account.name);
  const [cls, setCls] = useState('warrior');
  const [gender, setGender] = useState<Gender>('male');
  const preview = { id: account.userId, name: name || account.name, class: cls, cls, gender, skin: '' };
  return (
    <SafeAreaView style={ui.safe}>
      <ScrollView contentContainerStyle={[ui.content, { paddingTop: 18 }]}>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Glyph id="coin" active accent={palette.gold} />
          <Text style={ui.h1}>{c.createCharacter}</Text>
          <Text style={ui.muted}>User ID · <Text style={{ color: palette.gold, fontWeight: '900' }}>{account.userId}</Text></Text>
          <Image source={avatarFor(preview)} style={styles.previewAvatar} />
          <Text style={ui.h2}>{CLASSES[cls]?.[lang]}</Text>
        </View>
        <TextInput style={[ui.input, { textAlign: 'center' }]} value={name} onChangeText={setName} placeholder={c.displayName} />
        <View style={styles.segment}>
          {(['male', 'female'] as Gender[]).map((item) => (
            <Pressable key={item} style={[styles.segmentItem, gender === item && styles.segmentOn]} onPress={() => setGender(item)}>
              <Text style={styles.segmentText}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.classGrid}>
          {CLASS_ORDER.slice(0, 16).map((key) => {
            const item = CLASSES[key];
            return (
              <Pressable key={key} style={[styles.classTile, cls === key && styles.classOn]} onPress={() => setCls(key)}>
                <Text style={styles.className}>{item[lang]}</Text>
              </Pressable>
            );
          })}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[ui.primaryButton, busy && styles.disabled]} disabled={busy} onPress={() => onCreate({ name, cls, gender })}>
          <Text style={ui.primaryText}>{busy ? '...' : c.createCharacter}</Text>
        </Pressable>
        <Pressable style={ui.ghostButton} onPress={onSignOut}><Text>{c.signOut}</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginTop: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, padding: 18 },
  circle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line },
  circleText: { color: palette.ink, fontWeight: '900' },
  authCard: { margin: 22, marginTop: 58, padding: 18, borderRadius: 18, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, gap: 13 },
  logo: { fontSize: 23, color: palette.ink, fontWeight: '900' },
  segment: { flexDirection: 'row', backgroundColor: palette.card2, borderRadius: 13, padding: 4, gap: 4 },
  segmentItem: { flex: 1, minHeight: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: palette.card, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  segmentText: { color: palette.ink, fontWeight: '800' },
  error: { color: palette.danger, fontWeight: '800' },
  disabled: { opacity: 0.55 },
  previewAvatar: { width: 96, height: 96, borderRadius: 24, borderWidth: 3, borderColor: palette.gold },
  classGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  classTile: { width: '23%', minHeight: 58, borderRadius: 13, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center', padding: 6 },
  classOn: { borderColor: palette.gold, backgroundColor: palette.card2 },
  className: { color: palette.ink, fontWeight: '800', fontSize: 11, textAlign: 'center' },
});
