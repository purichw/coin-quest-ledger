import { useCallback, useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { Action, ErrorNote, Field, ui } from '../../auth/ui';
import { switchCampaign, syncCampaign } from '../../ledger/contracts';
import { canManageBoard, changeBoard, loadBoard, makeId } from '../../ledger/service';
import { Body, Card, confirm, LoadError, Loading, Page, PlayerGate, useLoad, useWork, type Player } from '../../player/ui';

export default function CampaignsRoute() { const { id } = useLocalSearchParams<{ id: string }>(); return <PlayerGate>{player => <Campaigns {...player} id={id} />}</PlayerGate>; }
function Campaigns({ account, id }: Player & { id: string }) {
  const loader = useCallback(() => loadBoard(id), [id]); const load = useLoad(loader); const work = useWork(); const [name, setName] = useState('');
  if (!load.data) return load.error ? <LoadError error={load.error} retry={load.reload} /> : <Loading />;
  const board = load.data; const admin = canManageBoard(board, account, id);
  return <Page><Stack.Screen options={{ title: 'แคมเปญและประวัติ', headerBackButtonDisplayMode: 'minimal' }} /><Body>แต่ละแคมเปญเก็บรายการและสมาชิกของตัวเอง การสลับจะเก็บงานปัจจุบันก่อน</Body>
    {board.campaigns.map(c => <Card key={c.id} title={c.tripName}><Body>{c.expenses.length} รายการ · {c.participants.length} คน · {c.completedAt ? 'จบแล้ว' : 'กำลังเดินทาง'}</Body>{c.id === board.activeCampaignId ? <><Text style={ui.value}>แคมเปญปัจจุบัน</Text>{admin && !c.completedAt && <Action title="จบแคมเปญนี้" secondary busy={work.busy} onPress={() => confirm('จบแคมเปญ?', 'ประวัติและรายการยังเปิดดูได้', () => void work.run(async () => { load.setData(await changeBoard(id, account, current => { const synced = syncCampaign(current, Date.now()); return { ...synced, campaigns: synced.campaigns.map(x => x.id === c.id ? { ...x, completedAt: Date.now() } : x) }; }, true)); }))} />}</> : <Action title="เปิดแคมเปญนี้" secondary busy={work.busy} disabled={!admin} onPress={() => void work.run(async () => { load.setData(await changeBoard(id, account, current => switchCampaign(current, c.id, Date.now()), true)); })} />}</Card>)}
    {admin && <Card title="เริ่มแคมเปญใหม่"><Field label="ชื่อแคมเปญ" value={name} onChangeText={setName} maxLength={80} /><Action title="เริ่มแคมเปญใหม่" busy={work.busy} onPress={() => confirm('เริ่มแคมเปญใหม่?', 'สมาชิกเดิมจะเดินทางต่อ รายการเดิมอยู่ในประวัติ', () => void work.run(async () => { if (!name.trim()) throw new Error('ใส่ชื่อแคมเปญ'); const nextId = makeId(); load.setData(await changeBoard(id, account, current => { const synced = syncCampaign(current, Date.now()); return { ...synced, tripName: name.trim(), activeCampaignId: nextId, expenses: [], expenseTrash: [], removedMembers: [], settleXp: {}, settlementRecords: [] }; }, true)); setName(''); }), 'เริ่มแคมเปญ')} /></Card>}
    <ErrorNote message={work.error || load.error} />
  </Page>;
}
