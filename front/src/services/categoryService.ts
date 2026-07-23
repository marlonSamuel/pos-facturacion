import api from '../api/axios';
import type { ICategory } from '../interfaces/ICategory';

export const categoryService = {
  async getAll() {
    const r = await api.get<ICategory[]>('/categories');
    return r.data;
  },

  async create(data: Partial<ICategory>) {
    const r = await api.post<ICategory>('/categories', data);
    return r.data;
  },

  async update(id: number, data: Partial<ICategory>) {
    const r = await api.put<ICategory>(`/categories/${id}`, data);
    return r.data;
  },

  async remove(id: number) {
    const r = await api.delete<{ ok: boolean }>(`/categories/${id}`);
    return r.data;
  }
};
