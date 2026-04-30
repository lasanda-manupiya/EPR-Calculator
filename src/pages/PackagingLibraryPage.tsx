import { useEffect, useMemo, useState } from 'react';
import { MaterialType, PackagingType, ReferenceItem } from '@/types';
import { loadReferenceLibrary, saveReferenceLibraryRemote, seedReferenceLibraryIfNeeded } from '@/utils/cloudStorage';

const emptyForm: Omit<ReferenceItem, 'id' | 'densityValue'> = {
  referenceName: '', materialType: 'Cardboard', packagingType: 'primary', length: 0, width: 0, height: 0, unit: 'mm', averageWeight: 0, notes: ''
};

export default function PackagingLibraryPage() {
  const [q, setQ] = useState(''); const [material, setMaterial] = useState(''); const [ptype, setPtype] = useState('');
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { seedReferenceLibraryIfNeeded().then(() => loadReferenceLibrary().then(setItems)); }, []);

  const filtered = useMemo(() => items.filter(r => (!q || r.referenceName.toLowerCase().includes(q.toLowerCase())) && (!material || r.materialType === material) && (!ptype || r.packagingType === ptype)), [items, q, material, ptype]);

  const persist = async (next: ReferenceItem[]) => { setItems(next); await saveReferenceLibraryRemote(next); };
  const submit = async () => {
    const densityValue = form.length && form.width && form.height ? form.averageWeight / (form.length * form.width * form.height) : 0;
    if (editingId) {
      await persist(items.map(i => i.id === editingId ? { ...i, ...form, densityValue } : i));
    } else {
      await persist([...items, { id: crypto.randomUUID(), ...form, densityValue }]);
    }
    setEditingId(null); setForm(emptyForm);
  };

  return <div className="space-y-4"><h2 className="text-2xl font-semibold">Packaging Library</h2>
    <div className="bg-white rounded-xl p-4 shadow space-y-3"><h3 className="font-semibold">Add or Edit reference</h3>
      <div className="grid md:grid-cols-4 gap-2">
        <input className="border rounded px-3 py-2" placeholder="Reference name" value={form.referenceName} onChange={e => setForm({ ...form, referenceName: e.target.value })} />
        <select className="border rounded px-3 py-2" value={form.materialType} onChange={e => setForm({ ...form, materialType: e.target.value as MaterialType })}>{['Cardboard','Plastic','Paper','Glass','Aluminium','Steel','Wood','Other'].map(m => <option key={m}>{m}</option>)}</select>
        <select className="border rounded px-3 py-2" value={form.packagingType} onChange={e => setForm({ ...form, packagingType: e.target.value as PackagingType })}><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="tertiary">Tertiary</option></select>
        <input className="border rounded px-3 py-2" type="number" placeholder="Avg weight (g)" value={form.averageWeight} onChange={e => setForm({ ...form, averageWeight: Number(e.target.value) || 0 })} />
        {(['length','width','height'] as const).map(k => <input key={k} className="border rounded px-3 py-2" type="number" placeholder={k} value={form[k]} onChange={e => setForm({ ...form, [k]: Number(e.target.value) || 0 })} />)}
        <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      </div>
      <div className="flex gap-2"><button className="px-3 py-2 bg-eco text-white rounded" onClick={submit}>{editingId ? 'Update reference' : 'Add reference'}</button>{editingId && <button className="px-3 py-2 border rounded" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel edit</button>}</div>
    </div>

  <div className="flex gap-2"><input className="border rounded px-3 py-2" placeholder="Search reference" value={q} onChange={e=>setQ(e.target.value)} /><select className="border rounded px-3 py-2" value={material} onChange={e=>setMaterial(e.target.value)}><option value="">All materials</option>{[...new Set(items.map(r=>r.materialType))].map(m=><option key={m}>{m}</option>)}</select><select className="border rounded px-3 py-2" value={ptype} onChange={e=>setPtype(e.target.value)}><option value="">All packaging types</option><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="tertiary">Tertiary</option></select></div>
  <div className="bg-white rounded-xl shadow overflow-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50"><th className="p-2">Reference</th><th>Material</th><th>Type</th><th>Dimensions (mm)</th><th>Avg weight (g)</th><th>Actions</th></tr></thead><tbody>{filtered.map(r=><tr key={r.id} className="border-t"><td className="p-2">{r.referenceName}</td><td>{r.materialType}</td><td>{r.packagingType}</td><td>{r.length}×{r.width}×{r.height}</td><td>{r.averageWeight}</td><td><button className="text-blue-600" onClick={() => { setEditingId(r.id); setForm({ referenceName: r.referenceName, materialType: r.materialType, packagingType: r.packagingType, length: r.length, width: r.width, height: r.height, unit: r.unit, averageWeight: r.averageWeight, notes: r.notes }); }}>Edit</button></td></tr>)}</tbody></table></div></div>;
}
