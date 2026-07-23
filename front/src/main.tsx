import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App } from 'antd';
import { AuthProvider } from './context/auth/AuthContext';
import { UIProvider } from './context/UIContext';
import { ShopProvider } from './context/shop/ShopContext';
import { SaleProvider } from './context/sale/SaleContext';
import { AppRouter } from './router/AppRouter';
import './index.css';

const theme = {
  cssVar: { prefix: 'ant' },
  token: {
    colorPrimary: '#1565c0',
    borderRadius: 10,
    colorBgContainer: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  components: {
    Card: {
      borderRadiusLG: 16
    },
    Button: {
      controlHeight: 48,
      fontWeight: 600
    },
    Input: {
      controlHeight: 48,
      paddingInline: 12
    },
    Table: {
      borderRadius: 12
    }
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider theme={theme} componentSize="small">
      <App>
        <BrowserRouter>
          <AuthProvider>
            <UIProvider>
              <ShopProvider>
                <SaleProvider>
                  <AppRouter />
                </SaleProvider>
              </ShopProvider>
            </UIProvider>
          </AuthProvider>
        </BrowserRouter>
      </App>
    </ConfigProvider>
  </React.StrictMode>
);
