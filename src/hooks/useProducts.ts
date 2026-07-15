import { useEffect, useMemo, useState } from 'react';
import { Product } from '@/types';
import { loadProducts, removeProductRemote, upsertProductRemote } from '@/utils/cloudStorage';
import { useAuth } from '@/context/AuthContext';

export const useProducts = () => {
  const { activeCompanyId, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (!activeCompanyId) { setProducts([]); setLoading(false); return; }
    loadProducts(activeCompanyId).then((data) => setProducts(data)).finally(() => setLoading(false));
  }, [activeCompanyId]);

  const upsertProduct = async (product: Product) => {
    const next = products.some((p) => p.id === product.id)
      ? products.map((p) => (p.id === product.id ? product : p))
      : [product, ...products];
    setProducts(next);
    await upsertProductRemote(product, activeCompanyId, user?.id);
  };

  const removeProduct = async (id: string) => {
    const next = products.filter((p) => p.id !== id);
    setProducts(next);
    await removeProductRemote(id, activeCompanyId);
  };

  const summary = useMemo(() => ({
    count: products.length,
    totalWeight: products.reduce((s, p) => s + p.estimation.totalPackagingWeight, 0)
  }), [products]);

  return { products, upsertProduct, removeProduct, summary, loading };
};
