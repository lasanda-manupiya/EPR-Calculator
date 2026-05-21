import { useEffect, useState } from 'react';
import { loadSettings, saveSettingsRemote } from '@/utils/cloudStorage';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { memberships, selectedCompanyId, setSelectedCompanyId } = useAuth();
  const [companyName, setCompanyName] = useState('');
  useEffect(() => { loadSettings(selectedCompanyId).then((s) => setCompanyName(s.companyName)); }, [selectedCompanyId]);
  return <div className="space-y-4"><h2 className="text-2xl font-semibold">Settings</h2>
  <div className="bg-white p-5 rounded-xl shadow max-w-lg space-y-3">
    <label className="text-sm">Active company</label>
    <select className="border rounded p-2 w-full" value={selectedCompanyId ?? ''} onChange={(e) => setSelectedCompanyId(e.target.value)}>
      {memberships.map((membership) => <option key={membership.companyId} value={membership.companyId}>{membership.companyName}</option>)}
    </select>
    <label className="text-sm">Company name</label><input className="border rounded p-2 w-full" value={companyName} onChange={e=>setCompanyName(e.target.value)} /><button className="px-3 py-2 bg-eco text-white rounded" onClick={()=>saveSettingsRemote({companyName}, selectedCompanyId)}>Save settings</button></div></div>;
}
