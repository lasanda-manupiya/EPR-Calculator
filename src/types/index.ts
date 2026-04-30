export type Unit = 'mm' | 'cm' | 'm';

export type MaterialType =
  | 'Cardboard'
  | 'Plastic'
  | 'Paper'
  | 'Glass'
  | 'Aluminium'
  | 'Steel'
  | 'Wood'
  | 'Other';

export type PackagingType = 'primary' | 'secondary' | 'tertiary';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
  unit: Unit;
}

export interface PackagingLayer extends Dimensions {
  id: string;
  layerName: string;
  packagingType: PackagingType;
  materialType: MaterialType;
  knownWeight?: number;
  estimatedWeight: number;
  matchedReferenceId?: string;
  matchedReferenceName?: string;
  confidenceLevel: ConfidenceLevel;
  estimationMethod: string;
  warnings: string[];
}

export interface ReferenceItem {
  id: string;
  referenceName: string;
  materialType: MaterialType;
  packagingType: PackagingType;
  length: number;
  width: number;
  height: number;
  unit: Unit;
  averageWeight: number;
  densityValue: number;
  notes: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  dimensions: Dimensions;
  quantity: number;
  layers: PackagingLayer[];
  estimation: EstimationResult;
  createdAt: string;
}

export interface LayerEstimate {
  layerId: string;
  estimatedWeightPerUnit: number;
  totalWeight: number;
  confidence: ConfidenceLevel;
  method: string;
  matchedReference?: ReferenceItem;
  warning?: string;
}

export interface EstimationResult {
  estimatedWeightPerUnit: number;
  totalPackagingWeight: number;
  overallConfidence: ConfidenceLevel;
  materialBreakdown: Record<string, number>;
  packagingTypeBreakdown: Record<string, number>;
  warnings: string[];
  notes: string[];
  layerEstimates: LayerEstimate[];
}

export interface CompanySettings {
  companyName: string;
}
