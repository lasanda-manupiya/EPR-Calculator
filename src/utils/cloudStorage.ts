import { CompanySettings, Product, ReferenceItem } from '@/types';
import { referenceLibrary as defaultReferenceLibrary } from '@/data/referenceLibrary';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getProducts, getSettings, saveProducts, saveSettings } from '@/utils/storage';
import { getReferenceLibrary, saveReferenceLibrary } from '@/utils/referenceLibraryStorage';

const requireCompany = (activeCompanyId: string | null | undefined) => {
  if (!activeCompanyId) throw new Error('Select an active company before creating or editing records.');
  return activeCompanyId;
};

export const loadProducts = async (activeCompanyId?: string | null): Promise<Product[]> => {
  if (!isSupabaseConfigured || !supabase) return getProducts();
  if (!activeCompanyId) return [];
  const { data, error } = await supabase.from('products').select('payload').eq('company_id', activeCompanyId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: { payload: Product }) => row.payload);
};

export const upsertProductRemote = async (product: Product, activeCompanyId?: string | null) => {
  const companyId = requireCompany(activeCompanyId);
  saveProducts([product, ...getProducts().filter((p) => p.id !== product.id)]);
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('products').upsert({ id: product.id, company_id: companyId, payload: product, updated_at: new Date().toISOString() });
};

export const removeProductRemote = async (id: string, activeCompanyId?: string | null) => {
  const companyId = requireCompany(activeCompanyId);
  saveProducts(getProducts().filter((p) => p.id !== id));
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('products').delete().eq('id', id).eq('company_id', companyId);
};

export const loadReferenceLibrary = async (activeCompanyId?: string | null): Promise<ReferenceItem[]> => {
  if (!isSupabaseConfigured || !supabase) return getReferenceLibrary();
  if (!activeCompanyId) return [];
  const { data, error } = await supabase.from('reference_library').select('payload').or(`company_id.eq.${activeCompanyId},company_id.is.null`);
  if (error) throw error;
  if (!data?.length) return getReferenceLibrary();
  return data.map((row: { payload: ReferenceItem }) => row.payload);
};

export const createReferenceLibraryItemRemote = async (item: ReferenceItem, activeCompanyId?: string | null) => {
  const companyId = requireCompany(activeCompanyId);
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('reference_library').insert({ id: item.id, company_id: companyId, payload: item, updated_at: new Date().toISOString() });
};

export const loadSettings = async (activeCompanyId?: string | null): Promise<CompanySettings> => {
  if (!isSupabaseConfigured || !supabase) return getSettings();
  if (!activeCompanyId) return getSettings();
  const { data, error } = await supabase.from('company_settings').select('payload').eq('id', 'default').eq('company_id', activeCompanyId).maybeSingle();
  if (error) throw error;
  return data?.payload ?? getSettings();
};

export const saveSettingsRemote = async (settings: CompanySettings, activeCompanyId?: string | null) => {
  const companyId = requireCompany(activeCompanyId);
  saveSettings(settings);
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('company_settings').upsert({ id: 'default', company_id: companyId, payload: settings, updated_at: new Date().toISOString() });
};

export const seedReferenceLibraryIfNeeded = async (activeCompanyId?: string | null) => {
  if (!isSupabaseConfigured || !supabase || !activeCompanyId) return;
  const { data, error } = await supabase.from('reference_library').select('id').eq('company_id', activeCompanyId).limit(1);
  if (error || data?.length) return;
  await supabase.from('reference_library').insert(defaultReferenceLibrary.map((item) => ({ id: item.id, company_id: activeCompanyId, payload: item })));
};
