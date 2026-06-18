import api from './api';

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
      params: buildParams({ current_id_cama: currentIdCama }),
    }).then(unwrap)
  ),

  getPatients: (search = '') => (
    getWithFallback(['/gestion-pacientes', '/admin-patients', '/patients-admin', '/patients'], {
      params: buildParams({ search }),
    })
  ),

  searchPatients: (query = '', limit = 10) => (
    api.get('/patients/search', {
      params: buildParams({ q: query, limit }),
    }).then(unwrap)
  ),

  getPatient: (idExp) => api.get(`/patients/${idExp}`).then(unwrap),

  createPatient: (payload) => api.post('/patients', payload).then(unwrap),

  updatePatient: (idExp, payload) => api.put(`/patients/${idExp}`, payload).then(unwrap),

  getDocumentsPatients: () => api.get('/documents/patients').then(unwrap),

  getPatients: (search = '') =>
  api.get('/gestion-pacientes', {
    params: buildParams({ search }),
  }).then(unwrap),

getCensus: (search = '') =>
  api.get('/censo', {
    params: buildParams({ search }),
  }).then(unwrap),

getCashCut: ({ date, search } = {}) =>
  api.get('/corte-caja', {
    params: buildParams({ date, search }),
  }).then(unwrap),

getAccounts: (search = '') =>
  api.get('/cuenta-pacientes', {
    params: buildParams({ search }),
  }).then(unwrap),

getAccount: (idAtencion) =>
  api.get(`/cuenta-pacientes/${idAtencion}`).then(unwrap),

  getAccountDocuments: (idAtencion) => api.get(`/accounts/${idAtencion}/documents`).then(unwrap),

  addCharge: (idAtencion, payload) => (
    api.post(`/accounts/${idAtencion}/charges`, payload).then(unwrap)
  ),

  removeCharge: (idAtencion, chargeId) => (
    api.delete(`/accounts/${idAtencion}/charges/${chargeId}`).then(unwrap)
  ),

  registerPayment: (idAtencion, payload) => (
    api.post(`/accounts/${idAtencion}/payments`, payload).then(unwrap)
  ),

  closeAccount: (idAtencion) => api.post(`/accounts/${idAtencion}/close`).then(unwrap),

  // El mapa actual no expone `/beds`; opciones trae el catalogo de camas.
  getBeds: () => api.get('/options').then(unwrap),
  createBed: (payload) => api.post('/beds', payload).then(unwrap),
  updateBed: (idCama, payload) => api.put(`/beds/${idCama}`, payload).then(unwrap),
  deleteBed: (idCama) => api.delete(`/beds/${idCama}`).then(unwrap),
};

export default adminService;
