import { useRef, useState } from 'react';
import { router, Stack } from 'expo-router';
import { Alert, Keyboard, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { resetWithRecovery } from '../auth/account-service';
import { useAuth } from '../auth/AuthProvider';
import { validateRecovery } from '../auth/contracts';
import { Action, AuthPage, AuthSheet, Brand, ErrorNote, Field, ui } from '../auth/ui';
import { Choice, useWork } from '../player/ui';
export default function RecoverRoute() {
  const { signIn, saveRecovery, busy } = useAuth();
  const work = useWork();
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmationRef = useRef<TextInput>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof resetWithRecovery>> | null>(null);
  const submitting = busy || work.busy;

  function submit() {
    if (submitting) return;
    Keyboard.dismiss();
    const invalid = validateRecovery(username, code, password, confirmation);
    if (invalid) { work.setError(invalid); return; }
    void work.run(async () => {
      setResult(await resetWithRecovery(username, code, password, confirmation));
      setCode('');
    });
  }

  return <AuthPage header>
    <Stack.Screen options={{ title: 'กู้บัญชี', headerBackButtonDisplayMode: 'minimal', gestureEnabled: !result && !submitting, headerBackVisible: !result && !submitting }} />
    <Brand />
    <View><Text style={ui.title}>{result ? 'เก็บกุญแจใหม่ของคุณ' : 'กลับสู่การผจญภัย'}</Text><Text style={ui.description}>{result ? 'เปลี่ยนรหัสผ่านแล้ว Recovery ID เดิมใช้ไม่ได้ เก็บรหัสใหม่นี้ไว้ก่อนเข้าสู่ระบบ' : 'ใช้ Recovery ID ที่เก็บไว้ เพื่อตั้งรหัสผ่านใหม่ บัญชีและตัวละครเดิมจะยังอยู่'}</Text></View>
    <AuthSheet>
      {result ? <>
        <Text style={ui.label}>RECOVERY ID ใหม่</Text>
        <Text selectable style={ui.recoveryCode}>{result.code}</Text>
        {!result.stored && <ErrorNote message="เครื่องนี้บันทึกรหัสชั่วคราวไม่ได้ กรุณาคัดลอกไว้ก่อนออกจากหน้านี้" />}
        <Action title={copied ? 'คัดลอกแล้ว' : 'คัดลอก Recovery ID ใหม่'} secondary disabled={submitting} onPress={() => void work.run(async () => { if (!(await Clipboard.setStringAsync(result.code))) throw new Error('คัดลอกไม่ได้ กดค้างที่รหัสเพื่อคัดลอกแล้วเก็บไว้ให้ปลอดภัย'); setCopied(true); })} />
        <Choice multiple label="ฉันเก็บ Recovery ID ใหม่แล้ว" selected={saved} disabled={submitting} onPress={() => setSaved(!saved)} />
        <ErrorNote message={work.error} />
        <Action title="เข้าสู่ระบบด้วยรหัสใหม่" disabled={!saved} busy={submitting} onPress={() => void work.run(async () => {
          const error = await signIn(username, password);
          if (error) throw new Error(error);
          const ack = await saveRecovery(result.code);
          if (ack.error) throw new Error(ack.error);
          setPassword('');
          setConfirmation('');
          if (!ack.stored) Alert.alert('ใช้สำเนา Recovery ID ที่เก็บไว้', 'คุณเข้าสู่บัญชีได้แล้ว แต่เครื่องนี้เก็บ Recovery ID สำหรับเปิดดูภายหลังไม่ได้ กรุณารักษาสำเนาที่คุณยืนยันว่าเก็บไว้ให้ปลอดภัย', [{ text: 'เข้าใจแล้ว', onPress: () => router.replace('/') }]);
          else router.replace('/');
        })} />
      </> : <>
        <Field label="ชื่อผู้ใช้" placeholder="ชื่อผู้ใช้ของบัญชีเดิม" value={username} onChangeText={setUsername} editable={!submitting} autoComplete="username" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => codeRef.current?.focus()} />
        <Field label="Recovery ID" placeholder="รหัสกู้บัญชี 12 ตัวอักษร" value={code} onChangeText={setCode} inputRef={codeRef} editable={!submitting} autoComplete="off" autoCapitalize="characters" maxLength={20} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => passwordRef.current?.focus()} />
        <Field label="รหัสผ่านใหม่" placeholder="อย่างน้อย 6 ตัวอักษร" value={password} onChangeText={setPassword} inputRef={passwordRef} editable={!submitting} password autoComplete="new-password" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => confirmationRef.current?.focus()} />
        <Field label="ยืนยันรหัสผ่านใหม่" placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" value={confirmation} onChangeText={setConfirmation} inputRef={confirmationRef} editable={!submitting} password autoComplete="new-password" returnKeyType="go" onSubmitEditing={submit} />
        <ErrorNote message={work.error} />
        <Action title="ตั้งรหัสผ่านใหม่" busy={submitting} onPress={submit} />
      </>}
    </AuthSheet>
  </AuthPage>;
}
