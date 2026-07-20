import { ReactNode, useMemo } from 'react';
import {
  Area, AreaChart, Bar, BarChart, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ConfidenceLevel, Product } from '@/types';
import SubmissionNotice from '@/components/SubmissionNotice';
import EmptyState from '@/components/EmptyState';

const PALETTE = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#eab308', '#64748b'];
const MATERIAL_COLORS: Record<string, string> = {
  Cardboard: '#b45309', Paper: '#a16207', Plastic: '#3b82f6', Glass: '#06b6d4',
  Aluminium: '#94a3b8', Steel: '#475569', Wood: '#92400e', Other: '#10b981',
};
const TYPE_COLORS: Record<string, string> = { primary: '#10b981', secondary: '#3b82f6', tertiary: '#f59e0b' };
const CONFIDENCE_COLORS: Record<string, string> = { High: '#10b981', Medium: '#f59e0b', Low: '#ef4444' };

const fmtWeight = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(2)} kg` : `${n.toFixed(1)} g`);
const tooltipWeight = (v: unknown) => fmtWeight(Number(v));

function ChartCard({ title, subtitle, hasData, children }: { title: string; subtitle?: string; hasData: boolean; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow">
      <h3 className="font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mb-2">{subtitle}</p>}
      {hasData ? <div className="mt-2">{children}</div> : <p className="text-sm text-slate-400 py-10 text-center">No data yet.</p>}
    </div>
  );
}

export default function DashboardPage({ products }: { products: Product[] }) {
  const stats = useMemo(() => {
    const total = products.reduce((s, p) => s + p.estimation.totalPackagingWeight, 0);
    const allLayers = products.flatMap((p) => p.layers);

    const sumInto = (getter: (p: Product) => Record<string, number>) => {
      const acc: Record<string, number> = {};
      products.forEach((p) => Object.entries(getter(p)).forEach(([k, v]) => { acc[k] = (acc[k] || 0) + v; }));
      return acc;
    };

    const materialTotals = sumInto((p) => p.estimation.materialBreakdown);
    const typeTotals = sumInto((p) => p.estimation.packagingTypeBreakdown);

    const materialData = Object.entries(materialTotals).map(([name, value]) => ({ name, value: Number(value.toFixed(1)) }));
    const typeData = Object.entries(typeTotals)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), key: name, value: Number(value.toFixed(1)) }));

    const topProducts = [...products]
      .map((p) => ({ name: p.name || p.sku || 'Unnamed', weight: Number(p.estimation.totalPackagingWeight.toFixed(1)) }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 8);

    const confCounts: Record<ConfidenceLevel, number> = { High: 0, Medium: 0, Low: 0 };
    products.forEach((p) => { confCounts[p.estimation.overallConfidence] += 1; });
    const confidenceData = (['High', 'Medium', 'Low'] as ConfidenceLevel[])
      .map((name) => ({ name, value: confCounts[name] }))
      .filter((d) => d.value > 0);

    const categoryTotals: Record<string, number> = {};
    products.forEach((p) => { const c = p.category || 'Uncategorised'; categoryTotals[c] = (categoryTotals[c] || 0) + p.estimation.totalPackagingWeight; });
    const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({ name, weight: Number(value.toFixed(1)) }));

    const byDay = new Map<string, number>();
    [...products].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')).forEach((p) => {
      const day = (p.createdAt || '').slice(0, 10) || '—';
      byDay.set(day, (byDay.get(day) || 0) + p.estimation.totalPackagingWeight);
    });
    let cum = 0;
    const overTime = [...byDay.entries()].map(([day, w]) => { cum += w; return { day, cumulative: Number(cum.toFixed(1)) }; });

    const confScore = { High: 3, Medium: 2, Low: 1 } as const;
    const avgScore = allLayers.length ? allLayers.reduce((s, l) => s + confScore[l.confidenceLevel ?? 'Low'], 0) / allLayers.length : 0;
    const avgConfidence: ConfidenceLevel = avgScore >= 2.5 ? 'High' : avgScore >= 1.5 ? 'Medium' : 'Low';
    const mostUsedMaterial = materialData.slice().sort((a, b) => b.value - a.value)[0]?.name ?? 'N/A';

    return { total, allLayers, materialData, typeData, topProducts, confidenceData, categoryData, overTime, avgConfidence, mostUsedMaterial };
  }, [products]);

  const kpis: [string, string][] = [
    ['Items assessed', String(products.length)],
    ['Total packaging weight', fmtWeight(stats.total)],
    ['Total packaging layers', String(stats.allLayers.length)],
    ['Most used material', stats.mostUsedMaterial],
    ['Average confidence', products.length ? stats.avgConfidence : 'N/A'],
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>

      <div className="grid md:grid-cols-5 gap-4">
        {kpis.map(([k, v]) => (
          <div key={k} className="bg-white rounded-xl p-4 shadow">
            <p className="text-sm text-slate-500">{k}</p>
            <p className="text-xl font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <SubmissionNotice confidence={products.length ? stats.avgConfidence : null} count={products.length} />

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          message="Create your first product to populate your EPR dashboard with packaging weight, material breakdown, and confidence charts."
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <ChartCard title="Packaging weight by material" subtitle="Drives your EPR fees" hasData={stats.materialData.length > 0}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={stats.materialData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {stats.materialData.map((d) => <Cell key={d.name} fill={MATERIAL_COLORS[d.name] ?? '#64748b'} />)}
                </Pie>
                <Tooltip formatter={tooltipWeight} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Packaging weight by type" subtitle="Primary / secondary / tertiary" hasData={stats.typeData.length > 0}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={stats.typeData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {stats.typeData.map((d) => <Cell key={d.key} fill={TYPE_COLORS[d.key] ?? '#64748b'} />)}
                </Pie>
                <Tooltip formatter={tooltipWeight} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top products by packaging weight" subtitle="Biggest contributors" hasData={stats.topProducts.length > 0}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.topProducts} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" tickFormatter={(v) => fmtWeight(Number(v))} fontSize={11} />
                <YAxis type="category" dataKey="name" width={110} fontSize={11} />
                <Tooltip formatter={tooltipWeight} />
                <Bar dataKey="weight" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Estimate confidence" subtitle="Data quality across products" hasData={stats.confidenceData.length > 0}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={stats.confidenceData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {stats.confidenceData.map((d) => <Cell key={d.name} fill={CONFIDENCE_COLORS[d.name]} />)}
                </Pie>
                <Tooltip formatter={(v: unknown) => `${v} product(s)`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Packaging weight by category" subtitle="Weight per product category" hasData={stats.categoryData.length > 0}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.categoryData} margin={{ left: 10, right: 10 }}>
                <XAxis dataKey="name" fontSize={11} />
                <YAxis tickFormatter={(v) => fmtWeight(Number(v))} fontSize={11} width={60} />
                <Tooltip formatter={tooltipWeight} />
                <Bar dataKey="weight" radius={[4, 4, 0, 0]}>
                  {stats.categoryData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Packaging added over time" subtitle="Cumulative packaging weight" hasData={stats.overTime.length > 0}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.overTime} margin={{ left: 10, right: 10 }}>
                <XAxis dataKey="day" fontSize={11} />
                <YAxis tickFormatter={(v) => fmtWeight(Number(v))} fontSize={11} width={60} />
                <Tooltip formatter={tooltipWeight} />
                <Area type="monotone" dataKey="cumulative" stroke="#10b981" fill="#10b98133" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
