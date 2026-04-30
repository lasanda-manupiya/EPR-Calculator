import { useMemo, useState } from 'react';
import { referenceLibrary } from '@/data/referenceLibrary';
import { estimateProduct } from '@/utils/calculations';
import { MaterialType, PackagingComponent, PackagingType, Product } from '@/types';

const materials: MaterialType[] = ['Cardboard','Plastic','Paper','Glass','Aluminium','Steel','Wood','Other'];
const steps = ['Product information', 'Product dimensions', 'Packaging material selection', 'Packaging component dimensions', 'Reference match and estimation', 'Review and save'];

export default function CreateProductPage({ onSave }: { onSave: (p: Product) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(''); const [category, setCategory] = useState(''); const [sku, setSku] = useState(''); const [quantity, setQuantity] = useState(1);
  const [dimensions, setDimensions] = useState({ length: 0, width: 0, height: 0, unit: 'mm' as const });
  const [components, setComponents] = useState<PackagingComponent[]>([]);
  const est = useMemo(()=>estimateProduct({ id:'draft', name, category, sku, quantity, dimensions, components }, referenceLibrary),[name,category,sku,quantity,dimensions,components]);
  const addComponent = () => setComponents([...components, { id: crypto.randomUUID(), materialType:'Cardboard', packagingType:'primary', length:0,width:0,height:0,unit:'mm' }]);

  const save = () => onSave({ id: crypto.randomUUID(), name, category, sku, quantity, dimensions, components, estimation: est, createdAt: new Date().toISOString() });

  return <div className="space-y-5"><h2 className="text-2xl font-semibold">Create Product</h2>
  <div className="flex gap-2">{steps.map((s, i) => <div key={s} className={`px-3 py-2 rounded text-xs ${i===step?'bg-eco text-white':'bg-white'}`}>{i+1}. {s}</div>)}</div>
  <div className="bg-white rounded-xl p-5 shadow space-y-4">
    {step===0 && <div className="grid md:grid-cols-2 gap-3"><input className="border p-2 rounded" placeholder="Product name" value={name} onChange={e=>setName(e.target.value)}/><input className="border p-2 rounded" placeholder="Product category" value={category} onChange={e=>setCategory(e.target.value)}/><input className="border p-2 rounded" placeholder="SKU or internal reference" value={sku} onChange={e=>setSku(e.target.value)}/><input className="border p-2 rounded" type="number" placeholder="Quantity placed on market" value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></div>}
    {step===1 && <div className="grid md:grid-cols-3 gap-3">{(['length','width','height'] as const).map(k=><input key={k} className="border p-2 rounded" type="number" placeholder={k} value={dimensions[k]} onChange={e=>setDimensions({...dimensions,[k]:Number(e.target.value)})}/>)}</div>}
    {step===2 && <button className="bg-navy text-white px-3 py-2 rounded" onClick={addComponent}>Add packaging component</button>}
    {(step===3 || step===4 || step===5) && components.map((c,idx)=><div key={c.id} className="grid md:grid-cols-4 gap-2 p-3 border rounded"><select className="border p-2 rounded" value={c.materialType} onChange={e=>{const n=[...components];n[idx].materialType=e.target.value as MaterialType;setComponents(n);}}>{materials.map(m=><option key={m}>{m}</option>)}</select><select className="border p-2 rounded" value={c.packagingType} onChange={e=>{const n=[...components];n[idx].packagingType=e.target.value as PackagingType;setComponents(n);}}><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="tertiary">Tertiary</option></select>{(['length','width','height'] as const).map(k=><input key={k} className="border p-2 rounded" type="number" placeholder={k} value={c[k] ?? 0} onChange={e=>{const n=[...components];n[idx][k]=Number(e.target.value);setComponents(n);}}/>)}<input className="border p-2 rounded" type="number" placeholder="Known weight (g) optional" value={c.knownWeight ?? ''} onChange={e=>{const n=[...components];n[idx].knownWeight=Number(e.target.value);setComponents(n);}}/></div>)}
    <div className="border-t pt-3 text-sm"><p className="font-semibold">Live estimation: {est.totalPackagingWeight.toFixed(2)} g total ({est.overallConfidence} confidence)</p>{est.warnings.map(w=><p key={w} className="text-amber-700">⚠ {w}</p>)}</div>
    <div className="flex gap-2"><button disabled={step===0} onClick={()=>setStep(step-1)} className="px-3 py-2 border rounded">Back</button>{step<5?<button onClick={()=>setStep(step+1)} className="px-3 py-2 bg-eco text-white rounded">Next</button>:<button onClick={save} className="px-3 py-2 bg-navy text-white rounded">Save product</button>}</div>
  </div></div>;
}
