import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@ineo_admin_cache:';
let legacyCacheRemoved = false;

const removeLegacyCache = async () => {
  if (legacyCacheRemoved) return;
  try {
    const keys = await AsyncStorage.getAllKeys();
    const adminKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
    if (adminKeys.length) await AsyncStorage.multiRemove(adminKeys);
    legacyCacheRemoved = true;
  } catch (_error) {
    // Reintentar en la siguiente consulta sin revelar datos clinicos.
    console.warn('No se pudo eliminar el cache administrativo anterior.');
  }
};

// Los expedientes y cuentas se consultan a la API autenticada en cada carga.
// Se conserva la interfaz usada por las pantallas, sin cache en disco o memoria.
export const getAdminCache = async (_key, _maxAge) => {
  await removeLegacyCache();
  return null;
};

export const setAdminCache = async (_key, data) => {
  await removeLegacyCache();
  return { data, timestamp: Date.now() };
};

