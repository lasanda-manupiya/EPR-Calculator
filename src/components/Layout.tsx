import { Link, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured, missingSupabaseConfig } from '@/lib/supabase';

interface NavItem { label: string; path: string; show: boolean; }

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, role, signOut, activeCompanyName, isAdmin, isSuperadmin, authIssue } = useAuth();

  const items: NavItem[] = [
    { label: 'Dashboard', path: '/', show: true },
    { label: 'Products', path: '/products', show: true },
    { label: 'Create Product', path: '/create-product', show: true },
    { label: 'Packaging Library', path: '/packaging-library', show: true },
    { label: 'Reports', path: '/reports', show: true },
    { label: 'Team & Invites', path: '/team', show: isAdmin },
    { label: 'Company Overview', path: '/overview', show: isSuperadmin },
    { label: 'Settings', path: '/settings', show: true },
    { label: 'Privacy', path: '/privacy', show: true },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="fixed left-0 top-0 h-full w-72 bg-slate-950 text-white p-6 shadow-2xl overflow-y-auto">
        <h1 className="text-2xl font-bold mb-1">SustainZone EPR</h1>
        <p className="text-xs text-slate-300">{user?.email}</p>
        <p className="text-xs text-slate-400 mb-4">
          {activeCompanyName ? <>{activeCompanyName} · <span className="capitalize">{role}</span></> : 'No company'}
        </p>

        {authIssue && <p className="text-xs mb-4 rounded px-2 py-1 bg-amber-500/20 text-amber-200">{authIssue}</p>}
        <p className={`text-xs mb-4 rounded px-2 py-1 ${isSupabaseConfigured ? 'bg-emerald-600/30 text-emerald-200' : 'bg-amber-500/20 text-amber-200'}`}>
          {isSupabaseConfigured ? 'Cloud mode: Supabase connected' : `Local mode: missing ${missingSupabaseConfig.url ? 'VITE_SUPABASE_URL' : ''}${missingSupabaseConfig.url && missingSupabaseConfig.anonKey ? ' + ' : ''}${missingSupabaseConfig.anonKey ? 'VITE_SUPABASE_ANON_KEY' : ''}`}
        </p>

        <nav className="space-y-2">
          {items.filter((i) => i.show).map((item) => {
            const active = pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`block rounded-lg px-3 py-2 text-sm ${active ? 'bg-emerald-500 text-slate-950 font-medium' : 'hover:bg-slate-800'}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button className="mt-8 w-full bg-slate-800 hover:bg-slate-700 rounded-lg py-2 text-sm" onClick={() => void signOut()}>Sign out</button>
      </aside>
      <main className="ml-72 w-full p-10 pb-20">{children}</main>
    </div>
  );
}
