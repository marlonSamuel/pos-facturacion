import { createContext, useReducer, useEffect, useCallback } from 'react';
import { authReducer, initialState } from './AuthReducer';
import { authService } from '../../services/authService';
import type { ILoginData, IUser, IComercioPublicInfo } from '../../interfaces/IAuth';

export interface AuthContextProps {
  errorMessage: string;
  user: IUser | null;
  logged: boolean;
  token: string | null;
  login: (loginData: ILoginData) => Promise<boolean>;
  logout: () => void;
  removeError: () => void;
  updateUser?: (user: IUser) => void;
  comercioInfo: IComercioPublicInfo | null;
  cambiarSucursal: (idsucursal: number) => Promise<boolean>;
}

export const AuthContext = createContext({} as AuthContextProps);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const slug = (import.meta.env.VITE_COMERCIO_SLUG as string) || null;

  useEffect(() => {
    const logged = localStorage.getItem('logged');
    if (logged) checkToken();
  }, []);

  const checkToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const user = await authService.verifyToken();
      // Extraer idsucursal del JWT guardado en localStorage
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.idsucursal) user.idsucursal = payload.idsucursal;
      } catch { /* ignora */ }
      dispatch({ type: 'login', payload: { token, user } });
      // Cargar información del comercio
      if (slug) {
        try {
          const info = await authService.getComercioInfo(slug);
          if (info) dispatch({ type: 'setComercioInfo', payload: { info } });
        } catch { /* ignora */ }
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('logged');
      dispatch({ type: 'logout' });
    }
  };

  const login = useCallback(async ({ username, password }: ILoginData) => {
    try {
      const res = await authService.login(username, password, slug || undefined);
      if (!res.ok || !res.token || !res.user) {
        dispatch({ type: 'addError', payload: res.message || 'Credenciales inválidas' });
        return false;
      }
      localStorage.setItem('logged', 'true');
      localStorage.setItem('token', res.token);
      if (res.refreshToken) {
        localStorage.setItem('refreshToken', res.refreshToken);
      }
      dispatch({ type: 'login', payload: { token: res.token, user: res.user } });
      // Cargar información del comercio
      if (slug) {
        try {
          const info = await authService.getComercioInfo(slug);
          if (info) dispatch({ type: 'setComercioInfo', payload: { info } });
        } catch { /* ignora */ }
      }
      return true;
    } catch (e: any) {
      dispatch({ type: 'addError', payload: e?.message || 'Error al iniciar sesión' });
      return false;
    }
  }, [slug]);

  const logout = useCallback(() => {
    dispatch({ type: 'logout' });
    localStorage.removeItem('logged');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }, []);

  const removeError = useCallback(() => {
    dispatch({ type: 'removeError' });
  }, []);

  const cambiarSucursalFn = useCallback(async (idsucursal: number) => {
    try {
      const res = await authService.cambiarSucursal(idsucursal);
      if (res.ok && res.token) {
        localStorage.setItem('token', res.token);
        if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken);
        // Refrescar datos completos del usuario con el nuevo contexto
        const userData = await authService.verifyToken();
        dispatch({ type: 'updateUser', payload: { user: userData } });
        return true;
      }
      return false;
    } catch { return false; }
  }, []);

  const updateUser = useCallback((user: IUser) => {
    dispatch({ type: 'updateUser', payload: { user } });
  }, []);

  return (
    <AuthContext.Provider value={{
      errorMessage: state.errorMessage,
      user: state.user,
      logged: state.logged,
      token: state.token,
      comercioInfo: state.comercioInfo,
      cambiarSucursal: cambiarSucursalFn,
      login,
      logout,
      removeError,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
