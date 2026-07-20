import { ReactNode } from 'react';
import { BrandLogo, LeafMark } from '@/components/BrandLogo';

/**
 * Blank-page placeholder with a faint EPR Calculator logo watermark on a soft
 * gradient, so pages don't look empty before any data exists.
 */
export default function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-mist shadow-sm">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.07]">
        <BrandLogo
          src="/epr-calculator-logo.png"
          alt=""
          className="w-72 h-72 object-contain"
          fallback={<LeafMark className="w-56 h-56" />}
        />
      </div>
      <div className="relative z-10 px-8 py-16 text-center">
        <div className="mx-auto mb-4 w-12 h-12"><LeafMark className="w-full h-full opacity-90" /></div>
        <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">{message}</p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
