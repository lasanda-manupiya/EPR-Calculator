import { Product } from '@/types';

export default function DashboardPage({ products }: { products: Product[] }) {
  const total = products.reduce((s, p) => s + p.estimation.totalPackagingWeight, 0);
  const allLayers = products.flatMap((p) => p.layers);
  const materialCounts = allLayers.reduce<Record<string, number>>((a, c) => ({ ...a, [c.materialType]: (a[c.materialType] || 0) + 1 }), {});
  const mostUsedMaterial = Object.entries(materialCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';
  const confMap = { High: 3, Medium: 2, Low: 1 };
  const avgScore = allLayers.length ? allLayers.reduce((s, l) => s + confMap[l.confidenceLevel ?? 'Low'], 0) / allLayers.length : 0;
  const avgConfidence = avgScore >= 2.5 ? 'High' : avgScore >= 1.5 ? 'Medium' : 'Low';

  return <div className="space-y-6"><h2 className="text-2xl font-semibold">Dashboard</h2>
    <div className="grid md:grid-cols-5 gap-4">
      {[
        ['Items assessed', String(products.length)],
        ['Total packaging weight', `${total.toFixed(2)} g`],
        ['Total packaging layers', String(allLayers.length)],
        ['Most used material', mostUsedMaterial],
        ['Average confidence', avgConfidence],
      ].map(([k, v]) => <div key={k} className="bg-white rounded-xl p-4 shadow"><p className="text-sm text-slate-500">{k}</p><p className="text-xl font-semibold">{v}</p></div>)}
    </div>
  </div>;
}
