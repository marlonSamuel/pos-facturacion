import api from '../api/axios';
import type { IRol, IRolDto } from '../interfaces/IRol';

export const roleService = {
  async getAll() {
    const r = await api.get<IRol[]>('/roles');
    return r.data;
  },

  async getById(id: number) {
    const r = await api.get<IRol>(`/roles/${id}`);
    return r.data;
  },

  async create(data: IRolDto) {
    const r = await api.post<IRol>('/roles', data);
    return r.data;
  },

  async update(id: number, data: IRolDto) {
    const r = await api.put<IRol>(`/roles/${id}`, data);
    return r.data;
  },

  async remove(id: number) {
    const r = await api.delete<{ ok: boolean }>(`/roles/${id}`);
    return r.data;
  }
};
