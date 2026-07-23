import api from '../api/axios';
import type { IUser, IPermission } from '../interfaces/IUser';
import type { IRol } from '../interfaces/IRol';

export const userService = {
  async getAll() {
    const r = await api.get<IUser[]>('/users');
    return r.data;
  },

  async getById(id: number) {
    const r = await api.get<IUser>(`/users/${id}`);
    return r.data;
  },

  async create(data: FormData) {
    const r = await api.post<IUser>('/users', data);
    return r.data;
  },

  async update(id: number, data: FormData) {
    const r = await api.put<IUser>(`/users/${id}`, data);
    return r.data;
  },

  async toggleStatus(id: number) {
    const r = await api.put<{ ok: boolean; condicion: number }>(`/users/${id}/toggle-status`);
    return r.data;
  },

  async changePassword(idusuario: number, clave_actual: string, clave_nueva: string) {
    const r = await api.put<{ ok: boolean }>('/users/change-password', { idusuario, clave_actual, clave_nueva });
    return r.data;
  },

  async getPermissions() {
    const r = await api.get<IPermission[]>('/permissions');
    return r.data;
  },

  async getRoles() {
    const r = await api.get<IRol[]>('/roles');
    return r.data;
  }
};
