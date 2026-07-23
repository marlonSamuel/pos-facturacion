import api from '../api/axios';
import type { IArticle } from '../interfaces/IArticle';

export const articleService = {
  async getAll() {
    const r = await api.get<IArticle[]>('/articles/all');
    return r.data;
  },

  async getAllPaginated(page: number = 1, pageSize: number = 10, all?: boolean) {
    const r = await api.get<{ rows: IArticle[]; total: number; page: number; pageSize: number; totalPages: number }>('/articles/paginated', { params: { page, pageSize, all } });
    return r.data;
  },

  async create(data: FormData) {
    const r = await api.post<IArticle>('/articles', data);
    return r.data;
  },

  async update(id: number, data: FormData) {
    const r = await api.put<IArticle>(`/articles/${id}`, data);
    return r.data;
  },

  async remove(id: number) {
    const r = await api.delete<{ ok: boolean }>(`/articles/${id}`);
    return r.data;
  },

  async search(q: string, limit = 20, offset = 0, categoryId?: number) {
    const params: any = { q, limit, offset };
    if (categoryId) params.categoryId = categoryId;
    const r = await api.get<{ rows: IArticle[]; total: number; limit: number; offset: number }>('/articles/search', { params });
    return r.data;
  },

  async getLastPurchasePrice(id: number) {
    const r = await api.get<{ precio_compra: number | null; precio_venta: number | null }>(
      `/articles/${id}/last-purchase-price`
    );
    return r.data;
  }
};
