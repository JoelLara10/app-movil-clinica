const MAX_NOTE_LENGTH = 5000;

function validateNursingNote(value) {
  if (typeof value !== 'string' || !value.trim()) return { ok: false, key: 'required' };
  if (value.trim().length > MAX_NOTE_LENGTH) return { ok: false, key: 'tooLong' };
  return { ok: true, data: { nota_enfermeria: value.trim() } };
}

function nursingSyncError(error) {
  const status = error.response?.status;
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 400 || status === 422) return 'invalid';
  if (status === 404) return 'notFound';
  return status ? 'serverError' : 'connectionError';
}

module.exports = { MAX_NOTE_LENGTH, validateNursingNote, nursingSyncError };
