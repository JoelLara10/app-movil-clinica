import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import api from './api';
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

function arrayBufferToBase64(value) {
  const bytes = value instanceof ArrayBuffer
    ? new Uint8Array(value)
    : ArrayBuffer.isView(value)
      ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
      : new Uint8Array(value || []);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const hasSecond = index + 1 < bytes.length;
    const hasThird = index + 2 < bytes.length;
    const block = (bytes[index] << 16)
      | ((hasSecond ? bytes[index + 1] : 0) << 8)
      | (hasThird ? bytes[index + 2] : 0);
    output += alphabet[(block >> 18) & 63];
    output += alphabet[(block >> 12) & 63];
    output += hasSecond ? alphabet[(block >> 6) & 63] : '=';
    output += hasThird ? alphabet[block & 63] : '=';
  }

  return output;
}

function addPdfToken(endpoint, token) {
  if (!endpoint.startsWith('/pdf/') || /[?&]token=/.test(endpoint)) {
    return endpoint;
  }
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${separator}token=${encodeURIComponent(token)}`;
}

export async function downloadAuthenticatedFile(
  endpoint,
  filename,
  mimeType = 'application/pdf',
) {
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const normalizedFilename = safeFilename(filename);
  const token = await getToken();
  if (!token) {
    throw new Error('Sesión expirada');
  }
  // Los endpoints PDF heredados reciben el token y la atención como parámetros
  // de consulta; se conserva el encabezado Bearer para las descargas normales.
  const downloadEndpoint = addPdfToken(normalizedEndpoint, token);

  if (Platform.OS === 'web') {
    const response = await api.get(downloadEndpoint, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = normalizedFilename;
    anchor.rel = 'noopener';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  const destination = `${FileSystem.cacheDirectory}${normalizedFilename}`;
  await FileSystem.deleteAsync(destination, { idempotent: true });

  // Usa el mismo cliente autenticado que consulta resultados y la versión web.
  // Así se conserva el interceptor Bearer y se evita una segunda ruta de descarga
  // con diferencias de URL o encabezados entre Android, iOS y web.
  const response = await api.get(downloadEndpoint, { responseType: 'arraybuffer' });
  const base64 = arrayBufferToBase64(response.data);
  if (!base64) {
    throw new Error('El documento descargado está vacío');
  }

  await FileSystem.writeAsStringAsync(destination, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (!(await Sharing.isAvailableAsync())) {
    await FileSystem.deleteAsync(destination, { idempotent: true });
    throw new Error('El dispositivo no permite compartir el documento');
  }

  await Sharing.shareAsync(destination, {
    mimeType,
    dialogTitle: 'Guardar o compartir documento OftalCore',
  });
}
