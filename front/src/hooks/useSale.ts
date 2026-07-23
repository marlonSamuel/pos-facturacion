import { useState } from 'react';
import { saleService } from '../services/saleService';
import { notificationMessage } from '../helpers/shared';
import type { IVenta } from '../interfaces/ISale';

export const useSale = () => {
  const [items, setItems] = useState<IVenta[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<IVenta | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<string>('Todas');

  const getAll = async () => {
    setLoading(true);
    try {
      const data = await saleService.getAll();
      setItems(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const getAllPaginated = async (p: number = 1, ps: number = 10, estado?: string) => {
    setLoading(true);
    setPage(p);
    setPageSize(ps);
    try {
      const data = await saleService.getAllPaginated(p, ps, estado);
      setItems(data.rows);
      setTotal(data.total);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const getById = async (id: number) => {
    setDetailLoading(true);
    try {
      const data = await saleService.getById(id);
      setSelected(data);
      return data;
    } catch { return null; }
    finally { setDetailLoading(false); }
  };

  const create = async (data: any) => {
    try {
      const result = await saleService.create(data);
      notificationMessage('success', 'Venta registrada');
      await getAllPaginated();
      return result;
    } catch (e: any) {
      notificationMessage('error', 'Error', e?.response?.data?.message || e?.message || 'Error al registrar');
      return null;
    }
  };

  const cancel = async (id: number, motivo?: string) => {
    try {
      await saleService.cancel(id, motivo);
      notificationMessage('success', 'Venta anulada');
      await getAllPaginated();
      return true;
    } catch (e: any) {
      notificationMessage('error', 'Error', e?.response?.data?.message || e?.message || 'Error al anular');
      return false;
    }
  };

  return { items, loading, total, page, pageSize, selected, detailLoading, getAll, getAllPaginated, getById, create, cancel, setSelected, estadoFilter, setEstadoFilter };
};
