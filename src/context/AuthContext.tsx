import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Role } from '@/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface SignUpMeta {
  fullName: string;
  companyName?: string;
  inviteCode?: string;
  gdprConsent: boolean;
}

interface AuthValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** The single company the signed-in user belongs to (null until mapped). */
  activeCompanyId: string | null;
  activeCompanyName: string | null;
  role: Role | null;
  isSuperadmin: boolean;
  isAdmin: boolean; // admin or superadmin
  emailVerified: boolean;
  authIssue: string | null;
  signUp: (email: string, password: string, meta: SignUpMeta) => Promise<{ needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  refreshMembership: () => Promise<void>;
  /** When true, sign-in requires an emailed one-time code (2FA). */
  loginOtpEnabled: boolean;
  /** Verify the password, then email a one-time login code. No session is granted yet. */
  passwordThenSendOtp: (email: string, password: string) => Promise<void>;
  /** Re-send the one-time login code. */
  resendLoginOtp: (email: string) => Promise<void>;
  /** Complete sign-in by verifying the emailed code. */
  verifyLoginOtp: (email: string, token: string) => Promise<void>;
}

const LOGIN_OTP_ENABLED = import.meta.env.VITE_LOGIN_OTP === 'on';

const AuthContext = createContext<AuthValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [authIssue, setAuthIssue] = useState<string | null>(null);

  const loadMembership = async (userId?: string) => {
    if (!supabase || !userId) {
      setCompanyId(null);
      setCompanyName(null);
      setRole(null);
      return;
    }
    // One membership row per user. Parameterised query — no string building.
    const { data, error } = await supabase
      .from('company_members')
      .select('role, company_id, companies!inner(name)')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      setCompanyId(null);
      setCompanyName(null);
      setRole(null);
      setAuthIssue(`Failed to load your company: ${error.message}`);
      return;
    }
    if (!data) {
      setCompanyId(null);
      setCompanyName(null);
      setRole(null);
      setAuthIssue('Your account is not linked to a company yet. Ask your company admin for an invite code, or register a new company.');
      return;
    }
    const companies = data.companies as { name: string } | { name: string }[];
    setCompanyId(data.company_id);
    setCompanyName(Array.isArray(companies) ? companies[0]?.name ?? null : companies.name);
    setRole(data.role as Role);
    setAuthIssue(null);
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void loadMembership(data.session?.user?.id).finally(() => setLoading(false));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadMembership(nextSession?.user?.id).finally(() => setLoading(false));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp: AuthValue['signUp'] = async (email, password, meta) => {
    if (!supabase) throw new Error('Supabase auth is not configured.');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: meta.fullName,
          company_name: meta.companyName ?? null,
          invite_code: meta.inviteCode ?? null,
          gdpr_consent: meta.gdprConsent ? 'true' : 'false',
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

  const resendVerification = async (email: string) => {
    if (!supabase) throw new Error('Supabase auth is not configured.');
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  };

  // ---- Email 2FA on login (flag-gated) ----
  // 1) verify the password (fails on wrong password / unconfirmed email),
  // 2) drop that session so no access is granted yet,
  // 3) email a one-time code. A session is only created after verifyLoginOtp.
  const passwordThenSendOtp = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase auth is not configured.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await supabase.auth.signOut();
    const { error: otpErr } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (otpErr) throw otpErr;
  };

  const resendLoginOtp = async (email: string) => {
    if (!supabase) throw new Error('Supabase auth is not configured.');
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) throw error;
  };

  const verifyLoginOtp = async (email: string, token: string) => {
    if (!supabase) throw new Error('Supabase auth is not configured.');
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
  };

  const refreshMembership = async () => {
    await loadMembership(session?.user?.id);
  };

  const user = session?.user ?? null;
  const emailVerified = Boolean(user?.email_confirmed_at || (user as User & { confirmed_at?: string })?.confirmed_at);
  const isSuperadmin = role === 'superadmin';
  const isAdmin = role === 'admin' || role === 'superadmin';

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      activeCompanyId: companyId,
      activeCompanyName: companyName,
      role,
      isSuperadmin,
      isAdmin,
      emailVerified,
      authIssue,
      signUp,
      signIn,
      signOut,
      resendVerification,
      refreshMembership,
      loginOtpEnabled: LOGIN_OTP_ENABLED,
      passwordThenSendOtp,
      resendLoginOtp,
      verifyLoginOtp,
    }),
    [session, loading, companyId, companyName, role, isSuperadmin, isAdmin, emailVerified, authIssue],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
