import { ReactNode, useState } from 'react';

/**
 * Recreated SustainZone leaf mark (teal + orange sprout). Used as a fallback
 * when the raster brand logo files aren't present, and as the empty-state
 * watermark.
 */
export function LeafMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 66 74" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M33 72 C 6 54 10 18 31 5 C 33 30 33 50 33 72 Z" fill="#16bccf" />
      <path d="M33 72 C 60 54 56 18 35 5 C 33 30 33 50 33 72 Z" fill="#F5811F" />
    </svg>
  );
}

/**
 * Renders a raster brand logo from `src` if it exists, otherwise the provided
 * SVG fallback. Drop the official PNGs into `public/` to have them appear:
 *   public/sustainzone-logo.png     (white horizontal logo for the sidebar)
 *   public/epr-calculator-logo.png  (full EPR Calculator logo for watermarks)
 */
export function BrandLogo({ src, alt, className = '', fallback }: { src: string; alt: string; className?: string; fallback: ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
