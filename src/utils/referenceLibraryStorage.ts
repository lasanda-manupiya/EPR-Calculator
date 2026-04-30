import { referenceLibrary as defaultReferenceLibrary } from '@/data/referenceLibrary';
import { ReferenceItem } from '@/types';

const REFERENCE_LIBRARY_KEY = 'sustainzone_reference_library';

export const getReferenceLibrary = (): ReferenceItem[] => {
  try {
    const raw = localStorage.getItem(REFERENCE_LIBRARY_KEY);
    if (!raw) return defaultReferenceLibrary;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? (parsed as ReferenceItem[]) : defaultReferenceLibrary;
  } catch {
    return defaultReferenceLibrary;
  }
};

export const saveReferenceLibrary = (items: ReferenceItem[]) => {
  localStorage.setItem(REFERENCE_LIBRARY_KEY, JSON.stringify(items));
};
