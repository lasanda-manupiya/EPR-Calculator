import { CompanySettings, Product, ReferenceItem } from '@/types';
import { referenceLibrary as defaultReferenceLibrary } from '@/data/referenceLibrary';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getProducts, getSettings, saveProducts, saveSettings } from '@/utils/storage';
import { getHiddenDefaults, getOwnLibrary, saveHiddenDefaults, saveOwnLibrary } from '@/utils/referenceLibraryStorage';

const requireCompany = (companyId: string | null | undefined) => {
  if (!companyId) throw new Error('Your account is not linked to a company yet.');
  return companyId;
};

// ----------------------------- Products (company-scoped) --------------------
export const loadProducts = async (companyId?: string | null): Promise<Product[]> => {
  if (!isSupabaseConfigured || !supabase) return getProducts();
  if (!companyId) return [];
  const { data, error } = await supabase
    .from('products')
    .select('payload')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: { payload: Product }) => row.payload);
};

export const upsertProductRemote = async (product: Product, companyId?: string | null, userId?: string | null) => {
  const scopedCompany = requireCompany(companyId);
  saveProducts([product, ...getProducts().filter((p) => p.id !== product.id)]);
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('products').upsert({
    id: product.id,
    company_id: scopedCompany,
    user_id: userId ?? null,
    payload: product,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
};

export const removeProductRemote = async (id: string, companyId?: string | null) => {
  const scopedCompany = requireCompany(companyId);
  saveProducts(getProducts().filter((p) => p.id !== id));
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('products').delete().eq('id', id).eq('company_id', scopedCompany);
  if (error) throw error;
};

// ----------------------------- Settings (company-scoped) --------------------
export const loadSettings = async (companyId?: string | null): Promise<CompanySettings> => {
  if (!isSupabaseConfigured || !supabase) return getSettings();
  if (!companyId) return getSettings();
  const { data, error } = await supabase
    .from('company_settings')
    .select('payload')
    .eq('company_id', companyId)
    .maybeSingle();
  if (error) throw error;
  return data?.payload ?? getSettings();
};

export const saveSettingsRemote = async (settings: CompanySettings, companyId?: string | null) => {
  const scopedCompany = requireCompany(companyId);
  saveSettings(settings);
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase
    .from('company_settings')
    .upsert({ company_id: scopedCompany, payload: settings, updated_at: new Date().toISOString() }, { onConflict: 'company_id' });
  if (error) throw error;
};

// ----------------------------- Packaging library ----------------------------
// Global defaults (user_id null) are shared. Personal additions are private.
// Each user may hide defaults they don't want and restore them later.
export interface LibraryView {
  visible: ReferenceItem[];       // defaults (minus hidden) + own additions
  hiddenDefaults: ReferenceItem[]; // defaults the user has hidden (restorable)
  defaultIds: string[];            // ids that are global defaults (hide-able, not deletable by non-superadmin)
}

const readGlobals = async (): Promise<ReferenceItem[]> => {
  if (!isSupabaseConfigured || !supabase) return defaultReferenceLibrary;
  const { data, error } = await supabase.from('reference_library').select('payload').is('user_id', null);
  if (error) throw error;
  return (data ?? []).map((r: { payload: ReferenceItem }) => r.payload);
};

const readOwn = async (userId?: string | null): Promise<ReferenceItem[]> => {
  if (!isSupabaseConfigured || !supabase) return getOwnLibrary();
  if (!userId) return [];
  const { data, error } = await supabase.from('reference_library').select('payload').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r: { payload: ReferenceItem }) => r.payload);
};

const readHiddenIds = async (userId?: string | null): Promise<Set<string>> => {
  if (!isSupabaseConfigured || !supabase) return new Set(getHiddenDefaults());
  if (!userId) return new Set();
  const { data, error } = await supabase.from('hidden_default_items').select('item_id').eq('user_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((r: { item_id: string }) => r.item_id));
};

export const loadLibraryView = async (userId?: string | null): Promise<LibraryView> => {
  const [globals, own, hiddenIds] = await Promise.all([readGlobals(), readOwn(userId), readHiddenIds(userId)]);
  const defaultIds = globals.map((g) => g.id);
  const visible = [...globals.filter((g) => !hiddenIds.has(g.id)), ...own];
  const hiddenDefaults = globals.filter((g) => hiddenIds.has(g.id));
  return { visible, hiddenDefaults, defaultIds };
};

/** Flat list of the items a user actually sees — used by the estimator. */
export const loadVisibleReferenceItems = async (userId?: string | null): Promise<ReferenceItem[]> => {
  return (await loadLibraryView(userId)).visible;
};

export const addOwnLibraryItem = async (item: ReferenceItem, userId?: string | null) => {
  if (!isSupabaseConfigured || !supabase) {
    saveOwnLibrary([...getOwnLibrary(), item]);
    return;
  }
  if (!userId) throw new Error('You must be signed in to add library items.');
  const { error } = await supabase.from('reference_library').insert({ id: item.id, user_id: userId, payload: item });
  if (error) throw error;
};

export const deleteOwnLibraryItem = async (id: string, userId?: string | null) => {
  if (!isSupabaseConfigured || !supabase) {
    saveOwnLibrary(getOwnLibrary().filter((i) => i.id !== id));
    return;
  }
  if (!userId) throw new Error('You must be signed in.');
  const { error } = await supabase.from('reference_library').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
};

export const hideDefaultItem = async (itemId: string, userId?: string | null) => {
  if (!isSupabaseConfigured || !supabase) {
    saveHiddenDefaults([...new Set([...getHiddenDefaults(), itemId])]);
    return;
  }
  if (!userId) throw new Error('You must be signed in.');
  const { error } = await supabase.from('hidden_default_items').upsert({ user_id: userId, item_id: itemId });
  if (error) throw error;
};

export const restoreDefaultItem = async (itemId: string, userId?: string | null) => {
  if (!isSupabaseConfigured || !supabase) {
    saveHiddenDefaults(getHiddenDefaults().filter((id) => id !== itemId));
    return;
  }
  if (!userId) throw new Error('You must be signed in.');
  const { error } = await supabase.from('hidden_default_items').delete().eq('user_id', userId).eq('item_id', itemId);
  if (error) throw error;
};

export const restoreAllDefaults = async (userId?: string | null) => {
  if (!isSupabaseConfigured || !supabase) {
    saveHiddenDefaults([]);
    return;
  }
  if (!userId) throw new Error('You must be signed in.');
  const { error } = await supabase.from('hidden_default_items').delete().eq('user_id', userId);
  if (error) throw error;
};

// Superadmin only (enforced by RLS): manage the shared global defaults.
export const addGlobalLibraryItem = async (item: ReferenceItem) => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Cloud mode required to edit global defaults.');
  const { error } = await supabase.from('reference_library').insert({ id: item.id, user_id: null, payload: item });
  if (error) throw error;
};

export const deleteGlobalLibraryItem = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Cloud mode required to edit global defaults.');
  const { error } = await supabase.from('reference_library').delete().eq('id', id).is('user_id', null);
  if (error) throw error;
};
