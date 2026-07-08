// services/cache.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

export const CacheKeys = {
  // Listas paginadas: estudios_${type}_${status}_page_${page}
  estudiosList: (type, status, page) => `estudios_${type}_${status}_page_${page}`,
  // Contadores
  counts: 'estudios_counts',
  // Detalle de un examen (para formularios)
  examenInfo: (id) => `examen_${id}_info`,
  examenEditInfo: (id, type) => `examen_${id}_edit_${type}`,
};

/**
 * Obtiene un valor del caché si existe y no ha expirado.
 * @param {string} key
 * @returns {Promise<any>} - El valor almacenado o null.
 */
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

/**
 * Guarda un valor en caché con un tiempo de vida.
 * @param {string} key
 * @param {any} value
 * @param {number} ttl - Tiempo de vida en milisegundos (opcional).
 */
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

/**
 * Elimina una clave específica del caché.
 */
export const removeCache = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Cache remove error:', error);
  }
};

/**
 * Elimina todas las claves que comiencen con un prefijo.
 * Útil para invalidar todas las listas de estudios o detalles de un examen.
 */
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