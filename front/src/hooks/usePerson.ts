import { useState } from 'react';
import { personService } from '../services/personService';
import { notificationMessage } from '../helpers/shared';
import type { IPerson } from '../interfaces/IPerson';

export const usePerson = (tipo: 'Cliente' | 'Proveedor') => {
  const [items, setItems] = useState<IPerson[]>([]);
  const [loading, setLoading] = useState(false);

  const getAll = async () => {
    setLoading(true);
    try {
      const data = await personService.getAll(tipo);
      setItems(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const create = async (data: Partial<IPerson>) => {
    try {
      await personService.create({ ...data, tipo_persona: tipo });
      notificationMessage('success', `${tipo} creado`);
      await getAll();
      return true;
    } catch (e: any) {
      notificationMessage('error', 'Error', e?.message);
      return false;
    }
  };

  const update = async (id: number, data: Partial<IPerson>) => {
    try {
      await personService.update(id, { ...data, tipo_persona: tipo });
      notificationMessage('success', `${tipo} actualizado`);
      await getAll();
      return true;
    } catch (e: any) {
      notificationMessage('error', 'Error', e?.message);
      return false;
    }
  };

  const remove = async (id: number) => {
    try {
      await personService.remove(id);
      notificationMessage('success', `${tipo} eliminado`);
      await getAll();
    } catch (e: any) {
      notificationMessage('error', 'Error', e?.message);
    }
  };

  return { items, loading, getAll, create, update, remove };
};
