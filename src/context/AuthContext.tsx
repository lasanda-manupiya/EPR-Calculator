import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type AppRole = 'superadmin' | 'admin' | 'member';

interface Membership {
  id: string;
  company_id: string;
  role: AppRole;
  status: 'active' | 'suspended' | 'removed';
}

interface AuthValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  memberships: Membership[];
  role: AppRole | null;
  hasRole: (...roles: AppRole[]) => boolean;
  signUp: (email: string, password: string, metadata?: { name?: string; companyName?: string }) => Promise<{ needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMemberships: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshMemberships = async () => {
    if (!supabase || !session?.user) return;
    const { data } = await supabase.from('company_memberships').select('id,company_id,role,status').eq('user_id', session.user.id).eq('status', 'active');
    setMemberships((data ?? []) as Membership[]);
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await refreshMemberships();
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) await refreshMemberships();
      else setMemberships([]);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, [session?.user?.id]);

  const signUp: AuthValue['signUp'] = async (email, password, metadata) => {
    if (!supabase) throw new Error('Supabase auth is not configured.');
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name: metadata?.name, company_name: metadata?.companyName } } });
    if (error) throw error;
    return { needsEmailConfirmation: !data.session };
  };
  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase auth is not configured.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };
  const signOut = async () => { if (supabase) await supabase.auth.signOut(); };

  const role = memberships.some((m) => m.role === 'superadmin') ? 'superadmin' : memberships.some((m) => m.role === 'admin') ? 'admin' : memberships.some((m) => m.role === 'member') ? 'member' : null;
  const hasRole = (...roles: AppRole[]) => (role ? roles.includes(role) : false);

  const value = useMemo(() => ({ user: session?.user ?? null, session, loading, memberships, role, hasRole, signUp, signIn, signOut, refreshMemberships }), [session, loading, memberships, role]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
