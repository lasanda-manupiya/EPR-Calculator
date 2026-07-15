import { useCallback, useEffect, useState } from 'react';
import { CompanyMember, InviteCode } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function TeamPage() {
  const { activeCompanyId, isSuperadmin, user } = useAuth();
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');
  const [maxUses, setMaxUses] = useState('');
  const [error, setError] = useState('');
  const [lastCode, setLastCode] = useState('');

  const refresh = useCallback(async () => {
    if (!supabase || !activeCompanyId) return;
    const [{ data: memberRows, error: mErr }, { data: codeRows }] = await Promise.all([
      supabase.from('company_members').select('id, user_id, full_name, role').eq('company_id', activeCompanyId),
      supabase.from('invite_codes').select('*').eq('company_id', activeCompanyId).order('created_at', { ascending: false }),
    ]);
    if (mErr) setError(mErr.message);
    const rows = (memberRows ?? []) as { id: string; user_id: string; full_name: string | null; role: CompanyMember['role'] }[];
    // Emails live in profiles (no direct FK to embed), so look them up separately.
    const ids = rows.map((r) => r.user_id);
    const emailById = new Map<string, string>();
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id, email').in('id', ids);
      (profs ?? []).forEach((p: { id: string; email: string | null }) => { if (p.email) emailById.set(p.id, p.email); });
    }
    setMembers(rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      fullName: r.full_name,
      role: r.role,
      email: emailById.get(r.user_id) ?? null,
    })));
    setCodes((codeRows ?? []).map((c: Record<string, unknown>) => ({
      id: c.id as string, code: c.code as string, role: c.role as 'admin' | 'member',
      createdAt: c.created_at as string, expiresAt: c.expires_at as string | null,
      maxUses: c.max_uses as number | null, usedCount: c.used_count as number, active: c.active as boolean,
    })));
  }, [activeCompanyId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const generateCode = async () => {
    setError('');
    setLastCode('');
    if (!supabase) return;
    const { data, error: err } = await supabase.rpc('create_invite_code', {
      p_role: newRole,
      p_max_uses: maxUses ? Number(maxUses) : null,
    });
    if (err) return setError(err.message);
    setLastCode(data as string);
    await refresh();
  };

  const deactivate = async (id: string) => {
    if (!supabase) return;
    const { error: err } = await supabase.from('invite_codes').update({ active: false }).eq('id', id);
    if (err) return setError(err.message);
    await refresh();
  };

  const removeMember = async (member: CompanyMember) => {
    if (!supabase) return;
    if (!window.confirm(`Remove ${member.email ?? member.fullName ?? 'this member'} from the company?`)) return;
    const { error: err } = await supabase.from('company_members').delete().eq('id', member.id);
    if (err) return setError(err.message);
    await refresh();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Team &amp; Invites</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl shadow p-5 space-y-3">
        <h3 className="font-semibold">Invite a teammate</h3>
        <p className="text-sm text-slate-500">Generate a code and share it. They enter it on the registration screen to join your company.</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">Role
            <select className="border rounded px-3 py-2 block mt-1" value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'member')}>
              <option value="member">Member</option>
              {isSuperadmin && <option value="admin">Admin</option>}
            </select>
          </label>
          <label className="text-sm">Max uses (blank = unlimited)
            <input className="border rounded px-3 py-2 block mt-1 w-40" type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
          </label>
          <button className="px-3 py-2 bg-emerald-600 text-white rounded" onClick={generateCode}>Generate code</button>
        </div>
        {lastCode && <p className="text-sm">New code: <span className="font-mono font-bold text-lg">{lastCode}</span> — share it securely.</p>}
      </div>

      <div className="bg-white rounded-xl shadow overflow-auto">
        <h3 className="font-semibold p-4 pb-0">Members</h3>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50"><th className="p-2 text-left">Email</th><th>Name</th><th>Role</th><th>Actions</th></tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-2">{m.email ?? '—'}</td>
                <td className="text-center">{m.fullName ?? '—'}</td>
                <td className="text-center capitalize">{m.role}</td>
                <td className="text-center">
                  {m.role !== 'superadmin' && m.userId !== user?.id
                    ? <button className="text-red-600 hover:underline" onClick={() => removeMember(m)}>Remove</button>
                    : <span className="text-slate-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow overflow-auto">
        <h3 className="font-semibold p-4 pb-0">Invite codes</h3>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50"><th className="p-2 text-left">Code</th><th>Role</th><th>Uses</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2 font-mono">{c.code}</td>
                <td className="text-center capitalize">{c.role}</td>
                <td className="text-center">{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}</td>
                <td className="text-center">{c.active ? <span className="text-emerald-700">active</span> : <span className="text-slate-400">disabled</span>}</td>
                <td className="text-center">{c.active && <button className="text-red-600 hover:underline" onClick={() => deactivate(c.id)}>Disable</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
