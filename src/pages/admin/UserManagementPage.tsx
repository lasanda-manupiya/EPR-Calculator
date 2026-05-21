import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface CompanyOption { id: string; name: string; }

export default function UserManagementPage() {
  const { memberships, activeCompanyId, isSuperadmin, session } = useAuth();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [role, setRole] = useState<'admin' | 'supplier'>('supplier');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [confirmTemporaryPassword, setConfirmTemporaryPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    void supabase.from('companies').select('id,name').order('name').then(({ data }) => {
      const next = (data ?? []) as CompanyOption[];
      setCompanies(next);
      setCompanyId(activeCompanyId || next[0]?.id || '');
    });
  }, [activeCompanyId]);

  const selectableCompanies = isSuperadmin ? companies : companies.filter((c) => memberships.some((m) => m.companyId === c.id));
  const canSubmit = useMemo(() => !!companyId, [companyId]);

  const onCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!supabase || !session?.access_token) return setError('Supabase auth is not configured.');
    if (!isSuperadmin && role === 'admin') return setError('Only superadmin can create admin users.');
    if (!canSubmit) return setError('Please select a company.');
    if (temporaryPassword.length < 8) return setError('Temporary password must be at least 8 characters.');
    if (temporaryPassword !== confirmTemporaryPassword) return setError('Temporary password and confirmation must match.');

    setSubmitting(true);

    const response = await fetch('/api/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        role,
        company_id: companyId,
        temporary_password: temporaryPassword,
      }),
    });

    const result = (await response.json().catch(() => ({}))) as { error?: string };
    setSubmitting(false);

    if (!response.ok) return setError(result.error ?? 'Failed to create user.');

    setMessage('User created successfully. Share the temporary password securely.');
    setFullName('');
    setEmail('');
    setTemporaryPassword('');
    setConfirmTemporaryPassword('');
  };

  return <div className="space-y-6">
    <h2 className="text-2xl font-semibold">Access management & onboarding</h2>
    {error && <p className="text-amber-700 text-sm">{error}</p>}
    {message && <p className="text-emerald-700 text-sm">{message}</p>}
    <form onSubmit={onCreateUser} className="bg-white rounded-2xl p-5 shadow grid md:grid-cols-2 gap-3">
      <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="border rounded-lg p-2" placeholder="Full name" />
      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded-lg p-2" placeholder="user@domain.com" />
      <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'supplier')} className="border rounded-lg p-2">
        <option value="supplier">Supplier</option>{isSuperadmin && <option value="admin">Admin</option>}
      </select>
      <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="border rounded-lg p-2" required>
        {selectableCompanies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
      </select>
      <input required minLength={8} type="password" value={temporaryPassword} onChange={(e) => setTemporaryPassword(e.target.value)} className="border rounded-lg p-2" placeholder="Temporary password" />
      <input required minLength={8} type="password" value={confirmTemporaryPassword} onChange={(e) => setConfirmTemporaryPassword(e.target.value)} className="border rounded-lg p-2" placeholder="Confirm temporary password" />
      <button disabled={submitting} className="md:col-span-2 bg-slate-900 text-white rounded-lg py-2 disabled:opacity-50">{submitting ? 'Creating user...' : 'Create user'}</button>
    </form>
  </div>;
}
