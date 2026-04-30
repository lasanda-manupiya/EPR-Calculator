import { CompanySettings, Product, ReferenceItem } from '@/types';
import { referenceLibrary as defaultReferenceLibrary } from '@/data/referenceLibrary';
import { isSupabaseConfigured, supabaseFetch } from '@/lib/supabase';
import { getProducts, getSettings, saveProducts, saveSettings } from '@/utils/storage';
import { getReferenceLibrary, saveReferenceLibrary } from '@/utils/referenceLibraryStorage';

export const loadProducts = async (): Promise<Product[]> => {
  if (!isSupabaseConfigured) return getProducts();
  try {
    const response = await supabaseFetch('products?select=payload&order=created_at.desc');
    const data = await response.json();
    return data.map((row: { payload: Product }) => row.payload);
  } catch { return getProducts(); }
};

export const upsertProductRemote = async (product: Product) => {
  saveProducts([product, ...getProducts().filter((p) => p.id !== product.id)]);
  if (!isSupabaseConfigured) return;
  await supabaseFetch('products', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify([{ id: product.id, payload: product, updated_at: new Date().toISOString() }]) });
};

export const removeProductRemote = async (id: string) => {
  saveProducts(getProducts().filter((p) => p.id !== id));
  if (!isSupabaseConfigured) return;
  await supabaseFetch(`products?id=eq.${id}`, { method: 'DELETE' });
};

export const loadReferenceLibrary = async (): Promise<ReferenceItem[]> => {
  if (!isSupabaseConfigured) return getReferenceLibrary();
  try {
    const response = await supabaseFetch('reference_library?select=payload');
    const data = await response.json();
    if (!data.length) return getReferenceLibrary();
    return data.map((row: { payload: ReferenceItem }) => row.payload);
  } catch { return getReferenceLibrary(); }
};

export const saveReferenceLibraryRemote = async (items: ReferenceItem[]) => {
  saveReferenceLibrary(items);
  if (!isSupabaseConfigured) return;
  await supabaseFetch('reference_library?id=neq.00000000-0000-0000-0000-000000000000', { method: 'DELETE' });
  if (items.length) await supabaseFetch('reference_library', { method: 'POST', body: JSON.stringify(items.map((item) => ({ id: item.id, payload: item, updated_at: new Date().toISOString() }))) });
};

export const loadSettings = async (): Promise<CompanySettings> => {
  if (!isSupabaseConfigured) return getSettings();
  try {
    const response = await supabaseFetch('company_settings?select=payload&id=eq.default');
    const data = await response.json();
    return data?.[0]?.payload ?? getSettings();
  } catch { return getSettings(); }
};

export const saveSettingsRemote = async (settings: CompanySettings) => {
  saveSettings(settings);
  if (!isSupabaseConfigured) return;
  await supabaseFetch('company_settings', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify([{ id: 'default', payload: settings, updated_at: new Date().toISOString() }]) });
};

export const seedReferenceLibraryIfNeeded = async () => {
  if (!isSupabaseConfigured) return;
  try {
    const response = await supabaseFetch('reference_library?select=id&limit=1');
    const data = await response.json();
    if (data.length) return;
    await supabaseFetch('reference_library', { method: 'POST', body: JSON.stringify(defaultReferenceLibrary.map((item) => ({ id: item.id, payload: item }))) });
  } catch {
    // ignore seeding errors
  }
};
