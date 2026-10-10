import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import api, { API_URL } from './api';
import { getToken } from './secureStorage';

function normalizeEndpoint(endpoint) {
  if (typeof endpoint !== 'string' || !endpoint.startsWith('/')) {
    throw new Error('Ruta de descarga inválida');
  }
  return endpoint.startsWith('/api/v1')
    ? endpoint.replace(/^\/api\/v1/, '')
    : endpoint;
}

function safeFilename(filename = 'documento.pdf') {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

export async function downloadAuthenticatedFile(
  endpoint,
  filename,
  mimeType = 'application/pdf',
) {
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const normalizedFilename = safeFilename(filename);

  if (Platform.OS === 'web') {
    const response = await api.get(normalizedEndpoint, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = normalizedFilename;
    anchor.rel = 'noopener';
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }

  const token = await getToken();
  if (!token) {
    throw new Error('Sesión expirada');
  }

  const result = await FileSystem.downloadAsync(
    `${API_URL}${normalizedEndpoint}`,
    `${FileSystem.cacheDirectory}${normalizedFilename}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (result.status < 200 || result.status >= 300) {
    await FileSystem.deleteAsync(result.uri, { idempotent: true });
    throw new Error('No fue posible descargar el documento');
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('El dispositivo no permite compartir el documento');
  }

  await Sharing.shareAsync(result.uri, {
    mimeType,
    dialogTitle: 'Guardar o compartir documento INEO',
  });
}
