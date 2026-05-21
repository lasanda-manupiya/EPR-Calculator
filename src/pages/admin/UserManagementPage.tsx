import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthUserView {
  id: string;
  email: string | null;
  created_at?: string;
}

interface CompanyOption {
  id: string;
  name: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<AuthUserView[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [role, setRole] = useState<'admin' | 'supplier'>('supplier');
  const [companyMode, setCompanyMode] = useState<'existing' | 'new'>('existing');

  const creatingAdmin = role === 'admin';

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ error: authError }) => {
      if (authError) setError(authError.message);
    });

    supabase
      .from('companies')
      .select('id,name')
      .order('name', { ascending: true })
      .then(({ data }) => {
        const next = (data ?? []) as CompanyOption[];
        setCompanies(next);
        if (next.length) setCompanyId(next[0].id);
      });

    supabase
      .from('auth_users_view')
      .select('id,email,created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: tableError }) => {
        if (tableError) {
          setError('Supabase Auth users are managed in Authentication → Users. Optional DB view auth_users_view is not available.');
          return;
        }
        setUsers((data ?? []) as AuthUserView[]);
      });
  }, []);

  const canSubmit = useMemo(() => {
    if (!creatingAdmin) return !!companyId;
    if (companyMode === 'new') return newCompanyName.trim().length > 1;
    return !!companyId;
  }, [companyId, companyMode, creatingAdmin, newCompanyName]);

  const onCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!supabase) {
      setError('Supabase auth is not configured.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!canSubmit) {
      setError('Please select an existing company or enter a new company name.');
      return;
    }

    const metadata: Record<string, string> = {
      name: fullName.trim(),
      invited_role: role,
    };

    if (creatingAdmin && companyMode === 'new') {
      metadata.invited_company_name = newCompanyName.trim();
    } else {
      metadata.invited_company_id = companyId;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: metadata,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    const needsEmailConfirmation = !data.session;
    setMessage(needsEmailConfirmation ? 'User created. They must confirm their email before signing in.' : 'User created successfully.');
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setNewCompanyName('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Access management & onboarding</h2>

      <div className="bg-white p-5 rounded-2xl shadow space-y-3">
        <p className="text-sm text-slate-700">Structure: Super Admin → Company Admin → Supplier. Use this screen to invite company admins/suppliers and assign access by company. Admins and suppliers can add products; admins can monitor everything for their company in one place.</p>
        {error && <p className="text-amber-700 text-sm">{error}</p>}
        {message && <p className="text-emerald-700 text-sm">{message}</p>}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow space-y-4">
        <h4 className="font-semibold">Create authenticated user</h4>
        <p className="text-sm text-slate-600">Create admin/supplier users for a selected company. Super admin can assign an admin to an existing company or create a new company while creating the admin account.</p>
        <form onSubmit={onCreateUser} className="grid md:grid-cols-3 gap-3">
          <input
            required
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="border rounded-lg p-2"
            placeholder="Full name"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-lg p-2"
            placeholder="user@any-domain.com"
          />
          <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'supplier')} className="border rounded-lg p-2">
            <option value="supplier">Supplier</option>
            <option value="admin">Admin</option>
          </select>

          {creatingAdmin && (
            <div className="md:col-span-3 grid md:grid-cols-2 gap-3 rounded-lg border p-3 bg-slate-50">
              <select value={companyMode} onChange={(e) => setCompanyMode(e.target.value as 'existing' | 'new')} className="border rounded-lg p-2">
                <option value="existing">Assign to existing company</option>
                <option value="new">Create new company for this admin</option>
              </select>
              {companyMode === 'new' ? (
                <input
                  required
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="border rounded-lg p-2"
                  placeholder="New company name"
                />
              ) : (
                <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="border rounded-lg p-2" required>
                  {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                </select>
              )}
            </div>
          )}

          {!creatingAdmin && (
            <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="border rounded-lg p-2 md:col-span-3" required>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          )}

          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded-lg p-2"
            placeholder="Temporary password"
          />
          <input
            required
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border rounded-lg p-2"
            placeholder="Confirm password"
          />
          <button className="md:col-span-3 bg-slate-900 text-white rounded-lg py-2">Create user</button>
        </form>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow">
        <h4 className="font-semibold mb-3">Authenticated users {users.length ? `(${users.length})` : ''}</h4>
        {users.length === 0 ? (
          <p className="text-sm text-slate-500">No user list is exposed to the client by default. To list users in-app, add a secure server endpoint or a protected SQL view populated by an admin workflow.</p>
        ) : (
          users.map((u) => <p key={u.id} className="text-sm mt-2">{u.email} · {u.created_at}</p>)
        )}
      </div>
    </div>
  );
}
