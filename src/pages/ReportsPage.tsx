import { Product } from '@/types';

export default function ReportsPage({ products }: { products: Product[] }) {
  const materialTotals: Record<string, number> = {};
  const typeTotals: Record<string, number> = {};
  const warnings = new Set<string>();
  products.forEach(p=>{Object.entries(p.estimation.materialBreakdown).forEach(([k,v])=>materialTotals[k]=(materialTotals[k]||0)+v);Object.entries(p.estimation.packagingTypeBreakdown).forEach(([k,v])=>typeTotals[k]=(typeTotals[k]||0)+v);p.estimation.warnings.forEach(w=>warnings.add(w));});
  const exportCsv = () => {
    const rows = [['Product','Category','SKU','Quantity','Total Weight','Confidence'], ...products.map(p=>[p.name,p.category,p.sku,String(p.quantity),String(p.estimation.totalPackagingWeight),p.estimation.overallConfidence])];
    const blob = new Blob([rows.map(r=>r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sustainzone-epr-report.csv'; a.click(); URL.revokeObjectURL(a.href);
  };
  return <div className="space-y-5"><h2 className="text-2xl font-semibold">Reports</h2>
    <div className="bg-white p-5 rounded-xl shadow space-y-3"><p>Products assessed: {products.length}</p><p>Confidence summary: High {products.filter(p=>p.estimation.overallConfidence==='High').length}, Medium {products.filter(p=>p.estimation.overallConfidence==='Medium').length}, Low {products.filter(p=>p.estimation.overallConfidence==='Low').length}</p><p>Calculation assumptions: known weight takes priority, otherwise nearest reference by material and volume is used.</p>
    <div><h3 className="font-semibold">Total packaging weight by material</h3>{Object.entries(materialTotals).map(([k,v])=><p key={k}>{k}: {v.toFixed(2)} g</p>)}</div>
    <div><h3 className="font-semibold">Total packaging weight by packaging type</h3>{Object.entries(typeTotals).map(([k,v])=><p key={k}>{k}: {v.toFixed(2)} g</p>)}</div>
    <div><h3 className="font-semibold">Missing data warnings</h3>{[...warnings].map(w=><p key={w}>• {w}</p>)}</div>
    <div className="flex gap-2"><button className="px-3 py-2 bg-eco text-white rounded" onClick={exportCsv}>Export CSV</button><button className="px-3 py-2 bg-navy text-white rounded" onClick={()=>window.print()}>Print PDF</button></div>
    </div></div>;
}
