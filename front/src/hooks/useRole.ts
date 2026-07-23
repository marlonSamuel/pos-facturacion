import { useState } from 'react';
import { roleService } from '../services/roleService';
import { notificationMessage } from '../helpers/shared';
import type { IRol, IRolDto } from '../interfaces/IRol';

export const useRole = () => {
  const [items, setItems] = useState<IRol[]>([]);
  const [loading, setLoading] = useState(false);

  const getAll = async () => {
    setLoading(true);
    try {
      const data = await roleService.getAll();
      setItems(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const create = async (data: IRolDto) => {
    try {
      await roleService.create(data);
      notificationMessage('success', 'Rol creado');
      await getAll();
      return true;
    } catch (e: any) {
      notificationMessage('error', 'Error', e?.response?.data?.message || e?.message || 'Error al crear rol');
      return false;
    }
  };

  const update = async (id: number, data: IRolDto) => {
    try {
      await roleService.update(id, data);
      notificationMessage('success', 'Rol actualizado');
      await getAll();
      return true;
    } catch (e: any) {
      notificationMessage('error', 'Error', e?.response?.data?.message || e?.message || 'Error al actualizar rol');
      return false;
    }
  };

  const remove = async (id: number) => {
    try {
      await roleService.remove(id);
      notificationMessage('success', 'Rol eliminado');
      await getAll();
      return true;
    } catch (e: any) {
      notificationMessage('error', 'Error', e?.response?.data?.message || e?.message || 'Error al eliminar rol');
      return false;
    }
  };

  return { items, loading, getAll, create, update, remove };
};
