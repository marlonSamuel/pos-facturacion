import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Button, Dropdown, Avatar, Space, Typography, theme } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import { AuthContext } from '../../context/auth/AuthContext';
import { SucursalSwitcher } from './SucursalSwitcher';

const { Header: AntHeader } = Layout;
const { Text } = Typography;
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Header = ({ collapsed, onToggle }: HeaderProps) => {
  const { user, comercioInfo, logout } = useContext(AuthContext);
  const { token } = theme.useToken();
  const navigate = useNavigate();

  const menuItems = [
    {
      key: 'profile',
      icon: <IdcardOutlined />,
      label: 'Mi Perfil',
      onClick: () => navigate('/profile')
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      danger: true,
      onClick: logout
    }
  ];

  return (
    <AntHeader style={{
      padding: '0 24px',
      background: token.colorBgContainer,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggle}
        style={{ fontSize: 16, width: 48, height: 48 }}
      />

      <Space>
        <SucursalSwitcher />
        <Text style={{ fontSize: 14, fontWeight: 500, color: token.colorTextSecondary }}>
          {comercioInfo?.nombre || ''}
        </Text>
        <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
          <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8, background: token.colorBgElevated, border: '1px solid ' + token.colorBorderSecondary }}>
            {user?.imagen && user.imagen !== 'default.png' ? (
              <Avatar src={`${API_URL}/uploads/users/${user.imagen}`} style={{ width: 28, height: 28 }} />
            ) : (
              <Avatar icon={<UserOutlined />} style={{ width: 28, height: 28, background: 'var(--blue-primary)' }} />
            )}
            <Text className="header-username">{user?.nombre}</Text>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};
