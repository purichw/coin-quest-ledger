import { useCallback, useState } from 'react';
import { Stack } from 'expo-router';
import { Action, ErrorNote } from '../auth/ui';
import { pickImportFile, shareFile } from '../ledger/files';
import { parseBackup, type ModuleBackup } from '../modules/backup-contracts';
import { beforeRestoreFile, loadBackup, restoreBackup } from '../modules/backup-service';
import { Body, Card, confirm, LoadError, Loading, Page, PlayerGate, useLoad, useWork, type Player } from '../player/ui';
export default function BackupRoute() { return <PlayerGate>{p => <Backup {...p} />}</PlayerGate>; }
function Backup({ account }: Player) {
  const load = useLoad(useCallback(() => loadBackup(account), [account])); const work = useWork(); const [preview, setPreview] = useState<ModuleBackup | null>(null); const [notice, setNotice] = useState('');
  if (!load.data) return load.error ? <LoadError error={load.error} retry={load.reload} /> : <Loading />;
  const current = load.data;
  return <Page><Stack.Screen options={{ title: 'สำรองและกู้คืน', headerBackButtonDisplayMode: 'minimal' }} /><Card title="ข้อมูลส่วนตัวของคุณ"><Body>สำรอง Debt Dragon, Treasury และ Price Arena เป็นไฟล์ JSON บอร์ดปาร์ตี้ส่งออกแยกจากหน้าตั้งค่าบอร์ด</Body><Body>ไฟล์มียอดเงินและประวัติของคุณ เลือกที่เก็บที่ปลอดภัย</Body><Action title="ส่งออกไฟล์สำรอง" busy={work.busy} onPress={() => void work.run(() => shareFile('player-backup.json', JSON.stringify(current.backup, null, 2), 'application/json'))} /><Action title="เลือกไฟล์ JSON เพื่อดูก่อนกู้คืน" secondary busy={work.busy} onPress={() => void work.run(async () => { const file = await pickImportFile(); if (file) setPreview(parseBackup(await file.text(), account.uid)); })} /><Action title="ดูสำเนาก่อนกู้คืนครั้งล่าสุด" secondary busy={work.busy} onPress={() => void work.run(async () => { const file = await beforeRestoreFile(account); if (!file) throw new Error('ยังไม่เคยกู้คืนข้อมูลบนเครื่องนี้'); setPreview(parseBackup(await file.text(), account.uid)); })} /></Card>
    {preview && <Card title="ตรวจข้อมูลก่อนกู้คืน"><Body>สำรองเมื่อ {new Date(preview.savedAt).toLocaleString('th-TH')}</Body><Body>หนี้ {preview.modules.debt.dragons.length} รายการ · คลังหลวง {preview.modules.treasury.expenses.length} รายจ่าย · เทียบราคา {preview.modules.comparisons.length} สินค้า</Body><Body>แทนที่ข้อมูลมังกรหนี้ คลังหลวง และเทียบราคาของบัญชีนี้บนทุกอุปกรณ์ โดยเก็บสำเนาปัจจุบันไว้ก่อน</Body><Action title="กู้คืนจากไฟล์นี้" busy={work.busy} onPress={() => confirm('กู้คืนข้อมูลบัญชี?', 'ข้อมูลปัจจุบันจะถูกแทนที่ด้วยข้อมูลในไฟล์ และย้อนกลับได้จากสำเนาที่เก็บก่อนกู้คืน', () => void work.run(async () => { await restoreBackup(account, preview, current); setPreview(null); setNotice('กู้คืนข้อมูลแล้ว เปิดแต่ละเกมเพื่อดูข้อมูลล่าสุด'); await load.reload(); }), 'กู้คืน')} /><Action title="ยกเลิก" secondary onPress={() => setPreview(null)} /></Card>}
    {!!notice && <Body>{notice}</Body>}<ErrorNote message={work.error || load.error} /><Action title="โหลดข้อมูลบัญชีล่าสุด" secondary busy={load.loading} onPress={load.reload} />
  </Page>;
}
