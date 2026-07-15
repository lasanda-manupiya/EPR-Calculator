import { FormEvent, useEffect, useState } from 'react';
import { loadSettings, saveSettingsRemote } from '@/utils/cloudStorage';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const { activeCompanyId, activeCompanyName, isAdmin, user, signOut } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [gdprError, setGdprError] = useState('');

  useEffect(() => {
    loadSettings(activeCompanyId).then((s) => setCompanyName(s.companyName));
  }, [activeCompanyId]);

  const onSaveSettings = async () => {
    setSavedMsg('');
    try {
      await saveSettingsRemote({ companyName }, activeCompanyId);
      setSavedMsg('Settings saved.');
    } catch (err) {
      setSavedMsg((err as Error).message);
    }
  };

  const onUpdatePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (!supabase) return setPasswordError('Supabase auth is not configured.');
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return setPasswordError('Password must be at least 8 characters and include letters and numbers.');
    }
    if (password !== confirmPassword) return setPasswordError('Password and confirmation must match.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setPasswordError(error.message);
    setPassword('');
    setConfirmPassword('');
    setPasswordMessage('Password updated successfully.');
  };

  const exportMyData = async () => {
    setGdprError('');
    try {
      const bundle: Record<string, unknown> = { exportedAt: new Date().toISOString(), account: { id: user?.id, email: user?.email } };
      if (supabase) {
        const [{ data: profile }, { data: myLibrary }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user?.id ?? '').maybeSingle(),
          supabase.from('reference_library').select('payload').eq('user_id', user?.id ?? ''),
        ]);
        bundle.profile = profile ?? null;
        bundle.myLibraryItems = (myLibrary ?? []).map((r: { payload: unknown }) => r.payload);
      }
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sustainzone-my-data.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setGdprError((err as Error).message);
    }
  };

  const deleteMyData = async () => {
    setGdprError('');
    if (!supabase) return setGdprError('Cloud mode required.');
    const confirmed = window.confirm(
      'This permanently deletes your personal data (your library items and membership). If you are the last member of your company, the company and its products are deleted too. Continue?',
    );
    if (!confirmed) return;
    const { error } = await supabase.rpc('delete_my_data');
    if (error) return setGdprError(error.message);
    await signOut();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Settings</h2>

      <div className="bg-white p-5 rounded-xl shadow max-w-lg space-y-3">
        <p className="text-sm text-slate-600">Company: <span className="font-medium">{activeCompanyName ?? 'Not linked'}</span></p>
        <label className="text-sm">Company name</label>
        <input className="border rounded p-2 w-full disabled:bg-slate-100" value={companyName} disabled={!isAdmin} onChange={(e) => setCompanyName(e.target.value)} />
        {!isAdmin && <p className="text-xs text-slate-400">Only company admins can change company settings.</p>}
        {savedMsg && <p className="text-sm text-emerald-700">{savedMsg}</p>}
        <button disabled={!isAdmin || !activeCompanyId} className="px-3 py-2 bg-eco text-white rounded disabled:opacity-50" onClick={onSaveSettings}>Save settings</button>
      </div>

      <form onSubmit={onUpdatePassword} className="bg-white p-5 rounded-xl shadow max-w-lg space-y-3">
        <h3 className="text-lg font-medium">Change password</h3>
        {passwordError && <p className="text-amber-700 text-sm">{passwordError}</p>}
        {passwordMessage && <p className="text-emerald-700 text-sm">{passwordMessage}</p>}
        <input className="border rounded p-2 w-full" type="password" minLength={8} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <input className="border rounded p-2 w-full" type="password" minLength={8} placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        <button className="px-3 py-2 bg-slate-900 text-white rounded">Update password</button>
      </form>

      <div className="bg-white p-5 rounded-xl shadow max-w-lg space-y-3">
        <h3 className="text-lg font-medium">Your data (GDPR)</h3>
        <p className="text-sm text-slate-600">You can download a copy of your personal data, or permanently delete it.</p>
        {gdprError && <p className="text-sm text-red-600">{gdprError}</p>}
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={exportMyData}>Download my data</button>
          <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={deleteMyData}>Delete my data</button>
        </div>
      </div>
    </div>
  );
}
