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
import RegisterPage from '@/pages/auth/RegisterPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';
import TeamPage from '@/pages/admin/TeamPage';
import SuperadminOverviewPage from '@/pages/admin/SuperadminOverviewPage';
import PrivacyPage from '@/pages/PrivacyPage';
import { useAuth } from '@/context/AuthContext';

export default function App() {
  const { user, loading: authLoading, emailVerified, isAdmin, isSuperadmin } = useAuth();
  const { products, upsertProduct, removeProduct, loading } = useProducts();

  if (authLoading) return <div className='min-h-screen flex items-center justify-center'>Checking session...</div>;

  // Not signed in — public routes only.
  if (!user) {
    return (
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<Navigate to="/sign-in" replace />} />
      </Routes>
    );
  }

  // Signed in but email not confirmed — block the app until verified.
  if (!emailVerified) {
    return (
      <Routes>
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<VerifyEmailPage />} />
      </Routes>
    );
  }

  if (loading) return <div className='min-h-screen flex items-center justify-center'>Loading data...</div>;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage products={products} />} />
        <Route path="/products" element={<ProductsPage products={products} onDelete={removeProduct} />} />
        <Route path="/create-product" element={<CreateProductPage onSave={upsertProduct} />} />
        <Route path="/packaging-library" element={<PackagingLibraryPage />} />
        <Route path="/reports" element={<ReportsPage products={products} />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        {isAdmin && <Route path="/team" element={<TeamPage />} />}
        {isSuperadmin && <Route path="/overview" element={<SuperadminOverviewPage />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
