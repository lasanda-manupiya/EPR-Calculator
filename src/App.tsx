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
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import UserManagementPage from '@/pages/admin/UserManagementPage';

export default function App() {
  const { products, upsertProduct, removeProduct } = useProducts();
  const { user } = useAuth();
  if (!user) {
    return <Routes><Route path="/sign-in" element={<SignInPage />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="*" element={<Navigate to="/sign-in" replace />} /></Routes>;
  }
  return <Layout><Routes>
    <Route path="/" element={<DashboardPage products={products} />} />
    <Route path="/products" element={<ProductsPage products={products} onDelete={removeProduct} />} />
    <Route path="/create-product" element={<CreateProductPage onSave={upsertProduct} />} />
    <Route path="/packaging-library" element={<PackagingLibraryPage />} />
    <Route path="/reports" element={<ReportsPage products={products} />} />
    <Route path="/access-management" element={<UserManagementPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Layout>;
}
