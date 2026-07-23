import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Grid } from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  AppstoreOutlined,
  TeamOutlined,
  UserOutlined,
  FileTextOutlined,
  SettingOutlined,
  BarChartOutlined,
  PlusCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { AuthContext } from '../../context/auth/AuthContext';

const { Sider } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard', permisos: ['dashboard'] },
  { type: 'divider' as const },
  { key: 'sub1', icon: <ShopOutlined />, label: 'Ventas', permisos: ['ventas'],
    children: [
      { key: '/pos', icon: <PlusCircleOutlined />, label: 'Nueva Venta' },
      { key: '/sales', icon: <FileTextOutlined />, label: 'Historial Ventas' },
      { key: '/clients', icon: <UserOutlined />, label: 'Clientes' },
    ]
  },
  { key: 'sub2', icon: <ShoppingCartOutlined />, label: 'Compras', permisos: ['compras'],
    children: [
      { key: '/purchases/new', icon: <PlusCircleOutlined />, label: 'Nueva Compra' },
      { key: '/purchases', icon: <FileTextOutlined />, label: 'Historial Compras' },
      { key: '/providers', icon: <TeamOutlined />, label: 'Proveedores' },
    ]
  },
  { key: 'sub3', icon: <AppstoreOutlined />, label: 'Inventario', permisos: ['inventario'],
    children: [
      { key: '/products', icon: <AppstoreOutlined />, label: 'Artículos' },
      { key: '/categories', icon: <SettingOutlined />, label: 'Categorías' },
    ]
  },
  { key: 'sub5', icon: <UserOutlined />, label: 'Usuarios', permisos: ['usuarios'],
    children: [
      { key: '/users', icon: <TeamOutlined />, label: 'Gestionar Usuarios' },
      { key: '/roles', icon: <SettingOutlined />, label: 'Roles' },
      { key: '/audit', icon: <FileTextOutlined />, label: 'Auditoría' },
    ]
  },
  { key: '/reports', icon: <BarChartOutlined />, label: 'Reportes', permisos: ['reportes-compras'] },
  { key: '/analytics', icon: <RiseOutlined />, label: 'Analíticas', permisos: ['reportes-compras', 'reportes-ventas'] },
  { key: '/comercio-config', icon: <SettingOutlined />, label: 'Config. Comercio', adminOnly: true },
];

interface SideBarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export const SideBar = ({ collapsed, onCollapse }: SideBarProps) => {
  const { user, comercioInfo } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  // Filtrar items según permisos del usuario
  const filterByPermissions = (items: any[]): any[] => {
    return items.filter((item: any) => {
      // Admin only
      if (item.adminOnly) {
        return user?.idrol === 1;
      }
      if (item.permisos) {
        const hasPermission = item.permisos.some((p: string) =>
          user?.permisos?.includes(p) || user?.cargo === 'admin'
        );
        if (!hasPermission) return false;
      }
      if (item.children) {
        item.children = filterByPermissions(item.children);
        return item.children.length > 0;
      }
      return true;
    });
  };

  const filteredItems = filterByPermissions(menuItems);

  // Encontrar la clave seleccionada basada en la ruta actual
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return '/';
    return path;
  };

  const getOpenKeys = () => {
    const path = location.pathname;
    for (const item of menuItems as any) {
      if (item.children) {
        if (item.children.some((c: any) => c.key === path)) {
          return [item.key];
        }
      }
    }
    return [];
  };

  return (
    <>
      {/* Overlay para cerrar sidebar en móvil */}
      {isMobile && !collapsed && (
        <div
          onClick={() => onCollapse(true)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 99
          }}
        />
      )}
      <Sider
        width={250}
        collapsible
        collapsed={collapsed}
        onCollapse={onCollapse}
        trigger={null}
        collapsedWidth={0}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: 'var(--sidebar-bg)',
          zIndex: 100
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {!collapsed && (
            <>
              {comercioInfo?.logo ? (
                <img
                  src={`${API_URL}/uploads/comercios/${comercioInfo.logo}`}
                  alt="logo"
                  style={{ height: 40, width: 40, objectFit: 'cover', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: comercioInfo?.color_primario || '#1677ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 'bold', color: '#fff', flexShrink: 0,
                  border: '2px solid rgba(255,255,255,0.3)'
                }}>
                  {(comercioInfo?.nombre || 'N')[0]}
                </div>
              )}
              <Text strong style={{ color: '#fff', fontSize: 16, letterSpacing: 1 }}>
                {comercioInfo?.nombre || 'NEW HORIZON'}
              </Text>
            </>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          defaultOpenKeys={getOpenKeys()}
          items={filteredItems}
          onClick={({ key }) => {
            navigate(key);
            if (isMobile) onCollapse(true);
          }}
          style={{ background: 'transparent', borderRight: 0 }}
        />
      </Sider>
    </>
  );
};


