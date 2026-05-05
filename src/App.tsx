import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from '@/components/Layout';
import DashboardPage from '@/pages/DashboardPage';
import ProductsPage from '@/pages/ProductsPage';
import CreateProductPage from '@/pages/CreateProductPage';
import PackagingLibraryPage from '@/pages/PackagingLibraryPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import { useProducts } from '@/hooks/useProducts';
import SignInPage from '@/pages/auth/SignInPage';
import { useAuth } from '@/context/AuthContext';
import UserManagementPage from '@/pages/admin/UserManagementPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import SuperadminCompanyManagementPage from '@/pages/admin/SuperadminCompanyManagementPage';

const Guard = ({ allow, children }: { allow: boolean; children: JSX.Element }) => allow ? children : <Navigate to="/" replace />;

export default function App() {
  const { products, upsertProduct, removeProduct, loading } = useProducts();
  const { user, loading: authLoading, hasRole } = useAuth();
  if (authLoading) return <div className='min-h-screen flex items-center justify-center'>Checking session...</div>;
  if (!user) return <Routes><Route path="/sign-in" element={<SignInPage />} /><Route path="/register" element={<RegisterPage />} /><Route path="*" element={<Navigate to="/sign-in" replace />} /></Routes>;
  if (loading) return <div className='min-h-screen flex items-center justify-center'>Loading data...</div>;
  return <Layout><Routes>
    <Route path="/" element={<DashboardPage products={products} />} />
    <Route path="/products" element={<ProductsPage products={products} onDelete={removeProduct} />} />
    <Route path="/create-product" element={<CreateProductPage onSave={upsertProduct} />} />
    <Route path="/packaging-library" element={<PackagingLibraryPage />} />
    <Route path="/reports" element={<ReportsPage products={products} />} />
    <Route path="/access-management" element={<Guard allow={hasRole('admin', 'superadmin')}><UserManagementPage /></Guard>} />
    <Route path="/superadmin/companies" element={<Guard allow={hasRole('superadmin')}><SuperadminCompanyManagementPage /></Guard>} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Layout>;
}
