import { useCallback } from 'react';
import { router, Stack } from 'expo-router';
import { Action, ErrorNote } from '../auth/ui';
import { loadInvites, respondInvite } from '../ledger/service';
import { loadPlayerProfile } from '../character/profile-service';
import { financialReminders } from '../player/reminder-contracts';
import { Body, Card, confirm, LoadError, Loading, Page, PlayerGate, Row, useLoad, useWork, type Player } from '../player/ui';

export default function RemindersRoute() { return <PlayerGate>{player => <Reminders {...player} />}</PlayerGate>; }
function Reminders({ account, hero }: Player) {
  const loader = useCallback(async () => { const [invites, profile] = await Promise.all([loadInvites(account), loadPlayerProfile(account)]); return { invites, reminders: financialReminders(profile.modules, profile.boards, account.characterId) }; }, [account]); const load = useLoad(loader); const work = useWork();
  if (!load.data) return load.error ? <LoadError error={load.error} retry={load.reload} /> : <Loading />;
  return <Page><Stack.Screen options={{ title: 'การแจ้งเตือน', headerBackButtonDisplayMode: 'minimal' }} />{load.data.invites.length ? load.data.invites.map(i => <Card key={i.id} title={i.tripName}><Body>{i.inviterName} เชิญคุณเข้าปาร์ตี้ #{i.tripId}</Body><Body>หมดอายุ {new Date(i.expiresAt).toLocaleString('th-TH')}</Body><Action title="ตอบรับคำเชิญ" busy={work.busy} onPress={() => void work.run(async () => { const id = await respondInvite(i.id, account, hero, true); router.push({ pathname: '/split/board', params: { id } }); })} /><Action title="ปฏิเสธคำเชิญ" secondary busy={work.busy} onPress={() => confirm('ปฏิเสธคำเชิญ?', `ไม่เข้าร่วม ${i.tripName}`, () => void work.run(async () => { await respondInvite(i.id, account, hero, false); await load.reload(); }), 'ปฏิเสธ')} /></Card>) : <Card title="ไม่มีคำเชิญค้างอยู่"><Body>คำเชิญใหม่จะแสดงที่นี่จนกว่าจะตอบรับ ปฏิเสธ หรือครบ 24 ชั่วโมง</Body></Card>}
    <Card title="รายการที่ต้องดูแล">{load.data.reminders.length ? load.data.reminders.map(r => <Row key={r.id} title={r.title} detail={r.detail} onPress={() => router.push({ pathname: r.route, params: r.params })} />) : <Body>ไม่มีบิลหรือหนี้ใกล้ครบกำหนด และไม่มีรายการปาร์ตี้ค้างยืนยัน</Body>}</Card><ErrorNote message={work.error || load.error} /><Action title="รีเฟรชการแจ้งเตือน" secondary busy={load.loading} onPress={load.reload} /></Page>;
}
