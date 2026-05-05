import { Link, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured, missingSupabaseConfig } from '@/lib/supabase';

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, signOut, hasRole, role } = useAuth();
  const items = [
    { label: 'Dashboard', path: '/' },
    { label: 'Products', path: '/products' },
    { label: 'Create Product', path: '/create-product' },
    { label: 'Packaging Library', path: '/packaging-library' },
    { label: 'Reports', path: '/reports' },
    ...(hasRole('admin', 'superadmin') ? [{ label: 'Access Management', path: '/access-management' }] : []),
    ...(hasRole('superadmin') ? [{ label: 'Superadmin Companies', path: '/superadmin/companies' }] : []),
    { label: 'Settings', path: '/settings' },
  ];
  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="fixed left-0 top-0 h-full w-72 bg-slate-950 text-white p-6 shadow-2xl">
        <h1 className="text-2xl font-bold mb-2">SustainZone EPR</h1>
        <p className="text-xs text-slate-300">{user?.email}</p><p className="text-xs text-emerald-300 mb-6">Role: {role ?? 'none'}</p>
        <p className={`text-xs mb-4 rounded px-2 py-1 ${isSupabaseConfigured ? 'bg-emerald-600/30 text-emerald-200' : 'bg-amber-500/20 text-amber-200'}`}>
          {isSupabaseConfigured ? 'Cloud mode: Supabase connected' : `Local mode: missing ${missingSupabaseConfig.url ? 'VITE_SUPABASE_URL' : ''}${missingSupabaseConfig.url && missingSupabaseConfig.anonKey ? ' + ' : ''}${missingSupabaseConfig.anonKey ? 'VITE_SUPABASE_ANON_KEY' : ''}`}
        </p>
        <nav className="space-y-2">{items.map((item) => <Link key={item.path} to={item.path} className={`block rounded-lg px-3 py-2 text-sm ${pathname === item.path ? 'bg-emerald-500 text-slate-950 font-medium' : 'hover:bg-slate-800'}`}>{item.label}</Link>)}</nav>
        <button className="mt-8 w-full bg-slate-800 hover:bg-slate-700 rounded-lg py-2 text-sm" onClick={() => void signOut()}>Sign out</button>
      </aside>
      <main className="ml-72 w-full p-10">{children}</main>
    </div>
  );
}
