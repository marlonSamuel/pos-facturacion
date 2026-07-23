import { useContext } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/auth/AuthContext';
import { PrivateRoute } from './PrivateRoute';
import { PublicRoute } from './PublicRoute';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { IndexCategory } from '../pages/inventory/categories/IndexCategory';
import { IndexArticle } from '../pages/inventory/articles/IndexArticle';
import { IndexClient } from '../pages/persons/clients/IndexClient';
import { IndexProvider } from '../pages/persons/providers/IndexProvider';
import { IndexUser } from '../pages/users/IndexUser';
import { ProfilePage } from '../pages/users/ProfilePage';
import { MainPurchase } from '../pages/purchases/MainPurchase';
import { IndexPurchase } from '../pages/purchases/IndexPurchase';
import { MainSale } from '../pages/sales/MainSale';
import { ReportPage } from '../pages/reports/ReportPage';
import { AnalyticsPage } from '../pages/analytics/AnalyticsPage';
import { AuditPage } from '../pages/audit/AuditPage';
import { RolePage } from '../pages/roles/RolePage';
import { ComercioConfig } from '../pages/comercio/ComercioConfig';
import { IndexSale } from '../pages/sales/IndexSale';
import { DefaultLayout } from '../pages/DefaultLayout';

export const AppRouter = () => {
  const { logged, user } = useContext(AuthContext);

  return (
    <Routes>
      <Route
        path="/auth/login"
        element={
          <PublicRoute isAuthenticated={logged}>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/*"
        element={
          <PrivateRoute isAuthenticated={logged}>
            <DefaultLayout>
              <Routes key={user?.idsucursal ?? 'default'}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/categories" element={<IndexCategory />} />
                <Route path="/products" element={<IndexArticle />} />
                <Route path="/clients" element={<IndexClient />} />
                <Route path="/providers" element={<IndexProvider />} />
                <Route path="/users" element={<IndexUser />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/pos" element={<MainSale />} />
                <Route path="/sales" element={<IndexSale />} />
                <Route path="/purchases/new" element={<MainPurchase />} />
                <Route path="/purchases" element={<IndexPurchase />} />
                <Route path="/reports" element={<ReportPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/audit" element={<AuditPage />} />
                <Route path="/comercio-config" element={<ComercioConfig />} />
                <Route path="/roles" element={<RolePage />} />
                <Route path="*" element={<DashboardPage />} />
              </Routes>
            </DefaultLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
};
