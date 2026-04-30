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

export interface PackagingComponent extends Dimensions {
  id: string;
  materialType: MaterialType;
  packagingType: PackagingType;
  knownWeight?: number;
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
  components: PackagingComponent[];
  estimation: EstimationResult;
  createdAt: string;
}

export interface ComponentEstimate {
  componentId: string;
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
  componentEstimates: ComponentEstimate[];
}

export interface CompanySettings {
  companyName: string;
}
