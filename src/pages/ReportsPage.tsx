import { Product } from '@/types';

export default function ReportsPage({ products }: { products: Product[] }) {
  const materialTotals: Record<string, number> = {};
  const typeTotals: Record<string, number> = {};
  const warnings = new Set<string>();
  const assumptions: string[] = [];

  products.forEach((p) => {
    Object.entries(p.estimation.materialBreakdown).forEach(([k, v]) => (materialTotals[k] = (materialTotals[k] || 0) + v));
    Object.entries(p.estimation.packagingTypeBreakdown).forEach(([k, v]) => (typeTotals[k] = (typeTotals[k] || 0) + v));
    p.layers.forEach((l) => {
      assumptions.push(`${p.name} / ${l.layerName}: ${l.estimationMethod}`);
      l.warnings.forEach((w) => warnings.add(`${p.name} / ${l.layerName}: ${w}`));
    });
    p.estimation.warnings.forEach((w) => warnings.add(`${p.name}: ${w}`));
  });

  const exportCsv = () => {
    const rows = [['Product', 'Category', 'SKU', 'Quantity', 'Layer Name', 'Packaging Type', 'Material', 'Known Weight', 'Estimated Weight', 'Matched Reference', 'Confidence', 'Estimation Method']];
    products.forEach((p) => p.layers.forEach((l) => rows.push([p.name, p.category, p.sku, String(p.quantity), l.layerName, l.packagingType, l.materialType, String(l.knownWeight ?? ''), String(l.estimatedWeight ?? 0), l.matchedReferenceName ?? '', l.confidenceLevel, l.estimationMethod])));
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sustainzone-epr-layer-report.csv'; a.click(); URL.revokeObjectURL(a.href);
  };

  return <div className="space-y-5"><h2 className="text-2xl font-semibold">Reports</h2>
    <div className="bg-white p-5 rounded-xl shadow space-y-3"><p>Items assessed: {products.length}</p>
      <div><h3 className="font-semibold">Weight by material</h3>{Object.entries(materialTotals).map(([k, v]) => <p key={k}>{k}: {v.toFixed(2)} g</p>)}</div>
      <div><h3 className="font-semibold">Weight by packaging type</h3>{Object.entries(typeTotals).map(([k, v]) => <p key={k}>{k}: {v.toFixed(2)} g</p>)}</div>
      <div><h3 className="font-semibold">Layer level assumptions</h3>{assumptions.map((a) => <p key={a}>• {a}</p>)}</div>
      <div><h3 className="font-semibold">Warnings</h3>{[...warnings].map((w) => <p key={w}>• {w}</p>)}</div>
      <div className="flex gap-2"><button className="px-3 py-2 bg-eco text-white rounded" onClick={exportCsv}>Export CSV</button><button className="px-3 py-2 bg-navy text-white rounded" onClick={() => window.print()}>Print PDF</button></div>
    </div></div>;
}
