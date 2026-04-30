const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);
export const missingSupabaseConfig = {
  url: !url,
  anonKey: !anonKey,
};

const headers = {
  apikey: anonKey,
  Authorization: `Bearer ${anonKey}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

export const supabaseFetch = async (path: string, init?: RequestInit) => {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const response = await fetch(`${url}/rest/v1/${path}`, { ...init, headers: { ...headers, ...(init?.headers || {}) } });
  if (!response.ok) throw new Error(await response.text());
  return response;
};
