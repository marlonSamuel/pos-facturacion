import { ApplicationException } from '../common/errors/application.exception';
import { Sucursal, Comercio } from '../models';
import type { ISucursalDto } from '../dtos/IComercio';
export class SucursalService {
  async getAll(idcomercio: number): Promise<ISucursalDto[]> {
    try {
      const rows = await Sucursal.findAll({
        where: { idcomercio },
        order: [['nombre', 'ASC']],
      });
      return rows.map(r => this.mapToResponse(r));
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async getById(id: number): Promise<ISucursalDto> {
    try {
      const row = await Sucursal.findByPk(id);
      if (!row) throw new ApplicationException('Sucursal no encontrada', 404);
      return this.mapToResponse(row);
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async create(data: Partial<ISucursalDto>): Promise<ISucursalDto> {
    try {
      const comercio = await Comercio.findByPk(data.idcomercio);
      if (!comercio) throw new ApplicationException('Comercio no encontrado', 404);
      const row = await Sucursal.create(data as any);
      return this.mapToResponse(row);
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async update(id: number, data: Partial<ISucursalDto>): Promise<ISucursalDto> {
    try {
      const row = await Sucursal.findByPk(id);
      if (!row) throw new ApplicationException('Sucursal no encontrada', 404);
      await row.update(data as any);
      return this.mapToResponse(row);
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async delete(id: number): Promise<{ ok: boolean }> {
    try {
      const row = await Sucursal.findByPk(id);
      if (!row) throw new ApplicationException('Sucursal no encontrada', 404);
      await row.update({ condicion: 0 });
      return { ok: true };
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  private mapToResponse(row: any): ISucursalDto {
    const d = row.get ? row.get() : row;
    return {
      idsucursal: d.idsucursal,
      idcomercio: d.idcomercio,
      codigo: d.codigo || undefined,
      nombre: d.nombre,
      direccion: d.direccion || undefined,
      telefono: d.telefono || undefined,
      condicion: d.condicion,
      nit: d.nit || undefined,
      nombre_emisor: d.nombre_emisor || undefined,
      nombre_comercial: d.nombre_comercial || undefined,
      direccion_emisor: d.direccion_emisor || undefined,
      regimen: d.regimen || 'GEN',
    };
  }
}
