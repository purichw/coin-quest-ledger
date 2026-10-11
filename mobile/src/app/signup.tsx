import { Redirect, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, Text, TextInput, View } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { validateSignup } from '../auth/contracts';
import { Action, AuthPage, ErrorNote, Field, ui } from '../auth/ui';

export default function Signup() {
  const { session, busy, signUp, signupDraft, updateSignupDraft } = useAuth();
  const { name, username, password, confirmation } = signupDraft;
  const setName = (name: string) => updateSignupDraft({ name });
  const setUsername = (username: string) => updateSignupDraft({ username });
  const setPassword = (password: string) => updateSignupDraft({ password });
  const setConfirmation = (confirmation: string) => updateSignupDraft({ confirmation });
  const [error, setError] = useState('');
  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmationRef = useRef<TextInput>(null);
  if (session.status !== 'signed-out') return <Redirect href="/" />;

  async function submit() {
    Keyboard.dismiss();
    const fields = { name, username, password, confirmation };
    const invalid = validateSignup(fields);
    if (invalid) { setError(invalid); return; }
    setError('');
    setError(await signUp(fields));
  }
  return <AuthPage header><Stack.Screen options={{ gestureEnabled: !busy, headerBackVisible: !busy }} /><View><Text style={ui.title}>ร่วมกิลด์นักผจญภัย</Text><Text style={ui.description}>สร้างบัญชีและรับ User ID ของคุณ{ '\n' }ใช้ต่อได้ทั้งบนเว็บไซต์และแอป</Text></View><View style={ui.panel}>
    <Field label="ชื่อที่แสดง" placeholder="ชื่อที่เพื่อนจะเห็น" value={name} onChangeText={setName} editable={!busy} maxLength={60} autoCapitalize="words" autoComplete="nickname" textContentType="nickname" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => usernameRef.current?.focus()} />
    <Field label="ชื่อผู้ใช้" placeholder="เช่น adventurer" hint="a–z, 0–9, จุด, ขีดกลาง หรือขีดล่าง ไม่เกิน 32 ตัว" value={username} onChangeText={setUsername} inputRef={usernameRef} editable={!busy} autoComplete="username-new" textContentType="username" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => passwordRef.current?.focus()} />
    <Field label="รหัสผ่าน" placeholder="อย่างน้อย 6 ตัวอักษร" value={password} onChangeText={setPassword} inputRef={passwordRef} editable={!busy} password autoComplete="new-password" textContentType="newPassword" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => confirmationRef.current?.focus()} />
    <Field label="ยืนยันรหัสผ่าน" placeholder="กรอกรหัสผ่านอีกครั้ง" value={confirmation} onChangeText={setConfirmation} inputRef={confirmationRef} editable={!busy} password autoComplete="new-password" textContentType="newPassword" returnKeyType="go" onSubmitEditing={() => void submit()} />
    <ErrorNote message={error} /><Action title={busy ? 'กำลังสร้างบัญชี…' : 'สร้างบัญชี'} busy={busy} onPress={() => void submit()} />
  </View><Text style={ui.footer}>หลังสมัคร คุณจะได้รับ Recovery ID{ '\n' }สำหรับกู้บัญชีเมื่อจำรหัสผ่านไม่ได้</Text></AuthPage>;
}
