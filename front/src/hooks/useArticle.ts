import { useState } from 'react';
import { articleService } from '../services/articleService';
import { notificationMessage } from '../helpers/shared';
import type { IArticle } from '../interfaces/IArticle';

export const useArticle = () => {
  const [items, setItems] = useState<IArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getAll = async () => {
    setLoading(true);
    try {
      const data = await articleService.getAll();
      setItems(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const getAllPaginated = async (p: number = 1, ps: number = 10, all?: boolean) => {
    setLoading(true);
    setPage(p);
    setPageSize(ps);
    try {
      const data = await articleService.getAllPaginated(p, ps, all);
      setItems(data.rows);
      setTotal(data.total);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const create = async (data: FormData) => {
    try {
      await articleService.create(data);
      notificationMessage('success', 'Artículo creado');
      await getAllPaginated();
      return true;
    } catch (e: any) {
      notificationMessage('error', 'Error', e?.message || 'Error al crear');
      return false;
    }
  };

  const update = async (id: number, data: FormData) => {
    try {
      await articleService.update(id, data);
      notificationMessage('success', 'Artículo actualizado');
      await getAllPaginated();
      return true;
    } catch (e: any) {
      notificationMessage('error', 'Error', e?.message || 'Error al actualizar');
      return false;
    }
  };

  const remove = async (id: number) => {
    try {
      await articleService.remove(id);
      notificationMessage('success', 'Artículo eliminado');
      await getAllPaginated();
      return true;
    } catch (e: any) {
      notificationMessage('error', 'Error', e?.message || 'Error al eliminar');
      return false;
    }
  };

  return { items, loading, total, page, pageSize, getAll, getAllPaginated, create, update, remove };
};
