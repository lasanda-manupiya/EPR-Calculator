import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Company { id: string; name: string; created_at: string }

export default function SuperadminCompanyManagementPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('companies').select('id,name,created_at').order('created_at', { ascending: false });
    setCompanies((data ?? []) as Company[]);
  };
  useEffect(() => { void load(); }, []);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setMessage('');
    const { error: rpcError } = await supabase!.rpc('create_company_with_admin', { company_name: companyName, admin_email: adminEmail, admin_name: adminName });
    if (rpcError) setError(rpcError.message);
    else { setMessage('Company created and admin assigned/invited.'); setCompanyName(''); setAdminEmail(''); setAdminName(''); await load(); }
  };

  return <div className="space-y-4">
    <h2 className="text-2xl font-semibold">Superadmin company management</h2>
    {error && <p className="text-red-600">{error}</p>}
    {message && <p className="text-emerald-700">{message}</p>}
    <form onSubmit={onCreate} className="bg-white p-4 rounded-xl shadow grid gap-3 md:grid-cols-3">
      <input className="border rounded p-2" placeholder="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
      <input className="border rounded p-2" placeholder="First admin email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
      <input className="border rounded p-2" placeholder="First admin name" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
      <button className="md:col-span-3 bg-slate-900 text-white rounded p-2">Create company</button>
    </form>
    <div className="bg-white p-4 rounded-xl shadow"><h3 className="font-semibold mb-2">Companies</h3>{companies.map((c) => <p key={c.id}>{c.name}</p>)}</div>
  </div>;
}
