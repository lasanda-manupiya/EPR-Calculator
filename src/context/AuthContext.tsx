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
  authIssue: string | null;
  signUp: (email: string, password: string, metadata?: { name?: string; companyName?: string }) => Promise<{ needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);
const ACTIVE_COMPANY_KEY = 'epr_active_company_id';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(localStorage.getItem(ACTIVE_COMPANY_KEY));
  const [authIssue, setAuthIssue] = useState<string | null>(null);

  const setActiveCompanyId = (companyId: string | null) => {
    setActiveCompanyIdState(companyId);
    if (companyId) localStorage.setItem(ACTIVE_COMPANY_KEY, companyId);
    else localStorage.removeItem(ACTIVE_COMPANY_KEY);
  };

  const loadMemberships = async (userId?: string) => {
    if (!supabase || !userId) {
      setMemberships([]);
      setActiveCompanyId(null);
      return;
    }

    const { data, error } = await supabase
      .from('company_admins')
      .select('role, company_id, companies!inner(name)')
      .eq('user_id', userId);

    if (error) {
      setMemberships([]);
      setActiveCompanyId(null);
      setAuthIssue(`Failed to load company memberships: ${error.message}`);
      return;
    }

    const next = (data ?? []).map((row: { role: Membership['role']; company_id: string; companies: { name: string } | { name: string }[] }) => ({
      role: row.role,
      companyId: row.company_id,
      companyName: Array.isArray(row.companies) ? row.companies[0]?.name ?? 'Unknown company' : row.companies.name,
    }));

    setMemberships(next);
    const isSuper = next.some((m) => m.role === 'superadmin');
    const hasCurrent = !!activeCompanyId && next.some((m) => m.companyId === activeCompanyId);

    if (hasCurrent) {
      setAuthIssue(null);
      return;
    }

    if (next.length === 1) {
      setActiveCompanyId(next[0].companyId);
      setAuthIssue(null);
      return;
    }

    if (isSuper && next.length > 1) {
      setActiveCompanyId(null);
      setAuthIssue('Select an active company to continue.');
      return;
    }

    if (!next.length) {
      setActiveCompanyId(null);
      setAuthIssue('Your account has no company mapping yet. Contact your superadmin.');
      return;
    }

    setActiveCompanyId(next[0].companyId);
    setAuthIssue(null);
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void loadMemberships(data.session?.user?.id).finally(() => setLoading(false));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadMemberships(nextSession?.user?.id).finally(() => setLoading(false));
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

  const value = useMemo(
    () => ({ user: session?.user ?? null, session, loading, signUp, signIn, signOut, memberships, activeCompanyId, activeCompanyName, setActiveCompanyId, isSuperadmin, authIssue }),
    [session, loading, memberships, activeCompanyId, activeCompanyName, isSuperadmin, authIssue],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
