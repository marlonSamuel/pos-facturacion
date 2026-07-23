import { ApplicationException } from '../common/errors/application.exception';
import { Rol, RolPermiso, Permiso, Usuario } from '../models';
import type { IRolDto, IRolResponse } from '../dtos/IRol';
import { sequelize } from '../common/database/mysql';
export class RolService {
  async getAll(): Promise<IRolResponse[]> {
    try {
      const roles = await Rol.findAll({
        include: [{
          model: RolPermiso, as: 'rolPermisos',
          attributes: ['idpermiso'],
        }],
        order: [['nombre', 'ASC']],
      });
      return roles.map(r => this.mapToResponse(r));
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async getById(id: number): Promise<IRolResponse> {
    try {
      const row = await Rol.findByPk(id, {
        include: [{
          model: RolPermiso, as: 'rolPermisos',
          attributes: ['idpermiso'],
        }],
      });
      if (!row) throw new ApplicationException('Rol no encontrado', 404);
      return this.mapToResponse(row as any);
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async create(data: IRolDto): Promise<IRolResponse> {
    const transaction = await sequelize.transaction();
    try {
      const rol = await Rol.create({ nombre: data.nombre, descripcion: data.descripcion || null } as any, { transaction });
      const rolId = (rol as any).idrol;
      if (data.permisos && data.permisos.length > 0) {
        await RolPermiso.bulkCreate(
          data.permisos.map(idpermiso => ({ idrol: rolId, idpermiso })),
          { transaction }
        );
      }
      await transaction.commit();
      return await this.getById(rolId);
    } catch (error: any) {
      await transaction.rollback();
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async update(id: number, data: IRolDto): Promise<IRolResponse> {
    const transaction = await sequelize.transaction();
    try {
      const row = await Rol.findByPk(id, { transaction });
      if (!row) throw new ApplicationException('Rol no encontrado', 404);
      await row.update({ nombre: data.nombre, descripcion: data.descripcion || null }, { transaction });
      // Reemplazar permisos: borrar viejos, insertar nuevos
      await RolPermiso.destroy({ where: { idrol: id }, transaction });
      if (data.permisos && data.permisos.length > 0) {
        await RolPermiso.bulkCreate(
          data.permisos.map(idpermiso => ({ idrol: id, idpermiso })),
          { transaction }
        );
      }
      await transaction.commit();
      return await this.getById(id);
    } catch (error: any) {
      await transaction.rollback();
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async delete(id: number): Promise<{ ok: boolean }> {
    const transaction = await sequelize.transaction();
    try {
      const row = await Rol.findByPk(id, { transaction });
      if (!row) throw new ApplicationException('Rol no encontrado', 404);
      // Verificar si hay usuarios usando este rol
      const userCount = await Usuario.count({ where: { idrol: id }, transaction });
      if (userCount > 0) {
        throw new ApplicationException(`No se puede eliminar: ${userCount} usuario(s) tienen este rol asignado`);
      }
      await RolPermiso.destroy({ where: { idrol: id }, transaction });
      await row.destroy({ transaction });
      await transaction.commit();
      return { ok: true };
    } catch (error: any) {
      await transaction.rollback();
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  private mapToResponse(row: any): IRolResponse {
    const d = row.get ? row.get() : row;
    return {
      idrol: d.idrol,
      nombre: d.nombre,
      descripcion: d.descripcion || null,
      permisos: [...new Set<number>((d.rolPermisos || []).map((rp: any) => rp.idpermiso))],
    };
  }
}
