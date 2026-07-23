import api from '../api/axios';
import type { IPurchase } from '../interfaces/IPurchase';

export const purchaseService = {
  async getAll() {
    const r = await api.get<IPurchase[]>('/purchases');
    return r.data;
  },

  async getAllPaginated(page: number = 1, pageSize: number = 10, estado?: string) {
    const params: any = { page, pageSize };
    if (estado && estado !== 'Todas') params.estado = estado;
    const r = await api.get<{ rows: IPurchase[]; total: number; page: number; pageSize: number; totalPages: number }>('/purchases/paginated', { params });
    return r.data;
  },

  async getById(id: number) {
    const r = await api.get<IPurchase>(`/purchases/${id}`);
    return r.data;
  },

  async create(data: any) {
    const r = await api.post<IPurchase>('/purchases', data);
    return r.data;
  },

  async cancel(id: number, motivo?: string) {
    const r = await api.put<{ ok: boolean }>(`/purchases/${id}/cancel`, { motivo_anulacion: motivo });
    return r.data;
  }
};
