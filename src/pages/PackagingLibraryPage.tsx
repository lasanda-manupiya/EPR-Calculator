import { useState } from 'react';
import { referenceLibrary } from '@/data/referenceLibrary';

export default function PackagingLibraryPage() {
  const [q, setQ] = useState('');
  const [material, setMaterial] = useState('');
  const [ptype, setPtype] = useState('');
  const filtered = referenceLibrary.filter(r => (!q || r.referenceName.toLowerCase().includes(q.toLowerCase())) && (!material || r.materialType === material) && (!ptype || r.packagingType === ptype));
  return <div className="space-y-4"><h2 className="text-2xl font-semibold">Packaging Library</h2>
  <div className="flex gap-2"><input className="border rounded px-3 py-2" placeholder="Search reference" value={q} onChange={e=>setQ(e.target.value)} /><select className="border rounded px-3 py-2" value={material} onChange={e=>setMaterial(e.target.value)}><option value="">All materials</option>{[...new Set(referenceLibrary.map(r=>r.materialType))].map(m=><option key={m}>{m}</option>)}</select><select className="border rounded px-3 py-2" value={ptype} onChange={e=>setPtype(e.target.value)}><option value="">All packaging types</option><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="tertiary">Tertiary</option></select></div>
  <div className="bg-white rounded-xl shadow overflow-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50"><th className="p-2">Reference</th><th>Material</th><th>Type</th><th>Dimensions (mm)</th><th>Avg weight (g)</th></tr></thead><tbody>{filtered.map(r=><tr key={r.id} className="border-t"><td className="p-2">{r.referenceName}</td><td>{r.materialType}</td><td>{r.packagingType}</td><td>{r.length}×{r.width}×{r.height}</td><td>{r.averageWeight}</td></tr>)}</tbody></table></div></div>;
}
