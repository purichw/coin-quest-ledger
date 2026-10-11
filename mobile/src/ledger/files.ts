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
import type { CellValue } from 'exceljs';
import { canon } from '../domain/canon';
import { previewImport, spreadsheetExpense, type ImportPreview } from './imports';

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
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0]; const file = new File(asset.uri);
  if (file.size > 2000000) throw new Error('ไฟล์ต้องไม่เกิน 2 MB');
  return file;
}
export async function exportExcel(board: Board, template = false) {
  const workbook = new ExcelJS.Workbook(); workbook.creator = 'Coin Quest Ledger';
  const sheet = workbook.addWorksheet(template ? 'Expenses' : 'Quest Log');
  sheet.addRow(['Description', 'Amount (฿)', 'Paid By', 'Split With']);
  sheet.columns.forEach((column, i) => { column.width = [34, 18, 26, 42][i]; });
  sheet.getRow(1).font = { bold: true }; sheet.views = [{ state: 'frozen', ySplit: 1 }];
  if (!template) {
    board.expenses.forEach(e => sheet.addRow([e.desc, e.amount, Object.entries(canon.payerMap(e)).map(([n, v]) => `${n}: ${v.toFixed(2)}`).join('; '), Object.entries(canon.splitShares(e, board.participants)).map(([n, v]) => `${n}: ${v.toFixed(2)}`).join('; ')]));
    const balance = workbook.addWorksheet('Balance the Party'); balance.addRow(['From', 'To', 'Amount (฿)']);
    canon.pendingSettlements(board).forEach(t => balance.addRow([t.from, t.to, t.amount]));
    const data = workbook.addWorksheet('Coin Quest Data'); data.addRow(['Expense JSON']);
    board.expenses.forEach(e => { const { receipt, ...value } = e; void receipt; data.addRow([JSON.stringify(withoutUndefined(value))]); });
  }
  await shareFile(template ? 'party-ledger-template.xlsx' : 'party-ledger.xlsx', new Uint8Array(await workbook.xlsx.writeBuffer()), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}
function cellText(cell: CellValue): string {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'object') {
    if ('formula' in cell || 'sharedFormula' in cell) throw new Error('ไฟล์นำเข้าต้องใช้ค่าจริง ไม่ใช้สูตร');
    if ('richText' in cell) return cell.richText.map(r => r.text).join('');
    if ('text' in cell) return cell.text;
  }
  return String(cell);
}
export async function importBoardFile(file: File, board: Board): Promise<ImportPreview> {
  let rows: unknown[];
  if (file.name.toLowerCase().endsWith('.xlsx')) {
    const wb = new ExcelJS.Workbook(); const bytes = await file.bytes();
    await wb.xlsx.load(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
    const exact = wb.getWorksheet('Coin Quest Data');
    const sheet = exact || wb.getWorksheet('Expenses') || wb.getWorksheet('Quest Log') || wb.worksheets[0];
    if (!sheet || sheet.rowCount > 503) throw new Error('รองรับไม่เกิน 500 รายการต่อไฟล์');
    rows = [];
    sheet.eachRow((row, index) => {
      if (index === 1) return;
      const desc = cellText(row.getCell(1).value).trim(); if (!desc) return;
      if (exact) rows.push(JSON.parse(desc));
      else { const value = spreadsheetExpense(desc, cellText(row.getCell(2).value), cellText(row.getCell(3).value), cellText(row.getCell(4).value)); if (value) rows.push(value); }
    });
  } else {
    const raw = JSON.parse(await file.text()); rows = raw?.data?.expenses || raw?.expenses;
    if (!Array.isArray(rows)) throw new Error('ไฟล์ไม่มีรายการ expenses ที่อ่านได้');
  }
  return previewImport(rows, board, randomUUID);
}
