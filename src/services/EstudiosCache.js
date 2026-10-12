const DEFAULT_TTL = 5 * 60 * 1000;
const memoryCache = new Map();

export const CacheKeys = {
  estudiosAll: (type, status) => `estudios_all_${type}_${status}`,
  counts: 'estudios_counts',
  examenInfo: (id) => `examen_${id}_info`,
  examenEditInfo: (id, type) => `examen_${id}_edit_${type}`,
};

export const getCache = async (key) => {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return item.value;
};

export const setCache = async (key, value, ttl = DEFAULT_TTL) => {
  memoryCache.set(key, { value, expiry: Date.now() + ttl });
};

export const removeCache = async (key) => {
  memoryCache.delete(key);
};

export const invalidateCachePrefix = async (prefix) => {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  }
};

export const clearEstudiosCache = async () => {
  memoryCache.clear();
};
