import { Injectable } from '@nestjs/common';
import { stringify } from 'csv-stringify/sync';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export interface ExportColumn { header: string; key: string; width?: number; }

@Injectable()
export class ExportService {
  toCsv(columns: ExportColumn[], rows: Record<string, unknown>[]): Buffer {
    const records = rows.map((row) => columns.map((col) => row[col.key] ?? ''));
    const csv = stringify([columns.map((c) => c.header), ...records]);
    return Buffer.from(csv, 'utf-8');
  }

  async toExcel(columns: ExportColumn[], rows: Record<string, unknown>[], sheetName = 'Export'): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = columns.map((col) => ({ header: col.header, key: col.key, width: col.width ?? 18 }));
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
    rows.forEach((row) => sheet.addRow(row));
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  toPdf(title: string, columns: ExportColumn[], rows: Record<string, unknown>[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape' });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(18).text(title, { align: 'left' });
        doc.fontSize(9).fillColor('#666').text(new Date().toLocaleString(), { align: 'left' });
        doc.moveDown(1);

        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const colWidth = pageWidth / columns.length;
        let y = doc.y;

        const drawRow = (values: string[], bold: boolean) => {
          doc.fontSize(8).fillColor(bold ? '#000' : '#222');
          values.forEach((value, i) => {
            doc.text(String(value ?? ''), doc.page.margins.left + i * colWidth, y, { width: colWidth - 4, ellipsis: true });
          });
          y += 18;
          if (y > doc.page.height - doc.page.margins.bottom - 20) { doc.addPage(); y = doc.page.margins.top; }
        };

        drawRow(columns.map((c) => c.header), true);
        doc.moveTo(doc.page.margins.left, y - 4).lineTo(doc.page.width - doc.page.margins.right, y - 4).strokeColor('#ccc').stroke();
        rows.forEach((row) => drawRow(columns.map((c) => String(row[c.key] ?? '')), false));
        doc.end();
      } catch (err) { reject(err); }
    });
  }
}
