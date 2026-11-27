export const chargeQuantity = (value) => {
  const number = Number(value);
  return typeof value !== 'boolean' && Number.isSafeInteger(number) && number > 0 ? number : null;
};

export const patientValidationMessage = (form) => {
  if (['curp', 'papell', 'nom_pac', 'fecnac'].some((key) => typeof form[key] !== 'string' || !form[key].trim())) {
    return 'Completa CURP, primer apellido, nombre y fecha de nacimiento.';
  }
  const date = new Date(`${form.fecnac}T12:00:00`);
  const today = new Date();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.fecnac) || !Number.isFinite(date.getTime()) ||
      date.getFullYear() !== Number(form.fecnac.slice(0, 4)) ||
      date.getMonth() + 1 !== Number(form.fecnac.slice(5, 7)) ||
      date.getDate() !== Number(form.fecnac.slice(8, 10)) ||
      form.fecnac > `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`) {
    return 'Selecciona una fecha de nacimiento válida que no sea futura.';
  }
  return '';
};

export const adminErrorMessage = (error) => {
  if (['ECONNABORTED', 'ETIMEDOUT'].includes(error?.code)) {
    return 'El servidor tardó demasiado en responder. Vuelve a intentarlo.';
  }
  if (!error?.response) return 'No se pudo establecer conexión con el servidor. Revisa tu conexión y vuelve a intentarlo.';
  const status = error.response.status;
  if (status === 401) return 'Tu sesión terminó. Inicia sesión nuevamente.';
  if (status === 403) return 'No tienes permiso para realizar esta acción.';
  if (status === 404) return 'No se encontró la información solicitada. Actualiza e intenta nuevamente.';
  if (status >= 500) return 'El servicio no está disponible en este momento. Intenta nuevamente más tarde.';
  const message = error.response.data?.error;
  if ([400, 409, 422].includes(status) && typeof message === 'string' && message.length <= 250 &&
      !/traceback|exception|mongodb|password|token|secret|<[^>]+>/i.test(message)) return message;
  return 'No se pudo completar la operación. Intenta nuevamente.';
};
