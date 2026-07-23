import { useState } from 'react';
import { userService } from '../services/userService';
import { notificationMessage } from '../helpers/shared';
import type { IUser } from '../interfaces/IUser';
import type { IRol } from '../interfaces/IRol';

export const useUser = () => {
  const [items, setItems] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<IRol[]>([]);

  const getAll = async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setItems(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const getRoles = async () => {
    try {
      const data = await userService.getRoles();
      setRoles(data);
    } catch { /* ignore */ }
  };

  const create = async (data: FormData) => {
    try {
      await userService.create(data);
      notificationMessage('success', 'Usuario creado');
      await getAll();
      return true;
    } catch (e: any) {
      notificationMessage('error', 'Error', e?.response?.data?.message || e?.message || 'Error al crear');
      return false;
    }
  };

  const update = async (id: number, data: FormData) => {
    try {
      await userService.update(id, data);
      notificationMessage('success', 'Usuario actualizado');
      await getAll();
      return true;
    } catch (e: any) {
      notificationMessage('error', 'Error', e?.response?.data?.message || e?.message || 'Error al actualizar');
      return false;
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      const result = await userService.toggleStatus(id);
      notificationMessage('success', result.condicion === 1 ? 'Usuario activado' : 'Usuario desactivado');
      await getAll();
      return true;
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.errors?.id?.msg || e?.message || 'Error al cambiar estado';
      if (msg.includes('No puedes desactivarte')) {
        notificationMessage('warning', 'Operación no permitida', msg);
      } else {
        notificationMessage('error', 'Error', msg);
      }
      return false;
    }
  };

  return { items, loading, roles, getAll, getRoles, create, update, toggleStatus };
};
