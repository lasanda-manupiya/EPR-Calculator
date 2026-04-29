export type Unit = 'mm' | 'cm' | 'm';
export const toMm = (v: number, unit: Unit) => (unit === 'm' ? v * 1000 : unit === 'cm' ? v * 10 : v);
export const volumeMm3 = (l: number, w: number, h: number, unit: Unit) => toMm(l, unit) * toMm(w, unit) * toMm(h, unit);
