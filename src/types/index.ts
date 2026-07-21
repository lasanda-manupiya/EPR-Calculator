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

/**
 * Where a reference weight came from. EPR submissions need evidence kept for
 * seven years, so every shared item says which of these it is.
 *   derived   - calculated from the dimensions, so it can be recomputed
 *   published - taken from a named published figure
 *   estimate  - a sensible starting figure with no published source behind it
 */
export type SourceKind = 'derived' | 'published' | 'estimate';

export interface ReferenceSource {
  kind: SourceKind;
  /** One line the user reads first. */
  summary: string;
  /** The method, the published figure, or what the estimate assumes. */
  detail: string;
  publisher?: string;
  url?: string;
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
  /** Absent on items a user added themselves. */
  source?: ReferenceSource;
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

export type Role = 'superadmin' | 'admin' | 'member';

export interface CompanyMember {
  id: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  role: Role;
}

export interface InviteCode {
  id: string;
  code: string;
  role: 'admin' | 'member';
  createdAt: string;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
}

export interface InvitePreview {
  valid: boolean;
  companyName: string;
  role: 'admin' | 'member';
}
