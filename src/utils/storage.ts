import { CompanySettings, Product } from '@/types';

const PRODUCTS_KEY = 'sustainzone_products';
const SETTINGS_KEY = 'sustainzone_settings';

const normalizeProducts = (raw: unknown): Product[] => {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const p = item as Record<string, unknown>;
    const layers = Array.isArray(p.layers)
      ? p.layers
      : Array.isArray(p.components)
      ? (p.components as Record<string, unknown>[]).map((c, idx) => ({
          id: String(c.id ?? crypto.randomUUID()),
          layerName: `Layer ${idx + 1}`,
          packagingType: c.packagingType ?? 'primary',
          materialType: c.materialType ?? 'Other',
          length: c.length ?? 0,
          width: c.width ?? 0,
          height: c.height ?? 0,
          unit: c.unit ?? 'mm',
          knownWeight: c.knownWeight,
          estimatedWeight: 0,
          confidenceLevel: 'Low',
          estimationMethod: 'Legacy data migrated',
          warnings: ['Migrated from previous product schema.'],
        }))
      : [];

    return [{ ...(p as Product), layers } as Product];
  });
};

export const getProducts = (): Product[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    return normalizeProducts(parsed);
  } catch {
    return [];
  }
};

export const saveProducts = (products: Product[]) => localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
export const getSettings = (): CompanySettings => JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{"companyName":""}');
export const saveSettings = (settings: CompanySettings) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
