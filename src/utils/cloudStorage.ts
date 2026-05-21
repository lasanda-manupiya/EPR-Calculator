import { CompanySettings, Product, ReferenceItem } from '@/types';
import { referenceLibrary as defaultReferenceLibrary } from '@/data/referenceLibrary';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getProducts, getSettings, saveProducts, saveSettings } from '@/utils/storage';
import { getReferenceLibrary, saveReferenceLibrary } from '@/utils/referenceLibraryStorage';

const resolveCompanyIdsForCurrentUser = async (): Promise<string[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('company_admins').select('company_id,role');
  if (error) throw error;
  const rows = (data ?? []) as { company_id: string; role: 'superadmin' | 'admin' | 'supplier' }[];
  if (rows.some((row) => row.role === 'superadmin')) {
    const { data: companies } = await supabase.from('companies').select('id');
    return Array.from(new Set((companies ?? []).map((company: { id: string }) => company.id).filter(Boolean)));
  }
  return Array.from(new Set(rows.map((row) => row.company_id).filter(Boolean)));
};

const resolvePrimaryCompanyId = async (): Promise<string | null> => {
  const ids = await resolveCompanyIdsForCurrentUser();
  return ids[0] ?? null;
};

export const loadProducts = async (selectedCompanyId?: string | null): Promise<Product[]> => {
  if (!isSupabaseConfigured || !supabase) return getProducts();
  try {
    const companyIds = selectedCompanyId ? [selectedCompanyId] : await resolveCompanyIdsForCurrentUser();
    if (!companyIds.length) return [];
    const { data, error } = await supabase.from('products').select('payload').in('company_id', companyIds).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: { payload: Product }) => row.payload);
  } catch {
    return getProducts();
  }
};

export const upsertProductRemote = async (product: Product) => {
  saveProducts([product, ...getProducts().filter((p) => p.id !== product.id)]);
  if (!isSupabaseConfigured || !supabase) return;
  const companyId = await resolvePrimaryCompanyId();
  if (!companyId) return;
  await supabase.from('products').upsert({ id: product.id, company_id: companyId, payload: product, updated_at: new Date().toISOString() });
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
    const companyId = await resolvePrimaryCompanyId();
    if (!companyId) return;
    await supabase.from('reference_library').insert(items.map((item) => ({ id: item.id, company_id: companyId, payload: item, updated_at: new Date().toISOString() })));
  }
};

export const loadSettings = async (selectedCompanyId?: string | null): Promise<CompanySettings> => {
  if (!isSupabaseConfigured || !supabase) return getSettings();
  try {
    const companyId = selectedCompanyId ?? await resolvePrimaryCompanyId();
    if (!companyId) return getSettings();
    const { data, error } = await supabase.from('company_settings').select('payload').eq('id', 'default').eq('company_id', companyId).maybeSingle();
    if (error) throw error;
    return data?.payload ?? getSettings();
  } catch {
    return getSettings();
  }
};

export const saveSettingsRemote = async (settings: CompanySettings, selectedCompanyId?: string | null) => {
  saveSettings(settings);
  if (!isSupabaseConfigured || !supabase) return;
  const companyId = selectedCompanyId ?? await resolvePrimaryCompanyId();
  if (!companyId) return;
  await supabase.from('company_settings').upsert({ id: 'default', company_id: companyId, payload: settings, updated_at: new Date().toISOString() });
};

export const seedReferenceLibraryIfNeeded = async () => {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data, error } = await supabase.from('reference_library').select('id').limit(1);
    if (error || data?.length) return;
    const companyId = await resolvePrimaryCompanyId();
    if (!companyId) return;
    await supabase.from('reference_library').insert(defaultReferenceLibrary.map((item) => ({ id: item.id, company_id: companyId, payload: item })));
  } catch {
    // ignore seeding errors
  }
};
