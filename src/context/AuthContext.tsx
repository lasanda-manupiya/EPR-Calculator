import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface Membership {
  companyId: string;
  companyName: string;
  role: 'superadmin' | 'admin' | 'supplier';
}

interface AuthValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  memberships: Membership[];
  activeCompanyId: string | null;
  activeCompanyName: string | null;
  setActiveCompanyId: (companyId: string | null) => void;
  isSuperadmin: boolean;
  signUp: (email: string, password: string, metadata?: { name?: string; companyName?: string }) => Promise<{ needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(null);

  const loadMemberships = async (userId?: string) => {
    if (!supabase || !userId) {
      setMemberships([]);
      setActiveCompanyIdState(null);
      return;
    }
    const { data } = await supabase.from('company_admins').select('role, company_id, companies(name)').eq('user_id', userId);
    const next = (data ?? []).map((row: { role: Membership['role']; company_id: string; companies: { name: string } | { name: string }[] | null }) => ({
      role: row.role,
      companyId: row.company_id,
      companyName: Array.isArray(row.companies) ? row.companies[0]?.name ?? 'Unknown company' : row.companies?.name ?? 'Unknown company',
    }));
    setMemberships(next);
    setActiveCompanyIdState((current) => (current && next.some((m) => m.companyId === current) ? current : next[0]?.companyId ?? null));
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void loadMemberships(data.session?.user?.id);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadMemberships(nextSession?.user?.id);
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp: AuthValue['signUp'] = async (email, password, metadata) => {
    if (!supabase) throw new Error('Supabase auth is not configured.');
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name: metadata?.name, company_name: metadata?.companyName } } });
    if (error) throw error;
    return { needsEmailConfirmation: !data.session };
  };

  const signIn: AuthValue['signIn'] = async (email, password) => {
    if (!supabase) throw new Error('Supabase auth is not configured.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const isSuperadmin = memberships.some((m) => m.role === 'superadmin');
  const activeCompanyName = memberships.find((m) => m.companyId === activeCompanyId)?.companyName ?? null;
  const setActiveCompanyId = (companyId: string | null) => setActiveCompanyIdState(companyId);

  const value = useMemo(
    () => ({ user: session?.user ?? null, session, loading, signUp, signIn, signOut, memberships, activeCompanyId, activeCompanyName, setActiveCompanyId, isSuperadmin }),
    [session, loading, memberships, activeCompanyId, activeCompanyName, isSuperadmin],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
