import { useEffect, useState } from 'react';
import { loadSettings, saveSettingsRemote } from '@/utils/cloudStorage';

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState('');
  useEffect(() => { loadSettings().then((s) => setCompanyName(s.companyName)); }, []);
  return <div className="space-y-4"><h2 className="text-2xl font-semibold">Settings</h2>
  <div className="bg-white p-5 rounded-xl shadow max-w-lg space-y-3"><label className="text-sm">Company name</label><input className="border rounded p-2 w-full" value={companyName} onChange={e=>setCompanyName(e.target.value)} /><button className="px-3 py-2 bg-eco text-white rounded" onClick={()=>saveSettingsRemote({companyName})}>Save settings</button></div></div>;
}
