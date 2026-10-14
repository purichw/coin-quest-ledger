import { useCallback } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Share, Text, View } from 'react-native';
import { Action, ErrorNote, ui } from '../../auth/ui';
import { canon } from '../../domain/canon';
import { PaymentCode } from '../../ledger/PaymentCode';
import { memberName, ownsBoard } from '../../ledger/contracts';
import { changeBoard, joinBoard, loadBoard } from '../../ledger/service';
import { Body, Card, confirm, LoadError, Loading, money, Page, PlayerGate, Row, Stats, useLoad, useWork, type Player } from '../../player/ui';

export default function BoardRoute() { const { id } = useLocalSearchParams<{ id: string }>(); return <PlayerGate>{player => <BoardScreen {...player} id={id} />}</PlayerGate>; }
function BoardScreen({ account, hero, id }: Player & { id: string }) {
  const loader = useCallback(() => loadBoard(id), [id]); const load = useLoad(loader); const work = useWork();
  if (!load.data) return load.error ? <LoadError error={load.error} retry={load.reload} /> : <Loading />;
  const board = load.data; const party = canon.computeParty(board); const transfers = canon.pendingSettlements(board);
  const own = memberName(board, hero.id); const admin = ownsBoard(board, account);
  return <Page><Stack.Screen options={{ title: board.tripName, headerBackButtonDisplayMode: 'minimal' }} />
    <View><Text style={ui.title}>{board.tripName}</Text><Body>บอร์ด #{id} · {admin ? 'คุณเป็นเจ้าของ' : own ? 'คุณเป็นสมาชิก' : 'กำลังดูบอร์ด'}</Body></View>
    <Card><Stats items={[["ยอดรายการ", money(board.expenses.reduce((s, e) => s + e.amount, 0))], ["ผู้ร่วมทาง", String(board.participants.length)]]} /><Action title="แชร์ลิงก์บอร์ด" secondary onPress={() => void work.run(() => Share.share({ url: `https://coinquestledger.vercel.app/trip/?id=${encodeURIComponent(id)}`, message: board.tripName }))} /></Card>
    {!own && <Action title={`เข้าร่วมด้วย ${hero.name}`} busy={work.busy} onPress={() => confirm('เข้าร่วมบอร์ด?', `เพิ่มตัวละครของคุณใน ${board.tripName}`, () => void work.run(async () => { load.setData(await joinBoard(id, account, hero)); }), 'เข้าร่วม')} />}
    {(own || admin) && <Action title="เพิ่มรายการจ่าย" onPress={() => router.push({ pathname: '/split/expense', params: { id } })} />}
    <Card title="ปาร์ตี้">{party.map(person => <View key={person.name} style={{ gap: 4, paddingVertical: 8 }}><Text style={ui.value}>{person.name}{board.guestHeroes[person.name] ? ' · Guest' : ` · #${board.characterIds[person.name] || '—'}`}</Text><Body>จ่ายแล้ว {money(person.paid)} · ส่วนแบ่ง {money(person.share)}</Body><Body>งบเหลือ {money(person.remaining)}</Body></View>)}<Action title="จัดการผู้ร่วมทาง" secondary onPress={() => router.push({ pathname: '/split/people', params: { id } })} /></Card>
    <Card title="ใครต้องคืนให้ใคร">{transfers.length ? transfers.map(t => <View key={`${t.from}>${t.to}`} style={{ gap: 8 }}><Text style={ui.value}>{t.from} → {t.to}</Text><Text style={ui.value}>{money(t.amount)}</Text>{!!board.promptpay[t.to] && <><Body>พร้อมเพย์ผู้รับ: {board.promptpay[t.to]}</Body><PaymentCode target={board.promptpay[t.to]} amount={t.amount} /></>}{(own || admin) && <Action title={`บันทึกว่า ${t.from} คืนแล้ว`} secondary busy={work.busy} onPress={() => confirm('บันทึกการคืนเงิน?', `${t.from} คืนให้ ${t.to} ${money(t.amount)} แล้ว\nใช้บันทึกสถานะเท่านั้น แอปไม่ได้โอนเงินจริง`, () => void work.run(async () => { load.setData(await changeBoard(id, account, current => { if (canon.settlementRevision(current) !== canon.settlementRevision(board)) throw new Error('ยอดเปลี่ยนจากอีกเครื่อง กรุณารีเฟรชก่อนยืนยัน'); return canon.confirmSettlement(current, t.from, t.to); })); }), 'คืนแล้ว')} />}</View>) : <Body>{board.expenses.length ? 'ไม่มีรายการค้างยืนยันการคืนเงิน' : 'เพิ่มรายการเพื่อดูยอดหารเงิน'}</Body>}<Body>ยอดคำนวณจากผู้จ่ายและผู้หารในแต่ละรายการ เมื่อแก้รายการจ่ายต้องยืนยันยอดใหม่</Body></Card>
    <Card title="Quest Log">{board.expenses.length ? [...board.expenses].reverse().map(e => <Row key={e.id} title={`${e.desc} · ${money(e.amount)}`} detail={`${Object.keys(canon.payerMap(e)).join(', ')} จ่าย · ${e.date || 'ไม่ได้ระบุวันที่'}`} onPress={() => router.push({ pathname: '/split/expense', params: { id, expenseId: String(e.id) } })} />) : <Body>ยังไม่มีรายการจ่าย</Body>}</Card>
    <Card><Row title="แคมเปญและประวัติ" detail={`${board.campaigns.length} แคมเปญ`} onPress={() => router.push({ pathname: '/split/campaigns', params: { id } })} /><Row title="ตั้งค่าบอร์ดและส่งออก" onPress={() => router.push({ pathname: '/split/settings', params: { id } })} /></Card>
    <ErrorNote message={work.error || load.error} /><Action title="รีเฟรชข้อมูลบอร์ด" secondary busy={load.loading} onPress={load.reload} />
  </Page>;
}
