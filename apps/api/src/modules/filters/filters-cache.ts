export interface FiltersOptionsPayload {
  years: number[];
  categories: Array<{ id: string; name: string }>;
  authors: Array<{ id: string; fullName: string }>;
  tags: Array<{ id: string; name: string }>;
  languages: string[];
  formats: string[];
  letters: string[];
  accessLevels: string[];
  materialTypes: string[];
  sections: string[];
  sectionCounts: Record<string, number>;
}

const FILTERS_OPTIONS_TTL_MS = 60_000;

let cache: { value: FiltersOptionsPayload; expiresAt: number } | null = null;

export const getFiltersOptionsCache = (): FiltersOptionsPayload | null => {
  if (!cache) return null;
  if (Date.now() > cache.expiresAt) {
    cache = null;
    return null;
  }

  return cache.value;
};

export const setFiltersOptionsCache = (value: FiltersOptionsPayload): void => {
  cache = {
    value,
    expiresAt: Date.now() + FILTERS_OPTIONS_TTL_MS
  };
};

export const clearFiltersOptionsCache = (): void => {
  cache = null;
};

