import { Layout, Typography, theme } from 'antd';

const { Footer: AntFooter } = Layout;
const { Text } = Typography;

import { useContext } from 'react';
import { AuthContext } from '../../context/auth/AuthContext';

export const Footer = () => {
  const { comercioInfo } = useContext(AuthContext);
  const { token } = theme.useToken();

  return (
    <AntFooter style={{
      textAlign: 'center',
      background: token.colorBgLayout,
      padding: '12px 24px'
    }}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {comercioInfo?.nombre || 'NEW HORIZON'} &copy; {new Date().getFullYear()} — Sistema de FacturaciÃ³n y Ventas
      </Text>
    </AntFooter>
  );
};
