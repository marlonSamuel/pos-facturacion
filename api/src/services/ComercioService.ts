import { ApplicationException } from '../common/errors/application.exception';
import { Comercio } from '../models';
import type { IComercioDto } from '../dtos/IComercio';
export class ComercioService {
  async getAll(): Promise<IComercioDto[]> {
    try {
      const rows = await Comercio.findAll({ order: [['nombre', 'ASC']] });
      return rows.map(r => this.mapToResponse(r));
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async getById(id: number): Promise<IComercioDto> {
    try {
      const row = await Comercio.findByPk(id);
      if (!row) throw new ApplicationException('Comercio no encontrado', 404);
      return this.mapToResponse(row);
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async create(data: Partial<IComercioDto>): Promise<IComercioDto> {
    try {
      const row = await Comercio.create(data as any);
      return this.mapToResponse(row);
    } catch (error: any) {
      if (error?.name === 'SequelizeUniqueConstraintError') {
        throw new ApplicationException('El nickname ya está en uso', 400);
      }
      throw new ApplicationException(error.message);
    }
  }
  async update(id: number, data: Partial<IComercioDto>): Promise<IComercioDto> {
    try {
      const row = await Comercio.findByPk(id);
      if (!row) throw new ApplicationException('Comercio no encontrado', 404);
      await row.update(data as any);
      return this.mapToResponse(row);
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      if (error?.name === 'SequelizeUniqueConstraintError') {
        throw new ApplicationException('El nickname ya está en uso', 400);
      }
      throw new ApplicationException(error.message);
    }
  }
  async delete(id: number): Promise<{ ok: boolean }> {
    try {
      const row = await Comercio.findByPk(id);
      if (!row) throw new ApplicationException('Comercio no encontrado', 404);
      await row.update({ condicion: 0 });
      return { ok: true };
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  private mapToResponse(row: any): IComercioDto {
    const d = row.get ? row.get() : row;
    return {
      idcomercio: d.idcomercio,
      nombre: d.nombre,
      nickname: d.nickname,
      descripcion: d.descripcion || undefined,
      direccion: d.direccion || undefined,
      telefono: d.telefono || undefined,
      email: d.email || undefined,
      logo: d.logo || undefined,
      color_primario: d.color_primario || '#1890ff',
      condicion: d.condicion,
    };
  }
}
