// Reglas compartidas por el formulario y las pruebas de la Actividad 15.
function validateService(form = {}) {
  const key = String(form.serv_cve ?? '').trim().toUpperCase();
  const description = String(form.serv_desc ?? '').trim();
  if (!key || !description || String(form.serv_costo ?? '').trim() === '') {
    return { ok: false, error: 'Completa la clave, descripción y costo del servicio.' };
  }
  if (key.length > 40 || description.length > 250) {
    return { ok: false, error: 'La clave admite 40 caracteres y la descripción 250.' };
  }
  const cost = Number(form.serv_costo);
  const tax = Number(form.iva ?? 16);
  const type = Number(form.tipo);
  if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(tax) || tax < 0 || tax > 100) {
    return { ok: false, error: 'El costo debe ser un número positivo o cero y el IVA debe estar entre 0 y 100.' };
  }
  if (!Number.isInteger(type) || type < 1 || type > 5) {
    return { ok: false, error: 'Selecciona un tipo de servicio válido.' };
  }
  return { ok: true, data: { ...form, serv_cve: key, serv_desc: description, serv_costo: cost, tipo: type, iva: tax } };
}

function safeServiceError(error, fallback = 'No fue posible completar la operación.') {
  const status = error?.response?.status;
  if (status === 401) return 'La sesión expiró. Inicia sesión nuevamente.';
  if (status === 403) return 'No tienes permiso para realizar esta operación.';
  if (status === 400 || status === 422) return 'Revisa los datos. La clave puede estar registrada o algún campo no es válido.';
  if (status === 429) return 'Espera un momento antes de volver a intentar.';
  if (!error?.response) return 'No hay conexión con el servidor. Verifica tu conexión e inténtalo de nuevo.';
  return fallback;
}

module.exports = { validateService, safeServiceError };
