import { useCallback, useEffect, useMemo, useState } from 'react';
import { MaterialType, PackagingType, ReferenceItem } from '@/types';
import {
  addGlobalLibraryItem,
  addOwnLibraryItem,
  deleteGlobalLibraryItem,
  deleteOwnLibraryItem,
  hideDefaultItem,
  LibraryView,
  loadLibraryView,
  restoreAllDefaults,
  restoreDefaultItem,
} from '@/utils/cloudStorage';
import { useAuth } from '@/context/AuthContext';

const emptyForm: Omit<ReferenceItem, 'id' | 'densityValue'> = {
  referenceName: '', materialType: 'Cardboard', packagingType: 'primary', length: 0, width: 0, height: 0, unit: 'mm', averageWeight: 0, notes: '',
};

const materials: MaterialType[] = ['Cardboard', 'Plastic', 'Paper', 'Glass', 'Aluminium', 'Steel', 'Wood', 'Other'];

export default function PackagingLibraryPage() {
  const { user, isSuperadmin } = useAuth();
  const [view, setView] = useState<LibraryView>({ visible: [], hiddenDefaults: [], defaultIds: [] });
  const [form, setForm] = useState(emptyForm);
  const [addAsShared, setAddAsShared] = useState(false);
  const [q, setQ] = useState(''); const [material, setMaterial] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setView(await loadLibraryView(user?.id));
    } catch (err) {
      setError((err as Error).message);
    }
  }, [user?.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  const defaultIdSet = useMemo(() => new Set(view.defaultIds), [view.defaultIds]);
  const filtered = useMemo(
    () => view.visible.filter((r) =>
      (!q || r.referenceName.toLowerCase().includes(q.toLowerCase())) &&
      (!material || r.materialType === material)),
    [view.visible, q, material],
  );

  const typeSections: { key: PackagingType; label: string }[] = [
    { key: 'primary', label: 'Primary packaging' },
    { key: 'secondary', label: 'Secondary packaging' },
    { key: 'tertiary', label: 'Tertiary packaging' },
  ];

  const rowFor = (r: ReferenceItem) => {
    const isDefault = defaultIdSet.has(r.id);
    return (
      <tr key={r.id} className="border-t">
        <td className="p-2">{r.referenceName}</td>
        <td className="text-center">{isDefault ? <span className="text-xs bg-slate-100 rounded px-2 py-0.5">Shared</span> : <span className="text-xs bg-emerald-100 text-emerald-800 rounded px-2 py-0.5">Mine</span>}</td>
        <td className="text-center">{r.materialType}</td>
        <td className="text-center">{r.length}×{r.width}×{r.height}</td>
        <td className="text-center">{r.averageWeight}</td>
        <td className="text-center">
          <button className="text-red-600 hover:underline" onClick={() => removeItem(r)}>
            {isDefault ? (isSuperadmin ? 'Delete' : 'Hide') : 'Delete'}
          </button>
        </td>
      </tr>
    );
  };

  const submit = async () => {
    setError('');
    if (!form.referenceName.trim()) return setError('Reference name is required.');
    const densityValue = form.length && form.width && form.height ? form.averageWeight / (form.length * form.width * form.height) : 0;
    const item: ReferenceItem = { id: crypto.randomUUID(), ...form, densityValue };
    try {
      if (addAsShared && isSuperadmin) await addGlobalLibraryItem(item);
      else await addOwnLibraryItem(item, user?.id);
      setForm(emptyForm);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const removeItem = async (item: ReferenceItem) => {
    setError('');
    try {
      if (defaultIdSet.has(item.id)) {
        if (isSuperadmin) await deleteGlobalLibraryItem(item.id); // permanently remove a shared default
        else await hideDefaultItem(item.id, user?.id);           // hide it just for me
      } else {
        await deleteOwnLibraryItem(item.id, user?.id);
      }
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Packaging Library</h2>
      <p className="text-sm text-slate-500">Shared defaults are visible to everyone. Items you add are private to you. You can hide defaults you don't need and restore them anytime.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl p-4 shadow space-y-3">
        <h3 className="font-semibold">Add a reference</h3>
        <div className="grid md:grid-cols-4 gap-2">
          <input className="border rounded px-3 py-2" placeholder="Reference name" value={form.referenceName} onChange={(e) => setForm({ ...form, referenceName: e.target.value })} />
          <select className="border rounded px-3 py-2" value={form.materialType} onChange={(e) => setForm({ ...form, materialType: e.target.value as MaterialType })}>{materials.map((m) => <option key={m}>{m}</option>)}</select>
          <select className="border rounded px-3 py-2" value={form.packagingType} onChange={(e) => setForm({ ...form, packagingType: e.target.value as PackagingType })}><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="tertiary">Tertiary</option></select>
          <input className="border rounded px-3 py-2" type="number" placeholder="Avg weight (g)" value={form.averageWeight} onChange={(e) => setForm({ ...form, averageWeight: Number(e.target.value) || 0 })} />
          {(['length', 'width', 'height'] as const).map((k) => <input key={k} className="border rounded px-3 py-2" type="number" placeholder={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) || 0 })} />)}
          <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 bg-eco text-white rounded" onClick={submit}>Add reference</button>
          {isSuperadmin && (
            <label className="text-sm flex items-center gap-1">
              <input type="checkbox" checked={addAsShared} onChange={(e) => setAddAsShared(e.target.checked)} />
              Add as shared default (visible to everyone)
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <input className="border rounded px-3 py-2" placeholder="Search reference" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="border rounded px-3 py-2" value={material} onChange={(e) => setMaterial(e.target.value)}><option value="">All materials</option>{[...new Set(view.visible.map((r) => r.materialType))].map((m) => <option key={m}>{m}</option>)}</select>
      </div>

      {typeSections.map(({ key, label }) => {
        const items = filtered.filter((r) => r.packagingType === key);
        return (
          <div key={key} className="bg-white rounded-xl shadow overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
              <h3 className="font-semibold text-slate-800">{label}</h3>
              <span className="text-xs text-slate-500">{items.length} item{items.length === 1 ? '' : 's'}</span>
            </div>
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No {key} references{material || q ? ' match your filter' : ' yet'}.</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-slate-500"><th className="p-2 text-left">Reference</th><th>Source</th><th>Material</th><th>Dimensions (mm)</th><th>Avg weight (g)</th><th>Actions</th></tr></thead>
                  <tbody>{items.map(rowFor)}</tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {view.hiddenDefaults.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Hidden defaults ({view.hiddenDefaults.length})</h3>
            <button className="text-sm text-emerald-700 hover:underline" onClick={async () => { await restoreAllDefaults(user?.id); await refresh(); }}>Restore all</button>
          </div>
          <ul className="text-sm divide-y">
            {view.hiddenDefaults.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-1">
                <span>{r.referenceName} <span className="text-slate-400">({r.materialType})</span></span>
                <button className="text-emerald-700 hover:underline" onClick={async () => { await restoreDefaultItem(r.id, user?.id); await refresh(); }}>Restore</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
