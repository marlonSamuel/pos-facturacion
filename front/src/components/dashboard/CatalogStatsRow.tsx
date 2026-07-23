import { Spin } from 'antd';
import { AppstoreOutlined, TeamOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useDashboardData } from './useDashboardData';

interface CatalogData { clientes: number; proveedores: number; articulos: number; }

const boxStyle = {
  borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  padding: '12px 16px', textAlign: 'center' as const, background: '#fff', flex: 1,
};

export const CatalogStatsRow = () => {
  const { data, loading } = useDashboardData<CatalogData>('catalog-stats');

  if (loading) return <div style={{ textAlign: 'center', padding: 16 }}><Spin size="small" /></div>;
  if (!data) return null;

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={boxStyle}>
        <AppstoreOutlined style={{ fontSize: 22, color: '#1890ff' }} />
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{data.articulos}</div>
        <div style={{ fontSize: 11, color: '#888' }}>Productos</div>
      </div>
      <div style={boxStyle}>
        <TeamOutlined style={{ fontSize: 22, color: '#52c41a' }} />
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{data.clientes}</div>
        <div style={{ fontSize: 11, color: '#888' }}>Clientes</div>
      </div>
      <div style={boxStyle}>
        <ShoppingOutlined style={{ fontSize: 22, color: '#fa8c16' }} />
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{data.proveedores}</div>
        <div style={{ fontSize: 11, color: '#888' }}>Proveedores</div>
      </div>
    </div>
  );
};
