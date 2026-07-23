import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Spin, Grid, theme, FloatButton } from 'antd';
import { ShoppingCartOutlined, SearchOutlined } from '@ant-design/icons';
import { SideBar } from '../components/shared/SideBar';
import { Header } from '../components/shared/Header';
import { Footer } from '../components/shared/Footer';
import { UIContext } from '../context/UIContext';
import { PriceChecker } from '../components/shared/PriceChecker';

const { Content } = Layout;
const { useBreakpoint } = Grid;

export const DefaultLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const { loading } = useContext(UIContext);
  const screens = useBreakpoint();
  const { token } = theme.useToken();
  const isMobile = !screens.lg;
  const navigate = useNavigate();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <SideBar collapsed={collapsed} onCollapse={setCollapsed} />

      <Layout style={{
        marginLeft: isMobile ? 0 : (collapsed ? 0 : 250),
        transition: 'margin-left 0.2s'
      }}>
        <Header collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

        <Content style={{ margin: '12px 8px', minHeight: 280, position: 'relative' }}>
          <Spin spinning={loading} size="large">
            <div style={{
              background: token.colorBgContainer,
              padding: '16px 12px',
              borderRadius: token.borderRadiusLG,
              minHeight: 360
            }}>
              {children}
            </div>
          </Spin>
        </Content>

        <Footer />
      </Layout>

      {/* Floating Action Buttons */}
      <FloatButton.Group shape="circle" style={{ right: 24, bottom: 24 }}>
        <FloatButton
          icon={<ShoppingCartOutlined />}
          type="primary"
          tooltip="Nueva venta"
          onClick={() => navigate('/pos')}
        />
        <FloatButton
          icon={<SearchOutlined />}
          tooltip="Consultar precio"
          onClick={() => setPriceOpen(true)}
        />
      </FloatButton.Group>

      {/* Price Checker Drawer */}
      <PriceChecker open={priceOpen} onClose={() => setPriceOpen(false)} />
    </Layout>
  );
};
