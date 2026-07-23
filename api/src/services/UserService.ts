import { ApplicationException } from '../common/errors/application.exception';
import { Usuario, Permiso, Rol, RolPermiso, UsuarioSucursal, Sucursal } from '../models';
import { IUserDto, IUserResponse, IUpdateProfileDto } from '../dtos/IUser';
import { getComercioId } from '../common/request-context';
import bcrypt from 'bcryptjs';
import { sequelize } from '../common/database/mysql';
import fs from 'fs';
import path from 'path';
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads/users');
export class UserService {
  async getAll(): Promise<IUserResponse[]> {
    try {
      const idcomercio = getComercioId();
      const where = idcomercio ? { idcomercio } : {};
      const rows = await Usuario.findAll({
        where,
        include: [{
          model: Rol,
          as: 'rol',
          attributes: ['nombre', 'idrol'],
        }]
      });
      return Promise.all(rows.map(async (row: any) => {
        const result = this.mapToResponse(row);
        result.sucursales = await this.getUserSucursalesIds(result.idusuario);
        return result;
      }));
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async getById(id: number): Promise<IUserResponse> {
    try {
      const idcomercio = getComercioId();
      const where: any = { idusuario: id };
      if (idcomercio) where.idcomercio = idcomercio;
      const row = await Usuario.findOne({
        where,
        include: [{
          model: Rol,
          as: 'rol',
          attributes: ['nombre', 'idrol'],
        }]
      });
      if (!row) throw new ApplicationException('Usuario no encontrado', 404);
      const result = this.mapToResponse(row as any);
      result.sucursales = await this.getUserSucursalesIds(id);
      return result;
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async create(data: IUserDto): Promise<IUserResponse> {
    const transaction = await sequelize.transaction();
    try {
      // Verificar si el login ya existe
      const existing = await Usuario.findOne({ where: { login: data.login }, transaction });
      if (existing) {
        throw new ApplicationException('El nombre de usuario ya está en uso');
      }
      // Hash de contraseña
      const hashedPassword = bcrypt.hashSync(data.clave || '123456', 10);
      const idcomercio = getComercioId();
      const user = await Usuario.create({
        nombre: data.nombre,
        tipo_documento: data.tipo_documento,
        num_documento: data.num_documento,
        direccion: data.direccion || null,
        telefono: data.telefono || null,
        email: data.email || null,
        login: data.login,
        clave: hashedPassword,
        imagen: data.imagen || 'default.png',
        condicion: 1,
        idrol: data.idrol || null,
        idcomercio,
      } as any, { transaction });
      const userId = (user as any).idusuario;
      // Asignar sucursales seleccionadas
      const sucursales = data.sucursales || [];
      if (sucursales.length > 0) {
        for (const sucId of sucursales) {
          await UsuarioSucursal.findOrCreate({
            where: { idusuario: userId, idsucursal: sucId },
            transaction
          });
        }
      } else if (idcomercio) {
        // Fallback: asignar a todas las sucursales del comercio
        const todas = await Sucursal.findAll({
          where: { idcomercio, condicion: 1 },
          attributes: ['idsucursal'],
          transaction
        });
        for (const s of todas) {
          await UsuarioSucursal.findOrCreate({
            where: { idusuario: userId, idsucursal: (s as any).idsucursal },
            transaction
          });
        }
      }
      await transaction.commit();
      return await this.getById(userId);
    } catch (error: any) {
      await transaction.rollback();
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async update(id: number, data: IUserDto): Promise<IUserResponse> {
    const transaction = await sequelize.transaction();
    try {
      const row = await Usuario.findByPk(id, { transaction });
      if (!row) throw new ApplicationException('Usuario no encontrado', 404);
      // Verificar login único si se está cambiando
      if (data.login) {
        const existing = await Usuario.findOne({
          where: { login: data.login },
          transaction
        });
        if (existing && (existing as any).idusuario !== id) {
          throw new ApplicationException('El nombre de usuario ya está en uso');
        }
      }
      const payload: any = {
        nombre: data.nombre,
        tipo_documento: data.tipo_documento,
        num_documento: data.num_documento,
        direccion: data.direccion || null,
        telefono: data.telefono || null,
        email: data.email || null,
        idrol: data.idrol || null,
      };
      // Solo actualizar login si se envía
      if (data.login) {
        payload.login = data.login;
      }
      // Si se envía nueva contraseña, actualizarla
      if (data.clave) {
        payload.clave = bcrypt.hashSync(data.clave, 10);
      }
      // Solo actualizar imagen si se proporciona una nueva
      if (data.imagen) {
        // Eliminar imagen anterior si no es default
        const oldData = row.get() as any;
        if (oldData.imagen && oldData.imagen !== 'default.png') {
          const oldPath = path.join(UPLOADS_DIR, oldData.imagen);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        payload.imagen = data.imagen;
      }
      await Usuario.update(payload, { where: { idusuario: id }, transaction });
      // Sincronizar sucursales si se enviaron
      if (data.sucursales) {
        // Eliminar asignaciones actuales
        await UsuarioSucursal.destroy({ where: { idusuario: id }, transaction });
        // Crear nuevas
        for (const sucId of data.sucursales) {
          await UsuarioSucursal.create({ idusuario: id, idsucursal: sucId } as any, { transaction });
        }
      }
      await transaction.commit();
      return await this.getById(id);
    } catch (error: any) {
      await transaction.rollback();
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async toggleStatus(id: number, requestedByUserId: number): Promise<{ ok: boolean; condicion: number }> {
    try {
      if (id === requestedByUserId) {
        throw new ApplicationException('No puedes desactivarte a ti mismo', 403);
      }
      const row = await Usuario.findByPk(id);
      if (!row) throw new ApplicationException('Usuario no encontrado', 404);
      const newStatus = (row as any).condicion === 1 ? 0 : 1;
      await Usuario.update({ condicion: newStatus }, { where: { idusuario: id } });
      return { ok: true, condicion: newStatus };
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async updateProfile(id: number, data: IUpdateProfileDto, imagen?: string): Promise<IUserResponse> {
    try {
      const row = await Usuario.findByPk(id);
      if (!row) throw new ApplicationException('Usuario no encontrado', 404);
      const payload: any = {
        nombre: data.nombre,
        tipo_documento: data.tipo_documento,
        num_documento: data.num_documento,
        direccion: data.direccion || null,
        telefono: data.telefono || null,
      };
      if (imagen) {
        // Eliminar imagen anterior si no es default
        const oldData = row.get() as any;
        if (oldData.imagen && oldData.imagen !== 'default.png') {
          const oldPath = path.join(UPLOADS_DIR, oldData.imagen);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        payload.imagen = imagen;
      }
      await Usuario.update(payload, { where: { idusuario: id } });
      return await this.getById(id);
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async changePassword(id: number, currentPassword: string, newPassword: string): Promise<{ ok: boolean }> {
    try {
      const row = await Usuario.findByPk(id);
      if (!row) throw new ApplicationException('Usuario no encontrado', 404);
      const userData = row.get() as any;
      // Verificar contraseña actual (soporta bcrypt y SHA256 legacy)
      const isValid = await this.verifyPassword(currentPassword, userData.clave);
      if (!isValid) {
        throw new ApplicationException('La contraseña actual no es correcta', 401);
      }
      const newHash = bcrypt.hashSync(newPassword, 10);
      await Usuario.update({ clave: newHash }, { where: { idusuario: id } });
      return { ok: true };
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async getPermissionsByUser(id: number): Promise<number[]> {
    try {
      const user = await Usuario.findByPk(id, { attributes: ['idrol'] });
      if (!user || !(user as any).idrol) return [];
      const rows = await RolPermiso.findAll({
        where: { idrol: (user as any).idrol },
        attributes: ['idpermiso']
      });
      return rows.map((r: any) => r.idpermiso);
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  private async getUserSucursalesIds(userId: number): Promise<number[]> {
    const rows = await UsuarioSucursal.findAll({
      where: { idusuario: userId },
      attributes: ['idsucursal']
    });
    return rows.map((r: any) => r.idsucursal);
  }
  private mapToResponse(row: any): IUserResponse {
    const d = row.get ? row.get() : row;
    return {
      idusuario: d.idusuario,
      nombre: d.nombre,
      tipo_documento: d.tipo_documento,
      num_documento: d.num_documento,
      direccion: d.direccion || null,
      telefono: d.telefono || null,
      email: d.email || null,
      login: d.login,
      imagen: d.imagen || 'default.png',
      condicion: d.condicion,
      idrol: d.idrol || null,
      rol: d.rol?.nombre || null,
      permisos: [],
      sucursal: undefined,
      sucursales: [],
    };
  }
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const isBcrypt = await bcrypt.compare(password, hash);
      if (isBcrypt) return true;
    } catch {
      // No es bcrypt
    }
    if (/^[a-f0-9]{64}$/i.test(hash)) {
      const crypto = await import('crypto');
      const shaHash = crypto.createHash('sha256').update(password).digest('hex');
      return shaHash === hash;
    }
    return false;
  }
}
