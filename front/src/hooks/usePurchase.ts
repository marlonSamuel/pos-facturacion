import { useState } from 'react';
import { purchaseService } from '../services/purchaseService';
import { notificationMessage } from '../helpers/shared';
import type { IPurchase } from '../interfaces/IPurchase';

export const usePurchase = () => {
  const [items, setItems] = useState<IPurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<IPurchase | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<string>('Todas');

  const getAll = async () => {
    setLoading(true);
    try {
      const data = await purchaseService.getAll();
      setItems(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const getAllPaginated = async (p: number = 1, ps: number = 10, estado?: string) => {
    setLoading(true);
    setPage(p);
    setPageSize(ps);
    try {
      const data = await purchaseService.getAllPaginated(p, ps, estado);
      setItems(data.rows);
      setTotal(data.total);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const getById = async (id: number) => {
    setDetailLoading(true);
    try {
      const data = await purchaseService.getById(id);
      setSelected(data);
      return data;
    } catch { return null; }
    finally { setDetailLoading(false); }
  };

  const create = async (data: any) => {
    try {
      await purchaseService.create(data);
      notificationMessage('success', 'Compra registrada');
      await getAllPaginated();
      return true;
    } catch (e: any) {
      notificationMessage('error', 'Error', e?.response?.data?.message || e?.message || 'Error al registrar');
      return false;
    }
  };

  const cancel = async (id: number, motivo?: string) => {
    try {
      await purchaseService.cancel(id, motivo);
      notificationMessage('success', 'Compra anulada');
      await getAllPaginated();
      return true;
    } catch (e: any) {
      notificationMessage('error', 'Error', e?.response?.data?.message || e?.message || 'Error al anular');
      return false;
    }
  };

  return { items, loading, total, page, pageSize, selected, detailLoading, getAll, getAllPaginated, getById, create, cancel, setSelected, estadoFilter, setEstadoFilter };
};
