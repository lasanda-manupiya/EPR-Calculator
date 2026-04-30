import { Product } from '@/types';

export default function DashboardPage({ products }: { products: Product[] }) {
  const total = products.reduce((s, p) => s + p.estimation.totalPackagingWeight, 0);
  const materialCounts = products.flatMap((p) => p.components).reduce<Record<string, number>>((a, c) => ({ ...a, [c.materialType]: (a[c.materialType] || 0) + 1 }), {});
  const mostUsedMaterial = Object.entries(materialCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';
  const confMap = { High: 3, Medium: 2, Low: 1 };
  const avgScore = products.length ? products.reduce((s, p) => s + confMap[p.estimation.overallConfidence], 0) / products.length : 0;
  const avgConfidence = avgScore >= 2.5 ? 'High' : avgScore >= 1.5 ? 'Medium' : 'Low';

  return <div className="space-y-6"><h2 className="text-2xl font-semibold">Dashboard</h2>
    <div className="grid md:grid-cols-4 gap-4">
      {[
        ['Products assessed', String(products.length)],
        ['Total estimated packaging weight', `${total.toFixed(2)} g`],
        ['Most used material', mostUsedMaterial],
        ['Average confidence level', avgConfidence],
      ].map(([k, v]) => <div key={k} className="bg-white rounded-xl p-4 shadow"><p className="text-sm text-slate-500">{k}</p><p className="text-xl font-semibold">{v}</p></div>)}
    </div>
    <div className="bg-white rounded-xl p-6 shadow"><h3 className="font-semibold mb-4">Material breakdown</h3>
      <div className="space-y-3">{Object.entries(materialCounts).map(([m,c]) => <div key={m}><div className="flex justify-between text-sm"><span>{m}</span><span>{c}</span></div><div className="h-2 bg-slate-100 rounded"><div className="h-2 bg-eco rounded" style={{width:`${(c/Math.max(...Object.values(materialCounts)))*100}%`}}/></div></div>)}</div>
    </div>
  </div>;
}
