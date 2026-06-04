const FILTERS_OPTIONS_TTL_MS = 60_000;
let cache = null;
export const getFiltersOptionsCache = () => {
    if (!cache)
        return null;
    if (Date.now() > cache.expiresAt) {
        cache = null;
        return null;
    }
    return cache.value;
};
export const setFiltersOptionsCache = (value) => {
    cache = {
        value,
        expiresAt: Date.now() + FILTERS_OPTIONS_TTL_MS
    };
};
export const clearFiltersOptionsCache = () => {
    cache = null;
};
