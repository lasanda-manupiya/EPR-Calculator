import { EstimationResult, PackagingLayer, Product, ReferenceItem, Unit, ConfidenceLevel } from '@/types';

const unitFactor: Record<Unit, number> = { mm: 1, cm: 10, m: 1000 };
const toMM = (v: number | undefined, u: Unit) => (v ? v * unitFactor[u] : 0);
const volume = (l?: number, w?: number, h?: number, u: Unit = 'mm') => toMM(l, u) * toMM(w, u) * toMM(h, u);

export const estimateLayer = (
  layer: PackagingLayer,
  quantity: number,
  refs: ReferenceItem[],
  productDimensions: Product['dimensions'],
) => {
  if (layer.knownWeight && layer.knownWeight > 0) {
    return { layerId: layer.id, estimatedWeightPerUnit: layer.knownWeight, totalWeight: layer.knownWeight * quantity, confidence: 'High' as ConfidenceLevel, method: 'Known packaging weight provided' };
  }

  const productVolume = volume(productDimensions.length, productDimensions.width, productDimensions.height, productDimensions.unit);
  if (!productVolume) {
    return { layerId: layer.id, estimatedWeightPerUnit: 0, totalWeight: 0, confidence: 'Low' as ConfidenceLevel, method: 'Insufficient product dimensions for estimate', warning: 'Missing product dimensions.' };
  }

  const sameMaterial = refs.filter((r) => r.materialType === layer.materialType);
  const sameType = sameMaterial.filter((r) => r.packagingType === layer.packagingType);
  const pool = sameType.length ? sameType : sameMaterial;

  if (!pool.length) {
    return { layerId: layer.id, estimatedWeightPerUnit: 0, totalWeight: 0, confidence: 'Low' as ConfidenceLevel, method: 'No matching reference material found', warning: `No references for ${layer.materialType}.` };
  }

  const closest = pool.reduce((best, curr) => {
    const diff = Math.abs(productVolume - volume(curr.length, curr.width, curr.height, curr.unit));
    const bestDiff = Math.abs(productVolume - volume(best.length, best.width, best.height, best.unit));
    return diff < bestDiff ? curr : best;
  });

  return {
    layerId: layer.id,
    estimatedWeightPerUnit: closest.averageWeight,
    totalWeight: closest.averageWeight * quantity,
    confidence: sameType.length ? 'Medium' as ConfidenceLevel : 'Low' as ConfidenceLevel,
    method: `Estimated from reference (product-size match): ${closest.referenceName}`,
    matchedReference: closest,
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
