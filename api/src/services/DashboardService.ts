import { ApplicationException } from '../common/errors/application.exception';
import { sequelize } from '../common/database/mysql';
import { QueryTypes } from 'sequelize';
import { sucursalFilter, comercioFilter } from '../common/request-context';
export class DashboardService {
  async getSummary() {
    try {
      const tablasExistentes = await this.checkTables();
      let ventasHoy = 0;
      let comprasHoy = 0;
      const facturas = { activas: 0, anuladas: 0, total: 0, impuesto: 0 };
      let ventasMeses: any[] = [];
      let comprasVsVentas: any[] = [];
      let totalClientes = 0;
      let totalProveedores = 0;
      let totalArticulos = 0;
      let stockBajo: any[] = [];
      let ventasRecientes: any[] = [];
      let productosTop: any[] = [];
      let ventasCountHoy = 0;
      let ticketPromedio = 0;
      const sf = sucursalFilter();
      if (tablasExistentes.venta) {
        const sucursalCond = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
        const [row]: any[] = await sequelize.query(
          `SELECT IFNULL(SUM(total_venta),0) as total, COUNT(*) as cantidad
           FROM venta WHERE estado = 'Aceptado' AND DATE(fecha_hora) = CURDATE() ${sucursalCond}`,
          { type: QueryTypes.SELECT, replacements: { idsucursal: sf.idsucursal } }
        );
        ventasHoy = row?.total || 0;
        ventasCountHoy = row?.cantidad || 0;
        ticketPromedio = ventasCountHoy > 0 ? ventasHoy / ventasCountHoy : 0;
      }
      if (tablasExistentes.ingreso) {
        const sucursalCond = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
        const [row]: any[] = await sequelize.query(
          `SELECT IFNULL(SUM(total_compra),0) as total FROM ingreso WHERE estado = 'Aceptado' AND DATE(fecha_hora) = CURDATE() ${sucursalCond}`,
          { type: QueryTypes.SELECT, replacements: { idsucursal: sf.idsucursal } }
        );
        comprasHoy = row?.total || 0;
      }
      // ... resto igual pero simplificado
      return {
        ventasHoy, comprasHoy, ventasCountHoy, ticketPromedio,
        facturas, ventasMeses, comprasVsVentas,
        totalClientes, totalProveedores, totalArticulos,
        stockBajo, ventasRecientes, productosTop
      };
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  // â”€â”€â”€ Endpoints agrupados â”€â”€â”€
  async getSalesSummary(userId?: number) {
    let ventasHoy = 0, ventasCountHoy = 0, ticketPromedio = 0;
    let comprasHoy = 0;
    let ventasAnuladasHoy = 0, ventasAnuladasCountHoy = 0;
    try {
      const sf = sucursalFilter();
      const userFilter = userId ? 'AND idusuario = :userId' : '';
      const sucursalFilterSales = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
      const [row]: any[] = await sequelize.query(
        `SELECT IFNULL(SUM(total_venta),0) as total, COUNT(*) as cantidad
         FROM venta WHERE estado = 'Aceptado' AND DATE(fecha_hora) = CURDATE() ${userFilter} ${sucursalFilterSales}`,
        { type: QueryTypes.SELECT, replacements: { userId, idsucursal: sf.idsucursal } }
      );
      ventasHoy = parseFloat(row?.total) || 0;
      ventasCountHoy = row?.cantidad || 0;
      ticketPromedio = ventasCountHoy > 0 ? ventasHoy / ventasCountHoy : 0;
      // Ventas anuladas hoy
      const [rowAn]: any[] = await sequelize.query(
        `SELECT IFNULL(SUM(total_venta),0) as total, COUNT(*) as cantidad
         FROM venta WHERE estado = 'Anulado' AND DATE(fecha_hora) = CURDATE() ${userFilter} ${sucursalFilterSales}`,
        { type: QueryTypes.SELECT, replacements: { userId, idsucursal: sf.idsucursal } }
      );
      ventasAnuladasHoy = parseFloat(rowAn?.total) || 0;
      ventasAnuladasCountHoy = rowAn?.cantidad || 0;
      // Compras solo si es admin
      if (!userId) {
        const sucursalFilterPurchases = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
        const [row2]: any[] = await sequelize.query(
          `SELECT IFNULL(SUM(total_compra),0) as total FROM ingreso WHERE estado = 'Aceptado' AND DATE(fecha_hora) = CURDATE() ${sucursalFilterPurchases}`,
          { type: QueryTypes.SELECT, replacements: { idsucursal: sf.idsucursal } }
        );
        comprasHoy = parseFloat(row2?.total) || 0;
      }
    } catch { /* tablas no existen */ }
    return { ventasHoy, ventasCountHoy, ticketPromedio, comprasHoy, ventasAnuladasHoy, ventasAnuladasCountHoy };
  }
  async getDteSummary(userId?: number) {
    try {
      const sf = sucursalFilter();
      const sucursalJoin = sf.idsucursal ? 'JOIN venta v ON sf.idventa = v.idventa' : '';
      const sucursalWhere = sf.idsucursal ? 'AND v.idsucursal = :idsucursal' : '';
      if (userId && !sf.idsucursal) return { activas: 0, anuladas: 0, total: 0, impuesto: 0 };
      const [row]: any[] = await sequelize.query(
        `SELECT
          (SELECT COUNT(*) FROM sat_facturas sf ${sucursalJoin} WHERE sf.estado = 1 AND MONTH(sf.fecha_certificacion) = MONTH(NOW()) AND YEAR(sf.fecha_certificacion) = YEAR(NOW()) ${sucursalWhere}) as total_anuladas,
          COUNT(*) as cantidad_activas,
          IFNULL(SUM(sf.total),0) as total,
          IFNULL(SUM(sf.impuesto),0) as total_impuesto
        FROM sat_facturas sf
        ${sucursalJoin}
        WHERE sf.estado = 0
          AND MONTH(sf.fecha_certificacion) = MONTH(NOW())
          AND YEAR(sf.fecha_certificacion) = YEAR(NOW()) ${sucursalWhere}`,
        { type: QueryTypes.SELECT, replacements: { idsucursal: sf.idsucursal } }
      );
      return {
        activas: (row as any)?.cantidad_activas || 0,
        anuladas: (row as any)?.total_anuladas || 0,
        total: parseFloat((row as any)?.total) || 0,
        impuesto: parseFloat((row as any)?.total_impuesto) || 0
      };
    } catch { return { activas: 0, anuladas: 0, total: 0, impuesto: 0 }; }
  }
  async getCatalog() {
    let clientes = 0, proveedores = 0, articulos = 0;
    let stockBajo: any[] = [];
    try {
      const sf = sucursalFilter();
      const cf = comercioFilter();
      const comercioCond = cf.idcomercio ? 'AND idcomercio = :idcomercio' : '';
      const [cli]: any[] = await sequelize.query(
        `SELECT COUNT(*) as total FROM persona WHERE tipo_persona = 'Cliente' ${comercioCond}`, 
        { type: QueryTypes.SELECT, replacements: { idcomercio: cf.idcomercio } }
      );
      clientes = cli?.total || 0;
      const [prov]: any[] = await sequelize.query(
        `SELECT COUNT(*) as total FROM persona WHERE tipo_persona = 'Proveedor' ${comercioCond}`,
        { type: QueryTypes.SELECT, replacements: { idcomercio: cf.idcomercio } }
      );
      proveedores = prov?.total || 0;
      const [art]: any[] = await sequelize.query(
        `SELECT COUNT(*) as total FROM articulo WHERE 1=1 ${comercioCond}`,
        { type: QueryTypes.SELECT, replacements: { idcomercio: cf.idcomercio } }
      );
      articulos = art?.total || 0;
      const sucursalCond = sf.idsucursal ? 'AND ars.idsucursal = :idsucursal' : '';
      stockBajo = await sequelize.query(
        `SELECT a.idarticulo, a.nombre, a.codigo, ars.stock
         FROM articulo_sucursal ars
         JOIN articulo a ON ars.idarticulo = a.idarticulo
         WHERE ars.stock <= 5 ${sucursalCond} ORDER BY ars.stock ASC LIMIT 10`,
        { type: QueryTypes.SELECT, replacements: { idsucursal: sf.idsucursal } }
      );
    } catch { /* tablas no existen */ }
    return { clientes, proveedores, articulos, stockBajo };
  }
  async getTrends(userId?: number) {
    let ventasMeses: any[] = [];
    let productosTop: any[] = [];
    let ventasRecientes: any[] = [];
    try {
      const sf = sucursalFilter();
      const userFilterSales = userId ? 'AND v.idusuario = :userId' : '';
      const userFilter = userId ? 'AND idusuario = :userId' : '';
      const sucursalFilterV = sf.idsucursal ? 'AND v.idsucursal = :idsucursal' : '';
      const sucursalFilterW = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
      ventasMeses = await sequelize.query(
        `SELECT DATE_FORMAT(v.fecha_hora,'%Y-%m') as mes, SUM(v.total_venta) as total, COUNT(*) as cantidad
         FROM venta v WHERE v.estado = 'Aceptado' ${userFilterSales} ${sucursalFilterV}
         GROUP BY DATE_FORMAT(v.fecha_hora,'%Y-%m')
         ORDER BY mes DESC LIMIT 12`,
        { type: QueryTypes.SELECT, replacements: { userId, idsucursal: sf.idsucursal } }
      );
      productosTop = await sequelize.query(
        `SELECT a.nombre, a.codigo, SUM(dv.cantidad) as vendidos,
                SUM(dv.cantidad * dv.precio_venta - IFNULL(dv.descuento,0)) as total_vendido
         FROM detalle_venta dv
         JOIN venta v ON dv.idventa = v.idventa
         JOIN articulo a ON dv.idarticulo = a.idarticulo
         WHERE v.estado = 'Aceptado' AND DATE(v.fecha_hora) = CURDATE() ${userFilter} ${sucursalFilterV}
         GROUP BY dv.idarticulo, a.nombre, a.codigo
         ORDER BY vendidos DESC LIMIT 5`,
        { type: QueryTypes.SELECT, replacements: { userId, idsucursal: sf.idsucursal } }
      );
      ventasRecientes = await sequelize.query(
        `SELECT v.idventa, v.serie_comprobante, v.num_comprobante, v.tipo_comprobante,
                v.total_venta, v.fecha_hora, p.nombre as cliente
         FROM venta v
         LEFT JOIN persona p ON v.idcliente = p.idpersona
         WHERE v.estado = 'Aceptado' ${userFilter} ${sucursalFilterV}
         ORDER BY v.fecha_hora DESC LIMIT 5`,
        { type: QueryTypes.SELECT, replacements: { userId, idsucursal: sf.idsucursal } }
      );
    } catch { /* tablas no existen */ }
    // Ventas agrupadas por tipo de comprobante
    let salesByType: any[] = [];
    let comprasMes = 0;
    try {
      const sf = sucursalFilter();
      const userFilter = userId ? 'AND idusuario = :userId' : '';
      const sucursalFilterW = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
      salesByType = await sequelize.query(
        `SELECT tipo_comprobante, COUNT(*) as cantidad, SUM(total_venta) as total
         FROM venta WHERE estado = 'Aceptado'
           AND MONTH(fecha_hora) = MONTH(NOW())
           AND YEAR(fecha_hora) = YEAR(NOW()) ${userFilter} ${sucursalFilterW}
         GROUP BY tipo_comprobante`,
        { type: QueryTypes.SELECT, replacements: { userId, idsucursal: sf.idsucursal } }
      );
      // Total de compras del mes (costo)
      const sucursalFilterI = sf.idsucursal ? 'AND idsucursal = :idsucursal' : '';
      const [row]: any[] = await sequelize.query(
        `SELECT IFNULL(SUM(total_compra),0) as total
         FROM ingreso WHERE estado = 'Aceptado'
           AND MONTH(fecha_hora) = MONTH(NOW())
           AND YEAR(fecha_hora) = YEAR(NOW()) ${sucursalFilterI}`,
        { type: QueryTypes.SELECT, replacements: { idsucursal: sf.idsucursal } }
      );
      comprasMes = parseFloat(row?.total) || 0;
    } catch { /* */ }
    // Ventas del mes actual
    const ventasMes = ventasMeses.length > 0 ? parseFloat(ventasMeses[0]?.total) || 0 : 0;
    const gananciaMes = ventasMes - comprasMes;
    return { ventasMeses, productosTop, ventasRecientes, salesByType, comprasMes, gananciaMes };
  }
  private async checkTables(): Promise<Record<string, boolean>> {
    try {
      const tables: any[] = await sequelize.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'pos_db'}'`,
        { type: QueryTypes.SELECT }
      );
      const names = tables.map((t: any) => t.TABLE_NAME);
      return {
        venta: names.includes('venta'),
        ingreso: names.includes('ingreso'),
        sat_facturas: names.includes('sat_facturas'),
        persona: names.includes('persona'),
        articulo: names.includes('articulo'),
        COMPRASVSVENTAS: names.includes('COMPRASVSVENTAS')
      };
    } catch {
      return { venta: false, ingreso: false, sat_facturas: false, persona: false, articulo: false, COMPRASVSVENTAS: false };
    }
  }
}
