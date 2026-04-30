import { EstimationResult, PackagingComponent, Product, ReferenceItem, Unit, ConfidenceLevel } from '@/types';

const unitFactor: Record<Unit, number> = { mm: 1, cm: 10, m: 1000 };
const toMM = (v: number | undefined, u: Unit) => (v ? v * unitFactor[u] : 0);
const volume = (l?: number, w?: number, h?: number, u: Unit = 'mm') => toMM(l, u) * toMM(w, u) * toMM(h, u);

export const estimateComponent = (component: PackagingComponent, quantity: number, refs: ReferenceItem[]) => {
  if (component.knownWeight && component.knownWeight > 0) {
    return { componentId: component.id, estimatedWeightPerUnit: component.knownWeight, totalWeight: component.knownWeight * quantity, confidence: 'High' as ConfidenceLevel, method: 'Known packaging weight provided' };
  }

  const compVolume = volume(component.length, component.width, component.height, component.unit);
  if (!compVolume) {
    return { componentId: component.id, estimatedWeightPerUnit: 0, totalWeight: 0, confidence: 'Low' as ConfidenceLevel, method: 'Insufficient dimensions for estimate', warning: 'Missing dimensions for component.' };
  }

  const sameMaterial = refs.filter((r) => r.materialType === component.materialType);
  const sameType = sameMaterial.filter((r) => r.packagingType === component.packagingType);
  const pool = sameType.length ? sameType : sameMaterial;

  if (!pool.length) {
    return { componentId: component.id, estimatedWeightPerUnit: 0, totalWeight: 0, confidence: 'Low' as ConfidenceLevel, method: 'No matching reference material found', warning: `No references for ${component.materialType}.` };
  }

  const closest = pool.reduce((best, curr) => {
    const diff = Math.abs(compVolume - volume(curr.length, curr.width, curr.height, curr.unit));
    const bestDiff = Math.abs(compVolume - volume(best.length, best.width, best.height, best.unit));
    return diff < bestDiff ? curr : best;
  });

  return {
    componentId: component.id,
    estimatedWeightPerUnit: closest.averageWeight,
    totalWeight: closest.averageWeight * quantity,
    confidence: 'Medium' as ConfidenceLevel,
    method: `Estimated from reference: ${closest.referenceName}`,
    matchedReference: closest,
  };
};

export const estimateProduct = (product: Omit<Product, 'estimation' | 'createdAt'>, refs: ReferenceItem[]): EstimationResult => {
  const componentEstimates = product.components.map((c) => estimateComponent(c, product.quantity, refs));
  const materialBreakdown: Record<string, number> = {};
  const packagingTypeBreakdown: Record<string, number> = {};
  const warnings: string[] = [];
  const notes: string[] = [];

  product.components.forEach((component, idx) => {
    const e = componentEstimates[idx];
    materialBreakdown[component.materialType] = (materialBreakdown[component.materialType] || 0) + e.totalWeight;
    packagingTypeBreakdown[component.packagingType] = (packagingTypeBreakdown[component.packagingType] || 0) + e.totalWeight;
    notes.push(e.method);
    if (e.warning) warnings.push(e.warning);
  });

  const totalPackagingWeight = componentEstimates.reduce((sum, c) => sum + c.totalWeight, 0);
  const estimatedWeightPerUnit = product.quantity ? totalPackagingWeight / product.quantity : 0;
  const confidences = componentEstimates.map((c) => c.confidence);
  const overallConfidence: ConfidenceLevel = confidences.includes('Low') ? 'Low' : confidences.includes('Medium') ? 'Medium' : 'High';

  return { estimatedWeightPerUnit, totalPackagingWeight, overallConfidence, materialBreakdown, packagingTypeBreakdown, warnings, notes, componentEstimates };
};
