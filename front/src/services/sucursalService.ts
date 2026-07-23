import api from '../api/axios';

export interface ISucursalInfo {
  idsucursal: number;
  nombre: string;
}

export const sucursalService = {
  async getAll() {
    const r = await api.get<ISucursalInfo[]>('/sucursales');
    return r.data;
  },
};
