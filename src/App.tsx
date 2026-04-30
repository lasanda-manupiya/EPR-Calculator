import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from '@/components/Layout';
import DashboardPage from '@/pages/DashboardPage';
import ProductsPage from '@/pages/ProductsPage';
import CreateProductPage from '@/pages/CreateProductPage';
import PackagingLibraryPage from '@/pages/PackagingLibraryPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import { useProducts } from '@/hooks/useProducts';

export default function App() {
  const { products, upsertProduct, removeProduct } = useProducts();
  return <Layout><Routes>
    <Route path="/" element={<DashboardPage products={products} />} />
    <Route path="/products" element={<ProductsPage products={products} onDelete={removeProduct} />} />
    <Route path="/create-product" element={<CreateProductPage onSave={upsertProduct} />} />
    <Route path="/packaging-library" element={<PackagingLibraryPage />} />
    <Route path="/reports" element={<ReportsPage products={products} />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Layout>;
}
