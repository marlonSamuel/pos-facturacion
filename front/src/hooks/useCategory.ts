import { useState } from 'react';
import { categoryService } from '../services/categoryService';
import { notificationMessage } from '../helpers/shared';
import type { ICategory } from '../interfaces/ICategory';

export const useCategory = () => {
  const [items, setItems] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(false);

  const getAll = async () => {
    setLoading(true);
    try {
      const data = await categoryService.getAll();
      setItems(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const create = async (data: Partial<ICategory>) => {
    try {
      await categoryService.create(data);
      notificationMessage('success', 'Categoría creada');
      await getAll();
      return true;
    } catch (e: any) {
      notificationMessage('error', 'Error', e?.message || 'Error al crear');
      return false;
    }
  };

  const update = async (id: number, data: Partial<ICategory>) => {
    try {
      await categoryService.update(id, data);
      notificationMessage('success', 'Categoría actualizada');
      await getAll();
      return true;
    } catch (e: any) {
      notificationMessage('error', 'Error', e?.message || 'Error al actualizar');
      return false;
    }
  };

  const remove = async (id: number) => {
    try {
      await categoryService.remove(id);
      notificationMessage('success', 'Categoría eliminada');
      await getAll();
      return true;
    } catch (e: any) {
      notificationMessage('error', 'Error', e?.message || 'Error al eliminar');
      return false;
    }
  };

  return { items, loading, getAll, create, update, remove };
};
