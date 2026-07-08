// services/cache.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

export const CacheKeys = {
  estudiosAll: (type, status) => `estudios_all_${type}_${status}`,
  counts: 'estudios_counts',
  examenInfo: (id) => `examen_${id}_info`,
  examenEditInfo: (id, type) => `examen_${id}_edit_${type}`,
};

export const getCache = async (key) => {
  try {
    const item = await AsyncStorage.getItem(key);
    if (!item) return null;
    const parsed = JSON.parse(item);
    if (parsed.expiry && Date.now() > parsed.expiry) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return parsed.value;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

export const setCache = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    const item = {
      value,
      expiry: Date.now() + ttl,
    };
    await AsyncStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

export const removeCache = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Cache remove error:', error);
  }
};

export const invalidateCachePrefix = async (prefix) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const keysToRemove = keys.filter(key => key.startsWith(prefix));
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch (error) {
    console.error('Cache invalidate prefix error:', error);
  }
};