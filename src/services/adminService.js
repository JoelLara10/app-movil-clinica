import api from './api';
import { downloadAuthenticatedFile } from './fileService';

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
  getOptions: (currentIdCama) => (
    api.get('/options', {
      params: buildParams({
        current_id_cama: currentIdCama,
        page: 1,
        limit: 1000,
        all: true,
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
    const allowedDocumentPath = /^(?:[/]api[/]v1)?[/]pdf[/](?:initial-sheet|front-sheet|contract|consent|identification-sheet)[/][1-9][0-9]*[/][1-9][0-9]*$/;
    if (typeof endpoint !== 'string' || !allowedDocumentPath.test(endpoint)) {
      throw new Error('La ruta del documento no es válida.');
    }

    const normalizedEndpoint = endpoint.startsWith('/api/')
      ? endpoint.replace(/^[/]api[/]v1/, '')
      : endpoint;
    const filename = document.filename ??
      `${normalizedEndpoint.split('/')[2]}_${Date.now()}.pdf`;
    if (typeof filename !== 'string' || !/^[A-Za-z0-9_-]{1,100}[.]pdf$/i.test(filename)) {
      throw new Error('El nombre del documento no es válido.');
    }

    await downloadAuthenticatedFile(normalizedEndpoint, filename);
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

  // The options endpoint only contains free beds; this view needs all beds.
  getBeds: () => api.get('/beds').then(unwrap),

  createBed: (payload) => api.post('/beds', payload).then(unwrap),

  updateBed: (idCama, payload) => api.put(`/beds/${idCama}`, payload).then(unwrap),

  deleteBed: (idCama) => api.delete(`/beds/${idCama}`).then(unwrap),
};

export default adminService;
