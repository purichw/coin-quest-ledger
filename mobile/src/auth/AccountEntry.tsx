import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from './AuthProvider';
import { validateLogin, type Account } from './contracts';
import { Action, AuthPage, Brand, colors, ErrorNote, Field, ui } from './ui';
import { fonts } from '../theme/typography';
import { CreateCharacter } from '../character/CreateCharacter';
import { Home } from '../character/Home';

export default function AccountEntry() {
  const { session, retry, busy, logOut } = useAuth();
  if (session.status === 'loading') return <AuthPage><Brand /><ActivityIndicator size="large" color={colors.green} /><Text accessibilityLiveRegion="polite" style={ui.footer}>กำลังเปิดบัญชีของคุณ…</Text></AuthPage>;
  if (session.status === 'signed-out') return <Login notice={session.notice} />;
  if (session.status === 'error') return <AuthPage><Brand /><Text style={ui.title}>ยังเปิดบัญชีไม่ได้</Text><ErrorNote message={session.message} /><Action title="ลองอีกครั้ง" onPress={retry} /><Action title="กลับไปเข้าสู่ระบบ" secondary busy={busy} onPress={() => void logOut()} /></AuthPage>;
  if (session.status === 'incomplete') return <CompleteProfile initialName={session.name} username={session.username} />;
  if (session.recoveryCode) return <Recovery code={session.recoveryCode} />;
  return session.character ? <Home account={session.account} character={session.character} /> : <CreateCharacter />;
}

function Login({ notice }: { notice?: string }) {
  const { busy, signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const passwordRef = useRef<TextInput>(null);
  async function submit() {
    Keyboard.dismiss();
    const invalid = validateLogin(username, password);
    if (invalid) { setError(invalid); return; }
    setError('');
    setError(await signIn(username, password));
  }
  return <AuthPage>
    <Brand />
    <View><Text style={ui.title}>กลับมารวมปาร์ตี้กัน</Text><Text style={ui.description}>เข้าสู่ระบบด้วยบัญชี Coin Quest เดิมของคุณ</Text></View>
    <View style={ui.panel}>
      <Field label="ชื่อผู้ใช้" placeholder="เช่น adventurer" value={username} onChangeText={setUsername} editable={!busy} autoComplete="username" textContentType="username" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => passwordRef.current?.focus()} />
      <Field label="รหัสผ่าน" placeholder="รหัสผ่านของคุณ" value={password} onChangeText={setPassword} editable={!busy} inputRef={passwordRef} password autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={() => void submit()} />
      <ErrorNote message={error || notice} />
      <Action title={busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'} busy={busy} onPress={() => void submit()} />
      <Text style={ui.footer}>แอปจะจำการเข้าสู่ระบบบนเครื่องนี้</Text>
    </View>
    <View style={{ gap: 10 }}><Text style={ui.footer}>เพิ่งเริ่มการผจญภัย?</Text><Action title="สร้างบัญชีใหม่" secondary disabled={busy} onPress={() => { Keyboard.dismiss(); setPassword(''); router.push('/signup'); }} /></View>
    <Action title="ลืมรหัสผ่าน · กู้ด้วย Recovery ID" secondary disabled={busy} onPress={() => { setPassword(''); router.push('/recover'); }} />
  </AuthPage>;
}

function CompleteProfile({ initialName, username }: { initialName: string; username: string }) {
  const { busy, finishSignup, logOut } = useAuth();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');
  return <AuthPage><Brand /><View><Text style={ui.title}>สร้างบัญชีต่อให้ครบ</Text><Text style={ui.description}>บัญชี @{username} ถูกสร้างแล้ว กรอกชื่อเพื่อเริ่มเล่นต่อได้เลย</Text></View><View style={ui.panel}>
    <Field label="ชื่อที่แสดง" value={name} onChangeText={setName} placeholder="ชื่อที่เพื่อนจะเห็น" editable={!busy} maxLength={60} autoCapitalize="words" />
    <ErrorNote message={error} /><Action title="บันทึกบัญชีให้เสร็จ" busy={busy} onPress={async () => { Keyboard.dismiss(); setError(name.trim() ? await finishSignup(name) : 'กรอกชื่อที่อยากให้เพื่อนเห็น'); }} />
  </View><Action title="ออกจากระบบ" secondary busy={busy} onPress={async () => setError(await logOut())} /></AuthPage>;
}

function Recovery({ code }: { code: string }) {
  const { busy, saveRecovery } = useAuth();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  return <AuthPage><Brand /><View><Text style={ui.title}>เก็บกุญแจของคุณไว้</Text><Text style={ui.description}>ใช้ Recovery ID นี้กู้บัญชีเมื่อจำรหัสผ่านไม่ได้ เก็บไว้ในที่ปลอดภัยและอย่าแชร์ให้ใคร</Text></View>
    <View style={ui.panel}><Text style={ui.label}>RECOVERY ID</Text><Text selectable style={{ fontSize: 23, fontFamily: fonts.code, letterSpacing: 1.5, color: colors.ink, textAlign: 'center', lineHeight: 36 }}>{code}</Text><Text style={ui.footer}>กดค้างที่รหัสเพื่อคัดลอก{ '\n' }หน้านี้จะปิดเมื่อคุณยืนยันว่าเก็บไว้แล้ว</Text></View>
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: saved }} onPress={() => setSaved(!saved)} style={[ui.row, { minHeight: 52, justifyContent: 'flex-start' }]}><View style={{ height: 26, width: 26, borderRadius: 7, borderWidth: 2, borderColor: colors.green, backgroundColor: saved ? colors.green : colors.surface, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.surface, fontFamily: fonts.emphasis }}>{saved ? '✓' : ''}</Text></View><Text style={[ui.value, { fontSize: 15, fontFamily: fonts.body }]}>ฉันบันทึก Recovery ID ไว้แล้ว</Text></Pressable>
    <ErrorNote message={error} /><Action title="เข้าสู่บัญชีของฉัน" disabled={!saved} busy={busy} onPress={async () => setError(await saveRecovery())} />
  </AuthPage>;
}

export function AccountSummary({ account, header = false }: { account: Account; header?: boolean }) {
  const { logOut, busy, regenerateRecovery } = useAuth();
  const [error, setError] = useState('');
  return <AuthPage header={header}><Brand /><View><Text style={ui.title}>{account.name}</Text><Text style={ui.description}>บัญชี Coin Quest ของคุณ</Text></View>
    <View style={ui.panel}><Text style={[ui.label, { textAlign: 'left', color: colors.green }]}>บัญชีของคุณ</Text><View style={ui.divider} /><View style={ui.row}><Text style={ui.description}>ชื่อผู้ใช้</Text><Text style={ui.value}>@{account.username}</Text></View><View style={ui.row}><Text style={ui.description}>User ID</Text><Text style={[ui.value, { fontFamily: fonts.stat, fontVariant: ['tabular-nums'], letterSpacing: 2 }]}>{account.userId}</Text></View></View>
    <Action title="สำรองและกู้คืนข้อมูล" secondary onPress={() => router.push('/backup')} />
    <Action title="สร้าง Recovery ID ใหม่" secondary busy={busy} onPress={() => Alert.alert('สร้าง Recovery ID ใหม่?', 'รหัสกู้บัญชีเดิมจะใช้ไม่ได้ คุณต้องเก็บรหัสใหม่ที่แสดงในขั้นตอนถัดไป', [{ text: 'ยกเลิก', style: 'cancel' }, { text: 'สร้างรหัสใหม่', onPress: async () => setError(await regenerateRecovery()) }])} />
    <ErrorNote message={error} /><Action title="ออกจากระบบ" secondary busy={busy} onPress={() => Alert.alert('ออกจากระบบ?', 'คุณสามารถกลับมาเข้าสู่ระบบด้วยบัญชีเดิมได้ทุกเมื่อ', [{ text: 'อยู่ต่อ', style: 'cancel' }, { text: 'ออกจากระบบ', onPress: async () => setError(await logOut()) }])} />
  </AuthPage>;
}
