import { Op } from 'sequelize';
import { BitacoraLog } from '../models/BitacoraLog';
import { sucursalFilter } from '../common/request-context';
export class AuditService {
  /**
   * Registra una acción en la bitácora (fire-and-forget, no await necesario)
   */
  log(usuario: string | null, accion: string, tabla?: string, registro_id?: number, detalle?: string, ip?: string): void {
    BitacoraLog.create({ usuario, accion, tabla, registro_id, detalle, ip })
      .catch(err => console.error('[Audit] Error al registrar:', err));
  }
  /**
   * Versión estática para usar sin DI
   */
  static registrar(usuario: string | null, accion: string, tabla?: string, registro_id?: number, detalle?: string, ip?: string): void {
    BitacoraLog.create({ usuario, accion, tabla, registro_id, detalle, ip })
      .catch(err => console.error('[Audit] Error al registrar:', err));
  }
  async getAll(page: number = 1, pageSize: number = 50, tabla?: string, from?: string, to?: string) {
    const where: any = { ...sucursalFilter() };
    if (tabla) where.tabla = tabla;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) where.createdAt[Op.lte] = new Date(to + 'T23:59:59');
    }
    const offset = (page - 1) * pageSize;
    const { rows, count } = await BitacoraLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset,
    });
    return { rows, total: count, page, pageSize };
  }
  async getTables(): Promise<string[]> {
    const rows = await BitacoraLog.findAll({
      attributes: [[BitacoraLog.sequelize!.fn('DISTINCT', BitacoraLog.sequelize!.col('tabla')), 'tabla']],
      where: { ...sucursalFilter(), tabla: { [Op.ne]: null } },
      order: [['tabla', 'ASC']],
    });
    return rows.map((r: any) => r.tabla).filter(Boolean);
  }
}
