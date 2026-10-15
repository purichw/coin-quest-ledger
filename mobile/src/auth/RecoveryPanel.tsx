import * as Clipboard from 'expo-clipboard';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import { readRecoveryForOwner } from './account-service';
import { authMessage, type Account } from './contracts';
import { Action, ErrorNote, ui } from './ui';

export function RecoveryPanel({ account, disabled }: { account: Account; disabled: boolean }) {
  const focused = useIsFocused();
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const revision = useRef(0);
  useEffect(() => {
    const hide = () => { revision.current += 1; setCode(null); setNotice(''); };
    hide();
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') hide(); });
    return () => { revision.current += 1; subscription.remove(); };
  }, [account.uid, account.recoveryHash, focused]);
  async function reveal(copy = false) {
    if (busy || disabled) return;
    const request = ++revision.current;
    setBusy(true); setError(''); setNotice('');
    try {
      const current = await readRecoveryForOwner(account);
      if (request !== revision.current) return;
      if (!current) {
        setCode(null); setNotice('รหัสเดิมไม่ได้เก็บไว้บนเครื่องนี้ คุณสร้าง Recovery ID ใหม่ด้านล่างได้ โดยรหัสเดิมจะใช้ไม่ได้');
      } else if (copy) {
        if (!(await Clipboard.setStringAsync(current))) throw new Error('Clipboard unavailable');
        if (request === revision.current) setNotice('คัดลอกแล้ว เก็บไว้ในที่ปลอดภัยและอย่าแชร์ให้ใคร');
      } else setCode(current);
    } catch (cause) {
      if (request === revision.current) setError(copy ? 'คัดลอกไม่ได้ ลองแสดงรหัสแล้วกดค้างเพื่อคัดลอก' : authMessage(cause));
    } finally { setBusy(false); }
  }
  return <View style={ui.panel}>
    <Text style={[ui.label, { textAlign: 'left' }]}>Recovery ID</Text>
    <Text selectable={!!code} accessibilityLabel={code || 'รหัสกู้บัญชีถูกซ่อนอยู่'} style={ui.recoveryCode}>{code || '••••-••••-••••'}</Text>
    <Text style={ui.hint}>ใช้กู้บัญชีเมื่อจำรหัสผ่านไม่ได้ รหัสที่แสดงจะถูกซ่อนเมื่อออกจากหน้านี้</Text>
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <View style={{ flex: 1 }}><Action title={code ? 'ซ่อนรหัส' : 'แสดงรหัส'} secondary busy={busy} disabled={disabled} onPress={() => code ? setCode(null) : void reveal()} /></View>
      <View style={{ flex: 1 }}><Action title="คัดลอก" secondary disabled={disabled || busy || !code} onPress={() => void reveal(true)} /></View>
    </View>
    {notice ? <Text accessibilityLiveRegion="polite" style={ui.hint}>{notice}</Text> : null}
    <ErrorNote message={error} />
  </View>;
}
