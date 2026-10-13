import { useModule } from '../../modules/useModule';
import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Action, ErrorNote, Field } from '../../auth/ui';
import { editDebtLog } from '../../modules/contracts';
import { changeModule } from '../../modules/service';
import type { DebtLog, ModuleSnapshot } from '../../modules/types';
import { DateField } from '../../player/DateField';
import { Body, Card, confirm, LoadError, Loading, number, Page, PlayerGate, today, useWork, type Player } from '../../player/ui';

export default function LogRoute() { const { id, logId } = useLocalSearchParams<{ id: string; logId: string }>(); return <PlayerGate>{player => <LoadLog {...player} id={id} logId={logId} />}</PlayerGate>; }
function LoadLog(player: Player & { id: string; logId: string }) {
  const load = useModule('debt', player.account);
  if (!load.data) return load.error ? <LoadError error={load.error} retry={load.reload} /> : <Loading />;
  const log = load.data.data.dragons.find(d => d.id === player.id)?.log.find(row => row.id === player.logId);
  if (!log) return <LoadError error="ไม่พบประวัติการจ่าย" retry={load.reload} />;
  return <EditLog {...player} log={log} initial={load.data} />;
}
function EditLog({ account, id, log, initial }: Player & { id: string; log: DebtLog; initial: ModuleSnapshot<'debt'> }) {
  const work = useWork(); const [snapshot] = useState(initial); const [amount, setAmount] = useState(String(log.amount));
  const [date, setDate] = useState(log.ts ? `${new Date(log.ts).getFullYear()}-${String(new Date(log.ts).getMonth() + 1).padStart(2, '0')}-${String(new Date(log.ts).getDate()).padStart(2, '0')}` : today());
  const save = async (remove = false) => { await changeModule('debt', account, snapshot, state => ({ ...state, dragons: state.dragons.map(d => d.id === id ? editDebtLog(d, log.id, number(amount), date, remove) : d) })); router.back(); };
  return <Page><Stack.Screen options={{ title: 'แก้ประวัติการจ่าย' }} /><Card><Field label="จำนวนที่จ่าย (บาท)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" /><DateField label="วันที่จ่าย" value={date} onChange={setDate} /><Body>เมื่อแก้ประวัติ ระบบจะคำนวณยอดหนี้และดอกเบี้ยใหม่ตามลำดับการจ่าย หากข้อมูลย้อนหลังไม่ครบ ระบบจะแจ้งให้ตรวจสอบก่อนบันทึก</Body><Action title="บันทึกประวัติ" busy={work.busy} onPress={() => void work.run(() => save())} /><Action title="นำประวัติการจ่ายออก" secondary busy={work.busy} onPress={() => confirm('นำประวัติออก?', 'ระบบจะคำนวณยอดหนี้และดอกเบี้ยใหม่โดยไม่รวมการจ่ายนี้ คุณกู้คืนประวัติได้จากถังรายการ', () => void work.run(() => save(true)), 'นำออก')} /></Card><ErrorNote message={work.error} /></Page>;
}
