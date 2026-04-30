import { CompanySettings, Product } from '@/types';

const PRODUCTS_KEY = 'sustainzone_products';
const SETTINGS_KEY = 'sustainzone_settings';

export const getProducts = (): Product[] => JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
export const saveProducts = (products: Product[]) => localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
export const getSettings = (): CompanySettings => JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{"companyName":""}');
export const saveSettings = (settings: CompanySettings) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
