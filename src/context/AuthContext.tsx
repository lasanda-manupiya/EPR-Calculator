import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface AuthValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: { name?: string; companyName?: string }) => Promise<{ needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp: AuthValue['signUp'] = async (email, password, metadata) => {
    if (!supabase) throw new Error('Supabase auth is not configured.');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: metadata?.name,
          company_name: metadata?.companyName,
        },
      },
    });
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

  const value = useMemo(() => ({ user: session?.user ?? null, session, loading, signUp, signIn, signOut }), [session, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
