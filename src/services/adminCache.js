import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@ineo_admin_cache:';
const memoryCache = new Map();
let legacyCacheRemoved = false;

const removeLegacyCache = async () => {
  if (legacyCacheRemoved) return;
  try {
    const keys = await AsyncStorage.getAllKeys();
    const adminKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
    if (adminKeys.length) await AsyncStorage.multiRemove(adminKeys);
    legacyCacheRemoved = true;
  } catch (_error) {
    console.warn('No se pudo eliminar el cache administrativo anterior.');
  }
};

export const getAdminCache = async (key, maxAge) => {
  await removeLegacyCache();
  const cached = memoryCache.get(key);
  if (!cached?.timestamp || cached.data === undefined) return null;
  return {
    data: cached.data,
    timestamp: cached.timestamp,
    isFresh: Date.now() - cached.timestamp < maxAge,
  };
};

export const setAdminCache = async (key, data) => {
  await removeLegacyCache();
  const cached = { data, timestamp: Date.now() };
  memoryCache.set(key, cached);
  return cached;
};

export const clearAdminCache = async () => {
  memoryCache.clear();
};
