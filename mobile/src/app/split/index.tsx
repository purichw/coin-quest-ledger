import { useCallback, useState } from 'react';
import { router, Stack } from 'expo-router';
import { Text } from 'react-native';
import { Action, ErrorNote, Field, ui } from '../../auth/ui';
import { Card, confirm, Intro, LoadError, Loading, Page, PlayerGate, Row, useLoad, useWork, type Player } from '../../player/ui';
import { createBoard, listBoards, loadBoard } from '../../ledger/service';
import { parseBoardReference } from '../../ledger/contracts';

export default function SplitRoute() { return <PlayerGate>{player => <Split {...player} />}</PlayerGate>; }
function Split({ account, hero }: Player) {
  const loader = useCallback(() => listBoards(account), [account]);
  const load = useLoad(loader); const work = useWork();
  const [name, setName] = useState(''); const [code, setCode] = useState('');
  const [newCode, setNewCode] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  if (load.loading && !load.data) return <Loading />;
  if (load.error && !load.data) return <LoadError error={load.error} retry={load.reload} />;
  return <Page><Stack.Screen options={{ title: 'แบ่งเงิน · Party Ledger', headerBackButtonDisplayMode: 'minimal' }} />
    <Intro title="ออกเดินทางด้วยกัน" description="หารค่าใช้จ่ายและเคลียร์ยอดกับเพื่อนร่วมทาง" glyph="⚔" />
    <Card title="บอร์ดของคุณ">{load.data?.length ? load.data.map(row => <Row key={row.id} title={row.data.tripName} detail={`#${row.id} · ${row.data.participants.length} คน · ${row.data.expenses.length} รายการ`} onPress={() => router.push({ pathname: '/split/board', params: { id: row.id } })} />) : <Text style={ui.description}>ยังไม่มีบอร์ด เริ่มบอร์ดใหม่หรือเปิดรหัสจากเพื่อน</Text>}<Action title="รีเฟรชบอร์ด" secondary busy={load.loading} onPress={load.reload} /></Card>
    <Card title="สร้างบอร์ดใหม่"><Field label="ชื่อบอร์ด" value={name} onChangeText={setName} maxLength={80} placeholder="เช่น ทริปเชียงใหม่" /><Field label="รหัสบอร์ด 4 หลัก" value={newCode} onChangeText={setNewCode} keyboardType="number-pad" maxLength={4} /><Text style={ui.hint}>ตัวละคร {hero.name} จะเป็นสมาชิกและคุณเป็นเจ้าของบอร์ด</Text><Action title="สร้างบอร์ด" busy={work.busy} onPress={() => confirm('สร้างบอร์ดนี้?', name.trim() || 'กรุณาตั้งชื่อบอร์ด', () => void work.run(async () => {
      if (!/^\d{4}$/.test(newCode)) throw new Error('ใส่รหัสบอร์ด 4 หลัก');
      const id = await createBoard(account, hero, name, newCode); setName(''); setNewCode(String(Math.floor(1000 + Math.random() * 9000))); router.push({ pathname: '/split/board', params: { id } });
    }), 'สร้างบอร์ด')} /></Card>
    <Card title="เปิดบอร์ดจากรหัสหรือลิงก์เว็บ"><Field label="รหัสบอร์ดหรือลิงก์" value={code} onChangeText={setCode} placeholder="1234 หรือวางลิงก์จากเพื่อน" autoCapitalize="none" /><Action title="เปิดบอร์ด" secondary busy={work.busy} onPress={() => void work.run(async () => { const id = parseBoardReference(code); await loadBoard(id); router.push({ pathname: '/split/board', params: { id } }); })} /></Card>
    <ErrorNote message={work.error || load.error} />
  </Page>;
}
