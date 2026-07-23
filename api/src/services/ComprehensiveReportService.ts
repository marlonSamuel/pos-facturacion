import ExcelJS from 'exceljs';
import { sequelize } from '../common/database/mysql';
import { QueryTypes } from 'sequelize';
import { sucursalFilter } from '../common/request-context';
export class ComprehensiveReportService {
  async generate(from: string, to: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    await Promise.all([
      this.addSalesSheet(workbook, from, to),
      this.addPurchasesSheet(workbook, from, to),
      this.addDteSheet(workbook, from, to),
      this.addSummarySheet(workbook, from, to),
    ]);
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
  async getSummary(from: string, to: string) {
    const summary = await this.fetchSummaryData(from, to);
    const vs = await this.fetchMonthlyComparison(from, to);
    const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const monthly = vs.map((r: any) => ({
      mes: MONTHS[r.mes - 1],
      ventas: parseFloat(r.total_venta || 0),
      compras: parseFloat(r.total_compra || 0),
      diferencia: parseFloat(r.total_venta || 0) - parseFloat(r.total_compra || 0),
    }));
    const totalVentas = monthly.reduce((s, r) => s + r.ventas, 0);
    const totalCompras = monthly.reduce((s, r) => s + r.compras, 0);
    const ganancia = totalVentas - totalCompras;
    return {
      periodo: { desde: from, hasta: to },
      mensual: monthly,
      totalVentas,
      totalCompras,
      ganancia,
      margen: totalVentas > 0 ? (ganancia / totalVentas) * 100 : 0,
      facturas: {
        count: summary.facturas.count,
        total: parseFloat(summary.facturas.total || 0),
        iva: parseFloat(summary.facturas.impuesto || 0),
      },
      tickets: { count: summary.ticket.count, total: parseFloat(summary.ticket.total || 0) },
      boletas: { count: summary.boleta.count, total: parseFloat(summary.boleta.total || 0) },
      compras: { count: summary.compras.count, total: parseFloat(summary.compras.total || 0) },
      dte: { count: summary.dte.count, total: parseFloat(summary.dte.total || 0) },
    };
  }
  private styleHeader(ws: ExcelJS.Worksheet, columns: number) {
    const header = ws.getRow(1);
    for (let i = 1; i <= columns; i++) {
      const cell = header.getCell(i);
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1677FF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    header.height = 22;
  }
  private async addSalesSheet(workbook: ExcelJS.Workbook, from: string, to: string) {
    const sf = sucursalFilter();
    const sucursalCond = sf.idsucursal ? 'AND v.idsucursal = :idsucursal' : '';
    const rows = await sequelize.query(
      `SELECT DATE(v.fecha_hora) as fecha, v.tipo_comprobante,
              CONCAT(v.serie_comprobante, v.num_comprobante) as documento,
              p.nombre as cliente, v.total_venta, v.impuesto,
              u.nombre as usuario
       FROM venta v
       LEFT JOIN persona p ON v.idcliente = p.idpersona
       LEFT JOIN usuario u ON v.idusuario = u.idusuario
       WHERE v.estado = 'Aceptado'
         AND DATE(v.fecha_hora) BETWEEN :from AND :to
         ${sucursalCond}
       ORDER BY v.fecha_hora`,
      { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }
    );
    const sheet = workbook.addWorksheet('Ventas');
    sheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 14 },
      { header: 'Tipo', key: 'tipo_comprobante', width: 12 },
      { header: 'Documento', key: 'documento', width: 18 },
      { header: 'Cliente', key: 'cliente', width: 28 },
      { header: 'Total', key: 'total_venta', width: 14 },
      { header: 'IVA', key: 'impuesto', width: 14 },
      { header: 'Usuario', key: 'usuario', width: 16 },
    ];
    this.styleHeader(sheet, 7);
    rows.forEach((r: any, i) => {
      const row = sheet.getRow(i + 2);
      row.getCell(1).value = r.fecha ? new Date(r.fecha).toLocaleDateString('es-GT') : '';
      row.getCell(2).value = r.tipo_comprobante;
      row.getCell(3).value = r.documento;
      row.getCell(4).value = r.cliente;
      row.getCell(5).value = parseFloat(r.total_venta || 0);
      row.getCell(6).value = parseFloat(r.impuesto || 0);
      row.getCell(7).value = r.usuario;
      if (i % 2 === 1) row.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }; });
    });
    const total = rows.reduce((s: number, r: any) => s + parseFloat(r.total_venta || 0), 0);
    const tax = rows.reduce((s: number, r: any) => s + parseFloat(r.impuesto || 0), 0);
    const footer = sheet.getRow(rows.length + 2);
    footer.getCell(4).value = `Total Ventas: Q${total.toFixed(2)}  |  IVA: Q${tax.toFixed(2)}  |  Registros: ${rows.length}`;
    footer.getCell(4).font = { bold: true, size: 10, color: { argb: 'FF1677FF' } };
  }
  private async addPurchasesSheet(workbook: ExcelJS.Workbook, from: string, to: string) {
    const sf = sucursalFilter();
    const sucursalCond = sf.idsucursal ? 'AND i.idsucursal = :idsucursal' : '';
    const rows = await sequelize.query(
      `SELECT DATE(i.fecha_hora) as fecha, i.tipo_comprobante,
              CONCAT(i.serie_comprobante, i.num_comprobante) as documento,
              p.nombre as proveedor, i.total_compra
       FROM ingreso i
       LEFT JOIN persona p ON i.idproveedor = p.idpersona
       WHERE i.estado = 'Aceptado'
         AND DATE(i.fecha_hora) BETWEEN :from AND :to
         ${sucursalCond}
       ORDER BY i.fecha_hora`,
      { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }
    );
    const sheet = workbook.addWorksheet('Compras');
    sheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 14 },
      { header: 'Tipo', key: 'tipo_comprobante', width: 12 },
      { header: 'Documento', key: 'documento', width: 18 },
      { header: 'Proveedor', key: 'proveedor', width: 28 },
      { header: 'Total', key: 'total_compra', width: 14 },
    ];
    this.styleHeader(sheet, 5);
    rows.forEach((r: any, i) => {
      const row = sheet.getRow(i + 2);
      row.getCell(1).value = r.fecha ? new Date(r.fecha).toLocaleDateString('es-GT') : '';
      row.getCell(2).value = r.tipo_comprobante;
      row.getCell(3).value = r.documento;
      row.getCell(4).value = r.proveedor;
      row.getCell(5).value = parseFloat(r.total_compra || 0);
      if (i % 2 === 1) row.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }; });
    });
    const total = rows.reduce((s: number, r: any) => s + parseFloat(r.total_compra || 0), 0);
    const footer = sheet.getRow(rows.length + 2);
    footer.getCell(4).value = `Total Compras: Q${total.toFixed(2)}  |  Registros: ${rows.length}`;
    footer.getCell(4).font = { bold: true, size: 10, color: { argb: 'FF1677FF' } };
  }
  private async addDteSheet(workbook: ExcelJS.Workbook, from: string, to: string) {
    const sf = sucursalFilter();
    const sucursalJoin = sf.idsucursal ? 'LEFT JOIN venta v ON sf.idventa = v.idventa' : 'LEFT JOIN venta v ON sf.idventa = v.idventa';
    const sucursalWhere = sf.idsucursal ? 'AND v.idsucursal = :idsucursal' : '';
    const rows = await sequelize.query(
      `SELECT sf.autorizacion, sf.serie, sf.numero, sf.nit_comprador,
              sf.nombre_comprador, sf.total, sf.impuesto, sf.fecha_certificacion
       FROM sat_facturas sf
       LEFT JOIN venta v ON sf.idventa = v.idventa
       WHERE DATE(sf.fecha_certificacion) BETWEEN :from AND :to
         ${sucursalWhere}
       ORDER BY sf.fecha_certificacion`,
      { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }
    );
    const sheet = workbook.addWorksheet('Facturas DTE');
    sheet.columns = [
      { header: 'Autorización', key: 'autorizacion', width: 24 },
      { header: 'Serie', key: 'serie', width: 8 },
      { header: 'No.', key: 'numero', width: 10 },
      { header: 'NIT', key: 'nit_comprador', width: 16 },
      { header: 'Comprador', key: 'nombre_comprador', width: 24 },
      { header: 'Total', key: 'total', width: 14 },
      { header: 'IVA', key: 'impuesto', width: 14 },
      { header: 'Fecha Cert.', key: 'fecha_certificacion', width: 14 },
    ];
    this.styleHeader(sheet, 8);
    rows.forEach((r: any, i) => {
      const row = sheet.getRow(i + 2);
      row.getCell(1).value = r.autorizacion;
      row.getCell(2).value = r.serie;
      row.getCell(3).value = r.numero;
      row.getCell(4).value = r.nit_comprador;
      row.getCell(5).value = r.nombre_comprador;
      row.getCell(6).value = parseFloat(r.total || 0);
      row.getCell(7).value = parseFloat(r.impuesto || 0);
      row.getCell(8).value = r.fecha_certificacion ? new Date(r.fecha_certificacion).toLocaleDateString('es-GT') : '';
      if (i % 2 === 1) row.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }; });
    });
    const total = rows.reduce((s: number, r: any) => s + parseFloat(r.total || 0), 0);
    const tax = rows.reduce((s: number, r: any) => s + parseFloat(r.impuesto || 0), 0);
    const footer = sheet.getRow(rows.length + 2);
    footer.getCell(5).value = `Total: Q${total.toFixed(2)}  |  IVA: Q${tax.toFixed(2)}  |  Facturas: ${rows.length}`;
    footer.getCell(5).font = { bold: true, size: 10, color: { argb: 'FF1677FF' } };
  }
  private async fetchMonthlyComparison(from: string, to: string) {
    const sf = sucursalFilter();
    const sucursalCondV = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
    const sucursalCondI = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
    return sequelize.query(
      `SELECT m.mes,
              IFNULL(v.total_venta, 0) as total_venta,
              IFNULL(c.total_compra, 0) as total_compra
       FROM (SELECT 1 as mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
             UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
             UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) m
       LEFT JOIN (SELECT MONTH(fecha_hora) as mes, SUM(total_venta) as total_venta
                  FROM venta WHERE DATE(fecha_hora) BETWEEN :from AND :to AND estado = 'Aceptado' ${sucursalCondV}
                  GROUP BY MONTH(fecha_hora)) v ON m.mes = v.mes
       LEFT JOIN (SELECT MONTH(fecha_hora) as mes, SUM(total_compra) as total_compra
                  FROM ingreso WHERE DATE(fecha_hora) BETWEEN :from AND :to AND estado = 'Aceptado' ${sucursalCondI}
                  GROUP BY MONTH(fecha_hora)) c ON m.mes = c.mes
       ORDER BY m.mes`,
      { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }
    );
  }
  private async fetchSummaryData(from: string, to: string) {
    const sf = sucursalFilter();
    const sucursalCondV = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
    const sucursalCondI = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
    const [ventas, facturas, ticket, boleta, compras, dte] = await Promise.all([
      sequelize.query(`SELECT COUNT(*) as count, SUM(total_venta) as total, SUM(impuesto) as impuesto
        FROM venta WHERE DATE(fecha_hora) BETWEEN :from AND :to AND estado = 'Aceptado' ${sucursalCondV}`, { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }),
      sequelize.query(`SELECT COUNT(*) as count, SUM(total_venta) as total, SUM(impuesto) as impuesto
        FROM venta WHERE DATE(fecha_hora) BETWEEN :from AND :to AND estado = 'Aceptado' AND tipo_comprobante = 'Factura' ${sucursalCondV}`, { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }),
      sequelize.query(`SELECT COUNT(*) as count, SUM(total_venta) as total
        FROM venta WHERE DATE(fecha_hora) BETWEEN :from AND :to AND estado = 'Aceptado' AND tipo_comprobante = 'Ticket' ${sucursalCondV}`, { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }),
      sequelize.query(`SELECT COUNT(*) as count, SUM(total_venta) as total
        FROM venta WHERE DATE(fecha_hora) BETWEEN :from AND :to AND estado = 'Aceptado' AND tipo_comprobante = 'Boleta' ${sucursalCondV}`, { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }),
      sequelize.query(`SELECT COUNT(*) as count, SUM(total_compra) as total
        FROM ingreso WHERE DATE(fecha_hora) BETWEEN :from AND :to AND estado = 'Aceptado' ${sucursalCondI}`, { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }),
      sequelize.query(`SELECT COUNT(*) as count, SUM(sf.total) as total, SUM(sf.impuesto) as impuesto
        FROM sat_facturas sf
        ${sf.idsucursal ? 'JOIN venta v ON sf.idventa = v.idventa' : ''}
        WHERE DATE(sf.fecha_certificacion) BETWEEN :from AND :to
        ${sf.idsucursal ? 'AND v.idsucursal = :idsucursal' : ''}`, { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }),
    ]);
    return { ventas: ventas[0] as any, facturas: facturas[0] as any, ticket: ticket[0] as any, boleta: boleta[0] as any, compras: compras[0] as any, dte: dte[0] as any };
  }
  private async addSummarySheet(workbook: ExcelJS.Workbook, from: string, to: string) {
    const sheet = workbook.addWorksheet('Resumen General');
    sheet.columns = [
      { header: 'Resumen General', key: 'label', width: 30 },
      { header: 'Valor', key: 'value', width: 20 },
      { header: '', key: '', width: 10 },
      { header: '', key: '', width: 10 },
    ];
    const vs = await this.fetchMonthlyComparison(from, to);
    const summary = await this.fetchSummaryData(from, to);
    const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const monthRows = vs.map((r: any) => [MONTHS[r.mes - 1], `Q${parseFloat(r.total_venta || 0).toFixed(2)}`, `Q${parseFloat(r.total_compra || 0).toFixed(2)}`, `Q${(parseFloat(r.total_venta || 0) - parseFloat(r.total_compra || 0)).toFixed(2)}`]);
    const { facturas, ticket, boleta, compras, dte } = summary;
    const totalVentas = monthRows.reduce((s: number, r: any) => s + parseFloat(r[1].replace('Q', '').replace(',', '')), 0);
    const totalCompras = monthRows.reduce((s: number, r: any) => s + parseFloat(r[2].replace('Q', '').replace(',', '')), 0);
    const totalIva = parseFloat(facturas.impuesto || 0);
    const ganancia = totalVentas - totalCompras;
    // â”€â”€ Build sheet â”€â”€
    const headerStyle = { font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1677FF' } } };
    const subHeaderStyle = { font: { bold: true, size: 10, color: { argb: 'FF1677FF' } } };
    const labelStyle = { font: { bold: true, size: 10 } };
    let rowIdx = 1;
    // Title
    sheet.mergeCells(rowIdx, 1, rowIdx, 4);
    const titleCell = sheet.getCell(`A${rowIdx}`);
    titleCell.value = `Resumen de ${new Date(from).toLocaleDateString('es-GT')} - ${new Date(to).toLocaleDateString('es-GT')}`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1677FF' } };
    titleCell.alignment = { horizontal: 'center' };
    sheet.getRow(rowIdx).height = 30;
    rowIdx++;
    // Headers
    sheet.getRow(rowIdx).values = ['', 'Ventas', 'Compras', 'Diferencia'];
    Object.assign(sheet.getRow(rowIdx), headerStyle);
    sheet.getRow(rowIdx).height = 22;
    rowIdx++;
    // Monthly rows
    monthRows.forEach((mr: any) => {
      sheet.getRow(rowIdx).values = mr;
      rowIdx++;
    });
    // Totals row
    sheet.getRow(rowIdx).values = ['TOTAL', `Q${totalVentas.toFixed(2)}`, `Q${totalCompras.toFixed(2)}`, `Q${ganancia.toFixed(2)}`];
    Object.assign(sheet.getRow(rowIdx), { font: { bold: true, size: 10 } });
    rowIdx++;
    rowIdx++;
    // â”€â”€ Additional metrics â”€â”€
    sheet.getRow(rowIdx).values = ['Métricas Generales'];
    Object.assign(sheet.getRow(rowIdx), subHeaderStyle);
    rowIdx++;
    const metrics = [
      ['Total Ventas', `Q${totalVentas.toFixed(2)}`, `${summary.ventas.count} registros`],
      ['  Facturas (con IVA)', `Q${parseFloat(facturas.total || 0).toFixed(2)}`, `${facturas.count} documentos`],
      ['  Ticket (sin IVA)', `Q${parseFloat(ticket.total || 0).toFixed(2)}`, `${ticket.count} documentos`],
      ['  Boleta (sin IVA)', `Q${parseFloat(boleta.total || 0).toFixed(2)}`, `${boleta.count} documentos`],
      ['IVA Total (solo Facturas)', `Q${totalIva.toFixed(2)}`, '12% sobre facturas'],
      ['', '', ''],
      ['Total Compras', `Q${totalCompras.toFixed(2)}`, `${compras.count} registros`],
      ['Ganancia Bruta', `Q${ganancia.toFixed(2)}`, totalVentas > 0 ? `${((ganancia / totalVentas) * 100).toFixed(1)}% margen` : ''],
      ['', '', ''],
      ['Facturas DTE Emitidas', `${dte.count}`, `Total: Q${parseFloat(dte.total || 0).toFixed(2)}`],
    ];
    metrics.forEach((m, i) => {
      const r = sheet.getRow(rowIdx);
      r.getCell(1).value = m[0];
      r.getCell(1).font = { bold: true, size: 10 } as any;
      r.getCell(2).value = m[1];
      r.getCell(3).value = m[2];
      if (i % 2 === 1) r.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }; });
      rowIdx++;
    });
  }
}
