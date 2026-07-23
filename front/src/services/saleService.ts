import api from '../api/axios';
import type { IVenta } from '../interfaces/ISale';

export const saleService = {
  async getAll() {
    const r = await api.get<IVenta[]>('/sales');
    return r.data;
  },

  async getAllPaginated(page: number = 1, pageSize: number = 10, estado?: string) {
    const params: any = { page, pageSize };
    if (estado && estado !== 'Todas') params.estado = estado;
    const r = await api.get<{ rows: IVenta[]; total: number; page: number; pageSize: number; totalPages: number }>('/sales/paginated', { params });
    return r.data;
  },

  async getById(id: number) {
    const r = await api.get<IVenta>(`/sales/${id}`);
    return r.data;
  },

  async create(data: any) {
    const r = await api.post<{ ok: boolean; idventa: number; serie?: string; num?: string; html?: string; autorizacion?: string }>('/sales', data);
    return r.data;
  },

  async cancel(id: number, motivo?: string) {
    const r = await api.put<{ ok: boolean }>(`/sales/${id}/cancel`, { motivo_anulacion: motivo });
    return r.data;
  }
};
