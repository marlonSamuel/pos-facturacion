import api from '../api/axios';
import type { IPerson } from '../interfaces/IPerson';

export const personService = {
  async getAll(tipo: 'Cliente' | 'Proveedor') {
    const endpoint = tipo === 'Cliente' ? '/persons/clients' : '/persons/providers';
    const r = await api.get<IPerson[]>(endpoint);
    return r.data;
  },

  async create(data: Partial<IPerson>) {
    const r = await api.post<IPerson>('/persons', data);
    return r.data;
  },

  async update(id: number, data: Partial<IPerson>) {
    const r = await api.put<IPerson>(`/persons/${id}`, data);
    return r.data;
  },

  async remove(id: number) {
    const r = await api.delete<{ ok: boolean }>(`/persons/${id}`);
    return r.data;
  }
};
