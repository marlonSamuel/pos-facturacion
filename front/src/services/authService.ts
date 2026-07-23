import api from '../api/axios';
import type { IUser, IComercioPublicInfo } from '../interfaces/IAuth';

export interface ILoginResponse {
  ok: boolean;
  token?: string;
  refreshToken?: string;
  user?: IUser;
  message?: string;
}

export interface IRefreshResponse {
  ok: boolean;
  token?: string;
  refreshToken?: string;
  message?: string;
}

export const authService = {
  async login(username: string, password: string) {
    const r = await api.post<ILoginResponse>('/auth/login', { username, password });
    return r.data;
  },

  async verifyToken() {
    const r = await api.get<IUser>('/auth/me');
    return r.data;
  },

  async refreshToken(refreshToken: string) {
    const r = await api.post<IRefreshResponse>('/auth/refresh-token', { refreshToken });
    return r.data;
  },

  async cambiarSucursal(idsucursal: number) {
    const r = await api.post<{ ok: boolean; token: string; refreshToken: string; idsucursal: number }>('/auth/cambiar-sucursal', { idsucursal });
    return r.data;
  },

  async getComercioInfo(slug: string) {
    const r = await api.get<IComercioPublicInfo>(`/comercio/info/${slug}`);
    return r.data;
  }
};
