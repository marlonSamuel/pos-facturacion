import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
interface Column {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: (v: any, row: any) => string;
}
export class ReportsExportService {
  async toPdf(title: string, columns: Column[], data: any[], footer?: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      // â”€â”€ Header â”€â”€
      doc.fontSize(16).font('Helvetica-Bold').text('New Horizon', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(title, { align: 'center' });
      doc.moveDown(0.5);
      // â”€â”€ Date range â”€â”€
      doc.fontSize(9).font('Helvetica')
        .text(`Generado: ${new Date().toLocaleDateString('es-GT')}`, { align: 'right' });
      doc.moveDown();
      // â”€â”€ Table â”€â”€
      const startX = 30;
      const pageWidth = doc.page.width - 60;
      const colWidths = columns.map(c => (pageWidth * (c.width || 1)) / columns.reduce((s, _, i) => s + (columns[i].width || 1), 0));
      const rowHeight = 18;
      let y = doc.y;
      const drawHeader = () => {
        doc.font('Helvetica-Bold').fontSize(8);
        let x = startX;
        doc.rect(startX, y, pageWidth, rowHeight).fill('#1677ff');
        doc.fill('#fff');
        columns.forEach((col, i) => {
          doc.text(col.header, x + 3, y + 4, { width: colWidths[i] - 6, align: col.align || 'left' });
          x += colWidths[i];
        });
        y += rowHeight;
      };
      const drawRow = (row: any) => {
        if (y + rowHeight > doc.page.height - 50) {
          doc.addPage();
          y = doc.y;
          drawHeader();
        }
        doc.font('Helvetica').fontSize(7.5);
        let x = startX;
        // Alternate row background
        const rowIndex = data.indexOf(row);
        if (rowIndex % 2 === 1) {
          doc.rect(startX, y, pageWidth, rowHeight).fill('#f5f5f5');
        }
        doc.fill('#000');
        columns.forEach((col, i) => {
          const val = col.format ? col.format(row[col.key], row) : (row[col.key] ?? '');
          doc.text(String(val), x + 3, y + 4, { width: colWidths[i] - 6, align: col.align || 'left' });
          x += colWidths[i];
        });
        y += rowHeight;
      };
      drawHeader();
      data.forEach(drawRow);
      // â”€â”€ Footer â”€â”€
      if (footer) {
        y += 8;
        doc.font('Helvetica-Bold').fontSize(9).fill('#1677ff').text(footer, startX, y);
      }
      doc.end();
    });
  }
  async toExcel(title: string, columns: Column[], data: any[], footer?: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(title);
    // â”€â”€ Title row â”€â”€
    sheet.mergeCells(1, 1, 1, columns.length);
    const titleCell = sheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1677FF' } };
    titleCell.alignment = { horizontal: 'center' };
    sheet.getRow(1).height = 30;
    // â”€â”€ Header row â”€â”€
    const headerRow = sheet.getRow(2);
    columns.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = col.header;
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1677FF' } };
      cell.alignment = { horizontal: col.align || 'left', vertical: 'middle' };
    });
    headerRow.height = 22;
    // â”€â”€ Data rows â”€â”€
    data.forEach((row, idx) => {
      const excelRow = sheet.getRow(idx + 3);
      columns.forEach((col, i) => {
        const cell = excelRow.getCell(i + 1);
        const val = col.format ? col.format(row[col.key], row) : row[col.key];
        cell.value = val;
        cell.alignment = { horizontal: col.align || 'left' };
        // Alternate row color
        if (idx % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
        }
      });
    });
    // â”€â”€ Footer row â”€â”€
    if (footer) {
      const footerRow = sheet.getRow(data.length + 3);
      footerRow.getCell(1).value = footer;
      footerRow.getCell(1).font = { bold: true, size: 10, color: { argb: 'FF1677FF' } };
      footerRow.getCell(1).alignment = { horizontal: 'left' };
    }
    // â”€â”€ Column widths â”€â”€
    columns.forEach((col, i) => {
      sheet.getColumn(i + 1).width = col.width || 15;
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
