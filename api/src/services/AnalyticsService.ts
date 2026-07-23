import { sequelize } from '../common/database/mysql';
import { QueryTypes } from 'sequelize';
import { sucursalFilter } from '../common/request-context';
interface PeriodResult {
  totalVentas: number;
  totalCompras: number;
  ganancia: number;
  ivaFacturas: number;
  documentos: number;
  facturas: number;
  tickets: number;
  boletas: number;
  comprasCount: number;
  dteCount: number;
  dteTotal: number;
}
export class AnalyticsService {
  async getOverview(from: string, to: string) {
    const current = await this.fetchPeriod(from, to);
    const periodLen = new Date(to).getTime() - new Date(from).getTime();
    const prevTo = new Date(new Date(from).getTime() - 1).toISOString().slice(0, 10);
    const prevFrom = new Date(new Date(from).getTime() - periodLen).toISOString().slice(0, 10);
    const previous = await this.fetchPeriod(prevFrom, prevTo);
    const calcChange = (c: number, p: number) => p > 0 ? ((c - p) / p) * 100 : (c > 0 ? 100 : 0);
    return {
      periodo: { desde: from, hasta: to, prevDesde: prevFrom, prevHasta: prevTo },
      current,
      previous,
      comparacion: {
        ventas: { cambio: calcChange(current.totalVentas, previous.totalVentas) },
        compras: { cambio: calcChange(current.totalCompras, previous.totalCompras) },
        ganancia: { cambio: calcChange(current.ganancia, previous.ganancia) },
        documentos: { cambio: calcChange(current.documentos, previous.documentos) },
      },
    };
  }
  async getDailyTrend(from: string, to: string) {
    const sf = sucursalFilter();
    const sucursalCond = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
    const rows: any[] = await sequelize.query(
      `SELECT DATE(fecha_hora) as dia,
              SUM(total_venta) as ventas,
              SUM(impuesto) as iva,
              COUNT(*) as documentos
       FROM venta
       WHERE DATE(fecha_hora) BETWEEN :from AND :to
         AND estado = 'Aceptado'
         ${sucursalCond}
       GROUP BY DATE(fecha_hora)
       ORDER BY dia`,
      { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }
    );
    return rows.map(r => ({ dia: r.dia, ventas: parseFloat(r.ventas || 0), iva: parseFloat(r.iva || 0), documentos: r.documentos }));
  }
  async getWeeklyComparison(from: string, to: string) {
    const sf = sucursalFilter();
    const sucursalCond = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
    const rows: any[] = await sequelize.query(
      `SELECT YEARWEEK(fecha_hora, 1) as semana,
              SUM(total_venta) as ventas,
              COUNT(*) as documentos
       FROM venta
       WHERE DATE(fecha_hora) BETWEEN :from AND :to
         AND estado = 'Aceptado'
         ${sucursalCond}
       GROUP BY YEARWEEK(fecha_hora, 1)
       ORDER BY semana`,
      { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }
    );
    return rows.map(r => ({ semana: r.semana, ventas: parseFloat(r.ventas || 0), documentos: r.documentos }));
  }
  async getTopProducts(from: string, to: string, limit: number = 10) {
    const sf = sucursalFilter();
    const sucursalCond = sf.idsucursal ? 'AND v.idsucursal = :idsucursal' : '';
    const rows: any[] = await sequelize.query(
      `SELECT a.codigo, a.nombre, c.nombre as categoria,
              SUM(dv.cantidad) as cantidad,
              SUM(dv.precio_venta * dv.cantidad) as total
       FROM detalle_venta dv
       JOIN venta v ON dv.idventa = v.idventa
       JOIN articulo a ON dv.idarticulo = a.idarticulo
       LEFT JOIN categoria c ON a.idcategoria = c.idcategoria
       WHERE DATE(v.fecha_hora) BETWEEN :from AND :to
         AND v.estado = 'Aceptado'
         ${sucursalCond}
       GROUP BY a.idarticulo
       ORDER BY cantidad DESC
       LIMIT :limit`,
      { replacements: { from, to, limit, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }
    );
    return rows.map(r => ({ codigo: r.codigo, nombre: r.nombre, categoria: r.categoria, cantidad: parseInt(r.cantidad), total: parseFloat(r.total || 0) }));
  }
  async getSalesByType(from: string, to: string) {
    const sf = sucursalFilter();
    const sucursalCond = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
    const rows: any[] = await sequelize.query(
      `SELECT tipo_comprobante, COUNT(*) as documentos, SUM(total_venta) as total
       FROM venta
       WHERE DATE(fecha_hora) BETWEEN :from AND :to
         AND estado = 'Aceptado'
         ${sucursalCond}
       GROUP BY tipo_comprobante`,
      { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }
    );
    return rows.map(r => ({ tipo: r.tipo_comprobante, documentos: r.documentos, total: parseFloat(r.total || 0) }));
  }
  private async fetchPeriod(from: string, to: string): Promise<PeriodResult> {
    const sf = sucursalFilter();
    const sucursalCondV = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
    const sucursalCondI = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
    const [ventas, compras, dte] = await Promise.all([
      sequelize.query(`SELECT COUNT(*) as docs,
        SUM(CASE WHEN tipo_comprobante = 'Factura' THEN 1 ELSE 0 END) as facturas,
        SUM(CASE WHEN tipo_comprobante = 'Ticket' THEN 1 ELSE 0 END) as tickets,
        SUM(CASE WHEN tipo_comprobante = 'Boleta' THEN 1 ELSE 0 END) as boletas,
        SUM(total_venta) as total, SUM(impuesto) as iva
        FROM venta WHERE DATE(fecha_hora) BETWEEN :from AND :to AND estado = 'Aceptado' ${sucursalCondV}`,
        { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }),
      sequelize.query(`SELECT COUNT(*) as count, SUM(total_compra) as total
        FROM ingreso WHERE DATE(fecha_hora) BETWEEN :from AND :to AND estado = 'Aceptado' ${sucursalCondI}`,
        { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }),
      sequelize.query(`SELECT COUNT(*) as count, SUM(total) as total
        FROM sat_facturas sf
        ${sf.idsucursal ? 'JOIN venta v ON sf.idventa = v.idventa' : ''}
        WHERE DATE(sf.fecha_certificacion) BETWEEN :from AND :to
        ${sf.idsucursal ? 'AND v.idsucursal = :idsucursal' : ''}`,
        { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }),
    ]);
    const v = ventas[0] as any;
    const c = compras[0] as any;
    const d = dte[0] as any;
    const totalVentas = parseFloat(v.total || 0);
    const totalCompras = parseFloat(c.total || 0);
    return {
      totalVentas,
      totalCompras,
      ganancia: totalVentas - totalCompras,
      ivaFacturas: parseFloat(v.iva || 0),
      documentos: v.docs || 0,
      facturas: v.facturas || 0,
      tickets: v.tickets || 0,
      boletas: v.boletas || 0,
      comprasCount: c.count || 0,
      dteCount: d.count || 0,
      dteTotal: parseFloat(d.total || 0),
    };
  }
  // â”€â”€â”€ Categorías más vendidas â”€â”€â”€
  async getCategoryBreakdown(from: string, to: string) {
    const sf = sucursalFilter();
    const sucursalCond = sf.idsucursal ? 'AND v.idsucursal = :idsucursal' : '';
    const rows: any[] = await sequelize.query(
      `SELECT c.nombre as categoria,
              SUM(dv.cantidad) as cantidad,
              SUM(dv.precio_venta * dv.cantidad) as total
       FROM detalle_venta dv
       JOIN venta v ON dv.idventa = v.idventa
       JOIN articulo a ON dv.idarticulo = a.idarticulo
       JOIN categoria c ON a.idcategoria = c.idcategoria
       WHERE DATE(v.fecha_hora) BETWEEN :from AND :to AND v.estado = 'Aceptado'
         ${sucursalCond}
       GROUP BY a.idcategoria ORDER BY total DESC`,
      { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }
    );
    return rows.map(r => ({ categoria: r.categoria, cantidad: parseInt(r.cantidad), total: parseFloat(r.total || 0) }));
  }
  // â”€â”€â”€ Ventas por día de la semana â”€â”€â”€
  async getDayOfWeek(from: string, to: string) {
    const sf = sucursalFilter();
    const sucursalCond = sf.idsucursal ? 'AND v.idsucursal = :idsucursal' : '';
    const rows: any[] = await sequelize.query(
      `SELECT DAYOFWEEK(v.fecha_hora) as dia_num,
              SUM(v.total_venta) as ventas,
              COUNT(*) as documentos
       FROM venta v
       WHERE DATE(v.fecha_hora) BETWEEN :from AND :to AND v.estado = 'Aceptado'
         ${sucursalCond}
       GROUP BY DAYOFWEEK(v.fecha_hora) ORDER BY dia_num`,
      { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }
    );
    const DIAS = ['', 'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return rows.map(r => ({ dia: DIAS[r.dia_num] || '', ventas: parseFloat(r.ventas || 0), documentos: r.documentos }));
  }
  // â”€â”€â”€ Tendencia últimos 12 meses â”€â”€â”€
  async getMonthlyTrend(from: string, to: string) {
    const sf = sucursalFilter();
    const sucursalCondV = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
    const sucursalCondI = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
    const rows: any[] = await sequelize.query(
      `SELECT DATE_FORMAT(fecha_hora, '%Y-%m') as mes,
              SUM(total_venta) as ventas,
              SUM(impuesto) as iva,
              COUNT(*) as documentos
       FROM venta
       WHERE DATE(fecha_hora) BETWEEN :from AND :to AND estado = 'Aceptado'
         ${sucursalCondV}
       GROUP BY DATE_FORMAT(fecha_hora, '%Y-%m') ORDER BY mes`,
      { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }
    );
    // También compras por mes
    const compras: any[] = await sequelize.query(
      `SELECT DATE_FORMAT(fecha_hora, '%Y-%m') as mes, SUM(total_compra) as total
       FROM ingreso
       WHERE DATE(fecha_hora) BETWEEN :from AND :to AND estado = 'Aceptado'
         ${sucursalCondI}
       GROUP BY DATE_FORMAT(fecha_hora, '%Y-%m') ORDER BY mes`,
      { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }
    );
    const comprasMap = new Map(compras.map(r => [r.mes, parseFloat(r.total || 0)]));
    return rows.map(r => ({
      mes: r.mes,
      ventas: parseFloat(r.ventas || 0),
      compras: comprasMap.get(r.mes) || 0,
      iva: parseFloat(r.iva || 0),
      documentos: r.documentos,
    }));
  }
  // â”€â”€â”€ Top clientes â”€â”€â”€
  async getTopClients(from: string, to: string, limit: number = 5) {
    const sf = sucursalFilter();
    const sucursalCond = sf.idsucursal ? 'AND v.idsucursal = :idsucursal' : '';
    const rows: any[] = await sequelize.query(
      `SELECT p.idpersona, p.nombre, p.num_documento as documento,
              COUNT(v.idventa) as compras,
              SUM(v.total_venta) as total
       FROM venta v
       JOIN persona p ON v.idcliente = p.idpersona
       WHERE DATE(v.fecha_hora) BETWEEN :from AND :to AND v.estado = 'Aceptado'
         ${sucursalCond}
       GROUP BY v.idcliente ORDER BY total DESC LIMIT :limit`,
      { replacements: { from, to, limit, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }
    );
    return rows.map(r => ({ nombre: r.nombre, documento: r.documento, compras: r.compras, total: parseFloat(r.total || 0) }));
  }
  // â”€â”€â”€ Comparación día a día vs período anterior â”€â”€â”€
  async getDailyComparison(from: string, to: string) {
    const periodLen = new Date(to).getTime() - new Date(from).getTime();
    const prevTo = new Date(new Date(from).getTime() - 1).toISOString().slice(0, 10);
    const prevFrom = new Date(new Date(from).getTime() - periodLen).toISOString().slice(0, 10);
    const sf = sucursalFilter();
    const sucursalCond = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
    const [current, previous] = await Promise.all([
      sequelize.query(`SELECT DATE(fecha_hora) as dia, SUM(total_venta) as ventas
        FROM venta WHERE DATE(fecha_hora) BETWEEN :from AND :to AND estado = 'Aceptado' ${sucursalCond}
        GROUP BY DATE(fecha_hora) ORDER BY dia`,
        { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }),
      sequelize.query(`SELECT DATE(fecha_hora) as dia, SUM(total_venta) as ventas
        FROM venta WHERE DATE(fecha_hora) BETWEEN :from AND :to AND estado = 'Aceptado' ${sucursalCond}
        GROUP BY DATE(fecha_hora) ORDER BY dia`,
        { replacements: { from: prevFrom, to: prevTo, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }),
    ]);
    const currentArr = (current as any[]).map(r => ({ fecha: r.dia, ventas: parseFloat(r.ventas || 0) }));
    const previousArr = (previous as any[]).map(r => ({ fecha: r.dia, ventas: parseFloat(r.ventas || 0) }));
    const maxLen = Math.max(currentArr.length, previousArr.length);
    const result = [];
    for (let i = 0; i < maxLen; i++) {
      result.push({
        dia: currentArr[i]?.fecha
          ? new Date(currentArr[i].fecha).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit' })
          : (previousArr[i]?.fecha ? new Date(previousArr[i].fecha).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit' }) : `Día ${i + 1}`),
        actual: currentArr[i]?.ventas || 0,
        anterior: previousArr[i]?.ventas || 0,
      });
    }
    return result;
  }
  // â”€â”€â”€ Ventas por hora â”€â”€â”€
  async getHourlyDistribution(from: string, to: string) {
    const sf = sucursalFilter();
    const sucursalCond = sf.idsucursal ? 'AND v.idsucursal = :idsucursal' : '';
    const rows: any[] = await sequelize.query(
      `SELECT HOUR(v.fecha_hora) as hora,
              SUM(v.total_venta) as ventas,
              COUNT(*) as documentos
       FROM venta v
       WHERE DATE(v.fecha_hora) BETWEEN :from AND :to AND v.estado = 'Aceptado'
         ${sucursalCond}
       GROUP BY HOUR(v.fecha_hora) ORDER BY hora`,
      { replacements: { from, to, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }
    );
    return rows.map(r => ({ hora: `${String(r.hora).padStart(2, '0')}:00`, ventas: parseFloat(r.ventas || 0), documentos: r.documentos }));
  }
}
