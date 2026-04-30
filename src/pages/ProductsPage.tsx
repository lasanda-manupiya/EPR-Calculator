import { Product } from '@/types';

export default function ProductsPage({ products, onDelete }: { products: Product[]; onDelete: (id: string) => void }) {
  return <div className="space-y-4"><h2 className="text-2xl font-semibold">Products</h2>
  <div className="bg-white rounded-xl shadow overflow-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr>{['Product name','Category','SKU','Quantity','Total estimated packaging weight','Confidence','Actions'].map(h=><th key={h} className="text-left p-3">{h}</th>)}</tr></thead><tbody>
    {products.map((p)=><tr key={p.id} className="border-t"><td className="p-3">{p.name}</td><td className="p-3">{p.category}</td><td className="p-3">{p.sku}</td><td className="p-3">{p.quantity}</td><td className="p-3">{p.estimation.totalPackagingWeight.toFixed(2)} g</td><td className="p-3"><span className="px-2 py-1 rounded bg-slate-100">{p.estimation.overallConfidence}</span></td><td className="p-3"><button className="text-red-600" onClick={()=>onDelete(p.id)}>Delete</button></td></tr>)
    }
  </tbody></table></div></div>;
}
