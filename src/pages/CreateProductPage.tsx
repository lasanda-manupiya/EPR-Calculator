import { useMemo, useState } from 'react';
import { getReferenceLibrary } from '@/utils/referenceLibraryStorage';
import { estimateProduct } from '@/utils/calculations';
import { MaterialType, PackagingLayer, PackagingType, Product } from '@/types';

const materials: MaterialType[] = ['Cardboard', 'Plastic', 'Paper', 'Glass', 'Aluminium', 'Steel', 'Wood', 'Other'];
const steps = ['Item Details', 'Item Size', 'Packaging Layers', 'Reference Match', 'Review Estimate'];

const newLayer = (n: number): PackagingLayer => ({
  id: crypto.randomUUID(),
  layerName: `Layer ${n}`,
  packagingType: 'primary',
  materialType: 'Cardboard',
  length: 0,
  width: 0,
  height: 0,
  unit: 'mm',
  estimatedWeight: 0,
  confidenceLevel: 'Low',
  estimationMethod: 'Pending estimation',
  warnings: [],
});

export default function CreateProductPage({ onSave }: { onSave: (p: Product) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(''); const [category, setCategory] = useState(''); const [sku, setSku] = useState(''); const [quantity, setQuantity] = useState(1);
  const [dimensions, setDimensions] = useState({ length: 0, width: 0, height: 0, unit: 'mm' as const });
  const [layerCount, setLayerCount] = useState(1);
  const [layers, setLayers] = useState<PackagingLayer[]>([newLayer(1)]);

  const referenceLibrary = useMemo(() => getReferenceLibrary(), []);
  const est = useMemo(() => estimateProduct({ id: 'draft', name, category, sku, quantity, dimensions, layers }, referenceLibrary), [name, category, sku, quantity, dimensions, layers, referenceLibrary]);

  const updateLayerCount = (count: number) => {
    const safe = Math.max(1, Math.floor(count || 1));
    setLayerCount(safe);
    setLayers((prev) => {
      if (prev.length === safe) return prev;
      if (prev.length > safe) return prev.slice(0, safe);
      const next = [...prev];
      for (let i = prev.length + 1; i <= safe; i += 1) next.push(newLayer(i));
      return next;
    });
  };

  const updateLayer = (idx: number, patch: Partial<PackagingLayer>) => setLayers((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const removeLayer = (id: string) => { const next = layers.filter((l) => l.id !== id); setLayers(next.length ? next : [newLayer(1)]); setLayerCount(next.length || 1); };

  const layeredForSave = layers.map((l) => {
    const e = est.layerEstimates.find((x) => x.layerId === l.id);
    return {
      ...l,
      estimatedWeight: e?.estimatedWeightPerUnit ?? 0,
      matchedReferenceId: e?.matchedReference?.id,
      matchedReferenceName: e?.matchedReference?.referenceName,
      confidenceLevel: e?.confidence ?? 'Low',
      estimationMethod: e?.method ?? 'No estimate',
      warnings: e?.warning ? [e.warning] : [],
    };
  });

  const save = () => onSave({ id: crypto.randomUUID(), name, category, sku, quantity, dimensions, layers: layeredForSave, estimation: est, createdAt: new Date().toISOString() });

  return <div className="space-y-5"><h2 className="text-2xl font-semibold">Create Product</h2>
    <div className="grid md:grid-cols-5 gap-2">{steps.map((s, i) => <div key={s} className={`px-3 py-2 rounded text-xs font-medium ${i === step ? 'bg-eco text-white' : 'bg-white'}`}>{i + 1}. {s}</div>)}</div>
    <div className="bg-white rounded-xl p-5 shadow space-y-4">
      {step === 0 && <div><h3 className="font-semibold mb-3">Item Details</h3><div className="grid md:grid-cols-2 gap-3"><input className="border p-2 rounded" placeholder="Item name" value={name} onChange={e => setName(e.target.value)} /><input className="border p-2 rounded" placeholder="Item category" value={category} onChange={e => setCategory(e.target.value)} /><input className="border p-2 rounded" placeholder="SKU or internal reference" value={sku} onChange={e => setSku(e.target.value)} /><input className="border p-2 rounded" type="number" placeholder="Quantity placed on market" value={quantity} onChange={e => setQuantity(Number(e.target.value) || 1)} /></div></div>}
      {step === 1 && <div><h3 className="font-semibold mb-3">Item Size</h3><div className="grid md:grid-cols-4 gap-3">{(['length', 'width', 'height'] as const).map(k => <input key={k} className="border p-2 rounded" type="number" placeholder={`Item ${k}`} value={dimensions[k]} onChange={e => setDimensions({ ...dimensions, [k]: Number(e.target.value) })} />)}<select className="border p-2 rounded" value={dimensions.unit} onChange={e => setDimensions({ ...dimensions, unit: e.target.value as 'mm' })}><option value="mm">mm</option><option value="cm">cm</option><option value="m">m</option></select></div></div>}
      {step === 2 && <div><h3 className="font-semibold mb-3">Packaging Layers</h3><div className="flex gap-2 items-center"><label>How many packaging layers does this item use?</label><input className="border p-2 rounded w-24" type="number" min={1} value={layerCount} onChange={e => updateLayerCount(Number(e.target.value))} /><button className="px-3 py-2 border rounded" onClick={() => updateLayerCount(layerCount + 1)}>Add layer</button></div>
      <div className="space-y-3 mt-4">{layers.map((l, idx) => { const e = est.layerEstimates.find((x) => x.layerId === l.id); return <div key={l.id} className="p-3 border rounded-lg space-y-2"><p className="font-medium">Layer {idx + 1}</p><div className="grid md:grid-cols-3 gap-2"><input className="border p-2 rounded" placeholder="Layer name" value={l.layerName} onChange={ev => updateLayer(idx, { layerName: ev.target.value })} /><select className="border p-2 rounded" value={l.packagingType} onChange={ev => updateLayer(idx, { packagingType: ev.target.value as PackagingType })}><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="tertiary">Tertiary</option></select><select className="border p-2 rounded" value={l.materialType} onChange={ev => updateLayer(idx, { materialType: ev.target.value as MaterialType })}>{materials.map(m => <option key={m}>{m}</option>)}</select><input className="border p-2 rounded" type="number" placeholder="Known packaging weight (g), optional" value={l.knownWeight ?? ''} onChange={ev => updateLayer(idx, { knownWeight: ev.target.value ? Number(ev.target.value) : undefined })} /></div><p className="text-xs text-slate-600">Matched reference preview: {e?.matchedReference?.referenceName ?? 'Pending'}</p><p className="text-xs text-slate-600">Estimated weight preview: {(e?.estimatedWeightPerUnit ?? 0).toFixed(2)} g</p><button className="text-red-600 text-sm" onClick={() => removeLayer(l.id)}>Remove layer</button></div>; })}</div></div>}
      {step === 3 && <div><h3 className="font-semibold mb-3">Reference Match</h3>{layers.map((l) => { const e = est.layerEstimates.find((x) => x.layerId === l.id); return <div key={l.id} className="border rounded p-3 mb-2 text-sm"><p className="font-medium">{l.layerName}</p><p>Matched reference item: {e?.matchedReference?.referenceName ?? 'None'}</p><p>Estimated weight per layer: {(e?.estimatedWeightPerUnit ?? 0).toFixed(2)} g</p><p>Confidence level: {e?.confidence ?? 'Low'}</p><p>Estimation method: {e?.method ?? 'No estimate'}</p>{e?.warning && <p className="text-amber-700">⚠ {e.warning}</p>}</div>; })}</div>}
      {step === 4 && <div><h3 className="font-semibold mb-3">Review Estimate</h3><p>Item: {name || '—'} | Category: {category || '—'} | SKU: {sku || '—'} | Quantity: {quantity}</p><p>Item dimensions: {dimensions.length} x {dimensions.width} x {dimensions.height} {dimensions.unit}</p><p>Total packaging weight per unit: {est.estimatedWeightPerUnit.toFixed(2)} g</p><p>Total packaging weight for quantity placed on market: {est.totalPackagingWeight.toFixed(2)} g</p><p>Material breakdown: {Object.entries(est.materialBreakdown).map(([k, v]) => `${k} ${v.toFixed(2)}g`).join(', ') || 'N/A'}</p><p>Packaging type breakdown: {Object.entries(est.packagingTypeBreakdown).map(([k, v]) => `${k} ${v.toFixed(2)}g`).join(', ') || 'N/A'}</p>{est.warnings.map(w => <p key={w} className="text-amber-700">⚠ {w}</p>)}</div>}
      <div className="border-t pt-3 text-sm"><p className="font-semibold">Live estimation: {est.totalPackagingWeight.toFixed(2)} g total ({est.overallConfidence} confidence)</p></div>
      <div className="flex gap-2"><button disabled={step === 0} onClick={() => setStep(step - 1)} className="px-3 py-2 border rounded">Back</button>{step < 4 ? <button onClick={() => setStep(step + 1)} className="px-3 py-2 bg-eco text-white rounded">Next</button> : <button onClick={save} className="px-3 py-2 bg-navy text-white rounded">Save product</button>}</div>
    </div></div>;
}
