import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { UserAccount } from '@/types/auth';
import { getSession, getUsers, initializeAuth, saveSession } from '@/utils/authStorage';

interface AuthValue {
  user: UserAccount | null;
  signIn: (email: string, password: string) => void;
  signOut: () => void;
  reload: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);
initializeAuth();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const loadUser = (): UserAccount | null => {
    const session = getSession();
    if (!session) return null;
    return getUsers().find((u) => u.id === session.userId) ?? null;
  };
  const [user, setUser] = useState<UserAccount | null>(loadUser());

  const signIn = (email: string, password: string) => {
    const account = getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!account) throw new Error('Invalid credentials.');
    saveSession({ userId: account.id });
    setUser(account);
  };

  const signOut = () => { saveSession(null); setUser(null); };
  const reload = () => setUser(loadUser());

  const value = useMemo(() => ({ user, signIn, signOut, reload }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
