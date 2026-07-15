import { useEffect, useState } from 'react';
import { Product } from '@/types';
import { supabase } from '@/lib/supabase';

interface CompanyRow { id: string; name: string; }
interface ProductRow { company_id: string; payload: Product; }

interface CompanySummary {
  id: string;
  name: string;
  memberCount: number;
  products: Product[];
  totalWeight: number;
}

export default function SuperadminOverviewPage() {
  const [rows, setRows] = useState<CompanySummary[]>([]);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const [{ data: companies, error: cErr }, { data: products }, { data: members }] = await Promise.all([
        supabase.from('companies').select('id, name').order('name'),
        supabase.from('products').select('company_id, payload'),
        supabase.from('company_members').select('company_id'),
      ]);
      if (cErr) return setError(cErr.message);

      const memberCounts = new Map<string, number>();
      (members ?? []).forEach((m: { company_id: string }) => memberCounts.set(m.company_id, (memberCounts.get(m.company_id) ?? 0) + 1));

      const byCompany = new Map<string, Product[]>();
      (products as ProductRow[] ?? []).forEach((p) => {
        const list = byCompany.get(p.company_id) ?? [];
        list.push(p.payload);
        byCompany.set(p.company_id, list);
      });

      setRows((companies as CompanyRow[] ?? []).map((c) => {
        const list = byCompany.get(c.id) ?? [];
        return {
          id: c.id,
          name: c.name,
          memberCount: memberCounts.get(c.id) ?? 0,
          products: list,
          totalWeight: list.reduce((s, p) => s + (p.estimation?.totalPackagingWeight ?? 0), 0),
        };
      }));
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Company Overview</h2>
      <p className="text-sm text-slate-500">All companies and their data (superadmin view).</p>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl shadow p-4"><p className="text-xs text-slate-500">Companies</p><p className="text-2xl font-bold">{rows.length}</p></div>
        <div className="bg-white rounded-xl shadow p-4"><p className="text-xs text-slate-500">Total products</p><p className="text-2xl font-bold">{rows.reduce((s, r) => s + r.products.length, 0)}</p></div>
        <div className="bg-white rounded-xl shadow p-4"><p className="text-xs text-slate-500">Total members</p><p className="text-2xl font-bold">{rows.reduce((s, r) => s + r.memberCount, 0)}</p></div>
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="bg-white rounded-xl shadow">
            <button className="w-full flex items-center justify-between p-4 text-left" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
              <span className="font-medium">{r.name}</span>
              <span className="text-sm text-slate-500">{r.memberCount} member(s) · {r.products.length} product(s) · {Math.round(r.totalWeight)} g total</span>
            </button>
            {expanded === r.id && (
              <div className="border-t overflow-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50"><th className="p-2 text-left">Product</th><th>SKU</th><th>Qty</th><th>Packaging weight (g)</th></tr></thead>
                  <tbody>
                    {r.products.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="p-2">{p.name}</td>
                        <td className="text-center">{p.sku}</td>
                        <td className="text-center">{p.quantity}</td>
                        <td className="text-center">{Math.round(p.estimation?.totalPackagingWeight ?? 0)}</td>
                      </tr>
                    ))}
                    {r.products.length === 0 && <tr><td colSpan={4} className="p-3 text-center text-slate-400">No products yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
