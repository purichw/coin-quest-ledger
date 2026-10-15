import { useCallback, useRef, useState } from 'react';
import { router, Stack } from 'expo-router';
import { Text, View, type TextInput } from 'react-native';
import { Action, ErrorNote, Field, ui } from '../../auth/ui';
import { Card, Choice, confirm, Disclosure, LoadError, Loading, p, Page, PlayerGate, Row, SceneHeader, useLoad, useWork, type Player } from '../../player/ui';
import { createBoard, listBoards, loadBoard } from '../../ledger/service';
import { parseBoardReference } from '../../ledger/contracts';
import { scenicStackOptions } from '../../player/navigation';

export default function SplitRoute() { return <PlayerGate>{player => <Split {...player} />}</PlayerGate>; }
function Split({ account, hero }: Player) {
  const loader = useCallback(() => listBoards(account), [account]);
  const load = useLoad(loader); const work = useWork();
  const [name, setName] = useState(''); const [code, setCode] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const newCodeInput = useRef<TextInput>(null);
  const [newCode, setNewCode] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  const openBoard = () => void work.run(async () => { const id = parseBoardReference(code); await loadBoard(id); router.push({ pathname: '/split/board', params: { id } }); });
  if (load.loading && !load.data) return <Loading />;
  if (load.error && !load.data) return <LoadError error={load.error} retry={load.reload} />;
  return <Page scene="split"><Stack.Screen options={{ ...scenicStackOptions, title: 'แบ่งเงิน', headerBackButtonDisplayMode: 'minimal' }} />
    <SceneHeader kind="split" title="แบ่งค่าใช้จ่าย" subtitle="ออกเดินทางด้วยกัน แล้วจัดการเงินให้ชัดเจน" />
    {!!load.data?.length && <Card title="บอร์ดของคุณ">{load.data.map(row => <Row key={row.id} title={row.data.tripName} detail={`#${row.id} · ${row.data.participants.length} คน · ${row.data.expenses.length} รายการ`} onPress={() => router.push({ pathname: '/split/board', params: { id: row.id } })} />)}</Card>}
    <Disclosure title="สร้างหรือเข้าร่วมบอร์ด" initiallyOpen={!load.data?.length} art={require('../../../../assets/home-reference/chest.webp')}>
    <View style={[p.choices, { justifyContent: 'center' }]}><Choice label="สร้างบอร์ดใหม่" selected={mode === 'create'} onPress={() => setMode('create')} /><Choice label="เข้าร่วมบอร์ด" selected={mode === 'join'} onPress={() => setMode('join')} /></View>
    {mode === 'create' ? <View style={{ gap: 14 }}><Field label="ชื่อบอร์ด" value={name} onChangeText={setName} maxLength={80} placeholder="เช่น ทริปเชียงใหม่" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => newCodeInput.current?.focus()} /><Field inputRef={newCodeInput} label="รหัสบอร์ด 4 หลัก" value={newCode} onChangeText={setNewCode} keyboardType="number-pad" maxLength={4} /><Text style={ui.hint}>ตัวละคร {hero.name} จะเป็นสมาชิกและคุณเป็นเจ้าของบอร์ด</Text><Action title="สร้างบอร์ด" busy={work.busy} onPress={() => confirm('สร้างบอร์ดนี้?', name.trim() || 'กรุณาตั้งชื่อบอร์ด', () => void work.run(async () => {
      if (!/^\d{4}$/.test(newCode)) throw new Error('ใส่รหัสบอร์ด 4 หลัก');
      const id = await createBoard(account, hero, name, newCode); setName(''); setNewCode(String(Math.floor(1000 + Math.random() * 9000))); router.push({ pathname: '/split/board', params: { id } });
    }), 'สร้างบอร์ด')} /></View> : <View style={{ gap: 14 }}><Field label="รหัสบอร์ดหรือลิงก์" value={code} onChangeText={setCode} placeholder="1234 หรือวางลิงก์จากเพื่อน" autoCapitalize="none" returnKeyType="go" onSubmitEditing={openBoard} /><Action title="เปิดบอร์ด" busy={work.busy} onPress={openBoard} /></View>}
    </Disclosure><ErrorNote message={work.error || load.error} />
    <Action title="รีเฟรชบอร์ด" secondary busy={load.loading} onPress={load.reload} />
  </Page>;
}
