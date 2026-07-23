import { sequelize } from '../common/database/mysql';
import { QueryTypes } from 'sequelize';
import { sucursalFilter } from '../common/request-context';
export class ReportsService {
  // â”€â”€â”€ Ventas por fecha/cliente/tipo â”€â”€â”€
  async getSales(from: string, to: string, cliente?: number, tipo?: string, estado?: string) {
    const sf = sucursalFilter();
    let sql = `SELECT v.idventa, v.tipo_comprobante, v.serie_comprobante, v.num_comprobante,
                      v.total_venta, v.impuesto, v.fecha_hora, v.estado, v.motivo_anulacion,
                      p.nombre as cliente, u.nombre as usuario
               FROM venta v
               LEFT JOIN persona p ON v.idcliente = p.idpersona
               LEFT JOIN usuario u ON v.idusuario = u.idusuario
               WHERE DATE(v.fecha_hora) BETWEEN :from AND :to`;
    if (!estado || estado === 'Todas') {
      sql += ` AND v.estado IN ('Aceptado','Anulado')`;
    } else if (estado === 'Activas' || estado === 'Aceptado') {
      sql += ` AND v.estado = 'Aceptado'`;
    } else {
      sql += ` AND v.estado = :estado`;
    }
    const replacements: any = { from, to };
    const sucursalCond = sf.idsucursal ? 'AND v.idsucursal = :idsucursal' : '';
    if (cliente) { sql += ' AND v.idcliente = :cliente'; replacements.cliente = cliente; }
    if (tipo) { sql += ' AND v.tipo_comprobante = :tipo'; replacements.tipo = tipo; }
    if (estado && estado !== 'Todas' && estado !== 'Activas' && estado !== 'Aceptado') { replacements.estado = estado; }
    sql += ` ${sucursalCond}`;
    replacements.idsucursal = sf.idsucursal;
    sql += ' ORDER BY v.fecha_hora DESC';
    const rows = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
    // Total general
    const total = rows.reduce((s: number, r: any) => s + parseFloat(r.total_venta || 0), 0);
    return { rows, total, count: rows.length };
  }
  // â”€â”€â”€ Compras por fecha â”€â”€â”€
  async getPurchases(from: string, to: string, proveedor?: number, estado?: string) {
    const sf = sucursalFilter();
    let sql = `SELECT i.idingreso, i.tipo_comprobante, i.serie_comprobante, i.num_comprobante,
                      i.total_compra, i.fecha_hora, i.estado, i.motivo_anulacion,
                      p.nombre as proveedor, u.nombre as usuario
               FROM ingreso i
               LEFT JOIN persona p ON i.idproveedor = p.idpersona
               LEFT JOIN usuario u ON i.idusuario = u.idusuario
               WHERE DATE(i.fecha_hora) BETWEEN :from AND :to`;
    if (!estado || estado === 'Todas') {
      sql += ` AND i.estado IN ('Aceptado','Anulado')`;
    } else if (estado === 'Activas' || estado === 'Aceptado') {
      sql += ` AND i.estado = 'Aceptado'`;
    } else {
      sql += ` AND i.estado = :estado`;
    }
    const replacements: any = { from, to };
    const sucursalCond = sf.idsucursal ? 'AND i.idsucursal = :idsucursal' : '';
    if (proveedor) { sql += ' AND i.idproveedor = :proveedor'; replacements.proveedor = proveedor; }
    if (estado && estado !== 'Todas' && estado !== 'Activas' && estado !== 'Aceptado') { replacements.estado = estado; }
    sql += ` ${sucursalCond}`;
    replacements.idsucursal = sf.idsucursal;
    sql += ' ORDER BY i.fecha_hora DESC';
    const rows = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
    const total = rows.reduce((s: number, r: any) => s + parseFloat(r.total_compra || 0), 0);
    return { rows, total, count: rows.length };
  }
  // â”€â”€â”€ Facturas DTE por fecha / cliente â”€â”€â”€
  async getDteInvoices(from: string, to: string, cliente?: number, estado?: string) {
    const sf = sucursalFilter();
    let sql = `SELECT sf.idfactura, sf.autorizacion, sf.serie, sf.numero,
                      sf.total, sf.impuesto, sf.fecha_certificacion,
                      sf.nit_comprador, sf.nombre_comprador, sf.estado as estado_dte,
                      v.idventa, v.serie_comprobante, v.num_comprobante, v.estado as estado_venta, v.motivo_anulacion,
                      p.nombre as cliente_nombre
               FROM sat_facturas sf
               LEFT JOIN venta v ON sf.idventa = v.idventa
               LEFT JOIN persona p ON v.idcliente = p.idpersona
               WHERE (:from = '' OR DATE(sf.fecha_certificacion) BETWEEN :from AND :to)`;
    if (estado && estado !== 'Todas') {
      if (estado === 'Activas' || estado === 'Aceptado') {
        sql += ` AND sf.estado = 0`;
      } else {
        sql += ` AND sf.estado = 1`;
      }
    }
    const replacements: any = { from, to };
    const sucursalCond = sf.idsucursal ? 'AND v.idsucursal = :idsucursal' : '';
    if (cliente) { sql += ' AND v.idcliente = :cliente'; replacements.cliente = cliente; }
    sql += ` ${sucursalCond}`;
    replacements.idsucursal = sf.idsucursal;
    sql += ' ORDER BY sf.fecha_certificacion DESC';
    const rows = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
    const total = rows.reduce((s: number, r: any) => s + parseFloat(r.total || 0), 0);
    const impuesto = rows.reduce((s: number, r: any) => s + parseFloat(r.impuesto || 0), 0);
    return { rows, total, impuesto, count: rows.length };
  }
  // â”€â”€â”€ Compras vs Ventas por año â”€â”€â”€
  async getPurchasesVsSales(year: number) {
    const sf = sucursalFilter();
    const sucursalCondV = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
    const sucursalCondI = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
    const rows = await sequelize.query(
      `SELECT m.mes,
              IFNULL(v.total_venta, 0) as total_venta,
              IFNULL(c.total_compra, 0) as total_compra
       FROM (
         SELECT 1 as mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
         UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
         UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
       ) m
       LEFT JOIN (
         SELECT MONTH(fecha_hora) as mes, SUM(total_venta) as total_venta
         FROM venta WHERE YEAR(fecha_hora) = :year AND estado = 'Aceptado' ${sucursalCondV}
         GROUP BY MONTH(fecha_hora)
       ) v ON m.mes = v.mes
       LEFT JOIN (
         SELECT MONTH(fecha_hora) as mes, SUM(total_compra) as total_compra
         FROM ingreso WHERE YEAR(fecha_hora) = :year AND estado = 'Aceptado' ${sucursalCondI}
         GROUP BY MONTH(fecha_hora)
       ) c ON m.mes = c.mes
       ORDER BY m.mes`,
      { replacements: { year, idsucursal: sf.idsucursal }, type: QueryTypes.SELECT }
    );
    const totalVentas = rows.reduce((s: number, r: any) => s + parseFloat(r.total_venta || 0), 0);
    const totalCompras = rows.reduce((s: number, r: any) => s + parseFloat(r.total_compra || 0), 0);
    return { rows, totalVentas, totalCompras, diferencia: totalVentas - totalCompras };
  }
  // â”€â”€â”€ Stock mínimo â”€â”€â”€
  async getLowStock(threshold: number, categoria?: number) {
    const sf = sucursalFilter();
    const sucursalCond = sf.idsucursal ? 'AND ars.idsucursal = :idsucursal' : '';
    let sql = `SELECT a.idarticulo, a.codigo, a.nombre, ars.stock, a.precio_venta,
                      c.nombre as categoria
               FROM articulo_sucursal ars
               JOIN articulo a ON ars.idarticulo = a.idarticulo
               LEFT JOIN categoria c ON a.idcategoria = c.idcategoria
               WHERE ars.stock <= :threshold ${sucursalCond}`;
    const replacements: any = { threshold, idsucursal: sf.idsucursal };
    if (categoria) { sql += ' AND a.idcategoria = :categoria'; replacements.categoria = categoria; }
    sql += ' ORDER BY ars.stock ASC';
    const rows = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
    return { rows, count: rows.length };
  }
  // â”€â”€â”€ Productos más vendidos â”€â”€â”€
  async getTopProducts(from: string, to: string, categoria?: number) {
    const sf = sucursalFilter();
    let sql = `SELECT a.idarticulo, a.codigo, a.nombre, a.precio_venta,
                      c.nombre as categoria,
                      SUM(dv.cantidad) as cantidad_vendida,
                      SUM(dv.precio_venta * dv.cantidad) as total_vendido,
                      COUNT(DISTINCT v.idventa) as num_ventas
               FROM detalle_venta dv
               JOIN venta v ON dv.idventa = v.idventa
               JOIN articulo a ON dv.idarticulo = a.idarticulo
               LEFT JOIN categoria c ON a.idcategoria = c.idcategoria
               WHERE v.estado = 'Aceptado'
                 AND DATE(v.fecha_hora) BETWEEN :from AND :to`;
    const replacements: any = { from, to };
    const sucursalCond = sf.idsucursal ? 'AND v.idsucursal = :idsucursal' : '';
    if (categoria) { sql += ' AND a.idcategoria = :categoria'; replacements.categoria = categoria; }
    sql += ` ${sucursalCond}`;
    replacements.idsucursal = sf.idsucursal;
    sql += ' GROUP BY a.idarticulo, a.codigo, a.nombre, a.precio_venta, c.nombre ORDER BY total_vendido DESC';
    const rows = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
    const totalCantidad = rows.reduce((s: number, r: any) => s + parseInt(r.cantidad_vendida || 0), 0);
    const totalVendido = rows.reduce((s: number, r: any) => s + parseFloat(r.total_vendido || 0), 0);
    return { rows, totalCantidad, totalVendido, count: rows.length };
  }
  // â”€â”€â”€ Inventario (stock completo) â”€â”€â”€
  async getInventory(categoria?: number, stockMin?: number) {
    const sf = sucursalFilter();
    let sql = `SELECT a.idarticulo, a.codigo, a.nombre, ars.stock, a.precio_venta,
                      c.nombre as categoria
               FROM articulo a
               LEFT JOIN articulo_sucursal ars ON a.idarticulo = ars.idarticulo AND ars.idsucursal = :idsucursal
               LEFT JOIN categoria c ON a.idcategoria = c.idcategoria
               WHERE 1=1`;
    const replacements: any = { idsucursal: sf.idsucursal || 1 };
    if (categoria) { sql += ' AND a.idcategoria = :categoria'; replacements.categoria = categoria; }
    if (stockMin !== undefined) { sql += ' AND ars.stock >= :stockMin'; replacements.stockMin = stockMin; }
    sql += ' ORDER BY a.nombre ASC';
    const rows = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
    const totalProductos = rows.length;
    const totalUnidades = rows.reduce((s: number, r: any) => s + parseInt(r.stock || 0), 0);
    const totalValor = rows.reduce((s: number, r: any) => s + parseFloat(r.stock || 0) * parseFloat(r.precio_venta || 0), 0);
    return { rows, totalProductos, totalUnidades, totalValor };
  }
}
