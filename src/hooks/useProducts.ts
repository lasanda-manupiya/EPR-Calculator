import { useEffect, useMemo, useState } from 'react';
import { Product } from '@/types';
import { loadProducts, removeProductRemote, upsertProductRemote } from '@/utils/cloudStorage';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts().then((data) => setProducts(data)).finally(() => setLoading(false));
  }, []);

  const upsertProduct = async (product: Product) => {
    const next = products.some((p) => p.id === product.id)
      ? products.map((p) => (p.id === product.id ? product : p))
      : [product, ...products];
    setProducts(next);
    await upsertProductRemote(product);
  };

  const removeProduct = async (id: string) => {
    const next = products.filter((p) => p.id !== id);
    setProducts(next);
    await removeProductRemote(id);
  };

  const summary = useMemo(() => ({
    count: products.length,
    totalWeight: products.reduce((s, p) => s + p.estimation.totalPackagingWeight, 0)
  }), [products]);

  return { products, upsertProduct, removeProduct, summary, loading };
};
