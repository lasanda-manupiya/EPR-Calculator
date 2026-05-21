import { useEffect, useState } from 'react';
import { loadSettings, saveSettingsRemote } from '@/utils/cloudStorage';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { activeCompanyId, activeCompanyName } = useAuth();
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    loadSettings(activeCompanyId).then((s) => setCompanyName(s.companyName));
  }, [activeCompanyId]);

  return <div className="space-y-4"><h2 className="text-2xl font-semibold">Settings</h2>
    <div className="bg-white p-5 rounded-xl shadow max-w-lg space-y-3">
      {!activeCompanyId && <p className="text-amber-700 text-sm">Select an active company before creating or editing records.</p>}
      <p className="text-sm text-slate-600">Active company: {activeCompanyName ?? 'Not selected'}</p>
      <label className="text-sm">Company name</label>
      <input className="border rounded p-2 w-full" value={companyName} onChange={e => setCompanyName(e.target.value)} />
      <button disabled={!activeCompanyId} className="px-3 py-2 bg-eco text-white rounded disabled:opacity-50" onClick={() => saveSettingsRemote({ companyName }, activeCompanyId)}>Save settings</button>
    </div>
  </div>;
}
