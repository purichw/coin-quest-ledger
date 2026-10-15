import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Linking, Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from './AuthProvider';
import { validateLogin, type Account } from './contracts';
import { Action, AuthHero, AuthPage, AuthSheet, Brand, colors, ErrorNote, Field, ui } from './ui';
import { fonts } from '../theme/typography';
import { CreateCharacter } from '../character/CreateCharacter';
import { RecoveryPanel } from './RecoveryPanel';

export default function AccountEntry() {
  const { session, retry, busy, logOut } = useAuth();
  if (session.status === 'loading') return <AuthPage><Brand /><ActivityIndicator size="large" color={colors.green} /><Text accessibilityLiveRegion="polite" style={ui.footer}>กำลังเปิดบัญชีของคุณ…</Text></AuthPage>;
  if (session.status === 'signed-out') return <Login notice={session.notice} />;
  if (session.status === 'error') return <AuthPage><Brand /><Text style={ui.title}>ยังเปิดบัญชีไม่ได้</Text><ErrorNote message={session.message} /><Action title="ลองอีกครั้ง" onPress={retry} /><Action title="กลับไปเข้าสู่ระบบ" secondary busy={busy} onPress={() => void logOut()} /></AuthPage>;
  if (session.status === 'incomplete') return <CompleteProfile initialName={session.name} username={session.username} />;
  if (session.recoveryCode) return <Recovery code={session.recoveryCode} />;
  return session.character ? <Redirect href="/play" /> : <CreateCharacter />;
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
  return <AuthPage compact>
    <AuthHero />
    <AuthSheet compact>
    <View><Text style={ui.loginTitle}>ยินดีต้อนรับกลับ</Text><Text style={ui.loginDescription}>บัญชีเดียว ครบทุกการผจญภัย</Text></View>
    <View style={ui.loginForm}>
      <Field label="ชื่อผู้ใช้" placeholder="เช่น adventurer" value={username} onChangeText={setUsername} editable={!busy} autoComplete="username" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => passwordRef.current?.focus()} />
      <Field label="รหัสผ่าน" placeholder="รหัสผ่านของคุณ" value={password} onChangeText={setPassword} editable={!busy} inputRef={passwordRef} password autoComplete="current-password" returnKeyType="go" onSubmitEditing={() => void submit()} />
      <ErrorNote message={error || notice} />
      <Action title={busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'} busy={busy} onPress={() => void submit()} />
    </View>
    <View>
      <View style={ui.loginMeta}>
        <Text style={ui.loginRemember}>จำการเข้าสู่ระบบบนเครื่องนี้</Text>
        <Pressable accessibilityRole="link" accessibilityState={{ disabled: busy }} disabled={busy} style={({ pressed }) => [ui.link, { opacity: pressed || busy ? 0.6 : 1 }]} onPress={() => { Keyboard.dismiss(); setPassword(''); router.push('/recover'); }}><Text style={ui.linkText}>ลืมรหัสผ่าน?</Text></Pressable>
      </View>
      <Pressable accessibilityRole="link" accessibilityLabel="สร้างบัญชีใหม่" accessibilityState={{ disabled: busy }} disabled={busy} style={({ pressed }) => [ui.signupLink, { opacity: pressed || busy ? 0.6 : 1 }]} onPress={() => { Keyboard.dismiss(); setPassword(''); router.push('/signup'); }}><Text style={ui.footer}>ยังไม่มีบัญชี?</Text><Text style={ui.linkText}>สร้างบัญชีใหม่</Text></Pressable>
    </View>
    </AuthSheet>
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
    <ErrorNote message={error} /><Action title="เข้าสู่บัญชีของฉัน" disabled={!saved} busy={busy} onPress={async () => {
      const result = await saveRecovery(code); setError(result.error);
      if (!result.error && !result.stored) Alert.alert('ใช้สำเนา Recovery ID ที่เก็บไว้', 'คุณเข้าสู่บัญชีได้แล้ว แต่เครื่องนี้เก็บ Recovery ID สำหรับเปิดดูภายหลังไม่ได้ กรุณารักษาสำเนาที่คุณยืนยันว่าเก็บไว้ให้ปลอดภัย');
    }} />
  </AuthPage>;
}

export function AccountSummary({ account, header = false }: { account: Account; header?: boolean }) {
  const { logOut, busy, regenerateRecovery } = useAuth();
  const [error, setError] = useState('');
  async function openInfo(page: 'about' | 'privacy' | 'terms') {
    setError('');
    try { await Linking.openURL(`https://coinquestledger.vercel.app/${page}/`); }
    catch { setError('ยังเปิดหน้านี้ไม่ได้ ลองอีกครั้งเมื่อเชื่อมต่ออินเทอร์เน็ต'); }
  }
  return <AuthPage header={header}><Brand /><View><Text style={ui.title}>{account.name}</Text><Text style={ui.description}>บัญชี Coin Quest ของคุณ</Text></View>
    <View style={ui.panel}><Text style={[ui.label, { textAlign: 'left', color: colors.green }]}>บัญชีของคุณ</Text><View style={ui.divider} /><View style={ui.row}><Text style={ui.description}>ชื่อผู้ใช้</Text><Text style={ui.value}>@{account.username}</Text></View><View style={ui.row}><Text style={ui.description}>User ID</Text><Text style={[ui.value, { fontFamily: fonts.stat, fontVariant: ['tabular-nums'], letterSpacing: 2 }]}>{account.userId}</Text></View></View>
    <Action title="สำรองและกู้คืนข้อมูล" secondary onPress={() => router.push('/backup')} />
    <RecoveryPanel account={account} disabled={busy} />
    <Action title="สร้าง Recovery ID ใหม่" secondary busy={busy} onPress={() => Alert.alert('สร้าง Recovery ID ใหม่?', 'รหัสกู้บัญชีเดิมจะใช้ไม่ได้ คุณต้องเก็บรหัสใหม่ที่แสดงในขั้นตอนถัดไป', [{ text: 'ยกเลิก', style: 'cancel' }, { text: 'สร้างรหัสใหม่', onPress: async () => setError(await regenerateRecovery()) }])} />
    <Action title="ดูคำแนะนำการใช้งาน" secondary onPress={() => router.push('/welcome')} />
    <View style={ui.panel}><Text style={[ui.label, { textAlign: 'left' }]}>เกี่ยวกับ Coin Quest</Text><Text style={ui.hint}>เปิดข้อมูลฉบับล่าสุดในเบราว์เซอร์</Text>
      {([['about', 'เกี่ยวกับแอป'], ['privacy', 'นโยบายความเป็นส่วนตัว'], ['terms', 'ข้อกำหนดการใช้งาน']] as const).map(([page, title]) => <Pressable key={page} accessibilityRole="link" accessibilityLabel={`${title} เปิดในเบราว์เซอร์`} onPress={() => void openInfo(page)} style={[ui.row, { minHeight: 48 }]}><Text style={ui.value}>{title}</Text><Text accessible={false} style={ui.linkText}>↗</Text></Pressable>)}
    </View>
    <ErrorNote message={error} /><Action title="ออกจากระบบ" secondary busy={busy} onPress={() => Alert.alert('ออกจากระบบ?', 'คุณสามารถกลับมาเข้าสู่ระบบด้วยบัญชีเดิมได้ทุกเมื่อ', [{ text: 'อยู่ต่อ', style: 'cancel' }, { text: 'ออกจากระบบ', onPress: async () => setError(await logOut()) }])} />
  </AuthPage>;
}
