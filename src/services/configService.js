import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ineo_config_module';

const defaultData = {
  camas: [
    { id: 'C-101', nombre: 'Cama 101', area: 'Hospitalización', estado: 'Disponible', tipo: 'General' },
    { id: 'C-102', nombre: 'Cama 102', area: 'Urgencias', estado: 'Ocupada', tipo: 'Observación' },
  ],
  servicios: [
    { id: 'S-001', clave: 'CONS-GEN', descripcion: 'Consulta general', costo: '500', tipo: 'Consulta', unidad: 'Servicio' },
    { id: 'S-002', clave: 'LAB-BAS', descripcion: 'Laboratorio básico', costo: '350', tipo: 'Laboratorio', unidad: 'Estudio' },
  ],
  usuarios: [
    { id: 'U-001', nombre: 'Administrador', usuario: 'admin', rol: 'admin', activo: true },
    { id: 'U-002', nombre: 'Médico General', usuario: 'medico', rol: 'medico', activo: true },
  ],
  automatizacion: {
    respaldosAutomaticos: true,
    horaRespaldo: '22:00',
    limpiarTemporales: true,
    diasRetencion: '30',
  },
  general: {
    nombreClinica: 'INEO Hospital',
    telefono: '722 000 0000',
    direccion: 'Toluca, México',
    moneda: 'MXN',
    tema: 'Morado',
  },
  respaldos: [
    { id: 'B-001', nombre: 'respaldo_inicial.json', fecha: new Date().toISOString(), tipo: 'Manual' },
  ],
};

async function readAll() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return defaultData;
  }
  return { ...defaultData, ...JSON.parse(raw) };
}

async function saveAll(data) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

export async function getConfigSection(section) {
  const data = await readAll();
  return data[section];
}

export async function saveConfigSection(section, value) {
  const data = await readAll();
  data[section] = value;
  await saveAll(data);
  return value;
}

export async function addConfigItem(section, item) {
  const data = await readAll();
  const list = Array.isArray(data[section]) ? data[section] : [];
  data[section] = [{ ...item, id: item.id || `${Date.now()}` }, ...list];
  await saveAll(data);
  return data[section];
}

export async function updateConfigItem(section, id, changes) {
  const data = await readAll();
  data[section] = (data[section] || []).map((item) =>
    item.id === id ? { ...item, ...changes } : item
  );
  await saveAll(data);
  return data[section];
}

export async function deleteConfigItem(section, id) {
  const data = await readAll();
  data[section] = (data[section] || []).filter((item) => item.id !== id);
  await saveAll(data);
  return data[section];
}

export async function createBackup() {
  const data = await readAll();
  const backup = {
    id: `B-${Date.now()}`,
    nombre: `respaldo_${new Date().toISOString().slice(0, 10)}.json`,
    fecha: new Date().toISOString(),
    tipo: 'Manual',
  };
  data.respaldos = [backup, ...(data.respaldos || [])];
  await saveAll(data);
  return data.respaldos;
}

export async function resetConfigData() {
  await saveAll(defaultData);
  return defaultData;
}
