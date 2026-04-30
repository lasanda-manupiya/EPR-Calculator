import { Link, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

const items = ['Dashboard', 'Products', 'Create Product', 'Packaging Library', 'Reports', 'Settings'];

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex">
      <aside className="fixed left-0 top-0 h-full w-64 bg-navy text-white p-6 shadow-lg">
        <h1 className="text-xl font-bold mb-8">SustainZone EPR</h1>
        <nav className="space-y-2">
          {items.map((label) => {
            const path = label === 'Dashboard' ? '/' : `/${label.toLowerCase().replace(/ /g, '-')}`;
            const active = pathname === path;
            return <Link key={label} to={path} className={`block rounded px-3 py-2 ${active ? 'bg-eco' : 'hover:bg-slate-700'}`}>{label}</Link>;
          })}
        </nav>
      </aside>
      <main className="ml-64 w-full p-8">{children}</main>
    </div>
  );
}
