import { FormEvent, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createCompanyWithAdmin, createMember, getCompanies, getUsers } from '@/utils/authStorage';

export default function UserManagementPage() {
  const { user, reload } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const users = useMemo(() => getUsers(), [message, error]);
  const companies = useMemo(() => getCompanies(), [message, error]);

  const createCompany = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      createCompanyWithAdmin(String(fd.get('companyName')), String(fd.get('adminName')), String(fd.get('adminEmail')), String(fd.get('adminPassword')));
      e.currentTarget.reset();
      setMessage('Company and admin created successfully.');
      setError('');
      reload();
    } catch (err) { setError((err as Error).message); setMessage(''); }
  };

  const createMemberSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    try {
      createMember(user, String(fd.get('name')), String(fd.get('email')), String(fd.get('password')));
      e.currentTarget.reset();
      setMessage('Member created successfully.');
      setError('');
    } catch (err) { setError((err as Error).message); setMessage(''); }
  };

  return <div className="space-y-6"><h2 className="text-2xl font-semibold">Access & company management</h2>{message && <p className="text-emerald-700">{message}</p>}{error && <p className="text-red-600">{error}</p>}
  {user?.role === 'super_admin' && <form onSubmit={createCompany} className="grid md:grid-cols-2 gap-3 bg-white p-5 rounded-2xl shadow"><h3 className="md:col-span-2 font-semibold">Create company + company admin</h3><input name="companyName" required className="border rounded-lg p-2" placeholder="Company name"/><input name="adminName" required className="border rounded-lg p-2" placeholder="Admin full name"/><input type="email" name="adminEmail" required className="border rounded-lg p-2" placeholder="Admin email"/><input type="password" name="adminPassword" required className="border rounded-lg p-2" placeholder="Admin password"/><button className="md:col-span-2 bg-emerald-600 text-white rounded-lg py-2">Create company</button></form>}
  {(user?.role === 'admin' || user?.role === 'member') && <form onSubmit={createMemberSubmit} className="grid md:grid-cols-2 gap-3 bg-white p-5 rounded-2xl shadow"><h3 className="md:col-span-2 font-semibold">Create member account</h3><input name="name" required className="border rounded-lg p-2" placeholder="Member name"/><input type="email" name="email" required className="border rounded-lg p-2" placeholder="Member email"/><input type="password" name="password" required className="border rounded-lg p-2" placeholder="Member password"/><button className="md:col-span-2 bg-slate-900 text-white rounded-lg py-2">Create member</button></form>}
  <div className="grid md:grid-cols-2 gap-4"><div className="bg-white rounded-2xl p-4 shadow"><h4 className="font-semibold">Companies ({companies.length})</h4>{companies.map(c=><p key={c.id} className="text-sm mt-2">{c.name}</p>)}</div><div className="bg-white rounded-2xl p-4 shadow"><h4 className="font-semibold">Users ({users.length})</h4>{users.map(u=><p key={u.id} className="text-sm mt-2">{u.name} · {u.role}</p>)}</div></div></div>;
}
