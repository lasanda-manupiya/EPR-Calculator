import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface Membership { id: string; company_id: string; email: string | null; user_id: string | null; role: 'admin' | 'member' | 'superadmin'; status: 'active' | 'suspended' | 'removed' }

export default function UserManagementPage() {
  const { memberships: myMemberships } = useAuth();
  const [list, setList] = useState<Membership[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [error, setError] = useState('');

  const load = async (cid?: string) => {
    if (!supabase) return;
    const effective = cid || companyId;
    if (!effective) return;
    const { data, error: loadError } = await supabase.from('company_memberships').select('id,company_id,email,user_id,role,status').eq('company_id', effective);
    if (loadError) setError(loadError.message); else setList((data ?? []) as Membership[]);
  };

  useEffect(() => { if (myMemberships.length) { setCompanyId(myMemberships[0].company_id); void load(myMemberships[0].company_id); } }, [myMemberships.length]);

  const invite = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const { error: rpcError } = await supabase!.rpc('invite_user_to_company', { p_company_id: companyId, p_email: email, p_role: role });
    if (rpcError) setError(rpcError.message); else { setEmail(''); await load(); }
  };

  const updateStatus = async (userId: string, status: 'active' | 'suspended' | 'removed') => {
    const { error: rpcError } = await supabase!.rpc('update_membership_status', { p_company_id: companyId, p_user_id: userId, p_status: status });
    if (rpcError) setError(rpcError.message); else await load();
  };

  const updateRole = async (userId: string, nextRole: 'admin' | 'member') => {
    const { error: rpcError } = await supabase!.rpc('change_membership_role', { p_company_id: companyId, p_user_id: userId, p_role: nextRole });
    if (rpcError) setError(rpcError.message); else await load();
  };

  return <div className="space-y-4"><h2 className="text-2xl font-semibold">Company access management</h2>
    {error && <p className="text-red-600">{error}</p>}
    <form className="bg-white p-4 rounded-xl shadow grid md:grid-cols-3 gap-2" onSubmit={invite}>
      <input className="border rounded p-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Invite email" required />
      <select className="border rounded p-2" value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'member')}><option value="member">Member</option><option value="admin">Admin</option></select>
      <button className="bg-slate-900 text-white rounded p-2">Send invite</button>
    </form>
    <div className="bg-white p-4 rounded-xl shadow space-y-2">{list.map((m) => <div key={m.id} className="border rounded p-2 text-sm">
      <div>{m.email ?? m.user_id} · {m.role} · {m.status}</div>
      {m.user_id && <div className="flex gap-2 mt-2">
        <button className="px-2 py-1 bg-slate-200 rounded" onClick={() => void updateRole(m.user_id!, m.role === 'admin' ? 'member' : 'admin')}>Toggle role</button>
        <button className="px-2 py-1 bg-amber-200 rounded" onClick={() => void updateStatus(m.user_id!, m.status === 'active' ? 'suspended' : 'active')}>Toggle active</button>
        <button className="px-2 py-1 bg-rose-200 rounded" onClick={() => void updateStatus(m.user_id!, 'removed')}>Remove</button>
      </div>}
    </div>)}</div></div>;
}
