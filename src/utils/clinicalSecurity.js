// Validaciones puras y reutilizables para datos clínicos de la Actividad 09.
const MAX_CLINICAL_TEXT = 2000;

function isPositiveInteger(value) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0;
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateClinicalContext(idAtencion, idExp) {
  if (!isPositiveInteger(idAtencion) || !isPositiveInteger(idExp)) {
    return { ok: false, error: 'La atención o el expediente no son válidos.' };
  }
  return { ok: true };
}

function getSafeClinicalError(error, fallback = 'No fue posible guardar la información.') {
  const status = error?.response?.status;
  if (status === 401) return 'La sesión expiró. Inicia sesión nuevamente.';
  if (status === 403) return 'No tienes permiso para realizar esta operación.';
  if (status === 409) return 'El registro cambió. Actualiza la pantalla e inténtalo de nuevo.';
  if (status === 422) return 'La información clínica no es válida.';
  if (status === 429) return 'Se realizaron demasiados intentos. Espera un momento.';
  return fallback;
}

function validateClinicalHistory({ id_atencion, Id_exp, formData = {} }) {
  const context = validateClinicalContext(id_atencion, Id_exp);
  if (!context.ok) return context;

  const reason = cleanText(formData.motivo_consulta);
  if (reason.length < 3 || reason.length > 500) {
    return { ok: false, error: 'El motivo de consulta debe tener entre 3 y 500 caracteres.' };
  }

  const longFields = [
    'sintomatologia_otros', 'heredo_otros', 'nopat_otros',
    'pat_enfermedades', 'pat_medicamentos', 'pat_alergias',
    'pat_oculares', 'pat_cirugias',
  ];
  if (longFields.some((field) => cleanText(formData[field]).length > MAX_CLINICAL_TEXT)) {
    return { ok: false, error: 'Los campos clínicos no pueden exceder 2000 caracteres.' };
  }

  const asList = (value) => Array.isArray(value) ? value : [];
  return {
    ok: true,
    data: {
      ...formData,
      motivo_consulta: reason,
      sintomatologia: asList(formData.sintomatologia).join(','),
      heredo: asList(formData.heredo).join(','),
      nopat: asList(formData.nopat).join(','),
      ...Object.fromEntries(longFields.map((field) => [field, cleanText(formData[field])])),
    },
  };
}

module.exports = {
  getSafeClinicalError,
  isPositiveInteger,
  validateClinicalContext,
  validateClinicalHistory,
};
