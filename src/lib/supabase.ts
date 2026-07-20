import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);
export const missingSupabaseConfig = {
  url: !url,
  anonKey: !anonKey,
};

// "Keep me signed in" support: when the flag is '0' the session lives in
// sessionStorage (cleared when the browser closes); otherwise localStorage
// (persists ~30 days via the refresh token). SignInPage sets the flag.
export const REMEMBER_KEY = 'epr_remember';

const rememberAwareStorage = {
  getItem: (key: string): string | null => {
    try {
      return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      const remember = window.localStorage.getItem(REMEMBER_KEY) !== '0';
      const target = remember ? window.localStorage : window.sessionStorage;
      const other = remember ? window.sessionStorage : window.localStorage;
      target.setItem(key, value);
      other.removeItem(key);
    } catch {
      /* storage unavailable */
    }
  },
  removeItem: (key: string): void => {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      /* storage unavailable */
    }
  },
};

export const supabase = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: rememberAwareStorage,
        storageKey: 'epr-auth',
      },
    })
  : null;

// Throwaway client used only to verify a password during login 2FA. It never
// persists a session, so verifying the password does not sign the user into the
// main app (which would otherwise flash the dashboard and cancel the OTP step).
export const supabaseAuthCheck = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'epr-authcheck',
      },
    })
  : null;
