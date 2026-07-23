import { ApplicationException } from '../common/errors/application.exception';
import { ArticuloSucursal, Articulo, Categoria } from '../models';
import { sequelize } from '../common/database/mysql';
import { getSucursalId, sucursalFilter } from '../common/request-context';
import { Op } from 'sequelize';
export class InventoryService {
  /**
   * Obtiene el stock de un artículo en una sucursal específica.
   * Si no existe registro, retorna 0.
   */
  async getStock(articuloId: number, sucursalId?: number): Promise<number> {
    const sucId = sucursalId ?? getSucursalId();
    if (!sucId) return 0;
    const row = await ArticuloSucursal.findOne({
      where: { idarticulo: articuloId, idsucursal: sucId }
    });
    if (!row) return 0;
    return (row.get() as any).stock || 0;
  }
  /**
   * Obtiene el stock de un artículo en TODAS las sucursales del comercio.
   */
  async getStockAllSucursales(articuloId: number): Promise<{ idsucursal: number; stock: number }[]> {
    const rows = await ArticuloSucursal.findAll({
      where: { idarticulo: articuloId },
      attributes: ['idsucursal', 'stock']
    });
    return rows.map((r: any) => ({ idsucursal: r.idsucursal, stock: r.stock }));
  }
  /**
   * Asigna stock inicial a un artículo en una sucursal (crea registro si no existe).
   */
  async setStock(articuloId: number, cantidad: number, sucursalId?: number): Promise<void> {
    const sucId = sucursalId ?? getSucursalId();
    if (!sucId) throw new ApplicationException('Sucursal no seleccionada');
    const [row] = await ArticuloSucursal.findOrCreate({
      where: { idarticulo: articuloId, idsucursal: sucId },
      defaults: { idarticulo: articuloId, idsucursal: sucId, stock: cantidad }
    });
    await row.update({ stock: cantidad });
  }
  /**
   * Incrementa stock (compra)
   */
  async incrementStock(articuloId: number, cantidad: number, sucursalId?: number): Promise<void> {
    if (cantidad <= 0) return;
    const sucId = sucursalId ?? getSucursalId();
    if (!sucId) throw new ApplicationException('Sucursal no seleccionada');
    await ArticuloSucursal.upsert({
      idarticulo: articuloId,
      idsucursal: sucId,
      stock: sequelize.literal(`COALESCE((SELECT stock FROM articulo_sucursal WHERE idarticulo = ${articuloId} AND idsucursal = ${sucId}), 0) + ${cantidad}`)
    } as any);
  }
  /**
   * Decrementa stock (venta)
   */
  async decrementStock(articuloId: number, cantidad: number, sucursalId?: number): Promise<void> {
    if (cantidad <= 0) return;
    const sucId = sucursalId ?? getSucursalId();
    if (!sucId) throw new ApplicationException('Sucursal no seleccionada');
    const row = await ArticuloSucursal.findOne({
      where: { idarticulo: articuloId, idsucursal: sucId }
    });
    if (!row) throw new ApplicationException('Artículo sin registro de stock en esta sucursal');
    const current = (row.get() as any).stock || 0;
    if (current < cantidad) {
      throw new ApplicationException(`Stock insuficiente: disponible ${current}, requerido ${cantidad}`);
    }
    await row.update({ stock: current - cantidad });
  }
  /**
   * Devuelve artículos con stock bajo en la sucursal activa
   */
  async getLowStock(threshold: number = 5): Promise<any[]> {
    const sf = sucursalFilter();
    const sucursalCond = sf.idsucursal ? 'AND ars.idsucursal = :idsucursal' : '';
    return await sequelize.query(
      `SELECT a.idarticulo, a.codigo, a.nombre, ars.stock
       FROM articulo_sucursal ars
       JOIN articulo a ON ars.idarticulo = a.idarticulo
       WHERE ars.stock <= :threshold ${sucursalCond}
       ORDER BY ars.stock ASC LIMIT 10`,
      { replacements: { threshold, idsucursal: sf.idsucursal }, type: 'SELECT' }
    );
  }
  /**
   * Obtiene inventario completo con stock de la sucursal activa
   */
  async getInventory(categoria?: number, stockMin?: number): Promise<any[]> {
    const sf = sucursalFilter();
    let sql = `SELECT a.idarticulo, a.codigo, a.nombre, ars.stock, a.precio_venta,
                      c.nombre as categoria_nombre
               FROM articulo a
               LEFT JOIN articulo_sucursal ars ON a.idarticulo = ars.idarticulo AND ars.idsucursal = :idsucursal
               LEFT JOIN categoria c ON a.idcategoria = c.idcategoria
               WHERE a.condicion = 1`;
    const replacements: any = { idsucursal: sf.idsucursal || 1 };
    if (categoria) { sql += ' AND a.idcategoria = :categoria'; replacements.categoria = categoria; }
    if (stockMin !== undefined) { sql += ' AND ars.stock >= :stockMin'; replacements.stockMin = stockMin; }
    sql += ' ORDER BY a.nombre ASC';
    return await sequelize.query(sql, { replacements, type: 'SELECT' });
  }
  /**
   * Retorna el conteo total de artículos del comercio
   */
  async countArticles(): Promise<number> {
    const [row]: any[] = await sequelize.query(
      `SELECT COUNT(*) as total FROM articulo`,
      { type: 'SELECT' }
    );
    return row?.total || 0;
  }
}
