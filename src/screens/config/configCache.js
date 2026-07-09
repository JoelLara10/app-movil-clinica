import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ineo_expo_config_module';
const CACHE_INFO_KEY = 'ineo_expo_config_cache_info';

const nowIso = () => new Date().toISOString();

export const defaultConfigData = {
  general: {
    nombreClinica: 'INEO Hospital',
    telefono: '722 000 0000',
    direccion: 'Toluca, México',
    moneda: 'MXN',
    tema: 'Morado',
    apiHost: '192.168.1.4',
    apiPort: '5001',
    apiPath: '/api/v1',
  },
  usuarios: [
    { id: 'U-001', curp: '', nombre: 'Administrador', papell: '', sapell: '', fecnac: '', telefono: '', matricula: '', cedula: '', cargo: 'Administrador', email: '', preguntaSeguridad: '', username: 'admin', role: 'admin', activo: true },
    { id: 'U-002', curp: '', nombre: 'Médico General', papell: '', sapell: '', fecnac: '', telefono: '', matricula: '', cedula: '', cargo: 'Médico General', email: '', preguntaSeguridad: '', username: 'medico', role: 'medico', activo: true },
  ],
  camas: [
    { id: 'C-101', numero: '101', nombre: 'Cama 101', area: 'Hospitalización', tipo: 'General', estado: 'Disponible' },
    { id: 'C-102', numero: '102', nombre: 'Cama 102', area: 'Urgencias', tipo: 'Observación', estado: 'Ocupada' },
  ],
  servicios: [
    { id: 'S-001', clave: 'CONS-GEN', descripcion: 'Consulta general', costo: '500', tipo: 'Consulta', unidad: 'Servicio', activo: true },
    { id: 'S-002', clave: 'LAB-BAS', descripcion: 'Laboratorio básico', costo: '350', tipo: 'Laboratorio', unidad: 'Estudio', activo: true },
  ],
  diagnosticos: [
    { id: 'D-001', codigo: 'H40', nombre: 'Glaucoma', descripcion: 'Trastorno ocular relacionado con presión intraocular.', categoria: 'Oftalmología', activo: true },
    { id: 'D-002', codigo: 'H25', nombre: 'Catarata senil', descripcion: 'Opacidad del cristalino asociada a edad.', categoria: 'Oftalmología', activo: true },
  ],
  automatizacion: {
    respaldosAutomaticos: true,
    horaRespaldo: '22:00',
    limpiarTemporales: true,
    diasRetencion: '30',
    sincronizacionWifi: true,
    notificaciones: true,
  },
  respaldos: [
    { id: 'B-001', nombre: 'respaldo_inicial.json', fecha: nowIso(), tipo: 'Manual', elementos: 0 },
  ],
  rendimiento: {
    limpiarCacheInicio: false,
    modoAhorro: false,
    cacheMaximoMb: '50',
    ultimaLimpieza: '',
  },
};

async function writeCacheInfo(data) {
  const info = {
    updatedAt: nowIso(),
    size: JSON.stringify(data).length,
  };
  await AsyncStorage.setItem(CACHE_INFO_KEY, JSON.stringify(info));
  return info;
}

export async function readAllConfig() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultConfigData));
    await writeCacheInfo(defaultConfigData);
    return defaultConfigData;
  }

  try {
    const parsed = JSON.parse(raw);
    return { ...defaultConfigData, ...parsed };
  } catch (error) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultConfigData));
    await writeCacheInfo(defaultConfigData);
    return defaultConfigData;
  }
}

export async function saveAllConfig(data) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  await writeCacheInfo(data);
  return data;
}

export async function getConfigSection(section) {
  const data = await readAllConfig();
  return data[section];
}

export async function saveConfigSection(section, value) {
  const data = await readAllConfig();
  data[section] = value;
  await saveAllConfig(data);
  return value;
}

export async function addConfigItem(section, item) {
  const data = await readAllConfig();
  const list = Array.isArray(data[section]) ? data[section] : [];
  data[section] = [{ ...item, id: item.id || `${section}-${Date.now()}` }, ...list];
  await saveAllConfig(data);
  return data[section];
}

export async function updateConfigItem(section, id, changes) {
  const data = await readAllConfig();
  data[section] = (data[section] || []).map((item) =>
    item.id === id ? { ...item, ...changes } : item
  );
  await saveAllConfig(data);
  return data[section];
}

export async function deleteConfigItem(section, id) {
  const data = await readAllConfig();
  data[section] = (data[section] || []).filter((item) => item.id !== id);
  await saveAllConfig(data);
  return data[section];
}

export async function createBackup() {
  const data = await readAllConfig();
  const totalItems = Object.values(data).reduce((acc, value) => acc + (Array.isArray(value) ? value.length : 1), 0);
  const backup = {
    id: `B-${Date.now()}`,
    nombre: `respaldo_${new Date().toISOString().slice(0, 10)}.json`,
    fecha: nowIso(),
    tipo: 'Manual',
    elementos: totalItems,
  };
  data.respaldos = [backup, ...(data.respaldos || [])];
  await saveAllConfig(data);
  return data.respaldos;
}

export async function resetConfigData() {
  await saveAllConfig(defaultConfigData);
  return defaultConfigData;
}

export async function clearConfigCache() {
  await AsyncStorage.removeItem(STORAGE_KEY);
  await AsyncStorage.removeItem(CACHE_INFO_KEY);
}

export async function getConfigCacheInfo() {
  const raw = await AsyncStorage.getItem(CACHE_INFO_KEY);
  if (!raw) {
    const data = await readAllConfig();
    return writeCacheInfo(data);
  }
  return JSON.parse(raw);
}
