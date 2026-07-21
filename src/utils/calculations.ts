import { EstimationResult, PackagingLayer, Product, ReferenceItem, Unit, ConfidenceLevel } from '@/types';

const unitFactor: Record<Unit, number> = { mm: 1, cm: 10, m: 1000 };
const toMM = (v: number | undefined, u: Unit) => (v ? v * unitFactor[u] : 0);

// Dimensions normalised to mm and sorted largest first, so a 120x80x45 product
// matches an 80x120x45 reference. Orientation should not change the match.
const sides = (l?: number, w?: number, h?: number, u: Unit = 'mm') =>
  [toMM(l, u), toMM(w, u), toMM(h, u)].sort((a, b) => b - a);

// Straight-line distance between two sets of sides, in mm.
const gap = (a: number[], b: number[]) => Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));

const magnitude = (a: number[]) => Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));

export const estimateLayer = (
  layer: PackagingLayer,
  quantity: number,
  refs: ReferenceItem[],
  productDimensions: Product['dimensions'],
) => {
  if (layer.knownWeight && layer.knownWeight > 0) {
    return { layerId: layer.id, estimatedWeightPerUnit: layer.knownWeight, totalWeight: layer.knownWeight * quantity, confidence: 'High' as ConfidenceLevel, method: 'Known packaging weight provided' };
  }

  const productSides = sides(productDimensions.length, productDimensions.width, productDimensions.height, productDimensions.unit);
  if (!magnitude(productSides)) {
    return { layerId: layer.id, estimatedWeightPerUnit: 0, totalWeight: 0, confidence: 'Low' as ConfidenceLevel, method: 'Insufficient product dimensions for estimate', warning: 'Missing product dimensions.' };
  }

  const sameMaterial = refs.filter((r) => r.materialType === layer.materialType);
  const sameType = sameMaterial.filter((r) => r.packagingType === layer.packagingType);
  const pool = sameType.length ? sameType : sameMaterial;

  if (!pool.length) {
    return { layerId: layer.id, estimatedWeightPerUnit: 0, totalWeight: 0, confidence: 'Low' as ConfidenceLevel, method: 'No matching reference material found', warning: `No references for ${layer.materialType}.` };
  }

  // Pick the reference whose dimensions sit closest to the product, then take its
  // recorded weight exactly as it is. The reference weights come from measured
  // packaging, so scaling them would invent a figure the source never supported.
  const scored = pool.map((r) => ({ ref: r, distance: gap(productSides, sides(r.length, r.width, r.height, r.unit)) }));
  const best = scored.reduce((a, b) => (b.distance < a.distance ? b : a));
  const closest = best.ref;

  const estimatedWeightPerUnit = closest.averageWeight;
  // How far the match sits from the product, relative to the product's own size.
  const drift = best.distance / magnitude(productSides);

  let confidence: ConfidenceLevel = sameType.length ? 'Medium' : 'Low';
  if (sameType.length && drift <= 0.1) confidence = 'High';

  const warning = drift > 0.5
    ? `Closest reference "${closest.referenceName}" is a very different size, so this estimate is rough. Add a closer reference or enter a known weight.`
    : undefined;

  return {
    layerId: layer.id,
    estimatedWeightPerUnit,
    totalWeight: estimatedWeightPerUnit * quantity,
    confidence,
    method: `Closest dimensions matched "${closest.referenceName}", weight used as recorded`,
    matchedReference: closest,
    ...(warning ? { warning } : {}),
  };
};

export const estimateProduct = (product: Omit<Product, 'estimation' | 'createdAt'>, refs: ReferenceItem[]): EstimationResult => {
  const layerEstimates = product.layers.map((l) => estimateLayer(l, product.quantity, refs, product.dimensions));
  const materialBreakdown: Record<string, number> = {};
  const packagingTypeBreakdown: Record<string, number> = {};
  const warnings: string[] = [];
  const notes: string[] = [];

  product.layers.forEach((layer, idx) => {
    const e = layerEstimates[idx];
    materialBreakdown[layer.materialType] = (materialBreakdown[layer.materialType] || 0) + e.totalWeight;
    packagingTypeBreakdown[layer.packagingType] = (packagingTypeBreakdown[layer.packagingType] || 0) + e.totalWeight;
    notes.push(e.method);
    if (e.warning) warnings.push(`${layer.layerName || 'Layer'}: ${e.warning}`);
  });

  const totalPackagingWeight = layerEstimates.reduce((sum, l) => sum + l.totalWeight, 0);
  const estimatedWeightPerUnit = product.quantity ? totalPackagingWeight / product.quantity : 0;
  const confidences = layerEstimates.map((l) => l.confidence);
  const overallConfidence: ConfidenceLevel = confidences.includes('Low') ? 'Low' : confidences.includes('Medium') ? 'Medium' : 'High';

  return { estimatedWeightPerUnit, totalPackagingWeight, overallConfidence, materialBreakdown, packagingTypeBreakdown, warnings, notes, layerEstimates };
};
