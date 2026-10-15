import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { randomUUID } from 'expo-crypto';
import type { Board } from './types';
import { withoutUndefined } from './contracts';
// The standard browser bundle patches Promise and recurses on Hermes. Use its
// documented bare bundle so React Native keeps its own Promise implementation.
import ExcelJS from 'exceljs/dist/exceljs.bare';
import { canon } from '../domain/canon';
import { previewImport, type ImportPreview } from './imports';

export async function pickReceipt(camera = false) {
  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('ยังไม่ได้อนุญาตกล้อง เลือกภาพใบเสร็จจากคลังภาพได้');
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 0.2, allowsEditing: true };
  const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;
  const data = result.assets[0]?.base64;
  if (!data) throw new Error('อ่านภาพไม่ได้ กรุณาเลือกใหม่');
  if (data.length > 350000) throw new Error('ภาพใหญ่เกินไป กรุณาครอปเฉพาะใบเสร็จหรือเลือกภาพขนาดเล็กกว่า 250 KB');
  return `data:image/jpeg;base64,${data}`;
}
export async function shareFile(name: string, contents: string | Uint8Array, mimeType: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('อุปกรณ์นี้ยังแชร์ไฟล์ไม่ได้');
  const file = new File(Paths.cache, `coinquest-${randomUUID()}-${name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`);
  file.create(); file.write(contents);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: 'ส่งออก Coin Quest' });
}
export async function exportBoard(board: Board, id: string) {
  const { admin, access, ...data } = board; void admin; void access;
  await shareFile(`board-${id}.json`, JSON.stringify(withoutUndefined({ format: 'coin-quest-board-v1', boardId: id, data }), null, 2), 'application/json');
}
export async function pickImportFile() {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0]; const file = new File(asset.uri);
  if (file.size > 2000000) throw new Error('ไฟล์ต้องไม่เกิน 2 MB');
  return file;
}
export async function exportExcel(board: Board) {
  const workbook = new ExcelJS.Workbook(); workbook.creator = 'Coin Quest Ledger';
  const sheet = workbook.addWorksheet('Quest Log');
  sheet.addRow(['Description', 'Amount (฿)', 'Paid By', 'Split With']);
  sheet.columns.forEach((column, i) => { column.width = [34, 18, 26, 42][i]; });
  sheet.getRow(1).font = { bold: true }; sheet.views = [{ state: 'frozen', ySplit: 1 }];
  board.expenses.forEach(e => sheet.addRow([e.desc, e.amount, Object.entries(canon.payerMap(e)).map(([n, v]) => `${n}: ${v.toFixed(2)}`).join('; '), Object.entries(canon.splitShares(e, board.participants)).map(([n, v]) => `${n}: ${v.toFixed(2)}`).join('; ')]));
  const balance = workbook.addWorksheet('Balance the Party'); balance.addRow(['From', 'To', 'Amount (฿)']);
  canon.pendingSettlements(board).forEach(t => balance.addRow([t.from, t.to, t.amount]));
  const data = workbook.addWorksheet('Coin Quest Data'); data.addRow(['Expense JSON']);
  board.expenses.forEach(e => { const { receipt, ...value } = e; void receipt; data.addRow([JSON.stringify(withoutUndefined(value))]); });
  await shareFile('party-ledger.xlsx', new Uint8Array(await workbook.xlsx.writeBuffer()), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}
export async function importBoardFile(file: File, board: Board): Promise<ImportPreview> {
  if (/\.xlsx?$/i.test(file.name)) throw new Error('เลือกไฟล์สำรอง JSON สำหรับนำเข้าบอร์ด');
  const raw = JSON.parse(await file.text()); const rows = raw?.data?.expenses || raw?.expenses;
  if (!Array.isArray(rows)) throw new Error('ไฟล์ไม่มีรายการ expenses ที่อ่านได้');
  return previewImport(rows, board, randomUUID);
}
