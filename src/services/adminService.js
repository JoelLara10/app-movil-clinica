import api, { API_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const buildParams = (params = {}) => (
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
);

const unwrap = (response) => response.data;

const requestWithFallback = async (paths, requestFactory) => {
  let lastError;

  for (const path of paths) {
    try {
      return await requestFactory(path);
    } catch (error) {
      lastError = error;
      const status = error.response?.status;

      if (status !== 404 && status !== 405) {
        throw error;
      }
    }
  }

  throw lastError;
};

const getWithFallback = (paths, config) => (
  requestWithFallback(paths, (path) => api.get(path, config)).then(unwrap)
);

const adminService = {
  getOptions: (currentIdCama, page = 1, limit = 5) => (
    api.get('/options', {
      params: buildParams({
        current_id_cama: currentIdCama,
        page,
        limit,
      }),
    }).then(unwrap)
  ),

  getPatients: (search = '') => (
    getWithFallback(['/gestion-pacientes', '/admin-patients', '/patients-admin', '/patients'], {
      params: buildParams({
        search,
        all: true,
      }),
    })
  ),

  searchPatients: (query = '', limit = 10) => (
    api.get('/patients/search', {
      params: buildParams({
        q: query,
        limit,
      }),
    }).then(unwrap)
  ),

  getPatient: (idExp) => api.get(`/patients/${idExp}`).then(unwrap),

  createPatient: (payload) => api.post('/patients', payload).then(unwrap),

  updatePatient: (idExp, payload) => api.put(`/patients/${idExp}`, payload).then(unwrap),

  getDocumentsPatients: () => api.get('/documents/patients').then(unwrap),

  getCensus: (search = '') =>
    api.get('/censo', {
      params: buildParams({
        search,
        all: true,
      }),
    }).then(unwrap),

  getCashCut: ({ date, search } = {}) =>
    api.get('/corte-caja', {
      params: buildParams({
        date,
        search,
        all: true,
      }),
    }).then(unwrap),

  getAccounts: (search = '') =>
    api.get('/cuenta-pacientes', {
      params: buildParams({
        search,
        all: true,
      }),
    }).then(unwrap),

  getAccount: (idAtencion) =>
    api.get(`/cuenta-pacientes/${idAtencion}`).then(unwrap),

  getAccountDocuments: (idAtencion) =>
    api.get(`/accounts/${idAtencion}/documents`).then(unwrap),

  downloadDocument: async (document) => {
    const endpoint = document?.endpoint;

    if (!endpoint) {
      throw new Error('La API no proporcionó la ruta del documento.');
    }

    const normalizedEndpoint = endpoint.startsWith('/api/')
      ? endpoint.replace(/^\/api\/v1/, '')
      : endpoint;
    const filename = document.filename ||
      `${document.key || 'documento'}_${Date.now()}.pdf`;

    if (Platform.OS === 'web') {
      const response = await api.get(normalizedEndpoint, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      return;
    }

    const token = await AsyncStorage.getItem('@ineo_token');
    const result = await FileSystem.downloadAsync(
      `${API_URL}${normalizedEndpoint}`,
      `${FileSystem.cacheDirectory}${filename}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );

    if (result.status < 200 || result.status >= 300) {
      throw new Error(`La API respondió con estado ${result.status}.`);
    }

    if (!(await Sharing.isAvailableAsync())) {
      throw new Error(`Documento descargado en ${result.uri}`);
    }

    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Guardar o compartir ${document.title || 'documento'}`,
    });
  },

  addCharge: (idAtencion, payload) => (
    api.post(`/accounts/${idAtencion}/charges`, payload).then(unwrap)
  ),

  removeCharge: (idAtencion, chargeId) => (
    api.delete(`/accounts/${idAtencion}/charges/${chargeId}`).then(unwrap)
  ),

  registerPayment: (idAtencion, payload) => (
    api.post(`/accounts/${idAtencion}/payments`, payload).then(unwrap)
  ),

  closeAccount: (idAtencion) =>
    api.post(`/accounts/${idAtencion}/close`).then(unwrap),

  getBeds: (page = 1, limit = 5) =>
    api.get('/options', {
      params: buildParams({
        page,
        limit,
      }),
    }).then(unwrap),

  createBed: (payload) => api.post('/beds', payload).then(unwrap),

  updateBed: (idCama, payload) => api.put(`/beds/${idCama}`, payload).then(unwrap),

  deleteBed: (idCama) => api.delete(`/beds/${idCama}`).then(unwrap),
};

export default adminService;
