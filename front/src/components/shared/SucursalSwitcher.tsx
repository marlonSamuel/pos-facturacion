import { useContext, useEffect, useState } from 'react';
import { Select, Tag } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import { AuthContext } from '../../context/auth/AuthContext';
import { sucursalService } from '../../services/sucursalService';
import type { ISucursalInfo } from '../../services/sucursalService';

export const SucursalSwitcher = () => {
  const { user, cambiarSucursal } = useContext(AuthContext);
  const [sucursales, setSucursales] = useState<ISucursalInfo[]>([]);

  useEffect(() => {
    sucursalService.getAll()
      .then(setSucursales)
      .catch(() => {});
  }, []);

  if (!user?.idsucursal) return null;

  const current = sucursales.find(s => s.idsucursal === user.idsucursal);

  // Si solo tiene una sucursal — mostrar como tag informativo
  if (!user.sucursales || user.sucursales.length <= 1) {
    return (
      <Tag icon={<ShopOutlined />} color="blue" style={{ marginRight: 8 }}>
        {current?.nombre || `Sucursal ${user.idsucursal}`}
      </Tag>
    );
  }

  // Si tiene múltiples sucursales — mostrar selector
  return (
    <Select
      size="small"
      value={user.idsucursal}
      onChange={cambiarSucursal}
      style={{ minWidth: 150, marginRight: 8 }}
      options={sucursales
        .filter(s => user.sucursales?.includes(s.idsucursal))
        .map(s => ({
          value: s.idsucursal,
          label: s.nombre
        }))}
    />
  );
};
