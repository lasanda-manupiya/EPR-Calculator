import { db } from '../config/db.js';
import { volumeMm3, Unit } from '../utils/calc.js';

export const estimateComponent = (component: any) => {
  const { material_type, packaging_type, length, width, height, unit, known_weight } = component;
  if (known_weight) return { weight: Number(known_weight), confidence: 'high', method: 'known_weight', ref: null };
  if (!length || !width || !height || !material_type) return { weight: 0, confidence: 'low', method: 'insufficient_data', ref: null };
  const refs = db.prepare(`SELECT * FROM packaging_reference_library WHERE material_type = ?`).all(material_type) as any[];
  if (!refs.length) return { weight: 0, confidence: 'low', method: 'no_material_reference', ref: null };
  const vol = volumeMm3(length, width, height, unit as Unit);
  const scored = refs
    .map((r) => {
      const rv = volumeMm3(r.length, r.width, r.height, r.unit as Unit);
      const typePenalty = r.packaging_type === packaging_type ? 0 : rv * 0.05;
      return { ref: r, diff: Math.abs(rv - vol) + typePenalty };
    })
    .sort((a, b) => a.diff - b.diff)[0];
  return { weight: scored.ref.average_weight, confidence: 'medium', method: 'nearest_reference_volume', ref: scored.ref };
};
