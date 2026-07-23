import { ApplicationException } from '../common/errors/application.exception';
import { Person } from '../models';
import { IPersonDto } from '../dtos/IPerson';
import { comercioFilter, getComercioId } from '../common/request-context';
export class PersonService {
  async getAll(tipo: 'Cliente' | 'Proveedor') {
    try {
      return await Person.findAll({ where: { ...comercioFilter(), tipo_persona: tipo } });
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async getById(id: number) {
    try {
      const row = await Person.findOne({ where: { idpersona: id, ...comercioFilter() } });
      if (!row) throw new ApplicationException('Persona no encontrada', 404);
      return row;
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async create(data: IPersonDto) {
    try {
      const payload = { idcomercio: getComercioId(), ...data };
      return await Person.create(payload as any);
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async update(id: number, data: IPersonDto) {
    try {
      const row = await Person.findOne({ where: { idpersona: id, ...comercioFilter() } });
      if (!row) throw new ApplicationException('Persona no encontrada', 404);
      await row.update(data);
      return row;
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async delete(id: number) {
    try {
      const row = await Person.findOne({ where: { idpersona: id, ...comercioFilter() } });
      if (!row) throw new ApplicationException('Persona no encontrada', 404);
      await row.destroy();
      return { ok: true };
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
}
