import { CompanySettings, Product, ReferenceItem } from '@/types';
import { referenceLibrary as defaultReferenceLibrary } from '@/data/referenceLibrary';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getProducts, getSettings, saveProducts, saveSettings } from '@/utils/storage';
import { getReferenceLibrary, saveReferenceLibrary } from '@/utils/referenceLibraryStorage';

export const loadProducts = async (): Promise<Product[]> => {
  if (!isSupabaseConfigured || !supabase) return getProducts();
  try {
    const { data, error } = await supabase.from('products').select('payload').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: { payload: Product }) => row.payload);
  } catch {
    return getProducts();
  }
};

export const upsertProductRemote = async (product: Product) => {
  saveProducts([product, ...getProducts().filter((p) => p.id !== product.id)]);
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('products').upsert({ id: product.id, payload: product, updated_at: new Date().toISOString() });
};

export const removeProductRemote = async (id: string) => {
  saveProducts(getProducts().filter((p) => p.id !== id));
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('products').delete().eq('id', id);
};

export const loadReferenceLibrary = async (): Promise<ReferenceItem[]> => {
  if (!isSupabaseConfigured || !supabase) return getReferenceLibrary();
  try {
    const { data, error } = await supabase.from('reference_library').select('payload');
    if (error) throw error;
    if (!data?.length) return getReferenceLibrary();
    return data.map((row: { payload: ReferenceItem }) => row.payload);
  } catch {
    return getReferenceLibrary();
  }
};

export const saveReferenceLibraryRemote = async (items: ReferenceItem[]) => {
  saveReferenceLibrary(items);
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('reference_library').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (items.length) {
    await supabase.from('reference_library').insert(items.map((item) => ({ id: item.id, payload: item, updated_at: new Date().toISOString() })));
  }
};

export const loadSettings = async (): Promise<CompanySettings> => {
  if (!isSupabaseConfigured || !supabase) return getSettings();
  try {
    const { data, error } = await supabase.from('company_settings').select('payload').eq('id', 'default').maybeSingle();
    if (error) throw error;
    return data?.payload ?? getSettings();
  } catch {
    return getSettings();
  }
};

export const saveSettingsRemote = async (settings: CompanySettings) => {
  saveSettings(settings);
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('company_settings').upsert({ id: 'default', payload: settings, updated_at: new Date().toISOString() });
};

export const seedReferenceLibraryIfNeeded = async () => {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data, error } = await supabase.from('reference_library').select('id').limit(1);
    if (error || data?.length) return;
    await supabase.from('reference_library').insert(defaultReferenceLibrary.map((item) => ({ id: item.id, payload: item })));
  } catch {
    // ignore seeding errors
  }
};
