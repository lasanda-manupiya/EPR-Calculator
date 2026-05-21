import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface CompanyOption { id: string; name: string; }

export default function UserManagementPage() {
  const { memberships, activeCompanyId, isSuperadmin } = useAuth();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [role, setRole] = useState<'admin' | 'supplier'>('supplier');
  const [companyMode, setCompanyMode] = useState<'existing' | 'new'>('existing');
  const creatingAdmin = role === 'admin';

  useEffect(() => {
    if (!supabase) return;
    void supabase.from('companies').select('id,name').order('name').then(({ data }) => {
      const next = (data ?? []) as CompanyOption[];
      setCompanies(next);
      setCompanyId(activeCompanyId || next[0]?.id || '');
    });
  }, [activeCompanyId]);

  const selectableCompanies = isSuperadmin ? companies : companies.filter((c) => memberships.some((m) => m.companyId === c.id));
  const canSubmit = useMemo(() => creatingAdmin && companyMode === 'new' ? newCompanyName.trim().length > 1 : !!(companyId || activeCompanyId), [activeCompanyId, companyId, companyMode, creatingAdmin, newCompanyName]);

  const onCreateUser = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setMessage('');
    if (!supabase) return setError('Supabase auth is not configured.');
    if (!isSuperadmin && role === 'admin') return setError('Not allowed: only superadmin can create admin users.');
    if (!isSuperadmin && !activeCompanyId) return setError('Company not selected.');
    if (!canSubmit) return setError('Please select a company or enter a new company name.');

    const { error: rpcError } = await supabase.rpc('invite_company_user', {
      p_email: email.trim().toLowerCase(),
      p_full_name: fullName.trim(),
      p_role: role,
      p_company_id: creatingAdmin && companyMode === 'new' ? null : (companyId || activeCompanyId),
      p_company_name: creatingAdmin && companyMode === 'new' ? newCompanyName.trim() : null,
    });

    if (rpcError) return setError(`Supabase invite failed: ${rpcError.message}`);
    setMessage('Invitation created. Pending invitation until user accepts email and signs in.');
    setFullName(''); setEmail(''); setNewCompanyName('');
  };

  return <div className="space-y-6">
    <h2 className="text-2xl font-semibold">Access management & onboarding</h2>
    {error && <p className="text-amber-700 text-sm">{error}</p>}
    {message && <p className="text-emerald-700 text-sm">{message}</p>}
    <form onSubmit={onCreateUser} className="bg-white rounded-2xl p-5 shadow grid md:grid-cols-3 gap-3">
      <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="border rounded-lg p-2" placeholder="Full name" />
      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded-lg p-2" placeholder="user@domain.com" />
      <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'supplier')} className="border rounded-lg p-2">
        <option value="supplier">Supplier</option>{isSuperadmin && <option value="admin">Admin</option>}
      </select>
      {creatingAdmin && isSuperadmin && <div className="md:col-span-3 grid md:grid-cols-2 gap-3 border rounded-lg p-3 bg-slate-50">
        <select value={companyMode} onChange={(e) => setCompanyMode(e.target.value as 'existing' | 'new')} className="border rounded-lg p-2"><option value="existing">Assign to existing company</option><option value="new">Create new company for admin</option></select>
        {companyMode === 'new' ? <input required type="text" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} className="border rounded-lg p-2" placeholder="New company name" /> : <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="border rounded-lg p-2">{selectableCompanies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select>}
      </div>}
      {(!creatingAdmin || !isSuperadmin || companyMode === 'existing') && <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="border rounded-lg p-2 md:col-span-3" required>{selectableCompanies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select>}
      <button className="md:col-span-3 bg-slate-900 text-white rounded-lg py-2">Invite user</button>
    </form>
  </div>;
}
