import { useMemo, useState } from 'react';
import { Product } from '@/types';
import { getProducts, saveProducts } from '@/utils/storage';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>(getProducts());

  const upsertProduct = (product: Product) => {
    const next = products.some((p) => p.id === product.id)
      ? products.map((p) => (p.id === product.id ? product : p))
      : [...products, product];
    setProducts(next);
    saveProducts(next);
  };

  const removeProduct = (id: string) => {
    const next = products.filter((p) => p.id !== id);
    setProducts(next);
    saveProducts(next);
  };

  const summary = useMemo(() => ({
    count: products.length,
    totalWeight: products.reduce((s, p) => s + p.estimation.totalPackagingWeight, 0)
  }), [products]);

  return { products, upsertProduct, removeProduct, summary };
};
