import { clearMonitoringCache } from './monitoringCache';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// SecureStore solo acepta caracteres alfanuméricos, punto, guion y guion bajo.
// Se conserva la clave anterior únicamente para el almacenamiento web.
const WEB_TOKEN_KEY = '@ineo_token';
const NATIVE_TOKEN_KEY = 'ineo_token';
const USER_KEY = '@ineo_user';
const SENSITIVE_PREFIXES = [
  '@ineo_cache_',
  '@ineo_admin_cache:',
  'estudios_',
  'examen_',
  'patient_',
  'print_',
];

const webStorage = () => {
  if (typeof globalThis.localStorage === 'undefined') {
    return null;
  }
  return globalThis.localStorage;
};

export async function getToken() {
  if (Platform.OS === 'web') {
    return webStorage()?.getItem(WEB_TOKEN_KEY) || null;
  }
  return SecureStore.getItemAsync(NATIVE_TOKEN_KEY);
}

export async function setToken(token) {
  if (Platform.OS === 'web') {
    webStorage()?.setItem(WEB_TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(NATIVE_TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function removeToken() {
  if (Platform.OS === 'web') {
    webStorage()?.removeItem(WEB_TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(NATIVE_TOKEN_KEY);
}

export async function getStoredUser() {
  if (Platform.OS === 'web') {
    return webStorage()?.getItem(USER_KEY) || null;
  }
  return AsyncStorage.getItem(USER_KEY);
}

export async function setStoredUser(user) {
  const value = JSON.stringify(user);
  if (Platform.OS === 'web') {
    webStorage()?.setItem(USER_KEY, value);
    return;
  }
  await AsyncStorage.setItem(USER_KEY, value);
}

export async function clearStoredSession() {
  clearMonitoringCache();
  await removeToken();
  if (Platform.OS === 'web') {
    webStorage()?.removeItem(USER_KEY);
    return;
  }

  await AsyncStorage.removeItem(USER_KEY);
  const keys = await AsyncStorage.getAllKeys();
  const sensitiveKeys = keys.filter((key) =>
    SENSITIVE_PREFIXES.some((prefix) => key.startsWith(prefix))
  );
  if (sensitiveKeys.length > 0) {
    await AsyncStorage.multiRemove(sensitiveKeys);
  }
}
