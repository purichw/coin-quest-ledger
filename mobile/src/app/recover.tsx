import { useState } from 'react';
import { router, Stack } from 'expo-router';
import { Keyboard, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { resetWithRecovery } from '../auth/account-service';
import { useAuth } from '../auth/AuthProvider';
import { validateRecovery } from '../auth/contracts';
import { Action, AuthPage, Brand, ErrorNote, Field, ui } from '../auth/ui';
import { Choice, useWork } from '../player/ui';
export default function RecoverRoute() {
  const { signIn, saveRecovery, busy } = useAuth(); const work = useWork();
  const [username, setUsername] = useState(''); const [code, setCode] = useState(''); const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState(''); const [saved, setSaved] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof resetWithRecovery>> | null>(null);
  return <AuthPage header><Stack.Screen options={{ title: 'กู้บัญชี', headerBackButtonDisplayMode: 'minimal', gestureEnabled: !result, headerBackVisible: !result }} /><Brand /><Text style={ui.title}>{result ? 'เก็บกุญแจใหม่ของคุณ' : 'กลับสู่การผจญภัย'}</Text><Text style={ui.description}>{result ? 'เปลี่ยนรหัสผ่านแล้ว Recovery ID เดิมใช้ไม่ได้ เก็บรหัสใหม่นี้ไว้ก่อนเข้าสู่ระบบ' : 'ใช้ชื่อผู้ใช้และ Recovery ID ที่เก็บไว้ บัญชีและตัวละครเดิมจะยังอยู่'}</Text><View style={ui.panel}>
    {result ? <><Text selectable style={ui.value}>{result.code}</Text>{!result.stored && <ErrorNote message="เครื่องนี้บันทึกรหัสชั่วคราวไม่ได้ กรุณาคัดลอกไว้ก่อนออกจากหน้านี้" />}<Action title="คัดลอก Recovery ID ใหม่" secondary onPress={() => void work.run(() => Clipboard.setStringAsync(result.code))} /><Choice multiple label="ฉันเก็บ Recovery ID ใหม่แล้ว" selected={saved} onPress={() => setSaved(!saved)} /><Action title="เข้าสู่ระบบด้วยรหัสใหม่" disabled={!saved} busy={busy || work.busy} onPress={() => void work.run(async () => { const error = await signIn(username, password); if (error) throw new Error(error); const ack = await saveRecovery(); if (ack) throw new Error(ack); setPassword(''); setConfirmation(''); router.replace('/'); })} /></> : <><Field label="ชื่อผู้ใช้ที่ต้องการกู้" value={username} onChangeText={setUsername} autoCapitalize="none" /><Field label="Recovery ID" value={code} onChangeText={setCode} autoCapitalize="characters" maxLength={20} /><Field label="รหัสผ่านใหม่" value={password} onChangeText={setPassword} password autoComplete="new-password" /><Field label="ยืนยันรหัสผ่านใหม่" value={confirmation} onChangeText={setConfirmation} password autoComplete="new-password" /><Action title="เปลี่ยนรหัสผ่านและกู้บัญชี" busy={work.busy} onPress={() => { Keyboard.dismiss(); const invalid = validateRecovery(username, code, password, confirmation); if (invalid) { work.setError(invalid); return; } void work.run(async () => { setResult(await resetWithRecovery(username, code, password, confirmation)); setCode(''); }); }} /></>}
    <ErrorNote message={work.error} />
  </View></AuthPage>;
}
