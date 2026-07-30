import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@ineo_admin_cache:';
const memoryCache = new Map();

const storageKey = (key) => `${CACHE_PREFIX}${key}`;

export const getAdminCache = async (key, maxAge) => {
  let cached = memoryCache.get(key);

  if (!cached) {
    try {
      const stored = await AsyncStorage.getItem(storageKey(key));
      cached = stored ? JSON.parse(stored) : null;

      if (cached?.timestamp) {
        memoryCache.set(key, cached);
      }
    } catch (error) {
      console.log('ERROR LEYENDO CACHE ADMINISTRATIVO:', error.message);
      return null;
    }
  }

  if (!cached?.timestamp || cached.data === undefined) {
    return null;
  }

  return {
    data: cached.data,
    timestamp: cached.timestamp,
    isFresh: Date.now() - cached.timestamp < maxAge,
  };
};

export const setAdminCache = async (key, data) => {
  const cached = {
    data,
    timestamp: Date.now(),
  };

  memoryCache.set(key, cached);

  try {
    await AsyncStorage.setItem(storageKey(key), JSON.stringify(cached));
  } catch (error) {
    console.log('ERROR GUARDANDO CACHE ADMINISTRATIVO:', error.message);
  }

  return cached;
};

