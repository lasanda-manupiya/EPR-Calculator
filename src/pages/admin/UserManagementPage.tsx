import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthUserView {
  id: string;
  email: string | null;
  created_at?: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<AuthUserView[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ error: authError }) => {
      if (authError) setError(authError.message);
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

  return <div className="space-y-6"><h2 className="text-2xl font-semibold">Access management</h2><div className="bg-white p-5 rounded-2xl shadow space-y-3"><p className="text-sm text-slate-700">User accounts are now handled exclusively by Supabase Auth (email/password). New registrations are stored under Supabase Dashboard → Authentication → Users.</p>{error && <p className="text-amber-700 text-sm">{error}</p>}</div><div className="bg-white rounded-2xl p-4 shadow"><h4 className="font-semibold mb-3">Authenticated users {users.length ? `(${users.length})` : ''}</h4>{users.length === 0 ? <p className="text-sm text-slate-500">No user list is exposed to the client by default. To list users in-app, add a secure server endpoint or a protected SQL view populated by an admin workflow.</p> : users.map((u)=><p key={u.id} className="text-sm mt-2">{u.email} · {u.created_at}</p>)}</div></div>;
}
