import { ApplicationException } from '../common/errors/application.exception';
import { Categoria, Articulo } from '../models';
import { ICategoriaDto } from '../dtos/ICategoria';
import { sequelize } from '../common/database/mysql';
import { QueryTypes } from 'sequelize';
import { comercioFilter, getComercioId } from '../common/request-context';
export class CategoryService {
  async getAll() {
    try {
      return await Categoria.findAll({ where: { ...comercioFilter(), condicion: 1 } });
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async getAllIncludingInactive() {
    try {
      return await Categoria.findAll({ where: { ...comercioFilter() } });
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async getById(id: number) {
    try {
      const row = await Categoria.findOne({ where: { idcategoria: id, ...comercioFilter() } });
      if (!row) throw new ApplicationException('Categoría no encontrada', 404);
      return row;
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async create(data: ICategoriaDto) {
    try {
      const payload = { idcomercio: getComercioId(), ...data };
      return await Categoria.create(payload as any);
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async update(id: number, data: ICategoriaDto) {
    try {
      const row = await Categoria.findOne({ where: { idcategoria: id, ...comercioFilter() } });
      if (!row) throw new ApplicationException('Categoría no encontrada', 404);
      await row.update(data);
      return row;
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async delete(id: number) {
    try {
      const row = await Categoria.findOne({ where: { idcategoria: id, ...comercioFilter() } });
      if (!row) throw new ApplicationException('Categoría no encontrada', 404);
      // Verificar si tiene artículos asociados
      const count = await Articulo.count({ where: { idcategoria: id, ...comercioFilter() } });
      if (count > 0) {
        throw new ApplicationException(`No se puede eliminar: ${count} artículo(s) dependen de esta categoría`);
      }
      await row.destroy();
      return { ok: true };
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
}
