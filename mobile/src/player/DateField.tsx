import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import { Action, colors, ui } from '../auth/ui';
import { today } from './ui';

export function DateField({ label = 'วันที่', value, onChange }: { label?: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false); const [draft, setDraft] = useState(new Date());
  const parse = (iso: string) => new Date(`${/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : today()}T12:00:00`);
  const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const picker = <DateTimePicker value={draft} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} locale="th-TH" themeVariant="light" onDismiss={() => setOpen(false)} onValueChange={(_event, date) => {
    if (Platform.OS !== 'ios') { setOpen(false); if (date) onChange(format(date)); }
    else if (date) setDraft(date);
  }} />;
  return <View style={ui.field}><Text style={ui.label}>{label}</Text><Pressable accessibilityRole="button" accessibilityLabel={`${label} ${value}`} onPress={() => { setDraft(parse(value)); setOpen(true); }} style={[ui.inputFrame, { minHeight: 52, justifyContent: 'center' }]}><Text style={ui.value}>{parse(value).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</Text></Pressable>
    {open && (Platform.OS === 'ios' ? <Modal transparent animationType="slide" onRequestClose={() => setOpen(false)}><View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0007' }}><View accessibilityViewIsModal style={{ padding: 24, paddingBottom: 36, gap: 16, backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}><Text style={ui.label}>{label}</Text>{picker}<Action title="ใช้วันที่นี้" onPress={() => { onChange(format(draft)); setOpen(false); }} /><Action title="ยกเลิก" secondary onPress={() => setOpen(false)} /></View></View></Modal> : picker)}
  </View>;
}
