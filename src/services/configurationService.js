import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import api, { API_URL } from './api';

const LONG_TIMEOUT = 10 * 60 * 1000;

const configurationService = {
  beds: {
    list: async () => (await api.get('/beds')).data,
    create: async (data) => (await api.post('/beds', data)).data,
    update: async (id, data) => (await api.put(`/beds/${id}`, data)).data,
    remove: async (id) => (await api.delete(`/beds/${id}`)).data,
  },
  services: {
    list: async () => (await api.get('/catalog/services')).data,
    create: async (data) => (await api.post('/catalog/services', data)).data,
    update: async (id, data) => (await api.put(`/catalog/services/${id}`, data)).data,
    remove: async (id) => (await api.delete(`/catalog/services/${id}`)).data,
  },
  diagnostics: {
    list: async () => (await api.get('/catalog/diagnostics')).data,
    create: async (data) => (await api.post('/catalog/diagnostics', data)).data,
    update: async (id, data) => (await api.put(`/catalog/diagnostics/${id}`, data)).data,
    remove: async (id) => (await api.delete(`/catalog/diagnostics/${id}`)).data,
  },
  backups: {
    list: async () => (await api.get('/backup')).data,
    collections: async () => (await api.get('/backup/collections')).data,
    health: async () => (await api.get('/backup/health')).data,
    create: async (data) => (
      await api.post('/backup/create', data, { timeout: LONG_TIMEOUT })
    ).data,
    restore: async (filename) => (
      await api.post('/backup/restore', { filename }, { timeout: LONG_TIMEOUT })
    ).data,
    remove: async (filename) => (
      await api.delete(`/backup/${encodeURIComponent(filename)}`)
    ).data,
    download: async (filename) => {
      if (Platform.OS === 'web') {
        const response = await api.get(
          `/backup/download/${encodeURIComponent(filename)}`,
          { responseType: 'blob', timeout: LONG_TIMEOUT },
        );
        const url = URL.createObjectURL(response.data);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
        return;
      }

      const token = await AsyncStorage.getItem('@ineo_token');
      const destination = `${FileSystem.cacheDirectory}${filename}`;
      const result = await FileSystem.downloadAsync(
        `${API_URL}/backup/download/${encodeURIComponent(filename)}`,
        destination,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error(`Archivo descargado en ${result.uri}`);
      }
      await Sharing.shareAsync(result.uri, {
        dialogTitle: 'Guardar o compartir respaldo INEO',
      });
    },
  },
  automation: {
    get: async () => (await api.get('/backup/automation')).data,
    update: async (data) => (await api.put('/backup/automation', data)).data,
  },
};

export default configurationService;
