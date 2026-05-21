import { FormEvent, useEffect, useState } from 'react';
import { loadSettings, saveSettingsRemote } from '@/utils/cloudStorage';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const { activeCompanyId, activeCompanyName } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    loadSettings(activeCompanyId).then((s) => setCompanyName(s.companyName));
  }, [activeCompanyId]);

  const onUpdatePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (!supabase) return setPasswordError('Supabase auth is not configured.');
    if (password.length < 8) return setPasswordError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setPasswordError('Password and confirmation must match.');

    const { error } = await supabase.auth.updateUser({
      password,
      data: { force_password_change: false },
    });

    if (error) return setPasswordError(error.message);
    setPassword('');
    setConfirmPassword('');
    setPasswordMessage('Password updated successfully.');
  };

  return <div className="space-y-4"><h2 className="text-2xl font-semibold">Settings</h2>
    <div className="bg-white p-5 rounded-xl shadow max-w-lg space-y-3">
      {!activeCompanyId && <p className="text-amber-700 text-sm">Select an active company before creating or editing records.</p>}
      <p className="text-sm text-slate-600">Active company: {activeCompanyName ?? 'Not selected'}</p>
      <label className="text-sm">Company name</label>
      <input className="border rounded p-2 w-full" value={companyName} onChange={e => setCompanyName(e.target.value)} />
      <button disabled={!activeCompanyId} className="px-3 py-2 bg-eco text-white rounded disabled:opacity-50" onClick={() => saveSettingsRemote({ companyName }, activeCompanyId)}>Save settings</button>
    </div>

    <form onSubmit={onUpdatePassword} className="bg-white p-5 rounded-xl shadow max-w-lg space-y-3">
      <h3 className="text-lg font-medium">Change password</h3>
      {passwordError && <p className="text-amber-700 text-sm">{passwordError}</p>}
      {passwordMessage && <p className="text-emerald-700 text-sm">{passwordMessage}</p>}
      <input className="border rounded p-2 w-full" type="password" minLength={8} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <input className="border rounded p-2 w-full" type="password" minLength={8} placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
      <button className="px-3 py-2 bg-slate-900 text-white rounded">Update password</button>
    </form>
  </div>;
}
