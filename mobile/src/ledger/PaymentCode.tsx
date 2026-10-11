import { useMemo } from 'react';
import { Image, View } from 'react-native';
import qrcode from 'qrcode-generator';
import * as Clipboard from 'expo-clipboard';
import { Action } from '../auth/ui';
import { Body, money } from '../player/ui';
import { canon } from '../domain/canon';

export function PaymentCode({ target, amount }: { target: string; amount: number }) {
  const source = useMemo(() => { const qr = qrcode(0, 'M'); qr.addData(canon.promptPayPayload(target, amount)); qr.make(); return qr.createDataURL(5, 16); }, [target, amount]);
  return <View style={{ alignItems: 'center', gap: 12 }}><Image source={{ uri: source }} accessibilityLabel={`QR พร้อมเพย์ ${target} จำนวน ${money(amount)}`} style={{ width: 240, height: 240 }} /><Body>ตรวจชื่อผู้รับและยอดในแอปธนาคารก่อนชำระ</Body><Action title="คัดลอกเลขพร้อมเพย์" secondary onPress={() => void Clipboard.setStringAsync(target)} /></View>;
}
