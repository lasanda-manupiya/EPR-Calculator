import { referenceLibrary as defaultReferenceLibrary } from '@/data/referenceLibrary';
import { ReferenceItem } from '@/types';

const OWN_LIBRARY_KEY = 'sustainzone_own_library';
const HIDDEN_DEFAULTS_KEY = 'sustainzone_hidden_defaults';

// Kept for backward compatibility (localStorage-only estimation fallback):
// the visible library is defaults (minus hidden) + own additions.
export const getReferenceLibrary = (): ReferenceItem[] => {
  const hidden = new Set(getHiddenDefaults());
  return [...defaultReferenceLibrary.filter((d) => !hidden.has(d.id)), ...getOwnLibrary()];
};

export const getOwnLibrary = (): ReferenceItem[] => {
  try {
    const raw = localStorage.getItem(OWN_LIBRARY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ReferenceItem[]) : [];
  } catch {
    return [];
  }
};

export const saveOwnLibrary = (items: ReferenceItem[]) => {
  localStorage.setItem(OWN_LIBRARY_KEY, JSON.stringify(items));
};

export const getHiddenDefaults = (): string[] => {
  try {
    const raw = localStorage.getItem(HIDDEN_DEFAULTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
};

export const saveHiddenDefaults = (ids: string[]) => {
  localStorage.setItem(HIDDEN_DEFAULTS_KEY, JSON.stringify(ids));
};
